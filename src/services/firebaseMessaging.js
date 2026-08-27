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

  if (
    !(await isSupported())
  ) {

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


        /*
         * -------------------------------------------------
         * VÉRIFICATION DES AUTORISATIONS
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
         * SERVICE WORKER ACTIF
         * -------------------------------------------------
         */

        const registration =
          await navigator.serviceWorker.ready;


        /*
         * -------------------------------------------------
         * DONNÉES DU MESSAGE
         * -------------------------------------------------
         */

        const data =
          payload.data || {};


        const notification =
          payload.notification || {};


        /*
         * -------------------------------------------------
         * TITRE
         *
         * Les notifications personnalisées de l'application
         * peuvent transmettre le titre dans payload.data.
         * -------------------------------------------------
         */

        const title =
          data.title ||
          notification.title ||
          "Foot Five";


        /*
         * -------------------------------------------------
         * MESSAGE
         *
         * Notre système utilise principalement data.message.
         * On conserve également les autres formats possibles.
         * -------------------------------------------------
         */

        const body =
          data.message ||
          data.body ||
          notification.body ||
          "";


        /*
         * -------------------------------------------------
         * TAG UNIQUE
         *
         * Évite qu'une notification concernant le résultat
         * soit remplacée par une autre notification du même
         * match.
         * -------------------------------------------------
         */

        const notificationTag =

          data.type &&
          data.actionId

            ? `${data.type}-${data.actionId}`

            : data.type ||
              "foot-five";


        /*
         * -------------------------------------------------
         * AFFICHAGE DE LA NOTIFICATION
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


        /*
         * -------------------------------------------------
         * LOG DE CONTRÔLE
         * -------------------------------------------------
         */

        console.log(
          "🔔 Notification affichée au premier plan :",
          {
            title,
            body,
            data,
            tag:
              notificationTag,
          }
        );

      }
    );


  return unsubscribe;

}