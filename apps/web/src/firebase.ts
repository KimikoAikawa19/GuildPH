import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  setPersistence,
  type Auth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);
export const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export async function setSessionPersistence(remember: boolean) {
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}
