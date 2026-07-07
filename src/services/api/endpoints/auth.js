import logger from '../../../utils/core/logger';
import { fetchWithError } from '../fetcher';
import { fetchCsrfToken } from '../csrf';
import { getBaseUrl } from '../base';

const withRecaptchaToken = (payload, recaptchaToken) => {
  if (!recaptchaToken) {
    return payload;
  }

  return {
    ...payload,
    recaptchaToken,
  };
};

const normalizeAuthProvider = (provider) => {
  if (provider === 'google' || provider === 'discord') {
    return provider;
  }

  return 'local';
};

const auth = {
  getUserProfile: async (userId) => fetchWithError(`/api/auth/user/${userId}`),
  updateProfile: async (data) =>
    fetchWithError('/api/auth/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    }),
  deleteAccount: async () =>
    fetchWithError('/api/auth/delete-account', {
      method: 'DELETE',
      credentials: 'include',
    }),
  register: async (userData, options = {}) => {
    return fetchWithError('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(withRecaptchaToken(userData, options.recaptchaToken)),
    });
  },
  login: async (identifier, password, options = {}) => {
    logger.info('Logging in user:');
    logger.debug({ identifier }); // Don't log passwords

    const result = await fetchWithError('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(withRecaptchaToken({ identifier, password }, options.recaptchaToken)),
    });

    // Refresh CSRF token since session changes after login (force refresh)
    await fetchCsrfToken(true);

    // Store minimal backup info in localStorage
    if (result.user && result.user.id) {
      localStorage.setItem('user_id', result.user.id);
      localStorage.setItem('email_verified', result.user.isEmailVerified ? 'true' : 'false');
      localStorage.setItem('last_login', new Date().toISOString());
      localStorage.setItem('auth_provider', 'local');
    }

    return result;
  },
  startOAuth: async (provider, intent, options = {}) => {
    const oauthPayload = withRecaptchaToken(
      {
        provider,
        intent,
        ...(options.compactMobileShell ? { compactMobileShell: true } : {}),
      },
      options.recaptchaToken
    );

    const result = await fetchWithError('/api/auth/oauth/start', {
      method: 'POST',
      body: JSON.stringify(oauthPayload),
    });

    if (result?.url) {
      localStorage.setItem('auth_provider', normalizeAuthProvider(provider));
    }

    return result;
  },
  logout: async (provider) => {
    logger.info('Logging out user');

    const normalizedProvider = normalizeAuthProvider(
      provider || localStorage.getItem('auth_provider')
    );

    const result = await fetchWithError('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ provider: normalizedProvider }),
    });

    // Refresh CSRF token since session is destroyed (force refresh)
    await fetchCsrfToken(true);

    // Clear localStorage backup
    localStorage.removeItem('user_id');
    localStorage.removeItem('email_verified');
    localStorage.removeItem('last_login');
    localStorage.removeItem('auth_provider');

    return result;
  },
  check: async () => {
    logger.info('Checking session');

    // For now, use basic fetch without cache control headers
    // until the server CORS settings are updated
    const result = await fetchWithError('/api/auth/check');

    // Log result
    logger.info('Session check result:');
    //logger.debug(result);

    return result;
  },
  verifyEmail: async (token) => {
    try {
      const response = await fetchWithError(`/api/auth/verify-email?token=${token}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  resendVerificationEmail: async (email) => {
    try {
      const trimmedEmail = typeof email === 'string' ? email.trim() : '';
      const response = trimmedEmail
        ? await fetchWithError('/api/auth/resend-verification-by-email', {
            method: 'POST',
            body: JSON.stringify({ email: trimmedEmail }),
          })
        : await fetchWithError('/api/auth/resend-verification', {
            method: 'POST',
          });
      return response;
    } catch (error) {
      throw error;
    }
  },

  verifyEmailChange: async (token, email) => {
    try {
      const response = await fetchWithError(
        `/api/auth/verify-email-change?token=${token}&email=${encodeURIComponent(email)}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  cancelEmailChange: async (token) => {
    try {
      const response = await fetchWithError(`/api/auth/cancel-email-change?token=${token}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default auth;
