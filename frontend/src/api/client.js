const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

let authToken = localStorage.getItem("scholastic_token");
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem("scholastic_token", token);
  else localStorage.removeItem("scholastic_token");
}

export function getAuthToken() {
  return authToken || localStorage.getItem("scholastic_token");
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    setAuthToken(null);
    localStorage.removeItem("scholastic_user");
    if (onUnauthorized) onUnauthorized();
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function loginRequest(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  return res.json();
}

export async function registerRequest({
  email,
  password,
  firstName,
  lastName,
  role,
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) {
    const err = new Error(
      body.error || "An account with this email already exists."
    );
    err.code = "email_exists";
    throw err;
  }
  if (!res.ok) {
    throw new Error(body.error || "Registration failed");
  }
  return body;
}

export async function fetchMe() {
  return apiFetch("/me");
}
