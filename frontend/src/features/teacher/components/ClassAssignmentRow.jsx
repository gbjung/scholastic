import { Link } from "react-router-dom";
import { bookSwatch, countBehindOnAssignment, formatDueShort } from "../utils";
import "./ClassAssignmentRow.css";

function ClassAssignmentRow({ classId, item }) {
  const { assignment, progress } = item;
  const book = assignment.book || {};
  const total = progress.length;
  const completed = progress.filter((row) => row.status === "completed").length;
  const behind = countBehindOnAssignment(assignment, progress);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const title = book.title || "Untitled book";
  const meta = [book.author, assignment.name].filter(Boolean).join(" · ");
  const ariaLabel = [
    title,
    meta,
    `${completed} of ${total} complete`,
    `due ${formatDueShort(assignment.due_date)}`,
    behind ? `${behind} behind` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      to={`/classes/${classId}/assignments/${assignment.id}`}
      className="class-assignment-row"
      aria-label={ariaLabel}
    >
      <span
        className="class-assignment-row__swatch"
        style={{ background: bookSwatch(`${title}-${book.author || ""}`) }}
        aria-hidden="true"
      />
      <div className="class-assignment-row__body">
        <div className="class-assignment-row__title">{title}</div>
        <div className="class-assignment-row__meta">{meta}</div>
        <div className="class-assignment-row__progress">
          <div className="class-assignment-row__bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
          <span>
            {completed} of {total} complete
          </span>
        </div>
      </div>
      <div className="class-assignment-row__side">
        <span>Due {formatDueShort(assignment.due_date)}</span>
        {behind > 0 && (
          <span className="class-assignment-row__behind">
            {behind} behind
          </span>
        )}
      </div>
    </Link>
  );
}

export default ClassAssignmentRow;
