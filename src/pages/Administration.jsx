import Page from "../components/ui/Page";
import BackButton from "../components/ui/BackButton";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { testBackend } from "../services/functions";

import { useState } from "react";

export default function Administration({

goHome,

goSeasons

}){

const [backendResult,setBackendResult]=useState(null);

const [backendError,setBackendError]=useState(null);

const [loading,setLoading]=useState(false);

async function runBackendTest(){

    setLoading(true);

    setBackendError(null);

    setBackendResult(null);

    try{

        const result = await testBackend();

        setBackendResult(result);

    }

    catch(e){

        console.error(e);

        setBackendError(e.message);

    }

    finally{

        setLoading(false);

    }

}

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

<Card>

<h2 className="section-title">

🧪 Outils développeur

</h2>

<Button
onClick={runBackendTest}
>

{

loading

?

"Test en cours..."

:

"Tester le backend"

}

</Button>

{

backendResult &&

<pre
style={{

marginTop:"20px",

fontSize:"13px",

whiteSpace:"pre-wrap"

}}
>

{JSON.stringify(backendResult,null,2)}

</pre>

}

{

backendError &&

<div
style={{

marginTop:"20px",

color:"#ef4444"

}}
>

{backendError}

</div>

}

</Card>

</Page>

</>

);

}