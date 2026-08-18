export function formatDueDate(isoDate) {
  if (!isoDate) return "";
  const due = new Date(isoDate);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((due - now) / dayMs);
  const weekday = due.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (daysLeft < 0) {
    const late = Math.abs(daysLeft);
    return `Was due ${weekday} · ${late} day${late === 1 ? "" : "s"} late`;
  }
  if (daysLeft > 1) return `Due ${weekday} · ${daysLeft} days left`;
  if (daysLeft === 1) return `Due ${weekday} · 1 day left`;
  return `Due ${weekday} · today`;
}

export function formatDueCompact(isoDate) {
  if (!isoDate) return "";
  const due = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(isoDate);
  dueDay.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((dueDay - today) / dayMs);
  const weekday = due.toLocaleDateString(undefined, { weekday: "long" });
  const shortDate = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (daysLeft < 0) {
    const late = Math.abs(daysLeft);
    return `${late} day${late === 1 ? "" : "s"} late`;
  }
  if (daysLeft <= 7) {
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return `Due ${weekday} · 1 day`;
    return `Due ${weekday} · ${daysLeft} days`;
  }
  return `Due ${shortDate} · ${daysLeft} days`;
}

export function formatCompletedDate(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(isoDate) {
  if (!isoDate) return "--";
  const then = new Date(isoDate);
  const now = new Date();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

export function computeStats(progress) {
  const total = progress.length;
  const completed = progress.filter((row) => row.status === "completed").length;
  const inProgress = progress.filter((row) => row.status === "in_progress").length;
  const notStarted = progress.filter((row) => row.status === "not_started").length;
  const minutes = progress.map((row) => row.total_minutes || 0);

  return {
    completed,
    total,
    inProgress,
    notStarted,
    medianMinutes: median(minutes),
  };
}

export function sortProgressRows(progress, dueDate) {
  const today = startOfDay(new Date());
  const due = dueDate ? startOfDay(new Date(dueDate)) : null;
  const overdue = due && due < today;

  const rank = (row) => {
    if (row.status === "completed") return 3;
    if (overdue && row.status !== "completed") return 0;
    if (row.status === "not_started") return 1;
    return 2;
  };

  return [...progress].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    const nameA = `${a.student?.last_name || ""} ${a.student?.first_name || ""}`;
    const nameB = `${b.student?.last_name || ""} ${b.student?.first_name || ""}`;
    return nameA.localeCompare(nameB);
  });
}

export function formatLogDate(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function groupStudentAssignments(assignments) {
  const today = startOfDay(new Date());
  const overdue = [];
  const upcoming = [];
  const completed = [];

  for (const item of assignments) {
    const due = new Date(item.due_date);
    const status = item.status?.status;

    if (status === "completed") {
      completed.push(item);
    } else if (due < today) {
      overdue.push(item);
    } else {
      upcoming.push(item);
    }
  }

  upcoming.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  overdue.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  completed.sort(
    (a, b) =>
      new Date(b.status?.completed_at || b.due_date) -
      new Date(a.status?.completed_at || a.due_date)
  );

  return { overdue, upcoming, completed };
}

export function pickCurrentAssignment({ overdue, upcoming }) {
  const pool = [...overdue, ...upcoming];
  if (!pool.length) return null;
  return (
    pool.find((item) => item.status?.status === "in_progress") || pool[0]
  );
}

export function formatGreetingDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatMinutesAsDuration(totalMinutes) {
  const minutes = Math.max(0, totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours && rem) return `${hours} hour${hours === 1 ? "" : "s"} ${rem} minutes`;
  if (hours) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${rem} minute${rem === 1 ? "" : "s"}`;
}

export function summarizeStudentAssignments(assignments) {
  const { overdue, upcoming } = groupStudentAssignments(assignments);
  const toGo = upcoming.length + overdue.length;
  return `${toGo} assignment${toGo === 1 ? "" : "s"} to go`;
}

export function summarizeFinished(completed) {
  const books = completed.length;
  const minutes = completed.reduce(
    (sum, item) => sum + (item.status?.total_minutes || 0),
    0
  );
  return `Finished · ${books} book${books === 1 ? "" : "s"}, ${formatMinutesAsDuration(minutes)}`;
}
