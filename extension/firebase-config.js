// Firebase configuration for Impulse Purchase Tracker
// This file initializes Firebase for the extension

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApakUK4i73i2s_8hvRxTO410BXfvZDKUk",
  authDomain: "impulse-purchase-tracker.firebaseapp.com",
  projectId: "impulse-purchase-tracker",
  storageBucket: "impulse-purchase-tracker.firebasestorage.app",
  messagingSenderId: "546051675035",
  appId: "1:546051675035:web:13390f7e78a5bcedb7473e",
  measurementId: "G-YQHHDTH1SF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Enable persistence for auth (survives page refresh/reload)
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Initialize Firestore
const db = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .catch((error) => {
    if (error.code === 'failed-precondition') {
      console.warn("Multiple tabs open - offline persistence disabled");
    } else if (error.code === 'unimplemented') {
      console.warn("Browser doesn't support offline persistence");
    }
  });

export { app, auth, db };
