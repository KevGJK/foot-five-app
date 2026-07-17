import { supabase } from "../lib/supabase";

export async function isPushSupported(){

    return(

        "serviceWorker" in navigator &&

        "PushManager" in window &&

        "Notification" in window

    );

}

export async function getPermission(){

    if(!("Notification" in window)){

        return "unsupported";

    }

    return Notification.permission;

}

export async function requestPermission(){

    return await Notification.requestPermission();

}

function urlBase64ToUint8Array(base64String) {

    const padding = "=".repeat((4 - base64String.length % 4) % 4);

    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {

        outputArray[i] = rawData.charCodeAt(i);

    }

    return outputArray;

}

export async function subscribeToPush() {


    const registration = await navigator.serviceWorker.ready;

    const existingSubscription =
        await registration.pushManager.getSubscription();

    if (existingSubscription) {

        return existingSubscription;

    }


    const subscription =
        await registration.pushManager.subscribe({

            userVisibleOnly: true,

            applicationServerKey: urlBase64ToUint8Array(
                import.meta.env.VITE_VAPID_PUBLIC_KEY
            )

        });


    return subscription;

}

export async function saveSubscription(subscription){

    const {

        data:{user}

    } = await supabase.auth.getUser();

    if(!user){

        throw new Error("Utilisateur non connecté");

    }

    const json = subscription.toJSON();

    const {

        error

    } = await supabase
  .from("push_subscriptions")
  .upsert(
    {
      profile_id: user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    },
    {
      onConflict: "profile_id,endpoint"

        });

    if(error){

        throw error;

    }

}