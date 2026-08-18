import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { createAssignment } from "../../../api/assignments";
import {
  DetailPageSkeleton,
  ErrorState,
} from "../../../components/states";
import { useClassContext } from "../hooks/useClassContext";
import {
  bookSwatch,
  buildAssignmentPreview,
  classDisplayName,
  daysFromTodayLabel,
  todayInputValue,
} from "../utils";
import BookPicker from "./BookPicker";
import "./NewAssignmentForm.css";

function NewAssignmentForm() {
  const { id: classId } = useParams();
  const navigate = useNavigate();
  const { classItem, studentCount, loading, loadError, reload } =
    useClassContext(classId);

  const [selectedBook, setSelectedBook] = useState(null);
  const [scope, setScope] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [bookError, setBookError] = useState("");
  const [scopeError, setScopeError] = useState("");
  const [dueError, setDueError] = useState("");
  const [formError, setFormError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const minDate = todayInputValue();
  const displayName = classDisplayName(classItem);
  const preview = useMemo(
    () =>
      buildAssignmentPreview({
        bookTitle: selectedBook?.title,
        scope,
        dueDate,
      }),
    [selectedBook, scope, dueDate]
  );

  async function submitForm() {
    setFormError(false);
    let valid = true;

    if (!selectedBook) {
      setBookError("Pick a book.");
      valid = false;
    } else setBookError("");

    if (!scope.trim()) {
      setScopeError("Enter what students should read.");
      valid = false;
    } else setScopeError("");

    if (!dueDate) {
      setDueError("Pick a due date.");
      valid = false;
    } else if (dueDate < minDate) {
      setDueError("Due date cannot be in the past.");
      valid = false;
    } else setDueError("");

    if (!valid) return;

    setSubmitting(true);
    try {
      const created = await createAssignment({
        classId,
        bookId: selectedBook.id,
        name: scope.trim(),
        dueDate: `${dueDate}T23:59:59.000Z`,
      });
      navigate(`/classes/${classId}/assignments/${created.id}`, {
        replace: true,
      });
    } catch (err) {
      console.error(err);
      setFormError(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await submitForm();
  }

  if (loading) {
    return (
      <main className="assign-page">
        <div className="assign-page__inner">
          <DetailPageSkeleton />
        </div>
      </main>
    );
  }

  if (loadError || !classItem) {
    return (
      <main className="assign-page">
        <div className="assign-page__inner">
          <ErrorState title="Couldn't load this class" onRetry={reload} />
        </div>
      </main>
    );
  }

  const submitLabel = submitting
    ? "Assigning…"
    : `Assign to ${studentCount} student${studentCount === 1 ? "" : "s"}`;

  return (
    <main className="assign-page">
      <div className="assign-page__inner">
        <Link className="assign-page__back" to={`/classes/${classId}`}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          {displayName}
        </Link>

        <header className="assign-page__header">
          <h1>New assignment</h1>
          <p>
            All {studentCount} student{studentCount === 1 ? "" : "s"} in{" "}
            {displayName} will receive this.
          </p>
        </header>

        <form className="assign-form" onSubmit={handleSubmit} noValidate>
          <BookPicker
            selectedId={selectedBook?.id || null}
            onSelect={(book) => {
              setSelectedBook(book);
              if (bookError) setBookError("");
            }}
            error={bookError}
          />

          <section className="assign-card">
            <div className="assign-details">
              <div className="assign-field">
                <label htmlFor="assign-scope">What should they read?</label>
                <input
                  id="assign-scope"
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    if (scopeError) setScopeError("");
                  }}
                  placeholder="Chapters 1–4"
                  autoComplete="off"
                  className={scopeError ? "input-invalid" : undefined}
                  aria-invalid={Boolean(scopeError)}
                  aria-describedby={scopeError ? "scope-error" : undefined}
                />
                <p className="assign-field__hint">
                  Shown to students under the book title.
                </p>
                {scopeError && (
                  <p id="scope-error" className="field-error" role="alert">
                    {scopeError}
                  </p>
                )}
              </div>

              <div className="assign-field">
                <label htmlFor="assign-due">Due date</label>
                <input
                  id="assign-due"
                  type="date"
                  min={minDate}
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (dueError) setDueError("");
                  }}
                  className={dueError ? "input-invalid" : undefined}
                  aria-invalid={Boolean(dueError)}
                  aria-describedby={dueError ? "due-error" : undefined}
                />
                <p className="assign-field__hint">
                  {dueDate ? daysFromTodayLabel(dueDate) : "Pick a due date"}
                </p>
                {dueError && (
                  <p id="due-error" className="field-error" role="alert">
                    {dueError}
                  </p>
                )}
              </div>
            </div>
          </section>

          {preview && (
            <div className="assign-preview" aria-live="polite">
              <span
                className="assign-preview__swatch"
                style={{
                  background: bookSwatch(
                    `${selectedBook.title}-${selectedBook.author || ""}`
                  ),
                }}
                aria-hidden="true"
              />
              <p>
                Students will see <strong>{preview}</strong>
              </p>
            </div>
          )}

          {formError && (
            <ErrorState
              title="Couldn't create this assignment"
              onRetry={submitForm}
            />
          )}

          <div className="assign-actions">
            <button
              type="submit"
              className="assign-actions__submit"
              disabled={submitting}
            >
              {submitLabel}
            </button>
            <button
              type="button"
              className="assign-actions__cancel"
              onClick={() => navigate(`/classes/${classId}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default NewAssignmentForm;
