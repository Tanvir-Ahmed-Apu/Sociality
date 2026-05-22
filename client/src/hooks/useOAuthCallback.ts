import { useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { userAtom } from '../atoms';
import useShowToast from './useShowToast';
import { setCurrentTabUser } from '../utils/api';
import { setToken } from '../utils/tokenStore';
import { handleOAuthCallback, isOAuthCallback } from '../utils/simpleMobileOAuth';

const useOAuthCallback = () => {
    const setUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();
    const navigate = useNavigate();
    const handledRef = useRef(false);

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

            // Prevent double execution (React StrictMode fires effects twice in dev)
            if (handledRef.current) {
                return;
            }
            handledRef.current = true;

            try {
                // Use the mobile-friendly OAuth callback handler
                const userData = await handleOAuthCallback();

                if (userData) {
                    // Store token for cross-origin API calls
                    const userDataAny = userData as any;
                    if (userDataAny.token) {
                        setToken(userDataAny.token);
                    }
                    // Store in tab-specific localStorage using utility function
                    setCurrentTabUser(userData);

                    // Set as current user
                    setUser(userData);

                    // Check if profile setup is required (only for NEW Google OAuth users)
                    if (userData.setupRequired || !userData.isProfileComplete) {
                        showToast('Info', 'Welcome! Please complete your profile setup to get started.', 'info');
                        setTimeout(() => {
                            navigate('/profile-setup', { replace: true });
                        }, 100);
                    } else {
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
