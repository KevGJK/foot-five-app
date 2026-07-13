import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

export default function Ranking(){

const [ranking,setRanking]=useState([]);

useEffect(()=>{

load();

},[]);

async function load(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user)
return;

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
)
return;

const {

data:season

}

=

await supabase

.from(

"seasons"

)

.select(

"id"

)

.eq(

"club_id",

profile.active_club_id

)

.eq(

"active",

true

)

.single();

if(
!season
)
return;

const {

data:members

}

=

await supabase

.from(
"club_members"
)

.select(`
profile_id,
profiles(
display_name
)
`)

.eq(
"club_id",
profile.active_club_id);

const {

data:matches

}

=

await supabase

.from(

"matches"

)

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

const {

data:att

}

=

await supabase

.from(
"attendances"
)

.select(`

match_id,

profile_id,

response,

matches(
season_id
)

`);

const seasonAttendances=

(att||[])

.filter(

a=>

a.matches

&&

a.matches.season_id

===

season.id

);

const {

data:teams

}

=

await supabase

.from(
"match_teams"
)

.select(`
*
`);

const seasonMatchIds = matches.map(m => m.id);

const seasonTeams = (teams || []).filter(
    t => seasonMatchIds.includes(t.match_id)
);

const totalMatches=

new Set(

seasonAttendances

?.map(
x=>
x.match_id
)

).size;

const rows=[];

for(

const m

of

members||[]

){

const name=

m.profiles?.display_name;

const attendances=

seasonAttendances

?.filter(

a=>

a.profile_id

===

m.profile_id

)

||

[];

const played =

seasonTeams

.filter(

t=>

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

.length

||

0;

const participation=

totalMatches

?

played

/

totalMatches

:

0;

const playerTeams =

seasonTeams.filter(

t=>

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

||

[];

const wins=

playerTeams.filter(

t=>{

const match=

matches?.find(

m=>

m.id===t.match_id

);

return (

match

&&

match.winner

===

t.team

);

}

).length;

const draws=

playerTeams.filter(

t=>{

const match=

matches?.find(

m=>

m.id===t.match_id

);

return (

match

&&

!match.winner

);

}

).length;

const losses=

Math.max(

0,

played-

wins-

draws

);

const winRate=

played

?

wins

/

played

:

0;

const volume=

Math.min(
1,
played/10
);

const score=

Math.round(

winRate

*

Math.pow(

participation,

0.6

)

*

volume

*

100

);

rows.push({

name,

wins,

draws,

losses,

played,

participation:

Math.round(
participation*100
),

score,

debug:{

played,

wins,

winRate,

participation,

volume

}

});

}

rows.sort(

(a,b)=>

b.score

-

a.score

);

setRanking(
rows
);

}

return(

<Page>

<h1>

🏆 Classement saison

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
Score global
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
<b>🎮 Matchs joués :</b> {r.played}
</p>

<p style={{marginTop:"6px", marginBottom:"12px"}}>
<b>📊 Participation :</b> {r.participation}%
</p>

<p style={{marginTop:"6px"}}>
<b>🟢 Victoires :</b> {r.wins}
</p>

<p style={{marginTop:"6px"}}>
<b>⚪ Matchs nuls :</b> {r.draws}
</p>

<p style={{marginTop:"6px"}}>
<b>🔴 Défaites :</b> {r.losses}
</p>

</Card>

)

)

}

</Page>

);

}