"""
Authentication and registration. This module handles user creation and login.
"""
from sqlalchemy.exc import IntegrityError

from models import ROLES, Student, Teacher, User, db
from services.exceptions import (
    EmailAlreadyExists,
    UnauthorizedError,
    ValidationError,
)


class AuthService:
    @staticmethod
    def register(email, password, first_name, last_name, role):
        if role not in ROLES:
            raise ValidationError("Invalid role")
        if not password or len(password) < 8:
            raise ValidationError("Password must be at least 8 characters")

        normalized = (email or "").strip().lower()
        if not normalized:
            raise ValidationError("Email is required")
        if User.query.filter_by(email=normalized).first():
            raise EmailAlreadyExists(
                "An account with this email already exists."
            )

        user = User(email=normalized, role=role)
        user.set_password(password)
        db.session.add(user)

        try:
            db.session.flush()
            if role == "student":
                db.session.add(
                    Student(
                        user_id=user.id,
                        first_name=first_name.strip(),
                        last_name=last_name.strip(),
                    )
                )
            else:
                db.session.add(
                    Teacher(
                        user_id=user.id,
                        first_name=first_name.strip(),
                        last_name=last_name.strip(),
                    )
                )
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise EmailAlreadyExists(
                "An account with this email already exists."
            )

        return user

    @staticmethod
    def login(email, password):
        normalized = (email or "").strip().lower()
        user = User.query.filter_by(email=normalized).first()
        if not user or not user.check_password(password):
            raise UnauthorizedError("Invalid email or password")
        return user
