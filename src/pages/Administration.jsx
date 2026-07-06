export default function Administration({

goHome,

goSeasons

}){

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

<div
style={{

padding:20,

maxWidth:600,

margin:"0 auto"

}}
>

<h1>

⚙ Administration

</h1>

<button

onClick={goSeasons}

style={{

width:"100%",

padding:15,

marginTop:20,

marginBottom:12

}}

>

🏆 Gestion des saisons

</button>

</div>

</>

);

}