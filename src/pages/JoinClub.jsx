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
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }


      /*
       * --------------------------------------------------
       * RECHERCHE DU CLUB
       * --------------------------------------------------
       */

      const normalizedCode =
        code.trim().toUpperCase();

      const {
        data: club,
        error: clubError
      } = await supabase

        .from("clubs")

        .select("*")

        .eq(
          "invite_code",
          normalizedCode
        )

        .single();


      if (clubError || !club) {

        setLoading(false);

        alert("Code invalide");

        return;

      }


      /*
       * --------------------------------------------------
       * VÉRIFICATION :
       * L'UTILISATEUR EST-IL DÉJÀ MEMBRE ?
       * --------------------------------------------------
       */

      const {
        data: existingMember,
        error: existingMemberError
      } = await supabase

        .from("club_members")

        .select("profile_id")

        .eq(
          "club_id",
          club.id
        )

        .eq(
          "profile_id",
          user.id
        )

        .maybeSingle();


      if (existingMemberError) {

        throw existingMemberError;

      }

      const alreadyMember =
        !!existingMember;


      /*
       * --------------------------------------------------
       * AJOUT AU CLUB
       * --------------------------------------------------
       */

      const {
        error: joinError
      } = await supabase

        .from("club_members")

        .upsert(

          {
            club_id: club.id,
            profile_id: user.id,
            role: "player"
          },

          {
            onConflict:
              "club_id,profile_id"
          }

        );


      if (joinError) {

        throw joinError;

      }


      /*
       * --------------------------------------------------
       * RÉCUPÉRATION DU PROFIL
       * --------------------------------------------------
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
       * DÉFINITION DU CLUB ACTIF
       * --------------------------------------------------
       */

      if (!profile?.active_club_id) {

        const {
          error: activeClubError
        } = await supabase

          .from("profiles")

          .update({
            active_club_id: club.id
          })

          .eq(
            "id",
            user.id
          );


        if (activeClubError) {

          throw activeClubError;

        }

      }


      /*
       * --------------------------------------------------
       * NOTIFICATION :
       * NOUVEAU MEMBRE
       * --------------------------------------------------
       *
       * On ne crée la notification que si le joueur
       * vient réellement de rejoindre le club.
       */

      if (!alreadyMember) {

        const {
          data: managers,
          error: managersError
        } = await supabase

          .from("club_members")

          .select(
            "profile_id,role"
          )

          .eq(
            "club_id",
            club.id
          )

          .in(
            "role",
            ["owner", "admin"]
          );


        if (managersError) {

          /*
           * La notification est secondaire.
           * Une erreur ici ne doit pas empêcher
           * le joueur de rejoindre le club.
           */

          console.error(
            "Erreur récupération administrateurs :",
            managersError
          );

        } else {

          const recipientIds =
            (managers || [])

              .map(
                member =>
                  member.profile_id
              )

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
                  club.id,

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
               * Une erreur de notification
               * ne doit pas empêcher l'adhésion.
               */

              console.error(
                "Erreur notification nouveau membre :",
                notificationError
              );

            }

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
        "✅ Club rejoint"
      );

      window.location.href = "/";


    } catch (error) {

      console.error(
        "Erreur rejoindre club :",
        error
      );

      setLoading(false);

      alert(
        error?.message ||
        "Impossible de rejoindre le club"
      );

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