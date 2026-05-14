// OAuth popup utility for multi-tab Google authentication
import { getTabId, setCurrentTabUser, User } from './api';

/**
 * Test if popups are allowed
 * @returns {boolean} True if popups are allowed
 */
export const testPopupAllowed = (): boolean => {
  try {
    const testPopup = window.open('', 'test', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Opens a popup window for OAuth authentication
 * @param {string} url - The OAuth URL to open
 * @param {string} name - Name for the popup window
 * @param {Object} options - Popup window options
 * @returns {Promise<User>} Promise that resolves with user data or rejects with error
 */
export const openOAuthPopup = (url: string, name: string = 'oauth', options: any = {}): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Prepare all data synchronously before opening popup
    const tabId = getTabId();
    const separator = url.includes('?') ? '&' : '?';
    const urlWithTabId = `${url}${separator}tabId=${tabId}`;

    // Default popup options
    const defaultOptions = {
      width: 500,
      height: 600,
      scrollbars: 'yes',
      resizable: 'yes',
      toolbar: 'no',
      menubar: 'no',
      location: 'no',
      directories: 'no',
      status: 'no',
    };

    const popupOptions = { ...defaultOptions, ...options };

    // Calculate center position
    const left = Math.round(window.screen.width / 2 - popupOptions.width / 2);
    const top = Math.round(window.screen.height / 2 - popupOptions.height / 2);

    const optionsString = Object.entries({
      ...popupOptions,
      left,
      top,
    })
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    // Debug logging
    console.log('Opening OAuth popup:', {
      url: urlWithTabId,
      name,
      options: optionsString,
      userActivation: navigator.userActivation?.isActive
    });

    // Try popup first, fallback to new tab if popup fails
    let popup = window.open(urlWithTabId, name, optionsString);

    // If popup failed, try opening in a new tab
    if (!popup) {
      console.log('Popup failed, trying new tab...');
      popup = window.open(urlWithTabId, '_blank');
    }

    console.log('Popup result:', {
      popup: !!popup,
      closed: popup?.closed,
      location: popup?.location?.href
    });

    if (!popup || popup.closed) {
      const errorMsg = !popup ?
        'Popup blocked by browser. Please allow popups for this site.' :
        'Popup was immediately closed.';
      reject(new Error(errorMsg));
      return;
    }

    // Try to focus the popup
    try {
      popup.focus();
    } catch (e) {
      console.warn('Could not focus popup:', e);
    }

    // Listen for messages from popup
    const messageListener = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        cleanup();
        
        // Store user data in tab-specific storage
        const userData = event.data.userData;
        setCurrentTabUser(userData);
        
        resolve(userData);
      } else if (event.data.type === 'OAUTH_ERROR') {
        cleanup();
        reject(new Error(event.data.error || 'OAuth authentication failed'));
      }
    };

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('OAuth popup was closed before completion'));
      }
    }, 1000);

    const cleanup = () => {
      window.removeEventListener('message', messageListener);
      clearInterval(checkClosed);
      if (!popup.closed) {
        popup.close();
      }
    };

    // Add message listener
    window.addEventListener('message', messageListener);

    // Cleanup after 5 minutes (timeout)
    setTimeout(() => {
      if (!popup.closed) {
        cleanup();
        reject(new Error('OAuth popup timed out'));
      }
    }, 5 * 60 * 1000);
  });
};

/**
 * Initiates Google OAuth popup flow with fallback
 * @param {boolean} useRedirectFallback - Whether to use redirect as fallback
 * @returns {Promise<User>} Promise that resolves with user data
 */
export const googleOAuthPopup = (useRedirectFallback: boolean = false): Promise<User> => {
  return new Promise((resolve, reject) => {
    // Check if popups are likely to work
    if (!testPopupAllowed()) {
      if (useRedirectFallback) {
        // Fallback to redirect
        window.location.href = '/api/auth/google';
        return;
      } else {
        reject(new Error('Popups are blocked. Please allow popups for this site or try the redirect method.'));
        return;
      }
    }

    // Try popup first
    openOAuthPopup('/api/auth/google/popup', 'google_oauth', {
      width: 500,
      height: 600,
    })
    .then(resolve)
    .catch(error => {
      console.error('Popup OAuth failed:', error);

      // If popup fails and redirect fallback is enabled
      if (error.message.includes('Popup blocked') && useRedirectFallback) {
        console.log('Falling back to redirect method');
        window.location.href = '/api/auth/google';
        return;
      }

      // Otherwise, provide helpful error message
      if (error.message.includes('Popup blocked')) {
        reject(new Error('Popup blocked. Please allow popups for this site and try again.'));
      } else {
        reject(error);
      }
    });
  });
};

/**
 * Handles OAuth callback in popup window
 * Should be called in the popup callback page
 */
export const handleOAuthPopupCallback = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth');
    const oauthError = urlParams.get('error');
    const setupRequired = urlParams.get('setup');
    const sessionPath = urlParams.get('session');
    const tabId = urlParams.get('tabId');

    if (oauthSuccess === 'success') {
      // Fetch user data
      fetch(`/api/auth/oauth/user?session=${sessionPath || ''}`, {
        credentials: 'include'
      })
        .then(response => response.json())
        .then(userData => {
          // Add session path and tab ID to user data
          userData.sessionPath = sessionPath;
          userData.tabId = tabId;
          userData.setupRequired = setupRequired === 'required';

          // Send success message to parent window
          window.opener.postMessage({
            type: 'OAUTH_SUCCESS',
            userData: userData
          }, window.location.origin);

          // Close popup
          window.close();
        })
        .catch(error => {
          console.error('Failed to fetch user data:', error);
          window.opener.postMessage({
            type: 'OAUTH_ERROR',
            error: 'Failed to fetch user data'
          }, window.location.origin);
          window.close();
        });
    } else if (oauthError) {
      let errorMessage = 'Google login failed';
      
      switch (oauthError) {
        case 'oauth_failed':
          errorMessage = 'Google authentication was cancelled or failed';
          break;
        case 'oauth_callback_failed':
          errorMessage = 'Failed to process Google login';
          break;
        default:
          errorMessage = 'Google login failed';
      }

      // Send error message to parent window
      window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: errorMessage
      }, window.location.origin);

      // Close popup
      window.close();
    }
  } catch (error) {
    console.error('OAuth popup callback error:', error);
    if (window.opener) {
      window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: 'OAuth callback processing failed'
      }, window.location.origin);
    }
    window.close();
  }
};
