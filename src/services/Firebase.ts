import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

import firebase from "firebase/compat/app";

export const initializeFireBase = () => {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA8hDKKh8npBMK9bU4AR9Bsy3ArdbiiH0I",
    authDomain: "cuba-stage.firebaseapp.com",
    projectId: "cuba-stage",
    storageBucket: "cuba-stage.appspot.com",
    messagingSenderId: "1034970790912",
    appId: "1:1034970790912:web:946ac6f3b193485cd1ece5",
    measurementId: "G-0QTCLQQGR5",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  // Initialize Cloud Firestore and get a reference to the service
  const db = getFirestore(app);
};
