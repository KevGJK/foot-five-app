import Button from "./Button";
import Badge from "./Badge";

export default function MenuButton({
  icon,
  title,
  badge = null,
  onClick,
  variant = "secondary",
  style = {},
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
          display: "grid",
          gridTemplateColumns: "36px 1fr auto",
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

{
  badge > 0 && (
    <Badge
      color="danger"
      small
    >
      {badge}
    </Badge>
  )
}

      </div>
    </Button>
  );
}