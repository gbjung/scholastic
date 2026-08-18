import { useState } from "react";
import "./ReadingLogForm.css";

function ReadingLogForm({ assignmentId, minutesToday, minutesRead, onLog, disabled }) {
  const [minutes, setMinutes] = useState("");
  const inputId = `minutes-today-${assignmentId}`;

  async function handleSubmit(event) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value <= 0) return;
    await onLog(value);
    setMinutes("");
  }

  return (
    <form className="reading-log" onSubmit={handleSubmit}>
      <label className="reading-log__label" htmlFor={inputId}>
        Minutes read today
      </label>
      <input
        id={inputId}
        className="reading-log__input"
        type="number"
        min="1"
        value={minutes}
        placeholder={String(minutesToday || "")}
        disabled={disabled}
        onChange={(e) => setMinutes(e.target.value)}
      />
      <button className="reading-log__btn" type="submit" disabled={disabled}>
        Log
      </button>
      {minutesRead > 0 && (
        <span className="reading-log__total">{minutesRead} total</span>
      )}
    </form>
  );
}

export default ReadingLogForm;
