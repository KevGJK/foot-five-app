import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

export default function Statistics(){

const [players,setPlayers]=useState([]);

const [clubRole,setClubRole]=useState(null);

const [myId,setMyId]=useState(null);

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
data:member
}
=
await supabase

.from("club_members")

.select("club_id")

.eq(
"profile_id",
user.id
)

.single();

if(!member)
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

member.club_id

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

setClubRole(
member.role
);

setMyId(
user.id
);

const { data } = await supabase

.from("club_members")

.select(`
profile_id,
profiles(display_name)
`)

.eq("club_id", member.club_id);

const stats=[];

for(

const p

of

data||[]

){

const {

data:matches

}

=

await supabase

.from(

"attendances"

)

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

const seasonMatches=

(matches||[])

.filter(

m=>

m.matches

&&

m.matches.season_id

===

season.id

);

const present=

seasonMatches

.filter(
x=>
x.response==="present"
)

.length;

const absent=

seasonMatches

.filter(
x=>
x.response==="absent"
)

.length;


stats.push({

id:
p.profile_id,

name:

p.profiles
?.display_name

||

"Joueur",

created:0,

present,

absent,

rate:

present+absent

?

Math.round(

present

/

(

present+

absent

)

*

100

)

:

0

});

}

stats.sort(

(a,b)=>{

if(
a.id===myId
)
return -1;

if(
b.id===myId
)
return 1;

return (

a.name

||

""

)

.localeCompare(

b.name

||

"",

"fr"

);

}

);

setPlayers(
stats
);

}

return(

<Page>

<h1 className="page-title">

📊 Statistiques de la saison

</h1>

{

players.map(

(p,index)=>(

<Card key={index}>

<h3
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginTop:"-8px",
marginBottom:"20px"
}}
>

<span
style={{
fontWeight:"700",
fontSize:"20px"
}}
>

{

p.id===myId

?

"👤 "+p.name+" (Moi)"

:

"👤 "+p.name

}

</span>

</h3>

<p>
<b>📅 Matchs créés :</b> {p.created}
</p>

<p style={{marginTop:"8px"}}>
<b>✅ Présences :</b> {p.present}
</p>

<p style={{marginTop:"8px"}}>
<b>❌ Absences :</b> {p.absent}
</p>

<div
style={{
marginTop:"8px",
marginBottom:"14px"
}}
>

<div
style={{
fontSize:"17px",
opacity:.7
}}
>
Taux de présence
</div>

<div
style={{
fontSize:"30px",
fontWeight:"700",
lineHeight:"1"
}}
>

📈 {p.rate}%

</div>

</div>

<p style={{marginTop:"12px"}}>

<b>🎯 Fiabilité :</b>

{

p.rate>=90

?

" 🟢 Excellente"

:

p.rate>=70

?

" 🟡 Correcte"

:

" 🔴 À relancer"

}

</p>

</Card>

)

)

}

</Page>

);

}