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

CLASSES = [
    ("English 9", "English"),
    ("American Literature", "English"),
    ("US History", "History"),
    ("Book Club", "English"),
]

GUTENBERG_BOOKS = [
    {
        "title": "The Call of the Wild",
        "author": "Jack London",
        "content_url": "https://www.gutenberg.org/ebooks/215",
        "description": (
            "A sled dog's journey in the Yukon during the Klondike Gold Rush."
        ),
        "assignment_name": "chapters 1–4",
        "class_name": "American Literature",
        "subject": "English",
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
        "class_name": "English 9",
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
        "class_name": "English 9",
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
        "class_name": "American Literature",
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
        "class_name": "Book Club",
        "subject": "English",
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
        "class_name": "US History",
        "subject": "History",
        "due_offset_days": -10,
    },
]


def L(minutes, days=0, hours=0, at=None, notes=None):
    """One reading session. `days`/`hours` is how long ago it was logged."""
    ago = {}
    if days:
        ago["days"] = days
    if hours:
        ago["hours"] = hours
    if not ago:
        ago["hours"] = 2
    return {
        "minutes": minutes,
        "stopped_at": at,
        "notes": notes,
        "ago": ago,
    }


# Per-book progress by first name. Missing students stay not started.
# Overdue + not completed = behind on the class card.
PROGRESS = {
    "The Call of the Wild": {
        "Amara": (
            STATUS_IN_PROGRESS,
            [
                L(35, days=5, at="chapter 1"),
                L(
                    42,
                    days=3,
                    at="chapter 2",
                    notes="The dog pack has a brutal pecking order.",
                ),
                L(28, days=1, at="chapter 3"),
            ],
        ),
        "Diego": (
            STATUS_COMPLETED,
            [
                L(40, days=8, at="chapter 1"),
                L(38, days=6, at="chapter 2"),
                L(45, days=4, at="chapter 4"),
            ],
        ),
        "Priya": (
            STATUS_IN_PROGRESS,
            [
                L(40, days=4, at="chapter 1"),
                L(
                    27,
                    days=2,
                    at="chapter 2",
                    notes=(
                        "Buck finally gets away from Spitz. I didn't "
                        "expect the sled dogs to have their own "
                        "hierarchy like that — it's kind of brutal."
                    ),
                ),
                L(22, hours=6, at="chapter 3"),
            ],
        ),
        "Mei": (
            STATUS_IN_PROGRESS,
            [
                L(50, days=6, at="chapter 1"),
                L(33, days=4, at="chapter 2"),
                L(41, days=2, at="chapter 3"),
                L(
                    25,
                    hours=8,
                    at="chapter 4",
                    notes="Almost done — the North feels endless.",
                ),
            ],
        ),
    },
    "Frankenstein": {
        "Amara": (
            STATUS_COMPLETED,
            [
                L(30, days=12, at="letter 2"),
                L(44, days=9, at="chapter 2"),
                L(38, days=6, at="chapter 4"),
                L(36, days=4, at="chapter 5"),
            ],
        ),
        "Diego": (
            STATUS_IN_PROGRESS,
            [
                L(20, days=7, at="letter 4"),
                L(
                    18,
                    days=3,
                    at="chapter 1",
                    notes="Hard to get going. The letters are slow.",
                ),
            ],
        ),
        "Jonah": (
            STATUS_IN_PROGRESS,
            [
                L(15, days=8, at="letter 1"),
                L(25, days=5, at="letter 4"),
                L(12, days=1, at="chapter 1"),
            ],
        ),
        "Mei": (
            STATUS_COMPLETED,
            [
                L(48, days=11, at="chapter 2"),
                L(40, days=8, at="chapter 4"),
                L(32, days=5, at="chapter 5"),
            ],
        ),
    },
    "Pride and Prejudice": {
        "Amara": (
            STATUS_IN_PROGRESS,
            [
                L(32, days=4, at="chapter 3"),
                L(29, days=2, at="chapter 6"),
                L(
                    24,
                    hours=10,
                    at="chapter 8",
                    notes=(
                        "Darcy is impossible. Elizabeth is funnier "
                        "than I expected."
                    ),
                ),
            ],
        ),
        "Diego": (
            STATUS_IN_PROGRESS,
            [L(18, days=1, at="chapter 2")],
        ),
        "Priya": (
            STATUS_IN_PROGRESS,
            [
                L(22, days=3, at="chapter 3"),
                L(18, hours=5, at="chapter 4"),
            ],
        ),
        "Mei": (
            STATUS_IN_PROGRESS,
            [
                L(40, days=3, at="chapter 5"),
                L(35, days=1, at="chapter 9"),
            ],
        ),
    },
    "The Adventures of Tom Sawyer": {
        "Amara": (
            STATUS_IN_PROGRESS,
            [
                L(28, days=3, at="chapter 2"),
                L(
                    20,
                    days=1,
                    at="chapter 4",
                    notes="The fence scene is even funnier than I remembered.",
                ),
            ],
        ),
        "Jonah": (
            STATUS_IN_PROGRESS,
            [L(16, days=2, at="chapter 1")],
        ),
    },
    "Alice's Adventures in Wonderland": {
        "Amara": (
            STATUS_COMPLETED,
            [
                L(30, days=14, at="chapter 3"),
                L(35, days=11, at="chapter 7"),
                L(28, days=8, at="chapter 12"),
            ],
        ),
        "Diego": (
            STATUS_IN_PROGRESS,
            [
                L(22, days=6, at="chapter 2"),
                L(26, days=3, at="chapter 4"),
                L(19, days=1, at="chapter 6"),
            ],
        ),
        "Priya": (
            STATUS_IN_PROGRESS,
            [
                L(25, days=5, at="chapter 3"),
                L(
                    20,
                    days=2,
                    at="chapter 5",
                    notes=(
                        "The caterpillar chapter made no sense and I loved it."
                    ),
                ),
            ],
        ),
        "Mei": (
            STATUS_IN_PROGRESS,
            [
                L(45, days=4, at="chapter 6"),
                L(30, hours=12, at="chapter 8"),
            ],
        ),
    },
    "Narrative of the Life of Frederick Douglass": {
        "Amara": (
            STATUS_COMPLETED,
            [
                L(40, days=18, at="chapter 2"),
                L(38, days=15, at="chapter 4"),
                L(42, days=13, at="chapter 6"),
            ],
        ),
        "Diego": (
            STATUS_COMPLETED,
            [
                L(35, days=16, at="chapter 3"),
                L(40, days=12, at="chapter 6"),
            ],
        ),
        "Priya": (
            STATUS_COMPLETED,
            [
                L(30, days=20, at="chapter 2"),
                L(36, days=16, at="chapter 4"),
                L(55, days=13, at="chapter 6"),
            ],
        ),
        "Jonah": (
            STATUS_IN_PROGRESS,
            [
                L(20, days=14, at="chapter 1"),
                L(
                    15,
                    days=9,
                    at="chapter 2",
                    notes="I keep stalling. The beginning is dense.",
                ),
            ],
        ),
        "Mei": (
            STATUS_COMPLETED,
            [
                L(50, days=17, at="chapter 3"),
                L(44, days=14, at="chapter 6"),
            ],
        ),
    },
}


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

    now = datetime.now(timezone.utc)
    latest = None
    for log in logs or []:
        logged_at = now - timedelta(**log["ago"])
        if latest is None or logged_at > latest:
            latest = logged_at
        db.session.add(
            ReadingLog(
                assignment_status_id=record.id,
                minutes=log["minutes"],
                stopped_at=log.get("stopped_at"),
                notes=log.get("notes"),
                logged_at=logged_at,
            )
        )

    record.completed_at = latest if status == STATUS_COMPLETED else None
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
        by_first = {}
        for email, first_name, last_name in students_spec:
            _, student = get_or_create_user(
                email, "password123", "student", first_name, last_name
            )
            students.append(student)
            by_first[first_name] = student

        classes = {}
        for name, subject in CLASSES:
            classes[(name, subject)] = get_or_create_class(
                teacher, name, subject
            )

        for class_ in classes.values():
            for student in students:
                ensure_enrollment(student, class_)

        now = datetime.now(timezone.utc)
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

            for first_name, (status, logs) in PROGRESS.get(
                spec["title"], {}
            ).items():
                set_status(assignment, by_first[first_name], status, logs)

            if spec["title"] == "The Call of the Wild":
                demo_assignment_id = assignment.id

        db.session.commit()

        print("Seed complete.")
        print(f"  teacher login: {TEACHER_EMAIL} / {TEACHER_PASSWORD}")
        print(f"  student login: {STUDENT_DEMO_EMAIL} / password123")
        print("  student list:    /assignments")
        if demo_assignment_id:
            print(f"  book view:       /assignments/{demo_assignment_id}")


if __name__ == "__main__":
    seed()
