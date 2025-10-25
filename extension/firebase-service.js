// Firestore database service for managing user data
import { db, auth } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from "firebase/firestore";

/**
 * Initialize user document on first login
 * @param {string} uid - User ID from Firebase Auth
 * @param {object} userData - User profile data
 */
export async function initializeUserDocument(uid, userData) {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    // Only initialize if user document doesn't exist
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        profile: {
          email: userData.email,
          displayName: userData.displayName || "User",
          photoURL: userData.photoURL || null,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        },
        stats: {
          totalChatsWithAI: 0,
          totalItemsViewed: 0,
          totalPurchasesAttempted: 0,
          totalPurchasesCompleted: 0,
          totalPurchasesPrevented: 0,
          moneySpentOnPurchases: 0,
          estimatedMoneySaved: 0,
          lastUpdated: serverTimestamp()
        },
        preferences: {
          enableNotifications: true,
          enableAnalytics: true,
          blockedDomains: [],
          allowedDomains: [],
          theme: "dark",
          language: "en"
        }
      });
      console.log("User document initialized for:", uid);
    } else {
      // Update last login
      await updateDoc(userRef, {
        "profile.lastLogin": serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error initializing user document:", error);
    throw error;
  }
}

/**
 * Log a chat session with AI
 * @param {string} uid - User ID
 * @param {object} chatData - Chat metadata
 * @returns {Promise<string>} - Chat ID
 */
export async function logChat(uid, chatData) {
  try {
    const userRef = doc(db, "users", uid);
    
    const chatRef = await addDoc(collection(userRef, "chats"), {
      timestamp: serverTimestamp(),
      domain: chatData.domain || "unknown",
      itemName: chatData.itemName || "",
      itemPrice: chatData.itemPrice || 0,
      itemURL: chatData.itemURL || "",
      outcome: "in_progress",
      aiHealth: 100,
      userConvinced: false,
      duration: 0,
      messageCount: 0
    });

    return chatRef.id;
  } catch (error) {
    console.error("Error logging chat:", error);
    throw error;
  }
}

/**
 * Add message to chat
 * @param {string} uid - User ID
 * @param {string} chatId - Chat ID
 * @param {object} message - Message data
 */
export async function addMessageToChat(uid, chatId, message) {
  try {
    const chatRef = doc(db, "users", uid, "chats", chatId);
    const messagesRef = collection(chatRef, "messages");

    await addDoc(messagesRef, {
      role: message.role,
      content: message.content,
      timestamp: serverTimestamp(),
      damage: message.damage || 0
    });

    // Update chat metadata
    await updateDoc(chatRef, {
      messageCount: increment(1),
      aiHealth: message.damage ? increment(-message.damage) : increment(0)
    });

    console.log("Message added to chat:", chatId);
  } catch (error) {
    console.error("Error adding message to chat:", error);
    throw error;
  }
}

/**
 * Complete a chat session
 * @param {string} uid - User ID
 * @param {string} chatId - Chat ID
 * @param {object} outcome - Final outcome data
 */
export async function completChat(uid, chatId, outcome) {
  try {
    const chatRef = doc(db, "users", uid, "chats", chatId);
    const currentTime = new Date();
    const chatSnapshot = await getDoc(chatRef);
    const chatData = chatSnapshot.data();
    
    // Calculate duration in seconds
    const createdAt = chatData.timestamp?.toDate() || new Date();
    const duration = Math.floor((currentTime - createdAt) / 1000);

    await updateDoc(chatRef, {
      outcome: outcome.type, // "purchased" | "prevented" | "abandoned"
      userConvinced: outcome.userConvinced || false,
      duration: duration
    });

    // Update user stats
    await updateUserStats(uid, {
      totalChatsWithAI: increment(1),
      totalItemsViewed: increment(1),
      totalPurchasesAttempted: increment(outcome.type !== "abandoned" ? 1 : 0),
      totalPurchasesCompleted: increment(outcome.type === "purchased" ? 1 : 0),
      totalPurchasesPrevented: increment(outcome.type === "prevented" ? 1 : 0),
      moneySpentOnPurchases: increment(outcome.type === "purchased" ? (chatData.itemPrice || 0) : 0),
      estimatedMoneySaved: increment(outcome.type === "prevented" ? (chatData.itemPrice || 0) : 0)
    });

    console.log("Chat completed:", chatId, "Outcome:", outcome.type);
  } catch (error) {
    console.error("Error completing chat:", error);
    throw error;
  }
}

/**
 * Log a purchase
 * @param {string} uid - User ID
 * @param {object} purchaseData - Purchase information
 */
export async function logPurchase(uid, purchaseData) {
  try {
    const userRef = doc(db, "users", uid);
    
    await addDoc(collection(userRef, "purchases"), {
      timestamp: serverTimestamp(),
      domain: purchaseData.domain || "unknown",
      itemName: purchaseData.itemName || "",
      itemPrice: purchaseData.itemPrice || 0,
      itemURL: purchaseData.itemURL || "",
      category: purchaseData.category || "general",
      outcome: purchaseData.outcome, // "completed" | "prevented"
      chatId: purchaseData.chatId || null,
      reasonForPurchase: purchaseData.reasonForPurchase || "",
      aiArgument: purchaseData.aiArgument || "",
      duration: purchaseData.duration || 0
    });

    console.log("Purchase logged:", purchaseData.itemName);
  } catch (error) {
    console.error("Error logging purchase:", error);
    throw error;
  }
}

/**
 * Update user statistics
 * @param {string} uid - User ID
 * @param {object} updates - Stats to increment
 */
export async function updateUserStats(uid, updates) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      "stats.lastUpdated": serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
}

/**
 * Get user data
 * @param {string} uid - User ID
 * @returns {Promise<object>} - User data
 */
export async function getUserData(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("User document does not exist");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

/**
 * Get user chats
 * @param {string} uid - User ID
 * @param {number} limit - Max number of chats to fetch
 * @returns {Promise<array>} - Array of chats
 */
export async function getUserChats(uid, limit = 50) {
  try {
    const userRef = doc(db, "users", uid);
    const chatsRef = collection(userRef, "chats");
    const q = query(chatsRef); // Add orderBy, etc as needed
    const querySnapshot = await getDocs(q);
    
    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    
    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

/**
 * Get user purchases
 * @param {string} uid - User ID
 * @param {string} outcome - Filter by outcome ("completed", "prevented")
 * @returns {Promise<array>} - Array of purchases
 */
export async function getUserPurchases(uid, outcome = null) {
  try {
    const userRef = doc(db, "users", uid);
    const purchasesRef = collection(userRef, "purchases");
    
    let q;
    if (outcome) {
      q = query(purchasesRef, where("outcome", "==", outcome));
    } else {
      q = query(purchasesRef);
    }
    
    const querySnapshot = await getDocs(q);
    const purchases = [];
    querySnapshot.forEach((doc) => {
      purchases.push({ id: doc.id, ...doc.data() });
    });
    
    return purchases;
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw error;
  }
}

export default {
  initializeUserDocument,
  logChat,
  addMessageToChat,
  completChat,
  logPurchase,
  updateUserStats,
  getUserData,
  getUserChats,
  getUserPurchases
};
