export default function Card({ children, style = {}, ...props }) {
  return (
    <div
      className="card"
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}