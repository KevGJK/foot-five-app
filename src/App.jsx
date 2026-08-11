import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MatchVote from "./pages/MatchVote";
import JoinClub from "./pages/JoinClub";
import PlayerProfile from "./pages/PlayerProfile";

export default function App(){

const [connected,setConnected]=
useState(null);

useEffect(() => {

  let mounted = true;

  async function initializeAuth() {

    const {
      data
    } = await supabase.auth.getSession();

    if (mounted) {
      setConnected(!!data.session);
    }

  }

  initializeAuth();

  const {
    data: listener
  } = supabase.auth.onAuthStateChange(
    async (_, session) => {

      if (mounted) {
        setConnected(!!session);
      }

    }
  );

  return () => {

    mounted = false;

    listener.subscription.unsubscribe();

  };

}, []);

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

path.startsWith(
"/join/"
)

){

return(

<JoinClub

goHome={()=>{

window.location="/";

}}

 />

);

}

if(
  window.location.pathname
  .startsWith(
    "/player/"
  )
){

  return(
    <PlayerProfile/>
  );

}

if (connected === null) {

return (

<div
style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
height:"100vh",
fontSize:"20px",
fontWeight:"600"
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