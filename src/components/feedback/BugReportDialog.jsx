import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSupportEmail } from '../../constants/supportEmail';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { executeRecaptchaAction, isRecaptchaConfigured } from '../../services/recaptchaService';
import { buildRecentIssueClientState } from '../../utils/feedback/clientIssueReporter';
import { getUserFacingErrorMessage } from '../../utils/ui/userFacingErrors';

const BUG_REPORT_OPTIONS = Object.freeze([
  { value: 'game_mechanic_bug', label: 'Game mechanic bug' },
  { value: 'problem_submission_bug', label: 'Problem submission bug' },
  { value: 'learning_content_bug', label: 'Learning content bug' },
  { value: 'other', label: 'Other' },
]);

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

const labelProps = {
  color: '#0a2c9a',
  fontFamily: UI_FONT_FAMILY,
  fontSize: 'xs',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const fieldProps = {
  bg: '#ffffff',
  color: '#1f2430',
  border: '2px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-inset)',
  fontFamily: UI_FONT_FAMILY,
  _hover: { borderColor: '#5d636e' },
  _focusVisible: {
    borderColor: '#0a2c9a',
    boxShadow: 'var(--cg-window-inset)',
  },
};

const createButtonProps = (toneColor, overrides = {}) => ({
  bg: '#d4d0c8',
  color: toneColor,
  border: '1px solid #7f7f7f',
  borderRadius: '0',
  boxShadow: 'var(--cg-window-outset)',
  fontFamily: UI_FONT_FAMILY,
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  _hover: { bg: '#efebe7', color: toneColor },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translateY(1px)',
  },
  ...overrides,
});

const normalizeScalarMap = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
    if (entryValue === undefined || entryValue === null || entryValue === '') {
      return accumulator;
    }

    if (!['string', 'number', 'boolean'].includes(typeof entryValue)) {
      return accumulator;
    }

    accumulator[key] = String(entryValue);
    return accumulator;
  }, {});
};

const getDefaultCategory = (pageType) => {
  if (pageType === 'tower-defense') return 'game_mechanic_bug';
  if (pageType === 'learning-content') return 'learning_content_bug';
  if (pageType?.includes('problem')) return 'problem_submission_bug';
  return 'other';
};

function BugReportDialog({
  isOpen,
  onClose,
  pageType = 'other',
  pageContext = {},
  clientState = {},
  initialDescription = '',
}) {
  const { pathname, search } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [category, setCategory] = useState(getDefaultCategory(pageType));
  const [description, setDescription] = useState(initialDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCategory(getDefaultCategory(pageType));
    setDescription(initialDescription || '');
  }, [initialDescription, isOpen, pageType]);

  const prefilledContext = useMemo(
    () =>
      normalizeScalarMap({
        pageType,
        pathname,
        search,
        currentUrl: typeof window !== 'undefined' ? window.location.href : pathname,
        ...pageContext,
      }),
    [pageContext, pageType, pathname, search]
  );

  const prefilledClientState = useMemo(() => {
    const guestToken = typeof window !== 'undefined' ? localStorage.getItem('guest_token') : null;

    return normalizeScalarMap({
      reporterLabel: isAuthenticated ? user?.username || 'Authenticated user' : 'Guest',
      reporterEmail: isAuthenticated ? user?.email || '' : '',
      authState: isAuthenticated ? 'authenticated' : 'guest',
      hasGuestToken: Boolean(guestToken),
      ...buildRecentIssueClientState(),
      ...clientState,
    });
  }, [clientState, isAuthenticated, user?.email, user?.username]);

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      toast({
        title: 'Add a few more details',
        description: 'Please describe the issue in at least 10 characters.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const recaptchaToken = await executeRecaptchaAction('bug_report_submit');
      const result = await api.email.submitBugReport({
        category,
        description: description.trim(),
        reportedAt: new Date().toISOString(),
        recaptchaToken,
        pageContext: prefilledContext,
        clientState: prefilledClientState,
      });

      toast({
        title: 'Bug report sent',
        description: `Your report was sent to ${result?.recipient || getSupportEmail('bugReport')}.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      if (result?.recaptcha?.reviewRecommended) {
        toast({
          title: 'Submission flagged for review',
          description: 'The report still went through, but reCAPTCHA marked it for review.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }

      onClose?.();
    } catch (error) {
      toast({
        title: 'Could not send bug report',
        description: getUserFacingErrorMessage(error, 'Please try again in a moment.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay bg="rgba(9, 18, 34, 0.32)" backdropFilter="blur(2px)" />
      <ModalContent
        className="cg-panel-window"
        bg="#d4d0c8"
        color="#1f2430"
        borderRadius="0"
        overflow="hidden"
      >
        <ModalHeader
          className="cg-titlebar"
          fontFamily={UI_FONT_FAMILY}
          fontSize="xs"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
          py={2}
        >
          report_bug.exe
        </ModalHeader>
        <ModalCloseButton
          color="#f5f7ff"
          borderRadius="0"
          _hover={{ bg: 'rgba(255,255,255,0.18)' }}
          _active={{ bg: 'rgba(0,0,0,0.18)' }}
        />
        <ModalBody>
          <Stack spacing={5}>
            <Box
              p={3}
              borderRadius="0"
              bg="#efebe7"
              border="2px solid #5d636e"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
            >
              <Text fontSize="sm" color="#0a2c9a" fontFamily={UI_FONT_FAMILY}>
                Reporter: {prefilledClientState.reporterLabel}
              </Text>
              <Text fontSize="sm" color="#1f2430" fontFamily={UI_FONT_FAMILY}>
                Page: {prefilledContext.pathname}
              </Text>
              {prefilledContext.problemSlug ? (
                <Text fontSize="sm" color="#1f2430" fontFamily={UI_FONT_FAMILY}>
                  Problem: {prefilledContext.problemSlug}
                </Text>
              ) : null}
            </Box>

            <FormControl>
              <FormLabel {...labelProps}>Bug category</FormLabel>
              <Select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                {...fieldProps}
                iconColor="#0a2c9a"
                sx={{
                  option: {
                    background: '#ffffff',
                    color: '#1f2430',
                  },
                }}
              >
                {BUG_REPORT_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    style={{ backgroundColor: '#ffffff', color: '#1f2430' }}
                  >
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel {...labelProps}>What happened?</FormLabel>
              <Textarea
                {...fieldProps}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minH="180px"
                maxLength={4000}
                placeholder="Explain what you were doing, what went wrong, and what you expected instead."
              />
              <HStack justify="space-between" mt={2}>
                <Text fontSize="xs" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                  This report is sent to {getSupportEmail('bugReport')}.
                </Text>
                <Text fontSize="xs" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                  {description.length}/4000
                </Text>
              </HStack>
            </FormControl>

            <Box
              p={3}
              borderRadius="0"
              bg="#efebe7"
              border="2px solid #5d636e"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
            >
              <Text
                fontSize="sm"
                color="#0a2c9a"
                fontFamily={UI_FONT_FAMILY}
                mb={2}
                fontWeight="700"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Prefilled context
              </Text>
              <Stack spacing={1}>
                {Object.entries(prefilledContext).map(([key, value]) => (
                  <Text key={key} fontSize="xs" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                    {key}: {value}
                  </Text>
                ))}
                {Object.entries(prefilledClientState)
                  .filter(([key]) => !['reporterLabel', 'reporterEmail'].includes(key))
                  .map(([key, value]) => (
                    <Text key={key} fontSize="xs" color="#4a5160" fontFamily={UI_FONT_FAMILY}>
                      {key}: {value}
                    </Text>
                  ))}
              </Stack>
            </Box>

            {isRecaptchaConfigured() ? (
              <Text fontSize="xs" color="#4a5160" lineHeight="1.7" fontFamily={UI_FONT_FAMILY}>
                This form is protected by reCAPTCHA Enterprise and the Google Privacy Policy and
                Terms of Service apply.
              </Text>
            ) : null}
          </Stack>
        </ModalBody>

        <ModalFooter bg="#d4d0c8">
          <Button {...createButtonProps('#3b4250')} mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button {...createButtonProps('#0a2c9a')} onClick={handleSubmit} isLoading={isSubmitting}>
            Send report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default BugReportDialog;
