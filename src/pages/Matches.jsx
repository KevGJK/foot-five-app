import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Matches() {

const [matches,setMatches]=useState([]);
const [user,setUser]=useState(null);
const [clubRole,setClubRole]=useState(null);
const [guestName,setGuestName]=useState({});
const [editingGuest,setEditingGuest]=useState(null);
const [editGuestName,setEditGuestName]=useState("");
const [editGuestLevel,setEditGuestLevel]=useState(3);
const [guestLevel,setGuestLevel]=useState({});
const [memberLevels,setMemberLevels]=useState({});
const [reload,setReload]=useState(false);
const [teams,setTeams]=useState({});
const [expanded,setExpanded]=useState(null);
const [scoreWhite,setScoreWhite]=useState({});
const [scoreBlack,setScoreBlack]=useState({});

const levelLabels={

1:"1️⃣ Débutant",

2:"2️⃣ Loisir",

3:"3️⃣ Intermédiaire",

4:"4️⃣ Confirmé",

5:"5️⃣ Avancé",

6:"6️⃣ Expert",

7:"7️⃣ Élite"

};

useEffect(()=>{

load();

},[reload]);

async function load(){

const {
data:{user}
}
=
await supabase.auth.getUser();

setUser(user);

if(!user)
return;

const {
data:member
}
=
await supabase

.from("club_members")

.select(`
club_id,
role
`)

.eq(
"profile_id",
user.id)

.single();

if(!member)
return;

setClubRole(
member.role
);

const {

data:levels

}

=

await supabase

.from(

"club_members"

)

.select(

"profile_id, level"

)

.eq(

"club_id",

member.club_id

);

const map={};

(levels||[]).forEach(

m=>{

map[m.profile_id]=

m.level

||

3;

}

);

setMemberLevels(map);

const {
data
}
=
await supabase

.from("matches")

.select(`
*,
seasons(
active
),
attendances(
id,
profile_id,
response,
team,
created_at,
guest_name,
guest_level,
profiles(
display_name
)
)
`)

.eq(
"club_id",
member.club_id)

.order(
"match_date");

setMatches(
data||[]
);

const restored={};

(data||[])

.forEach(

match=>{

const white=[];

const black=[];

(match.attendances||[])

.forEach(

a=>{

if(
a.team==="white"
){

white.push({

name:
playerName(a),

level:

a.guest_name

?

Number(a.guest_level || 3)

:

3

});

}

if(
a.team==="black"
){

black.push({

name:
playerName(a),

level:

a.guest_name

?

Number(a.guest_level || 3)

:

3

});

}

}

);

if(
white.length
||
black.length
){

restored[
match.id
]={

A:white,

B:black,

scoreA:

white.reduce(
(s,p)=>
s+p.level,
0
),

scoreB:

black.reduce(
(s,p)=>
s+p.level,
0
)

};

}

}

);

setTeams(
restored
);

}

function seasonLocked(match){

return match.seasons && !match.seasons.active;

}

async function answer(
matchId,
response
){

await supabase

.from(
"attendances"
)

.upsert(

{

match_id:matchId,

profile_id:user.id,

response

},

{

onConflict:
"match_id,profile_id"

}

);

setReload(
v=>!v
);

}

async function addGuest(matchId){

const name=
guestName[matchId];

if(!name){

alert(
"Nom obligatoire"
);

return;

}

await supabase

.from(
"attendances"
)

.insert({

match_id:matchId,

guest_name:name,

guest_level:Number(
guestLevel[matchId]||3
),

response:"present"

});

setGuestName({

...guestName,

[matchId]:""

});

setGuestLevel({

...guestLevel,

[matchId]:3

});

setReload(
v=>!v
);

}

function startEditGuest(attendance){

setEditingGuest(attendance.id);

setEditGuestName(attendance.guest_name);

setEditGuestLevel(Number(attendance.guest_level || 3));

}

async function saveGuest(){

await supabase

.from("attendances")

.update({

guest_name:editGuestName,

guest_level:Number(editGuestLevel)

})

.eq("id",editingGuest);

setEditingGuest(null);

setReload(v=>!v);

}

async function removeGuest(attendanceId){

const ok=window.confirm(

"Retirer cet invité du match ?"

);

if(!ok){

return;

}

await supabase

.from("attendances")

.delete()

.eq("id",attendanceId);

setReload(v=>!v);

}

async function removeMatch(id){

const ok=
window.confirm(
"Supprimer ce match ?"
);

if(!ok)
return;

await supabase

.from(
"matches"
)

.delete()

.eq(
"id",
id);

setReload(
v=>!v
);

}

function present(list){

return list

.filter(
a=>
a.response==="present"
)

.sort(

(a,b)=>

new Date(
a.created_at
)

-

new Date(
b.created_at

)

);

}

function participants(list){

return present(
list
)

.slice(
0,
10
);

}

function waiting(list){

return present(
list
)

.slice(
10
);

}

function absent(list){

return list

.filter(
a=>
a.response==="absent"
);

}

function myAnswer(list){

const me=

list.find(

a=>

a.profile_id
===

user?.id

);

if(
!me
){

return "Pas encore repondu";

}

if(
me.response==="present"
){

return "Present";

}

return "Absent";

}

function placesLeft(list){

const count=

participants(
list
).length;

if(
count<10
){

return `${10-count} place(s) restante(s)`;

}

if(
waiting(
list
).length>0
){

return "Liste attente active";

}

return "COMPLET";

}

function playerName(p){

if(
p.guest_name
){

return p.guest_name;

}

return p.profiles?.display_name;

}

function playerLevel(p){

if(
p.guest_name
){

return Number(
p.guest_level
)||3;

}

return memberLevels[p.profile_id]||3;

}

function canSeeLevels(){

return clubRole==="owner" || clubRole==="admin";

}

async function compose(matchId,list){

const players=[];

for(

const p

of

participants(
list
)

){

players.push({

name:

playerName(
p
),

level:

playerLevel(
p
)

});

}

players.sort(

(a,b)=>

b.level-
a.level

);

const A=[];

const B=[];

let scoreA=0;

let scoreB=0;

players.forEach(

p=>{

if(
scoreA<=scoreB
){

A.push(
p
);

scoreA+=
p.level;

}

else{

B.push(
p
);

scoreB+=
p.level;

}

}

);

const updates=[];

participants(
list
)

.forEach(

p=>{

const name=

playerName(
p
);

updates.push({

id:
p.id,

team:

A.some(
x=>
x.name===name
)

?

"white"

:

"black"

});

}

);

for(

const u

of

updates

){

await supabase

.from(
"attendances"
)

.update({

team:
u.team

})

.eq(
"id",
u.id);

}

await supabase

.from(
"match_teams"
)

.delete()

.eq(
"match_id",
matchId
);

const rows=[];

A.forEach(

p=>

rows.push({

match_id:
matchId,

team:
"white",

player_name:
p.name

})

);

B.forEach(

p=>

rows.push({

match_id:
matchId,

team:
"black",

player_name:
p.name

})

);

if(
rows.length
){

const {

error

}

=

await supabase

.from(
"match_teams"
)

.insert(
rows
);

if(
error
){

console.log(
error
);

alert(
error.message
);

return;

}

}

setTeams(

prev=>({

...prev,

[matchId]:{

A,
B,
scoreA,
scoreB

}

})

);


}

async function saveResult(matchId){

const white=

Number(
scoreWhite[matchId]
||0
);

const black=

Number(
scoreBlack[matchId]
||0
);

if(

white===0

&&

black===0

){

alert(
"Saisir un score"
);

return;

}

let winner="draw";

if(
white>black
){

winner="white";

}

if(
black>white
){

winner="black";

}

await supabase

.from(
"matches"
)

.update({

score_white: white,

score_black: black,

winner,

status: "finished"

})

.eq(
"id",
matchId);

alert(
"Résultat enregistré"
);

setReload(
v=>!v
);

}

function myResult(match){

const me=

match.attendances?.find(

a=>

a.profile_id

===

user?.id

);

if(
!me
){

return "⚪ Non joué";

}

if(

me.team

===

match.winner

){

return "🟢 Victoire";

}

return "🔴 Défaite";

}

async function reopenMatch(matchId){

const match = matches.find(m => m.id === matchId);

if (match && seasonLocked(match)) {
    alert("Cette saison est clôturée. Les matchs ne peuvent plus être réouverts.");
    return;
}

if(

clubRole

!==

"owner"

){

return;

}

const ok=

window.confirm(

`⚠️ Réouvrir ce match ?

Le classement et les statistiques
pourront changer.`

);

if(
!ok
){

return;

}

await supabase

.from(
"matches"
)

.update({

winner:null,

score_white:null,

score_black:null

})

.eq(
"id",
matchId);

alert(
"Match réouvert"
);

setReload(
v=>!v
);

}

function sendWhatsapp(match){

const t=
teams[match.id];

if(!t)
return;

const d=
new Date(
match.match_date
);

const formattedDate=

d.toLocaleDateString(
"fr-FR"
)

+

" à "

+

d.toLocaleTimeString(
"fr-FR",{

hour:"2-digit",

minute:"2-digit"

});

const safe=(name)=>
name
&&
name!=="undefined"
?
name
:
"Joueur";

let text="";

text+="Bonjour à tous,\n\n";

text+=
"Les équipes pour le Five du "
+
formattedDate
+
" :\n\n";

text+=
"Equipe BLANC :\n";

t.A.forEach(

(p)=>{

text+=
"• "
+
safe(
p.name
)
+
"\n";

}

);

text+="\n";

text+=
"Equipe FONCÉ :\n";

t.B.forEach(

(p)=>{

text+=
"• "
+
safe(
p.name
)
+
"\n";

}

);

window.open(

`https://wa.me/?text=${encodeURIComponent(text)}`,

"_blank"

);

}

const activeMatches=

matches

.filter(
m=>
!m.winner
)

.sort(

(a,b)=>

new Date(
a.match_date
)

-

new Date(
b.match_date
)

);

const finishedMatches=

matches

.filter(
m=>
m.winner
)

.sort(

(a,b)=>

new Date(
b.match_date
)

-

new Date(
a.match_date
)

);

return(

<Page>

<h1 className="page-title">

📅 Matchs

</h1>

{

activeMatches.map(

(m)=>(

<Card key={m.id}>

<h2
style={{
marginTop:"-8px",
marginBottom:"18px",
fontSize:"28px"
}}
>

{m.title}

</h2>

<p style={{marginBottom:"8px"}}>

<b>📍 Lieu :</b> {m.location}

</p>

<p style={{marginBottom:"8px"}}>

<b>🕒 Date :</b>{" "}

{new Date(m.match_date).toLocaleString()}

</p>

<p style={{marginBottom:"18px"}}>

<b>🙋 Mon statut :</b>{" "}

{myAnswer(m.attendances||[])}

</p>


<Button

variant="success"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"present")}

>

✅ Présent

</Button>

<Button

variant="danger"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>answer(m.id,"absent")}

style={{
marginTop:"10px"
}}

>

❌ Absent

</Button>

<hr/>

<h3
style={{
marginTop:"26px",
marginBottom:"10px"
}}
>

👥 Participants ({participants(m.attendances||[]).length}/10)

</h3>

<p>

{
placesLeft(
m.attendances||[]
)
}

</p>

{

participants(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>

<div
style={{
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<span
style={{
fontWeight:"600"
}}
>

{p.guest_name ? "👥" : "⚽"} {playerName(p)}

</span>

<span
style={{
fontSize:"14px",
opacity:.7
}}
>

• {levelLabels[playerLevel(p)]}

</span>

</div>

{

p.guest_name && editingGuest !== p.id && (

<div
style={{
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<button

onClick={()=>startEditGuest(p)}

style={{

width:"32px",

height:"32px",

borderRadius:"50%",

border:"none",

background:"#394055",

color:"white",

cursor:"pointer",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"16px"

}}

>

✏️

</button>

<button

onClick={()=>removeGuest(p.id)}

style={{

width:"32px",

height:"32px",

borderRadius:"50%",

border:"none",

background:"#E84545",

color:"white",

cursor:"pointer",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"16px"

}}

>

❌

</button>

</div>

)

}

</div>

{

editingGuest===p.id && (

<>

<Input

value={editGuestName}

onChange={(e)=>setEditGuestName(e.target.value)}

style={{
marginTop:"12px"
}}

/>

<select

value={editGuestLevel}

onChange={(e)=>setEditGuestLevel(Number(e.target.value))}

style={{

width:"100%",

padding:"12px",

borderRadius:"12px",

marginTop:"10px",

marginBottom:"10px"

}}

>

{

Object.entries(levelLabels).map(([k,v])=>

<option key={k} value={k}>

{v}

</option>

)

}

</select>

<Button

variant="success"

onClick={saveGuest}

>

💾 Enregistrer

</Button>

<Button

variant="secondary"

style={{
marginTop:"10px"
}}

onClick={()=>setEditingGuest(null)}

>

Annuler

</Button>

</>

)
}

</div>

)

}

<div
style={{
display:"flex",
gap:10,
marginBottom:10
}}
>

<Button

variant="secondary"

disabled={!!m.winner || seasonLocked(m)}

onClick={async()=>{

if(teams[m.id]){

const ok=window.confirm(

"Les équipes actuelles seront remplacées. Continuer ?"

);

if(!ok){

return;

}

}

await compose(

m.id,

m.attendances

);

}}

>

{

teams[m.id]

?

"🔄 Recomposer les équipes"

:

"⚽ Composer les équipes"

}

</Button>


</div>

<hr/>

<Input

placeholder="Nom de l'invité"

value={guestName[m.id] || ""}

onChange={(e)=>

setGuestName({

...guestName,

[m.id]:e.target.value

})

}

/>

<select

value={
guestLevel[m.id]||3
}

onChange={(e)=>

setGuestLevel({

...guestLevel,

[m.id]:
e.target.value

})

}

style={{

width:"100%",

padding:"12px",

borderRadius:"12px",

fontSize:"15px",

background:"#2a2a2a",

color:"#ffffff",

border:"1px solid rgba(255,255,255,.12)",

marginTop:"10px",

marginBottom:"20px"

}}

>

{

Object.entries(
levelLabels
)

.map(

([k,v])=>

<option
key={k}
value={k}
>

{v}

</option>

)

}

</select>

<Button

variant="secondary"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>addGuest(m.id)}

>

➕ Ajouter un invité

</Button>

<hr/>

<h3
style={{
marginTop:"24px",
marginBottom:"10px"
}}
>

❌ Absents

(
{
absent(
m.attendances||[]
).length
}
)

</h3>

{

absent(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.03)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

❌ {playerName(p)}

<div
style={{
marginTop:"4px",
fontSize:"14px",
opacity:.7
}}
>

{levelLabels[playerLevel(p)]}

</div>

</div>

)

}


<h3
style={{
marginTop:"24px",
marginBottom:"10px"
}}
>

⏳ Liste d'attente

(
{
waiting(
m.attendances||[]
).length
}
)

</h3>

{

waiting(
m.attendances||[]
)

.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.03)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {playerName(p)}

<div
style={{
marginTop:"4px",
fontSize:"14px",
opacity:.7
}}
>

{levelLabels[playerLevel(p)]}

</div>

</div>

)

}


{

teams[m.id]

&&

<>

<hr/>

<h3
style={{
marginTop:"24px",
marginBottom:"12px"
}}
>

⚪ Équipe Blanche ({teams[m.id].scoreA})

</h3>

{

teams[m.id].A.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {p.name}

</div>

)

}

<h3
style={{
marginTop:"20px",
marginBottom:"12px"
}}
>

⚫ Équipe Foncée ({teams[m.id].scoreB})

</h3>

{

teams[m.id].B.map(

(p,index)=>

<div

key={index}

style={{

padding:"10px 14px",

marginBottom:"8px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.08)",

borderRadius:"10px"

}}

>

⚽ {p.name}

</div>

)

}

<Button

variant="success"

style={{
marginTop:"12px"
}}

onClick={()=>sendWhatsapp(m)}

>

📤 Partager sur WhatsApp

</Button>

<hr/>

<h3
style={{
marginTop:"26px",
marginBottom:"14px"
}}
>

🏆 Résultat du match

</h3>

<Input

type="number"

placeholder="Score équipe blanche"

value={scoreWhite[m.id] || ""}

onChange={(e)=>

setScoreWhite({

...scoreWhite,

[m.id]:e.target.value

})

}

/>

<Input

type="number"

placeholder="Score équipe foncée"

value={scoreBlack[m.id] || ""}

onChange={(e)=>

setScoreBlack({

...scoreBlack,

[m.id]:e.target.value

})

}

/>

<Button

variant="success"

disabled={!!m.winner || seasonLocked(m)}

onClick={()=>saveResult(m.id)}

style={{
marginTop:"12px"
}}

>

🏆 Valider le résultat

</Button>


{

m.winner

&&

<div>

<p>

Score :

{
m.score_white
}

-

{
m.score_black
}

</p>

{

clubRole==="owner" && !seasonLocked(m)

&&

<Button

variant="secondary"

onClick={()=>reopenMatch(m.id)}

style={{
marginTop:"10px"
}}

>

🔓 Réouvrir le match

</Button>

}

</div>

}

</>

}

<Button

variant="danger"

disabled={seasonLocked(m)}

onClick={()=>removeMatch(m.id)}

style={{
marginTop:"20px"
}}

>

🗑 Supprimer le match

</Button>

</Card>

)

)

}

<h2
className="section-title"
style={{
textAlign:"center",
marginTop:"36px",
marginBottom:"18px"
}}
>

🏁 Matchs terminés

</h2>

{

finishedMatches.map(

(m)=>(

<Card

key={m.id}

style={{
cursor:"pointer"
}}

onClick={()=>

setExpanded(

expanded===m.id

?

null

:

m.id

)

}

>

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
fontWeight:"700",
fontSize:"22px",
marginTop:"-6px"
}}
>

<span>

⚽ {m.title}

</span>

<span>

{

expanded===m.id

?

"▲"

:

"▼"

}

</span>

</div>

<p
style={{
marginTop:"10px",
marginBottom:"12px"
}}
>

📅 {

new Date(m.match_date)

.toLocaleDateString("fr-FR")

}

</p>

<p
style={{
fontWeight:"700",
marginBottom:"12px"
}}
>

{
myResult(m)
}

</p>

{

expanded===m.id

&&

<div
style={{
marginTop:10
}}
>

<div
style={{
fontSize:"34px",
fontWeight:"800",
textAlign:"center",
margin:"14px 0"
}}
>

⚪ {m.score_white}

<span
style={{
margin:"0 18px"
}}
>

-

</span>

⚫ {m.score_black}

</div>

<div
style={{
textAlign:"center",
fontWeight:"700",
fontSize:"18px",
marginBottom:"8px"
}}
>

🏆 {

m.winner==="white"

?

"Victoire Équipe Blanche"

:

m.winner==="black"

?

"Victoire Équipe Foncée"

:

"Match nul"

}

</div>

</div>

}

</Card>

)

)

}

</Page>

);

}