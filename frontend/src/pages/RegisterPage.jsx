import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BookOpen, Users } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import "./LoginPage.css";
import "./RegisterPage.css";

const ROLES = [
  {
    id: "student",
    label: "Student",
    description: "Read and log your assignments",
    Icon: BookOpen,
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Assign books and track progress",
    Icon: Users,
  },
];

function RegisterPage() {
  const { register, isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
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

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate() {
    const next = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!email.trim()) next.email = "Email is required.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const nextUser = await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      });
      navigate(nextUser.role === "teacher" ? "/classes" : "/assignments", {
        replace: true,
      });
    } catch (err) {
      if (err.code === "email_exists") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists.",
        }));
      } else {
        console.error(err);
        setFormError(err.message || "Could not create your account.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-page__stack register-page__stack">
        <header className="login-brand">
          <div className="login-brand__mark" aria-hidden="true">
            <BookOpen size={22} strokeWidth={1.75} />
          </div>
        </header>

        <form className="login-card register-card" onSubmit={handleSubmit} noValidate>
          <header className="register-card__header">
            <h1 className="register-card__title">Create your account</h1>
            <p className="register-card__subtitle">
              This can&apos;t be changed later.
            </p>
          </header>

          <fieldset className="register-role">
            <legend className="register-role__legend">I&apos;m a</legend>
            <div
              className="register-role__grid"
              role="radiogroup"
              aria-label="Account type"
            >
              {ROLES.map(({ id, label, description, Icon }) => {
                const selected = role === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={
                      selected
                        ? "register-role__card register-role__card--selected"
                        : "register-role__card"
                    }
                    onClick={() => setRole(id)}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.75}
                      className="register-role__icon"
                      aria-hidden="true"
                    />
                    <span className="register-role__label">{label}</span>
                    <span className="register-role__desc">{description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="register-names">
            <div className="login-field">
              <label htmlFor="register-first-name">First name</label>
              <input
                id="register-first-name"
                name="firstName"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
                className={fieldErrors.firstName ? "input-invalid" : undefined}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={
                  fieldErrors.firstName ? "register-first-name-error" : undefined
                }
              />
              {fieldErrors.firstName && (
                <p id="register-first-name-error" className="field-error" role="alert">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>
            <div className="login-field">
              <label htmlFor="register-last-name">Last name</label>
              <input
                id="register-last-name"
                name="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
                className={fieldErrors.lastName ? "input-invalid" : undefined}
                aria-invalid={Boolean(fieldErrors.lastName)}
                aria-describedby={
                  fieldErrors.lastName ? "register-last-name-error" : undefined
                }
              />
              {fieldErrors.lastName && (
                <p id="register-last-name-error" className="field-error" role="alert">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              className={fieldErrors.email ? "input-invalid" : undefined}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "register-email-error" : undefined
              }
            />
            {fieldErrors.email && (
              <p id="register-email-error" className="field-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              className={fieldErrors.password ? "input-invalid" : undefined}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                [
                  "register-password-hint",
                  fieldErrors.password ? "register-password-error" : null,
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            />
            <p id="register-password-hint" className="register-field__hint">
              At least 8 characters.
            </p>
            {fieldErrors.password && (
              <p id="register-password-error" className="field-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError && (
            <p className="login-error" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="login-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default RegisterPage;
