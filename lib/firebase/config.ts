/**
 * Firebase Configuration
 * 
 * This file initializes the Firebase app and exports Firebase services.
 * 
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Email/Password provider)
 * 3. Create a Firestore database
 * 4. Register a web app and copy the config
 * 5. Create .env.local file with the following variables:
 *    - NEXT_PUBLIC_FIREBASE_API_KEY
 *    - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *    - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *    - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *    - NEXT_PUBLIC_FIREBASE_APP_ID
 * 
 * Note: Firebase Storage is NOT required for this app.
 * CSV files are parsed in the browser and data is stored directly in Firestore.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (prevent multiple instances in development)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
export default app;
