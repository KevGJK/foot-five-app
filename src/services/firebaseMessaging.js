import { firebaseApp } from "../lib/firebase";
import {
  getMessaging,
  getToken,
  isSupported
} from "firebase/messaging";

export async function getFCMToken() {

  const supported = await isSupported();

  if (!supported) {
    console.log("Firebase Messaging non supporté");
    return null;
  }

  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  });

  return token;
}