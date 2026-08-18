from sqlalchemy import or_

from models import Student, User


class StudentService:
    @staticmethod
    def list_students(search=None):
        query = Student.query.join(User)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Student.first_name.ilike(pattern),
                    Student.last_name.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )
        return query.order_by(Student.last_name, Student.first_name).all()
