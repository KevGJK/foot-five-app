import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { PushResult } from "./types.ts";

export function getFirebaseConfig() {

  return {

    projectId: Deno.env.get("FIREBASE_PROJECT_ID")!,

    clientEmail: Deno.env.get("FIREBASE_CLIENT_EMAIL")!,

    privateKey: Deno.env
      .get("FIREBASE_PRIVATE_KEY")!
      .replace(/\\n/g, "\n"),

  };

}

function getMessagingInstance() {

  if (getApps().length === 0) {

    initializeApp({

      credential: cert(getFirebaseConfig())

    });

  }

  return getMessaging();

}

export async function sendFirebasePush(

  token: string,

  title: string,

  body: string,

  data: Record<string,string> = {}

){

  const messaging = getMessagingInstance();

  return await messaging.send({

    token,

    notification:{

      title,

      body

    },

    data

  });

}

export async function sendPushToDevices(

  devices: {
    profile_id: string;
    token: string;
    platform: string;
  }[],

  notification: {
    title: string;
    message: string;
    type: string;
    action: string | null;
    action_id: string | null;
  }

) {

  const results: PushResult[] = [];

  for (const device of devices) {

    try {

      const messageId = await sendFirebasePush(

        device.token,

        notification.title,

        notification.message,

        {

          type: notification.type,

          action: notification.action ?? "",

          actionId: notification.action_id ?? ""

        }

      );

      results.push({

        profile_id: device.profile_id,

        success: true,

        messageId

      });

    }

    catch (error) {

  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(
    `Erreur d'envoi vers ${device.profile_id}:`,
    message
  );

  results.push({

    profile_id: device.profile_id,

    success: false,

    error: message

  });

}

  }

  return results;

}