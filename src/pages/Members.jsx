import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Members(){

const [members,setMembers]=useState([]);

const [inviteCode,setInviteCode]=useState("");

const [clubRole,setClubRole]=useState(null);

const [clubName,setClubName]=useState("");

const [myClubId,setMyClubId]=useState(null);

const [myUserId,setMyUserId]=useState(null);

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

setMyUserId(user.id);

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
level,
profiles(
id,
display_name,
email
)
`)

.eq(
"club_id",
member.club_id);

const sorted=

(data||[])

.sort((a,b)=>{

if(a.profile_id===user.id)
return -1;

if(b.profile_id===user.id)
return 1;

return (

(a.profiles?.display_name||"")

.localeCompare(

b.profiles?.display_name||"",

"fr"

)

);

});

setMembers(
sorted
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

async function updateLevel(memberId,level){

await supabase

.from("club_members")

.update({

level

})

.eq(

"id",

memberId

);

load();

}

function canManageRoles(){

return clubRole==="owner";

}

async function invite(){

const link=
`https://foot-five-app.vercel.app/join/${inviteCode}`;

const text=

`⚽ Rejoins mon club ${clubName} sur Foot Five

${link}`;

if(

navigator.share

){

await navigator.share({

title:"Foot Five",

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

<Page>

<h1 className="page-title">

👥 Membres

</h1>

<Card>

<h2
style={{
marginTop:"-10px",
marginBottom:"18px"
}}
>

🔑 Code d'invitation

</h2>

<p
style={{

fontSize:26,

fontWeight:"700",

textAlign:"center",

padding:"16px",

borderRadius:"14px",

background:"rgba(255,255,255,.04)",

border:"1px solid rgba(255,255,255,.10)",

letterSpacing:"4px",

marginBottom:"20px"

}}
>

{
inviteCode
}

</p>

<br/>

<Button

onClick={invite}

>

📤 Inviter un joueur

</Button>

</Card>

{

members.map(

(m,index)=>(

<Card key={index}>

<div
style={{

fontSize:"20px",

fontWeight:"700",

lineHeight:"1.2",

marginTop:"-8px",

marginBottom:"8px"

}}
>

{

m.profile_id===myUserId

?

"👤 "+m.profiles?.display_name+" (Moi)"

:

m.profiles?.display_name

}

</div>

<div
style={{
height:2
}}/>

<div

style={{

opacity:.75,

fontSize:"15px",

marginBottom:"16px"

}}
>

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

</div>

{

(clubRole==="owner" || clubRole==="admin")

&&

m.role!=="owner"

&&

<div
style={{

marginTop:8

}}
>

<div
style={{

fontSize:13,

opacity:.7,

marginBottom:6

}}
>

🏅 Niveau

</div>

<select

value={

m.level||""

}

onChange={(e)=>{

updateLevel(

m.id,

e.target.value

?

Number(

e.target.value

)

:

null

);

}}

style={{

width:"100%",

padding:"12px",

borderRadius:"12px",

fontSize:"15px",

background:"#2a2a2a",

color:"#ffffff",

border:"1px solid rgba(255,255,255,.12)"

}}

>

<option value="">

Non évalué

</option>

<option value="1">

1️⃣ Débutant

</option>

<option value="2">

2️⃣ Loisir

</option>

<option value="3">

3️⃣ Intermédiaire

</option>

<option value="4">

4️⃣ Confirmé

</option>

<option value="5">

5️⃣ Avancé

</option>

<option value="6">

6️⃣ Expert

</option>

<option value="7">

7️⃣ Élite

</option>

</select>

</div>

}

<div
style={{
height:4
}}/>

{

canManageRoles()

&&

m.role!=="owner"

&&

<>

{

m.role==="player"

?

<Button

variant="secondary"

onClick={()=>updateRole(m.id,"admin")}

style={{
marginTop:"10px"
}}

>

🛡 Nommer Admin

</Button>

:

<Button

variant="secondary"

onClick={()=>updateRole(m.id,"player")}

style={{
marginTop:"10px"
}}

>

↩ Retirer Admin

</Button>


}

</>

}

{

canRemove()

&&

m.role!=="owner"

&&

<>

<div
style={{
height:4
}}/>

<Button

variant="danger"

onClick={()=>

removeMember(

m.id,

m.profiles?.display_name

)

}

style={{
marginTop:"10px"
}}

>

❌ Retirer du club

</Button>

</>

}

</Card>

)

)

}

</Page>

);

}