import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import {
  formatCompletedDate,
  formatDueCompact,
} from "../utils";
import { ASSIGNMENT_STATUS } from "../constants";
import "./AssignmentCard.css";

const COVER_PALETTES = [
  { face: "#d7e4f5", spine: "#7f9fc4" },
  { face: "#f3ddd3", spine: "#c47b63" },
  { face: "#e4edd8", spine: "#7f9a5c" },
  { face: "#ebe0f2", spine: "#8f74a8" },
  { face: "#f5e6c8", spine: "#c29a4d" },
  { face: "#dceceb", spine: "#5f8f8c" },
];

function coverPalette(seed = "") {
  let hash = 0;
  for (const char of seed) {
    hash = (hash + char.charCodeAt(0) * 17) % COVER_PALETTES.length;
  }
  return COVER_PALETTES[hash];
}

function BookCover({ title, author, size = "sm", tone = "default" }) {
  const palette = coverPalette(`${title}-${author}`);
  const className = [
    "book-cover",
    `book-cover--${size}`,
    tone !== "default" ? `book-cover--${tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={{
        "--book-face": palette.face,
        "--book-spine": palette.spine,
      }}
      aria-hidden="true"
    >
      <div className="book-cover__spine" />
      <div className="book-cover__face">
        {size === "lg" && (
          <>
            <div className="book-cover__title">{title}</div>
            {author && <div className="book-cover__author">{author}</div>}
          </>
        )}
      </div>
    </div>
  );
}

function AssignmentCard({ item, variant = "upcoming" }) {
  const navigate = useNavigate();
  const classLabel = [item.class?.name, item.class?.subject]
    .filter(Boolean)
    .join(" · ");
  const status = item.status?.status || ASSIGNMENT_STATUS.NOT_STARTED;
  const due = new Date(item.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = status !== ASSIGNMENT_STATUS.COMPLETED && due < today;
  const minutesRead = item.status?.total_minutes || 0;
  const coverTone = overdue
    ? "overdue"
    : status === ASSIGNMENT_STATUS.IN_PROGRESS
      ? "progress"
      : "default";

  function openBookView(event) {
    event?.stopPropagation?.();
    navigate(`/assignments/${item.id}`);
  }

  if (variant === "completed") {
    const meta = [
      classLabel,
      minutesRead > 0 ? `${minutesRead} min read` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <button
        type="button"
        className="assignment-card assignment-card--completed"
        onClick={openBookView}
      >
        <div className="assignment-card__check" aria-hidden="true">
          ✓
        </div>
        <div className="assignment-card__main">
          <div className="assignment-card__title">{item.book?.title}</div>
          <div className="assignment-card__meta">{meta}</div>
        </div>
        <span className="assignment-card__date">
          {formatCompletedDate(item.status?.completed_at || item.due_date)}
        </span>
      </button>
    );
  }

  if (variant === "featured") {
    return (
      <article className="assignment-card assignment-card--featured">
        <BookCover
          title={item.book?.title}
          author={item.book?.author}
          size="lg"
          tone={coverTone}
        />

        <div className="assignment-card__featured-body">
          <div className="assignment-card__class">{classLabel}</div>
          <h2 className="assignment-card__title">{item.book?.title}</h2>
          <p className="assignment-card__meta">
            {[item.book?.author, item.name].filter(Boolean).join(" · ")}
          </p>

          <div className="assignment-card__featured-meta">
            <StatusBadge status={status} />
            <span
              className={`assignment-card__due ${
                overdue ? "assignment-card__due--overdue" : ""
              }`}
            >
              {formatDueCompact(item.due_date)}
            </span>
          </div>

          <div className="assignment-card__featured-actions">
            <button
              type="button"
              className="assignment-card__cta"
              onClick={openBookView}
            >
              Keep reading →
            </button>
            {minutesRead > 0 && (
              <span className="assignment-card__stats">
                {minutesRead} min so far
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <button
      type="button"
      className={`assignment-card assignment-card--upcoming ${
        overdue ? "assignment-card--overdue" : ""
      }`}
      onClick={openBookView}
    >
      <BookCover
        title={item.book?.title}
        author={item.book?.author}
        size="sm"
        tone={coverTone}
      />

      <div className="assignment-card__main">
        <div className="assignment-card__title">{item.book?.title}</div>
        <div className="assignment-card__meta">
          {[classLabel, item.name].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="assignment-card__side">
        <StatusBadge status={status} />
        <span
          className={`assignment-card__due ${
            overdue ? "assignment-card__due--overdue" : ""
          }`}
        >
          {formatDueCompact(item.due_date)}
        </span>
      </div>

      <span className="assignment-card__chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

export default AssignmentCard;
