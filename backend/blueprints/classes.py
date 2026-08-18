from flask import Blueprint, jsonify, request

from services.assignments import AssignmentService
from services.classes import ClassService
from utils.security import get_current_teacher, role_required

classes_bp = Blueprint("classes", __name__, url_prefix="/classes")


@classes_bp.get("")
@role_required("teacher")
def list_classes():
    teacher = get_current_teacher()
    return jsonify(ClassService.list_classes(teacher))


@classes_bp.post("")
@role_required("teacher")
def create_class():
    teacher = get_current_teacher()
    data = request.get_json(silent=True) or {}
    if not data.get("name"):
        return jsonify({"error": "Missing fields: name"}), 400

    class_ = ClassService.create_class(
        teacher=teacher,
        name=data["name"],
        subject=data.get("subject"),
    )
    return jsonify(class_.to_dict(student_count=0)), 201


@classes_bp.get("/<class_id>")
@role_required("teacher")
def get_class(class_id):
    teacher = get_current_teacher()
    detail = ClassService.get_class_detail(teacher, class_id)
    return jsonify(detail)


@classes_bp.get("/<class_id>/assignments")
@role_required("teacher")
def list_class_assignments(class_id):
    teacher = get_current_teacher()
    assignments = AssignmentService.list_class_assignments(teacher, class_id)
    return jsonify(assignments)


@classes_bp.get("/<class_id>/students")
@role_required("teacher")
def list_class_students(class_id):
    teacher = get_current_teacher()
    include_activity = request.args.get("include_activity") == "true"
    roster = ClassService.list_roster(
        teacher, class_id, include_activity=include_activity
    )
    if include_activity:
        return jsonify(roster)
    return jsonify([student.to_dict() for student in roster])


@classes_bp.put("/<class_id>/students")
@role_required("teacher")
def update_class_students(class_id):
    teacher = get_current_teacher()
    data = request.get_json(silent=True) or {}
    students = ClassService.update_students(
        teacher=teacher,
        class_id=class_id,
        add=data.get("add", []),
        remove=data.get("remove", []),
    )
    return jsonify([student.to_dict() for student in students])
