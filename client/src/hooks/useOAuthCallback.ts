import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userAtom } from '../atoms';
import useShowToast from './useShowToast';
import { setCurrentTabUser, getTabId } from '../utils/api';
import { handleOAuthCallback, isOAuthCallback } from '../utils/simpleMobileOAuth';

const useOAuthCallback = () => {
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            // Skip OAuth callback handling if we're on the popup callback page
            if (window.location.pathname === '/oauth-popup-callback') {
                return;
            }

            // Check if this is an OAuth callback
            if (!isOAuthCallback()) {
                return;
            }

            try {
                // Use the mobile-friendly OAuth callback handler
                const userData = await handleOAuthCallback();

                if (userData) {
                    // Store in tab-specific localStorage using utility function
                    setCurrentTabUser(userData);

                    // Set as current user
                    setUser(userData);
                    showToast('Success', 'Successfully logged in with Google!', 'success');

                    // Check if profile setup is required (only for NEW Google OAuth users)
                    if (userData.setupRequired || !userData.isProfileComplete) {
                        console.log('❌ FRONTEND: Redirecting to profile setup');
                        console.log('Reason: setupRequired =', userData.setupRequired, ', isProfileComplete =', userData.isProfileComplete);
                        showToast('Info', 'Welcome! Please complete your profile setup to get started', 'info');
                        setTimeout(() => {
                            navigate('/profile-setup', { replace: true });
                        }, 100);
                    } else {
                        console.log('✅ FRONTEND: Redirecting directly to home');
                        showToast('Success', 'Welcome back!', 'success');
                        setTimeout(() => {
                            navigate('/', { replace: true });
                        }, 100);
                    }
                }
            } catch (error: any) {
                console.error('OAuth callback error:', error);
                showToast('Error', error.message || 'Failed to complete Google login', 'error');

                // Redirect to auth page on error
                navigate('/auth', { replace: true });
            }
        };

        handleCallback();
    }, [setUser, showToast, navigate]);
};

export default useOAuthCallback;
