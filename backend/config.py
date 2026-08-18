import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.pool import StaticPool

# Environment variables live in scholastic/.env, one folder above this file.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/scholastic",
    )
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
    JWT_SECRET_KEY = "test-secret-key-that-is-long-enough"
