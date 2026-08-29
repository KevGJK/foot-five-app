import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import Page from "../components/ui/Page";
import Card from "../components/ui/Card";

export default function Notifications({
  onNotificationsChange
}) {

const [notifications,setNotifications]=useState([]);

useEffect(() => {

  let cancelled = false;

  async function loadNotifications() {

    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    if (!user || cancelled) {
      return;
    }

    const {
      data,
      error
    } = await supabase
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
      .eq("profile_id", user.id)
      .order("created_at", {
        foreignTable: "notifications",
        ascending: false
      });

    if (cancelled) {
      return;
    }

    if (error) {
      console.log(error);
      return;
    }

    setNotifications(

  (data || []).sort(
    (a,b) =>
      new Date(
        b.notifications?.created_at
      ) -
      new Date(
        a.notifications?.created_at
      )
  )

);

  }

  loadNotifications();

  return () => {
    cancelled = true;
  };

}, []);

async function markAsRead(notificationId){

  const {
    data: {
      user
    }
  } =
  await supabase.auth.getUser();

  if (!user) {
    console.log(
      "❌ Aucun utilisateur connecté"
    );

    return;
  }

  console.log(
    "🔔 Tentative de lecture notification :",
    notificationId
  );

  console.log(
    "👤 Utilisateur :",
    user.id
  );

  const readAt =
    new Date().toISOString();

  const {
    data: updatedRows,
    error
  } =
  await supabase

  .from("notification_users")

  .update({

    is_read: true,

    read_at: readAt

  })

  .eq(
    "notification_id",
    notificationId
  )

  .eq(
    "profile_id",
    user.id
  )

  .select();

  if (error) {

    console.error(
      "❌ Erreur UPDATE notification :",
      error
    );

    return;

  }

  console.log(
    "✅ Lignes réellement modifiées :",
    updatedRows
  );

  if (
    !updatedRows ||
    updatedRows.length === 0
  ) {

    console.error(
      "⚠️ Aucune ligne n'a été modifiée."
    );

    return;

  }

  setNotifications((current) =>

    current.map((n) =>

      n.notifications.id === notificationId

      ? {

          ...n,

          is_read: true,

          read_at: readAt

        }

      : n

    )

  );

  console.log(
    "🔄 Mise à jour du compteur Dashboard"
  );

  await onNotificationsChange?.();

}

async function deleteNotification(
  notificationId,
  wasUnread
){

  const ok =
    window.confirm(
      "Supprimer cette notification ?"
    );

  if (!ok) {
    return;
  }


  const {
    data: {
      user
    }
  } =
  await supabase.auth.getUser();


  if (!user) {

    console.log(
      "❌ Aucun utilisateur connecté"
    );

    return;

  }


  const {
    data: deletedRows,
    error
  } =
  await supabase

  .from("notification_users")

  .delete()

  .eq(
    "notification_id",
    notificationId
  )

  .eq(
    "profile_id",
    user.id
  )

  .select();


  if (error) {

    console.error(
      "❌ Erreur suppression notification :",
      error
    );

    alert(
      "Impossible de supprimer cette notification."
    );

    return;

  }


  if (
    !deletedRows ||
    deletedRows.length === 0
  ) {

    console.error(
      "⚠️ Aucune notification supprimée."
    );

    return;

  }


  setNotifications(
    (current) =>

      current.filter(
        (n) =>

          n.notifications.id !==
          notificationId
      )
  );


  if (wasUnread) {

    await onNotificationsChange?.();

  }

}

async function deleteAllNotifications(){

  if (
    notifications.length === 0
  ) {
    return;
  }


  const ok =
    window.confirm(
      "Supprimer toutes vos notifications ? Cette action est irréversible."
    );


  if (!ok) {
    return;
  }


  const {
    data: {
      user
    }
  } =
  await supabase.auth.getUser();


  if (!user) {

    console.log(
      "❌ Aucun utilisateur connecté"
    );

    return;

  }


  const {
    data: deletedRows,
    error
  } =
  await supabase

  .from("notification_users")

  .delete()

  .eq(
    "profile_id",
    user.id
  )

  .select();


  if (error) {

    console.error(
      "❌ Erreur suppression de toutes les notifications :",
      error
    );

    alert(
      "Impossible de supprimer les notifications."
    );

    return;

  }


  console.log(
    "🗑️ Notifications supprimées :",
    deletedRows
  );


  setNotifications([]);


  await onNotificationsChange?.();

}

  return (

    <Page>

      <h1 className="page-title">
        🔔 Notifications
      </h1>

      <Card>

      {

notifications.length > 0 && (

<button

onClick={deleteAllNotifications}

style={{

width:"100%",

marginBottom:"18px",

padding:"12px",

borderRadius:"12px",

border:"1px solid rgba(255,255,255,.15)",

background:"rgba(255,255,255,.05)",

color:"white",

cursor:"pointer",

fontSize:"15px",

fontWeight:"700"

}}

>

🗑️ Supprimer toutes les notifications

</button>

)

}

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

markAsRead(
  n.notifications.id
);

}

}}

style={{

cursor:"pointer",

transition:"all .2s",

padding:"16px",

paddingRight:"70px",

marginBottom:"12px",

borderRadius:"14px",

position:"relative",

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


<button

onClick={(e)=>{

e.stopPropagation();

deleteNotification(

  n.notifications.id,

  !n.is_read

);

}}

title="Supprimer la notification"

style={{

position:"absolute",

right:"14px",

top:"50%",

transform:"translateY(-50%)",

background:"transparent",

border:"none",

cursor:"pointer",

fontSize:"22px",

padding:"8px",

opacity:.7

}}

>

🗑️

</button>


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