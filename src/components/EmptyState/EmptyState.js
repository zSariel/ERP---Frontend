import "./EmptyState.css";

function EmptyState({ title = "Nenhum dado encontrado", description }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export default EmptyState;