import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatchVote from "./pages/MatchVote";

export default function App() {

const [connected,setConnected]=
useState(false);

const path=
window.location.pathname;

if(

path.startsWith(
"/match/"
)

){

return(

<MatchVote />

);

}

if(!connected){

return(

<Login

onSuccess={()=>

setConnected(
true
)

}

/>

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

return(

<Dashboard/>

);

}