import pytest

from models import Teacher
from services.assignments import AssignmentService
from services.auth import AuthService
from services.books import BookService
from services.classes import ClassService
from services.exceptions import (
    EmailAlreadyExists,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from services.students import StudentService
from tests.helpers import make_student, make_teacher


def test_register_and_login(app):
    user = AuthService.register(
        "ada@test.com", "password123", "Ada", "Lovelace", "teacher"
    )
    assert user.email == "ada@test.com"
    assert Teacher.query.filter_by(user_id=user.id).one()
    logged_in = AuthService.login("ada@test.com", "password123")
    assert logged_in.id == user.id


def test_register_rejects_short_password_and_duplicate(app):
    with pytest.raises(ValidationError):
        AuthService.register("a@test.com", "short", "A", "B", "student")
    AuthService.register("a@test.com", "password123", "A", "B", "student")
    with pytest.raises(EmailAlreadyExists):
        AuthService.register("a@test.com", "password123", "A", "B", "student")


def test_login_rejects_bad_password(app):
    AuthService.register("a@test.com", "password123", "A", "B", "student")
    with pytest.raises(UnauthorizedError):
        AuthService.login("a@test.com", "wrong-password")


def test_book_create_get_and_deactivate(app):
    book = BookService.create_book("Frankenstein", author="Shelley")
    assert BookService.get_book(book.id).title == "Frankenstein"
    assert len(BookService.list_books()) == 1
    BookService.deactivate_book(book.id)
    with pytest.raises(NotFoundError):
        BookService.get_book(book.id)
    assert BookService.list_books() == []


def test_book_duplicate_isbn(app):
    BookService.create_book("One", isbn="111")
    with pytest.raises(ValidationError):
        BookService.create_book("Two", isbn="111")


def test_class_create_list_and_foreign_class_is_hidden(app):
    teacher = make_teacher()
    other = make_teacher(email="other@test.com")
    class_ = ClassService.create_class(teacher, "Period 3", "English")
    listing = ClassService.list_classes(teacher)
    assert len(listing) == 1
    assert listing[0]["name"] == "Period 3"
    with pytest.raises(NotFoundError):
        ClassService.get_class(other, class_.id)


def test_roster_add_and_unknown_student(app):
    teacher = make_teacher()
    student = make_student()
    class_ = ClassService.create_class(teacher, "Period 3")
    roster = ClassService.update_students(teacher, class_.id, add=[student.id])
    assert [row.id for row in roster] == [student.id]
    with pytest.raises(NotFoundError):
        ClassService.update_students(
            teacher, class_.id, add=["missing-student"]
        )


def test_student_search(app):
    make_student(
        email="amara@test.com", first_name="Amara", last_name="Okafor"
    )
    make_student(
        email="diego@test.com", first_name="Diego", last_name="Ramirez"
    )
    assert len(StudentService.list_students()) == 2
    found = StudentService.list_students(search="amara")
    assert [s.first_name for s in found] == ["Amara"]


def test_assignment_create_log_and_complete(app):
    teacher = make_teacher()
    student = make_student()
    class_ = ClassService.create_class(
        teacher, "Period 3", student_ids=[student.id]
    )
    book = BookService.create_book("Frankenstein")
    assignment = AssignmentService.create_assignment(
        teacher,
        class_.id,
        book.id,
        "2026-09-01T00:00:00+00:00",
        "chapters 1–5",
    )

    rows = AssignmentService.list_student_assignments(student)
    assert len(rows) == 1
    assert rows[0]["status"]["status"] == "not_started"

    AssignmentService.log_reading(student, assignment.id, minutes=20)
    progress = AssignmentService.get_student_assignment(student, assignment.id)
    assert progress["status"]["status"] == "in_progress"
    assert progress["status"]["total_minutes"] == 20

    AssignmentService.update_status(student, assignment.id, "completed")
    done = AssignmentService.get_student_assignment(student, assignment.id)
    assert done["status"]["status"] == "completed"


def test_assignment_rejects_bad_input_and_wrong_student(app):
    teacher = make_teacher()
    student = make_student()
    outsider = make_student(email="out@test.com")
    class_ = ClassService.create_class(
        teacher, "Period 3", student_ids=[student.id]
    )
    book = BookService.create_book("Frankenstein")
    assignment = AssignmentService.create_assignment(
        teacher,
        class_.id,
        book.id,
        "2026-09-01T00:00:00+00:00",
        "letters",
    )
    with pytest.raises(ValidationError):
        AssignmentService.log_reading(student, assignment.id, minutes=0)
    with pytest.raises(NotFoundError):
        AssignmentService.get_student_assignment(outsider, assignment.id)
    with pytest.raises(NotFoundError):
        AssignmentService.create_assignment(
            teacher,
            class_.id,
            "missing-book",
            "2026-09-01T00:00:00+00:00",
            "letters",
        )
