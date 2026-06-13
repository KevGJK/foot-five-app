import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ onSuccess }) {

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");

const [firstName,setFirstName]=useState("");
const [lastName,setLastName]=useState("");

const [registerMode,setRegisterMode]=useState(false);

const [loading,setLoading]=useState(false);

async function login(){

setLoading(true);

const { error } =

await supabase.auth.signInWithPassword({

email,

password

});

setLoading(false);

if(error){

alert(error.message);

return;

}

if(

window.location.pathname

.startsWith(

"/join/"

)

){

window.location.reload();

return;

}

onSuccess();

}

async function register(){

if(

!firstName

||

!lastName

||

!email

||

!password

){

alert(
"Tous les champs sont obligatoires"
);

return;

}

setLoading(true);

const generatedName=

firstName

+

" "

+

lastName.charAt(0).toUpperCase();

const {

data,

error

}

=

await supabase.auth.signUp({

email,

password,

options:{

data:{

display_name:

generatedName

}

}

});

if(error){

setLoading(false);

alert(
error.message
);

return;

}

if(
data?.user
){

const {

error:profileError

}

=

await supabase

.from(
"profiles"
)

.upsert({

id:
data.user.id,

display_name:
generatedName,

email

});

if(
profileError
){

setLoading(false);

alert(
profileError.message
);

return;

}

}

setLoading(false);

alert(
"Compte créé avec succès"
);

if(

window.location.pathname

.startsWith(

"/join/"

)

){

window.location.reload();

return;

}

setRegisterMode(false);

setPassword("");

onSuccess();

}

return(

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

{

registerMode

&&

<>

<input

placeholder="Prénom"

value={firstName}

onChange={(e)=>

setFirstName(
e.target.value
)

}

style={{

width:"100%",

padding:10

}}

/>

<br/>
<br/>

<input

placeholder="Nom"

value={lastName}

onChange={(e)=>

setLastName(
e.target.value
)

}

style={{

width:"100%",

padding:10

}}

/>

<br/>
<br/>

</>

}

<input

placeholder="Email"

value={email}

onChange={(e)=>

setEmail(
e.target.value
)

}

style={{

width:"100%",

padding:10

}}

/>

<br/>
<br/>

<input

type="password"

placeholder="Mot de passe"

value={password}

onChange={(e)=>

setPassword(
e.target.value
)

}

style={{

width:"100%",

padding:10

}}

/>

<br/>
<br/>

<button

disabled={loading}

onClick={

registerMode

?

register

:

login

}

style={{

width:"100%",

padding:15

}}

>

{

loading

?

"Chargement..."

:

registerMode

?

"Créer mon compte"

:

"Connexion"

}

</button>

<br/>
<br/>

<button

disabled={loading}

onClick={()=>

setRegisterMode(

!registerMode

)

}

style={{

width:"100%",

padding:12

}}

>

{

registerMode

?

"Déjà un compte ?"

:

"Créer un compte"

}

</button>

</div>

);

}