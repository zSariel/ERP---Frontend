import "./ActionButtons.css";

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="action-buttons">
      <button type="button" onClick={onEdit}>✏️</button>
      <button type="button" onClick={onDelete}>🗑️</button>
    </div>
  );
}

export default ActionButtons;