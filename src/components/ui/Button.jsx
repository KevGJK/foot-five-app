import { useLanguage } from "../../i18n/useLanguage";

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

  const { t } = useLanguage();

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

      {loading ? t("loading") : children}

    </button>

  );

}