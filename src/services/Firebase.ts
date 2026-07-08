import { initializeApp } from 'firebase/app';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { Device } from '@capacitor/device';
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

export const initializeFireBase = async () => {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY!,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN!,
    projectId: import.meta.env.VITE_PROJECT_ID!,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET!,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID!,
    appId: import.meta.env.VITE_APP_ID!,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID!,
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

  if (deviceInfo.platform === 'web') {
    FirebaseAnalytics.initializeFirebase(firebaseConfig);
  }
};
