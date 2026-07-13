import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import BackButton from "../components/ui/BackButton";

export default function ClubSelector({

goJoin

}){

const [clubName,setClubName]=useState("");

const [loading,setLoading]=useState(false);

const [clubs,setClubs]=useState([]);

const [activeClub,setActiveClub]=useState(null);

useEffect(()=>{

loadClubs();

},[]);

async function loadClubs(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user)
return;

const {
data:profile
}
=
await supabase

.from("profiles")

.select(
"active_club_id"
)

.eq(
"id",
user.id
)

.single();

setActiveClub(
profile?.active_club_id
);

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
name
)
`)

.eq(
"profile_id",
user.id
);

setClubs(
data||[]
);

}

function generateCode(){

return (

"FIVE"

+

Math.random()

.toString()

.slice(2,8)

);

}

async function switchClub(club){

if(

club.id===activeClub

){

return;

}

const ok=

window.confirm(

`Changer de club ?

${club.name}`

);

if(!ok)
return;

const {

data:{user}

}

=

await supabase.auth.getUser();

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

alert(
"Club changé"
);

window.location.reload();

}

async function createClub(){

if(!clubName){

alert(
"Nom du club obligatoire"
);

return;

}

setLoading(true);

const {

data:existing

}

=

await supabase

.from(
"clubs"
)

.select(
"id"
)

.ilike(

"name",

clubName

);

if(

existing

&&

existing.length>0

){

setLoading(false);

alert(
"Ce nom de club existe déjà"
);

return;

}

const {

data:{user}

}

=

await supabase.auth.getUser();

if(!user){

setLoading(false);

return;

}

const inviteCode=

generateCode();

const {

data:club,

error

}

=

await supabase

.from(
"clubs"
)

.insert({

name:
clubName,

invite_code:
inviteCode

})

.select()

.single();

if(error){

setLoading(false);

alert(
error.message
);

return;

}

const {

error:memberError

}

=

await supabase

.from(
"club_members"
)

.insert({

club_id:
club.id,

profile_id:
user.id,

role:
"owner"

});

if(memberError){

setLoading(false);

alert(
memberError.message
);

return;

}

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

setLoading(false);

if(memberError){

alert(
memberError.message
);

return;

}

alert(
"Club créé"
);

window.location.reload();

}

return(

<Page>

<h1 className="page-title">

🏟 Clubs

</h1>

<Card>

<h2
style={{
marginTop:"-10px",
marginBottom:"18px"
}}
>

👥 Mes clubs

</h2>

{

clubs.map(

(c)=>(

<div

key={c.clubs.id}

onClick={()=>

switchClub(
c.clubs
)

}

style={{

padding:"16px",

marginBottom:"12px",

cursor:"pointer",

border:

c.clubs.id===activeClub

?

"2px solid #43d98c"

:

"1px solid rgba(255,255,255,.12)",

borderRadius:"14px",

background:

c.clubs.id===activeClub

?

"rgba(67,217,140,.08)"

:

"rgba(255,255,255,.02)",

transition:"all .2s"

}}

>

{

c.clubs.id===activeClub

?

"🟢 "

:

"⚪ "

}

{
c.clubs.name
}

—

{

c.role==="owner"

?

"👑 Owner"

:

c.role==="admin"

?

"🛡 Admin"

:

"⚽ Joueur"

}

</div>

)

)

}

</Card>

<Card>

<h2
style={{
marginTop:"-10px",
marginBottom:"18px"
}}
>

➕ Créer un club

</h2>

<Input

placeholder="Nom du club"

value={clubName}

onChange={(e)=>setClubName(e.target.value)}

/>

<Button

loading={loading}

onClick={createClub}

style={{
marginTop:"20px"
}}

>

➕ Créer mon club

</Button>

</Card>

<Button

variant="secondary"

onClick={goJoin}

style={{
marginTop:"20px"
}}

>

🔗 Rejoindre un club

</Button>

</Page>

);

}