import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function JoinClub({

goHome

}){

const [code,setCode]=useState("");

const [loading,setLoading]=useState(false);

useEffect(()=>{

const parts=

window.location.pathname

.split("/");

if(

parts[1]==="join"

&&

parts[2]

){

setCode(
parts[2]
);

}

},[]);

useEffect(()=>{

if(

code

){

join();

}

},[code]);

async function join(){

if(
loading
)
return;

setLoading(true);

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user){

setLoading(false);

return;

}

const {

data:club

}
=
await supabase

.from("clubs")

.select("*")

.eq(
"invite_code",
code
)

.single();

if(!club){

setLoading(false);

alert(
"Code invalide"
);

return;

}

const { error } =
await supabase
.from("club_members")
.upsert(
{
club_id:club.id,
profile_id:user.id,
role:"player"
},
{
onConflict:"club_id,profile_id"
}
);

if(error){

setLoading(false);

alert(error.message);

return;

}

if(error){

setLoading(false);

alert(
error.message
);

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

await supabase

.from(
"profiles"
)

.update({

active_club_id:
club.id

})

.eq(
"id",
user.id

);

}

setLoading(false);

alert(
"✅ Club rejoint"
);

window.location.href="/";

}

return(

<div
style={{
padding:30
}}
>

<button

onClick={goHome}

style={{

width:"100%",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

marginBottom:"20px"

}}

>

🏠 Retour à l'accueil

</button>

<h1>

➕ Rejoindre un club

</h1>

<input

value={code}

placeholder="Code"

onChange={(e)=>

setCode(
e.target.value
)

}

style={{
width:"100%",
padding:10
}}

/>

<br/>
<br/>

<button

disabled={loading}

onClick={join}

style={{

padding:12,

opacity:

loading

?

0.6

:

1

}}

>

{

loading

?

"Connexion au club..."

:

"Rejoindre"

}

</button>

</div>

);

}