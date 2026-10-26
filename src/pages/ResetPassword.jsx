
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../i18n/useLanguage";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LegalFooter from "../components/LegalFooter";

export default function ResetPassword({ recoveryValid }) {
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function updatePassword() {
    setMessage("");
    setErrorMessage("");

  if (!recoveryValid) {
    setErrorMessage(t("passwordResetError"));
    return;
  }

    if (!password || !confirmPassword) {
      setErrorMessage(t("allFieldsRequired"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("passwordsDoNotMatch"));
      return;
    }

    const passwordIsValid =
      password.length >= 10 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!passwordIsValid) {
      setErrorMessage(t("passwordRequirements"));
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password
    });

    setLoading(false);

    if (error) {
      setErrorMessage(t("passwordResetError"));
      return;
    }

    setMessage(t("passwordResetSuccess"));
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <Page>
      <Card
        style={{
          maxWidth: "460px",
          margin: "40px auto"
        }}
      >
        <img
          src="/icon-512.png"
          alt="Foot Five Manager"
          style={{
            display: "block",
            width: "140px",
            margin: "0 auto 20px auto"
          }}
        />

        <h2 style={{ textAlign: "center" }}>
          {t("resetPasswordTitle")}
        </h2>

        <p style={{ textAlign: "center", lineHeight: 1.5 }}>
          {t("resetPasswordDescription")}
        </p>

{!recoveryValid && (
  <p role="alert" style={{ color: "#f87171" }}>
    {t("passwordResetError")}
  </p>
)}

        <Input
          type="password"
          placeholder={t("newPassword")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginTop: "16px" }}
        />

        <Input
          type="password"
          placeholder={t("confirmPassword")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ marginTop: "16px" }}
        />

        {errorMessage && (
          <p role="alert" style={{ color: "#f87171" }}>
            {errorMessage}
          </p>
        )}

        {message && (
          <p role="status">{message}</p>
        )}

        {!message && (

          <Button
            disabled={loading || !recoveryValid}
            onClick={updatePassword}
            style={{ marginTop: "20px" }}
          >

            {loading
              ? t("loading")
              : t("resetPasswordButton")}
          </Button>
        )}

        {message && (
          <Button
            onClick={() => {
              window.location.href = "/";
            }}
            style={{ marginTop: "20px" }}
          >
            {t("signIn")}
          </Button>
        )}
      </Card>

      <LegalFooter />
    </Page>
  );
}
