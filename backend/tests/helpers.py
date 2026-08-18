from models import Student, Teacher
from services.auth import AuthService


def make_teacher(
    email="teacher@test.com",
    password="password123",
    first_name="Ada",
    last_name="Teacher",
):
    user = AuthService.register(
        email, password, first_name, last_name, "teacher"
    )
    return Teacher.query.filter_by(user_id=user.id).one()


def make_student(
    email="student@test.com",
    password="password123",
    first_name="Amara",
    last_name="Okafor",
):
    user = AuthService.register(
        email, password, first_name, last_name, "student"
    )
    return Student.query.filter_by(user_id=user.id).one()


def auth_header(client, email, password="password123"):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
