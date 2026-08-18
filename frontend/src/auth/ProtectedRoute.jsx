import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { AuthLoadingSkeleton } from "../components/states";

export function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-boot">
        <AuthLoadingSkeleton />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user?.role !== role) {
    return (
      <Navigate
        to={user?.role === "teacher" ? "/classes" : "/assignments"}
        replace
      />
    );
  }

  return children;
}

export function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-boot">
        <AuthLoadingSkeleton />
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={user?.role === "teacher" ? "/classes" : "/assignments"}
      replace
    />
  );
}
