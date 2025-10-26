// Popup script using Clerk Authentication
console.log('popup-clerk.js loaded');

// Elements map
const elements = {
  screens: {
    auth: document.getElementById('auth-screen'),
    dashboard: document.getElementById('dashboard-screen')
  },
  auth: {
    signInButton: document.getElementById('sign-in-btn'),
    loadingSpinner: document.getElementById('auth-loading')
  },
  dashboard: {
    profileName: document.getElementById('profile-name'),
    profileEmail: document.getElementById('profile-email'),
    profilePhoto: document.getElementById('profile-photo'),
    signOutButton: document.getElementById('sign-out-btn'),
    blockedStat: document.getElementById('stat-blocked'),
    passedStat: document.getElementById('stat-passed'),
    savedAmount: document.getElementById('stat-saved'),
    settingsBtn: document.getElementById('action-settings'),
    historyBtn: document.getElementById('action-history'),
    statsBtn: document.getElementById('action-stats')
  }
};

// Auth service instance
let authService = null;

// Initialize the popup
async function initialize() {
  try {
    console.log('Initializing popup...');
    
    // Show loading state
    showLoadingState();
    
    // Initialize Clerk auth service
    authService = new ClerkAuthService();
    const initialized = await authService.initialize();
    
    if (!initialized) {
      showError('Failed to initialize authentication. Please check configuration.');
      return;
    }
    
    // Check current auth state
    const user = await authService.checkAuthState();
    
    if (user) {
      console.log('User already signed in:', user.email);
      await showDashboard(user);
    } else {
      console.log('No user signed in');
      showAuthScreen();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Listen for auth state changes
    authService.onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? user.email : 'signed out');
      if (user) {
        await showDashboard(user);
        await authService.syncUserToStorage();
      } else {
        showAuthScreen();
      }
    });
    
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to initialize. Please check your Clerk configuration.');
  }
}

// Show loading state
function showLoadingState() {
  const authScreen = elements.screens.auth;
  if (authScreen) {
    authScreen.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Initializing...</p>
      </div>
    `;
  }
}

// Show auth screen
function showAuthScreen() {
  console.log('Showing auth screen');
  
  // Reset auth screen content
  const authScreen = elements.screens.auth;
  authScreen.innerHTML = `
    <div id="auth-box" class="auth-card">
      <div class="auth-header">
        <div class="logo-container">
          <svg class="logo" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
            <path d="M24 8L14 18L24 28L34 18L24 8Z" fill="white" opacity="0.9"/>
            <path d="M24 20L14 30L24 40L34 30L24 20Z" fill="white" opacity="0.6"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                <stop stop-color="#5a4bff"/>
                <stop offset="1" stop-color="#8b7fff"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="auth-title">Impulse Blocker</h1>
        <p class="auth-subtitle">Take control of your online shopping habits</p>
      </div>
      
      <div class="auth-features">
        <div class="feature-item">
          <svg class="feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L12.09 7.26L18 8.27L14 12.14L15.18 18L10 15.27L4.82 18L6 12.14L2 8.27L7.91 7.26L10 2Z" fill="#5a4bff"/>
          </svg>
          <span>AI-powered shopping assistant</span>
        </div>
        <div class="feature-item">
          <svg class="feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 2L7.17 7H2L6.82 10L5 15L9 12L13 15L11.18 10L16 7H10.83L9 2Z" fill="#5a4bff"/>
          </svg>
          <span>Track your impulse purchases</span>
        </div>
        <div class="feature-item">
          <svg class="feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#5a4bff"/>
          </svg>
          <span>Save money effortlessly</span>
        </div>
      </div>
      
      <button id="sign-in-btn" class="auth-btn primary">
        <svg class="btn-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M16 9C16 5.13 12.87 2 9 2C5.13 2 2 5.13 2 9C2 12.87 5.13 16 9 16C12.87 16 16 12.87 16 9Z" fill="white"/>
        </svg>
        Sign in with Clerk
      </button>
      
      <p class="auth-note">Your data is secure and private</p>
    </div>
  `;
  
  // Update element references
  elements.auth.signInButton = document.getElementById('sign-in-btn');
  
  // Re-attach event listener
  if (elements.auth.signInButton) {
    elements.auth.signInButton.addEventListener('click', handleSignIn);
  }
  
  // Switch screens
  switchScreen('auth');
}

// Show dashboard
async function showDashboard(user) {
  console.log('Showing dashboard for:', user.email);
  
  // Get user stats
  const stats = await authService.getUserStats();
  
  // Update dashboard content
  const dashboardScreen = elements.screens.dashboard;
  dashboardScreen.innerHTML = `
    <div id="dashboard-container" class="dashboard-card">
      <div id="dashboard-header" class="dashboard-header">
        <div id="profile-info" class="profile-info">
          <img id="profile-photo" class="profile-photo" src="${user.profileImageUrl || generateAvatar(user.fullName || user.email)}" alt="${user.fullName}" />
          <div id="profile-details" class="profile-details">
            <h2 id="profile-name" class="profile-name">${user.fullName || user.firstName || 'User'}</h2>
            <p id="profile-email" class="profile-email">${user.email}</p>
          </div>
        </div>
        <button id="sign-out-btn" class="sign-out-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M11 11L14 8M14 8L11 5M14 8H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sign Out
        </button>
      </div>
      
      <div class="stats-container">
        <div class="main-stats">
          <div class="stat-card primary-stat">
            <div class="stat-icon-container">
              <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15.88 8.29L10 14.17L8.12 12.29C7.73 11.9 7.1 11.9 6.71 12.29C6.32 12.68 6.32 13.31 6.71 13.7L9.3 16.29C9.69 16.68 10.32 16.68 10.71 16.29L17.3 9.7C17.69 9.31 17.69 8.68 17.3 8.29C16.91 7.9 16.27 7.9 15.88 8.29Z" fill="#5a4bff"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Impulses Blocked</div>
              <div id="stat-blocked" class="stat-value">${stats.blockedAttempts}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-container">
              <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#22c55e"/>
                <path d="M2 17L12 22L22 17" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Money Saved</div>
              <div id="stat-saved" class="stat-value stat-money">$${stats.totalSaved || 0}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-container">
              <svg class="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="stat-content">
              <div class="stat-label">Purchases Made</div>
              <div id="stat-passed" class="stat-value">${stats.successfulPersuasions}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="quick-actions" class="quick-actions">
        <button id="action-stats" class="action-btn primary">
          <svg class="btn-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 3V15H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 12L9 8L11 10L15 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          View Detailed Stats
        </button>
        <button id="action-settings" class="action-btn">
          <svg class="btn-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="2"/>
            <path d="M14.7 9.8C14.74 9.54 14.76 9.27 14.76 9C14.76 8.73 14.74 8.46 14.7 8.2L16.27 6.97C16.41 6.86 16.45 6.66 16.36 6.5L14.86 3.5C14.77 3.33 14.57 3.27 14.4 3.33L12.53 4.13C12.13 3.83 11.7 3.58 11.23 3.39L10.93 1.42C10.9 1.24 10.73 1.1 10.53 1.1H7.53C7.33 1.1 7.17 1.24 7.13 1.42L6.83 3.39C6.36 3.58 5.93 3.84 5.53 4.13L3.66 3.33C3.49 3.26 3.29 3.33 3.2 3.5L1.7 6.5C1.61 6.67 1.65 6.87 1.8 6.97L3.37 8.2C3.33 8.46 3.3 8.74 3.3 9C3.3 9.26 3.33 9.54 3.37 9.8L1.8 11.03C1.66 11.14 1.62 11.34 1.71 11.5L3.21 14.5C3.3 14.67 3.5 14.73 3.67 14.67L5.54 13.87C5.94 14.17 6.37 14.42 6.84 14.61L7.14 16.58C7.17 16.76 7.33 16.9 7.53 16.9H10.53C10.73 16.9 10.9 16.76 10.93 16.58L11.23 14.61C11.7 14.42 12.13 14.16 12.53 13.87L14.4 14.67C14.57 14.74 14.77 14.67 14.86 14.5L16.36 11.5C16.45 11.33 16.41 11.13 16.26 11.03L14.7 9.8Z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Settings
        </button>
        <button id="action-history" class="action-btn">
          <svg class="btn-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5V9L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="2"/>
          </svg>
          View History
        </button>
      </div>
    </div>
  `;
  
  // Update element references
  elements.dashboard.profileName = document.getElementById('profile-name');
  elements.dashboard.profileEmail = document.getElementById('profile-email');
  elements.dashboard.profilePhoto = document.getElementById('profile-photo');
  elements.dashboard.signOutButton = document.getElementById('sign-out-btn');
  elements.dashboard.blockedStat = document.getElementById('stat-blocked');
  elements.dashboard.passedStat = document.getElementById('stat-passed');
  elements.dashboard.savedAmount = document.getElementById('stat-saved');
  elements.dashboard.settingsBtn = document.getElementById('action-settings');
  elements.dashboard.historyBtn = document.getElementById('action-history');
  elements.dashboard.statsBtn = document.getElementById('action-stats');
  
  // Re-attach event listeners
  if (elements.dashboard.signOutButton) {
    elements.dashboard.signOutButton.addEventListener('click', handleSignOut);
  }
  
  // Switch screens
  switchScreen('dashboard');
}

// Generate avatar placeholder
function generateAvatar(name) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  
  // Generate a simple SVG avatar
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#5a4bff"/>
      <text x="50" y="50" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dy=".35em">${initials}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Switch between screens
function switchScreen(screen) {
  const { auth, dashboard } = elements.screens;
  
  if (!auth || !dashboard) {
    console.error('Screen elements not found');
    return;
  }
  
  auth.classList.remove('active');
  dashboard.classList.remove('active');
  
  if (screen === 'auth') {
    auth.classList.add('active');
  } else if (screen === 'dashboard') {
    dashboard.classList.add('active');
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  const authScreen = elements.screens.auth;
  if (authScreen) {
    authScreen.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Sign in button
  if (elements.auth.signInButton) {
    elements.auth.signInButton.addEventListener('click', handleSignIn);
  }
  
  // Sign out button
  if (elements.dashboard.signOutButton) {
    elements.dashboard.signOutButton.addEventListener('click', handleSignOut);
  }
  
  // Action buttons
  if (elements.dashboard.settingsBtn) {
    elements.dashboard.settingsBtn.addEventListener('click', () => {
      console.log('Opening settings...');
      // Implement settings page
    });
  }
  
  if (elements.dashboard.historyBtn) {
    elements.dashboard.historyBtn.addEventListener('click', () => {
      console.log('Opening history...');
      // Implement history page
    });
  }
  
  if (elements.dashboard.statsBtn) {
    elements.dashboard.statsBtn.addEventListener('click', () => {
      console.log('Opening detailed stats...');
      // Implement stats page
    });
  }
}

// Handle sign in
async function handleSignIn(e) {
  e.preventDefault();
  
  const button = elements.auth.signInButton || e.target;
  const originalText = button.textContent;
  
  try {
    // Update button state
    button.disabled = true;
    button.innerHTML = `
      <div class="loading-spinner small"></div>
      <span>Signing in...</span>
    `;
    
    // Sign in with Clerk
    const user = await authService.signIn();
    
    if (user) {
      console.log('Sign-in successful:', user.email);
      // Update button to show success
      button.innerHTML = `✅ Signed in!`;
      
      // Wait a moment then show dashboard
      setTimeout(async () => {
        await showDashboard(user);
        await authService.syncUserToStorage();
      }, 500);
    } else {
      throw new Error('Sign-in was cancelled or failed');
    }
  } catch (error) {
    console.error('Sign-in error:', error);
    showError('Sign-in failed. Please try again.');
    
    // Reset button
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

// Handle sign out
async function handleSignOut(e) {
  e.preventDefault();
  
  try {
    await authService.signOut();
    console.log('Sign-out successful');
    showAuthScreen();
  } catch (error) {
    console.error('Sign-out error:', error);
    showError('Sign-out failed. Please try again.');
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
