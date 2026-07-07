import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { Button, Spinner } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthRetroStatusLayout from '../../components/auth/AuthRetroStatusLayout';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const EmailChangeVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token || !email) {
      setVerificationStatus('error');
      setMessage('Missing verification information');
      return;
    }

    // Prevent multiple verification attempts
    if (verificationAttempted.current) {
      return;
    }
    verificationAttempted.current = true;

    const verifyEmailChange = async () => {
      try {
        const response = await api.auth.verifyEmailChange(token, email);
        setVerificationStatus('success');
        setMessage(response.message || 'Email changed and verified successfully');

        // Refresh auth context to update user data
        await refreshAuth();
      } catch (error) {
        setVerificationStatus('error');
        setMessage(error.message || 'Failed to verify email change');
      }
    };

    verifyEmailChange();
  }, [token, email, refreshAuth]);

  const handleRedirect = () => {
    navigate('/profile');
  };

  return (
    <AuthRetroStatusLayout
      fileLabel="email-change.exe"
      title={
        verificationStatus === 'pending'
          ? 'Verifying Email Change'
          : verificationStatus === 'success'
            ? 'Email Updated'
            : 'Verification Failed'
      }
      description={
        verificationStatus === 'pending'
          ? 'Please wait while we verify your new email address.'
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
            ? 'Updated'
            : 'Failed'
      }
      meta={
        verificationStatus === 'success'
          ? 'Your account email has been refreshed in the active session. Continue back to your profile.'
          : verificationStatus === 'error'
            ? 'If this confirmation link expired, start the email-change flow again from profile settings.'
            : null
      }
    >
      {verificationStatus === 'success' || verificationStatus === 'error' ? (
        <Button onClick={handleRedirect} color="var(--cg-accent-blue)">
          {verificationStatus === 'success' ? 'Go To Profile' : 'Return To Profile'}
        </Button>
      ) : null}
    </AuthRetroStatusLayout>
  );
};

export default EmailChangeVerificationPage;
