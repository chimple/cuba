import { initializeApp } from "firebase/app";
import {FirebaseAnalytics} from "@capacitor-community/firebase-analytics";
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
  setTokenAutoRefreshEnabled,
} from "firebase/app-check";
// import firebase from "firebase/app-check";

// declare global {
//   // eslint-disable-next-line no-var
//   var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
// }\

export const initializeFireBase = () => {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY!,
        authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
        projectId: process.env.REACT_APP_PROJECT_ID!,
        storageBucket: process.env.REACT_APP_STORAGE_BUCKET!,
        messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID!,
        appId: process.env.REACT_APP_APP_ID!,
        measurementId: process.env.REACT_APP_MEASUREMENT_ID!
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig); 
  // Initialize Cloud Firestore and get a reference to the service

  // const db = getFirestore(app)

  initializeFirestore(app, {
    localCache: persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED }),
  });

  FirebaseAnalytics.initializeFirebase(firebaseConfig);
};