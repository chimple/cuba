import { initializeApp } from 'firebase/app';
import { FirebaseAnalytics } from '@capacitor-community/firebase-analytics';
import { Device } from '@capacitor/device';
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import logger from '../utility/logger';

const REQUIRED_FIREBASE_ENV_KEYS = [
  'VITE_API_KEY',
  'VITE_AUTH_DOMAIN',
  'VITE_PROJECT_ID',
  'VITE_STORAGE_BUCKET',
  'VITE_MESSAGING_SENDER_ID',
  'VITE_APP_ID',
] as const;

export const initializeFireBase = async () => {
  const missingKeys = REQUIRED_FIREBASE_ENV_KEYS.filter(
    (key) => !(import.meta.env as Record<string, string | undefined>)[key],
  );

  if (missingKeys.length > 0) {
    logger.warn('Firebase config is missing required Vite env keys.', {
      missingKeys,
    });
    return;
  }

  const measurementId = import.meta.env.VITE_MEASUREMENT_ID;
  const apiKey = import.meta.env.VITE_API_KEY;
  const authDomain = import.meta.env.VITE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_APP_ID;
  const firebaseConfig = {
    apiKey: apiKey as string,
    authDomain: authDomain as string,
    projectId: projectId as string,
    storageBucket: storageBucket as string,
    messagingSenderId: messagingSenderId as string,
    appId: appId as string,
    ...(measurementId ? { measurementId } : {}),
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

  const deviceInfo = await Device.getInfo();

  if (deviceInfo.platform === 'web') {
    if (!measurementId) {
      logger.warn(
        'Firebase Analytics initialization skipped because VITE_MEASUREMENT_ID is missing in .env.local.',
      );
      return;
    }

    try {
      await FirebaseAnalytics.initializeFirebase({
        ...firebaseConfig,
        measurementId,
      });
    } catch (error) {
      logger.warn(
        'Firebase Analytics initialization failed. Verify VITE_APP_ID, VITE_PROJECT_ID, and VITE_MEASUREMENT_ID in .env.local.',
        { error },
      );
    }
  }
};
