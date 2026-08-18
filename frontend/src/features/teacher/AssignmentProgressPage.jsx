import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "../../api/client";
import LogoutButton from "../../components/LogoutButton";
import {
  ErrorState,
  ProgressTableSkeleton,
} from "../../components/states";
import AssignmentHeader from "./components/AssignmentHeader";
import StatsRow from "./components/StatsRow";
import StudentTable from "./components/StudentTable";
import { computeStats, sortProgressRows } from "./utils";
import "./AssignmentProgressPage.css";

function AssignmentProgressPage() {
  const { assignmentId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const json = await apiFetch(
        `/assignments/${assignmentId}?include_logs=true`
      );
      setData(json);
    } catch (err) {
      console.error(err);
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => computeStats(data?.progress || []), [data]);
  const sortedProgress = useMemo(
    () => sortProgressRows(data?.progress || [], data?.assignment?.due_date),
    [data]
  );

  if (loading) {
    return (
      <main className="assignment-detail">
        <ProgressTableSkeleton />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="assignment-detail">
        <ErrorState title="Couldn't load this assignment" onRetry={load} />
      </main>
    );
  }

  const { assignment } = data;
  const classId = assignment.class?.id || "";

  return (
    <main className="assignment-detail">
      <div className="assignment-detail__nav">
        <Link to={`/classes/${classId}`}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Back to class
        </Link>
        <LogoutButton />
      </div>
      <AssignmentHeader
        classInfo={assignment.class}
        book={assignment.book}
        assignment={assignment}
      />
      <StatsRow stats={stats} />
      <StudentTable progress={sortedProgress} />
    </main>
  );
}

export default AssignmentProgressPage;
