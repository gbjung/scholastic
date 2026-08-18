from flask import Blueprint, jsonify, request

from services.books import BookService
from utils.security import role_required

books_bp = Blueprint("books", __name__, url_prefix="/books")


@books_bp.get("")
@role_required("teacher", "student")
def list_books():
    books = BookService.list_books()
    return jsonify([book.to_dict() for book in books])


@books_bp.get("/<book_id>")
@role_required("teacher", "student")
def get_book(book_id):
    book = BookService.get_book(book_id)
    return jsonify(book.to_dict())


@books_bp.post("")
@role_required("teacher")
def create_book():
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "Missing fields: title"}), 400

    book = BookService.create_book(
        title=data["title"],
        author=data.get("author"),
        isbn=data.get("isbn"),
        cover_url=data.get("cover_url"),
        description=data.get("description"),
        content_url=data.get("content_url"),
    )
    return jsonify(book.to_dict()), 201


@books_bp.put("/<book_id>")
@role_required("teacher")
def update_book(book_id):
    data = request.get_json(silent=True) or {}
    book = BookService.update_book(
        book_id,
        title=data.get("title"),
        author=data.get("author"),
        isbn=data.get("isbn"),
        cover_url=data.get("cover_url"),
        description=data.get("description"),
        content_url=data.get("content_url"),
    )
    return jsonify(book.to_dict())


@books_bp.delete("/<book_id>")
@role_required("teacher")
def delete_book(book_id):
    BookService.deactivate_book(book_id)
    return "", 204
