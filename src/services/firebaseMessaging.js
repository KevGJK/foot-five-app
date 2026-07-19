import { firebaseApp } from "../lib/firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

let messagingInstance = null;

async function getMessagingInstance() {
  if (!(await isSupported())) {
    throw new Error("Firebase Messaging n'est pas supporté sur cet appareil.");
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp);
  }

  return messagingInstance;
}

export async function getFCMToken() {

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

  console.log("✅ Firebase SW :", registration.scope);

  const messaging = await getMessagingInstance();

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    serviceWorkerRegistration: registration,
  });

  console.log("✅ FCM TOKEN :", token);

  return token;
}