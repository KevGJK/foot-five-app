import Page from "../components/ui/Page";
import BackButton from "../components/ui/BackButton";
import Button from "../components/ui/Button";

export default function Administration({

goHome,

goSeasons

}){

return(

<>

<BackButton onClick={goHome}>
🏠 Retour à l'accueil
</BackButton>

<Page
style={{
    paddingTop: "8px"
}}
>

<h1
className="page-title"
style={{
    marginTop: "8px",
    marginBottom: "24px"
}}
>

⚙ Administration

</h1>

<Button
onClick={goSeasons}
style={{
marginTop:"20px"
}}
>

🏆 Gestion des saisons

</Button>

</Page>

</>

);

}