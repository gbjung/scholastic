import uuid
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


ROLES = ("student", "teacher")

STATUS_NOT_STARTED = "not_started"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUSES = (STATUS_NOT_STARTED, STATUS_IN_PROGRESS, STATUS_COMPLETED)


def _in_clause(column, values):
    joined = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({joined})"


class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now(),
    )

    __table_args__ = (
        db.CheckConstraint(_in_clause("role", ROLES), name="ck_user_role"),
    )

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)


class Teacher(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))

    user = db.relationship(
        "User", backref=db.backref("teacher_profile", uselist=False)
    )

    @property
    def full_name(self):
        return " ".join(p for p in (self.first_name, self.last_name) if p)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.user.email,
        }


class Student(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    user_id = db.Column(
        db.String(36),
        db.ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))

    user = db.relationship(
        "User", backref=db.backref("student_profile", uselist=False)
    )

    @property
    def full_name(self):
        return " ".join(p for p in (self.first_name, self.last_name) if p)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.user.email,
        }


class Book(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200))
    isbn = db.Column(db.String(20), unique=True)
    cover_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    content_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "author": self.author,
            "isbn": self.isbn,
            "cover_url": self.cover_url,
            "description": self.description,
            "content_url": self.content_url,
            "is_active": self.is_active,
        }


class Class(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    teacher_id = db.Column(
        db.String(36), db.ForeignKey("teacher.id"), nullable=False, index=True
    )
    name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(100))

    teacher = db.relationship("Teacher", backref="classes")

    def to_dict(self, student_count=None):
        payload = {
            "id": self.id,
            "teacher_id": self.teacher_id,
            "name": self.name,
            "subject": self.subject,
        }
        if student_count is not None:
            payload["student_count"] = student_count
        return payload


class StudentEnrollment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    student_id = db.Column(
        db.String(36),
        db.ForeignKey("student.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    class_id = db.Column(
        db.String(36),
        db.ForeignKey("class.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    enrolled_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now(),
    )

    student = db.relationship(
        "Student",
        backref=db.backref(
            "enrollments", cascade="all, delete-orphan", passive_deletes=True
        ),
    )
    class_ = db.relationship(
        "Class",
        backref=db.backref(
            "enrollments", cascade="all, delete-orphan", passive_deletes=True
        ),
    )

    __table_args__ = (
        db.UniqueConstraint(
            "student_id", "class_id", name="uq_enrollment_student_class"
        ),
    )


class Assignment(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    class_id = db.Column(
        db.String(36),
        db.ForeignKey("class.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    book_id = db.Column(
        db.String(36), db.ForeignKey("book.id"), nullable=False
    )
    name = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now(),
    )

    class_ = db.relationship(
        "Class",
        backref=db.backref(
            "assignments", cascade="all, delete-orphan", passive_deletes=True
        ),
    )
    book = db.relationship("Book", backref="assignments")
    statuses = db.relationship(
        "AssignmentStatus",
        backref="assignment",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    @property
    def teacher_id(self):
        # Teachers own classes, not assignments. Read the teacher from the
        # class so we don't store a second copy that could get out of date.
        return self.class_.teacher_id if self.class_ else None

    @property
    def is_overdue(self):
        return self.due_date < _now()

    def to_dict(self):
        return {
            "id": self.id,
            "class_id": self.class_id,
            "teacher_id": self.teacher_id,
            "book_id": self.book_id,
            "name": self.name,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat()
            if self.created_at
            else None,
            "class": self.class_.to_dict() if self.class_ else None,
            "book": self.book.to_dict() if self.book else None,
        }


class AssignmentStatus(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    assignment_id = db.Column(
        db.String(36),
        db.ForeignKey("assignment.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id = db.Column(
        db.String(36),
        db.ForeignKey("student.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = db.Column(
        db.String(20), nullable=False, default=STATUS_NOT_STARTED
    )
    completed_at = db.Column(db.DateTime(timezone=True))
    teacher_feedback = db.Column(db.Text)

    student = db.relationship("Student", backref="assignment_statuses")
    reading_logs = db.relationship(
        "ReadingLog",
        backref="assignment_status",
        order_by="ReadingLog.logged_at.desc()",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "assignment_id", "student_id", name="uq_status_assignment_student"
        ),
        db.CheckConstraint(
            _in_clause("status", STATUSES), name="ck_status_value"
        ),
    )

    @property
    def total_minutes(self):
        return sum(log.minutes for log in self.reading_logs)

    @property
    def updated_at(self):
        timestamps = [
            log.logged_at for log in self.reading_logs if log.logged_at
        ]
        if self.completed_at:
            timestamps.append(self.completed_at)
        return max(timestamps) if timestamps else None

    def to_dict(self, include_logs=False):
        data = {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "student_id": self.student_id,
            "status": self.status,
            "total_minutes": self.total_minutes,
            "completed_at": self.completed_at.isoformat()
            if self.completed_at
            else None,
            "updated_at": self.updated_at.isoformat()
            if self.updated_at
            else None,
            "teacher_feedback": self.teacher_feedback,
        }
        if include_logs:
            data["reading_logs"] = [log.to_dict() for log in self.reading_logs]
        return data


class ReadingLog(db.Model):
    __tablename__ = "reading_log"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    assignment_status_id = db.Column(
        db.String(36),
        db.ForeignKey("assignment_status.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    minutes = db.Column(db.Integer, nullable=False)
    stopped_at = db.Column(db.String(120), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    logged_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=db.func.now(),
    )

    __table_args__ = (
        db.CheckConstraint(
            "minutes > 0 AND minutes <= 600", name="ck_reading_log_minutes"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "assignment_status_id": self.assignment_status_id,
            "minutes": self.minutes,
            "stopped_at": self.stopped_at,
            "notes": self.notes,
            "logged_at": self.logged_at.isoformat()
            if self.logged_at
            else None,
        }
