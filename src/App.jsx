import { useEffect, useState } from "react";

import { supabase } from "./lib/supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatchVote from "./pages/MatchVote";

export default function App(){

const [connected,setConnected]=
useState(null);

useEffect(()=>{

check();

const {

data:listener

}

=

supabase.auth.onAuthStateChange(

(_,session)=>{

setConnected(

!!session

);

}

);

return()=>{

listener.subscription.unsubscribe();

};

},[]);

async function check(){

const {

data

}

=

await supabase.auth.getSession();

setConnected(

!!data.session

);

}

const path=
window.location.pathname;

if(

path.startsWith(
"/match/"
)

){

return(

<MatchVote/>

);

}

if(

window.location.pathname

.startsWith(

"/player/"

)

){

const PlayerProfile=

require(
"./pages/PlayerProfile"
)

.default;

return(

<PlayerProfile/>

);

}

if(

connected===null

){

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

if(

!connected

){

return(

<Login

onSuccess={()=>{

setConnected(
true
);

window.location.reload();

}}

/>

);

}



return(

<Dashboard/>

);

}