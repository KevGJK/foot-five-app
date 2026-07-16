import { useState } from "react";
import { supabase } from "../lib/supabase";

import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login({ onSuccess }) {

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

    onSuccess();
  }

  async function register() {

    if (!firstName || !lastName || !email || !password) {
      alert("Tous les champs sont obligatoires");
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

    alert("Compte créé avec succès");

    if (window.location.pathname.startsWith("/join/")) {

      window.location.reload();
      return;

    }

    setRegisterMode(false);
    setPassword("");

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

        <h1
          className="page-title"
          style={{
            marginBottom: "10px"
          }}
        >
          ⚽ Foot Five Manager
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: .75,
            marginBottom: "30px",
            lineHeight: 1.5
          }}
        >
          Organisez vos matchs,
          composez des équipes équilibrées
          et suivez vos statistiques.
        </p>

        {registerMode && (
          <>

            <Input
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <Input
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ marginTop: "16px" }}
            />

          </>
        )}

        <Input
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            marginTop: registerMode ? "16px" : "0"
          }}
        />

        <Input
          type="password"
          placeholder="Mot de passe"
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
            marginTop: "24px"
          }}

        >

          {

            loading

              ? "Chargement..."

              : registerMode

                ? "Créer mon compte"

                : "Se connecter"

          }

        </Button>

        <Button

          variant="secondary"

          disabled={loading}

          onClick={() =>
            setRegisterMode(!registerMode)
          }

          style={{
            marginTop: "14px"
          }}

        >

          {

            registerMode

              ? "J'ai déjà un compte"

              : "Créer un compte"

          }

        </Button>

      </Card>

    </Page>

  );

}