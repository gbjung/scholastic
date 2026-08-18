import { apiFetch } from "./client";

/** Search students by name or email. `q` is sent as `search`. */
export function fetchStudents({ q = "" } = {}) {
  const params = new URLSearchParams();
  const query = q.trim();
  if (query) params.set("search", query);
  const qs = params.toString();
  return apiFetch(`/students${qs ? `?${qs}` : ""}`);
}
