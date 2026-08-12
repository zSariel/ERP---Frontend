import "./PageHeader.css";

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div>{children}</div>
    </div>
  );
}

export default PageHeader;