import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ onSuccess }) {

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  async function login(){

    const { error } =
      await supabase.auth.signInWithPassword({

        email,
        password

      });

    if(error){

      alert(error.message);

      return;
    }

    onSuccess();
  }

  return (

<div
style={{

maxWidth:400,
margin:"60px auto",
padding:30,
borderRadius:20,
background:"#ffffff"

}}
>

<h1>

⚽ Foot Five

</h1>

<input

placeholder="Email"

value={email}

onChange={(e)=>
setEmail(
e.target.value
)}

style={{
width:"100%",
padding:10
}}

/>

<br />
<br />

<input

type="password"

placeholder="Mot de passe"

value={password}

onChange={(e)=>
setPassword(
e.target.value
)}

style={{
width:"100%",
padding:10
}}

/>

<br />
<br />

<button

onClick={login}

style={{

width:"100%",
padding:15

}}
>

Connexion

</button>

</div>

);
}