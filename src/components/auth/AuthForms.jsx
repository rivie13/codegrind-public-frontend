import { CloseIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  List,
  ListIcon,
  ListItem,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaDiscord, FaGoogle } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupportEmail } from '../../constants/supportEmail';
import { useAuth } from '../../contexts/AuthContext';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';
import { api } from '../../services/api';
import {
  executeRecaptchaAction,
  isRecaptchaConfigured,
  prepareRecaptcha,
} from '../../services/recaptchaService';
import { getUserFacingErrorMessage } from '../../utils/ui/userFacingErrors';

const normalizeRecaptchaIntent = (intent) => (intent === 'register' ? 'signup' : intent);

const buildAuthAction = (intent, provider = 'password') =>
  `${normalizeRecaptchaIntent(intent)}_${provider}`;

const buildPendingAuthAction = (intent, provider = 'password') => `${provider}:${intent}`;

const getSubmitLoadingText = (intent) => (intent === 'login' ? 'LOGGING IN...' : 'REGISTERING...');

const getOAuthLoadingText = (provider) =>
  provider === 'discord' ? 'CONNECTING TO DISCORD...' : 'CONNECTING TO GOOGLE...';

const RECAPTCHA_FAILURE_MESSAGE =
  'reCAPTCHA could not verify this request. Refresh the page and try again. If you use a privacy or ad blocker, allow Google reCAPTCHA for this form.';

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const RETRO_WINDOW_PROPS = {
  bg: '#d4d0c8',
  border: '2px solid #5d636e',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  color: '#1f2430',
};

const RETRO_BODY_TEXT_PROPS = {
  color: '#1f2430',
  fontFamily: UI_FONT_FAMILY,
};

const RETRO_LABEL_PROPS = {
  color: '#0a2c9a',
  fontFamily: UI_FONT_FAMILY,
  fontSize: 'xs',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const RETRO_FIELD_PROPS = {
  bg: '#ffffff',
  color: '#1f2430',
  border: '2px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-inset)',
  fontFamily: UI_FONT_FAMILY,
  _hover: {
    borderColor: '#5d636e',
  },
  _focusVisible: {
    borderColor: '#0a2c9a',
    boxShadow: 'var(--cg-window-inset)',
  },
};

const RETRO_SECONDARY_PANEL_PROPS = {
  bg: '#efebe7',
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-inset)',
};

const createRetroButtonProps = (toneColor, overrides = {}) => ({
  bg: '#d4d0c8',
  color: toneColor,
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  fontWeight: '700',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  _hover: {
    bg: '#efebe7',
    color: toneColor,
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
  ...overrides,
});

const createModeToggleProps = (isActive) => {
  if (isActive) {
    return {
      ...createRetroButtonProps('#f5f7ff', {
        bg: 'linear-gradient(180deg, #0b2ba8 0%, #081a77 100%)',
        border: '1px solid #081a77',
        boxShadow: 'var(--cg-window-inset)',
      }),
      _hover: {
        bg: 'linear-gradient(180deg, #0b2ba8 0%, #081a77 100%)',
        color: '#f5f7ff',
      },
      _active: {
        boxShadow: 'var(--cg-window-inset)',
        transform: 'translateY(1px)',
      },
    };
  }

  return createRetroButtonProps('#3b4250');
};

function AuthForms({ defaultIsLogin = true }) {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmailTarget, setVerificationEmailTarget] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [usernameErrors, setUsernameErrors] = useState([]);
  const recaptchaEnabled = isRecaptchaConfigured();
  const currentIntent = isLogin ? 'login' : 'register';
  const submitAction = buildPendingAuthAction(currentIntent);
  const googleAction = buildPendingAuthAction(currentIntent, 'google');
  const discordAction = buildPendingAuthAction(currentIntent, 'discord');
  const isAnyAuthPending = pendingAuthAction !== null;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorCode = params.get('error');

    if (!errorCode) {
      return;
    }

    const errorMessages = {
      google_already_linked:
        'This Google account is already linked to another CodeGrind profile. Try signing in with that account instead.',
      discord_already_linked:
        'That Discord account is already linked to another CodeGrind profile. Unlink it first, then try again.',
    };

    const message = errorMessages[errorCode];
    if (message) {
      toast({
        title: 'Account already linked',
        description: message,
        status: 'warning',
        duration: 6000,
        isClosable: true,
      });
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate, toast]);

  useEffect(() => {
    if (isLogin) {
      setUsernameErrors([]);
    }
  }, [isLogin]);

  useEffect(() => {
    prepareRecaptcha().catch(() => null);
  }, []);

  const getRecaptchaToken = async (action) => {
    try {
      const token = await executeRecaptchaAction(action);

      if (recaptchaEnabled && !token) {
        throw new Error(RECAPTCHA_FAILURE_MESSAGE);
      }

      return token;
    } catch (error) {
      if (!recaptchaEnabled) {
        return null;
      }

      throw new Error(error?.message || RECAPTCHA_FAILURE_MESSAGE);
    }
  };

  const renderRecaptchaDisclosure = () => {
    if (!recaptchaEnabled) {
      return null;
    }

    return (
      <Text
        fontSize="xs"
        color="#4a5160"
        textAlign="center"
        lineHeight="1.6"
        mt={2}
        fontFamily={UI_FONT_FAMILY}
      >
        This form is protected by reCAPTCHA Enterprise and the Google{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#0a2c9a', textDecoration: 'underline' }}
        >
          Privacy Policy
        </a>{' '}
        and{' '}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#0a2c9a', textDecoration: 'underline' }}
        >
          Terms of Service
        </a>{' '}
        apply.
      </Text>
    );
  };

  const maybeShowReviewToast = (result, intentLabel) => {
    if (!result?.recaptcha?.reviewRecommended) {
      return;
    }

    toast({
      title: 'Verification flagged this attempt',
      description: `We let the ${intentLabel} continue because reCAPTCHA is in monitor mode. Retry once if the flow behaves unexpectedly.`,
      status: 'warning',
      duration: 5000,
      isClosable: true,
    });
  };

  const isMobileDevice = useIsMobileDevice();

  const handleOAuthStart = async (provider) => {
    const intent = isLogin ? 'login' : 'register';
    const action = buildPendingAuthAction(intent, provider);

    if (pendingAuthAction) {
      return;
    }

    try {
      setPendingAuthAction(action);
      const recaptchaToken = await getRecaptchaToken(buildAuthAction(intent, provider));
      const result = await api.auth.startOAuth(provider, intent, {
        recaptchaToken,
        ...(isMobileDevice ? { compactMobileShell: true } : {}),
      });

      maybeShowReviewToast(result, `${provider} ${intent}`);

      if (!result?.url) {
        throw new Error('OAuth flow could not be started. Please try again.');
      }

      window.location.href = result.url;
    } catch (error) {
      toast({
        title: 'Error',
        description: getUserFacingErrorMessage(error, 'Failed to start OAuth flow.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPendingAuthAction(null);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Clear errors when switching modes
    setPasswordErrors([]);
    setUsernameErrors([]);
    setPasswordMatchError(false);
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (!isLogin) {
      const errors = [];
      if (newPassword.length < 8) {
        errors.push('Must be at least 8 characters');
      }
      if (!/[A-Z]/.test(newPassword)) {
        errors.push('Must include uppercase letter');
      }
      if (!/[a-z]/.test(newPassword)) {
        errors.push('Must include lowercase letter');
      }
      if (!/[0-9]/.test(newPassword)) {
        errors.push('Must include number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        errors.push('Must include special character');
      }
      setPasswordErrors(errors);

      // Check if passwords match
      setPasswordMatchError(confirmPassword !== '' && confirmPassword !== newPassword);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);

    if (!isLogin) {
      const errors = [];
      const trimmed = value.trim();

      if (trimmed.length < 3 || trimmed.length > 20) {
        errors.push('Must be 3-20 characters');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
        errors.push('Only letters, numbers, and underscores');
      }

      setUsernameErrors(errors);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setPasswordMatchError(newConfirmPassword !== password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pendingAuthAction) {
      return;
    }

    try {
      if (isLogin) {
        setPendingAuthAction(submitAction);
        const recaptchaToken = await getRecaptchaToken(buildAuthAction('login'));
        const result = await login(identifier, password, { recaptchaToken });
        maybeShowReviewToast(result, 'login');
      } else {
        if (usernameErrors.length > 0) {
          toast({
            title: 'Invalid Username',
            description: usernameErrors.join(', '),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        if (passwordErrors.length > 0) {
          toast({
            title: 'Invalid Password',
            description: passwordErrors.join(', '),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        if (password !== confirmPassword) {
          toast({
            title: 'Passwords do not match',
            description: 'Please make sure your passwords match',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        setPendingAuthAction(submitAction);
        const recaptchaToken = await getRecaptchaToken(buildAuthAction('signup'));

        const result = await register(
          {
            username,
            email,
            password,
          },
          { recaptchaToken }
        );

        if (result?.emailSent === false) {
          throw new Error(
            result?.message || 'Verification email failed to send. Please try again.'
          );
        }
        maybeShowReviewToast(result, 'registration');
        setVerificationEmailTarget(result?.user?.email || email);
        setVerificationSent(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getUserFacingErrorMessage(
          error,
          isLogin
            ? 'We could not sign you in right now. Please try again.'
            : 'We could not finish creating your account right now. Please try again.'
        ),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPendingAuthAction(null);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResendingVerification(true);
      await api.auth.resendVerificationEmail(verificationEmailTarget || email);

      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email for the verification link',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: getUserFacingErrorMessage(
          error,
          'Failed to resend the verification email. Please try again.'
        ),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Show verification success screen if just registered
  if (verificationSent) {
    return (
      <Box {...RETRO_WINDOW_PROPS} p={8} w="100%" maxW="400px" height="auto">
        <Stack spacing={4} position="relative" zIndex="1" textAlign="center">
          <Heading
            size="md"
            color="#0a2c9a"
            fontFamily={UI_FONT_FAMILY}
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="0.08em"
            mb={4}
          >
            VERIFICATION EMAIL SENT
          </Heading>
          <Text {...RETRO_BODY_TEXT_PROPS} mb={2}>
            We've sent a verification link to <strong>{verificationEmailTarget || email}</strong>
          </Text>
          <Text {...RETRO_BODY_TEXT_PROPS} mb={4}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <Text color="#4a5160" fontSize="sm" fontFamily={UI_FONT_FAMILY} mb={2}>
            Check your spam/junk folder if you don’t see it. Emails are sent from{' '}
            {getSupportEmail('info')}.
          </Text>
          <Button
            onClick={() => {
              setIsLogin(true);
              setVerificationSent(false);
              setVerificationEmailTarget('');
            }}
            {...createRetroButtonProps('#0a2c9a')}
            size="md"
            mt={2}
          >
            RETURN TO LOGIN
          </Button>
          <Button
            onClick={handleResendVerification}
            isLoading={isResendingVerification}
            {...createRetroButtonProps('#0f6f17')}
            size="md"
          >
            RESEND VERIFICATION EMAIL
          </Button>
        </Stack>
      </Box>
    );
  }

  // Show email verification warning for logged in users
  if (user && !user.isEmailVerified) {
    return (
      <Box {...RETRO_WINDOW_PROPS} p={8} w="100%" maxW="400px" height="auto">
        <Stack spacing={4} position="relative" zIndex="1" textAlign="center">
          <Heading
            size="md"
            color="#6f5600"
            fontFamily={UI_FONT_FAMILY}
            fontSize="sm"
            textTransform="uppercase"
            letterSpacing="0.08em"
            mb={4}
          >
            EMAIL VERIFICATION REQUIRED
          </Heading>
          <Text {...RETRO_BODY_TEXT_PROPS} mb={2}>
            Your email address <strong>{user.email}</strong> has not been verified yet.
          </Text>
          <Text {...RETRO_BODY_TEXT_PROPS} mb={4}>
            Please check your email for verification instructions or request a new verification
            email.
          </Text>
          <Text color="#4a5160" fontSize="sm" fontFamily={UI_FONT_FAMILY} mb={2}>
            Check your spam/junk folder if you don’t see it. Emails are sent from{' '}
            {getSupportEmail('info')}.
          </Text>
          <Button
            onClick={handleResendVerification}
            {...createRetroButtonProps('#6f5600')}
            size="md"
            mt={2}
            isLoading={isResendingVerification}
            loadingText="SENDING..."
          >
            RESEND VERIFICATION EMAIL
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      {...RETRO_WINDOW_PROPS}
      p={8}
      w="100%"
      maxW="400px"
      height="auto"
      position="relative"
      overflow="hidden"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={4} position="relative" zIndex="1">
          <Flex justifyContent="center" mb={6}>
            <Button
              type="button"
              {...createModeToggleProps(isLogin)}
              mr={2}
              onClick={() => setIsLogin(true)}
              size="md"
              width="50%"
            >
              Login
            </Button>
            <Button
              type="button"
              {...createModeToggleProps(!isLogin)}
              onClick={() => setIsLogin(false)}
              size="md"
              width="50%"
            >
              Register
            </Button>
          </Flex>

          {!isLogin && (
            <>
              <FormControl isRequired>
                <FormLabel {...RETRO_LABEL_PROPS}>USERNAME</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  {...RETRO_FIELD_PROPS}
                  spellCheck="false"
                  autoComplete="off"
                />
              </FormControl>
              {usernameErrors.length > 0 && (
                <List
                  {...RETRO_SECONDARY_PANEL_PROPS}
                  spacing={1}
                  color="#8f1f1f"
                  fontSize="sm"
                  px={3}
                  py={2}
                >
                  {usernameErrors.map((error) => (
                    <ListItem key={error}>
                      <ListIcon as={CloseIcon} color="#8f1f1f" />
                      {error}
                    </ListItem>
                  ))}
                </List>
              )}
              <FormControl isRequired>
                <FormLabel {...RETRO_LABEL_PROPS}>EMAIL</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  {...RETRO_FIELD_PROPS}
                  spellCheck="false"
                  autoComplete="off"
                />
              </FormControl>
            </>
          )}
          {isLogin && (
            <FormControl isRequired>
              <FormLabel {...RETRO_LABEL_PROPS}>EMAIL OR USERNAME</FormLabel>
              <Input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                {...RETRO_FIELD_PROPS}
                spellCheck="false"
                autoComplete="off"
              />
            </FormControl>
          )}
          <FormControl isRequired>
            <FormLabel {...RETRO_LABEL_PROPS}>PASSWORD</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              {...RETRO_FIELD_PROPS}
              autoComplete="off"
            />
            {!isLogin && passwordErrors.length > 0 && (
              <List {...RETRO_SECONDARY_PANEL_PROPS} spacing={1} mt={2} px={3} py={2}>
                {passwordErrors.map((error, index) => (
                  <ListItem
                    key={index}
                    color="#8f1f1f"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    fontFamily={UI_FONT_FAMILY}
                  >
                    <ListIcon as={CloseIcon} color="#8f1f1f" boxSize="2" />
                    {error}
                  </ListItem>
                ))}
              </List>
            )}
          </FormControl>

          {!isLogin && (
            <FormControl isRequired>
              <FormLabel {...RETRO_LABEL_PROPS}>CONFIRM PASSWORD</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                {...RETRO_FIELD_PROPS}
                borderColor={passwordMatchError ? '#8f1f1f' : RETRO_FIELD_PROPS.border}
                _hover={{
                  borderColor: passwordMatchError ? '#8f1f1f' : '#5d636e',
                }}
                _focusVisible={{
                  borderColor: passwordMatchError ? '#8f1f1f' : '#0a2c9a',
                  boxShadow: 'var(--cg-window-inset)',
                }}
                autoComplete="off"
              />
              {passwordMatchError && (
                <List {...RETRO_SECONDARY_PANEL_PROPS} spacing={1} mt={2} px={3} py={2}>
                  <ListItem
                    color="#8f1f1f"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    fontFamily={UI_FONT_FAMILY}
                  >
                    <ListIcon as={CloseIcon} color="#8f1f1f" boxSize="2" />
                    Passwords do not match
                  </ListItem>
                </List>
              )}
            </FormControl>
          )}

          <Button
            type="submit"
            {...createRetroButtonProps('#0a2c9a')}
            size="lg"
            mt={6}
            isLoading={pendingAuthAction === submitAction}
            loadingText={getSubmitLoadingText(currentIntent)}
            isDisabled={
              isAnyAuthPending || (!isLogin && (passwordErrors.length > 0 || passwordMatchError))
            }
          >
            {isLogin ? 'LOGIN' : 'REGISTER'}
          </Button>

          <Button
            type="button"
            onClick={() => handleOAuthStart('google')}
            {...createRetroButtonProps('#8f1f1f')}
            leftIcon={<FaGoogle />}
            isLoading={pendingAuthAction === googleAction}
            loadingText={getOAuthLoadingText('google')}
            isDisabled={isAnyAuthPending}
          >
            {isLogin ? 'SIGN IN WITH GOOGLE' : 'SIGN UP WITH GOOGLE'}
          </Button>

          <Button
            type="button"
            onClick={() => handleOAuthStart('discord')}
            {...createRetroButtonProps('#0a2c9a')}
            leftIcon={<FaDiscord />}
            isLoading={pendingAuthAction === discordAction}
            loadingText={getOAuthLoadingText('discord')}
            isDisabled={isAnyAuthPending}
          >
            {isLogin ? 'SIGN IN WITH DISCORD' : 'SIGN UP WITH DISCORD'}
          </Button>
          {!isLogin && (
            <Text
              fontSize="xs"
              color="#4a5160"
              textAlign="center"
              mt={1}
              fontFamily={UI_FONT_FAMILY}
            >
              Signing up with Discord creates a CodeGrind account, links your Discord, and joins the
              CodeGrind server.
            </Text>
          )}
          {renderRecaptchaDisclosure()}
        </Stack>
      </form>
    </Box>
  );
}

export default AuthForms;
