import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function JoinClub(){

const [code,setCode]=useState("");

async function join(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user)
return;

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

alert(
"Code invalide"
);

return;

}

const {

error

}
=
await supabase

.from("club_members")

.insert({

club_id:
club.id,

profile_id:
user.id,

role:
"player"

});

if(error){

alert(
error.message
);

return;

}

alert(
"Club rejoint"
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

onClick={join}

style={{
padding:12
}}

>

Rejoindre

</button>

</div>

);

}