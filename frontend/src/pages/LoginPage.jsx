import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, UserRoundCheck } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import "./LoginPage.css";

/** Demo logins from backend/seed.py. Other emails in the brief are not seeded. */
const DEMO = {
  teacher: { email: "teacher@scholastic.test", password: "password123" },
  student: { email: "amara.okafor@scholastic.test", password: "password123" },
};

const ENABLE_DEMO = process.env.REACT_APP_ENABLE_DEMO === "true";

function LoginPage() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO.teacher.email);
  const [password, setPassword] = useState(DEMO.teacher.password);
  const [demoRole, setDemoRole] = useState("teacher");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="login-page" aria-live="polite">
        <p className="login-page__loading">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === "teacher" ? "/classes" : "/assignments"}
        replace
      />
    );
  }

  function fillDemo(role) {
    const creds = DEMO[role];
    setDemoRole(role);
    setEmail(creds.email);
    setPassword(creds.password);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const nextUser = await login(email.trim(), password);
      navigate(nextUser.role === "teacher" ? "/classes" : "/assignments", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-page__stack">
        <header className="login-brand">
          <div className="login-brand__mark" aria-hidden="true">
            <BookOpen size={22} strokeWidth={1.75} />
          </div>
          <h1 className="login-brand__name">Scholastic reading</h1>
          <p className="login-brand__tagline">
            Track what you&apos;re reading, together.
          </p>
        </header>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="login-error" role="alert">
            {error}
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="login-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>

        {ENABLE_DEMO && (
          <aside className="login-demo" aria-label="Demo sign-in">
            <h2 className="login-demo__heading">Just exploring?</h2>
            <p className="login-demo__copy">
              Pick a role — credentials fill in automatically.
            </p>
            <div className="login-demo__roles">
              <button
                type="button"
                className={
                  demoRole === "teacher"
                    ? "login-demo__btn login-demo__btn--active"
                    : "login-demo__btn"
                }
                onClick={() => fillDemo("teacher")}
                aria-pressed={demoRole === "teacher"}
              >
                <UserRoundCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                Teacher
              </button>
              <button
                type="button"
                className={
                  demoRole === "student"
                    ? "login-demo__btn login-demo__btn--active"
                    : "login-demo__btn"
                }
                onClick={() => fillDemo("student")}
                aria-pressed={demoRole === "student"}
              >
                <BookOpen size={16} strokeWidth={1.75} aria-hidden="true" />
                Student
              </button>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

export default LoginPage;
