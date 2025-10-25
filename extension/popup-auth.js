// Popup Authentication Handler
// Handles login and profile dashboard for the extension popup

import { 
  signInWithGoogle, 
  signOutUser, 
  getCurrentUser,
  onAuthChange 
} from './firebase-auth.js';

import { 
  getUserData
} from './firebase-service.js';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const googleSigninBtn = document.getElementById('google-signin-btn');
const logoutBtn = document.getElementById('logout-btn');
const viewHistoryBtn = document.getElementById('view-history-btn');
const viewChatsBtn = document.getElementById('view-chats-btn');
const openDashboardBtn = document.getElementById('open-dashboard-btn');

// Profile elements
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profilePhoto = document.getElementById('profile-photo');

// Stats elements
const statPrevented = document.getElementById('stat-prevented');
const statSaved = document.getElementById('stat-saved');
const statSpent = document.getElementById('stat-spent');
const statChats = document.getElementById('stat-chats');

/**
 * Show a screen by hiding others
 */
function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  screen.classList.add('active');
}

/**
 * Load and display user profile and stats
 */
async function loadUserProfile(uid) {
  try {
    const userData = await getUserData(uid);
    const currentUser = getCurrentUser();

    if (!userData) {
      console.error('User data not found');
      return;
    }

    // Update profile info
    profileName.textContent = userData.profile?.displayName || 'User';
    profileEmail.textContent = userData.profile?.email || '';
    
    if (userData.profile?.photoURL) {
      profilePhoto.src = userData.profile.photoURL;
      profilePhoto.style.display = 'block';
    }

    // Update stats
    const stats = userData.stats || {};
    statPrevented.textContent = stats.totalPurchasesPrevented || 0;
    statSaved.textContent = `$${(stats.estimatedMoneySaved || 0).toFixed(2)}`;
    statSpent.textContent = `$${(stats.moneySpentOnPurchases || 0).toFixed(2)}`;
    statChats.textContent = stats.totalChatsWithAI || 0;

    console.log('User profile loaded:', userData.profile?.displayName);
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

/**
 * Handle Google Sign In
 */
googleSigninBtn.addEventListener('click', async () => {
  try {
    googleSigninBtn.disabled = true;
    googleSigninBtn.textContent = 'Signing in...';
    
    const user = await signInWithGoogle();
    console.log('Signed in successfully:', user.email);
    
    // Auth state changed listener will handle screen transition
  } catch (error) {
    console.error('Sign in error:', error);
    googleSigninBtn.disabled = false;
    googleSigninBtn.textContent = 'Sign in with Google';
    alert('Failed to sign in. Please try again.');
  }
});

/**
 * Handle Logout
 */
logoutBtn.addEventListener('click', async () => {
  try {
    await signOutUser();
    console.log('Signed out');
    // Auth state changed listener will handle screen transition
  } catch (error) {
    console.error('Sign out error:', error);
    alert('Failed to sign out. Please try again.');
  }
});

/**
 * Open full dashboard in new tab
 */
openDashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://impulse-tracker-dashboard.web.app' // Update with your dashboard URL
  });
});

/**
 * Show purchase history (in new tab with full dashboard)
 */
viewHistoryBtn.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://impulse-tracker-dashboard.web.app/purchases' // Update with your dashboard URL
  });
});

/**
 * Show chat history (in new tab with full dashboard)
 */
viewChatsBtn.addEventListener('click', () => {
  chrome.tabs.create({
    url: 'https://impulse-tracker-dashboard.web.app/chats' // Update with your dashboard URL
  });
});

/**
 * Listen to auth state changes
 */
onAuthChange(async (user) => {
  if (user) {
    console.log('User authenticated:', user.email);
    
    // Load user profile
    await loadUserProfile(user.uid);
    
    // Show dashboard screen
    showScreen(dashboardScreen);
  } else {
    console.log('User not authenticated');
    
    // Show auth screen
    showScreen(authScreen);
  }
});

console.log('Popup auth initialized');
