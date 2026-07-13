import Button from "./Button";

export default function MenuButton({
  icon,
  title,
  onClick,
  variant = "secondary",
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      style={{
        marginBottom: "12px",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "22px",
            textAlign: "center",
          }}
        >
          {icon}
        </span>

        <span
          style={{
            fontSize: "17px",
            fontWeight: "600",
            textAlign: "left",
          }}
        >
          {title}
        </span>
      </div>
    </Button>
  );
}