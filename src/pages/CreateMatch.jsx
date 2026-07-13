import { useState } from "react";
import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

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

data:profile,
error:profileError

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

if(profileError){

alert(
profileError.message
);

return;

}

if(

!profile?.active_club_id

){

alert(
"Aucun club actif"
);

return;

}

const {

data:seasons,

error:seasonError

}

=

await supabase

.from(

"seasons"

)

.select(
"*"
)

.eq(

"club_id",

profile.active_club_id

);

const season=

seasons?.find(
s=>
s.active
);

if(
!season
){

alert(
"Aucune saison active trouvée"
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
profile.active_club_id,

season_id:
season.id,

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

text+="Merci d'indiquer votre présence :\n\n";

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

return (

<Page>

<h1 className="page-title">

➕ Créer un match

</h1>

<Card>

{

created && (

<div
style={{
background:"#25D366",
color:"white",
padding:"16px",
borderRadius:"14px",
marginBottom:"20px",
fontWeight:"600"
}}
>

✅ Match créé avec succès

</div>

)

}

<div className="section">

<label className="label">

Nom du match

</label>

<Input

value={title}

onChange={(e)=>setTitle(e.target.value)}

/>

</div>

<div className="section">

<label className="label">

Lieu

</label>

<Input

placeholder="Ex : Urban Soccer Annecy"

value={location}

onChange={(e)=>setLocation(e.target.value)}

/>

</div>

<div className="section">

<label className="label">

Date et heure

</label>

<Input

type="datetime-local"

value={date}

onChange={(e)=>setDate(e.target.value)}

/>

</div>

<Button

variant="primary"

onClick={create}

style={{
    marginTop: "20px"
}}

>

Créer le match

</Button>

</Card>

</Page>

);

}