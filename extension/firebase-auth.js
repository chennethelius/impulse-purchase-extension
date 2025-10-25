// Firebase Authentication Service
import { auth, db } from './firebase-config.js';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { initializeUserDocument } from './firebase-service.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 * @returns {Promise<object>} - User credentials
 */
export async function signInWithGoogle() {
  try {
    // Set persistence before sign in
    await setPersistence(auth, browserLocalPersistence);
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Initialize user document if this is their first login
    await initializeUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });

    console.log("User signed in:", user.email);
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

/**
 * Sign out user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

/**
 * Get current user
 * @returns {object|null} - Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 * @param {function} callback - Callback function
 * @returns {function} - Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export default {
  signInWithGoogle,
  signOutUser,
  getCurrentUser,
  onAuthChange
};
