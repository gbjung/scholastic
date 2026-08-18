from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from blueprints import (
    assignments_bp,
    auth_bp,
    books_bp,
    classes_bp,
    students_bp,
    users_bp,
)
from config import DevelopmentConfig, ProductionConfig
from models import db
from services.exceptions import (
    EmailAlreadyExists,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from utils.security import ProfileNotFound


def create_app(config=None) -> Flask:
    app = Flask(__name__)

    if config is None:
        config = DevelopmentConfig if app.debug else ProductionConfig

    app.config.from_object(config)
    CORS(app, origins=[app.config["FRONTEND_URL"]])
    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(books_bp)
    app.register_blueprint(assignments_bp)
    app.register_blueprint(classes_bp)
    app.register_blueprint(users_bp)

    @app.errorhandler(ProfileNotFound)
    def handle_profile_not_found(exc):
        return jsonify({"error": str(exc)}), 404

    @app.errorhandler(NotFoundError)
    def _not_found(exc):
        return jsonify({"error": str(exc)}), 404

    @app.errorhandler(ValidationError)
    def _invalid(exc):
        return jsonify({"error": str(exc)}), 400

    @app.errorhandler(UnauthorizedError)
    def _unauthorized(exc):
        return jsonify({"error": str(exc)}), 401

    @app.errorhandler(EmailAlreadyExists)
    def _email_taken(exc):
        return jsonify({"error": str(exc)}), 409

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
