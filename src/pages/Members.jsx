import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Members() {

const [members,setMembers]=useState([]);

const [inviteCode,setInviteCode]=useState("");

const [clubRole,setClubRole]=useState(null);

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

.select(`
club_id,
role
`)

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

const {
data:club
}
=
await supabase

.from("clubs")

.select(
"invite_code"
)

.eq(
"id",
member.club_id
)

.single();

setInviteCode(
club?.invite_code||""
);

const {
data
}
=
await supabase

.from("club_members")

.select(`
role,
profiles(
id,
display_name,
email
)
`)

.eq(
"club_id",
member.club_id
);

setMembers(
data||[]
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

<hr/>

{

members.map(

(m,index)=>(

<div

key={index}

style={{

marginBottom:12,

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

</div>

)

)

}

</div>

);

}