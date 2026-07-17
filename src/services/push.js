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