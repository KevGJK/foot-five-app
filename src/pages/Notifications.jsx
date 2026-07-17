import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

export default function Notifications() {

const [notifications,setNotifications]=useState([]);

useEffect(()=>{

loadNotifications();

},[]);

async function loadNotifications(){

const {

data:{user}

}=await supabase.auth.getUser();

if(!user)return;

const {

data,
error

}=await supabase

.from("notification_users")

.select(`
is_read,
read_at,
notifications(
id,
type,
title,
message,
created_at
)
`)

.eq("profile_id",user.id)

.order("created_at",{
foreignTable:"notifications",
ascending:false
});

if(error){

console.log(error);

return;

}

setNotifications(data||[]);

}

async function markAsRead(notificationId){

const {

data:{user}

}=await supabase.auth.getUser();

if(!user)return;

const { error } = await supabase

.from("notification_users")

.update({

is_read:true,

read_at:new Date().toISOString()

})

.eq("notification_id",notificationId)

.eq("profile_id",user.id);

if(error){

console.log(error);

return;

}

setNotifications((current)=>

current.map((n)=>

n.notifications.id===notificationId

?{

...n,

is_read:true,

read_at:new Date().toISOString()

}

:n

)

);

}

  return (

    <Page>

      <h1 className="page-title">
        🔔 Notifications
      </h1>

      <Card>

       {

notifications.length===0

?

<>

<h2 className="section-title">

Aucune notification

</h2>

<p
style={{
opacity:.7,
lineHeight:1.7
}}
>

Vous n'avez aucune notification.

</p>

</>

:

notifications.map((n)=>(

<div

key={n.notifications.id}

onClick={()=>{

if(!n.is_read){

markAsRead(n.notifications.id);

}

}}

style={{

cursor:"pointer",

transition:"all .2s",

padding:"16px",

marginBottom:"12px",

borderRadius:"14px",

background:

n.is_read

?

"rgba(255,255,255,.03)"

:

"rgba(70,200,120,.12)",

border:

n.is_read

?

"1px solid rgba(255,255,255,.08)"

:

"1px solid rgba(70,200,120,.35)"

}}

>

<div
style={{
fontWeight:"700",
fontSize:"17px"
}}
>

{n.notifications.title}

{

!n.is_read &&

<span

style={{

marginLeft:"10px",

fontSize:"12px",

background:"#4ade80",

color:"#111",

padding:"2px 8px",

borderRadius:"999px",

fontWeight:"700"

}}

>

NOUVEAU

</span>

}

</div>

<div
style={{
marginTop:"6px",
opacity:.75
}}
>

{n.notifications.message}

</div>

<div
style={{
marginTop:"10px",
fontSize:"13px",
opacity:.5
}}
>

{

new Date(

n.notifications.created_at

).toLocaleString("fr-FR")

}

</div>

</div>

))

}

      </Card>

    </Page>

  );

}