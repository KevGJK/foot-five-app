export default function Seasons({

goBack,

activeSeason,

allSeasons,

loadingSeason,

closeSeason

}){


return(

<>

<button

onClick={goBack}

style={{

width:"calc(100% - 40px)",

margin:"20px",

padding:"18px",

fontSize:"18px",

fontWeight:"600",

borderRadius:"12px"

}}

>

⚙ Retour Administration

</button>

<div
style={{

padding:20,

maxWidth:600,

margin:"0 auto"

}}

>

<h1>

🏆 Gestion des saisons

</h1>

<div

style={{

marginTop:25,

padding:20,

borderRadius:16,

border:"1px solid #333",

background:"#1a1a1a"

}}

>

<h2>

🏆 Saison active

</h2>

{

loadingSeason

?

<p>

Chargement...

</p>

:

activeSeason

?

<>

<p>

<b>Nom :</b>

{" "}

{activeSeason.name}

</p>

<p>

📅

{" "}

{

new Date(activeSeason.start_date).toLocaleDateString("fr-FR")

}

{" "}→{" "}

{

new Date(activeSeason.end_date).toLocaleDateString("fr-FR")

}

</p>

<p>

🟢 Saison active

</p>

</>

:

<p>

Aucune saison active.

</p>

}

</div>

<div

style={{

marginTop:25,

padding:20,

borderRadius:16,

border:"1px solid #333",

background:"#1a1a1a"

}}

>

<h2>

📚 Historique des saisons

</h2>

{

allSeasons?.map(season=>(

<div

key={season.id}

style={{

padding:"12px 0",

borderBottom:"1px solid #333"

}}

>

<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center"

}}

>

<div>

<b>

{season.name}

</b>

<br/>

<span

style={{

fontSize:13,

opacity:.7

}}

>

{

new Date(season.start_date)

.toLocaleDateString("fr-FR")

}

{" → "}

{

new Date(season.end_date)

.toLocaleDateString("fr-FR")

}

</span>

</div>

<div>

{

season.active

?

"🟢 Active"

:

"⚪ Terminée"

}

</div>

</div>

</div>

))

}

</div>

<button

onClick={closeSeason}

style={{

width:"100%",

padding:15,

marginTop:20,

background:"#c62828",

color:"white",

border:"none",

borderRadius:12,

fontWeight:"bold",

cursor:"pointer"

}}

>

🔒 Clôturer la saison

</button>

</div>

</>

);

}