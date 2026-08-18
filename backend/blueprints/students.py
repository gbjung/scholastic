from flask import Blueprint, jsonify, request

from services.students import StudentService
from utils.security import role_required

students_bp = Blueprint("students", __name__, url_prefix="/students")


@students_bp.get("")
@role_required("teacher")
def list_students():
    search = request.args.get("search")
    students = StudentService.list_students(search=search)
    return jsonify([s.to_dict() for s in students])
