import { Box, Button, Flex, HStack, IconButton, Text, Tooltip } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaCommentSlash, FaComments, FaEye, FaEyeSlash, FaRedo } from 'react-icons/fa';
import CodeExecutionRateLimitBadge from '../../limits/CodeExecutionRateLimitBadge';
import LanguageSelector from '../../editor/LanguageSelector';
import {
  WORKSPACE_SHELL_VISIBILITY_EVENT,
  readWorkspaceShellVisible,
  writeWorkspaceShellVisible,
} from '../../../utils/ui/workspaceShellVisibility';

const EditorToolbar = ({
  language,
  onLanguageChange,
  mode,
  timer,
  sessionSubmissions,
  bestTime,
  highScore,
  formatTime,
  animationsEnabled,
  toggleAnimations,
  isChatVisible,
  onToggleChatVisibility,
  onRun,
  onRunOutput,
  onSubmit,
  isExecuting,
  executionRateLimit,
  showLearningOutputButtons = false,
  isLearningMode = false,
  onResetLearningTutorial,
  lockedLearningLanguage = null,
  isMobilePhoneMode = false,
}) => {
  const baseRetroButton = {
    fontFamily: 'var(--cg-font-retro-display)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderRadius: '0',
    border: '1px solid var(--cg-window-shadow)',
    color: 'var(--cg-text)',
    bg: 'var(--cg-window)',
    boxShadow: 'var(--cg-window-outset)',
    _hover: {
      bg: 'var(--cg-panel-shell)',
    },
    _active: {
      boxShadow: 'var(--cg-window-inset)',
    },
    _focusVisible: {
      boxShadow: 'var(--cg-window-inset)',
    },
  };

  const runButtonStyles = {
    ...baseRetroButton,
    color: 'var(--cg-accent-blue)',
  };

  const submitButtonStyles = {
    ...baseRetroButton,
    color: 'var(--cg-accent-green)',
  };

  const stdoutButtonStyles = {
    ...baseRetroButton,
    color: 'var(--cg-link)',
  };

  const stderrButtonStyles = {
    ...baseRetroButton,
    color: 'var(--cg-accent-amber)',
  };

  const [isWorkspaceShellVisible, setIsWorkspaceShellVisible] = useState(() =>
    readWorkspaceShellVisible()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncWorkspaceShellVisibility = (event) => {
      const nextVisible = event?.detail?.visible;
      if (typeof nextVisible === 'boolean') {
        setIsWorkspaceShellVisible(nextVisible);
        return;
      }
      setIsWorkspaceShellVisible(readWorkspaceShellVisible());
    };

    window.addEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
    window.addEventListener('storage', syncWorkspaceShellVisibility);

    return () => {
      window.removeEventListener(WORKSPACE_SHELL_VISIBILITY_EVENT, syncWorkspaceShellVisibility);
      window.removeEventListener('storage', syncWorkspaceShellVisibility);
    };
  }, []);

  const handleWorkspaceShellToggle = () => {
    const nextVisible = !isWorkspaceShellVisible;
    setIsWorkspaceShellVisible(nextVisible);
    writeWorkspaceShellVisible(nextVisible);
  };

  return (
    <Box
      p={2}
      bg="var(--cg-window-face)"
      borderBottom="1px solid var(--cg-window-dark)"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      data-tutorial="learning-editor-header"
    >
      {/* Left side - Language selector and stats */}
      <Flex align="center" wrap="wrap" gap={3}>
        <LanguageSelector
          language={language}
          onLanguageChange={(newLang) => {
            if (newLang) onLanguageChange(newLang);
          }}
          isDisabled={Boolean(lockedLearningLanguage)}
          allowedLanguages={lockedLearningLanguage ? [lockedLearningLanguage] : null}
        />

        {/* Stats display */}
        {(mode === 'ranked' || mode === 'challenge') && (
          <HStack spacing={4} ml={2} flexWrap="wrap">
            <Box>
              <Text
                fontSize="xs"
                color="var(--cg-muted)"
                fontFamily="var(--cg-font-retro-display)"
                letterSpacing="0.08em"
              >
                TIME
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="var(--cg-text)">
                {formatTime(timer)}
              </Text>
            </Box>

            <Box>
              <Text
                fontSize="xs"
                color="var(--cg-muted)"
                fontFamily="var(--cg-font-retro-display)"
                letterSpacing="0.08em"
              >
                SUBMISSIONS
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="var(--cg-text)">
                {sessionSubmissions}
              </Text>
            </Box>

            {highScore > 0 && (
              <Box>
                <Text
                  fontSize="xs"
                  color="var(--cg-muted)"
                  fontFamily="var(--cg-font-retro-display)"
                  letterSpacing="0.08em"
                >
                  HIGH SCORE
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="var(--cg-accent-green)">
                  {highScore}
                </Text>
              </Box>
            )}

            {bestTime > 0 && (
              <Box>
                <Text
                  fontSize="xs"
                  color="var(--cg-muted)"
                  fontFamily="var(--cg-font-retro-display)"
                  letterSpacing="0.08em"
                >
                  BEST TIME
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="var(--cg-accent-amber)">
                  {formatTime(bestTime)}
                </Text>
              </Box>
            )}
          </HStack>
        )}

        {/* Settings controls */}
        {(toggleAnimations || onToggleChatVisibility || isMobilePhoneMode) && (
          <HStack ml={4} spacing={2} data-tutorial="learning-editor-quick-controls">
            {isMobilePhoneMode && (
              <Tooltip
                label={isWorkspaceShellVisible ? 'Hide navbar/footer' : 'Show navbar/footer'}
              >
                <Button
                  size="xs"
                  sx={{
                    ...baseRetroButton,
                    color: isWorkspaceShellVisible ? 'var(--cg-text)' : 'var(--cg-accent-blue)',
                  }}
                  onClick={handleWorkspaceShellToggle}
                  aria-label="Toggle workspace navbar and footer"
                  data-tutorial="learning-shell-toggle"
                >
                  {isWorkspaceShellVisible ? 'Hide Nav' : 'Show Nav'}
                </Button>
              </Tooltip>
            )}
            {toggleAnimations && (
              <Tooltip label={animationsEnabled ? 'Disable animations' : 'Enable animations'}>
                <IconButton
                  icon={animationsEnabled ? <FaEye /> : <FaEyeSlash />}
                  size="sm"
                  variant="solid"
                  color={animationsEnabled ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'}
                  bg="var(--cg-window)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  onClick={toggleAnimations}
                  aria-label="Toggle animations"
                  data-tutorial="learning-animations-toggle"
                  _hover={{ bg: 'var(--cg-panel-shell)' }}
                />
              </Tooltip>
            )}
            {onToggleChatVisibility && (
              <Tooltip label={isChatVisible ? 'Hide chat' : 'Show chat'}>
                <IconButton
                  icon={isChatVisible ? <FaComments /> : <FaCommentSlash />}
                  size="sm"
                  variant="solid"
                  color={isChatVisible ? 'var(--cg-accent-blue)' : 'var(--cg-accent-red)'}
                  bg="var(--cg-window)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  onClick={onToggleChatVisibility}
                  aria-label="Toggle chat visibility"
                  data-tutorial="learning-chat-toggle"
                  _hover={{ bg: 'var(--cg-panel-shell)' }}
                />
              </Tooltip>
            )}
            {isLearningMode && onResetLearningTutorial && (
              <Tooltip label="Restart tutorial">
                <IconButton
                  icon={<FaRedo />}
                  size="sm"
                  variant="solid"
                  color="var(--cg-accent-green)"
                  bg="var(--cg-window)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  onClick={onResetLearningTutorial}
                  aria-label="Restart tutorial"
                  data-tutorial="learning-restart-tutorial"
                  _hover={{ bg: 'var(--cg-panel-shell)' }}
                />
              </Tooltip>
            )}
          </HStack>
        )}
      </Flex>

      {/* Right side - Action buttons */}
      <HStack
        spacing={3}
        mt={{ base: 2, md: 0 }}
        flexWrap="wrap"
        justify="flex-end"
        data-tutorial="learning-editor-actions"
      >
        <Box display="flex" alignItems="center">
          <CodeExecutionRateLimitBadge rateLimit={executionRateLimit} label="Exec" />
        </Box>
        <Button
          size="sm"
          onClick={onRun}
          isLoading={isExecuting}
          loadingText="Running..."
          sx={runButtonStyles}
          minW="110px"
          data-tutorial="learning-run-button"
        >
          Run Code
        </Button>
        {showLearningOutputButtons && (
          <>
            <Button
              size="sm"
              onClick={() => onRunOutput?.('stdout')}
              isLoading={isExecuting}
              loadingText="Running..."
              sx={stdoutButtonStyles}
              minW="95px"
              data-tutorial="learning-stdout-button"
            >
              Stdout
            </Button>
            <Button
              size="sm"
              onClick={() => onRunOutput?.('stderr')}
              isLoading={isExecuting}
              loadingText="Running..."
              sx={stderrButtonStyles}
              minW="95px"
              data-tutorial="learning-stderr-button"
            >
              Stderr
            </Button>
          </>
        )}
        <Button
          size="sm"
          onClick={onSubmit}
          isLoading={isExecuting}
          loadingText="Submitting..."
          sx={submitButtonStyles}
          minW="120px"
          data-tutorial="learning-submit-button"
        >
          Submit Code
        </Button>
      </HStack>
    </Box>
  );
};

export default EditorToolbar;
