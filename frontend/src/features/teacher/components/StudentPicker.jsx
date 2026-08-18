import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { fetchStudents } from "../../../api/students";
import { EmptyState, ErrorState, SessionListSkeleton } from "../../../components/states";
import { studentName } from "../utils";

function StudentPicker({ selectedIds, selectedStudents, onToggle, onRemove }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const data = await fetchStudents({ q: debouncedQuery });
      if (id === requestId.current) setResults(data);
    } catch (err) {
      console.error(err);
      if (id === requestId.current) {
        setError(true);
        setResults([]);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedCount = selectedIds.size;
  const selectedList = useMemo(() => {
    const byId = new Map(selectedStudents.map((s) => [s.id, s]));
    for (const student of results) byId.set(student.id, student);
    return [...selectedIds]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => studentName(a).localeCompare(studentName(b)));
  }, [selectedIds, selectedStudents, results]);

  return (
    <section className="roster-card">
      <header className="roster-card__head">
        <h2>Students</h2>
        <p>{selectedCount} selected</p>
      </header>

      {selectedList.length > 0 && (
        <ul className="roster-chips" aria-label="Selected students">
          {selectedList.map((student) => (
            <li key={student.id}>
              <span className="roster-chip">
                {studentName(student)}
                <button
                  type="button"
                  className="roster-chip__remove"
                  onClick={() => onRemove(student.id)}
                  aria-label={`Remove ${studentName(student)}`}
                >
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="roster-search">
        <label htmlFor="roster-search-input">Search students</label>
        <input
          id="roster-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or email"
          autoComplete="off"
        />
      </div>

      <div
        className="roster-list"
        role="group"
        aria-label="Student choices"
        aria-busy={loading}
      >
        {loading && <SessionListSkeleton />}

        {!loading && error && (
          <ErrorState title="Couldn't load students" onRetry={load} />
        )}

        {!loading && !error && results.length === 0 && (
          <EmptyState
            title="No students match that search"
            description="Try a different name or email."
          />
        )}

        {!loading &&
          !error &&
          results.map((student) => {
            const checked = selectedIds.has(student.id);
            const name = studentName(student);
            const inputId = `student-${student.id}`;
            return (
              <label key={student.id} className="roster-row" htmlFor={inputId}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(student)}
                />
                <span className="roster-row__name">{name}</span>
                <span className="roster-row__email">{student.email}</span>
              </label>
            );
          })}
      </div>
    </section>
  );
}

export default StudentPicker;
