from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request

from models import Student, Teacher, User, db


class ProfileNotFound(Exception):
    pass


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Forbidden"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def get_current_user() -> User:
    user = db.session.get(User, get_jwt_identity())
    if not user:
        raise ProfileNotFound("User not found")
    return user


def get_current_teacher() -> Teacher:
    teacher = Teacher.query.filter_by(user_id=get_jwt_identity()).first()
    if not teacher:
        raise ProfileNotFound("Teacher profile not found")
    return teacher


def get_current_student() -> Student:
    student = Student.query.filter_by(user_id=get_jwt_identity()).first()
    if not student:
        raise ProfileNotFound("Student profile not found")
    return student
