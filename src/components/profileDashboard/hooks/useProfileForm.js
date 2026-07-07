import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import logger from '../../../utils/core/logger';

const useProfileForm = (userData, onSuccess, refreshProfileData) => {
  const [formData, setFormData] = useState({
    username: userData?.username || '',
    email: userData?.email || '',
    bio: userData?.bio || '',
    avatarUrl: userData?.avatarUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatarUrl: userData.avatarUrl || '',
      }));
    }
  }, [userData]);

  // Check avatar URL whenever it changes
  useEffect(() => {
    if (formData.avatarUrl && formData.avatarUrl !== userData?.avatarUrl) {
      checkAvatarUrl(formData.avatarUrl);
    } else {
      setAvatarError(false);
    }
  }, [formData.avatarUrl]);

  // Track password changes to validate requirements
  useEffect(() => {
    if (formData.newPassword) {
      validatePasswordRequirements(formData.newPassword);
    } else {
      setPasswordErrors([]);
    }

    // Check if passwords match
    setPasswordMatchError(
      formData.confirmPassword && formData.newPassword !== formData.confirmPassword
    );
  }, [formData.newPassword, formData.confirmPassword]);

  const validatePasswordRequirements = (password) => {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  // Function to check if avatar URL can be loaded
  const checkAvatarUrl = (url) => {
    if (!url) return;

    // Reset error state
    setAvatarError(false);
    setAvatarLoading(true);

    if (!isValidImageUrl(url)) {
      setAvatarError('URL format is not valid for images');
      setAvatarLoading(false);
      return;
    }

    // Test if image can actually be loaded
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      logger.info('Avatar preview loaded successfully');
      setAvatarLoading(false);
      setAvatarError(false);
    };

    img.onerror = () => {
      logger.warn('Failed to load avatar image preview - possible CORS issue:', url);
      setAvatarLoading(false);
      setAvatarError('Unable to load this image. It may have CORS restrictions.');
    };

    img.src = url;
  };

  const validateForm = () => {
    // Reset any previous errors
    setError('');

    // Check if changing email - REQUIRES PASSWORD (unless Google user WITH password)
    if (formData.email !== userData?.email) {
      const isGoogleUser = userData?.googleId != null;
      const hasPassword = userData?.hasPassword === true;

      // Google users without password must set password first before changing email
      if (isGoogleUser && !hasPassword) {
        setError(
          'You must set a password before changing your email address. This ensures you can still access your account if Google sign-in becomes unavailable.'
        );
        return false;
      }

      // Only require password if user has a password (not passwordless Google OAuth user)
      if (!isGoogleUser && !formData.currentPassword) {
        setError('Password is required to change email address');
        return false;
      }
    }

    // Check if changing password
    if (formData.newPassword || formData.confirmPassword) {
      const isGoogleUser = userData?.googleId != null;
      const hasPassword = userData?.hasPassword === true;

      // Google users without password can SET password (no current password needed)
      if (isGoogleUser && !hasPassword) {
        // Just validate new password requirements
        const pwdErrors = validatePasswordRequirements(formData.newPassword);
        setPasswordErrors(pwdErrors);

        if (pwdErrors.length > 0) {
          return false;
        }

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordMatchError(true);
          return false;
        }
      } else {
        // Regular users and Google users with password must provide current password
        if (!formData.currentPassword) {
          setError('Current password is required to change password');
          return false;
        }

        // Validate new password
        const pwdErrors = validatePasswordRequirements(formData.newPassword);
        setPasswordErrors(pwdErrors);

        if (pwdErrors.length > 0) {
          return false;
        }

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordMatchError(true);
          return false;
        }
      }
    }

    // Check if email is valid
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    // Check if username is valid (no special characters except underscore)
    if (formData.username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(formData.username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return false;
      }
    }

    // Check if avatar URL is valid
    if (avatarError) {
      setError('The provided avatar URL cannot be used. ' + avatarError);
      return false;
    }

    return true;
  };

  const isValidImageUrl = (url) => {
    if (!url) return true; // Empty URL is valid (will use default avatar)

    try {
      new URL(url); // Check if valid URL format

      // Check if URL ends with common image extensions
      return (
        /\.(jpeg|jpg|gif|png|webp|bmp)($|\?)/.test(url) ||
        // Allow direct reddit/imgur links that might not have extensions
        /(imgur\.com|\.imgbb\.com|\.postimg\.cc|redd\.it|i\.redd\.it)/.test(url)
      );
    } catch (e) {
      return false;
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    setError('');
    setPasswordMatchError(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl || '', // Always include avatarUrl, using empty string if not provided
      };

      // Add current password if provided (needed for email changes or password changes)
      if (formData.currentPassword) {
        payload.currentPassword = formData.currentPassword;
      }

      // Add new password if changing password
      if (formData.newPassword) {
        payload.newPassword = formData.newPassword;
      }

      // If avatar URL has an error or can't be loaded, use a fallback or empty string
      if (avatarError && payload.avatarUrl) {
        logger.warn('Avatar URL has loading issues, using default instead', {
          url: payload.avatarUrl,
          error: avatarError,
        });
        payload.avatarUrl = ''; // Will use default avatar
      }

      logger.info('Sending profile update with payload:', {
        username: payload.username,
        hasAvatarUrl: Boolean(payload.avatarUrl),
        avatarUrl: payload.avatarUrl,
      });

      // Use the API service instead of direct fetch
      const data = await api.auth.updateProfile(payload);

      // Handle email change - requires logout
      if (data.requiresLogout && data.emailPending) {
        toast({
          title: 'Email Change Initiated',
          description: `Verification emails sent to both your old and new email (${data.pendingEmail}). You will be logged out for security in about 10 seconds. Check both emails to complete the change. NOTE: Your old email will work for 24 hours while this change is pending.`,
          status: 'warning',
          duration: 20000,
          isClosable: true,
        });

        // Wait a moment for user to read the message, then force logout
        setTimeout(async () => {
          try {
            // Call logout API to ensure backend session is destroyed
            await api.auth.logout();
          } catch (error) {
            logger.error('Error during logout after email change:', error);
          } finally {
            // Force clear everything and redirect
            localStorage.clear();
            sessionStorage.clear();
            // Hard redirect to home page to clear all state
            window.location.href = '/?emailChangeInitiated=true';
          }
        }, 10000);
        return;
      }

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset password fields after successful update
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Refresh profile data or reload
      if (refreshProfileData && typeof refreshProfileData === 'function') {
        refreshProfileData();
      } else {
        // Force reload to ensure all components update with new data
        window.location.reload();
      }

      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      logger.error('Profile update error:', err);
      toast({
        title: 'Profile update failed',
        description: 'We could not save your profile changes. Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      setError(err.message || 'An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    handleUpdateProfile,
    error,
    isLoading,
    avatarLoading,
    avatarError,
    passwordErrors,
    passwordMatchError,
  };
};

export default useProfileForm;
