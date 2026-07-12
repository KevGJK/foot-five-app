import Seasons from "./Seasons";
import { useEffect, useState } from "react";
import { RiLogoutBoxFill } from "react-icons/ri";
import { supabase } from "../lib/supabase";

import Members from "./Members";
import JoinClub from "./JoinClub";
import CreateMatch from "./CreateMatch";
import Matches from "./Matches";
import Statistics from "./Statistics";
import Ranking from "./Ranking";
import ClubSelector from "./ClubSelector";
import Administration from "./Administration";

export default function Dashboard() {

const [club,setClub]=useState(null);
const [page,setPage]=useState("loading");

const [stats,setStats]=useState({

created:0,
present:0,
absent:0,
rate:0

});

const [logoUrl,setLogoUrl]=useState(null);

const [showLogo,setShowLogo]=useState(false);
const [logoInput,setLogoInput]=useState(null);
const [activeSeason,setActiveSeason]=useState(null);
const [allSeasons,setAllSeasons]=useState([]);

const [loadingSeason,setLoadingSeason]=useState(false);

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

useEffect(()=>{

load();

loadSeason();

},[]);

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

setPage("home");

}

async function loadStats(userId){

const {

count:created

}
=
await supabase

.from("matches")

.select(
"*",
{
count:"exact",
head:true
}
)

.eq(
"organizer_id",
userId
);

const {

data

}
=
await supabase

.from("attendances")

.select(
"response"
)

.eq(
"profile_id",
userId);

const present=

data?.filter(
x=>
x.response==="present"
).length
||
0;

const absent=

data?.filter(
x=>
x.response==="absent"
).length
||
0;

const total=
present+
absent;

setStats({

created:
created||0,

present,

absent,

rate:

total

?

Math.round(

present
/
total
*
100

)

:

0

});

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

async function closeSeason(){

if(!activeSeason){
    alert("Aucune saison active.");
    return;
}

const {
    data:{user}
}=await supabase.auth.getUser();

if(!user){
    return;
}

const { data:member } =
await supabase
.from("club_members")
.select("club_id,role")
.eq("profile_id",user.id)
.single();

if(!member || member.role!=="owner"){
    alert("Seul le propriétaire du club peut clôturer une saison.");
    return;
}

const ok=window.confirm(
`Clôturer définitivement la saison ${activeSeason.name} ?`
);

if(!ok){
    return;
}

const { data:openMatches,error } =
await supabase
.from("matches")
.select("id,title,match_date")
.eq("season_id",activeSeason.id)
.eq("status","open");

if(error){
    alert(error.message);
    return;
}

if(openMatches && openMatches.length){

    const list=openMatches
        .map(m=>
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

const { error: deleteError } = await supabase
.from("season_results")
.delete()
.eq("season_id", activeSeason.id);

if (deleteError) {
    alert(deleteError.message);
    return;
}

console.log("Anciennes archives supprimées.");

const { data:members, error:membersError } = await supabase
.from("club_members")
.select(`
profile_id,
profiles(display_name)
`)
.eq("club_id", member.club_id);

if(membersError){
    alert(membersError.message);
    return;
}

const { data:matches, error:matchesError } = await supabase
.from("matches")
.select(`
id,
winner,
score_white,
score_black
`)
.eq("season_id", activeSeason.id);

if(matchesError){
    alert(matchesError.message);
    return;
}

const { data:attendances, error:attendancesError } = await supabase
.from("attendances")
.select(`
profile_id,
match_id,
response
`);

if(attendancesError){
    alert(attendancesError.message);
    return;
}

const { data:teams, error:teamsError } = await supabase
.from("match_teams")
.select("*");

if(teamsError){
    alert(teamsError.message);
    return;
}

console.log({
    members,
    matches,
    attendances,
    teams
});

const seasonMatchIds = matches.map(m => m.id);

const seasonTeams = teams.filter(
    t => seasonMatchIds.includes(t.match_id)
);

const results = [];

const totalMatches = matches.length;

for (const m of members) {

    const name = m.profiles?.display_name || "Joueur";

    const playerAttendances = attendances.filter(
        a => a.profile_id === m.profile_id
    );

    const present = playerAttendances.filter(
        a => a.response === "present"
    ).length;

    const absent = playerAttendances.filter(
        a => a.response === "absent"
    ).length;

    const playerTeams = seasonTeams.filter(
        t =>
            String(t.player_name).trim().toLowerCase() ===
            String(name).trim().toLowerCase()
    );

    const played = playerTeams.length;

    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const t of playerTeams) {

        const match = matches.find(
            x => x.id === t.match_id
        );

        if (!match)
            continue;

        if (!match.winner) {

            draws++;

        }
        else if (match.winner === t.team) {

            wins++;

        }
        else {

            losses++;

        }

    }

    const participation =
        totalMatches
            ? played / totalMatches
            : 0;

    const winRate =
        played
            ? wins / played
            : 0;

    const volume =
        Math.min(
            1,
            played / 10
        );

    const score = Math.round(

        winRate *

        Math.pow(
            participation,
            0.6
        )

        *

        volume

        *

        100

    );

    const reliability =
        present + absent

            ?

        Math.round(
            present /
            (present + absent)
            * 100
        )

            :

        0;

    results.push({

        profile_id: m.profile_id,

        player_name: name,

        club_id: member.club_id,

        score,

        wins,

        draws,

        losses,

        played,

        present,

        absent,

        reliability

    });

}

results.sort(
    (a, b) => b.score - a.score
);

results.forEach(
    (r, index) => r.rank = index + 1
);

console.table(results);

const { error: insertError } = await supabase
.from("season_results")
.insert(
    results.map(r => ({
        season_id: activeSeason.id,
        profile_id: r.profile_id,
        player_name: r.player_name,
        club_id: r.club_id,
        rank: r.rank,
        score: r.score,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        played: r.played,
        present: r.present,
        absent: r.absent,
        reliability: r.reliability
    }))
);

if(insertError){
    alert(insertError.message);
    return;
}

console.log("✅ Archives enregistrées");

console.log("activeSeason =", activeSeason);

const { data: closedSeason, error: closeError } = await supabase
.from("seasons")
.update({
    active: false,
    closed_at: new Date().toISOString(),
    closed_by: user.id
})
.eq("id", activeSeason.id)
.select();

console.log("Saison mise à jour :", closedSeason);

if (closeError) {
    console.error(closeError);
    alert(closeError.message);
    return;
}

if (!closedSeason || closedSeason.length === 0) {
    alert("Aucune saison n'a été mise à jour.");
    return;
}

console.log("✅ Saison clôturée");

const start = new Date(activeSeason.end_date);
start.setDate(start.getDate() + 1);

const end = new Date(start);
end.setFullYear(end.getFullYear() + 1);
end.setDate(end.getDate() - 1);

const seasonName = `${start.getFullYear()}-${end.getFullYear()}`;

const { error:createError } = await supabase
.from("seasons")
.insert({
    club_id: member.club_id,
    name: seasonName,
    start_date: start.toISOString().slice(0,10),
    end_date: end.toISOString().slice(0,10),
    active: true
});

if(createError){
    alert(createError.message);
    return;
}

console.log("✅ Nouvelle saison créée");

await loadSeason();

alert(`🎉 La saison ${activeSeason.name} est terminée.

La saison ${seasonName} est maintenant active.`);

}

function goHome(){

setPage(
"home"
);

}

function render(){

if(page==="club"){

return(
<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px"

}}

>

🏠 Retour à l'accueil

</button>

<ClubSelector

goJoin={()=>

setPage(
"join"
)

}

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

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Members/>

</>

);

}

if(page==="create"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<CreateMatch/>

</>

);

}

if(page==="stats"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Statistics/>

</>

);

}

if(page==="ranking"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Ranking/>

</>

);

}

if(page==="matches"){

return(

<>

<button
onClick={goHome}
style={{
width:"calc(100% - 40px)",
margin:"20px",
padding:"18px",
fontSize:"18px",
fontWeight:"600",
borderRadius:"12px",
cursor:"pointer"
}}
>

🏠 Retour à l'accueil

</button>

<Matches/>

</>

);

}

if(page==="admin"){

return(

<Administration

goHome={goHome}

goSeasons={()=>setPage("seasons")}

/>

);

}

if(page==="seasons"){

return(

<Seasons

goBack={()=>setPage("admin")}

activeSeason={activeSeason}

allSeasons={allSeasons}

loadingSeason={loadingSeason}

closeSeason={closeSeason}

/>

);

}

return(

<>

{

showLogo

&&

<div

onClick={()=>{

setShowLogo(
false
);

}}

style={{

position:"fixed",

inset:0,

background:"rgba(0,0,0,.95)",

display:"flex",

justifyContent:"center",

alignItems:"center",

zIndex:999

}}

>

<img

src={
logoUrl
}

style={{

maxWidth:"90%",

maxHeight:"90%",

borderRadius:20

}}

/>

</div>

}

<div
style={{
maxWidth:600,
margin:"auto",
padding:16
}}
>

<div
style={{

position:"relative",

textAlign:"center",

paddingTop:8,

marginBottom:14

}}
>

<button

onClick={async()=>{

await supabase.auth.signOut();

window.location.reload();

}}

style={{

position:"absolute",

right:8,

top:8,

background:"transparent",

border:"none",

cursor:"pointer",

display:"flex",

flexDirection:"column",

alignItems:"center",

padding:0,

width:48

}}

>

<RiLogoutBoxFill

size={48}

style={{

marginBottom:-2,

opacity:.92

}}

/>

<div
style={{

fontSize:11,

opacity:.7,

marginTop:2

}}
>

Me déconnecter

</div>

</button>

<div

style={{

fontWeight:"900",

marginBottom:12,

lineHeight:1.05

}}

>

<div
style={{

fontSize:22,

letterSpacing:3

}}
>

FOOT FIVE

</div>

<div
style={{

fontSize:18,

letterSpacing:5,

opacity:.85,

marginTop:2

}}
>

MANAGER

</div>

</div>

<div

onClick={()=>{

if(
logoUrl
){

setShowLogo(
true
);

}

}}

style={{

width:80,

height:80,

margin:"0 auto",

borderRadius:"50%",

overflow:"hidden",

background:"#161616",

display:"flex",

justifyContent:"center",

alignItems:"center",

cursor:

logoUrl

?

"pointer"

:

"default",

boxShadow:

"0 0 18px rgba(120,90,255,.25)"

}}

>

{

logoUrl

?

<img

src={
logoUrl
}

style={{

width:"100%",

height:"100%",

objectFit:"cover"

}}

/>

:

<div
style={{
fontSize:60
}}
>

⚽

</div>

}

</div>

{

club?.role==="owner"

&&

<button

onClick={()=>{

logoInput?.click();

}}

style={{

marginTop:10,

padding:"6px 12px",

fontSize:12,

borderRadius:10

}}

>

✏️ Modifier le logo

</button>

}

<h1
style={{

marginTop:10,

marginBottom:2,

fontSize:26,

lineHeight:1.15,

textAlign:"center",

wordBreak:"break-word"

}}
>

{
club?.clubs?.name
}

</h1>

<div
style={{

fontSize:18,

opacity:.75

}}
>

👑 {
club?.role
}

</div>

</div>

<hr/>

<input

ref={(el)=>{

setLogoInput(
el
);

}}

type="file"

accept="image/*"

onChange={changeLogo}

style={{
display:"none"
}}
/>

<button

onClick={()=>
setPage(
"matches"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

📅 Matchs

</button>

<button

onClick={()=>
setPage(
"create"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

➕ Créer un match

</button>

<button

onClick={()=>
setPage(
"members"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

👥 Membres

</button>

<button

onClick={()=>
setPage(
"stats"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

📊 Statistiques saison

</button>

<button

onClick={()=>

setPage(
"ranking"
)

}

style={{

width:"100%",

padding:15,

marginBottom:12

}}

>

🏆 Classement saison

</button>

<div

style={{

border:"1px solid #333",

padding:16,

borderRadius:16,

marginBottom:12

}}

>

<h3>

📈 Tableau de bord

</h3>

<p>

Matchs créés :
{
stats.created
}

</p>

<p>

Présences :
{
stats.present
}

</p>

<p>

Absences :
{
stats.absent
}

</p>

<p>

Taux présence :
{
stats.rate
}
%

</p>

<p>

Fiabilité :

{
reliability()
}

</p>

</div>

<div
style={{

display:"flex",

gap:12,

marginTop:12

}}

>

<button

onClick={()=>

setPage("club")

}

style={{

flex:1,

padding:15

}}

>

🏟 Clubs

</button>

<button

onClick={()=>

setPage("admin")

}

style={{

flex:1,

padding:15

}}

>

⚙ Administration

</button>

</div>

</div>

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