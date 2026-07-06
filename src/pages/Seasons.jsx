export default function Seasons({

goBack,

activeSeason,

loadingSeason,

closeSeason

}){

const nextSeason = activeSeason
? {
    name:
      `${Number(activeSeason.name.slice(0,4))+1}-${Number(activeSeason.name.slice(5))+1}`,

    start:
      `${Number(activeSeason.name.slice(0,4))+1}-09-01`,

    end:
      `${Number(activeSeason.name.slice(5))+1}-08-31`
  }
: null;

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
{

nextSeason

&&

<div

style={{

marginTop:25,

paddingTop:20,

borderTop:"1px solid #444"

}}

>

<h2>

📅 Saison suivante

</h2>

<p>

<b>

Nom :

</b>

{" "}

{nextSeason.name}

</p>

<p>

📅

{" "}

{

new Date(nextSeason.start)

.toLocaleDateString("fr-FR")

}

{" "}

→

{" "}

{

new Date(nextSeason.end)

.toLocaleDateString("fr-FR")

}

</p>

</div>

}

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