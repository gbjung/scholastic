import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, Plus } from "lucide-react";
import "./ClassCard.css";

function SignalPill({ signal }) {
  if (signal.type === "behind") {
    return (
      <span className="class-signal class-signal--behind">
        <AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" />
        {signal.label}
      </span>
    );
  }
  if (signal.type === "on_track") {
    return (
      <span className="class-signal class-signal--on-track">
        <CheckCircle2 size={14} strokeWidth={1.75} aria-hidden="true" />
        {signal.label}
      </span>
    );
  }
  return (
    <span className="class-signal class-signal--assign">
      <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
      {signal.label}
    </span>
  );
}

function ClassCard({ classItem }) {
  const {
    id,
    displayName,
    studentCount,
    activeCount,
    signal,
  } = classItem;

  const assignmentsLabel =
    activeCount === 0
      ? "no active assignments"
      : `${activeCount} active assignment${activeCount === 1 ? "" : "s"}`;

  const ariaLabel = [
    displayName,
    `${studentCount} students`,
    assignmentsLabel,
    signal.label,
  ].join(", ");

  return (
    <Link
      to={`/classes/${id}`}
      className="class-card"
      aria-label={ariaLabel}
    >
      <div className="class-card__body">
        <h2 className="class-card__title">{displayName}</h2>
        <p className="class-card__meta">
          {studentCount} student{studentCount === 1 ? "" : "s"} · {assignmentsLabel}
        </p>
        <SignalPill signal={signal} />
      </div>
      <ChevronRight
        className="class-card__chevron"
        size={20}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </Link>
  );
}

export default ClassCard;
