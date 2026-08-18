import "./StatsRow.css";

function StatsRow({ stats }) {
  return (
    <section className="stats-row">
      <div className="stats-row__item">
        <div className="stats-row__value">
          {stats.completed} / {stats.total}
        </div>
        <div className="stats-row__label">Completed</div>
      </div>
      <div className="stats-row__item">
        <div className="stats-row__value">{stats.inProgress}</div>
        <div className="stats-row__label">In progress</div>
      </div>
      <div className="stats-row__item">
        <div className="stats-row__value">{stats.notStarted}</div>
        <div className="stats-row__label">Not started</div>
      </div>
      <div className="stats-row__item">
        <div className="stats-row__value">{stats.medianMinutes}</div>
        <div className="stats-row__label">Median minutes</div>
      </div>
    </section>
  );
}

export default StatsRow;
