import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, HStack, Text, useToast } from '@chakra-ui/react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import EditorPanel from '../editor/EditorPanel';
import PageTemplate from '../layout/PageTemplate';
import ProblemDescription from '../problems/ProblemDescription';
import ChatPanel from '../chat/ChatPanel';
import AdModal from '../towerDefense/AdModal';
import SuccessModal from './modals/SuccessModal';
import ChallengeModal from '../modals/ChallengeModal';
import BugReportButton from '../feedback/BugReportButton';
import { buildResponsiveProfile } from '../../utils/web/responsiveProfile';
import { releaseScreenOrientation } from '../../utils/mobile/screenOrientation';
import { getOptionalInlineErrorDetail } from '../../utils/ui/userFacingErrors';
import {
  readWorkspaceShellVisible,
  writeWorkspaceShellVisible,
} from '../../utils/ui/workspaceShellVisibility';

const MOBILE_PANELS = {
  PROBLEM: 'problem',
  EDITOR: 'editor',
  CHAT: 'chat',
};

const MOBILE_CHAT_FOCUS_MAX_WIDTH = '560px';

const hasMeaningfulText = (value) => {
  if (value === null || value === undefined) return false;

  const plainText = String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > 0;
};

const detectMobilePhoneWorkspaceMode = () => {
  if (typeof window === 'undefined') return false;

  return buildResponsiveProfile().isProblemWorkspaceHandheldLayout;
};

const detectLandscapeViewport = () => {
  if (typeof window === 'undefined') return true;

  return buildResponsiveProfile().isLandscapeViewport;
};

const WORKSPACE_SCROLLBAR_CSS = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'var(--cg-window-face)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'var(--cg-window-shadow)',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'var(--cg-window-dark)',
  },
};

function WorkspacePaneWindow({ fileLabel, statusLabel, children, contentProps = {}, ...props }) {
  return (
    <Box
      className="cg-panel-window"
      h="100%"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      {...props}
    >
      <Flex className="cg-titlebar" px={3} py={2} align="center" justify="space-between" gap={3}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
          {fileLabel}
        </Text>
        {statusLabel ? (
          <Text fontSize="10px" fontWeight="700" textTransform="uppercase">
            {statusLabel}
          </Text>
        ) : null}
      </Flex>
      <Box
        flex="1"
        minH="0"
        bg="rgba(255,255,255,0.14)"
        borderTop="1px solid var(--cg-window-dark)"
        {...contentProps}
      >
        {children}
      </Box>
    </Box>
  );
}

const ProblemWorkspaceLayout = ({
  isAIProblem,
  isHighRes,
  animationsEnabled,
  settings,
  customScanLineAnimation,
  quality,
  executionRateLimit,
  code,
  language,
  isExecuting,
  executionResult,
  onRun,
  onRunOutput,
  onSubmit,
  mode,
  timer,
  problemData,
  problemLoadError = null,
  sessionSubmissions,
  bestTime,
  highScore,
  formatTime,
  setMatrixBombActive,
  challengeState,
  setCurrentLine,
  setEditor,
  toggleAnimations,
  isChatVisible,
  onToggleChatVisibility,
  onEditorChange,
  onLanguageChange,
  onChatInput,
  onResetLearningTutorial,
  fullCode,
  showExecutionAdModal,
  handleExecutionAdModalClose,
  handleExecutionAdComplete,
  executionAdOptions,
  selectedExecutionAd,
  selectedExecutionAdType,
  setSelectedExecutionAdType,
  isApplyingExecutionCredit,
  isSuccessModalOpen,
  onCloseSuccessModal,
  learningNextNode,
  onContinueLearning,
  onReturnToMap,
  onGuestSignupWallRequested,
  timeSpent,
  isLearningMode,
  isLearningPathMode,
  finalScore,
  hasNewHighScore,
  hasNewBestTime,
  aiUsageCount,
  xpSummary,
  lockedLearningLanguage,
  xpAwards,
  levelUpInfo,
  dataPacketAward,
  onTryAnotherProblem,
  clusterNavigation,
  nextProblem,
  isChallengeModalOpen,
  onCloseChallengeModal,
  onConfirmChallenge,
}) => {
  const toast = useToast();
  const [isMobilePhoneMode, setIsMobilePhoneMode] = useState(() =>
    detectMobilePhoneWorkspaceMode()
  );
  const [activeMobilePanel, setActiveMobilePanel] = useState(MOBILE_PANELS.EDITOR);
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() => detectLandscapeViewport());
  const chatFocusShellVisibilityRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleViewportChange = () => {
      setIsMobilePhoneMode(detectMobilePhoneWorkspaceMode());
      setIsLandscapeViewport(detectLandscapeViewport());
    };

    handleViewportChange();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!isChatVisible && activeMobilePanel === MOBILE_PANELS.CHAT) {
      setActiveMobilePanel(MOBILE_PANELS.EDITOR);
    }
  }, [activeMobilePanel, isChatVisible]);

  const isMobileChatFocus =
    isMobilePhoneMode && isChatVisible && activeMobilePanel === MOBILE_PANELS.CHAT;
  const isPortraitChatExitLocked = isMobileChatFocus && !isLandscapeViewport;

  const handleMobilePanelChange = useCallback(
    (nextPanel) => {
      if (!nextPanel || nextPanel === activeMobilePanel) return;

      const leavingChatInPortrait =
        activeMobilePanel === MOBILE_PANELS.CHAT &&
        nextPanel !== MOBILE_PANELS.CHAT &&
        isPortraitChatExitLocked;

      if (leavingChatInPortrait) {
        toast({
          id: 'workspace-chat-portrait-lock-toast',
          title: 'Rotate To Landscape First',
          description:
            'Chat focus stays locked while your phone is portrait. Rotate back to landscape before leaving chat so your workspace progress stays stable.',
          status: 'info',
          duration: 3200,
          isClosable: true,
          position: 'top',
        });
        void releaseScreenOrientation();
        return;
      }

      setActiveMobilePanel(nextPanel);
    },
    [activeMobilePanel, isPortraitChatExitLocked, toast]
  );

  useEffect(() => {
    if (!isMobilePhoneMode) return;

    if (isMobileChatFocus) {
      if (chatFocusShellVisibilityRef.current === null) {
        chatFocusShellVisibilityRef.current = readWorkspaceShellVisible();
      }

      writeWorkspaceShellVisible(false);
      void releaseScreenOrientation();
      return;
    }

    if (chatFocusShellVisibilityRef.current !== null) {
      writeWorkspaceShellVisible(Boolean(chatFocusShellVisibilityRef.current));
      chatFocusShellVisibilityRef.current = null;
    }

    void releaseScreenOrientation();
  }, [isMobileChatFocus, isMobilePhoneMode]);

  useEffect(
    () => () => {
      if (chatFocusShellVisibilityRef.current !== null) {
        writeWorkspaceShellVisible(Boolean(chatFocusShellVisibilityRef.current));
        chatFocusShellVisibilityRef.current = null;
      }

      void releaseScreenOrientation();
    },
    []
  );

  const chatProblemId = isLearningMode
    ? `learning-${problemData?.titleSlug || problemData?.id || 'unknown'}`
    : isAIProblem
      ? `ai-${problemData?.id}`
      : problemData?.questionId;
  const hasRenderableProblemContent = Boolean(
    hasMeaningfulText(problemData?.content) ||
    hasMeaningfulText(problemData?.description) ||
    hasMeaningfulText(problemData?.constraints) ||
    (Array.isArray(problemData?.examples) && problemData.examples.length > 0)
  );
  const isMissingProblemDescription = Boolean(problemData) && !problemLoadError;
  const problemLoadErrorDetail = getOptionalInlineErrorDetail(problemLoadError);

  const problemFallbackCard = (
    <Flex
      minH="100%"
      align="center"
      justify="center"
      px={4}
      py={6}
      textAlign="center"
      data-tutorial="learning-problem-fallback"
    >
      <Box
        maxW="520px"
        border="1px solid var(--cg-window-dark)"
        boxShadow="var(--cg-window-inset)"
        bg="rgba(255,255,255,0.2)"
        px={5}
        py={4}
      >
        <Text
          color="var(--cg-text)"
          fontSize="sm"
          fontWeight="700"
          textTransform="uppercase"
          mb={2}
        >
          {problemLoadError
            ? 'Problem failed to load'
            : isMissingProblemDescription
              ? 'Problem description unavailable'
              : 'Loading problem brief...'}
        </Text>
        <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.7">
          {problemLoadError
            ? 'We could not fetch this problem content right now. Try refreshing the page or switching away and back to the Problem slot.'
            : isMissingProblemDescription
              ? 'This problem loaded, but its description content is empty or unreadable right now. Try refreshing, or open another problem while we fix the source content.'
              : 'Problem content is still being prepared. If this takes too long, try switching slots once or refreshing.'}
        </Text>
        {problemLoadErrorDetail && (
          <Text color="var(--cg-muted)" fontSize="xs" mt={3}>
            {problemLoadErrorDetail}
          </Text>
        )}
      </Box>
    </Flex>
  );

  const problemPane = (
    <WorkspacePaneWindow
      fileLabel="problem.md"
      statusLabel="Brief"
      data-tutorial="learning-problem-description"
      contentProps={{ overflowY: 'auto', css: WORKSPACE_SCROLLBAR_CSS }}
    >
      {hasRenderableProblemContent ? (
        <Box minH="100%" position="relative" p={4}>
          <ProblemDescription
            problemData={problemData}
            isHighRes={isHighRes}
            animationsEnabled={animationsEnabled}
            settings={settings}
            quality={quality}
          />
        </Box>
      ) : (
        problemFallbackCard
      )}
    </WorkspacePaneWindow>
  );

  const editorPane = (
    <WorkspacePaneWindow
      fileLabel={`editor.${language || 'txt'}`}
      statusLabel={mode || 'Workspace'}
      data-tutorial="learning-editor-area"
      contentProps={{ overflow: 'hidden', bg: 'rgba(255,255,255,0.12)' }}
    >
      <EditorPanel
        displayCode={code}
        language={language}
        onChange={(value) => {
          if (sessionStorage.getItem('editorInitializing')) {
            return;
          }

          onEditorChange(value);
        }}
        onLanguageChange={onLanguageChange}
        isExecuting={isExecuting}
        executionResult={executionResult}
        onRun={onRun}
        onRunOutput={onRunOutput}
        onSubmit={onSubmit}
        mode={mode}
        timer={timer}
        problemData={problemData}
        sessionSubmissions={sessionSubmissions}
        bestTime={bestTime}
        highScore={highScore}
        formatTime={formatTime}
        setMatrixBombActive={setMatrixBombActive}
        challengeState={challengeState}
        setCurrentLine={setCurrentLine}
        setEditor={setEditor}
        isHighRes={isHighRes}
        animationsEnabled={animationsEnabled}
        toggleAnimations={toggleAnimations}
        isChatVisible={isChatVisible}
        onToggleChatVisibility={onToggleChatVisibility}
        executionRateLimit={executionRateLimit}
        isLearningMode={isLearningMode}
        isLearningPathMode={isLearningPathMode}
        onResetLearningTutorial={onResetLearningTutorial}
        lockedLearningLanguage={lockedLearningLanguage}
        isMobilePhoneMode={isMobilePhoneMode}
      />
    </WorkspacePaneWindow>
  );

  const chatPane = (
    <WorkspacePaneWindow
      fileLabel="assistant.chat"
      statusLabel={isMobileChatFocus ? 'Focus' : 'Assist'}
      data-tutorial="learning-chat-area"
      contentProps={{
        overflow: 'hidden',
        display: 'flex',
        justifyContent: isMobileChatFocus ? 'center' : 'stretch',
        bg: 'rgba(255,255,255,0.12)',
      }}
    >
      <Box
        h="100%"
        w="100%"
        maxW={isMobileChatFocus ? MOBILE_CHAT_FOCUS_MAX_WIDTH : '100%'}
        borderLeft={isMobileChatFocus ? '1px solid var(--cg-window-dark)' : 'none'}
        borderRight={isMobileChatFocus ? '1px solid var(--cg-window-dark)' : 'none'}
      >
        <ChatPanel
          problemId={chatProblemId}
          onInputStart={onChatInput}
          isDisabled={challengeState.isAIDisabled}
          problemData={problemData}
          code={fullCode}
          executionResult={executionResult}
          isHighRes={isHighRes}
          animationsEnabled={animationsEnabled}
          settings={settings}
          quality={quality}
          isLearningMode={isLearningMode}
          isMobileChatFocus={isMobileChatFocus}
        />
      </Box>
    </WorkspacePaneWindow>
  );

  const activeMobilePanelContent =
    activeMobilePanel === MOBILE_PANELS.PROBLEM
      ? problemPane
      : activeMobilePanel === MOBILE_PANELS.CHAT && isChatVisible
        ? chatPane
        : editorPane;

  return (
    <PageTemplate showGiphyBackground>
      <Box
        width="100%"
        minHeight="calc(100vh - 110px)"
        height="calc(100vh - 110px)"
        position="relative"
        overflowX="hidden"
        overflowY="hidden"
        display="flex"
        flexDirection="column"
        marginBottom="-60px"
        className={isHighRes ? 'high-performance-mode' : ''}
        bg="linear-gradient(180deg, rgba(236, 233, 216, 0.28), rgba(212, 208, 200, 0.42))"
        sx={{
          '@media (max-height: 780px)': {
            minHeight: 'calc(100vh - 110px)',
            height: 'calc(100vh - 110px)',
          },
          '@media (max-height: 820px)': {
            height: 'auto',
            overflowY: 'auto',
            marginBottom: 0,
            paddingBottom: '60px',
          },
        }}
      >
        {animationsEnabled && settings.gridAnimation.enabled && (
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bgImage="linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
						linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)"
            bgSize="30px 30px"
            opacity={Math.min(settings.gridAnimation.opacity, 0.18)}
            sx={{
              '@keyframes scroll': {
                '0%': { backgroundPosition: '0 0' },
                '100%': { backgroundPosition: '30px 30px' },
              },
              animation: `scroll ${settings.gridAnimation.speed}s linear infinite`,
            }}
            pointerEvents="none"
            zIndex="0"
          />
        )}

        {animationsEnabled && settings.scanLineAnimation.enabled && (
          <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="2px"
            bg={`rgba(10, 56, 154, ${Math.min(settings.scanLineAnimation.opacity, 0.28)})`}
            boxShadow="none"
            sx={{
              animation: `${customScanLineAnimation} ${settings.scanLineAnimation.speed}s linear infinite`,
            }}
            pointerEvents="none"
            zIndex="1"
          />
        )}

        <Box
          width="100%"
          flex="1"
          minHeight="0"
          position="relative"
          zIndex="2"
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <Box className="cg-panel-window" overflow="hidden">
            <Flex
              className="cg-titlebar"
              px={3}
              py={2}
              align="center"
              justify="space-between"
              gap={3}
            >
              <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
                workspace.shell
              </Text>
              <Text fontSize="10px" fontWeight="700" textTransform="uppercase">
                {isAIProblem
                  ? 'AI problem'
                  : isLearningPathMode
                    ? 'Learning path'
                    : 'Interview problem'}
              </Text>
            </Flex>
            <Flex
              bg="rgba(255,255,255,0.14)"
              borderTop="1px solid var(--cg-window-dark)"
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              flexWrap="wrap"
              gap={3}
              px={3}
              py={3}
            >
              <Text color="var(--cg-text)" fontSize="sm" lineHeight="1.6">
                If the workspace breaks, send a structured report with the current problem context.
              </Text>
              <BugReportButton
                pageType={
                  isLearningPathMode
                    ? 'learning-problem-workspace'
                    : isAIProblem
                      ? 'ai-problem-workspace'
                      : 'problem-workspace'
                }
                pageContext={{
                  problemTitle:
                    problemData?.title ||
                    problemData?.questionTitle ||
                    problemData?.name ||
                    'Unknown',
                  problemSlug:
                    problemData?.titleSlug ||
                    problemData?.questionTitleSlug ||
                    problemData?.slug ||
                    problemData?.id ||
                    '',
                }}
                clientState={{
                  language,
                  mode,
                  sessionSubmissions,
                  isLearningMode,
                  isLearningPathMode,
                }}
                buttonProps={{
                  size: 'sm',
                  color: 'var(--cg-accent-red)',
                }}
              />
            </Flex>
          </Box>

          <Box
            flex="1"
            minHeight="0"
            display="flex"
            flexDirection="column"
            gap={2}
            sx={{
              '@media (max-height: 820px)': {
                minHeight: '620px',
              },
              '@media (max-height: 780px)': {
                minHeight: '500px',
              },
            }}
          >
            <Box
              flex="1"
              minHeight="0"
              sx={{
                '@media (max-height: 820px)': {
                  minHeight: '620px',
                },
                '@media (max-height: 780px)': {
                  minHeight: '500px',
                  paddingBottom: '12px',
                  overflowY: 'auto',
                },
              }}
            >
              {isMobilePhoneMode ? (
                <Box
                  h="100%"
                  minH="0"
                  display="flex"
                  flexDirection="column"
                  gap={isMobileChatFocus ? 1 : 2}
                >
                  {isMobileChatFocus ? (
                    <Flex
                      px={1}
                      py={1}
                      align="center"
                      justify="space-between"
                      gap={2}
                      border="1px solid var(--cg-window-dark)"
                      boxShadow="var(--cg-window-outset)"
                      bg="var(--cg-window-face)"
                    >
                      <Button
                        size="xs"
                        color="var(--cg-accent-blue)"
                        onClick={() => handleMobilePanelChange(MOBILE_PANELS.EDITOR)}
                        isDisabled={isPortraitChatExitLocked}
                      >
                        Back
                      </Button>
                      <Text
                        color="var(--cg-text)"
                        fontSize="xs"
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                        fontWeight="700"
                      >
                        AI Chat Focus
                      </Text>
                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          color="var(--cg-text)"
                          isDisabled={isPortraitChatExitLocked}
                          onClick={() => handleMobilePanelChange(MOBILE_PANELS.PROBLEM)}
                        >
                          Problem
                        </Button>
                        <Button
                          size="xs"
                          color="var(--cg-text)"
                          isDisabled={isPortraitChatExitLocked}
                          onClick={() => handleMobilePanelChange(MOBILE_PANELS.EDITOR)}
                        >
                          Editor
                        </Button>
                      </HStack>
                    </Flex>
                  ) : (
                    <Flex gap={2} flexWrap="wrap" px={1}>
                      <Button
                        size="sm"
                        color={
                          activeMobilePanel === MOBILE_PANELS.PROBLEM
                            ? 'var(--cg-accent-blue)'
                            : 'var(--cg-text)'
                        }
                        bg={
                          activeMobilePanel === MOBILE_PANELS.PROBLEM
                            ? 'var(--cg-window-face)'
                            : 'var(--cg-window)'
                        }
                        boxShadow={
                          activeMobilePanel === MOBILE_PANELS.PROBLEM
                            ? 'var(--cg-window-inset)'
                            : 'var(--cg-window-outset)'
                        }
                        border="1px solid var(--cg-window-shadow)"
                        onClick={() => handleMobilePanelChange(MOBILE_PANELS.PROBLEM)}
                      >
                        Problem
                      </Button>
                      <Button
                        size="sm"
                        color={
                          activeMobilePanel === MOBILE_PANELS.EDITOR
                            ? 'var(--cg-accent-blue)'
                            : 'var(--cg-text)'
                        }
                        bg={
                          activeMobilePanel === MOBILE_PANELS.EDITOR
                            ? 'var(--cg-window-face)'
                            : 'var(--cg-window)'
                        }
                        boxShadow={
                          activeMobilePanel === MOBILE_PANELS.EDITOR
                            ? 'var(--cg-window-inset)'
                            : 'var(--cg-window-outset)'
                        }
                        border="1px solid var(--cg-window-shadow)"
                        onClick={() => handleMobilePanelChange(MOBILE_PANELS.EDITOR)}
                      >
                        Editor
                      </Button>
                      {isChatVisible && (
                        <Button
                          size="sm"
                          color={
                            activeMobilePanel === MOBILE_PANELS.CHAT
                              ? 'var(--cg-accent-blue)'
                              : 'var(--cg-text)'
                          }
                          bg={
                            activeMobilePanel === MOBILE_PANELS.CHAT
                              ? 'var(--cg-window-face)'
                              : 'var(--cg-window)'
                          }
                          boxShadow={
                            activeMobilePanel === MOBILE_PANELS.CHAT
                              ? 'var(--cg-window-inset)'
                              : 'var(--cg-window-outset)'
                          }
                          border="1px solid var(--cg-window-shadow)"
                          onClick={() => handleMobilePanelChange(MOBILE_PANELS.CHAT)}
                        >
                          Chat
                        </Button>
                      )}
                    </Flex>
                  )}

                  <Box flex="1" minH="0" overflow="hidden">
                    {activeMobilePanelContent}
                  </Box>
                </Box>
              ) : (
                <PanelGroup
                  direction="horizontal"
                  className="problem-workspace-panel-group"
                  style={{
                    height: '100%',
                    minHeight: '540px',
                    paddingBottom: '8px',
                  }}
                >
                  <Panel defaultSize={70} minSize={40}>
                    <PanelGroup direction="horizontal">
                      <Panel defaultSize={35} minSize={20}>
                        {problemPane}
                      </Panel>

                      <PanelResizeHandle
                        className="panel-resize-handle"
                        style={{
                          width: '6px',
                          background: 'var(--cg-window-shadow)',
                          position: 'relative',
                          cursor: 'col-resize',
                          zIndex: 10,
                          touchAction: 'none',
                          userSelect: 'none',
                        }}
                      />

                      <Panel defaultSize={65} minSize={30}>
                        {editorPane}
                      </Panel>
                    </PanelGroup>
                  </Panel>

                  {isChatVisible && (
                    <>
                      <PanelResizeHandle
                        className="panel-resize-handle"
                        style={{
                          width: '6px',
                          background: 'var(--cg-window-shadow)',
                          position: 'relative',
                          cursor: 'col-resize',
                          zIndex: 10,
                          boxShadow: 'none',
                          touchAction: 'none',
                          userSelect: 'none',
                        }}
                      />

                      <Panel defaultSize={30} minSize={20}>
                        {chatPane}
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              )}
            </Box>
          </Box>

          <AdModal
            isOpen={showExecutionAdModal}
            onClose={handleExecutionAdModalClose}
            onAdComplete={handleExecutionAdComplete}
            title="Execution Boost"
            minViewMs={
              selectedExecutionAd?.minViewMs || executionAdOptions?.short?.minViewMs || 5000
            }
            ctaLabel={
              selectedExecutionAd
                ? `Unlock +${selectedExecutionAd.credits} Execution${selectedExecutionAd.credits > 1 ? 's' : ''}`
                : 'Select ad length to unlock executions'
            }
            footerText={
              executionRateLimit?.resetIn
                ? `Limit resets in ${Math.max(0, Math.floor(executionRateLimit.resetIn / 60))} minutes. Watching this ad adds extra executions now.`
                : 'Watching this ad adds extra code executions.'
            }
            processingText="Syncing sponsor link..."
            adTypeOptions={executionAdOptions}
            selectedAdType={selectedExecutionAdType}
            onAdTypeChange={setSelectedExecutionAdType}
            adTypeSelectionDisabled={isApplyingExecutionCredit}
            adTypeLabel="Select ad length (required to start the ad)"
            requireAdTypeSelection
            adTypeRequiredText="Choose an ad length to start the sponsor video."
            showSkipButton
            skipLabel="Maybe later"
            onSkip={handleExecutionAdModalClose}
          />

          <SuccessModal
            isOpen={isSuccessModalOpen}
            onClose={onCloseSuccessModal}
            problemData={problemData}
            isLearningMode={isLearningMode}
            learningNextNode={learningNextNode}
            onContinueLearning={onContinueLearning}
            onReturnToMap={onReturnToMap}
            onGuestSignupWallRequested={onGuestSignupWallRequested}
            timeSpent={timeSpent}
            finalScore={finalScore}
            hasNewHighScore={hasNewHighScore}
            hasNewBestTime={hasNewBestTime}
            aiUsageCount={aiUsageCount}
            sessionSubmissions={sessionSubmissions}
            xpSummary={xpSummary}
            xpAwards={xpAwards}
            levelUpInfo={levelUpInfo}
            dataPacketAward={dataPacketAward}
            onTryAnotherProblem={onTryAnotherProblem}
            clusterNavigation={clusterNavigation}
            nextProblem={nextProblem}
          />

          <ChallengeModal
            isOpen={isChallengeModalOpen}
            onClose={onCloseChallengeModal}
            problem={nextProblem}
            onConfirm={onConfirmChallenge}
          />
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default ProblemWorkspaceLayout;
