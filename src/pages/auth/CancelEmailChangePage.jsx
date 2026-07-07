import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { Button, Spinner } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthRetroStatusLayout from '../../components/auth/AuthRetroStatusLayout';
import { api } from '../../services/api';

const CancelEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [cancelStatus, setCancelStatus] = useState('pending'); // pending, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const cancelAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setCancelStatus('error');
      setMessage('No cancellation token provided');
      return;
    }

    // Prevent multiple cancellation attempts
    if (cancelAttempted.current) {
      return;
    }
    cancelAttempted.current = true;

    const cancelEmailChange = async () => {
      try {
        const response = await api.auth.cancelEmailChange(token);
        setCancelStatus('success');
        setMessage(response.message || 'Email change cancelled successfully');
      } catch (error) {
        setCancelStatus('error');
        setMessage(error.message || 'Failed to cancel email change');
      }
    };

    cancelEmailChange();
  }, [token]);

  const handleRedirect = () => {
    navigate('/');
  };

  return (
    <AuthRetroStatusLayout
      fileLabel="cancel-email-change.exe"
      title={
        cancelStatus === 'pending'
          ? 'Cancelling Email Change'
          : cancelStatus === 'success'
            ? 'Email Change Cancelled'
            : 'Cancellation Failed'
      }
      description={
        cancelStatus === 'pending'
          ? 'Please wait while we cancel your email change request.'
          : message
      }
      icon={
        cancelStatus === 'pending' ? (
          <Spinner thickness="4px" speed="0.8s" color="currentColor" emptyColor="transparent" />
        ) : cancelStatus === 'success' ? (
          <CheckCircleIcon boxSize={8} />
        ) : (
          <WarningIcon boxSize={8} />
        )
      }
      status={
        cancelStatus === 'pending' ? 'info' : cancelStatus === 'success' ? 'success' : 'error'
      }
      statusLabel={
        cancelStatus === 'pending'
          ? 'Cancelling'
          : cancelStatus === 'success'
            ? 'Cancelled'
            : 'Failed'
      }
      meta={
        cancelStatus === 'success'
          ? 'Your account email remains unchanged. You can continue using the current address normally.'
          : cancelStatus === 'error'
            ? 'If this cancellation link expired, open the latest email-change message and try again.'
            : null
      }
    >
      {cancelStatus === 'success' || cancelStatus === 'error' ? (
        <Button onClick={handleRedirect} color="var(--cg-accent-blue)">
          {cancelStatus === 'success' ? 'Go To Home' : 'Return To Home'}
        </Button>
      ) : null}
    </AuthRetroStatusLayout>
  );
};

export default CancelEmailChangePage;
