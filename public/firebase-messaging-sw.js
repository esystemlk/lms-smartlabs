importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDImEckVxL0AxArkmqecsTI_JmeAxIqIDE",
  authDomain: "lms-smartlabs.firebaseapp.com",
  projectId: "lms-smartlabs",
  storageBucket: "lms-smartlabs.firebasestorage.app",
  messagingSenderId: "1075503507887",
  appId: "1:1075503507887:web:88596ea4f2bef60fd7e75a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
