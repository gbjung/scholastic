import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { apiFetch } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import LogoutButton from "../../components/LogoutButton";
import {
  AssignmentListSkeleton,
  EmptyState,
  ErrorState,
} from "../../components/states";
import AssignmentCard from "./components/AssignmentCard";
import {
  formatGreetingDate,
  groupStudentAssignments,
  pickCurrentAssignment,
  summarizeFinished,
  summarizeStudentAssignments,
} from "./utils";
import "./AssignmentsListPage.css";

function AssignmentsListPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentName = user?.profile?.first_name || "there";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/assignments");
      setAssignments(data);
    } catch (err) {
      console.error(err);
      setError(true);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(
    () => groupStudentAssignments(assignments),
    [assignments]
  );
  const current = useMemo(() => pickCurrentAssignment(grouped), [grouped]);
  const alsoComingUp = useMemo(() => {
    const rest = [...grouped.overdue, ...grouped.upcoming];
    return rest.filter((item) => item.id !== current?.id);
  }, [grouped, current]);
  const toGoLabel = useMemo(
    () => summarizeStudentAssignments(assignments),
    [assignments]
  );
  const finishedLabel = useMemo(
    () => summarizeFinished(grouped.completed),
    [grouped.completed]
  );

  const hasAny =
    Boolean(current) ||
    alsoComingUp.length > 0 ||
    grouped.completed.length > 0;

  return (
    <main className="assignments-page">
      <div className="assignments-page__inner">
        <header className="assignments-page__header">
          <div className="assignments-page__header-top">
            <h1>Hi {studentName}</h1>
            <LogoutButton />
          </div>
          {!loading && !error && (
            <p>
              {formatGreetingDate()} · {toGoLabel}
            </p>
          )}
        </header>

        {loading && <AssignmentListSkeleton />}

        {!loading && error && (
          <ErrorState
            title="Couldn't load your assignments"
            onRetry={load}
          />
        )}

        {!loading && !error && !hasAny && (
          <EmptyState
            icon={<BookOpen size={26} strokeWidth={1.5} />}
            title="Nothing assigned yet"
            description="When a teacher assigns a book, it'll show up here with its due date."
          />
        )}

        {!loading && !error && hasAny && (
          <>
            {current && <AssignmentCard item={current} variant="featured" />}

            {alsoComingUp.length > 0 && (
              <section className="assignments-section">
                <h2 className="assignments-section__title">Also coming up</h2>
                {alsoComingUp.map((item) => (
                  <AssignmentCard key={item.id} item={item} variant="upcoming" />
                ))}
              </section>
            )}

            {grouped.completed.length > 0 && (
              <section className="assignments-section">
                <h2 className="assignments-section__title">{finishedLabel}</h2>
                {grouped.completed.map((item) => (
                  <AssignmentCard key={item.id} item={item} variant="completed" />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default AssignmentsListPage;
