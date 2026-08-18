"""Prepare the database on boot.

Runs on every start but only does work once. seed.py calls drop_all(), so it
must never run against a database that already has data — a reviewer's changes
would vanish after the service sleeps and restarts.
"""

import sys

from sqlalchemy import inspect

from app import create_app
from models import User, db


def _database_is_empty():
    if "user" not in inspect(db.engine).get_table_names():
        return True
    return User.query.first() is None


def main():
    app = create_app()
    with app.app_context():
        if not _database_is_empty():
            print("Database already seeded — skipping.", flush=True)
            return

        print("Empty database — seeding.", flush=True)

    from seed import seed

    seed()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 — boot should fail loudly
        print(f"Bootstrap failed: {exc}", file=sys.stderr)
        raise