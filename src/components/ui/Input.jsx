export default function Input({
  style = {},
  className = "",
  ...props
}) {
  return (
    <input
      className={`input ${className}`}
      style={style}
      {...props}
    />
  );
}