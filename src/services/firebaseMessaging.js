import { firebaseApp } from "../lib/firebase";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

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

export async function listenToForegroundMessages() {
  const messaging = await getMessagingInstance();

  const unsubscribe = onMessage(messaging, async (payload) => {
    console.log("📩 Message Firebase reçu au premier plan :", payload);

    if (Notification.permission !== "granted") {
      console.log("🔕 Permission de notification non accordée");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const title =
      payload.notification?.title || "Foot Five";

    const body =
      payload.notification?.body || "";

    await registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.data || {},
    });
  });

  return unsubscribe;
}