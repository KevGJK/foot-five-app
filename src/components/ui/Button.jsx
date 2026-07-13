export default function Button({
  children,
  variant = "primary",
  type = "button",
  fullWidth = true,
  loading = false,
  disabled = false,
  style = {},
  ...props
}) {

  return (

    <button
      type={type}
      className={`btn btn-${variant}`}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? "100%" : "auto",
        ...style
      }}
      {...props}
    >

      {loading ? "Chargement..." : children}

    </button>

  );

}