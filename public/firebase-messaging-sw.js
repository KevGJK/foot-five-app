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

messaging.onBackgroundMessage((payload) => {

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png"
    }
  );

});