import { useEffect } from "react";
import { listenToForegroundMessages } from "./firebaseMessaging";

export default function NotificationListener() {
  useEffect(() => {
    let unsubscribe;
    let active = true;

    listenToForegroundMessages()
      .then((cleanup) => {
        if (active) {
          unsubscribe = cleanup;
        } else {
          cleanup();
        }
      })
      .catch((error) => {
        console.error(
          "❌ Impossible d'initialiser les notifications foreground :",
          error
        );
      });

    return () => {
      active = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return null;
}