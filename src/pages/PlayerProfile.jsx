import { useEffect,useState } from "react";
import { supabase } from "../lib/supabase";

export default function PlayerProfile(){

const [player,setPlayer]=useState(null);

const [stats,setStats]=useState({

present:0,
absent:0,
wins:0,
losses:0,
ratio:0

});

useEffect(()=>{

load();

},[]);

async function load(){

const id=

window.location.pathname

.split("/player/")[1];

const {

data:user

}

=

await supabase

.from("profiles")

.select("*")

.eq(
"id",
id
)

.single();

setPlayer(
user
);

const {

data

}

=

await supabase

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
id);

const present=

(data||[])

.filter(
x=>
x.response==="present"
)

.length;

const absent=

(data||[])

.filter(
x=>
x.response==="absent"
)

.length;

let wins=0;

let losses=0;

(data||[])

.forEach(

a=>{

if(
a.response!=="present"
)
return;

if(
!a.matches
)
return;

if(
a.team
===

a.matches.winner
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

Math.round(

wins

/

present

*

100

)

:

0;

setStats({

present,
absent,
wins,
losses,
ratio

});

}

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

← Retour

</button>

<h1>

👤

{
player?.display_name
}

</h1>

<hr/>

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

Victoires :

{
stats.wins
}

</p>

<p>

Défaites :

{
stats.losses
}

</p>

<p>

Ratio victoire :

{
stats.ratio
}
%

</p>

</div>

);

}