import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

import { useLanguage } from "../i18n/useLanguage";

export default function Ranking(){

const { t } = useLanguage();

const [ranking,setRanking]=useState([]);

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
      .eq(
        "id",
        user.id
      )
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
      .single();

    if (!season || cancelled) {
      return;
    }

    const {
      data: members
    } = await supabase
      .from("club_members")
      .select(`
        profile_id,
        profiles(
          display_name
        )
      `)
      .eq(
        "club_id",
        profile.active_club_id
      );

    if (cancelled) {
      return;
    }

    const {
      data: matches
    } = await supabase
      .from("matches")
      .select(`
        id,
        winner,
        season_id
      `)
      .eq(
        "club_id",
        profile.active_club_id
      )
      .eq(
        "season_id",
        season.id
      );

    if (cancelled) {
      return;
    }

    const {
      data: teams
    } = await supabase
      .from("match_teams")
      .select("*");

    if (cancelled) {
      return;
    }

    const seasonMatchIds =
      (matches || []).map(
        m => m.id
      );

    const seasonTeams =
      (teams || []).filter(
        t =>
          seasonMatchIds.includes(
            t.match_id
          )
      );

    const totalMatches =
      (matches || []).length;

    const rows = [];

    for (
      const m
      of members || []
    ) {

      const name =
        m.profiles?.display_name;

      const played =
        seasonTeams
          .filter(
            t =>
              String(
                t.player_name
              )
                .trim()
                .toLowerCase()
              ===
              String(
                name
              )
                .trim()
                .toLowerCase()
          )
          .length;

      const participation =
        totalMatches
          ? played / totalMatches
          : 0;

      const playerTeams =
        seasonTeams.filter(
          t =>
            String(
              t.player_name
            )
              .trim()
              .toLowerCase()
            ===
            String(
              name
            )
              .trim()
              .toLowerCase()
        );

      const wins =
        playerTeams.filter(
          t => {

            const match =
              matches?.find(
                m =>
                  m.id ===
                  t.match_id
              );

            return (
              match &&
              match.winner ===
                t.team
            );

          }
        ).length;

      const draws =
  playerTeams.filter(
    t => {

      const match =
        matches?.find(
          m =>
            m.id ===
            t.match_id
        );

      return (
        match &&
        match.winner === "draw"
      );

    }
  ).length;

      const losses =
        Math.max(
          0,
          played -
          wins -
          draws
        );

      const matchesWithResult =
        wins +
        draws;

      const performance =
        matchesWithResult
          ? (
              wins +
              draws * 0.5
            ) /
            matchesWithResult
          : 0;

      const experience =
        Math.min(
          100,
          played * 10
        );

      const participationScore =
        participation * 100;

      const performanceScore =
        performance * 100;

      const score =
        Math.round(
          performanceScore * 0.60 +
          participationScore * 0.25 +
          experience * 0.15
        );

      rows.push({

        name,

        wins,

        draws,

        losses,

        played,

        participation:
          Math.round(
            participation * 100
          ),

        performance:
          Math.round(
            performanceScore
          ),

        experience,

        score

      });

    }

    rows.sort(
      (a,b) =>
        b.score -
        a.score
    );

    if (!cancelled) {
      setRanking(rows);
    }

  }

  load();

  return () => {
    cancelled = true;
  };

}, []);

return(

<Page>

<h1>

🏆 {t("seasonRanking")}

</h1>

{

ranking.map(

(r,index)=>(

<Card key={index}>

<h3
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginTop:"-8px",
marginBottom:"10px"
}}
>

<span>

{
index===0
? "🥇"
: index===1
? "🥈"
: index===2
? "🥉"
: `#${index+1}`
}

</span>

<span
style={{
fontWeight:"700",
fontSize:"18px"
}}
>

{r.name}

</span>

</h3>

<div
style={{
marginTop:"-8px",
marginBottom:"10px"
}}
>

<span
style={{
fontSize:"13px",
opacity:.7
}}
>

{t("globalScore")} : {r.score}/100

</span>

<div
style={{
fontSize:"30px",
fontWeight:"700",
marginTop:"0px",
lineHeight:"1"
}}
>
🏆 {r.score}
</div>

</div>

<p style={{marginTop:"14px", marginBottom:"10px"}}>
<b>🎮 {t("playedMatches")} :</b> {r.played}
</p>

<p style={{marginTop:"6px", marginBottom:"12px"}}>
<b>📊 {t("participation")} :</b> {r.participation}%
</p>

<p style={{marginTop:"6px"}}>
<b>🟢 {t("wins")} :</b> {r.wins}
</p>

<p style={{marginTop:"6px"}}>
<b>⚪ {t("drawMatches")} :</b> {r.draws}
</p>

<p style={{marginTop:"6px"}}>
<b>🔴 {t("losses")} :</b> {r.losses}
</p>

</Card>

)

)

}

</Page>

);

}