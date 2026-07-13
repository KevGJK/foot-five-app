export default function Section({ title, children, style = {} }) {
  return (
    <div className="card" style={style}>
      {title && (
        <h2 className="section-title">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
}