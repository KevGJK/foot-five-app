import { useLanguage } from "../i18n/useLanguage";

export default function LegalFooter() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        width: "100%",
        boxSizing: "border-box",
        marginTop: "20px",
        padding: "20px 8px 18px",
        borderTop: "1px solid rgba(148, 163, 184, 0.25)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          columnGap: "28px",
          rowGap: "12px",
          fontSize: "14px",
          lineHeight: 1.5,
        }}
      >
        <a
          href="/legal-notice"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          {t("legalNotice")}
        </a>

        <a
          href="/terms"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          {t("termsOfUse")}
        </a>

        <a
          href="/privacy"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          {t("privacyPolicy")}
        </a>

        <a
          href="/consent-management"
          style={{
            whiteSpace: "nowrap",
          }}
        >
          {t("consentManagement")}
        </a>
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "13px",
          opacity: 0.6,
        }}
      >
        Foot Five Manager • v1.0.0
      </div>
    </footer>
  );
}