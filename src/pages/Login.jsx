import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../i18n/useLanguage";

import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login({ onSuccess }) {

  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [registerMode, setRegisterMode] = useState(false);

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

  async function register() {

    if (!firstName || !lastName || !email || !password) {
      alert(
  t("allFieldsRequired")
);
      return;
    }

    setLoading(true);

    const generatedName =
      firstName + " " + lastName.charAt(0).toUpperCase();

    const { data, error } =
      await supabase.auth.signUp({

        email,
        password,

        options: {
          data: {
            display_name: generatedName
          }
        }

      });

    if (error) {

      setLoading(false);
      alert(error.message);
      return;

    }

    if (data?.user) {

      const { error: profileError } =
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            display_name: generatedName,
            email
          });

      if (profileError) {

        setLoading(false);
        alert(profileError.message);
        return;

      }

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

          onClick={() =>
            setRegisterMode(!registerMode)
          }

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

    </Page>

  );

}