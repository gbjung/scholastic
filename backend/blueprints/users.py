from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity

from utils.security import (
    get_current_student,
    get_current_teacher,
    role_required,
)

users_bp = Blueprint("users", __name__)


@users_bp.get("/me")
@role_required("teacher", "student")
def get_me():
    role = get_jwt().get("role")
    profile = (
        get_current_teacher() if role == "teacher" else get_current_student()
    )
    return jsonify(
        {
            "id": get_jwt_identity(),
            "role": role,
            "profile": profile.to_dict(),
        }
    )
