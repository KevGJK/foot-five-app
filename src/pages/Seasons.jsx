import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import BackButton from "../components/ui/BackButton";

export default function Seasons({

goBack,

activeSeason,

allSeasons,

loadingSeason,

closeSeason

}){


return(

<>

<BackButton onClick={goBack}>
⚙ Retour Administration
</BackButton>

<Page>

<h1 className="page-title">

🏆 Gestion des saisons

</h1>

<Card>

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

<b>🏷️ Nom :</b> {activeSeason.name}

</p>

<p style={{ marginTop: 8 }}>

<b>📅 Période :</b>{" "}

{

new Date(activeSeason.start_date).toLocaleDateString("fr-FR")

}

{" → "}

{

new Date(activeSeason.end_date).toLocaleDateString("fr-FR")

}

</p>

<p style={{ marginTop: 8 }}>

🟢 <b>Statut :</b> Saison active

</p>

</>

:

<p>

Aucune saison active.

</p>

}

</Card>

<Card>

<h2>

📚 Historique des saisons

</h2>

<p
style={{
opacity:.7,
fontSize:"14px",
marginBottom:"16px"
}}
>

Toutes les saisons du club, de la plus récente à la plus ancienne.

</p>

{

allSeasons?.map(season=>(

<div

key={season.id}

style={{

padding:"14px 0",

borderBottom:"1px solid rgba(255,255,255,.08)"

}}

>

<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center",

gap:"16px"

}}

>

<div>

<div
style={{
fontWeight:"700",
fontSize:"16px"
}}
>

🏆 {season.name}

</div>

<div
style={{
fontSize:"13px",
opacity:.7,
marginTop:"4px"
}}
>

📅 {

new Date(season.start_date)

.toLocaleDateString("fr-FR")

}

{" → "}

{

new Date(season.end_date)

.toLocaleDateString("fr-FR")

}

</div>

</div>

<div
style={{
fontWeight:"600",
fontSize:"14px"
}}
>

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

</Card>

<Button
variant="danger"
onClick={closeSeason}
style={{
    marginTop:"20px"
}}
>

🔒 Clôturer la saison

</Button>

</Page>

</>

);

}