import { AlertCircle, RefreshCw } from "lucide-react";
import "./states.css";

function ErrorState({ title, onRetry, description = "Something went wrong on our end." }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-state__row">
        <AlertCircle size={18} strokeWidth={1.75} aria-hidden="true" />
        <div className="error-state__copy">
          <p className="error-state__title">{title}</p>
          <p className="error-state__description">{description}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="error-state__retry" onClick={onRetry}>
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
