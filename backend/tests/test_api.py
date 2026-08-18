from tests.helpers import auth_header


def _register(client, email, role, first_name="Ada", last_name="Test"):
    return client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "password123",
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
        },
    )


def test_register_login_and_auth_errors(client):
    created = _register(client, "teacher@test.com", "teacher")
    assert created.status_code == 201
    assert created.get_json()["user"]["role"] == "teacher"

    duplicate = _register(client, "teacher@test.com", "teacher")
    assert duplicate.status_code == 409

    missing = client.post("/auth/login", json={"email": "teacher@test.com"})
    assert missing.status_code == 400

    bad = client.post(
        "/auth/login",
        json={"email": "teacher@test.com", "password": "nope"},
    )
    assert bad.status_code == 401

    ok = client.post(
        "/auth/login",
        json={"email": "teacher@test.com", "password": "password123"},
    )
    assert ok.status_code == 200
    assert ok.get_json()["access_token"]


def test_protected_routes_require_the_right_role(client):
    _register(client, "teacher@test.com", "teacher")
    _register(client, "student@test.com", "student", "Amara", "Okafor")
    anon = client.get("/classes")
    assert anon.status_code == 401

    student = auth_header(client, "student@test.com")
    forbidden = client.post(
        "/classes", json={"name": "Period 3"}, headers=student
    )
    assert forbidden.status_code == 403


def test_class_assignment_and_reading_flow(client):
    _register(client, "teacher@test.com", "teacher")
    student_res = _register(
        client, "student@test.com", "student", "Amara", "Okafor"
    )
    student_id = student_res.get_json()["user"]["student_id"]
    teacher = auth_header(client, "teacher@test.com")
    student = auth_header(client, "student@test.com")

    class_res = client.post(
        "/classes",
        json={"name": "Period 3", "subject": "English"},
        headers=teacher,
    )
    assert class_res.status_code == 201
    class_id = class_res.get_json()["id"]

    roster = client.put(
        f"/classes/{class_id}/students",
        json={"add": [student_id]},
        headers=teacher,
    )
    assert roster.status_code == 200
    assert len(roster.get_json()) == 1

    missing_class = client.get("/classes/not-a-class", headers=teacher)
    assert missing_class.status_code == 404

    book_res = client.post(
        "/books", json={"title": "Frankenstein"}, headers=teacher
    )
    assert book_res.status_code == 201
    book_id = book_res.get_json()["id"]

    assignment_res = client.post(
        "/assignments",
        json={
            "class_id": class_id,
            "book_id": book_id,
            "due_date": "2026-09-01T00:00:00+00:00",
            "name": "chapters 1–5",
        },
        headers=teacher,
    )
    assert assignment_res.status_code == 201
    assignment_id = assignment_res.get_json()["id"]

    listed = client.get("/assignments", headers=student)
    assert listed.status_code == 200
    assert listed.get_json()[0]["id"] == assignment_id

    logged = client.post(
        f"/assignments/{assignment_id}/reading-log",
        json={"minutes": 25, "notes": "first session"},
        headers=student,
    )
    assert logged.status_code == 201

    bad_minutes = client.post(
        f"/assignments/{assignment_id}/reading-log",
        json={"minutes": 0},
        headers=student,
    )
    assert bad_minutes.status_code == 400

    done = client.put(
        f"/assignments/{assignment_id}/status",
        json={"status": "completed"},
        headers=student,
    )
    assert done.status_code == 200
    assert done.get_json()["status"] == "completed"

    progress = client.get(
        f"/assignments/{assignment_id}?include_logs=true",
        headers=teacher,
    )
    assert progress.status_code == 200
    body = progress.get_json()
    assert body["progress"][0]["status"] == "completed"
    assert body["progress"][0]["total_minutes"] == 25
