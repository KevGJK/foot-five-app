import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function CreateMatch() {

const [title,setTitle]=useState("FOOT FIVE");
const [location,setLocation]=useState("");
const [date,setDate]=useState("");
const [created,setCreated]=useState(false);

async function create(){

try{

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user){

alert(
"Utilisateur non connecté"
);

return;

}

const {

data:member,
error:memberError

}
=
await supabase

.from("club_members")

.select("club_id")

.eq(
"profile_id",
user.id
)

.single();

if(memberError){

alert(
memberError.message
);

return;

}

if(!member){

alert(
"Club introuvable"
);

return;

}

const {

data,
error

}
=
await supabase

.from("matches")

.insert({

title,

location,

match_date:
date,

club_id:
member.club_id,

organizer_id:
user.id,

max_players:
10,

status:
"open"

})

.select()

.single();

if(error){

alert(
error.message
);

return;

}

const link=

`${window.location.origin}/match/${data.id}`;

const formattedDate=

new Date(
date
)

.toLocaleDateString(
"fr-FR"
)

+

" à "

+

new Date(
date
)

.toLocaleTimeString(
"fr-FR",{

hour:"2-digit",

minute:"2-digit"

});

let text="";

text+="FOOT FIVE\n";

text+="================\n\n";

text+="Bonjour à tous,\n\n";

text+="Un nouveau match est disponible.\n\n";

text+="DATE : ";

text+=formattedDate;

text+="\n\n";

text+="Merci d'indiquer votre presence :\n\n";

text+=link;

text+="\n\n";

text+="A bientôt";

window.open(

`https://wa.me/?text=${encodeURIComponent(text)}`,

"_blank"

);

setCreated(true);

setLocation("");

setDate("");

}
catch(e){

console.log(e);

alert(
"Erreur création match"
);

}

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

➕ Créer un match

</h1>

{

created

&&

<div

style={{

padding:15,
marginBottom:20,
borderRadius:10,
background:"#25D366",
color:"white"

}}

>

✅ Match créé

</div>

}

<input

value={title}

onChange={(e)=>

setTitle(
e.target.value
)

}

style={{
width:"100%",
padding:12,
marginBottom:12
}}

/>

<input

placeholder="Lieu"

value={location}

onChange={(e)=>

setLocation(
e.target.value
)

}

style={{
width:"100%",
padding:12,
marginBottom:12
}}

/>

<input

type="datetime-local"

value={date}

onChange={(e)=>

setDate(
e.target.value
)

}

style={{
width:"100%",
padding:12,
marginBottom:20
}}

/>

<button

onClick={create}

style={{

width:"100%",
padding:15

}}

>

Créer

</button>

</div>

);

}