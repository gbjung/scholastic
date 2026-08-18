from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from services.assignments import AssignmentService
from utils.security import (
    get_current_student,
    get_current_teacher,
    role_required,
)

assignments_bp = Blueprint("assignments", __name__, url_prefix="/assignments")


@assignments_bp.get("")
@role_required("teacher", "student")
def list_assignments():
    role = get_jwt().get("role")
    if role == "teacher":
        assignments = AssignmentService.list_teacher_assignments(
            get_current_teacher()
        )
    else:
        assignments = AssignmentService.list_student_assignments(
            get_current_student()
        )
    return jsonify(assignments)


@assignments_bp.post("")
@role_required("teacher")
def create_assignment():
    teacher = get_current_teacher()
    data = request.get_json(silent=True) or {}
    required = ("class_id", "book_id", "due_date", "name")
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    assignment = AssignmentService.create_assignment(
        teacher=teacher,
        class_id=data["class_id"],
        book_id=data["book_id"],
        due_date=data["due_date"],
        name=data["name"],
    )
    return jsonify(assignment.to_dict()), 201


@assignments_bp.put("/<assignment_id>/status")
@role_required("student")
def update_assignment_status(assignment_id):
    student = get_current_student()
    data = request.get_json(silent=True) or {}
    if not data.get("status"):
        return jsonify({"error": "Missing fields: status"}), 400

    record = AssignmentService.update_status(
        student=student,
        assignment_id=assignment_id,
        status=data["status"],
    )
    return jsonify(record.to_dict(include_logs=True))


@assignments_bp.post("/<assignment_id>/reading-log")
@role_required("student")
def log_reading(assignment_id):
    student = get_current_student()
    data = request.get_json(silent=True) or {}
    minutes = data.get("minutes")
    if not isinstance(minutes, int) or minutes <= 0:
        return jsonify({"error": "minutes must be a positive integer"}), 400

    log = AssignmentService.log_reading(
        student=student,
        assignment_id=assignment_id,
        minutes=minutes,
        stopped_at=data.get("stopped_at"),
        notes=data.get("notes"),
    )
    return jsonify(log.to_dict()), 201


@assignments_bp.get("/reading-logs")
@role_required("teacher")
def list_student_reading_logs():
    student_id = request.args.get("student_id")
    class_id = request.args.get("class_id")
    missing = [
        field
        for field, value in (
            ("student_id", student_id),
            ("class_id", class_id),
        )
        if not value
    ]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    teacher = get_current_teacher()
    groups = AssignmentService.list_student_reading_logs(
        teacher=teacher,
        student_id=student_id,
        class_id=class_id,
    )
    return jsonify(groups)


@assignments_bp.get("/<assignment_id>")
@role_required("teacher", "student")
def get_assignment(assignment_id):
    role = get_jwt().get("role")
    if role == "teacher":
        include_logs = request.args.get("include_logs") == "true"
        result = AssignmentService.get_assignment_progress(
            get_current_teacher(),
            assignment_id,
            include_logs=include_logs,
        )
    else:
        result = AssignmentService.get_student_assignment(
            get_current_student(), assignment_id
        )
    return jsonify(result)
