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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const payload = event.notification.data;

  if (!payload) {
    event.waitUntil(
      clients.openWindow("/")
    );
    return;
  }

if (
  payload.action === "match" &&
  payload.actionId
) {

  let view = "vote";

  /*
   * ------------------------------------------------
   * DÉTERMINATION DE L'ÉCRAN À OUVRIR
   * ------------------------------------------------
   */

const notificationType =
  String(payload.type || "").toLowerCase();

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

  /*
   * ------------------------------------------------
   * OUVERTURE DU MATCH
   * ------------------------------------------------
   */

  const url =
    `/match/${encodeURIComponent(
      payload.actionId
    )}?view=${view}`;

  event.waitUntil(
    clients.openWindow(url)
  );

  return;
}

  event.waitUntil(
    clients.openWindow("/")
  );
});