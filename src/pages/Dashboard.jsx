import { useEffect, useState } from "react";
import { RiLogoutBoxFill } from "react-icons/ri";
import { supabase } from "../lib/supabase";

import Members from "./Members";
import JoinClub from "./JoinClub";
import CreateMatch from "./CreateMatch";
import Matches from "./Matches";
import Statistics from "./Statistics";
import Ranking from "./Ranking";
import ClubSelector from "./ClubSelector";


export default function Dashboard() {

const [club,setClub]=useState(null);
const [page,setPage]=useState("loading");

const [stats,setStats]=useState({

created:0,
present:0,
absent:0,
rate:0

});

const [logoUrl,setLogoUrl]=useState(null);

const [showLogo,setShowLogo]=useState(false);
const [logoInput,setLogoInput]=useState(null);

function reliability(){

if(
stats.rate>=90
){

return "🟢 Excellente";

}

if(
stats.rate>=70
){

return "🟡 Correcte";

}

return "🔴 À relancer";

}

useEffect(()=>{

load();

},[]);

async function load(){

const {
data:{user}
}
=
await supabase.auth.getUser();

if(!user){

setPage("join");

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

setPage(
"club"
);

return;

}

const {

data

}
=
await supabase

.from(
"club_members"
)

.select(`
role,
clubs(
id,
name,
invite_code,
logo_url
)
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

if(!data){

setPage(
"club"
);

return;

}

setClub(
data
);

setLogoUrl(
data?.clubs?.logo_url
||
null
);

await loadStats(
user.id
);

setPage("home");

}

async function loadStats(userId){

const {

count:created

}
=
await supabase

.from("matches")

.select(
"*",
{
count:"exact",
head:true
}
)

.eq(
"organizer_id",
userId
);

const {

data

}
=
await supabase

.from("attendances")

.select(
"response"
)

.eq(
"profile_id",
userId);

const present=

data?.filter(
x=>
x.response==="present"
).length
||
0;

const absent=

data?.filter(
x=>
x.response==="absent"
).length
||
0;

const total=
present+
absent;

setStats({

created:
created||0,

present,

absent,

rate:

total

?

Math.round(

present
/
total
*
100

)

:

0

});

}

async function changeLogo(e){

const file=
e.target.files?.[0];

if(
!file
)
return;

const name=

`${club.clubs.id}-${Date.now()}`;

const {

error:uploadError

}

=

await supabase

.storage

.from(
"club-logos"
)

.upload(

name,

file,

{

upsert:true

}

);

if(
uploadError
){

alert(
uploadError.message
);

return;

}

const {

data

}

=

supabase

.storage

.from(
"club-logos"
)

.getPublicUrl(
name
);

const url=
data.publicUrl;

const {

error

}

=

await supabase

.from(
"clubs"
)

.update({

logo_url:url

})

.eq(

"id",

club.clubs.id

);

if(
error
){

alert(
error.message
);

return;

}

setLogoUrl(
url
);

alert(
"✅ Logo mis à jour"
);

}

function goHome(){

setPage(
"home"
);

}

function render(){

if(page==="club"){

return(
<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px"

}}

>

🏠 Retour à l'accueil

</button>

<ClubSelector

goJoin={()=>

setPage(
"join"
)

}

/>

</>

);

}

if(page==="join"){

return(

<JoinClub

goHome={()=>

setPage(
"home"
)

}

/>

);

}

if(page==="members"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Members/>

</>

);

}

if(page==="create"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<CreateMatch/>

</>

);

}

if(page==="stats"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Statistics/>

</>

);

}

if(page==="ranking"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Ranking/>

</>

);

}

if(page==="matches"){

return(

<>

<button

onClick={goHome}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px",

cursor:"pointer"

}}

>

🏠 Retour à l'accueil

</button>

<Matches/>

</>

);

}

return(

<>

{

showLogo

&&

<div

onClick={()=>{

setShowLogo(
false
);

}}

style={{

position:"fixed",

inset:0,

background:"rgba(0,0,0,.95)",

display:"flex",

justifyContent:"center",

alignItems:"center",

zIndex:999

}}

>

<img

src={
logoUrl
}

style={{

maxWidth:"90%",

maxHeight:"90%",

borderRadius:20

}}

/>

</div>

}

<div
style={{
maxWidth:600,
margin:"auto",
padding:16
}}
>

<div
style={{

position:"relative",

textAlign:"center",

paddingTop:70,

marginBottom:22

}}
>

<button

onClick={async()=>{

await supabase.auth.signOut();

window.location.reload();

}}

style={{

position:"absolute",

right:8,

top:8,

background:"transparent",

border:"none",

cursor:"pointer",

display:"flex",

flexDirection:"column",

alignItems:"center",

padding:0,

width:48

}}

>

<RiLogoutBoxFill

size={48}

style={{

marginBottom:-2,

opacity:.92

}}

/>

<div
style={{

fontSize:11,

opacity:.7,

marginTop:2

}}
>

Me déconnecter

</div>

</button>

<div
style={{

fontSize:22,

fontWeight:"900",

letterSpacing:2,

marginBottom:12

}}

>

FOOT FIVE MANAGER

</div>

<div

onClick={()=>{

if(
logoUrl
){

setShowLogo(
true
);

}

}}

style={{

width:80,

height:80,

margin:"0 auto",

borderRadius:"50%",

overflow:"hidden",

background:"#161616",

display:"flex",

justifyContent:"center",

alignItems:"center",

cursor:

logoUrl

?

"pointer"

:

"default",

boxShadow:

"0 0 18px rgba(120,90,255,.25)"

}}

>

{

logoUrl

?

<img

src={
logoUrl
}

style={{

width:"100%",

height:"100%",

objectFit:"cover"

}}

/>

:

<div
style={{
fontSize:60
}}
>

⚽

</div>

}

</div>

{

club?.role==="owner"

&&

<button

onClick={()=>{

logoInput?.click();

}}

style={{

marginTop:10,

padding:"6px 12px",

fontSize:12,

borderRadius:10

}}

>

✏️ Modifier le logo

</button>

}

<h1
style={{

marginTop:10,

marginBottom:2,

fontSize:26,

lineHeight:1.15,

textAlign:"center",

wordBreak:"break-word"

}}
>

{
club?.clubs?.name
}

</h1>

<div
style={{

fontSize:18,

opacity:.75

}}
>

👑 {
club?.role
}

</div>

</div>

<hr/>

<input

ref={(el)=>{

setLogoInput(
el
);

}}

type="file"

accept="image/*"

onChange={changeLogo}

style={{
display:"none"
}}
/>

<button

onClick={()=>
setPage(
"matches"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

📅 Matchs

</button>

<button

onClick={()=>
setPage(
"members"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

👥 Membres

</button>

<button

onClick={()=>
setPage(
"create"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

➕ Créer un match

</button>

<button

onClick={()=>
setPage(
"stats"
)
}

style={{
width:"100%",
padding:15,
marginBottom:12
}}

>

📊 Statistiques

</button>

<button

onClick={()=>

setPage(
"ranking"
)

}

style={{

width:"100%",

padding:15,

marginBottom:12

}}

>

🏆 Classement

</button>

<div

style={{

border:"1px solid #333",

padding:16,

borderRadius:16,

marginBottom:12

}}

>

<h3>

📈 Tableau de bord

</h3>

<p>

Matchs créés :
{
stats.created
}

</p>

<p>

Présences :
{
stats.present
}

</p>

<p>

Absences :
{
stats.absent
}

</p>

<p>

Taux présence :
{
stats.rate
}
%

</p>

<p>

Fiabilité :

{
reliability()
}

</p>

</div>

<button

onClick={()=>

setPage(
"club"
)

}

style={{

width:"100%",

padding:15

}}

>

🏟 Clubs

</button>

</div>

</>

);

}

if(page==="loading"){

return(

<div
style={{
padding:40
}}
>

⚽ Chargement...

</div>

);

}

return render();

}