"""
Book management. This module handles book creation, retrieval, and
deactivation.
"""
from models import Book, db
from services.exceptions import NotFoundError, ValidationError


class BookService:
    @staticmethod
    def list_books():
        return Book.query.filter_by(is_active=True).order_by(Book.title).all()

    @staticmethod
    def get_book(book_id):
        book = db.session.get(Book, book_id)
        if not book or not book.is_active:
            raise NotFoundError("Book not found")
        return book

    @staticmethod
    def create_book(
        title,
        author=None,
        isbn=None,
        cover_url=None,
        description=None,
        content_url=None,
    ):
        if isbn and Book.query.filter_by(isbn=isbn).first():
            raise ValidationError("ISBN already exists")

        book = Book(
            title=title,
            author=author,
            isbn=isbn,
            cover_url=cover_url,
            description=description,
            content_url=content_url,
        )
        db.session.add(book)
        db.session.commit()
        return book

    @staticmethod
    def update_book(book_id, **fields):
        book = db.session.get(Book, book_id)
        if not book or not book.is_active:
            raise NotFoundError("Book not found")

        if "isbn" in fields and fields["isbn"] and fields["isbn"] != book.isbn:
            if Book.query.filter_by(isbn=fields["isbn"]).first():
                raise ValidationError("ISBN already exists")

        for key in (
            "title",
            "author",
            "isbn",
            "cover_url",
            "description",
            "content_url",
        ):
            if key in fields and fields[key] is not None:
                setattr(book, key, fields[key])

        db.session.commit()
        return book

    @staticmethod
    def deactivate_book(book_id):
        book = db.session.get(Book, book_id)
        if not book or not book.is_active:
            raise NotFoundError("Book not found")

        book.is_active = False
        db.session.commit()
