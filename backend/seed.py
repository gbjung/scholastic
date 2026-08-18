"""Fill the database with Gutenberg books and demo classes."""

from datetime import datetime, timedelta, timezone

from app import create_app
from models import (
    STATUS_COMPLETED,
    STATUS_IN_PROGRESS,
    STATUS_NOT_STARTED,
    Assignment,
    AssignmentStatus,
    Book,
    Class,
    ReadingLog,
    Student,
    StudentEnrollment,
    Teacher,
    User,
    db,
)

TEACHER_EMAIL = "teacher@scholastic.test"
TEACHER_PASSWORD = "password123"
STUDENT_DEMO_EMAIL = "priya.shah@scholastic.test"

GUTENBERG_BOOKS = [
    {
        "title": "The Call of the Wild",
        "author": "Jack London",
        "content_url": "https://www.gutenberg.org/ebooks/215",
        "description": (
            "A sled dog's journey in the Yukon during the Klondike Gold Rush."
        ),
        "assignment_name": "chapters 1–4",
        "class_name": "Period 5",
        "subject": "History",
        "due_offset_days": 3,
    },
    {
        "title": "Frankenstein",
        "author": "Mary Wollstonecraft Shelley",
        "content_url": "https://www.gutenberg.org/ebooks/84",
        "description": (
            "A scientist creates life — and faces the consequences."
        ),
        "assignment_name": "letters + chapters 1–5",
        "class_name": "Period 3",
        "subject": "English",
        "due_offset_days": -2,
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "content_url": "https://www.gutenberg.org/ebooks/1342",
        "description": (
            "Elizabeth Bennet navigates manners, marriage, and "
            "misunderstanding."
        ),
        "assignment_name": "chapters 1–12",
        "class_name": "Period 3",
        "subject": "English",
        "due_offset_days": 5,
    },
    {
        "title": "The Adventures of Tom Sawyer",
        "author": "Mark Twain",
        "content_url": "https://www.gutenberg.org/ebooks/74",
        "description": (
            "A mischievous boy grows up along the Mississippi River."
        ),
        "assignment_name": "chapters 1–8",
        "class_name": "Period 2",
        "subject": "English",
        "due_offset_days": 12,
    },
    {
        "title": "Alice's Adventures in Wonderland",
        "author": "Lewis Carroll",
        "content_url": "https://www.gutenberg.org/ebooks/11",
        "description": (
            "Alice falls down a rabbit hole into a world of curious creatures."
        ),
        "assignment_name": "full book",
        "class_name": "Period 2",
        "subject": "Science",
        "due_offset_days": 25,
    },
    {
        "title": "Narrative of the Life of Frederick Douglass",
        "author": "Frederick Douglass",
        "content_url": "https://www.gutenberg.org/ebooks/23",
        "description": (
            "Douglass recounts his life under slavery and his path to freedom."
        ),
        "assignment_name": "chapters 1–6",
        "class_name": "Period 5",
        "subject": "History",
        "due_offset_days": -10,
        "completed_for_demo": True,
    },
]


def get_or_create_user(email, password, role, first_name, last_name):
    user = User.query.filter_by(email=email).first()
    if user:
        profile = (
            Teacher.query.filter_by(user_id=user.id).first()
            if role == "teacher"
            else Student.query.filter_by(user_id=user.id).first()
        )
        return user, profile

    user = User(email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    profile = (
        Teacher(user_id=user.id, first_name=first_name, last_name=last_name)
        if role == "teacher"
        else Student(
            user_id=user.id, first_name=first_name, last_name=last_name
        )
    )
    db.session.add(profile)
    db.session.flush()
    return user, profile


def get_or_create_book(title, author, content_url, description=None):
    book = Book.query.filter_by(title=title).first()
    if book:
        book.author = author
        book.content_url = content_url
        book.description = description
        book.is_active = True
        return book
    book = Book(
        title=title,
        author=author,
        content_url=content_url,
        description=description,
        is_active=True,
    )
    db.session.add(book)
    db.session.flush()
    return book


def get_or_create_class(teacher, name, subject):
    class_ = Class.query.filter_by(
        teacher_id=teacher.id, name=name, subject=subject
    ).first()
    if class_:
        return class_
    class_ = Class(teacher_id=teacher.id, name=name, subject=subject)
    db.session.add(class_)
    db.session.flush()
    return class_


def ensure_enrollment(student, class_):
    existing = StudentEnrollment.query.filter_by(
        student_id=student.id, class_id=class_.id
    ).first()
    if not existing:
        db.session.add(
            StudentEnrollment(student_id=student.id, class_id=class_.id)
        )


def get_or_create_assignment(class_, book, name, due_date):
    assignment = Assignment.query.filter_by(
        class_id=class_.id, book_id=book.id, name=name
    ).first()
    if not assignment:
        assignment = Assignment(
            class_id=class_.id,
            book_id=book.id,
            name=name,
            due_date=due_date,
        )
        db.session.add(assignment)
        db.session.flush()
    else:
        assignment.due_date = due_date
    return assignment


def set_status(assignment, student, status, logs=None):
    record = AssignmentStatus.query.filter_by(
        assignment_id=assignment.id, student_id=student.id
    ).first()
    if not record:
        record = AssignmentStatus(
            assignment_id=assignment.id,
            student_id=student.id,
            status=status,
        )
        db.session.add(record)
        db.session.flush()
    else:
        record.status = status
        ReadingLog.query.filter_by(assignment_status_id=record.id).delete()

    record.completed_at = (
        datetime.now(timezone.utc) - timedelta(days=3)
        if status == STATUS_COMPLETED
        else None
    )

    for log in logs or []:
        db.session.add(
            ReadingLog(
                assignment_status_id=record.id,
                minutes=log["minutes"],
                stopped_at=log.get("stopped_at"),
                notes=log.get("notes"),
                logged_at=datetime.now(timezone.utc) - timedelta(**log["ago"]),
            )
        )
    return record


def reset_schema():
    db.drop_all()
    db.create_all()


def seed():
    app = create_app()
    with app.app_context():
        reset_schema()

        _, teacher = get_or_create_user(
            TEACHER_EMAIL, TEACHER_PASSWORD, "teacher", "Ada", "Teacher"
        )

        students_spec = [
            ("amara.okafor@scholastic.test", "Amara", "Okafor"),
            ("diego.ramirez@scholastic.test", "Diego", "Ramirez"),
            ("priya.shah@scholastic.test", "Priya", "Shah"),
            ("jonah.blake@scholastic.test", "Jonah", "Blake"),
            ("mei.chen@scholastic.test", "Mei", "Chen"),
            ("liam.nguyen@scholastic.test", "Liam", "Nguyen"),
        ]
        students = []
        for email, first_name, last_name in students_spec:
            _, student = get_or_create_user(
                email, "password123", "student", first_name, last_name
            )
            students.append(student)

        classes = {}
        for spec in GUTENBERG_BOOKS:
            key = (spec["class_name"], spec["subject"])
            if key not in classes:
                classes[key] = get_or_create_class(
                    teacher, spec["class_name"], spec["subject"]
                )

        for class_ in classes.values():
            for student in students:
                ensure_enrollment(student, class_)

        now = datetime.now(timezone.utc)
        priya = students[2]
        demo_assignment_id = None

        for spec in GUTENBERG_BOOKS:
            book = get_or_create_book(
                spec["title"],
                spec["author"],
                spec["content_url"],
                spec.get("description"),
            )
            class_ = classes[(spec["class_name"], spec["subject"])]
            assignment = get_or_create_assignment(
                class_,
                book,
                spec["assignment_name"],
                now + timedelta(days=spec["due_offset_days"]),
            )

            # Start everyone as not started; later steps add demo progress.
            for student in students:
                existing = AssignmentStatus.query.filter_by(
                    assignment_id=assignment.id, student_id=student.id
                ).first()
                if not existing:
                    db.session.add(
                        AssignmentStatus(
                            assignment_id=assignment.id,
                            student_id=student.id,
                            status=STATUS_NOT_STARTED,
                        )
                    )

            if spec["title"] == "The Call of the Wild":
                demo_assignment_id = assignment.id
                set_status(
                    assignment,
                    priya,
                    STATUS_IN_PROGRESS,
                    logs=[
                        {
                            "minutes": 40,
                            "stopped_at": "chapter 1",
                            "ago": {"days": 4},
                        },
                        {
                            "minutes": 27,
                            "stopped_at": "chapter 2",
                            "notes": (
                                "Buck finally gets away from Spitz. I didn't "
                                "expect the sled dogs to have their own "
                                "hierarchy like that — it's kind of brutal."
                            ),
                            "ago": {"days": 2},
                        },
                    ],
                )
            elif spec.get("completed_for_demo"):
                set_status(
                    assignment,
                    priya,
                    STATUS_COMPLETED,
                    logs=[
                        {
                            "minutes": 55,
                            "stopped_at": "chapter 6",
                            "ago": {"days": 3},
                        }
                    ],
                )
            elif spec["due_offset_days"] < 0:
                set_status(assignment, priya, STATUS_NOT_STARTED)
            elif spec["title"] == "Pride and Prejudice":
                set_status(
                    assignment,
                    priya,
                    STATUS_IN_PROGRESS,
                    logs=[
                        {
                            "minutes": 18,
                            "stopped_at": "chapter 4",
                            "ago": {"hours": 5},
                        }
                    ],
                )

        db.session.commit()

        print("Seed complete.")
        print(f"  teacher login: {TEACHER_EMAIL} / {TEACHER_PASSWORD}")
        print(f"  student login: {STUDENT_DEMO_EMAIL} / password123")
        print("  student list:    /assignments")
        if demo_assignment_id:
            print(f"  book view:       /assignments/{demo_assignment_id}")


if __name__ == "__main__":
    seed()
