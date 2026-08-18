/** Older auth helpers. Prefer api/client.js and AuthProvider. */
export {
  apiFetch,
  getAuthToken as getStoredToken,
  setAuthToken,
} from "./client";

export function getStoredAuth() {
  const token = localStorage.getItem("scholastic_token");
  const raw = localStorage.getItem("scholastic_user");
  return {
    token,
    user: raw ? JSON.parse(raw) : null,
  };
}

export function clearAuth() {
  localStorage.removeItem("scholastic_token");
  localStorage.removeItem("scholastic_user");
}
