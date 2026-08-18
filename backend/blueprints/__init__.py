from .assignments import assignments_bp
from .auth import auth_bp
from .books import books_bp
from .classes import classes_bp
from .students import students_bp
from .users import users_bp

__all__ = [
    "assignments_bp",
    "auth_bp",
    "books_bp",
    "classes_bp",
    "students_bp",
    "users_bp",
]
