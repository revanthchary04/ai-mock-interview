// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
    throw new Error(
      `Missing Firebase web configuration: ${missingVars.join(", ")}. ` +
        "Add the Firebase Web App config from Firebase Console > Project settings > Your apps."
    );
  }

  return firebaseConfig;
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(getFirebaseClientConfig()) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
