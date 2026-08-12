import "./Button.css";

function Button({ children, variant = "primary", onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}

export default Button;