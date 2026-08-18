"""Assignments, student progress, and reading logs.
"""

from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, selectinload

from models import (
    STATUS_COMPLETED,
    STATUS_IN_PROGRESS,
    STATUS_NOT_STARTED,
    STATUSES,
    Assignment,
    AssignmentStatus,
    Book,
    Class,
    ReadingLog,
    Student,
    StudentEnrollment,
    db,
)
from services.exceptions import NotFoundError, ValidationError

MAX_SESSION_MINUTES = 600


def _utc_day(value):
    """Midnight UTC for this datetime.

    If it has no timezone, treat it as UTC.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _today():
    return _utc_day(datetime.now(timezone.utc))


class AssignmentService:
    # ------------------------------------------------------------------
    # Permission checks
    # ------------------------------------------------------------------

    @staticmethod
    def _require_class_owner(teacher, class_id):
        class_ = db.session.get(Class, class_id)
        if not class_ or class_.teacher_id != teacher.id:
            raise NotFoundError("Class not found")
        return class_

    @staticmethod
    def _require_enrolled_assignment(student, assignment_id):
        """Return this assignment if the student is in its class.

        If they aren't, raise NotFoundError so they can't tell whether
        assignments in other classes exist.
        """
        assignment = db.session.get(Assignment, assignment_id)
        if not assignment:
            raise NotFoundError("Assignment not found")

        enrolled = StudentEnrollment.query.filter_by(
            student_id=student.id, class_id=assignment.class_id
        ).first()
        if not enrolled:
            raise NotFoundError("Assignment not found")

        return assignment

    # ------------------------------------------------------------------
    # Progress rows
    # ------------------------------------------------------------------

    @staticmethod
    def ensure_statuses(class_id, student_ids, assignment_ids=None):
        """Give each student a not-started row if they don't have one.

        Does not save. The caller commits.
        """
        if not student_ids:
            return

        if assignment_ids is None:
            assignment_ids = [
                row.id
                for row in db.session.query(Assignment.id)
                .filter_by(class_id=class_id)
                .all()
            ]
        if not assignment_ids:
            return

        existing = db.session.query(
            AssignmentStatus.assignment_id, AssignmentStatus.student_id
        ).filter(
            AssignmentStatus.assignment_id.in_(assignment_ids),
            AssignmentStatus.student_id.in_(student_ids),
        )
        have = set(existing.all())

        db.session.add_all(
            AssignmentStatus(
                assignment_id=assignment_id,
                student_id=student_id,
                status=STATUS_NOT_STARTED,
            )
            for assignment_id in assignment_ids
            for student_id in student_ids
            if (assignment_id, student_id) not in have
        )

    @staticmethod
    def _get_or_create_status(
        assignment_id, student_id, default=STATUS_NOT_STARTED
    ):
        """Get this student's progress row.

        Creates one if they joined the class after the assignment was made.
        """
        record = AssignmentStatus.query.filter_by(
            assignment_id=assignment_id, student_id=student_id
        ).first()
        if not record:
            record = AssignmentStatus(
                assignment_id=assignment_id,
                student_id=student_id,
                status=default,
            )
            db.session.add(record)
            db.session.flush()
        return record

    @staticmethod
    def _statuses_by_assignment(assignment_ids):
        """Load progress rows for these assignments, grouped by assignment."""
        grouped = {assignment_id: [] for assignment_id in assignment_ids}
        if not assignment_ids:
            return grouped

        records = AssignmentStatus.query.filter(
            AssignmentStatus.assignment_id.in_(assignment_ids)
        ).all()
        for record in records:
            grouped[record.assignment_id].append(record)
        return grouped

    # ------------------------------------------------------------------
    # Student views
    # ------------------------------------------------------------------

    @staticmethod
    def list_student_assignments(student):
        """Every assignment in this student's classes, soonest due first.

        If they joined late and have no progress row yet, they still see
        the assignment as not started.
        """
        class_ids = [
            row.class_id
            for row in db.session.query(StudentEnrollment.class_id)
            .filter_by(student_id=student.id)
            .all()
        ]
        if not class_ids:
            return []

        assignments = (
            Assignment.query.options(
                joinedload(Assignment.class_),
                joinedload(Assignment.book),
            )
            .filter(Assignment.class_id.in_(class_ids))
            .order_by(Assignment.due_date.asc())
            .all()
        )
        if not assignments:
            return []

        statuses = (
            AssignmentStatus.query.options(
                selectinload(AssignmentStatus.reading_logs)
            )
            .filter(
                AssignmentStatus.student_id == student.id,
                AssignmentStatus.assignment_id.in_(
                    [a.id for a in assignments]
                ),
            )
            .all()
        )
        by_assignment = {record.assignment_id: record for record in statuses}

        results = []
        for assignment in assignments:
            record = by_assignment.get(assignment.id)
            results.append(
                {
                    **assignment.to_dict(),
                    "status": (
                        record.to_dict()
                        if record
                        else {
                            "status": STATUS_NOT_STARTED,
                            "total_minutes": 0,
                            "completed_at": None,
                            "updated_at": None,
                        }
                    ),
                }
            )
        return results

    @staticmethod
    def get_student_assignment(student, assignment_id):
        assignment = AssignmentService._require_enrolled_assignment(
            student, assignment_id
        )
        record = (
            AssignmentStatus.query.options(
                selectinload(AssignmentStatus.reading_logs)
            )
            .filter_by(assignment_id=assignment.id, student_id=student.id)
            .first()
        )
        if not record:
            record = AssignmentService._get_or_create_status(
                assignment.id, student.id
            )
            db.session.commit()

        return {
            "assignment": assignment.to_dict(),
            "status": record.to_dict(include_logs=True),
        }

    # ------------------------------------------------------------------
    # Teacher views
    # ------------------------------------------------------------------

    @staticmethod
    def list_teacher_assignments(teacher):
        assignments = (
            Assignment.query.options(
                joinedload(Assignment.class_),
                joinedload(Assignment.book),
            )
            .join(Class)
            .filter(Class.teacher_id == teacher.id)
            .order_by(Assignment.due_date.asc())
            .all()
        )
        return [assignment.to_dict() for assignment in assignments]

    @staticmethod
    def class_summary_stats(class_ids):
        """Open-assignment and behind-student counts for each class.

        Counted in the database so the class list doesn't query once per
        class.
        """
        summary = {
            class_id: {"active_assignment_count": 0, "students_behind": 0}
            for class_id in class_ids
        }
        if not class_ids:
            return summary

        # Still open until every student has finished it.
        active_rows = (
            db.session.query(
                Assignment.class_id,
                func.count(func.distinct(Assignment.id)),
            )
            .outerjoin(
                AssignmentStatus,
                AssignmentStatus.assignment_id == Assignment.id,
            )
            .filter(Assignment.class_id.in_(class_ids))
            .filter(
                or_(
                    AssignmentStatus.id.is_(None),
                    AssignmentStatus.status != STATUS_COMPLETED,
                )
            )
            .group_by(Assignment.class_id)
            .all()
        )
        for class_id, count in active_rows:
            summary[class_id]["active_assignment_count"] = count

        behind_rows = (
            db.session.query(
                Assignment.class_id,
                func.count(func.distinct(AssignmentStatus.student_id)),
            )
            .join(
                AssignmentStatus,
                AssignmentStatus.assignment_id == Assignment.id,
            )
            .filter(Assignment.class_id.in_(class_ids))
            .filter(AssignmentStatus.status != STATUS_COMPLETED)
            .filter(Assignment.due_date < _today())
            .group_by(Assignment.class_id)
            .all()
        )
        for class_id, count in behind_rows:
            summary[class_id]["students_behind"] = count

        return summary

    @staticmethod
    def list_class_assignments(teacher, class_id):
        """This class's assignments, each with a short per-student status."""
        AssignmentService._require_class_owner(teacher, class_id)

        assignments = (
            Assignment.query.options(
                joinedload(Assignment.class_),
                joinedload(Assignment.book),
            )
            .filter_by(class_id=class_id)
            .order_by(Assignment.due_date.asc())
            .all()
        )
        statuses = AssignmentService._statuses_by_assignment(
            [assignment.id for assignment in assignments]
        )
        return [
            {
                "assignment": assignment.to_dict(),
                "progress": [
                    {
                        "student_id": record.student_id,
                        "status": record.status,
                        "completed_at": (
                            record.completed_at.isoformat()
                            if record.completed_at
                            else None
                        ),
                    }
                    for record in statuses[assignment.id]
                ],
            }
            for assignment in assignments
        ]

    @staticmethod
    def get_assignment_progress(teacher, assignment_id, include_logs=False):
        assignment = (
            Assignment.query.options(joinedload(Assignment.class_))
            .filter_by(id=assignment_id)
            .first()
        )
        if not assignment or assignment.class_.teacher_id != teacher.id:
            raise NotFoundError("Assignment not found")

        options = [
            joinedload(AssignmentStatus.student).joinedload(Student.user)
        ]
        if include_logs:
            options.append(selectinload(AssignmentStatus.reading_logs))

        records = (
            AssignmentStatus.query.options(*options)
            .filter_by(assignment_id=assignment_id)
            .all()
        )
        return {
            "assignment": assignment.to_dict(),
            "progress": [
                {
                    **record.to_dict(include_logs=include_logs),
                    "student": record.student.to_dict()
                    if record.student
                    else None,
                }
                for record in records
            ],
        }

    @staticmethod
    def students_with_activity(class_id):
        """Students in this class who have started or logged reading.

        Used to warn before removing someone from the roster.
        """
        rows = (
            db.session.query(AssignmentStatus.student_id)
            .join(Assignment, Assignment.id == AssignmentStatus.assignment_id)
            .outerjoin(
                ReadingLog,
                ReadingLog.assignment_status_id == AssignmentStatus.id,
            )
            .filter(Assignment.class_id == class_id)
            .filter(
                or_(
                    AssignmentStatus.status != STATUS_NOT_STARTED,
                    AssignmentStatus.completed_at.isnot(None),
                    ReadingLog.id.isnot(None),
                )
            )
            .distinct()
            .all()
        )
        return {row.student_id for row in rows}

    @staticmethod
    def list_student_reading_logs(teacher, student_id, class_id):
        """Reading sessions for one student in one class, by assignment."""
        AssignmentService._require_class_owner(teacher, class_id)

        enrolled = StudentEnrollment.query.filter_by(
            student_id=student_id, class_id=class_id
        ).first()
        if not enrolled:
            raise NotFoundError("Student not found in this class")

        records = (
            AssignmentStatus.query.options(
                selectinload(AssignmentStatus.reading_logs),
                joinedload(AssignmentStatus.assignment).joinedload(
                    Assignment.book
                ),
            )
            .join(Assignment)
            .filter(
                Assignment.class_id == class_id,
                AssignmentStatus.student_id == student_id,
            )
            .order_by(Assignment.due_date.asc())
            .all()
        )

        groups = []
        for record in records:
            if not record.reading_logs:
                continue
            assignment = record.assignment
            groups.append(
                {
                    "assignment": {
                        "id": assignment.id,
                        "name": assignment.name,
                        "due_date": (
                            assignment.due_date.isoformat()
                            if assignment.due_date
                            else None
                        ),
                        "book": assignment.book.to_dict()
                        if assignment.book
                        else None,
                    },
                    "logs": [log.to_dict() for log in record.reading_logs],
                }
            )
        return groups

    # ------------------------------------------------------------------
    # Create and update
    # ------------------------------------------------------------------

    @staticmethod
    def create_assignment(teacher, class_id, book_id, due_date, name):
        AssignmentService._require_class_owner(teacher, class_id)

        book = Book.query.filter_by(id=book_id, is_active=True).first()
        if not book:
            raise NotFoundError("Book not found")

        if not name or not name.strip():
            raise ValidationError("name is required")

        try:
            parsed_due_date = datetime.fromisoformat(
                due_date.replace("Z", "+00:00")
            )
        except (AttributeError, TypeError, ValueError):
            raise ValidationError("Invalid due_date") from None
        if parsed_due_date.tzinfo is None:
            parsed_due_date = parsed_due_date.replace(tzinfo=timezone.utc)

        assignment = Assignment(
            class_id=class_id,
            book_id=book_id,
            name=name.strip(),
            due_date=parsed_due_date,
        )
        db.session.add(assignment)
        db.session.flush()

        student_ids = [
            row.student_id
            for row in db.session.query(StudentEnrollment.student_id)
            .filter_by(class_id=class_id)
            .all()
        ]
        AssignmentService.ensure_statuses(
            class_id, student_ids, assignment_ids=[assignment.id]
        )

        db.session.commit()
        return assignment

    @staticmethod
    def update_status(student, assignment_id, status):
        if status not in STATUSES:
            raise ValidationError(
                f"Invalid status. Allowed: {', '.join(STATUSES)}"
            )

        assignment = AssignmentService._require_enrolled_assignment(
            student, assignment_id
        )
        record = AssignmentService._get_or_create_status(
            assignment.id, student.id
        )

        record.status = status
        record.completed_at = (
            datetime.now(timezone.utc) if status == STATUS_COMPLETED else None
        )

        db.session.commit()
        return record

    @staticmethod
    def log_reading(
        student, assignment_id, minutes, stopped_at=None, notes=None
    ):
        if not isinstance(minutes, int) or isinstance(minutes, bool):
            raise ValidationError("minutes must be an integer")
        if minutes <= 0 or minutes > MAX_SESSION_MINUTES:
            raise ValidationError(
                f"minutes must be between 1 and {MAX_SESSION_MINUTES}"
            )

        assignment = AssignmentService._require_enrolled_assignment(
            student, assignment_id
        )
        record = AssignmentService._get_or_create_status(
            assignment.id, student.id, default=STATUS_IN_PROGRESS
        )
        # Logging minutes is what marks work in progress. Students don't
        # flip that status themselves.
        if record.status == STATUS_NOT_STARTED:
            record.status = STATUS_IN_PROGRESS

        log = ReadingLog(
            assignment_status_id=record.id,
            minutes=minutes,
            stopped_at=(stopped_at or "").strip() or None,
            notes=(notes or "").strip() or None,
        )
        db.session.add(log)
        db.session.commit()
        return log
