import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

import { useLanguage } from "../i18n/useLanguage";

export default function Statistics() {

  const { t, language } = useLanguage();

  const [players, setPlayers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [noSeason, setNoSeason] = useState(false);

  useEffect(() => {

    let cancelled = false;

    async function load() {

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        return;
      }

      const {
        data: profile
      } = await supabase
        .from("profiles")
        .select("active_club_id")
        .eq("id", user.id)
        .single();

      if (
        !profile?.active_club_id ||
        cancelled
      ) {
        return;
      }

      const {
        data: season
      } = await supabase
        .from("seasons")
        .select("id")
        .eq(
          "club_id",
          profile.active_club_id
        )
        .eq(
          "active",
          true
        )
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (!season) {
        setNoSeason(true);
        setPlayers([]);
        return;
      }

      setNoSeason(false);
      setMyId(user.id);

      const {
        data
      } = await supabase
        .from("club_members")
        .select(`
          profile_id,
          profiles(display_name)
        `)
        .eq(
          "club_id",
          profile.active_club_id
        );

      if (cancelled) {
        return;
      }

      const stats = [];

      for (
        const p
        of data || []
      ) {

        const {
          data: matches
        } = await supabase
          .from("attendances")
          .select(`
            response,
            match_id,
            matches(
              winner,
              season_id
            )
          `)
          .eq(
            "profile_id",
            p.profile_id
          );

        const seasonMatches =
          (matches || [])
            .filter(
              m =>
                m.matches &&
                m.matches.season_id ===
                  season.id
            );

        const present =
          seasonMatches.filter(
            x =>
              x.response === "present"
          ).length;

        const absent =
          seasonMatches.filter(
            x =>
              x.response === "absent"
          ).length;

        const {
          count: created
        } = await supabase
          .from("matches")
          .select("*", {
            count: "exact",
            head: true
          })
          .eq(
            "organizer_id",
            p.profile_id
          )
          .eq(
            "season_id",
            season.id
          );

        const rate =
          present + absent
            ? Math.round(
                present /
                (present + absent) *
                100
              )
            : 0;

        stats.push({

          id:
            p.profile_id,

          name:
  p.profiles?.display_name ||
  t("player"),

          created:
            created || 0,

          present,

          absent,

          rate

        });

      }

      stats.sort(
        (a, b) => {

          if (a.id === user.id) {
            return -1;
          }

          if (b.id === user.id) {
            return 1;
          }

          return (a.name || "").localeCompare(b.name || "", language);

        }
      );

      if (!cancelled) {
        setPlayers(stats);
      }

    }

    load();

    return () => {
      cancelled = true;
    };

    }, [language, t]);

  return (

    <Page>

      <h1 className="page-title">

        📊 {t("seasonStats")}

      </h1>

      {
        noSeason && (

          <Card>

            <p
              style={{
                textAlign: "center",
                margin: "10px 0"
              }}
            >

              🏆 {t("noActiveSeason")}

<br />

{t("createFirstMatchForSeason")}

            </p>

          </Card>

        )
      }

      {

        players.map(

          (p, index) => (

            <Card key={index}>

              <h3
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "-8px",
                  marginBottom: "20px"
                }}
              >

                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "20px"
                  }}
                >

                  {

                    p.id === myId

                      ?

                      "👤 " + p.name + " (" + t("myself") + ")"

                      :

                      "👤 " + p.name

                  }

                </span>

              </h3>

              <p>
                <b>📅 {t("matchesCreated")} :</b> {p.created}
              </p>

              <p style={{ marginTop: "8px" }}>
                <b>✅ {t("presences")} :</b> {p.present}
              </p>

              <p style={{ marginTop: "8px" }}>
                <b>❌ {t("dashboardAbsences")} :</b>{p.absent}
              </p>

              <div
                style={{
                  marginTop: "8px",
                  marginBottom: "14px"
                }}
              >

                <div
                  style={{
                    fontSize: "17px",
                    opacity: .7
                  }}
                >
                  {t("attendanceRate")}
                </div>

                <div
                  style={{
                    fontSize: "30px",
                    fontWeight: "700",
                    lineHeight: "1"
                  }}
                >

                  📈 {p.rate}%

                </div>

              </div>

              <p style={{ marginTop: "12px" }}>

                <b>🎯 {t("reliability")} :</b>

                {

  p.rate >= 90

    ?

    ` ${t("reliabilityExcellent")}`

    :

    p.rate >= 70

      ?

      ` ${t("reliabilityGood")}`

      :

      ` ${t("reliabilityNeedsAttention")}`

}

              </p>

            </Card>

          )

        )

      }

    </Page>

  );

}