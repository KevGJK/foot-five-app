import { useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import BackButton from "../components/ui/BackButton";
import { createNotification } from "../services/notifications";

export default function JoinClub({
  goHome
}) {

  const initialCode =
    window.location.pathname
      .split("/")[2] || "";

  const [code, setCode] = useState(initialCode);

  const [loading, setLoading] = useState(false);

  async function join() {

    if (loading) {
      return;
    }

    setLoading(true);

    try {

      /*
       * --------------------------------------------------
       * UTILISATEUR CONNECTÉ
       * --------------------------------------------------
       */

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setLoading(false);
        return;
      }


      /*
       * --------------------------------------------------
       * REJOINDRE LE CLUB
       * --------------------------------------------------
       *
       * La recherche du club, la vérification de
       * l'adhésion et l'inscription sont maintenant
       * effectuées côté Supabase via une fonction
       * SECURITY DEFINER.
       *
       * Cela nous permettra ensuite d'activer RLS
       * sur clubs et club_members sans exposer ces
       * opérations au client.
       */

      const normalizedCode =
        code.trim().toUpperCase();

      if (!normalizedCode) {

        setLoading(false);

        alert(
          "Veuillez saisir un code d'invitation."
        );

        return;
      }


      const {
        data: joinData,
        error: joinError
      } = await supabase.rpc(
        "join_club_by_code",
        {
          p_invite_code:
            normalizedCode
        }
      );


      if (joinError) {
        throw joinError;
      }


      /*
       * --------------------------------------------------
       * RÉSULTAT DE LA FONCTION
       * --------------------------------------------------
       */

      const result =
        Array.isArray(joinData)
          ? joinData[0]
          : joinData;


      if (!result) {

        setLoading(false);

        alert(
          "Impossible de rejoindre le club."
        );

        return;
      }


      const clubId =
        result.club_id;

      const clubName =
        result.club_name;

      const alreadyMember =
        !result.joined_now;


      /*
       * --------------------------------------------------
       * RÉCUPÉRATION DU PROFIL
       * --------------------------------------------------
       *
       * Cette lecture reste autorisée par les policies
       * actuelles et nous permet de conserver le nom
       * utilisé dans la notification.
       */

      const {
        data: profile,
        error: profileError
      } = await supabase

        .from("profiles")

        .select(
          "active_club_id,display_name"
        )

        .eq(
          "id",
          user.id
        )

        .single();


      if (profileError) {

        throw profileError;

      }


      /*
       * --------------------------------------------------
       * NOTIFICATION :
       * NOUVEAU MEMBRE
       * --------------------------------------------------
       *
       * La notification est créée uniquement si
       * l'utilisateur vient réellement de rejoindre
       * le club.
       */

      if (!alreadyMember) {

        const managerIds =
          Array.isArray(
            result.manager_ids
          )
            ? result.manager_ids
            : [];


        const recipientIds =
          managerIds

            .filter(Boolean)

            .filter(
              profileId =>
                profileId !== user.id
            );


        if (
          recipientIds.length > 0
        ) {

          const displayName =
            profile?.display_name ||
            user.user_metadata?.display_name ||
            "Un nouveau membre";


          try {

            await createNotification({

              clubId:

                clubId,

              createdBy:

                user.id,

              createdByName:

                displayName,

              type:

                "new_member",

              title:

                "👤 Nouveau membre",

              message:

                `${displayName} vient de rejoindre le club.`,

              action:

                null,

              actionId:

                null,

              recipientIds

            });

          } catch (
            notificationError
          ) {

            /*
             * La notification est secondaire.
             * Une erreur ici ne doit jamais empêcher
             * l'adhésion au club.
             */

            console.error(
              "Erreur notification nouveau membre :",
              notificationError
            );

          }

        }

      }


      /*
       * --------------------------------------------------
       * FIN
       * --------------------------------------------------
       */

      setLoading(false);

      alert(
        alreadyMember
          ? "✅ Vous êtes déjà membre de ce club."
          : `✅ Club "${clubName}" rejoint`
      );

      window.location.href = "/";


    } catch (error) {

      console.error(
        "Erreur rejoindre club :",
        error
      );

      setLoading(false);

      const message =
        error?.message ||
        "Impossible de rejoindre le club";


      if (
        message.includes(
          "invalid_invite_code"
        )
      ) {

        alert(
          "Code d'invitation invalide."
        );

      } else if (
        message.includes(
          "not_authenticated"
        )
      ) {

        alert(
          "Vous devez être connecté pour rejoindre un club."
        );

      } else {

        alert(
          message
        );

      }

    }

  }


  return (

    <>

      <BackButton
        onClick={goHome}
      />

      <Page>

        <h1 className="page-title">

          ➕ Rejoindre un club

        </h1>


        <p
          style={{
            opacity: .75,
            marginBottom: "20px",
            textAlign: "center"
          }}
        >

          Saisissez le code d'invitation communiqué par le propriétaire du club.

        </p>


        <Card>

          <Input

            placeholder="Code d'invitation"

            value={code}

            onChange={
              e =>
                setCode(e.target.value)
            }

          />


          <Button

            loading={loading}

            onClick={join}

            style={{
              marginTop: "20px"
            }}

          >

            🔗 Rejoindre le club

          </Button>

        </Card>

      </Page>

    </>

  );

}