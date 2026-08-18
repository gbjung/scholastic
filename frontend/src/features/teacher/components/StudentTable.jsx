import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EmptyState } from "../../../components/states";
import StatusBadge from "../../student/components/StatusBadge";
import { formatLogDate, formatRelativeTime } from "../utils";
import "./StudentTable.css";

function ReadingSessionsPanel({ logs, totalMinutes }) {
  const count = logs.length;
  if (!count) {
    return (
      <EmptyState
        title="No sessions yet"
        description="This student hasn't logged any reading for this assignment."
      />
    );
  }

  return (
    <div className="student-sessions">
      <p className="student-sessions__summary">
        {count} reading session{count === 1 ? "" : "s"} · {totalMinutes} min total
      </p>
      <ul className="student-sessions__list">
        {logs.map((log) => (
          <li key={log.id} className="student-sessions__item">
            <div className="student-sessions__top">
              <span>
                {formatLogDate(log.logged_at)}
                {log.stopped_at ? ` · stopped at ${log.stopped_at}` : ""}
              </span>
              <strong>{log.minutes} min</strong>
            </div>
            {log.notes && (
              <p className="student-sessions__notes">{log.notes}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressRow({ row }) {
  const [open, setOpen] = useState(false);
  const name = row.student
    ? `${row.student.first_name} ${row.student.last_name}`
    : "Unknown student";
  const notStarted = row.status === "not_started";
  const logs = row.reading_logs || [];
  const panelId = `progress-logs-${row.id || row.student_id}`;
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <>
      <tr className={open ? "student-table__row--open" : undefined}>
        <td>
          <button
            type="button"
            className="student-table__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <Chevron size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{name}</span>
          </button>
        </td>
        <td>
          <StatusBadge status={row.status} />
        </td>
        <td>{notStarted ? "—" : row.total_minutes ?? 0}</td>
        <td>{notStarted ? "—" : formatRelativeTime(row.updated_at)}</td>
      </tr>
      {open && (
        <tr className="student-table__expand">
          <td colSpan={4}>
            <div id={panelId} role="region" aria-live="polite">
              <ReadingSessionsPanel
                logs={logs}
                totalMinutes={row.total_minutes || 0}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StudentTable({ progress }) {
  if (!progress.length) {
    return (
      <div className="student-table-empty">
        <p>No students on this assignment yet</p>
      </div>
    );
  }

  return (
    <div className="student-table-wrap">
      <table className="student-table">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">Status</th>
            <th scope="col">Minutes</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {progress.map((row) => (
            <ProgressRow key={row.id || row.student_id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;
