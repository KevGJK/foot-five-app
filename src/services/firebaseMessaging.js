import { firebaseApp } from "../lib/firebase";

import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";


let messagingInstance = null;


/*
 * =====================================================
 * INITIALISATION FIREBASE MESSAGING
 * =====================================================
 */

async function getMessagingInstance() {

  if (!(await isSupported())) {

    throw new Error(
      "Firebase Messaging n'est pas supporté sur cet appareil."
    );

  }


  if (!messagingInstance) {

    messagingInstance =
      getMessaging(firebaseApp);

  }


  return messagingInstance;

}


/*
 * =====================================================
 * RÉCUPÉRATION DU TOKEN FCM
 * =====================================================
 */

export async function getFCMToken() {

  const registration =
    await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );


  console.log(
    "✅ Firebase SW :",
    registration.scope
  );


  const messaging =
    await getMessagingInstance();


  const token =
    await getToken(
      messaging,
      {

        vapidKey:
          import.meta.env
            .VITE_VAPID_PUBLIC_KEY,

        serviceWorkerRegistration:
          registration,

      }
    );


  console.log(
    "✅ FCM TOKEN :",
    token
  );


  return token;

}


/*
 * =====================================================
 * NOTIFICATIONS REÇUES AU PREMIER PLAN
 * =====================================================
 */

export async function listenToForegroundMessages() {

  const messaging =
    await getMessagingInstance();


  const unsubscribe =
    onMessage(
      messaging,
      async (payload) => {

        console.log(
          "📩 Message Firebase reçu au premier plan :",
          payload
        );


        try {

          /*
           * -------------------------------------------------
           * AUTORISATION
           * -------------------------------------------------
           */

          if (
            Notification.permission !== "granted"
          ) {

            console.log(
              "🔕 Permission de notification non accordée"
            );

            return;

          }


          /*
           * -------------------------------------------------
           * DONNÉES REÇUES
           * -------------------------------------------------
           */

          const data =
            payload.data || {};


          const notification =
            payload.notification || {};


          console.log(
            "📦 Données détaillées de la notification :",
            {
              data,
              notification
            }
          );


          /*
           * -------------------------------------------------
           * TITRE
           * -------------------------------------------------
           */

          const title =
            data.title ||
            notification.title ||
            "Foot Five";


          /*
           * -------------------------------------------------
           * MESSAGE
           * -------------------------------------------------
           */

          const body =
            data.message ||
            data.body ||
            notification.body ||
            "";


          /*
           * -------------------------------------------------
           * TAG
           * -------------------------------------------------
           */

          const notificationTag =

            data.type &&
            data.actionId

              ? `${data.type}-${data.actionId}`

              : data.type ||
                "foot-five";


          console.log(
            "🔔 Tentative d'affichage de la notification :",
            {
              title,
              body,
              tag: notificationTag
            }
          );


          /*
           * -------------------------------------------------
           * SERVICE WORKER
           * -------------------------------------------------
           */

          const registration =
            await navigator.serviceWorker.ready;


          console.log(
            "✅ Service Worker prêt pour la notification :",
            registration.scope
          );


          /*
           * -------------------------------------------------
           * AFFICHAGE
           * -------------------------------------------------
           */

          await registration.showNotification(

            title,

            {

              body,

              icon:
                "/icon-192.png",

              badge:
                "/icon-192.png",

              data,

              tag:
                notificationTag,

              renotify:
                true,

            }

          );


          console.log(
            "🔔 Notification affichée au premier plan :",
            {
              title,
              body,
              data,
              tag: notificationTag,
            }
          );


        }
        catch (error) {

          console.error(
            "❌ Erreur affichage notification foreground :",
            error
          );

        }

      }
    );


  return unsubscribe;

}