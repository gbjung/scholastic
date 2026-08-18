"""
Class management. This module handles class creation, retrieval, and
update.
"""

from sqlalchemy import func
from sqlalchemy.orm import joinedload

from models import Class, Student, StudentEnrollment, db
from services.assignments import AssignmentService
from services.exceptions import NotFoundError, ValidationError


def _class_signal(active_count, students_behind):
    """The status pill on a class card (assign, behind, or on track)."""
    if active_count == 0:
        return {"type": "assign", "label": "Assign a book"}
    if students_behind > 0:
        noun = "student" if students_behind == 1 else "students"
        return {
            "type": "behind",
            "label": f"{students_behind} {noun} behind",
            "count": students_behind,
        }
    return {"type": "on_track", "label": "Everyone on track"}


class ClassService:
    # ------------------------------------------------------------------
    # Permission checks and shared lookups
    # ------------------------------------------------------------------

    @staticmethod
    def _require_owner(teacher, class_id):
        """Return this class if the teacher owns it."""
        class_ = db.session.get(Class, class_id)
        if not class_ or class_.teacher_id != teacher.id:
            raise NotFoundError("Class not found")
        return class_

    @staticmethod
    def _student_counts(class_ids):
        """How many students are in each class, in one query."""
        counts = {class_id: 0 for class_id in class_ids}
        if not class_ids:
            return counts

        rows = (
            db.session.query(
                StudentEnrollment.class_id,
                func.count(StudentEnrollment.id),
            )
            .filter(StudentEnrollment.class_id.in_(class_ids))
            .group_by(StudentEnrollment.class_id)
            .all()
        )
        for class_id, count in rows:
            counts[class_id] = count
        return counts

    @staticmethod
    def _enrolled_students(class_id):
        """Students in this class, sorted by last name then first name.

        Call this after confirming the teacher owns the class.
        """
        enrollments = (
            StudentEnrollment.query.options(
                joinedload(StudentEnrollment.student).joinedload(Student.user)
            )
            .filter_by(class_id=class_id)
            .all()
        )
        students = [e.student for e in enrollments if e.student]
        return sorted(
            students, key=lambda s: (s.last_name or "", s.first_name or "")
        )

    # ------------------------------------------------------------------
    # Fetch
    # ------------------------------------------------------------------

    @staticmethod
    def list_classes(teacher):
        """This teacher's classes, with the counts shown on the class list."""
        classes = (
            Class.query.filter_by(teacher_id=teacher.id)
            .order_by(Class.name)
            .all()
        )
        if not classes:
            return []

        class_ids = [class_.id for class_ in classes]
        student_counts = ClassService._student_counts(class_ids)
        assignment_stats = AssignmentService.class_summary_stats(class_ids)

        summaries = []
        for class_ in classes:
            stats = assignment_stats[class_.id]
            active_count = stats["active_assignment_count"]
            students_behind = stats["students_behind"]
            summaries.append(
                {
                    **class_.to_dict(student_count=student_counts[class_.id]),
                    "active_assignment_count": active_count,
                    "students_behind": students_behind,
                    "signal": _class_signal(active_count, students_behind),
                }
            )
        return summaries

    @staticmethod
    def get_class(teacher, class_id):
        """The class record, or not-found if this teacher doesn't own it."""
        return ClassService._require_owner(teacher, class_id)

    @staticmethod
    def get_class_detail(teacher, class_id):
        """Class info and student names.

        Whether a student has reading history is loaded on the manage-roster
        screen, not here.
        """
        class_ = ClassService._require_owner(teacher, class_id)
        students = ClassService._enrolled_students(class_id)
        return {
            **class_.to_dict(student_count=len(students)),
            "students": [student.to_dict() for student in students],
        }

    @staticmethod
    def list_roster(teacher, class_id, include_activity=False):
        ClassService._require_owner(teacher, class_id)
        students = ClassService._enrolled_students(class_id)
        if not include_activity:
            return students

        active_ids = AssignmentService.students_with_activity(class_id)
        return [
            {
                **student.to_dict(),
                "has_reading_history": student.id in active_ids,
            }
            for student in students
        ]

    # ------------------------------------------------------------------
    # Create and update
    # ------------------------------------------------------------------

    @staticmethod
    def create_class(teacher, name, subject=None, student_ids=None):
        """Create a class and optionally add students, then save once."""
        if not name or not name.strip():
            raise ValidationError("name is required")

        class_ = Class(
            teacher_id=teacher.id,
            name=name.strip(),
            subject=(subject or "").strip() or None,
        )
        db.session.add(class_)
        db.session.flush()

        if student_ids:
            ClassService._add_enrollments(
                class_.id, ClassService._validate_students(student_ids)
            )

        db.session.commit()
        return class_

    @staticmethod
    def update_students(teacher, class_id, add=None, remove=None):
        """Add and remove students, then return the new roster.

        Removing someone only unenrolls them. Their progress and reading
        logs stay so history isn't wiped. Teacher screens only show
        students who are still in the class.
        """
        ClassService._require_owner(teacher, class_id)

        add_ids = ClassService._validate_students(add)
        remove_ids = list(dict.fromkeys(remove or []))
        overlap = set(add_ids) & set(remove_ids)
        if overlap:
            raise ValidationError(
                "A student cannot be added and removed in the same request"
            )

        lookup_ids = [*add_ids, *remove_ids]
        existing_by_student = {}
        if lookup_ids:
            existing = StudentEnrollment.query.filter(
                StudentEnrollment.class_id == class_id,
                StudentEnrollment.student_id.in_(lookup_ids),
            ).all()
            existing_by_student = {e.student_id: e for e in existing}

        newly_enrolled = ClassService._add_enrollments(
            class_id,
            [sid for sid in add_ids if sid not in existing_by_student],
        )

        for student_id in remove_ids:
            enrollment = existing_by_student.get(student_id)
            if enrollment:
                db.session.delete(enrollment)

        AssignmentService.ensure_statuses(class_id, newly_enrolled)
        db.session.commit()
        return ClassService._enrolled_students(class_id)

    # ------------------------------------------------------------------
    # Enrollment helpers (do not save)
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_students(student_ids):
        """Drop duplicate ids and make sure every student exists.

        Keeps the original order.
        """
        ids = list(dict.fromkeys(student_ids or []))
        if not ids:
            return []

        found = {
            row.id
            for row in db.session.query(Student.id)
            .filter(Student.id.in_(ids))
            .all()
        }
        missing = [sid for sid in ids if sid not in found]
        if missing:
            raise NotFoundError(f"Student not found: {', '.join(missing)}")
        return ids

    @staticmethod
    def _add_enrollments(class_id, student_ids):
        """Enroll these students. Returns the ids that were added."""
        db.session.add_all(
            StudentEnrollment(student_id=student_id, class_id=class_id)
            for student_id in student_ids
        )
        return list(student_ids)
