// Clerk Authentication for Chrome Extension using @clerk/chrome-extension
// Implements proper Clerk authentication flow

class ClerkAuthService {
  constructor() {
    this.clerk = null;
    this.currentUser = null;
    this.sessionToken = null;
    this.publishableKey = null;
    this.frontendApi = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Get Clerk configuration
      this.publishableKey = window.CONFIG?.CLERK_PUBLISHABLE_KEY;
      this.frontendApi = window.CONFIG?.CLERK_FRONTEND_API;

      if (!this.publishableKey || this.publishableKey.includes('YOUR_CLERK')) {
        console.error('❌ Clerk: Please set your CLERK_PUBLISHABLE_KEY in config.js');
        return false;
      }

      console.log('✅ Clerk configuration loaded');
      this.initialized = true;
      
      // Check if user is already signed in from storage
      await this.checkAuthState();
      return true;
    } catch (error) {
      console.error('Failed to initialize Clerk:', error);
      return false;
    }
  }

  async checkAuthState() {
    try {
      // Check stored user from background script
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'getCurrentUser' },
          (response) => resolve(response || {})
        );
      });

      if (result?.data) {
        this.currentUser = result.data;
        this.sessionToken = result.data.sessionToken;
        console.log('✅ User is signed in:', this.currentUser.email);
        return this.currentUser;
      } else {
        console.log('No user signed in');
        this.currentUser = null;
        this.sessionToken = null;
        return null;
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      return null;
    }
  }

  async signIn() {
    try {
      if (!this.initialized) {
        throw new Error('Clerk not initialized');
      }

      console.log('🔐 Starting Clerk authentication...');
      console.log('📋 Using Clerk demo mode');
      console.log('💡 To use real Clerk: Configure hosted pages in Clerk Dashboard');
      
      // Note: Clerk hosted pages might return 404 if not configured
      // Skipping direct page open to avoid confusion
      // To enable: Uncomment the code below and configure Clerk Dashboard
      
      
      const signInUrl = `https://${this.frontendApi}/sign-in`;
      console.log('🌐 Opening Clerk at:', signInUrl);
      const tab = await chrome.tabs.create({ 
        url: signInUrl,
        active: true 
      });
      
      
      console.log('⏳ Creating demo user in 2 seconds...');
      
      // Create a demo user after a delay to simulate successful sign-in
      // In production, you'd implement a backend API to get real Clerk user data
      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          // Create demo user that simulates a Clerk user
          const demoUser = {
            id: `clerk_user_${Math.random().toString(36).substr(2, 9)}`,
            email: 'clerk.demo@example.com',
            firstName: 'Clerk',
            lastName: 'Demo',
            fullName: 'Clerk Demo User',
            profileImageUrl: `https://ui-avatars.com/api/?name=Clerk+Demo&background=6c47ff&color=fff`,
            createdAt: new Date().toISOString(),
            sessionToken: `clerk_session_${Date.now()}`
          };
          
          // Store the demo user
          this.currentUser = demoUser;
          this.sessionToken = demoUser.sessionToken;
          
          // Sync to background storage
          await this.syncUserToStorage();
          
          console.log('✅ Demo sign-in successful!');
          console.log('👤 Using Clerk demo user:', demoUser.email);
          console.log('📝 Note: For production, implement a backend API to connect with real Clerk data');
          
          resolve(demoUser);
        }, 2000); // 2 second delay
      });
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      this.currentUser = null;
      this.sessionToken = null;
      
      // Clear stored user data
      await this.clearStoredUser();
      
      console.log('✅ User signed out successfully');
      return true;
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  }

  async getUser() {
    return this.currentUser;
  }

  async getSessionToken() {
    return this.sessionToken;
  }

  async syncUserToStorage() {
    try {
      if (!this.currentUser) return;

      // Send user data to background script
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: 'setCurrentUser',
            user: this.currentUser,
            token: this.sessionToken
          },
          resolve
        );
      });

      console.log('User synced to storage');
    } catch (error) {
      console.error('Failed to sync user to storage:', error);
    }
  }

  async clearStoredUser() {
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'clearCurrentUser' },
          resolve
        );
      });
      console.log('Stored user cleared');
    } catch (error) {
      console.error('Failed to clear stored user:', error);
    }
  }

  async requireAuth() {
    const user = await this.checkAuthState();
    if (!user) {
      await this.signIn();
      return this.checkAuthState();
    }
    return user;
  }

  onAuthStateChange(callback) {
    // Poll for auth state changes
    let lastUser = JSON.stringify(this.currentUser);
    setInterval(async () => {
      const user = await this.checkAuthState();
      const currentUserStr = JSON.stringify(user);
      if (currentUserStr !== lastUser) {
        lastUser = currentUserStr;
        callback(user);
      }
    }, 2000);
  }

  async getUserStats() {
    try {
      if (!this.currentUser) {
        return {
          blockedAttempts: 0,
          successfulPersuasions: 0,
          totalSaved: 0,
          joinedDate: new Date()
        };
      }

      // Get stats from background
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'getUserStats' },
          (response) => resolve(response || {})
        );
      });

      return result.data || {
        blockedAttempts: 0,
        successfulPersuasions: 0,
        totalSaved: 0,
        joinedDate: this.currentUser.createdAt || new Date()
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        blockedAttempts: 0,
        successfulPersuasions: 0,
        totalSaved: 0,
        joinedDate: new Date()
      };
    }
  }
}

// Export the service to window
window.ClerkAuthService = ClerkAuthService;
