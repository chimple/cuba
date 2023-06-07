import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
// }

export const initializeFireBase = () => {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Cloud Firestore and get a reference to the service
  const db = getFirestore(app);
  console.log(
    "if (location.hostname === localhost) {",
    window.location.hostname,
    window.location.hostname === "localhost"
  );

  // if (window.location.hostname === "localhost") {
  // @ts-ignore
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  // @ts-ignore
  window.FIREBASE_APPCHECK_DEBUG_TOKEN =
    process.env.APP_CHECK_DEBUG_TOKEN_FROM_CI;
  // }
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      "6Lcp2XImAAAAAKp3bKVMm5-yUBaQvFt8lbw7SSfT"
    ),

    // Optional argument. If true, the SDK automatically refreshes App Check
    // tokens as needed.
    isTokenAutoRefreshEnabled: true,
  });
  
  // getFirebaseAuthSettings().forceRecaptchaFlowForTesting();
  setTokenAutoRefreshEnabled(appCheck, true);
  getToken(appCheck)
    .then((t) => {
      console.log("success ", t);
    })
    .catch((error) => {
      console.log("Failed ", error.message);
    });
};
