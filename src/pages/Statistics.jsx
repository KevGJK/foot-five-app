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

let wins=0;

let losses=0;

(matches||[])

.forEach(

m=>{

if(
m.response!=="present"
)
return;

if(
!m.matches
)
return;

if(
m.team
===
m.matches.winner
){

wins++;

}

else{

losses++;

}

}

);

const ratio=

present

?

wins
/
present

:

0;

const score=

present

?

Math.round(

ratio

*

Math.log(

present+1

)

*

100

)

:

0;

stats.push({

id:
p.profile_id,

name:

p.profiles
?.display_name

||

"Joueur",

present,

absent,

wins,

losses,

ratio:

Math.round(
ratio*100
),

score

});

}

stats.sort(

(a,b)=>

b.score-
a.score

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

📊 Classement club

</h1>

{

players.map(

(p,index)=>(

<div

key={index}

style={{

padding:20,

marginBottom:15,

border:"1px solid #ddd",

borderRadius:12

}}

>

<h3>

{

index===0

?

"🥇"

:

index===1

?

"🥈"

:

index===2

?

"🥉"

:

"#"+(index+1)

}

{" "}

{p.name}

</h3>

<p>

Score :

{p.score}

</p>

{

(

clubRole==="owner"

||

clubRole==="admin"

||

p.id===myId

)

&&

<>

<p>

Ratio :

{p.ratio}%

</p>

<p>

Présences :

{p.present}

</p>

<p>

Victoires :

{p.wins}

</p>

<p>

Défaites :

{p.losses}

</p>

</>

}

</div>

)

)

}

</div>

);

}