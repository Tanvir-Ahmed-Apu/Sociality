import { getCurrentTabUser, setCurrentTabUser, clearCurrentTabAuth } from './session';

export const fetchWithSession = async (url: string, options: RequestInit = {}) => {
  const user = getCurrentTabUser();
  const sessionPath = user?.sessionPath || '';

  const urlWithSession = sessionPath ?
    `${url}${url.includes('?') ? '&' : '?'}session=${sessionPath}` :
    url;

  console.log('Final URL:', urlWithSession);

  try {
    const response = await fetch(urlWithSession, {
      ...options,
      credentials: 'include'
    });

    if (response.status === 401) {
      console.warn('Authentication failed, clearing local auth data');

      if (user && user.isProfileComplete && sessionPath) {
        try {
          const authValidation = await fetch('/api/auth/oauth/user' + (sessionPath ? `?session=${sessionPath}` : ''), {
            credentials: 'include'
          });

          if (authValidation.ok) {
            const validatedUser = await authValidation.json();
            setCurrentTabUser(validatedUser);

            return fetch(urlWithSession, {
              ...options,
              credentials: 'include'
            });
          }
        } catch (validationError) {
          console.error('Re-validation failed:', validationError);
        }
      }

      clearCurrentTabAuth();

      if (sessionPath) {
        return fetch(url, {
          ...options,
          credentials: 'include'
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch with session failed:', error);
    throw error;
  }
};

export const apiRequest = async (endpoint: string, method: string = 'GET', data: any = null) => {
  const url = `/api${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetchWithSession(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};
