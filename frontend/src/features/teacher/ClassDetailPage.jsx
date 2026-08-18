import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Users } from "lucide-react";
import { fetchClass, fetchClassAssignments } from "../../api/classes";
import LogoutButton from "../../components/LogoutButton";
import {
  ClassListSkeleton,
  EmptyState,
  ErrorState,
} from "../../components/states";
import ClassAssignmentRow from "./components/ClassAssignmentRow";
import ClassRosterPanel from "./components/ClassRosterPanel";
import { buildRosterRows, classDisplayName, isActiveAssignment } from "./utils";
import "./ClassDetailPage.css";

function ClassDetailPage() {
  const { id } = useParams();
  const [classItem, setClassItem] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [detail, classAssignments] = await Promise.all([
        fetchClass(id),
        fetchClassAssignments(id),
      ]);

      setClassItem(detail);
      setStudents(detail.students || []);
      setAssignments(classAssignments);
    } catch (err) {
      console.error(err);
      setError(true);
      setClassItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = classDisplayName(classItem);
  const activeCount = useMemo(
    () =>
      assignments.filter((item) => isActiveAssignment(item.progress)).length,
    [assignments]
  );
  const rosterRows = useMemo(() => buildRosterRows(students), [students]);

  if (loading) {
    return (
      <main className="class-detail">
        <div className="class-detail__inner">
          <ClassListSkeleton />
        </div>
      </main>
    );
  }

  if (error || !classItem) {
    return (
      <main className="class-detail">
        <div className="class-detail__inner">
          <ErrorState title="Couldn't load this class" onRetry={load} />
        </div>
      </main>
    );
  }

  const studentCount = students.length;

  return (
    <main className="class-detail">
      <div className="class-detail__inner">
        <div className="class-detail__nav">
          <Link className="class-detail__back" to="/classes">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            Your classes
          </Link>
          <LogoutButton />
        </div>

        <header className="class-detail__header">
          <h1>{displayName}</h1>
          <p>
            {studentCount} student{studentCount === 1 ? "" : "s"}
            {activeCount > 0
              ? ` · ${activeCount} active assignment${activeCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </header>

        <section className="class-detail__section" aria-labelledby="assignments-heading">
          <div className="class-detail__section-head">
            <h2 id="assignments-heading">Assignments</h2>
            <Link
              className="class-detail__action"
              to={`/classes/${id}/assignments/new`}
            >
              New assignment
            </Link>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={26} strokeWidth={1.5} />}
              title="No assignments yet"
              description="Assign a book to this class to start tracking progress."
              action={
                <Link
                  className="empty-state__action"
                  to={`/classes/${id}/assignments/new`}
                >
                  New assignment
                </Link>
              }
            />
          ) : (
            <div className="class-detail__assignments">
              {assignments.map((item) => (
                <ClassAssignmentRow
                  key={item.assignment.id}
                  classId={id}
                  item={item}
                />
              ))}
            </div>
          )}
        </section>

        <section className="class-detail__section" aria-labelledby="roster-heading">
          <div className="class-detail__section-head">
            <h2 id="roster-heading">
              Roster · {studentCount} student{studentCount === 1 ? "" : "s"}
            </h2>
            <Link className="class-detail__action" to={`/classes/${id}/roster`}>
              Manage roster
            </Link>
          </div>
          {rosterRows.length === 0 ? (
            <EmptyState
              icon={<Users size={26} strokeWidth={1.5} />}
              title="No students yet"
              description="Add students to this class so you can assign them reading."
              action={
                <Link
                  className="empty-state__action"
                  to={`/classes/${id}/roster`}
                >
                  Manage roster
                </Link>
              }
            />
          ) : (
            <ClassRosterPanel students={rosterRows} />
          )}
        </section>
      </div>
    </main>
  );
}

export default ClassDetailPage;
