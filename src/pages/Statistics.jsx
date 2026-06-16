import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";

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

setClubRole(
member.role
);

setMyId(
user.id
);

const {

data

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

`);

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
team,

matches(
winner
)

`)

.eq(
"profile_id",
p.profile_id);

const present=

(matches||[])

.filter(
x=>
x.response==="present"
)

.length;

const absent=

(matches||[])

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

<div
style={{
padding:30
}}
>

<h1>

📊 Statistiques saison

</h1>

{

players.map(

(p,index)=>(

<div

key={index}

style={{

padding:18,

marginBottom:12,

border:"1px solid #ddd",

borderRadius:12

}}

>

<h3>

{

p.id===myId

?

"👤 "+p.name+" (Moi)"

:

"👤 "+p.name

}

</h3>

<p>

📅 Matchs créés :
{p.created}

</p>

<p>

✅ Présences :
{p.present}

</p>

<p>

❌ Absences :
{p.absent}

</p>

<p>

📈 Taux présence :
{p.rate}%

</p>

<p>

Fiabilité :

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

</div>

)

)

}

</div>

);

}