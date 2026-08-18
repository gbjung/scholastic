import "./ClassRosterPanel.css";

function ClassRosterPanel({ students }) {
  if (students.length === 0) {
    return (
      <div className="class-roster-empty">
        <p>No students in this class yet</p>
        <p>Use manage roster to add students.</p>
      </div>
    );
  }

  return (
    <div className="class-roster-panel">
      <ul className="class-roster-list">
        {students.map((student) => (
          <li key={student.id} className="class-roster-row">
            <span className="class-roster-row__avatar" aria-hidden="true">
              {student.initials || "?"}
            </span>
            <span className="class-roster-row__name">{student.fullName}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClassRosterPanel;
