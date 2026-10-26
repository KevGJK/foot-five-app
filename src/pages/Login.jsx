import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../i18n/useLanguage";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import LegalFooter from "../components/LegalFooter";

export default function Login({ onSuccess }) {

  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

const [registerMode, setRegisterMode] = useState(false);

const [termsAccepted, setTermsAccepted] = useState(false);

const [loading, setLoading] = useState(false);

  async function login() {

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (window.location.pathname.startsWith("/join/")) {
      window.location.reload();
      return;
    }

    if (
  window.location.pathname.startsWith("/match/")
) {

  window.location.reload();
  return;

}

onSuccess();

  }


async function sendPasswordReset() {
  if (!email.trim()) {
    alert(t("allFieldsRequired"));
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim(),
    {
      redirectTo: `${window.location.origin}/reset-password`
    }
  );

  setLoading(false);

  if (error) {
    alert(t("passwordResetError"));
    return;
  }

  alert(t("passwordResetEmailSent"));
}


  async function register() {

if (
  !firstName.trim() ||
  !lastName.trim() ||
  !phone.trim() ||
  !email.trim() ||
  !password
) {
  alert(
    t("allFieldsRequired")
  );
  return;
}


const passwordIsValid =
  password.length >= 10 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

if (!passwordIsValid) {
  alert(t("passwordRequirements"));
  return;
}

if (!termsAccepted) {
  alert(
    t("legalAcceptanceRequired")
  );
  return;
}

    setLoading(true);

    const generatedName =
      firstName + " " + lastName.charAt(0).toUpperCase();

    const { error } = await supabase.auth.signUp({

        email,
        password,

options: {
  data: {
    display_name: generatedName,
    phone: phone.trim(),
    legal_terms_version: "1.0",
    legal_privacy_version: "1.0"
  }
}

      });

    if (error) {

      setLoading(false);
      alert(error.message);
      return;

    }

setLoading(false);

alert(
  t("accountCreatedSuccess")
);

    if (window.location.pathname.startsWith("/join/")) {

      window.location.reload();
      return;

    }

    setRegisterMode(false);
setPassword("");

if (
  window.location.pathname.startsWith("/match/")
) {

  window.location.reload();
  return;

}

onSuccess();

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

display:"block",

width:"140px",

margin:"0 auto 20px auto"

}}

/>

        <p
          style={{
            textAlign: "center",
            opacity: .75,
            marginBottom: "24px",
            lineHeight: 1.5
          }}
        >
          {t("loginDescription")}
        </p>

        {registerMode && (
          <>

            <Input
              placeholder={t("firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <Input
              placeholder={t("lastName")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ marginTop: "16px" }}
            />

<Input
  type="tel"
  placeholder={t("phoneNumber")}
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
  style={{ marginTop: "16px" }}
/>


          </>
        )}

        <Input
          placeholder={t("emailAddress")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            marginTop: registerMode ? "16px" : "0"
          }}
        />

        <Input
          type="password"
          placeholder={t("password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginTop: "16px" }}
        />

{!registerMode && (
  <div
    style={{
      marginTop: "10px",
      textAlign: "right",
      fontSize: "14px"
    }}
  >
    <button
      type="button"
      onClick={sendPasswordReset}
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        color: "#38bdf8",
        cursor: "pointer",
        font: "inherit"
      }}
    >
      {t("forgotPassword")}
    </button>
  </div>
)}

{registerMode && (
  <div
    style={{
      marginTop: "18px",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      fontSize: "14px",
      lineHeight: 1.5
    }}
  >
    <input
      type="checkbox"
      checked={termsAccepted}
      onChange={(e) =>
        setTermsAccepted(e.target.checked)
      }
      style={{
        marginTop: "3px"
      }}
    />

    <span>
      {t("legalAcceptance")}{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("termsOfUse")}
      </a>
      {" · "}
      <a
        href="/privacy"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("privacyPolicy")}
      </a>
    </span>
  </div>
)}


        <Button

          disabled={loading}

          onClick={
            registerMode
              ? register
              : login
          }

          style={{
            marginTop: "20px"
          }}

        >

          {

            loading

  ? t("loading")

  : registerMode

    ? t("createMyAccount")

    : t("signIn")

          }

        </Button>

        <Button

          variant="secondary"

          disabled={loading}

        onClick={() => {
  setRegisterMode(!registerMode);
  setTermsAccepted(false);
}}

          style={{
            marginTop: "12px"
          }}

        >

          {

            registerMode

  ? t("alreadyHaveAccount")

  : t("createAccount")

          }

        </Button>

      </Card>

      <LegalFooter />

    </Page>

  );

}