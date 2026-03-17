importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// These are usually public and safe to include in SW.
firebase.initializeApp({
  apiKey: "AIzaSyDImEckVxL0AxArkmqecsTI_JmeAxIqIDE",
  authDomain: "lms-smartlabs.firebaseapp.com",
  projectId: "lms-smartlabs",
  storageBucket: "lms-smartlabs.firebasestorage.app",
  messagingSenderId: "1075503507887",
  appId: "1:1075503507887:web:88596ea4f2bef60fd7e75a"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title || 'Smart Labs Notification';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
