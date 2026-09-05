import { useState } from "react";
import { supabase } from "../lib/supabase";
import { createNotification } from "../services/notifications";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useLanguage } from "../i18n/useLanguage";

export default function CreateMatch() {

  const { t, language } = useLanguage();

  const dateLocale = {
    fr: "fr-FR",
    en: "en-GB",
    es: "es-ES",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-PT",
  };

  const currentLocale =
    dateLocale[language] || "fr-FR";

  const [title, setTitle] =
    useState(t("defaultMatchTitle"));

  const [location, setLocation] =
    useState("");

  const [date, setDate] =
    useState("");

  const [created, setCreated] =
    useState(false);


  async function create() {

    try {

      const {
        data: { user }
      } = await supabase.auth.getUser();


      if (!user) {

        alert(
          t("userNotConnected")
        );

        return;

      }


      const {
        data: profile,
        error: profileError
      } = await supabase
        .from("profiles")
        .select(
          "active_club_id, display_name"
        )
        .eq(
          "id",
          user.id
        )
        .single();


      if (profileError) {

        alert(
          profileError.message
        );

        return;

      }


      if (!profile?.active_club_id) {

        alert(
          t("noActiveClub")
        );

        return;

      }


      if (!date) {

        alert(
          t("selectMatchDateTime")
        );

        return;

      }


      const matchDate =
        new Date(date);


      const {
        data: seasons,
        error: seasonsError
      } = await supabase
        .from("seasons")
        .select("*")
        .eq(
          "club_id",
          profile.active_club_id
        );


      if (seasonsError) {

        alert(
          seasonsError.message
        );

        return;

      }


      let season =
        seasons?.find(
          s => s.active
        );


      /*
       * Aucune saison active :
       * création automatique d'une saison
       * lors du premier match.
       */

      if (!season) {

        const {
          data: newSeason,
          error: createSeasonError
        } = await supabase
          .from("seasons")
          .insert({

            club_id:
              profile.active_club_id,

            name:
              `Saison ${matchDate.getFullYear()}`,

            start_date:
              matchDate
                .toISOString()
                .split("T")[0],

            end_date:
              "2099-12-31",

            active:
              true

          })
          .select()
          .single();


        if (createSeasonError) {

          alert(
            createSeasonError.message
          );

          return;

        }


        season =
          newSeason;

      }


      const {
        data,
        error
      } = await supabase
        .from("matches")
        .insert({

          title,

          location,

          match_date:
            matchDate.toISOString(),

          club_id:
            profile.active_club_id,

          season_id:
            season.id,

          organizer_id:
            user.id,

          max_players:
            10,

          status:
            "open"

        })
        .select()
        .single();


      if (error) {

        alert(
          error.message
        );

        return;

      }


      const formattedDate =
        matchDate.toLocaleDateString(
          currentLocale
        );


      const formattedTime =
        matchDate.toLocaleTimeString(
          currentLocale,
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );


      await createNotification({

        clubId:
          profile.active_club_id,

        createdBy:
          user.id,

        createdByName:
          profile.display_name,

        type:
          "NEW_MATCH",

        title:
          t("newMatchNotificationTitle"),

        message:
          t("newMatchNotificationMessage")
            .replace(
              "{title}",
              title
            )
            .replace(
              "{date}",
              formattedDate
            )
            .replace(
              "{time}",
              formattedTime
            ),

        action:
          "match",

        actionId:
          data.id

      });


      setCreated(true);

      setLocation("");

      setDate("");

    }
    catch (e) {

      console.error(e);

      alert(
        t("matchCreationError")
      );

    }

  }


  return (

    <Page>

      <h1 className="page-title">

        {t("createMatchTitle")}

      </h1>


      <Card>

        {created && (

          <div
            style={{
              background: "#25D366",
              color: "white",
              padding: "16px",
              borderRadius: "14px",
              marginBottom: "20px",
              fontWeight: "600"
            }}
          >

            {t("matchCreatedSuccess")}

          </div>

        )}


        <div className="section">

          <label className="label">

            {t("matchName")}

          </label>


          <Input

            value={title}

            onChange={
              (e) =>
                setTitle(
                  e.target.value
                )
            }

          />

        </div>


        <div className="section">

          <label className="label">

            {t("matchLocation")}

          </label>


          <Input

            placeholder={
              t("matchLocationPlaceholder")
            }

            value={location}

            onChange={
              (e) =>
                setLocation(
                  e.target.value
                )
            }

          />

        </div>


        <div className="section">

          <label className="label">

            {t("matchDateTime")}

          </label>


          <Input

            type="datetime-local"

            value={date}

            onChange={
              (e) =>
                setDate(
                  e.target.value
                )
            }

          />

        </div>


        <Button

          variant="primary"

          onClick={create}

          style={{
            marginTop: "20px"
          }}

        >

          {t("createMatchButton")}

        </Button>

      </Card>

    </Page>

  );

}