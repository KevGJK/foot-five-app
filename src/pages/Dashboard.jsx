import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import Members from "./Members";
import JoinClub from "./JoinClub";
import CreateMatch from "./CreateMatch";
import Matches from "./Matches";
import Statistics from "./Statistics";
export default function Dashboard() {

const [club,setClub]=useState(null);
const [page,setPage]=useState("loading");

const [stats,setStats]=useState({

created:0,
present:0,
absent:0,
rate:0

});

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

data

}
=
await supabase

.from("club_members")

.select(`
role,
clubs(
id,
name,
invite_code
)
`)

.eq(
"profile_id",
user.id
)

.single();

if(!data){

setPage("join");

return;

}

setClub(data);

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

function goHome(){

setPage(
"home"
);

}

function render(){

if(page==="join"){

return(
<JoinClub/>
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

return(

<div
style={{
maxWidth:600,
margin:"auto",
padding:30
}}
>

<h1>

⚽ Foot Five

</h1>

<h2>

{
club?.clubs?.name
}

</h2>

<p>

👑 {
club?.role
}

</p>

<hr/>

<button

onClick={()=>
setPage(
"matches"
)
}

style={{
width:"100%",
padding:15,
marginBottom:10
}}

>

📅 Matchs

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
marginBottom:10
}}

>

👥 Membres

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
marginBottom:20
}}

>

➕ Créer un match

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
marginBottom:10
}}

>

📊 Statistiques

</button>

<div

style={{

border:"1px solid #ddd",

padding:20,

borderRadius:12

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

<br/>


<button

style={{
width:"100%",
padding:15
}}

>

⚙ Administration

</button>

</div>

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