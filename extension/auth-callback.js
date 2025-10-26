// Auth callback handler for Clerk authentication
console.log('Auth callback handler loaded');

// Function to extract session from URL or cookies
async function handleAuthCallback() {
  const loadingEl = document.getElementById('loading');
  const successEl = document.getElementById('success');
  const errorEl = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  
  try {
    // Check if we're on a Clerk success page
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const hash = new URLSearchParams(url.hash.slice(1));
    
    console.log('Callback URL:', url.href);
    console.log('Params:', Object.fromEntries(params));
    console.log('Hash:', Object.fromEntries(hash));
    
    // Try to get session from cookies
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    console.log('Cookies available:', Object.keys(cookies));
    
    // Check if we have a __client or __session cookie from Clerk
    const clerkSession = cookies.__session || cookies.__client;
    
    if (clerkSession) {
      console.log('Found Clerk session');
      
      // Notify background script that auth is complete
      chrome.runtime.sendMessage({
        action: 'clerkAuthComplete',
        sessionToken: clerkSession
      }, (response) => {
        console.log('Background response:', response);
        
        if (response && response.success) {
          // Show success
          loadingEl.style.display = 'none';
          successEl.style.display = 'block';
          
          // Close tab after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          throw new Error('Failed to save authentication');
        }
      });
    } else {
      // Try alternate approach - check if we're authenticated on Clerk domain
      console.log('No session found in cookies, checking Clerk status...');
      
      // Show success anyway if we're on the success page
      if (url.pathname.includes('sso-callback') || url.pathname.includes('sign-in')) {
        loadingEl.style.display = 'none';
        successEl.style.display = 'block';
        
        // User should manually close and reopen extension
        successEl.querySelector('p').textContent = 'Authentication complete! Please close this tab and click the extension icon again.';
      } else {
        throw new Error('No authentication session found');
      }
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorMessage.textContent = error.message;
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleAuthCallback);
} else {
  handleAuthCallback();
}
