import { formatDueDate } from "../utils";
import "./AssignmentHeader.css";

function AssignmentHeader({ classInfo, book, assignment, onEdit }) {
  const classLabel = [classInfo?.name, classInfo?.subject]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="assignment-header">
      <div className="assignment-header__top">
        <nav className="assignment-header__breadcrumb">
          {classLabel || "Class"} <span>›</span> Assignments
        </nav>
        {onEdit && (
          <button type="button" className="assignment-header__edit" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      <div className="assignment-header__main">
        <div className="assignment-header__icon" aria-hidden="true">
          <span className="assignment-header__book">
            <span className="assignment-header__book-spine" />
            <span className="assignment-header__book-face" />
          </span>
        </div>
        <div>
          <h1 className="assignment-header__title">{book?.title}</h1>
          <p className="assignment-header__subtitle">
            {[book?.author, assignment?.name].filter(Boolean).join(" · ")}
          </p>
          <p className="assignment-header__due">
            {formatDueDate(assignment?.due_date)}
          </p>
        </div>
      </div>
    </header>
  );
}

export default AssignmentHeader;
