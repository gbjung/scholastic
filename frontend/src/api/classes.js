import { apiFetch } from "./client";

export function fetchClasses() {
  return apiFetch("/classes");
}

export function fetchClass(classId) {
  return apiFetch(`/classes/${classId}`);
}

export function fetchClassAssignments(classId) {
  return apiFetch(`/classes/${classId}/assignments`);
}

export function createClass({ name, subject }) {
  return apiFetch("/classes", {
    method: "POST",
    body: JSON.stringify({ name, subject: subject || null }),
  });
}

export function fetchClassStudents(classId, { includeActivity = false } = {}) {
  const qs = includeActivity ? "?include_activity=true" : "";
  return apiFetch(`/classes/${classId}/students${qs}`);
}

export function updateClassStudents(classId, { add = [], remove = [] } = {}) {
  return apiFetch(`/classes/${classId}/students`, {
    method: "PUT",
    body: JSON.stringify({ add, remove }),
  });
}

export function fetchTeacherAssignments() {
  return apiFetch("/assignments");
}

export function fetchAssignmentProgress(assignmentId) {
  return apiFetch(`/assignments/${assignmentId}`);
}
