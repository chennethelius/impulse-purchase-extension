// Clerk Authentication Service for Chrome Extension
// Handles Clerk authentication flow using Chrome Identity API

class ClerkAuthService {
  constructor() {
    this.currentUser = null;
    this.sessionToken = null;
    this.publishableKey = null;
    this.frontendApi = null;
    this.initializeClerk();
  }

  async initializeClerk() {
    try {
      // Get Clerk configuration
      this.publishableKey = window.CONFIG?.CLERK_PUBLISHABLE_KEY;
      this.frontendApi = window.CONFIG?.CLERK_FRONTEND_API;

      if (!this.publishableKey || this.publishableKey.includes('YOUR_CLERK')) {
        console.error('❌ Clerk: Please set your CLERK_PUBLISHABLE_KEY in config.js');
        throw new Error('Missing Clerk configuration. Please add your Clerk credentials.');
      }

      console.log('✅ Clerk configuration loaded');
      
      // Check if user is already signed in
      await this.checkAuthState();
    } catch (error) {
      console.error('Failed to initialize Clerk:', error);
      throw error;
    }
  }

  async checkAuthState() {
    try {
      // Check stored user from background script
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'getCurrentUser' },
          (response) => resolve(response)
        );
      });

      if (result?.data) {
        this.currentUser = result.data;
        console.log('User is signed in:', this.currentUser.email);
        return this.currentUser;
      } else {
        console.log('No user signed in');
        return null;
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
      return null;
    }
  }

  async signIn() {
    try {
      // Open Clerk sign-in page in a new tab
      const signInUrl = `https://${this.frontendApi}/sign-in`;
      
      // Create a popup window for sign-in
      const width = 500;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;
      
      const authWindow = window.open(
        signInUrl,
        'Clerk Sign In',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this extension.');
      }

      // Wait for authentication to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          try {
            // Check if window is closed
            if (authWindow.closed) {
              clearInterval(checkInterval);
              // Check auth state after window closes
              this.checkAuthState().then(user => {
                if (user) {
                  resolve(user);
                } else {
                  reject(new Error('Sign-in cancelled'));
                }
              });
            }
          } catch (e) {
            // Cross-origin errors are expected
          }
        }, 500);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!authWindow.closed) {
            authWindow.close();
          }
          reject(new Error('Sign-in timeout'));
        }, 300000);
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
      
      console.log('User signed out successfully');
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

  // Method to handle protected routes or features
  async requireAuth() {
    const user = await this.checkAuthState();
    if (!user) {
      // Redirect to sign-in
      await this.signIn();
      return this.checkAuthState();
    }
    return user;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    // Poll for auth state changes
    setInterval(async () => {
      const user = await this.checkAuthState();
      callback(user);
    }, 2000);
  }

  // Get user statistics (stored locally or in your backend)
  async getUserStats() {
    try {
      // For now, return mock data - you can connect this to your backend
      return {
        blockedAttempts: 0,
        successfulPersuasions: 0,
        totalSaved: 0,
        joinedDate: this.currentUser?.createdAt || new Date()
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

// Export the service
window.ClerkAuthService = ClerkAuthService;
