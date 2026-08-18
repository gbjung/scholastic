import { CircleDashed, CircleCheck, Play } from "lucide-react";
import { STATUS_LABELS } from "../constants";
import "./StatusBadge.css";

const STATUS_ICONS = {
  not_started: CircleDashed,
  in_progress: Play,
  completed: CircleCheck,
};

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  const Icon = STATUS_ICONS[status] || CircleDashed;
  const className = `status-badge status-badge--${String(status)
    .toLowerCase()
    .replace(/[_\s]+/g, "-")}`;

  return (
    <span className={className}>
      <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
      {label}
    </span>
  );
}

export default StatusBadge;
