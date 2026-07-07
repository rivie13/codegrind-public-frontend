import { Box, Button, Text, VStack, useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSupportEmail } from '../../constants/supportEmail';
import { api } from '../../services/api';
import AuthRetroStatusLayout from './AuthRetroStatusLayout';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const toast = useToast();

  // Show toast notification when user is not authenticated
  useEffect(() => {
    if (!loading && !user && !shouldRedirect) {
      toast({
        title: 'Authentication Required',
        description:
          "Please sign up or log in to access this feature. You'll be redirected to the home page.",
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top',
        // Custom styling to match the app theme
        render: ({ title, description, onClose }) => (
          <Box className="cg-panel-window" maxW="400px" overflow="hidden">
            <Box
              className="cg-titlebar"
              px={3}
              py={1.5}
              display="flex"
              justifyContent="space-between"
            >
              <Text
                fontSize="11px"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                access-warning.exe
              </Text>
              <Text
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                Redirecting
              </Text>
            </Box>
            <Box p={3} bg="rgba(255,255,255,0.16)">
              <Box
                bg="var(--cg-window-face)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                p={3}
              >
                <Text fontWeight="700" color="var(--cg-accent-amber)" mb={2}>
                  {title}
                </Text>
                <Text fontSize="sm" color="var(--cg-text)" mb={3}>
                  {description}
                </Text>
                <Button size="xs" color="var(--cg-accent-blue)" onClick={onClose}>
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        ),
      });

      // Set redirect flag and delay redirect to allow toast to be seen
      setShouldRedirect(true);
      setTimeout(() => {
        // The Navigate component will handle the actual redirect
      }, 1000);
    }
  }, [loading, user, toast, shouldRedirect]);

  if (loading) {
    return null; // or your loading component
  }

  if (!user) {
    if (shouldRedirect) {
      return <Navigate to="/" replace />;
    }
    // Return null while showing toast and preparing to redirect
    return null;
  }

  // Check if email is verified
  if (user.isEmailVerified === false) {
    const targetEmail = user.email?.trim() || null;

    const handleResend = async () => {
      setIsResending(true);
      setResendStatus(null);
      try {
        const response = await api.auth.resendVerificationEmail();
        const successMessage = targetEmail
          ? `Verification email sent to ${targetEmail}`
          : response.message || 'Verification email sent';

        setResendStatus({ success: true, message: successMessage });
      } catch (error) {
        setResendStatus({
          success: false,
          message: error.message || 'Failed to send verification email',
        });
      } finally {
        setIsResending(false);
      }
    };

    return (
      <AuthRetroStatusLayout
        fileLabel="verify-account.exe"
        title="Email Verification Required"
        description={
          targetEmail ? (
            <>
              You need to verify <strong>{targetEmail}</strong> before accessing this page. Check
              that inbox for a verification link.
            </>
          ) : (
            'You need to verify your email address before accessing this page. Check your inbox for a verification link.'
          )
        }
        meta={`Check your spam or junk folder if you do not see it. Verification emails are sent from ${getSupportEmail(
          'info'
        )}.`}
        status={
          resendStatus?.success ? 'success' : resendStatus?.success === false ? 'error' : 'warning'
        }
        statusLabel={isResending ? 'Resending' : 'Verification gate'}
      >
        <VStack align="stretch" spacing={3}>
          <Button onClick={handleResend} isLoading={isResending} color="var(--cg-accent-blue)">
            Resend Verification Email
          </Button>
          {resendStatus ? (
            <Box
              bg="var(--cg-window)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              px={3}
              py={2.5}
            >
              <Text
                color={resendStatus.success ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'}
                fontSize="sm"
              >
                {resendStatus.message}
              </Text>
            </Box>
          ) : null}
        </VStack>
      </AuthRetroStatusLayout>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
