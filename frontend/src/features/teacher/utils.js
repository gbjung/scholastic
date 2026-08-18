function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatClassesGreeting(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Turn a class from the API into the props ClassCard uses. */
export function toClassCardItem(classItem) {
  return {
    id: classItem.id,
    displayName: [classItem.name, classItem.subject].filter(Boolean).join(" · "),
    studentCount: classItem.student_count ?? 0,
    activeCount: classItem.active_assignment_count ?? 0,
    signal: classItem.signal || { type: "assign", label: "Assign a book" },
  };
}

/** Still active if at least one student hasn't finished. */
export function isActiveAssignment(progress = []) {
  if (!progress.length) return true;
  return progress.some((row) => row.status !== "completed");
}

export function summarizeRoster(classes) {
  const classCount = classes.length;
  const studentCount = classes.reduce(
    (sum, item) => sum + (item.student_count ?? item.studentCount ?? 0),
    0
  );
  return `${classCount} class${classCount === 1 ? "" : "es"}, ${studentCount} student${
    studentCount === 1 ? "" : "s"
  }`;
}

export function classDisplayName(classItem) {
  if (!classItem) return "";
  return [classItem.name, classItem.subject].filter(Boolean).join(" · ");
}

export function todayInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysFromTodayLabel(isoDate) {
  if (!isoDate) return "";
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${isoDate}T12:00:00`));
  const days = Math.round((due - today) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Due today";
  if (days === 1) return "1 day from today";
  if (days > 1) return `${days} days from today`;
  const late = Math.abs(days);
  return `${late} day${late === 1 ? "" : "s"} ago`;
}

export function formatAssignmentDueLong(isoDate) {
  if (!isoDate) return "";
  const due = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(due);
}

export function formatDueShort(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

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

export function formatLogDate(isoDate) {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function buildAssignmentPreview({ bookTitle, scope, dueDate }) {
  if (!bookTitle) return "";
  const parts = [bookTitle];
  if (scope?.trim()) parts.push(scope.trim());
  let line = parts.join(" — ");
  if (dueDate) line += `, due ${formatAssignmentDueLong(dueDate)}`;
  return line;
}

export function countBehindOnAssignment(assignment, progress = []) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(assignment.due_date));
  if (due >= today) return 0;
  return progress.filter((row) => row.status !== "completed").length;
}

export function buildRosterRows(students) {
  return students.map((student) => ({
    ...student,
    fullName: [student.first_name, student.last_name].filter(Boolean).join(" "),
    initials: [student.first_name?.[0], student.last_name?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase(),
  }));
}

export const BOOK_SWATCHES = [
  "#993c1d",
  "#185fa5",
  "#27500a",
  "#6b4ea2",
  "#854f0b",
  "#0c447c",
];

export function bookSwatch(seed = "") {
  let hash = 0;
  for (const char of seed) hash = (hash + char.charCodeAt(0) * 17) % BOOK_SWATCHES.length;
  return BOOK_SWATCHES[hash];
}

export function studentName(student) {
  return [student.first_name, student.last_name].filter(Boolean).join(" ");
}

export function collectHistoryIds(progressResults) {
  const ids = new Set();
  for (const item of progressResults) {
    for (const row of item.progress || []) {
      const minutes = row.total_minutes || 0;
      if (row.status !== "not_started" || minutes > 0 || row.completed_at) {
        if (row.student_id) ids.add(row.student_id);
      }
    }
  }
  return ids;
}

export function formatRemovalWarningNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function median(values) {
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
