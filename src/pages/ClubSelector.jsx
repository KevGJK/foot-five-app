import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

<div
style={{
padding:30
}}
>

<h1>

⚽ Bienvenue

</h1>

<h3>

Mes clubs

</h3>

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

padding:12,

marginBottom:10,

cursor:"pointer",

border:

c.clubs.id===activeClub

?

"3px solid #3ecf8e"

:

"1px solid #ddd",

borderRadius:12

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

<hr/>

<h3>

Créer un club

</h3>

<input

placeholder="Nom du club"

value={clubName}

onChange={(e)=>

setClubName(
e.target.value
)

}

style={{

width:"100%",

padding:12,

marginBottom:15

}}

/>

<button

disabled={loading}

onClick={createClub}

style={{

padding:15,

width:"100%"

}}

>

{

loading

?

"Création..."

:

"➕ Créer mon club"

}

</button>

<br/>
<br/>

<button

onClick={()=>

goJoin()

}

style={{

padding:15,

width:"100%"

}}

>

🔗 Rejoindre un club

</button>

</div>

);

}