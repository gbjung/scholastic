from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from models import ROLES, Student, Teacher
from services.auth import AuthService

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _session_payload(user):
    claims = {"role": user.role, "email": user.email}
    profile = None
    if user.role == "teacher":
        teacher = Teacher.query.filter_by(user_id=user.id).first()
        if teacher:
            claims["teacher_id"] = teacher.id
            profile = teacher.to_dict()
    elif user.role == "student":
        student = Student.query.filter_by(user_id=user.id).first()
        if student:
            claims["student_id"] = student.id
            profile = student.to_dict()

    access_token = create_access_token(
        identity=user.id, additional_claims=claims
    )
    return {
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "teacher_id": claims.get("teacher_id"),
            "student_id": claims.get("student_id"),
            "profile": profile,
        },
    }


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ("email", "password", "first_name", "last_name", "role")
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
    if data["role"] not in ROLES:
        return jsonify({"error": "Invalid role"}), 400

    user = AuthService.register(
        email=data["email"],
        password=data["password"],
        first_name=data["first_name"],
        last_name=data["last_name"],
        role=data["role"],
    )
    return jsonify(_session_payload(user)), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Missing fields: email, password"}), 400

    user = AuthService.login(email=email, password=password)
    return jsonify(_session_payload(user))
