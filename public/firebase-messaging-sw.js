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

self.addEventListener("push", (event) => {

  console.log("📦 PUSH reçu :", event);

  if (!event.data) {
    console.log("❌ Aucun payload");
    return;
  }

  const payload = event.data.json();

  console.log("📦 PUSH DATA :", payload);

  event.waitUntil(

  self.registration.showNotification(

  payload.notification.title,

  {

    body: payload.notification.body,

    icon: "/icon-192.png",

    badge: "/icon-192.png",

    data: payload.data

  }
  )
);

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

    event.waitUntil(
      clients.openWindow(
        `/match/${payload.actionId}`
      )
    );

    return;

  }

  event.waitUntil(
    clients.openWindow("/")
  );

});

messaging.onBackgroundMessage((payload) => {

  console.log("📩 Background message :", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: payload.data
    }
  );

});