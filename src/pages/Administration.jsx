import { useLanguage } from "../i18n/useLanguage";
import Page from "../components/ui/Page";
import BackButton from "../components/ui/BackButton";
import Button from "../components/ui/Button";

export default function Administration({

goHome,

goSeasons

}){

const { t } = useLanguage();

return(

<>

<BackButton onClick={goHome}>
🏠 {t("backToHome")}
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

⚙ {t("administration")}

</h1>

<div
style={{
marginTop:"20px",
marginBottom:"16px"
}}
>

<Button
onClick={goSeasons}
style={{
marginTop:0
}}
>

🏆 {t("seasonManagement")}

</Button>

</div>

</Page>

</>

);

}