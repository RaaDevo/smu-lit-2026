import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const authEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH === "true";
export const firestoreEnabled =
  process.env.NEXT_PUBLIC_ENABLE_FIRESTORE === "true";

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfigured) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseServices(): {
  auth: Auth;
  db: Firestore;
} | null {
  try {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) return null;

    return {
      auth: getAuth(firebaseApp),
      db: getFirestore(firebaseApp),
    };
  } catch {
    return null;
  }
}
