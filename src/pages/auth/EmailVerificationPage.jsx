import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { Button, Spinner, useToast } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthRetroStatusLayout from '../../components/auth/AuthRetroStatusLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { getUserFacingErrorMessage } from '../../utils/ui/userFacingErrors';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Prevent multiple verification attempts
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.auth.verifyEmail(token);

        setVerificationStatus('success');
        setMessage(response.message || 'Email verified successfully');

        // Show a toast notification
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Verification error:', error);
        const safeMessage = getUserFacingErrorMessage(
          error,
          'We could not verify your email right now. Please try again.'
        );
        setVerificationStatus('error');
        setMessage(safeMessage);

        // Show error toast
        toast({
          title: 'Verification Failed',
          description: safeMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    verifyEmail();
  }, [token, toast]); // Removed refreshAuth from dependencies

  const handleRedirect = () => {
    if (isAuthenticated) {
      navigate('/profile');
      return;
    }

    navigate('/', { state: { openSignIn: true } });
  };

  return (
    <AuthRetroStatusLayout
      fileLabel="email-verify.exe"
      title={
        verificationStatus === 'pending'
          ? 'Verifying Email'
          : verificationStatus === 'success'
            ? 'Email Verified'
            : 'Verification Failed'
      }
      description={
        verificationStatus === 'pending'
          ? 'Please wait while we verify your email address.'
          : message
      }
      icon={
        verificationStatus === 'pending' ? (
          <Spinner thickness="4px" speed="0.8s" color="currentColor" emptyColor="transparent" />
        ) : verificationStatus === 'success' ? (
          <CheckCircleIcon boxSize={8} />
        ) : (
          <WarningIcon boxSize={8} />
        )
      }
      status={
        verificationStatus === 'pending'
          ? 'info'
          : verificationStatus === 'success'
            ? 'success'
            : 'error'
      }
      statusLabel={
        verificationStatus === 'pending'
          ? 'Verifying'
          : verificationStatus === 'success'
            ? 'Verified'
            : 'Failed'
      }
      meta={
        verificationStatus === 'success'
          ? isAuthenticated
            ? 'Your account is ready. Continue back to your profile workspace.'
            : 'Your email is confirmed. Continue to sign in and reopen your workspace.'
          : verificationStatus === 'error'
            ? 'If this link has expired, request a fresh verification email from the sign-in flow.'
            : null
      }
    >
      {verificationStatus === 'success' || verificationStatus === 'error' ? (
        <Button onClick={handleRedirect} color="var(--cg-accent-blue)">
          {isAuthenticated
            ? 'Go To Dashboard'
            : verificationStatus === 'success'
              ? 'Sign In'
              : 'Return Home'}
        </Button>
      ) : null}
    </AuthRetroStatusLayout>
  );
};

export default EmailVerificationPage;
