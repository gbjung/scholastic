import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { apiFetch } from "../../api/client";
import LogoutButton from "../../components/LogoutButton";
import {
  DetailPageSkeleton,
  EmptyState,
  ErrorState,
} from "../../components/states";
import StatusBadge from "./components/StatusBadge";
import { formatDueDate } from "./utils";
import { ASSIGNMENT_STATUS, STATUS_LABELS } from "./constants";
import "./AssignmentDetailPage.css";

function formatSessionDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [stoppedAt, setStoppedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [minutesError, setMinutesError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const json = await apiFetch(`/assignments/${assignmentId}`);
      setData(json);
    } catch (err) {
      console.error(err);
      setLoadError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const sessions = useMemo(
    () => data?.status?.reading_logs || [],
    [data]
  );
  const totalMinutes = data?.status?.total_minutes || 0;
  const currentStatus =
    data?.status?.status || ASSIGNMENT_STATUS.NOT_STARTED;

  async function saveSession() {
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      setMinutesError("Enter between 1 and 600 minutes.");
      return;
    }
    setMinutesError("");
    setSaveError(null);
    setSaving(true);
    try {
      await apiFetch(`/assignments/${assignmentId}/reading-log`, {
        method: "POST",
        body: JSON.stringify({
          minutes: value,
          stopped_at: stoppedAt.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      await load();
      setMinutes("");
      setStoppedAt("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setSaveError("session");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSession(event) {
    event.preventDefault();
    await saveSession();
  }

  async function handleMarkComplete() {
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(`/assignments/${assignmentId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: ASSIGNMENT_STATUS.COMPLETED }),
      });
      await load();
    } catch (err) {
      console.error(err);
      setSaveError("complete");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="book-view">
        <div className="book-view__inner">
          <DetailPageSkeleton />
        </div>
      </main>
    );
  }

  if (loadError || !data) {
    return (
      <main className="book-view">
        <div className="book-view__inner">
          <ErrorState title="Couldn't load this assignment" onRetry={load} />
        </div>
      </main>
    );
  }

  const { assignment } = data;
  const contentUrl = assignment.book?.content_url;

  return (
    <main className="book-view">
      <div className="book-view__inner">
        <div className="book-view__nav">
          <Link className="book-view__back" to="/assignments">
            ← Your reading
          </Link>
          <LogoutButton />
        </div>

        <header className="book-view__header">
          <div className="book-view__eyebrow">
            {[assignment.class?.name, assignment.class?.subject]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <h1>{assignment.book?.title}</h1>
          <p className="book-view__meta">
            {[assignment.book?.author, assignment.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="book-view__row">
            <StatusBadge status={currentStatus} />
            {currentStatus !== ASSIGNMENT_STATUS.COMPLETED && (
              <span className="book-view__due-pill">
                {formatDueDate(assignment.due_date)}
              </span>
            )}
          </div>
        </header>

        {contentUrl && (
          <a
            className="book-view__gutenberg"
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="book-view__gutenberg-icon" aria-hidden="true">
              <span className="book-view__mini-cover">
                <span className="book-view__mini-spine" />
                <span className="book-view__mini-face" />
              </span>
            </span>
            <span className="book-view__gutenberg-copy">
              <strong>Read on Project Gutenberg</strong>
              <span>Opens in a new tab · free public domain text</span>
            </span>
            <span className="book-view__gutenberg-external" aria-hidden="true">
              ↗
            </span>
          </a>
        )}

        {saveError && (
          <ErrorState
            title="Couldn't save your session"
            onRetry={
              saveError === "complete" ? handleMarkComplete : saveSession
            }
          />
        )}

        {currentStatus !== ASSIGNMENT_STATUS.COMPLETED && (
          <section className="book-view__panel">
            <h2>Log a reading session</h2>
            <form className="book-view__form" onSubmit={handleSaveSession} noValidate>
              <div className="book-view__field">
                <label htmlFor="minutes-read">Minutes read</label>
                <input
                  id="minutes-read"
                  type="number"
                  min="1"
                  max="600"
                  value={minutes}
                  onChange={(e) => {
                    setMinutes(e.target.value);
                    if (minutesError) setMinutesError("");
                  }}
                  className={minutesError ? "input-invalid" : undefined}
                  aria-invalid={Boolean(minutesError)}
                  aria-describedby={minutesError ? "minutes-error" : undefined}
                />
                {minutesError && (
                  <p id="minutes-error" className="field-error" role="alert">
                    {minutesError}
                  </p>
                )}
              </div>
              <div className="book-view__field">
                <label htmlFor="stopped-at">
                  Where did you stop? <em>optional</em>
                </label>
                <input
                  id="stopped-at"
                  type="text"
                  value={stoppedAt}
                  placeholder="Chapter 3"
                  onChange={(e) => setStoppedAt(e.target.value)}
                />
              </div>
              <div className="book-view__field">
                <label htmlFor="session-notes">
                  Notes <em>optional — your teacher can see these</em>
                </label>
                <textarea
                  id="session-notes"
                  rows="4"
                  value={notes}
                  placeholder="What happened? What did you think about it?"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="book-view__save"
                disabled={saving}
              >
                Save reading session
              </button>
            </form>
          </section>
        )}

        <section className="book-view__sessions">
          <div className="book-view__sessions-head">
            <h2>Your reading sessions</h2>
            <span>
              {totalMinutes} min total · {sessions.length} reading session
              {sessions.length === 1 ? "" : "s"}
            </span>
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={26} strokeWidth={1.5} />}
              title="No sessions logged yet"
              description="Log your reading above and it'll appear here."
            />
          ) : (
            <ul className="book-view__session-list">
              {sessions.map((log) => (
                <li key={log.id} className="book-view__session">
                  <div className="book-view__session-top">
                    <span>
                      {formatSessionDate(log.logged_at)}
                      {log.stopped_at ? ` · stopped at ${log.stopped_at}` : ""}
                    </span>
                    <strong>{log.minutes} min</strong>
                  </div>
                  {log.notes && (
                    <p className="book-view__session-notes">{log.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {currentStatus !== ASSIGNMENT_STATUS.COMPLETED && (
          <footer className="book-view__footer">
            <span>Finished the assigned reading?</span>
            <button
              type="button"
              className="book-view__complete"
              onClick={handleMarkComplete}
              disabled={saving}
            >
              Mark as complete
            </button>
          </footer>
        )}

        {currentStatus === ASSIGNMENT_STATUS.COMPLETED && (
          <footer className="book-view__footer book-view__footer--done">
            <span>{STATUS_LABELS[ASSIGNMENT_STATUS.COMPLETED]}</span>
          </footer>
        )}
      </div>
    </main>
  );
}

export default AssignmentDetailPage;
