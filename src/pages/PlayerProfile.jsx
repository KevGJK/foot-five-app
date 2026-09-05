import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";

import { useLanguage } from "../i18n/useLanguage";

export default function PlayerProfile(){

const { t } = useLanguage();

const [player,setPlayer]=useState(null);

const [stats,setStats]=useState({

present:0,
absent:0,
wins:0,
losses:0,
ratio:0

});

useEffect(() => {

  let cancelled = false;

  async function load() {

    const id =
      window.location.pathname
        .split("/player/")[1];

    const {
      data: user
    } = await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        id
      )
      .single();

    if (cancelled) {
      return;
    }

    setPlayer(user);

    const {
      data
    } = await supabase
      .from("attendances")
      .select(`
        response,
        team,
        matches(
          winner
        )
      `)
      .eq(
        "profile_id",
        id
      );

    if (cancelled) {
      return;
    }

    const present =
      (data || [])
        .filter(
          x => x.response === "present"
        )
        .length;

    const absent =
      (data || [])
        .filter(
          x => x.response === "absent"
        )
        .length;

let wins = 0;
let losses = 0;

(data || []).forEach(a => {
  if (a.response !== "present") return;
  if (!a.matches) return;

  if (a.matches.winner === "draw") return;

  if (a.matches.winner === a.team) {
    wins++;
  } else if (a.matches.winner) {
    losses++;
  }
});

    const ratio =
      present
        ? Math.round(
            wins /
            present *
            100
          )
        : 0;

    setStats({
      present,
      absent,
      wins,
      losses,
      ratio
    });

  }

  load();

  return () => {
    cancelled = true;
  };

}, []);

return(

<div
style={{
padding:30
}}
>

<button

onClick={()=>

window.history.back()

}

>

🏠 {t("backToHome")}

</button>

<h1>

👤

{
player?.display_name
}

</h1>

<hr/>

<p>
{t("presence")} :
{stats.present}
</p>

<p>
{t("absences")} :
{stats.absent}
</p>

<p>
{t("wins")} :
{stats.wins}
</p>

<p>
{t("losses")} :
{stats.losses}
</p>

<p>
{t("winRatio")} :
{stats.ratio}
%
</p>

</div>

);

}