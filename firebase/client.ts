import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function getFirebaseClientConfig() {
  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      (projectId ? `${projectId}.firebaseapp.com` : undefined),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const missingVars = [
    !firebaseConfig.apiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    !firebaseConfig.projectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    !firebaseConfig.appId && "NEXT_PUBLIC_FIREBASE_APP_ID",
  ].filter(Boolean);

  if (missingVars.length) {
    return null;
  }

  return firebaseConfig;
}

const firebaseConfig = getFirebaseClientConfig();
const app = firebaseConfig
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
