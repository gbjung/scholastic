import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import "./states.css";

function NotFound() {
  const { isAuthenticated, user, loading } = useAuth();

  let href = "/login";
  let label = "Back to sign in";
  if (!loading && isAuthenticated) {
    if (user?.role === "teacher") {
      href = "/classes";
      label = "Back to your classes";
    } else {
      href = "/assignments";
      label = "Back to your reading";
    }
  }

  return (
    <main className="not-found">
      <div className="not-found__card">
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">We couldn&apos;t find that page</h1>
        <p className="not-found__description">
          The link may be old, or the page may have moved.
        </p>
        <Link className="not-found__link" to={href}>
          {label}
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
