import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import BackButton from "../components/ui/BackButton";

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

// préremplit le code seulement

},[]);

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

<>

<BackButton onClick={goHome} />

<Page>


<h1 className="page-title">

➕ Rejoindre un club

</h1>

<p
style={{
opacity:.75,
marginBottom:"20px",
textAlign:"center"
}}
>

Saisissez le code d'invitation communiqué par le propriétaire du club.

</p>

<Card>

<Input

placeholder="Code d'invitation"

value={code}

onChange={(e)=>setCode(e.target.value)}

/>

<Button

loading={loading}

onClick={join}

style={{
marginTop:"20px"
}}

>

🔗 Rejoindre le club

</Button>

</Card>

</Page>

</>

);

}