import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { fetchClasses } from "../../api/classes";
import LogoutButton from "../../components/LogoutButton";
import {
  ClassListSkeleton,
  EmptyState,
  ErrorState,
} from "../../components/states";
import ClassCard from "./components/ClassCard";
import {
  formatClassesGreeting,
  summarizeRoster,
  toClassCardItem,
} from "./utils";
import "./ClassesPage.css";

function ClassesPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const classList = await fetchClasses();
      setClasses(classList);
    } catch (err) {
      console.error(err);
      setError(true);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summaries = useMemo(
    () => classes.map(toClassCardItem),
    [classes]
  );
  const rosterLabel = useMemo(() => summarizeRoster(classes), [classes]);

  return (
    <main className="classes-page">
      <div className="classes-page__inner">
        <header className="classes-page__header">
          <div className="classes-page__heading">
            <h1>Your classes</h1>
            {!loading && !error && (
              <p>
                {formatClassesGreeting()} · {rosterLabel}
              </p>
            )}
          </div>
          <div className="classes-page__actions">
            <LogoutButton />
            <button
              type="button"
              className="classes-page__new"
              onClick={() => navigate("/classes/new")}
            >
              New class
            </button>
          </div>
        </header>

        {loading && <ClassListSkeleton />}

        {!loading && error && (
          <ErrorState title="Couldn't load your classes" onRetry={load} />
        )}

        {!loading && !error && summaries.length === 0 && (
          <EmptyState
            icon={<Users size={26} strokeWidth={1.5} />}
            title="Start your first class"
            description="Create a class, add your students, then assign them a book."
            action={
              <Link className="empty-state__action" to="/classes/new">
                New class
              </Link>
            }
          />
        )}

        {!loading && !error && summaries.length > 0 && (
          <section className="classes-list" aria-label="Classes" aria-live="polite">
            {summaries.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default ClassesPage;
