import Button from "./Button";
import Badge from "./Badge";

export default function MenuButton({
  icon,
  title,
  badge = null,
  onClick,
  variant = "secondary",
  style = {},
  centered = false,
}) {

  return (

    <Button
      variant={variant}
      onClick={onClick}
      style={{
  marginBottom: "12px",
  padding: "0 20px",
  ...style,
}}
    >
<div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: centered ? "center" : "flex-start",
    gap: "10px",
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
      textAlign: centered ? "center" : "left",
    }}
  >
    {title}
  </span>

  {badge > 0 && (
    <Badge color="danger" small>
      {badge}
    </Badge>
  )}
</div>
    </Button>
  );
}