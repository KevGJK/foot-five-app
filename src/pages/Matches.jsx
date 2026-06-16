import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Matches() {

const [matches,setMatches]=useState([]);
const [user,setUser]=useState(null);
const [clubRole,setClubRole]=useState(null);
const [guestName,setGuestName]=useState({});
const [guestLevel,setGuestLevel]=useState({});

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
data
}
=
await supabase

.from("matches")

.select(`
*,
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
playerName(
a
),

level:
playerLevel(
a
)

});

}

if(
a.team==="black"
){

black.push({

name:
playerName(
a
),

level:
playerLevel(
a
)

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

return Number(
p.level
)||3;

}

function canSeeLevels(){

return

clubRole==="owner"

||

clubRole==="admin";

}

async function compose(matchId,list){

const players=

participants(
list
)

.map(

p=>({

name:
playerName(
p
),

level:
playerLevel(
p
)

})

)

.sort(
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

score_white:
white,

score_black:
black,

winner

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

<div
style={{
padding:30
}}
>

<h1>

📅 Matchs

</h1>

{

activeMatches.map(

(m)=>(

<div

key={m.id}

style={{

padding:20,

border:"1px solid #ddd",

borderRadius:12,

marginBottom:20

}}

>

<h2>

{m.title}

</h2>

<p>

📍 {m.location}

</p>

<p>

🕒 {

new Date(
m.match_date
)

.toLocaleString()

}

</p>

<p>

Mon statut :

{
myAnswer(
m.attendances||[]
)
}

</p>


<button

disabled={
!!m.winner
}

onClick={()=>

answer(
m.id,
"present"
)

}

>

✅ Présent

</button>

<button

disabled={
!!m.winner
}

style={{
marginLeft:10
}}

onClick={()=>

answer(
m.id,
"absent"
)

}

>

❌ Absent

</button>

<button

style={{
marginLeft:10
}}

onClick={()=>

removeMatch(
m.id
)

}

>

🗑

</button>

<hr/>

<input

placeholder="Nom invité"

value={
guestName[m.id]||""
}

onChange={(e)=>

setGuestName({

...guestName,

[m.id]:
e.target.value

})

}

style={{
width:"100%",
padding:10,
marginBottom:10
}}

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
padding:10
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

<br/>
<br/>

<button

disabled={
!!m.winner
}

onClick={()=>

addGuest(
m.id
)

}

>

Ajouter invité

</button>

<hr/>

<h3>

🏆 Participants

(
{
participants(
m.attendances||[]
).length
}

/10)

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
>

{
playerName(
p
)
}

—

{

canSeeLevels()

&&

<>

—

{

levelLabels[
playerLevel(
p
)
]

}

</>

}

</div>

)

}

<br/>

<div
style={{
display:"flex",
gap:10,
marginBottom:10
}}
>

<button

disabled={
!!m.winner
}

onClick={async()=>{

if(
teams[m.id]
){

const ok=

window.confirm(

"Les équipes actuelles seront remplacées. Continuer ?"

);

if(
!ok
){

return;

}

}

await compose(

m.id,

m.attendances

);

}}

style={{

padding:10,

marginBottom:10

}}

>

{

teams[m.id]

?

"🔄 Recomposer équipes"

:

"⚽ Composer équipes"

}

</button>



</div>

<hr/>

<h3>

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
>

{
playerName(
p
)
}

</div>

)

}

<hr/>

<h3>

⏳ Liste attente

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
>

{
playerName(
p
)
}

—

{
levelLabels[
playerLevel(
p
)
]
}

</div>

)

}


{

teams[m.id]

&&

<>

<hr/>

<h3>

Equipe BLANC

(
{
teams[m.id].scoreA
}
)

</h3>

{

teams[m.id].A.map(

(p,index)=>

<div key={index}>

• {p.name}

</div>

)

}

<br/>

<h3>

Equipe FONCÉ

(
{
teams[m.id].scoreB
}
)

</h3>

{

teams[m.id].B.map(

(p,index)=>

<div key={index}>

• {p.name}

</div>

)

}

<br/>

<button

style={{
marginTop:10
}}

onClick={()=>

sendWhatsapp(
m
)

}

>

📤 WhatsApp

</button>

<hr/>

<h3>

🏆 Résultat

</h3>

<input

type="number"

placeholder="Score BLANC"

value={
scoreWhite[m.id]
||
""
}

onChange={(e)=>

setScoreWhite({

...scoreWhite,

[m.id]:
e.target.value

})

}

style={{

width:"100%",

padding:10,

marginBottom:10

}}

/>

<input

type="number"

placeholder="Score FONCÉ"

value={
scoreBlack[m.id]
||
""
}

onChange={(e)=>

setScoreBlack({

...scoreBlack,

[m.id]:
e.target.value

})

}

style={{

width:"100%",

padding:10,

marginBottom:10

}}

/>

<button

disabled={
!!m.winner
}

onClick={()=>

saveResult(
m.id
)

}

>

🏆 Valider résultat

</button>


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

clubRole==="owner"

&&

<button

onClick={()=>

reopenMatch(
m.id
)

}

>

🔓 Réouvrir le match

</button>

}

</div>

}

</>

}

</div>

)

)

}

<hr/>

<h2>

🏁 Matchs terminés

</h2>

{

finishedMatches.map(

(m)=>(

<div

key={m.id}

style={{

padding:12,

marginBottom:10,

border:"1px solid #ddd",

borderRadius:10,

background:"#f7f7f7",

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

<div>

{

expanded===m.id

?

"▾"

:

"▸"

}

&nbsp;

{m.title}

<div
style={{
fontSize:14
}}
>

{
myResult(
m
)
}

</div>

—

{

new Date(
m.match_date
)

.toLocaleDateString()

}

</div>

{

expanded===m.id

&&

<div
style={{
marginTop:10
}}
>

<p>

⚪

{
m.score_white
}

—

⚫

{
m.score_black
}

</p>

<p>

🏆

{

m.winner==="white"

?

"Victoire BLANC"

:

m.winner==="black"

?

"Victoire FONCÉ"

:

"Match nul"

}

</p>

</div>

}

</div>

)

)

}

</div>

);

}