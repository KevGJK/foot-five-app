export default function Badge({
    children,
    color = "primary"
}) {

    const colors = {
        primary: "#3DDC84",
        warning: "#F5A524",
        danger: "#E5484D",
        neutral: "#394055"
    };

    return (

        <span
            style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "999px",
                background: colors[color],
                color: color === "warning" ? "#111" : "#fff",
                fontWeight: 600,
                fontSize: "14px"
            }}
        >
            {children}
        </span>

    );

}