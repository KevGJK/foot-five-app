import Seasons from "./Seasons";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import BackButton from "../components/ui/BackButton";
import Members from "./Members";
import JoinClub from "./JoinClub";
import CreateMatch from "./CreateMatch";
import Matches from "./Matches";
import Statistics from "./Statistics";
import Ranking from "./Ranking";
import ClubSelector from "./ClubSelector";
import Administration from "./Administration";
import Settings from "./Settings";
import Notifications from "./Notifications";
import DashboardHeader from "../components/ui/DashboardHeader";
import { useStatistics } from "../hooks/useStatistics";
import { createNotification } from "../services/notifications";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import { useNotifications } from "../hooks/useNotifications";
import { useClub } from "../hooks/useClub";
import DashboardMenu from "../components/dashboard/DashboardMenu";
import DashboardStats from "../components/dashboard/DashboardStats";
import DashboardActions from "../components/dashboard/DashboardActions";

export default function Dashboard() {

const [page,setPage]=useState("loading");

const {stats,loadStats} = useStatistics();
const {club,setClub,logoUrl,setLogoUrl} = useClub();
const isManager =
  club?.role === "owner" ||
  club?.role === "admin";
const [showLogo,setShowLogo]=useState(false);
const [logoInput,setLogoInput]=useState(null);
const [activeSeason,setActiveSeason]=useState(null);
const [allSeasons,setAllSeasons]=useState([]);

const [loadingSeason,setLoadingSeason]=useState(false);

const [selectedSeason,setSelectedSeason]=useState(null);
const [seasonResults,setSeasonResults]=useState([]);
const [loadingResults,setLoadingResults]=useState(false);

const {unread: unreadCount,loadUnread} = useNotifications();

function reliability(){

if(
stats.rate>=90
){

return "🟢 Excellente";

}

if(
stats.rate>=70
){

return "🟡 Correcte";

}

return "🔴 À relancer";

}

async function load(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user){

setPage("join");

return;

}

const {

data:profile

}
=
await supabase

.from(
"profiles"
)

.select(
"active_club_id"
)

.eq(
"id",
user.id
)

.single();

if(

!profile?.active_club_id

){

setPage(
"club"
);

return;

}

const {

data

}
=
await supabase

.from(
"club_members"
)

.select(`
role,
clubs(
id,
name,
invite_code,
logo_url
)
`)

.eq(
"profile_id",
user.id
)

.eq(
"club_id",
profile.active_club_id
)

.single();

if(!data){

setPage(
"club"
);

return;

}

setClub(
data
);

setLogoUrl(
data?.clubs?.logo_url
||
null
);

await loadStats(
user.id
);

await loadUnread(
user.id
);

setPage("home");

}

async function changeLogo(e){

const file=
e.target.files?.[0];

if(
!file
)
return;

const name=

`${club.clubs.id}-${Date.now()}`;

const {

error:uploadError

}

=

await supabase

.storage

.from(
"club-logos"
)

.upload(

name,

file,

{

upsert:true

}

);

if(
uploadError
){

alert(
uploadError.message
);

return;

}

const {

data

}

=

supabase

.storage

.from(
"club-logos"
)

.getPublicUrl(
name
);

const url=
data.publicUrl;

const {

error

}

=

await supabase

.from(
"clubs"
)

.update({

logo_url:url

})

.eq(

"id",

club.clubs.id

);

if(
error
){

alert(
error.message
);

return;

}

setLogoUrl(
url
);

alert(
"✅ Logo mis à jour"
);

}

async function loadSeason(){

setLoadingSeason(true);

const {

data:{user}

}

=

await supabase.auth.getUser();

if(!user){

setLoadingSeason(false);

return;

}

const {

data:profile

}

=

await supabase

.from("profiles")

.select("active_club_id")

.eq("id",user.id)

.single();

if(!profile?.active_club_id){

setLoadingSeason(false);

return;

}

const { data: seasons } = await supabase
.from("seasons")
.select("*")
.eq("club_id", profile.active_club_id)
.order("start_date", { ascending: false });

setAllSeasons(seasons || []);

const active = seasons?.find(s => s.active);

setActiveSeason(active || null);

setLoadingSeason(false);

}

async function viewSeasonResults(season){

setLoadingResults(true);

setSelectedSeason(season);
setSeasonResults([]);

const {
data:{user}
}=await supabase.auth.getUser();

if(!user){

setLoadingResults(false);

return;

}

const {
data:profile
}=await supabase

.from("profiles")

.select("active_club_id")

.eq("id",user.id)

.single();

if(!profile?.active_club_id){

setLoadingResults(false);

return;

}

const {
data,
error
}=await supabase

.from("season_results")

.select(`
rank,
score,
wins,
draws,
losses,
played,
present,
absent,
reliability,
experience,
performance,
participation,
player_name
`)

.eq(
"season_id",
season.id
)

.eq(
"club_id",
profile.active_club_id
)

.order(
"rank",
{
ascending:true
}
);

if(error){

console.error(error);

alert(
"Impossible de charger le classement de cette saison."
);

setLoadingResults(false);

return;

}

setSeasonResults(
data || []
);

setLoadingResults(false);

setPage("season-results");

}

async function closeSeason(){

  if(!activeSeason){
    alert("Aucune saison active.");
    return;
  }

  const {
    data:{user}
  } = await supabase.auth.getUser();

  if(!user){
    return;
  }

  const {
    data:member
  } = await supabase
    .from("club_members")
    .select("club_id,role")
    .eq("profile_id",user.id)
    .eq("club_id",activeSeason.club_id)
    .single();

if(
  !member ||
  (
    member.role !== "owner" &&
    member.role !== "admin"
  )
){
  alert(
    "Seul le propriétaire ou un administrateur du club peut clôturer une saison."
  );
  return;
}

  const ok = window.confirm(
    `Clôturer définitivement la saison ${activeSeason.name} ?`
  );

  if(!ok){
    return;
  }

  const {
    data:openMatches,
    error:openMatchesError
  } = await supabase
    .from("matches")
    .select("id,title,match_date")
    .eq("season_id",activeSeason.id)
    .eq("status","open");

  if(openMatchesError){
    alert(openMatchesError.message);
    return;
  }

  if(openMatches && openMatches.length){

    const list = openMatches
      .map(m =>
        `${m.title} (${new Date(m.match_date).toLocaleDateString("fr-FR")})`
      )
      .join("\n");

    alert(
      `Impossible de clôturer la saison.

Il reste ${openMatches.length} match(s) non terminé(s).

${list}`
    );

    return;
  }

  const {
    data:members,
    error:membersError
  } = await supabase
    .from("club_members")
    .select(`
      profile_id,
      profiles(display_name)
    `)
    .eq("club_id",member.club_id);

  if(membersError){
    alert(membersError.message);
    return;
  }

  const {
    data:matches,
    error:matchesError
  } = await supabase
    .from("matches")
    .select(`
      id,
      winner,
      score_white,
      score_black
    `)
    .eq("season_id",activeSeason.id);

  if(matchesError){
    alert(matchesError.message);
    return;
  }

  const seasonMatchIds = (matches || []).map(
    m => m.id
  );

  const {
    data:attendances,
    error:attendancesError
  } = await supabase
    .from("attendances")
    .select(`
      profile_id,
      match_id,
      response
    `)
    .in(
      "match_id",
      seasonMatchIds.length
        ? seasonMatchIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  if(attendancesError){
    alert(attendancesError.message);
    return;
  }

  const {
    data:teams,
    error:teamsError
  } = await supabase
    .from("match_teams")
    .select("*")
    .in(
      "match_id",
      seasonMatchIds.length
        ? seasonMatchIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  if(teamsError){
    alert(teamsError.message);
    return;
  }

  const totalMatches = matches.length;

  const results = [];

  for(const m of members || []){

    const name =
      m.profiles?.display_name || "Joueur";

    const playerAttendances =
      (attendances || []).filter(
        a => a.profile_id === m.profile_id
      );

    const present =
      playerAttendances.filter(
        a => a.response === "present"
      ).length;

    const absent =
      playerAttendances.filter(
        a => a.response === "absent"
      ).length;

    const playerTeams =
      (teams || []).filter(
        t =>
          String(t.player_name)
            .trim()
            .toLowerCase()
          ===
          String(name)
            .trim()
            .toLowerCase()
      );

    const played = playerTeams.length;

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for(const team of playerTeams){

      const match =
        matches.find(
          m => m.id === team.match_id
        );

      if(!match){
        continue;
      }

      if(!match.winner){

        draws++;

      } else if(
        match.winner === team.team
      ){

        wins++;

      } else {

        losses++;

      }

    }

const participation =
    totalMatches
        ? played / totalMatches
        : 0;

const matchesWithResult =
    wins + draws;

const performance =
    matchesWithResult
        ? (
            wins +
            draws * 0.5
        ) / matchesWithResult
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

    const reliability =
      present + absent
        ? Math.round(
            present /
            (present + absent) *
            100
          )
        : 0;

    results.push({

      profile_id:m.profile_id,

      player_name:name,

      club_id:member.club_id,

      score,

      wins,

      draws,

      losses,

      played,

      present,

      absent,

      reliability,

      experience,

performance: Math.round(performanceScore),

participation: Math.round(participationScore),

    });

  }

  results.sort(
    (a,b) => b.score - a.score
  );

  results.forEach(
    (r,index) => {
      r.rank = index + 1;
    }
  );

  /*
   * Suppression d'une éventuelle archive
   * précédente pour cette saison.
   */

  const {
    error:deleteError
  } = await supabase
    .from("season_results")
    .delete()
    .eq("season_id",activeSeason.id);

  if(deleteError){
    alert(deleteError.message);
    return;
  }

  const {
    error:insertError
  } = await supabase
    .from("season_results")
    .insert(
      results.map(r => ({
        season_id:activeSeason.id,
        profile_id:r.profile_id,
        player_name:r.player_name,
        club_id:r.club_id,
        rank:r.rank,
        score:r.score,
        wins:r.wins,
        draws:r.draws,
        losses:r.losses,
        played:r.played,
        present:r.present,
        absent:r.absent,
        reliability:r.reliability,
        experience:r.experience,
performance:r.performance,
participation:r.participation
      }))
    );

  if(insertError){
    alert(insertError.message);
    return;
  }

  const {
    data:closedSeason,
    error:closeError
  } = await supabase
    .from("seasons")
    .update({
      active:false,
      closed_at:new Date().toISOString(),
      closed_by:user.id
    })
    .eq("id",activeSeason.id)
    .select();

  if(closeError){
    alert(closeError.message);
    return;
  }

  if(
    !closedSeason ||
    closedSeason.length === 0
  ){

    alert(
      "Aucune saison n'a été mise à jour."
    );

    return;
  }

  const start =
    new Date(activeSeason.end_date);

  start.setDate(
    start.getDate() + 1
  );

  const end =
    new Date(start);

  end.setFullYear(
    end.getFullYear() + 1
  );

  end.setDate(
    end.getDate() - 1
  );

  const seasonName =
    `${start.getFullYear()}-${end.getFullYear()}`;

const {
  error:createError
} = await supabase
  .from("seasons")
  .insert({
    club_id:member.club_id,
    name:seasonName,
    start_date:
      start.toISOString().slice(0,10),
    end_date:
      end.toISOString().slice(0,10),
    active:true
  });

  if(createError){

    alert(
      `La saison a été clôturée mais la nouvelle saison n'a pas pu être créée.

${createError.message}`
    );

    await loadSeason();

    return;
  }

  /*
   * --------------------------------------------------
   * NOTIFICATIONS DE SAISON
   * --------------------------------------------------
   *
   * Les notifications ne sont créées qu'après :
   *
   * 1. la clôture réussie de l'ancienne saison
   * 2. la création réussie de la nouvelle saison
   *
   * Elles sont envoyées à tous les membres du club.
   */

  const recipientIds =
    (members || [])
      .map(
        member =>
          member.profile_id
      )
      .filter(Boolean);

  const currentMember =
    (members || [])
      .find(
        member =>
          member.profile_id === user.id
      );

  const createdByName =
    currentMember?.profiles?.display_name ||
    user.user_metadata?.display_name ||
    "Foot Five Manager";


  /*
   * --------------------------------------------------
   * NOTIFICATION : FIN DE SAISON
   * --------------------------------------------------
   */

  if(recipientIds.length > 0){

    try {

      await createNotification({

        clubId:
          member.club_id,

        createdBy:
          user.id,

        createdByName,

        type:
          "season_closed",

        title:
          "🏁 Fin de saison",

        message:
          `La saison ${activeSeason.name} est terminée. Consultez les résultats de la saison.`,

        action:
          null,

        actionId:
          null,

        recipientIds

      });

    } catch(notificationError){

      /*
       * Une erreur de notification ne doit pas
       * annuler la clôture de saison.
       */

      console.error(
        "Erreur notification fin de saison :",
        notificationError
      );

    }


    /*
     * ------------------------------------------------
     * NOTIFICATION : NOUVELLE SAISON
     * ------------------------------------------------
     */

    try {

      await createNotification({

        clubId:
          member.club_id,

        createdBy:
          user.id,

        createdByName,

        type:
          "new_season",

        title:
          "⚽ Nouvelle saison",

        message:
          `La saison ${seasonName} est maintenant ouverte.`,

        action:
          null,

        actionId:
          null,

        recipientIds

      });

    } catch(notificationError){

      /*
       * Une erreur de notification ne doit pas
       * empêcher la nouvelle saison de fonctionner.
       */

      console.error(
        "Erreur notification nouvelle saison :",
        notificationError
      );

    }

  }

  await loadSeason();

  alert(
    `🎉 La saison ${activeSeason.name} est terminée.

La saison ${seasonName} est maintenant active.`
  );

}

async function refreshDashboard() {

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  await loadStats(user.id);
  await loadUnread(user.id);

}

useEffect(() => {

  load();
  loadSeason();

}, []);

useEffect(() => {

  if (page === "home") {
    refreshDashboard();
  }

}, [page]);

async function goHome(){

  await refreshDashboard();

  setPage("home");

}

function renderWithBack(content) {

  return (
    <>
      <BackButton onClick={goHome} />
      {content}
    </>
  );

}

function render(){

if(page==="club"){

return(
<>

<BackButton onClick={goHome} />

<ClubSelector
    goJoin={() => setPage("join")}
/>

</>

);

}

if(page==="join"){

return(

<JoinClub

goHome={()=>

setPage(
"home"
)

}

/>

);

}

if(page==="members"){

  return renderWithBack(
    <Members/>
  );

}

if(page==="create"){

  return renderWithBack(
    <CreateMatch/>
  );

}

if(page==="stats"){

  return renderWithBack(
    <Statistics/>
  );

}

if(page==="ranking"){

  return renderWithBack(
    <Ranking/>
  );

}

if(page==="matches"){

  return renderWithBack(
    <Matches/>
  );

}

if(page==="settings"){

  return renderWithBack(
    <Settings/>
  );

}

if(page==="notifications"){

  return renderWithBack(
    <Notifications/>
  );

}

if(page==="admin"){

  if(!isManager){

    return renderWithBack(

      <Page>

        <Card>

          <h2 className="section-title">
            🔒 Accès réservé
          </h2>

          <p>
            Cette section est réservée au propriétaire
            et aux administrateurs du club.
          </p>

        </Card>

      </Page>

    );

  }

  return(

    <Administration

      goHome={goHome}

      goSeasons={()=>setPage("seasons")}

    />

  );

}

if(page==="season-results"){

return(

<>

<BackButton
onClick={()=>setPage("seasons")}
>

← Retour aux saisons

</BackButton>

<Page>

<h1 className="page-title">

🏆 Classement final

</h1>

<Card>

<h2>

🏆 {selectedSeason?.name}

</h2>

<p
style={{
opacity:.7,
marginTop:"8px"
}}
>

📅{" "}

{selectedSeason &&
new Date(
selectedSeason.start_date
).toLocaleDateString("fr-FR")
}

{" → "}

{selectedSeason &&
new Date(
selectedSeason.end_date
).toLocaleDateString("fr-FR")
}

</p>

</Card>


<Card>

{loadingResults ? (

<p>
Chargement du classement...
</p>

) : seasonResults.length===0 ? (

<p>

Aucun résultat enregistré pour cette saison.

</p>

) : (

seasonResults.map((player,index)=>(

<div
  key={`${player.player_name}-${index}`}
  style={{
    padding:"18px",
    marginBottom:"14px",
    borderRadius:"16px",
    background:"rgba(255,255,255,.035)",
    border:"1px solid rgba(255,255,255,.12)",
    boxShadow:"0 4px 12px rgba(0,0,0,.18)"
  }}
>

  {/* Joueur + score */}
  <div
    style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
      gap:"12px"
    }}
  >

    <div
      style={{
        fontSize:"18px",
        fontWeight:"700",
        minWidth:0
      }}
    >

      {
        player.rank===1
          ? "🥇"
          : player.rank===2
          ? "🥈"
          : player.rank===3
          ? "🥉"
          : `#${player.rank}`
      }

      {" "}

      {player.player_name}

    </div>

    <div
      style={{
        fontSize:"20px",
        fontWeight:"700",
        whiteSpace:"nowrap"
      }}
    >
      {player.score}/100
    </div>

  </div>


  {/* Résultats sportifs */}
  <div
    style={{
      display:"grid",
      gridTemplateColumns:"repeat(2,1fr)",
      gap:"8px",
      marginTop:"14px"
    }}
  >

    <div
      style={{
        fontSize:"13px",
        opacity:.8
      }}
    >
      ⚽ <b>{player.played}</b> match{player.played>1 ? "s" : ""}
    </div>

    <div
      style={{
        fontSize:"13px",
        opacity:.8
      }}
    >
      🟢 <b>{player.wins}</b> victoire{player.wins>1 ? "s" : ""}
    </div>

    <div
      style={{
        fontSize:"13px",
        opacity:.8
      }}
    >
      ⚪ <b>{player.draws}</b> nul{player.draws>1 ? "s" : ""}
    </div>

    <div
      style={{
        fontSize:"13px",
        opacity:.8
      }}
    >
      🔴 <b>{player.losses}</b> défaite{player.losses>1 ? "s" : ""}
    </div>

  </div>


  {/* Assiduité */}
  <div
    style={{
      marginTop:"14px",
      paddingTop:"12px",
      borderTop:"1px solid rgba(255,255,255,.06)"
    }}
  >

    <div
      style={{
        display:"grid",
        gridTemplateColumns:"repeat(2,1fr)",
        gap:"8px"
      }}
    >

      <div
        style={{
          fontSize:"13px",
          opacity:.8
        }}
      >
        📅 Présence
        <br/>
        <b>{player.present}</b>
      </div>

      <div
        style={{
          fontSize:"13px",
          opacity:.8
        }}
      >
        ❌ Absences
        <br/>
        <b>{player.absent}</b>
      </div>

    </div>


    <div
      style={{
        marginTop:"10px",
        fontSize:"13px",
        opacity:.8
      }}
    >
      🎯 Fiabilité : <b>{player.reliability}/100</b>
    </div>

  </div>


  {/* Composantes du score */}
  <div
    style={{
      marginTop:"14px",
      paddingTop:"12px",
      borderTop:"1px solid rgba(255,255,255,.06)"
    }}
  >

    <div
      style={{
        fontSize:"13px",
        opacity:.65,
        marginBottom:"8px"
      }}
    >
      📊 Composantes du score
    </div>


    <div
      style={{
        display:"grid",
        gridTemplateColumns:"repeat(2,1fr)",
        gap:"8px"
      }}
    >

      <div
        style={{
          fontSize:"13px",
          opacity:.8
        }}
      >
        ⭐ Expérience
        <br/>
        <b>{player.experience}/100</b>
      </div>

      <div
        style={{
          fontSize:"13px",
          opacity:.8
        }}
      >
        📈 Performance
        <br/>
        <b>{player.performance}/100</b>
      </div>

      <div
        style={{
          fontSize:"13px",
          opacity:.8
        }}
      >
        📅 Participation
        <br/>
        <b>{player.participation}/100</b>
      </div>

    </div>

  </div>

</div>

))

)}

</Card>

</Page>

</>

);

}

if(page==="seasons"){

  if(!isManager){

    return renderWithBack(

      <Page>

        <Card>

          <h2 className="section-title">
            🔒 Accès réservé
          </h2>

          <p>
            La gestion et l'historique des saisons sont
            réservés au propriétaire et aux administrateurs
            du club.
          </p>

        </Card>

      </Page>

    );

  }

  return(

    <Seasons

      goBack={()=>setPage("admin")}

      activeSeason={activeSeason}

      allSeasons={allSeasons}

      loadingSeason={loadingSeason}

      closeSeason={closeSeason}

      viewResults={viewSeasonResults}

    />

  );

}

return(

<>

<Page>

<DashboardHeader
    club={club}
    logoUrl={logoUrl}
    showLogo={showLogo}
    setShowLogo={setShowLogo}
    logoInput={logoInput}
    setLogoInput={setLogoInput}
    changeLogo={changeLogo}
/>

<DashboardMenu
    setPage={setPage}
    unreadCount={unreadCount}
/>

<DashboardStats
  stats={stats}
  reliability={reliability}
/>

<DashboardActions
  setPage={setPage}
  clubRole={club?.role}
/>

</Page>

</>

);

}

if(page==="loading"){

return(

<div
style={{
padding:40
}}
>

⚽ Chargement...

</div>

);

}

return render();

}