import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBooks } from "../../../api/assignments";
import { EmptyState, ErrorState, SessionListSkeleton } from "../../../components/states";
import { bookSwatch } from "../utils";

function BookPicker({ selectedId, onSelect, error }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (err) {
      console.error(err);
      setLoadError(true);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return books;
    return books.filter((book) => {
      const title = (book.title || "").toLowerCase();
      const author = (book.author || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [books, debouncedQuery]);

  return (
    <section className="assign-card">
      <h2>Choose a book</h2>

      <div className="assign-field">
        <label htmlFor="book-search">Search the library</label>
        <input
          id="book-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title or author"
          autoComplete="off"
        />
      </div>

      {error && (
        <p id="book-picker-error" className="field-error" role="alert">
          {error}
        </p>
      )}

      <div
        className="book-picker__list"
        role="radiogroup"
        aria-label="Books"
        aria-busy={loading}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "book-picker-error" : undefined}
      >
        {loading && <SessionListSkeleton />}

        {!loading && loadError && (
          <ErrorState title="Couldn't load books" onRetry={load} />
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <EmptyState
            title="No books match that search"
            description="Try a different title or author."
          />
        )}

        {!loading &&
          !loadError &&
          filtered.map((book) => {
            const checked = selectedId === book.id;
            const inputId = `book-${book.id}`;
            return (
              <label
                key={book.id}
                htmlFor={inputId}
                className={
                  checked
                    ? "book-picker__row book-picker__row--selected"
                    : "book-picker__row"
                }
              >
                <input
                  id={inputId}
                  type="radio"
                  name="book"
                  value={book.id}
                  checked={checked}
                  onChange={() => onSelect(book)}
                />
                <span
                  className="book-picker__swatch"
                  style={{
                    background: bookSwatch(
                      `${book.title}-${book.author || ""}`
                    ),
                  }}
                  aria-hidden="true"
                />
                <span className="book-picker__copy">
                  <span className="book-picker__title">{book.title}</span>
                  <span className="book-picker__author">{book.author}</span>
                </span>
              </label>
            );
          })}
      </div>
    </section>
  );
}

export default BookPicker;
