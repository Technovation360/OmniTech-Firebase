import 'server-only';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: This file should only be used on the server.

function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  return {
    firebaseApp,
    firestore,
  };
}

export function initializeServerFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const prodConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };
      firebaseApp = initializeApp(prodConfig);
    } else {
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}
