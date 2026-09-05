importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCt-PTinnKemSJc-xw58JVHDXW0GtBkrvg",
  authDomain: "foot-five-manager.firebaseapp.com",
  projectId: "foot-five-manager",
  storageBucket: "foot-five-manager.firebasestorage.app",
  messagingSenderId: "1019133606169",
  appId: "1:1019133606169:web:be054941c34cfa20fa2d88",
});

const messaging = firebase.messaging();

/*
 * =====================================================
 * NOTIFICATION EN ARRIÈRE-PLAN
 * =====================================================
 */

messaging.onBackgroundMessage((payload) => {

  console.log(
    "📱 FCM reçu en arrière-plan :",
    payload
  );

  const data = payload.data || {};

  const notification = payload.notification || {};

  const title =
    data.title ||
    notification.title ||
    "Foot Five Manager";

  const body =
    data.message ||
    data.body ||
    notification.body ||
    "Nouvelle notification";

  const notificationData = {
    type: data.type || "",
    action: data.action || "",
    actionId: data.actionId || "",
  };

  self.registration.showNotification(
    title,
    {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: notificationData,
      tag: data.type && data.actionId
  ? `${data.type}-${data.actionId}`
  : data.type || "foot-five",
renotify: true,

    }
  );

});


/*
 * =====================================================
 * CLIC SUR LA NOTIFICATION
 * =====================================================
 */

self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const payload =
    event.notification.data || {};

  /*
   * -----------------------------------------------------
   * NOTIFICATION LIÉE À UN MATCH
   * -----------------------------------------------------
   */

  if (
    payload.action === "match" &&
    payload.actionId
  ) {

    let view = "vote";

    const notificationType =
      String(
        payload.type || ""
      ).toLowerCase();

    if (
      notificationType === "teams_ready"
    ) {

      view = "teams";

    }

    else if (
      notificationType === "match_result"
    ) {

      view = "result";

    }

    else if (
      notificationType === "player_joined" ||
      notificationType === "player_left" ||
      notificationType === "player_promoted"
    ) {

      view = "details";

    }

    const url =
      `/match/${encodeURIComponent(
        payload.actionId
      )}?view=${view}`;

    event.waitUntil(
      clients.openWindow(url)
    );

    return;
  }


  /*
   * -----------------------------------------------------
   * NOTIFICATION SANS MATCH
   * -----------------------------------------------------
   */

  event.waitUntil(
    clients.openWindow("/")
  );

});