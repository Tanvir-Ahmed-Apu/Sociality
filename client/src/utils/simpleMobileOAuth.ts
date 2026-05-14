import { User } from './api';

/**
 * Simple Mobile OAuth Utilities
 * Lightweight version for mobile OAuth handling
 */

/**
 * Check if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobilePatterns = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
  return mobilePatterns.some(pattern => pattern.test(userAgent)) || window.innerWidth <= 768;
};

/**
 * Check if popups are likely blocked
 */
export const arePopupsBlocked = () => {
  if (isMobileDevice()) return true;
  
  try {
    const testPopup = window.open('', 'test', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
};

/**
 * Get optimal OAuth method
 */
export const getOAuthMethod = (): 'redirect' | 'popup' => {
  return isMobileDevice() || arePopupsBlocked() ? 'redirect' : 'popup';
};

/**
 * Handle mobile-friendly OAuth
 */
export const handleMobileOAuth = async (
  onSuccess: (userData: User) => void,
  onError: (error: any) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    setLoading(true);
    
    const method = getOAuthMethod();
    console.log('🔐 Using OAuth method:', method);
    
    if (method === 'redirect') {
      // Store state and redirect
      sessionStorage.setItem('oauth_redirect_time', Date.now().toString());
      
      if (isMobileDevice()) {
        // Brief delay for mobile UX
        setTimeout(() => {
          window.location.href = '/api/auth/google';
        }, 500);
      } else {
        window.location.href = '/api/auth/google';
      }
    } else {
      // Try popup (fallback to redirect if fails)
      try {
        const { googleOAuthPopup } = await import('./oauthPopup');
        const userData = await googleOAuthPopup(false);
        onSuccess(userData);
      } catch (error) {
        console.log('Popup failed, falling back to redirect');
        sessionStorage.setItem('oauth_redirect_time', Date.now().toString());
        window.location.href = '/api/auth/google';
      }
    }
  } catch (error) {
    console.error('OAuth error:', error);
    setLoading(false);
    onError(error);
  }
};

/**
 * Check if current page is OAuth callback
 */
export const isOAuthCallback = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('oauth') || urlParams.has('error');
};

/**
 * Handle OAuth callback
 */
export const handleOAuthCallback = async (): Promise<User | null> => {
  const urlParams = new URLSearchParams(window.location.search);
  const oauthSuccess = urlParams.get('oauth');
  const oauthError = urlParams.get('error');
  const setupRequired = urlParams.get('setup');
  const sessionPath = urlParams.get('session');
  
  if (oauthSuccess === 'success') {
    try {
      const response = await fetch(`/api/auth/oauth/user?session=${sessionPath || ''}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        userData.setupRequired = setupRequired === 'required';
        userData.sessionPath = sessionPath;
        
        // Clean up URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        return userData;
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  } else if (oauthError) {
    // Clean up URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    
    throw new Error(oauthError === 'oauth_failed' ? 'Google login failed' : oauthError);
  }
  
  return null;
};

/**
 * Get OAuth button text based on device
 */
export const getOAuthButtonText = () => {
  return isMobileDevice() ? 'Continue with Google' : 'Sign in with Google';
};

/**
 * Get OAuth loading text based on device
 */
export const getOAuthLoadingText = () => {
  return isMobileDevice() ? 'Redirecting...' : 'Opening Google...';
};
