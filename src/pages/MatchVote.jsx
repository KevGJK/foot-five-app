import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MatchVote(){

const [match,setMatch]=useState(null);

const [user,setUser]=useState(null);

const [loading,setLoading]=useState(true);

const matchId=
window.location.pathname
.split("/")
.pop();

useEffect(()=>{

load();

},[]);

async function load(){

const {

data:{
user
}

}

=

await supabase
.auth
.getUser();

setUser(
user
);

const {

data

}

=

await supabase

.from(
"matches"
)

.select("*")

.eq(
"id",
matchId
)

.single();

setMatch(
data
);

setLoading(
false
);

}

async function vote(response){

if(
!user
){

alert(
"Connecte-toi avant de voter"
);

return;

}

await supabase

.from(
"attendances"
)

.upsert({

match_id:
matchId,

profile_id:
user.id,

response

},

{

onConflict:
"match_id,profile_id"

});

alert(
"Vote enregistré"
);

window.location.href=
"/";

}

if(
loading
){

return(

<div
style={{
padding:30
}}
>

Chargement…

</div>

);

}

if(
!match
){

return(

<div
style={{
padding:30
}}
>

Match introuvable

</div>

);

}

return(

<div

style={{

padding:30,

maxWidth:600,

margin:"auto"

}}

>

<h1>

⚽ {match.title}

</h1>

<p>

📍 {match.location}

</p>

<p>

🕒 {

new Date(
match.match_date
)

.toLocaleString()

}

</p>

<br/>

<button

style={{

width:"100%",

padding:15,

fontSize:18,

marginBottom:10

}}

onClick={()=>

vote(
"present"
)

}

>

✅ Je participe

</button>

<button

style={{

width:"100%",

padding:15,

fontSize:18

}}

onClick={()=>

vote(
"absent"
)

}

>

❌ Je ne participe pas

</button>

</div>

);

}