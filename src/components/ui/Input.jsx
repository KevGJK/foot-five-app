
import { useState } from "react";

export default function Input({
  type = "text",
  style = {},
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  if (type !== "password") {
    return (
      <input
        type={type}
        className={`input ${className}`}
        style={style}
        {...props}
      />
    );
  }

  const { marginTop, ...inputStyle } = style;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        marginTop: marginTop || 0,
      }}
    >
      <input
        type={showPassword ? "text" : "password"}
        className={`input ${className}`}
        style={{
          ...inputStyle,
          width: "100%",
          boxSizing: "border-box",
          paddingRight: "48px",
        }}
        {...props}
      />

      <button
        type="button"
        aria-label={
          showPassword
            ? "Masquer le mot de passe"
            : "Afficher le mot de passe"
        }
        aria-pressed={showPassword}
        onClick={() => setShowPassword((visible) => !visible)}
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          border: "none",
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          opacity: 0.75,
        }}
      >
        {showPassword ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15.8 15.8 0 0 1-3.1 3.9" />
            <path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a9.8 9.8 0 0 0 3.1-.5" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
