import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "./LogoutButton.css";

function LogoutButton({ className = "" }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <button
      type="button"
      className={`logout-button ${className}`.trim()}
      onClick={handleLogout}
    >
      Log out
    </button>
  );
}

export default LogoutButton;
