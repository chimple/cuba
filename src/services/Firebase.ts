import { initializeApp } from "firebase/app";
import { FirebaseAnalytics } from "@capacitor-community/firebase-analytics";
import { Device } from "@capacitor/device";
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

export const initializeFireBase = async () => {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY!,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
    projectId: process.env.REACT_APP_PROJECT_ID!,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET!,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID!,
    appId: process.env.REACT_APP_APP_ID!,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID!,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Cloud Firestore and get a reference to the service

  // const db = getFirestore(app)

  initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      tabManager: persistentMultipleTabManager(),
    }),
  });

  var deviceInfo = await Device.getInfo();

  if (deviceInfo.platform === "web") {
    FirebaseAnalytics.initializeFirebase(firebaseConfig);
    console.log("Web firebase analytics initialized", FirebaseAnalytics);
  }

};
