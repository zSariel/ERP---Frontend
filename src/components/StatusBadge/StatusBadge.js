import "./StatusBadge.css";

function StatusBadge({ type = "default", children }) {
  return <span className={`status-badge status-${type}`}>{children}</span>;
}

export default StatusBadge;