import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Members(){

const [members,setMembers]=useState([]);

const [inviteCode,setInviteCode]=useState("");

const [clubRole,setClubRole]=useState(null);

const [clubName,setClubName]=useState("");

const [myClubId,setMyClubId]=useState(null);

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

)

return;

const {

data:member

}

=

await supabase

.from(
"club_members"
)

.select(`
club_id,
role
`)

.eq(
"profile_id",
user.id
)

.eq(
"club_id",
profile.active_club_id
)

.single();

if(!member)
return;

setClubRole(
member.role
);

setMyClubId(
member.club_id
);

const {
data:club
}
=
await supabase

.from("clubs")

.select(
"invite_code,name"
)

.eq(
"id",
member.club_id
)

.single();

setInviteCode(
club?.invite_code||""
);

setClubName(
club?.name||""
);

const {
data
}
=
await supabase

.from("club_members")

.select(`
id,
profile_id,
role,
profiles(
id,
display_name,
email
)
`)

.eq(
"club_id",
member.club_id);

setMembers(
data||[]
);

}

async function updateRole(memberId,newRole){

await supabase

.from(
"club_members"
)

.update({

role:newRole

})

.eq(
"id",
memberId);

load();

}

async function removeMember(memberId,name){

const ok=

window.confirm(

`⚠️ Attention

Vous êtes sur le point de retirer :

${name}

du club.

Cette action est réversible uniquement si le joueur rejoint à nouveau le club.

Confirmer la suppression ?`

);

if(!ok)
return;

const { error } =

await supabase

.from(
"club_members"
)

.delete()

.eq(
"id",
memberId);

if(error){

alert(
error.message
);

return;

}

alert(
"✅ Membre retiré du club"
);

load();

}

function canManageRoles(){

return clubRole==="owner";

}

async function invite(){

const link=

`https://five-app.vercel.app/join/${inviteCode}`;

console.log(link);

const text=

`⚽ Rejoins mon club ${clubName} sur Foot Five

${link}`;

if(

navigator.share

){

await navigator.share({

title:
"Foot Five",

text

});

return;

}

await navigator.clipboard.writeText(
text
);

alert(
"📤 Lien copié"
);

}

function canRemove(){

return (

clubRole==="owner"

||

clubRole==="admin"

);

}

return(

<div
style={{
padding:30
}}
>

<h1>

👥 Membres

</h1>

<hr/>

<h3>

Code du club

</h3>

<p
style={{
fontSize:18,
fontWeight:"bold"
}}
>

{
inviteCode
}

</p>

<br/>

<button

onClick={invite}

style={{

padding:12

}}

>

📤 Inviter

</button>

<hr/>

{

members.map(

(m,index)=>(

<div

key={index}

style={{

marginBottom:15,

padding:15,

border:"1px solid #ddd",

borderRadius:12

}}

>

<strong>

{
m.profiles?.display_name
}

</strong>

<br/>

{

m.role==="owner"

?

"👑 Owner"

:

m.role==="admin"

?

"🛡 Admin"

:

"⚽ Joueur"

}

<br/>
<br/>

{

canManageRoles()

&&

m.role!=="owner"

&&

<>

{

m.role==="player"

?

<button

onClick={()=>

updateRole(
m.id,
"admin"
)

}

>

🛡 Nommer Admin

</button>

:

<button

onClick={()=>

updateRole(
m.id,
"player"
)

}

>

↩ Retirer Admin

</button>

}

</>

}

{

canRemove()

&&

m.role!=="owner"

&&

<>

<br/>
<br/>

<button

onClick={()=>

removeMember(

m.id,

m.profiles?.display_name

)

}

>

❌ Retirer du club

</button>

</>

}

</div>

)

)

}

</div>

);

}