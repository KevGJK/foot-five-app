import { supabase } from "../lib/supabase";
import Page from "../components/ui/Page";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import { useEffect, useState } from "react";
import {
  isPushSupported,
  getPermission,
  requestPermission,
  subscribeToPush
} from "../services/push";

export default function Settings(){

const [pushEnabled,setPushEnabled]=useState(false);

const [pushSupported,setPushSupported]=useState(false);

const [pushPermission,setPushPermission]=useState("default");

const [subscriptionInfo,setSubscriptionInfo]=useState(null);

const [notifications,setNotifications]=useState({

newMatch:true,

matchUpdated:true,

matchCancelled:true,

teamsReady:true,

matchReminder:true,

newMember:true,

newSeason:true,

seasonClosed:true,

results:true

});

const [profile,setProfile]=useState(null);

useEffect(()=>{

load();

},[]);

async function load(){

    const {

        data:{user}

    } = await supabase.auth.getUser();

    if(!user) return;

    await loadProfile(user.id);

    await loadSettings(user.id);

    await checkPush();

}

async function loadProfile(profileId){

const {

data:{user}

}=await supabase.auth.getUser();

if(!user)return;

const {

data

}=await supabase

.from("profiles")

.select("display_name,email")

.eq("id",profileId)

.single();

setProfile(data);

}

async function loadSettings(profileId){

    let { data } = await supabase

    .from("user_settings")

    .select("*")

    .eq("profile_id",profileId)

    .single();

    if(!data){

        const { data:created } = await supabase

        .from("user_settings")

        .insert({

            profile_id:profileId

        })

        .select()

        .single();

        data = created;

    }

    setPushEnabled(data.push_enabled);

    setNotifications({

        newMatch:data.new_match,

        matchUpdated:data.match_updated,

        matchCancelled:data.match_cancelled,

        teamsReady:data.teams_ready,

        matchReminder:data.match_reminder,

        newMember:data.new_member,

        newSeason:data.new_season,

        seasonClosed:data.season_closed,

        results:data.results

    });

}

async function checkPush(){

    const supported = await isPushSupported();

    setPushSupported(supported);

    if(supported){

        const permission = await getPermission();

        setPushPermission(permission);

    }

}

async function updateNotification(key,value){

    const updated={

        ...notifications,

        [key]:value

    };

    setNotifications(updated);

    await saveSettings({

        [{
            newMatch:"new_match",
            matchUpdated:"match_updated",
            matchCancelled:"match_cancelled",
            teamsReady:"teams_ready",
            matchReminder:"match_reminder",
            newMember:"new_member",
            newSeason:"new_season",
            seasonClosed:"season_closed",
            results:"results"
        }[key]]:value

    });

}

async function saveSettings(changes){

    const {

        data:{user}

    } = await supabase.auth.getUser();

    if(!user) return;

    await supabase

    .from("user_settings")

    .upsert({

        profile_id:user.id,

        push_enabled:pushEnabled,

        new_match:notifications.newMatch,

        match_updated:notifications.matchUpdated,

        match_cancelled:notifications.matchCancelled,

        teams_ready:notifications.teamsReady,

        match_reminder:notifications.matchReminder,

        new_member:notifications.newMember,

        new_season:notifications.newSeason,

        season_closed:notifications.seasonClosed,

        results:notifications.results,

        ...changes,

        updated_at:new Date().toISOString()

    });

}

return(

<Page>

<h1 className="page-title">

⚙ Paramètres

</h1>

<Card>

<h2 className="section-title">

👤 Mon profil

</h2>

<div
style={{
fontSize:"22px",
fontWeight:"700"
}}
>

{profile?.display_name||"..."}

</div>

<div
style={{
opacity:.7,
marginTop:"6px",
marginBottom:"24px"
}}
>

{profile?.email||""}

</div>

<Button
variant="danger"
onClick={async()=>{

await supabase.auth.signOut();

window.location.reload();

}}
>

🚪 Déconnexion

</Button>

</Card>

<Card>

<h2 className="section-title">

🔔 Notifications

</h2>

<Switch

label="Activer les notifications"

checked={pushEnabled}

onChange={async(v)=>{

setPushEnabled(v);

await saveSettings({

push_enabled:v

});

}}

/>

<hr
style={{
border:"none",
borderTop:"1px solid rgba(255,255,255,.08)",
margin:"18px 0"
}}
/>

<Switch
label="Nouveau match"
checked={notifications.newMatch}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("newMatch",v)}
/>

<Switch
label="Modification d'un match"
checked={notifications.matchUpdated}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("matchUpdated",v)}
/>

<Switch
label="Match annulé"
checked={notifications.matchCancelled}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("matchCancelled",v)}
/>

<Switch
label="Composition des équipes"
checked={notifications.teamsReady}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("teamsReady",v)}
/>

<Switch
label="Rappel avant le match"
checked={notifications.matchReminder}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("matchReminder",v)}
/>

<Switch
label="Nouveau membre"
checked={notifications.newMember}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("newMember",v)}
/>

<Switch
label="Nouvelle saison"
checked={notifications.newSeason}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("newSeason",v)}
/>

<Switch
label="Fin de saison"
checked={notifications.seasonClosed}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("seasonClosed",v)}
/>

<Switch
label="Résultats"
checked={notifications.results}
disabled={!pushEnabled}
onChange={(v)=>updateNotification("results",v)}
/>

</Card>

<Card>

<h2 className="section-title">

📲 Notifications Push

</h2>

<div style={{marginBottom:"10px"}}>

<b>Compatibilité :</b>{" "}

{

pushSupported

?

"✅ Oui"

:

"❌ Non"

}

</div>

<div style={{marginBottom:"20px"}}>

<b>Autorisation :</b>{" "}

{

pushPermission==="granted"

?

"✅ Accordée"

:

pushPermission==="denied"

?

"❌ Refusée"

:

"⏳ Non demandée"

}

</div>

<Button

onClick={async()=>{

const permission = await requestPermission();

setPushPermission(permission);

}}

disabled={!pushSupported}

>

🔔 Autoriser les notifications Push

</Button>

<Button
style={{marginTop:"12px"}}
onClick={async()=>{

    try{

        const subscription = await subscribeToPush();

        console.log(subscription);

        setSubscriptionInfo(subscription.toJSON());

    }

    catch(e){

        console.error(e);

        alert(e.message);

    }

}}
>

🧪 Créer un abonnement Push

</Button>

{

subscriptionInfo &&

<pre
style={{

marginTop:"20px",

fontSize:"12px",

whiteSpace:"pre-wrap",

wordBreak:"break-word",

maxHeight:"250px",

overflow:"auto"

}}
>

{JSON.stringify(subscriptionInfo,null,2)}

</pre>

}

</Card>

<Card>

<h2 className="section-title">

📱 Application

</h2>

<div
style={{
display:"flex",
justifyContent:"space-between",
marginBottom:"12px"
}}
>

<span>Version</span>

<b>1.0.0</b>

</div>

<div
style={{
display:"flex",
justifyContent:"space-between"
}}
>

<span>Plateforme</span>

<b>PWA</b>

</div>

</Card>

<Card>

<h2 className="section-title">

ℹ️ À propos

</h2>

<div
style={{
lineHeight:"1.8"
}}
>

<b>Foot Five Manager</b>

<br/>

Développé par Kevin Gajecki

<br/>

Version 1.0.0

</div>

</Card>

</Page>

);

}