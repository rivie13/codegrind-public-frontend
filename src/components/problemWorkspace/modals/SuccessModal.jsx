import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChallengeModal from '../../modals/ChallengeModal';
import XpProgressBar from '../../shared/XpProgressBar';
import { formatTime } from '../utils/formatters';
import useXpLevelUpAnimation from '../../../hooks/animations/useXpLevelUpAnimation';
import { useAutoScrollIntoView } from '../../../hooks/useMobileXpScroll';
import audioManager from '../../../utils/audio/AudioManager';
import audioService from '../../../utils/audio/AudioService';
import { useAuth } from '../../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../../contexts/GuestProgressProvider';
import DataPacketsEarnedBadge from '../../shared/DataPacketsEarnedBadge';
import { normalizeDataPacketsPayload } from '../../../utils/economy/dataPackets';
import { resolveBrowseBackTarget } from '../../../utils/navigation/clusterNavigation';
import { getProgressTransitionDuration } from '../../../utils/game/xpAnimation';
import SocialShareButtons from '../../shared/SocialShareButtons';

/* levelUpPulse + levelUpEmphasis keyframes are now in XpProgressBar */

/**
 * Modal displayed after successful submission with cyberpunk theme
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} props.problemData - The problem data
 * @param {number} props.timeSpent - Time spent solving the problem in seconds
 * @param {number} props.finalScore - The final score
 * @param {boolean} props.hasNewHighScore - Whether a new high score was achieved
 * @param {boolean} props.hasNewBestTime - Whether a new best time was achieved
 * @param {number} props.aiUsageCount - Number of times AI assistance was used
 * @param {number} props.sessionSubmissions - Number of submissions in this session
 * @param {Function} props.onTryAnotherProblem - Function to try another problem
 * @param {Object} props.nextProblem - The next problem data
 * @param {Object|null} props.xpSummary - User XP summary after submission
 * @param {Array} props.xpAwards - XP awards granted for this submission
 * @param {Object|null} props.levelUpInfo - Level-up info if user leveled up
 * @param {boolean} props.isLearningMode - Whether this is a learning workspace
 * @param {Object|null} props.learningNextNode - Next learning node (if any)
 * @param {Function} props.onContinueLearning - Continue to next learning node
 * @param {Function} props.onReturnToMap - Return to learning map
 * @returns {JSX.Element} The success modal component
 */
const SuccessModal = ({
  isOpen,
  onClose,
  problemData,
  timeSpent,
  finalScore,
  hasNewHighScore,
  hasNewBestTime,
  aiUsageCount,
  sessionSubmissions,
  xpSummary: xpSummaryProp,
  xpAwards,
  levelUpInfo,
  dataPacketAward,
  onTryAnotherProblem: _onTryAnotherProblem,
  clusterNavigation = null,
  nextProblem,
  isLearningMode = false,
  learningNextNode = null,
  onContinueLearning,
  onReturnToMap,
  onGuestSignupWallRequested,
}) => {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [showDataPacketsAward, setShowDataPacketsAward] = useState(false);
  const xpSectionRef = useRef(null);
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  const auth = useAuth();
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const guestCtx = useGuestProgressCtx();

  const xpSummary = useMemo(() => {
    if (isAuthenticated || xpSummaryProp) return xpSummaryProp;
    return guestCtx?.xpSummary || null;
  }, [guestCtx?.xpSummary, isAuthenticated, xpSummaryProp]);

  const handleClose = () => {
    audioManager.stopAllSoundEffects();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    audioService.initialize();
  }, [isOpen]);

  const safeAwards = Array.isArray(xpAwards) ? xpAwards : [];
  const totalXpGained = safeAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
  const resolvedDataPackets = useMemo(
    () =>
      normalizeDataPacketsPayload(dataPacketAward, {
        fallbackXpAmount: totalXpGained,
        fallbackIsExact: !isAuthenticated,
      }),
    [dataPacketAward, isAuthenticated, totalXpGained]
  );
  const shouldRouteGuestToSignupWall =
    !isAuthenticated &&
    (isLearningMode
      ? Boolean(guestCtx?.isBeginnerTrialLocked || guestCtx?.hasReachedLearningProblemWall)
      : Boolean(guestCtx?.isProTrialLocked || guestCtx?.hasReachedClusterProblemWall));
  const previousXpIntoLevel = Number(levelUpInfo?.previousXpIntoLevel ?? 0);
  const previousXpToNextLevel = Number(levelUpInfo?.previousXpToNextLevel ?? 0);
  const hasLevelUp = Boolean(levelUpInfo?.newLevel && Number.isFinite(previousXpToNextLevel));
  const previousXpProgress =
    hasLevelUp && previousXpToNextLevel > 0
      ? Math.min(100, Math.round((previousXpIntoLevel / previousXpToNextLevel) * 100))
      : 0;
  const xpIntoLevel = Number(xpSummary?.xpIntoLevel ?? 0);
  const xpToNextLevel = Number(xpSummary?.xpToNextLevel ?? 0);
  const xpProgress =
    xpToNextLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)) : 0;
  const shouldAutoFocusXp =
    isOpen && Boolean(xpSummary || safeAwards.length > 0 || resolvedDataPackets);

  useAutoScrollIntoView(xpSectionRef, {
    isOpen,
    enabled: Boolean(xpSummary || safeAwards.length > 0 || resolvedDataPackets),
    delayMs: 300,
    repeatDelayMs: 420,
    block: 'center',
  });

  useEffect(() => {
    if (!isOpen || !resolvedDataPackets) {
      setShowDataPacketsAward(false);
      return undefined;
    }

    if (prefersReducedMotion) {
      setShowDataPacketsAward(true);
      return undefined;
    }

    const phase1Duration = hasLevelUp
      ? getProgressTransitionDuration({ fromPercent: previousXpProgress, toPercent: 100 })
      : 0;
    const phase2Duration = getProgressTransitionDuration({
      fromPercent: hasLevelUp ? 0 : 0,
      toPercent: xpProgress,
    });

    const revealDelay = hasLevelUp
      ? 1090 + phase1Duration + phase2Duration + 120
      : 140 + phase2Duration + 120;

    setShowDataPacketsAward(false);
    const timer = setTimeout(() => setShowDataPacketsAward(true), revealDelay);
    return () => clearTimeout(timer);
  }, [
    hasLevelUp,
    isOpen,
    prefersReducedMotion,
    previousXpProgress,
    resolvedDataPackets,
    xpProgress,
  ]);

  // Shared XP animation hook (handles sound + visual FX choreography)
  const {
    animatedXpProgress,
    progressTransition,
    showLevelUpCelebration,
    levelUpEmphasisActive,
    displayLevel,
    displayRoleName,
    barFullGlow,
    barFlashActive,
    barShakeActive,
    animatedXpDisplay,
  } = useXpLevelUpAnimation({
    isOpen,
    hasLevelUp,
    previousXpProgress,
    xpProgress,
    previousLevel: levelUpInfo?.previousLevel || xpSummary?.level || 1,
    previousRoleName: levelUpInfo?.previousRoleName || xpSummary?.roleName || 'Greenhorn',
    newLevel: levelUpInfo?.newLevel || xpSummary?.level || 1,
    newRoleName: levelUpInfo?.newRoleName || xpSummary?.roleName || 'Greenhorn',
    roleChanged: Boolean(levelUpInfo?.roleChanged),
    xpGained: totalXpGained,
    prefersReducedMotion,
    previousXpIntoLevel,
    previousXpToNextLevel,
    currentXpIntoLevel: xpIntoLevel,
    currentXpToNextLevel: xpToNextLevel,
    currentXpRemaining: xpSummary ? Math.max(0, xpToNextLevel - xpIntoLevel) : null,
    hasXpData: Boolean(xpSummary),
  });

  const xpReasonLabels = {
    problem_solve: 'Problem Solve',
    problem_solve_repeat: 'Repeat Solve (25%)',
    ai_solve: 'AI Solve',
    ai_solve_repeat: 'Repeat AI Solve (25%)',
    daily_solve_bonus: 'Daily Solve Bonus',
    tower_defense_win: 'Tower Defense Win',
    tower_defense_repeat: 'Repeat Win (25%)',
    first_solve_ever: 'First Solve Ever',
    first_solve_day: 'First Solve of Day',
    daily_streak_bonus: 'Daily Streak Bonus',
    first_solve_easy: 'First Easy Solve',
    first_solve_medium: 'First Medium Solve',
    first_solve_hard: 'First Hard Solve',
    first_try_solve: 'First Try Solve',
    no_ai_assist: 'No AI Assist Bonus',
    speed_bonus: 'Speed Bonus',
    daily_challenge_complete: 'Daily Challenge Complete',
    weekly_challenge_complete: 'Weekly Challenge Complete',
    comeback_bonus: 'Comeback Bonus',
    perfect_run: 'Perfect Run',
    learning_path_node_complete: 'Learning Activity Complete',
    learning_path_node_repeat: 'Learning Activity Repeat',
  };

  const getAwardDetails = (award) => {
    if (!award) return null;
    const details = [];
    if (Number.isFinite(award?.multiplier) && award.multiplier !== 1) {
      details.push(`x${award.multiplier}`);
    }
    if (award?.isRepeat) {
      details.push('repeat');
    }
    if (award?.metadata?.streak) {
      details.push(`streak ${award.metadata.streak}`);
    }
    if (award?.metadata?.firstSolve) {
      details.push('first solve');
    }
    if (award?.metadata?.difficulty) {
      details.push(award.metadata.difficulty);
    }
    if (Number.isFinite(award?.metadata?.timeSeconds)) {
      details.push(`${award.metadata.timeSeconds}s`);
    }
    if (Number.isFinite(award?.metadata?.daysAway)) {
      details.push(`${award.metadata.daysAway}d away`);
    }
    if (award?.metadata?.weekStart) {
      details.push(`week of ${award.metadata.weekStart}`);
    }
    if (award?.metadata?.nodeTitle) {
      details.push(award.metadata.nodeTitle);
    } else if (award?.metadata?.nodeType) {
      details.push(award.metadata.nodeType);
    }
    if (award?.metadata?.aiUsageCount === 0) {
      details.push('no AI assists');
    }
    return details.length > 0 ? details.join(' • ') : null;
  };

  const resolvedTargetId =
    problemData?.questionFrontendId ||
    problemData?.questionId ||
    problemData?.displayNumber ||
    problemData?.metadata?.frontendQuestionId ||
    problemData?.id ||
    problemData?.titleSlug ||
    'UNASSIGNED';

  // Check if we're on an AI problem page
  const isAIProblem = window.location.pathname.includes('/ai-problems/');
  const backToBrowseTarget = useMemo(
    () =>
      resolveBrowseBackTarget({
        clusterNavigation,
        fallbackPath: isAIProblem ? '/ai-problems/browse' : '/problems',
        fallbackLabel: isAIProblem ? 'Back to AI Problem List' : 'Back to Problem List',
      }),
    [clusterNavigation, isAIProblem]
  );

  // Helper function to check if a problem is an AI problem
  const isAIProblemType = (problem) => {
    return (
      problem?.source === 'AI' ||
      Boolean(problem?.functionName) ||
      (problem?.questionFrontendId && String(problem.questionFrontendId).startsWith('AI-'))
    );
  };

  // Handle navigation to next problem
  const handleNavigateWithRefresh = (titleSlug, state = {}) => {
    // Store the navigation state in sessionStorage
    sessionStorage.setItem('navigationState', JSON.stringify(state));

    // Navigate to the appropriate problem path - stay in same structure as current problem
    if (isAIProblem) {
      navigate(`/ai-problems/${titleSlug}`, { state });
    } else {
      navigate(`/problems/${titleSlug}`, { state });
    }
  };

  // Handle mode selection
  const handleModeSelect = (mode) => {
    if (shouldRouteGuestToSignupWall && onGuestSignupWallRequested) {
      onGuestSignupWallRequested?.();
      return;
    }

    if (mode === 'challenge' && nextProblem) {
      setIsChallengeModalOpen(true);
    } else if (nextProblem) {
      const nextProblemSlug = nextProblem?.titleSlug || nextProblem?.slug;
      if (!nextProblemSlug) {
        goToProblemList();
        return;
      }

      // Check if the NEXT problem is an AI problem
      const isNextProblemAI = isAIProblemType(nextProblem);

      handleNavigateWithRefresh(nextProblemSlug, {
        mode: mode,
        isNextProblemAI: isNextProblemAI, // Use next problem type, not current
        ...(clusterNavigation ? { clusterNavigation } : {}),
      });
    } else {
      // If no next problem, go to the appropriate list
      navigate(backToBrowseTarget.path);
    }
  };

  // Handle challenge confirmation
  const handleChallengeConfirm = (challenges) => {
    setIsChallengeModalOpen(false);
    if (shouldRouteGuestToSignupWall && onGuestSignupWallRequested) {
      onGuestSignupWallRequested?.();
      return;
    }

    if (nextProblem) {
      const nextProblemSlug = nextProblem?.titleSlug || nextProblem?.slug;
      if (!nextProblemSlug) {
        goToProblemList();
        return;
      }

      // Check if the NEXT problem is an AI problem
      const isNextProblemAI = isAIProblemType(nextProblem);

      handleNavigateWithRefresh(nextProblemSlug, {
        mode: 'challenge',
        challenges,
        isNextProblemAI: isNextProblemAI, // Use next problem type, not current
        ...(clusterNavigation ? { clusterNavigation } : {}),
      });
    }
  };

  // Go to problem list based on current problem type
  const goToProblemList = () => {
    navigate(backToBrowseTarget.path);
  };

  const retroSectionBoxProps = {
    p: { base: 3, md: 4 },
    bg: '#efebe7',
    borderRadius: '0',
    border: '2px solid #5d636e',
    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)',
  };

  const retroSummaryRowProps = {
    p: 2,
    bg: '#d4d0c8',
    borderRadius: '0',
    border: '1px solid #7f7f7f',
    boxShadow: 'var(--cg-window-inset)',
  };

  const retroSectionTitleProps = {
    fontSize: { base: 'sm', md: 'md' },
    fontWeight: '700',
    color: '#0a2c9a',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  const createRetroButtonProps = (toneColor) => ({
    bg: '#d4d0c8',
    color: toneColor,
    border: '1px solid #7f7f7f',
    borderRadius: '0',
    boxShadow: 'var(--cg-window-outset)',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    _hover: {
      bg: '#efebe7',
      color: toneColor,
    },
    _active: {
      boxShadow: 'var(--cg-window-inset)',
      transform: 'translateY(1px)',
    },
  });

  if (isLearningMode) {
    const nextLabel = learningNextNode?.label || learningNextNode?.title || null;
    const hasNextNode = Boolean(nextLabel);

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="lg"
        initialFocusRef={shouldAutoFocusXp ? xpSectionRef : undefined}
      >
        <ModalOverlay backdropFilter="blur(2px)" bg="rgba(9, 18, 34, 0.32)" />
        <ModalContent
          className="cg-panel-window"
          bg="#d4d0c8"
          borderRadius="0"
          color="#1f2430"
          overflow="hidden"
          maxW={{ base: '96vw', md: '620px' }}
        >
          <ModalHeader className="cg-titlebar" py={2} px={{ base: 3, md: 4 }}>
            <Text
              color="#f5f7ff"
              fontSize="xs"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              textTransform="uppercase"
              fontWeight="700"
              letterSpacing="0.08em"
              textAlign="center"
            >
              lesson_complete.exe
            </Text>
          </ModalHeader>

          <ModalBody px={{ base: 3, md: 6 }} bg="#d4d0c8">
            <VStack spacing={{ base: 3, md: 4 }} align="stretch" py={{ base: 2, md: 3 }}>
              <Box {...retroSectionBoxProps}>
                <Text
                  fontSize="lg"
                  fontWeight="700"
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {problemData?.title || 'Learning Step'}
                </Text>
                <Text
                  mt={2}
                  color="#1f2430"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize="sm"
                >
                  Nice work! You cleared this workspace step.
                </Text>
                {hasNextNode ? (
                  <Text
                    mt={3}
                    color="#0f6f17"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="sm"
                  >
                    Next up: {nextLabel}
                  </Text>
                ) : (
                  <Text
                    mt={3}
                    color="#4a5160"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize="sm"
                  >
                    No next module yet — you’re at the end of the current path.
                  </Text>
                )}
              </Box>

              {(xpSummary || safeAwards.length > 0 || resolvedDataPackets) && (
                <Box
                  ref={xpSectionRef}
                  tabIndex={-1}
                  order={{ base: -1, md: 0 }}
                  scrollMarginTop="12px"
                  {...retroSectionBoxProps}
                >
                  <Text
                    {...retroSectionTitleProps}
                    mb={2}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    XP Sync Report:
                  </Text>
                  <Text
                    color="#0f6f17"
                    fontWeight="700"
                    fontSize={{ base: 'xl', md: 'lg' }}
                    textAlign={{ base: 'center', md: 'left' }}
                    mb={3}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    +{totalXpGained} XP
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {xpSummary && (
                      <XpProgressBar
                        animatedXpProgress={animatedXpProgress}
                        progressTransition={progressTransition}
                        barFullGlow={barFullGlow}
                        barFlashActive={barFlashActive}
                        barShakeActive={barShakeActive}
                        showLevelUpCelebration={showLevelUpCelebration}
                        levelUpEmphasisActive={levelUpEmphasisActive}
                        displayLevel={displayLevel}
                        displayRoleName={displayRoleName}
                        animatedXpDisplay={animatedXpDisplay}
                        newLevel={levelUpInfo?.newLevel}
                        newRoleName={levelUpInfo?.newRoleName}
                        roleChanged={Boolean(levelUpInfo?.roleChanged)}
                        totalXpGained={totalXpGained}
                        prefersReducedMotion={prefersReducedMotion}
                        theme="retro-desktop"
                      />
                    )}

                    {safeAwards.length > 0 ? (
                      safeAwards.map((award, index) => {
                        const detailText = getAwardDetails(award);
                        return (
                          <HStack
                            key={`${award?.reason || 'xp'}-${index}`}
                            justify="space-between"
                            align={{ base: 'flex-start', sm: 'center' }}
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={{ base: 1, sm: 2 }}
                            {...retroSummaryRowProps}
                          >
                            <VStack align="start" spacing={0}>
                              <Text
                                color="#1f2430"
                                fontSize="sm"
                                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              >
                                {xpReasonLabels[award?.reason] || award?.reason || 'XP Award'}
                              </Text>
                              {detailText && (
                                <Text
                                  color="#4a5160"
                                  fontSize="xs"
                                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                                >
                                  {detailText}
                                </Text>
                              )}
                            </VStack>
                            <Text
                              color="#0f6f17"
                              fontWeight="700"
                              fontSize="sm"
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            >
                              +{award?.amount || 0} XP
                            </Text>
                          </HStack>
                        );
                      })
                    ) : (
                      <Text
                        color="#4a5160"
                        fontSize="xs"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      >
                        No XP awarded for this run.
                      </Text>
                    )}
                  </VStack>

                  {showDataPacketsAward && (
                    <Box mt={3}>
                      <DataPacketsEarnedBadge
                        dataPackets={resolvedDataPackets}
                        theme="retro-desktop"
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Social share */}
              <Box {...retroSectionBoxProps} p={3} textAlign="center">
                <SocialShareButtons
                  url={window.location.href}
                  text={`I just completed "${problemData?.title || 'a lesson'}" on CodeGrind! 🎓 #CodeGrind #coding`}
                  label="Share your win"
                  surface="learning_workspace_success"
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter
            bg="#d4d0c8"
            justifyContent="center"
            gap={3}
            py={3}
            flexDirection={{ base: 'column', sm: 'row' }}
          >
            <Button
              {...createRetroButtonProps('#0a2c9a')}
              onClick={onReturnToMap || handleClose}
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              Back to Map
            </Button>
            <Button
              {...createRetroButtonProps('#0f6f17')}
              onClick={
                shouldRouteGuestToSignupWall && onGuestSignupWallRequested
                  ? onGuestSignupWallRequested
                  : onContinueLearning || handleClose
              }
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              {hasNextNode ? 'Continue' : 'Back to Map'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        size="lg"
        initialFocusRef={shouldAutoFocusXp ? xpSectionRef : undefined}
      >
        <ModalOverlay backdropFilter="blur(2px)" bg="rgba(9, 18, 34, 0.32)" />
        <ModalContent
          className="cg-panel-window"
          bg="#d4d0c8"
          borderRadius="0"
          color="#1f2430"
          overflow="hidden"
          maxW={{ base: '96vw', md: '680px' }}
        >
          <ModalHeader className="cg-titlebar" py={2} px={{ base: 3, md: 4 }}>
            <Text
              color="#f5f7ff"
              fontSize="xs"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              textTransform="uppercase"
              letterSpacing="0.08em"
              fontWeight="700"
              textAlign="center"
            >
              mission_accomplished.exe
            </Text>
          </ModalHeader>

          <ModalBody px={{ base: 3, md: 6 }} bg="#d4d0c8">
            <VStack spacing={{ base: 3, md: 4 }} align="stretch" py={{ base: 2, md: 3 }}>
              <Box {...retroSectionBoxProps}>
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="700"
                  mb={2}
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {problemData?.title}
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge
                    bg="#dfe8d5"
                    color="#285d2f"
                    border="1px solid #7f7f7f"
                    borderRadius="0"
                    px={2}
                    py={0.5}
                    fontSize="xs"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {problemData?.difficulty}
                  </Badge>
                  <Badge
                    bg="#efe6d4"
                    color="#7c4914"
                    border="1px solid #7f7f7f"
                    borderRadius="0"
                    px={2}
                    py={0.5}
                    fontSize="xs"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    ID: {resolvedTargetId}
                  </Badge>
                </HStack>
              </Box>

              <Box {...retroSectionBoxProps}>
                <Text {...retroSectionTitleProps} mb={3}>
                  Performance Matrix:
                </Text>
                <VStack spacing={3} align="stretch">
                  <HStack
                    justify="space-between"
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={{ base: 1, sm: 2 }}
                    {...retroSummaryRowProps}
                  >
                    <Text
                      color="#1f2430"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      Time:
                    </Text>
                    <Text
                      fontWeight="700"
                      color={hasNewBestTime ? '#0a2c9a' : '#1f2430'}
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      {formatTime(timeSpent)} {hasNewBestTime && '⚡ NEW RECORD'}
                    </Text>
                  </HStack>
                  <HStack
                    justify="space-between"
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={{ base: 1, sm: 2 }}
                    {...retroSummaryRowProps}
                  >
                    <Text
                      color="#1f2430"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      Score:
                    </Text>
                    <Text
                      fontWeight="700"
                      color={hasNewHighScore ? '#7c4914' : '#1f2430'}
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      {finalScore} {hasNewHighScore && '🎯 NEW HIGH'}
                    </Text>
                  </HStack>
                  <HStack
                    justify="space-between"
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={{ base: 1, sm: 2 }}
                    {...retroSummaryRowProps}
                  >
                    <Text
                      color="#1f2430"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      Submissions:
                    </Text>
                    <Text
                      color="#0a2c9a"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      {sessionSubmissions}
                    </Text>
                  </HStack>
                  <HStack
                    justify="space-between"
                    align={{ base: 'flex-start', sm: 'center' }}
                    direction={{ base: 'column', sm: 'row' }}
                    spacing={{ base: 1, sm: 2 }}
                    {...retroSummaryRowProps}
                  >
                    <Text
                      color="#1f2430"
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      AI Assists:
                    </Text>
                    <Text
                      color={aiUsageCount > 0 ? '#8f1f1f' : '#0a2c9a'}
                      fontSize="sm"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      {aiUsageCount} {aiUsageCount > 0 ? `(-${aiUsageCount * 25} pts)` : ''}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              {(xpSummary || safeAwards.length > 0 || resolvedDataPackets) && (
                <Box
                  ref={xpSectionRef}
                  tabIndex={-1}
                  order={{ base: -1, md: 0 }}
                  scrollMarginTop="12px"
                  {...retroSectionBoxProps}
                >
                  <Text
                    {...retroSectionTitleProps}
                    mb={2}
                    textAlign={{ base: 'center', md: 'left' }}
                  >
                    XP Sync Report:
                  </Text>
                  <Text
                    color="#0f6f17"
                    fontWeight="700"
                    fontSize={{ base: 'xl', md: 'lg' }}
                    textAlign={{ base: 'center', md: 'left' }}
                    mb={3}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    +{totalXpGained} XP
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {xpSummary && (
                      <XpProgressBar
                        animatedXpProgress={animatedXpProgress}
                        progressTransition={progressTransition}
                        barFullGlow={barFullGlow}
                        barFlashActive={barFlashActive}
                        barShakeActive={barShakeActive}
                        showLevelUpCelebration={showLevelUpCelebration}
                        levelUpEmphasisActive={levelUpEmphasisActive}
                        displayLevel={displayLevel}
                        displayRoleName={displayRoleName}
                        animatedXpDisplay={animatedXpDisplay}
                        newLevel={levelUpInfo?.newLevel}
                        newRoleName={levelUpInfo?.newRoleName}
                        roleChanged={Boolean(levelUpInfo?.roleChanged)}
                        totalXpGained={totalXpGained}
                        prefersReducedMotion={prefersReducedMotion}
                        theme="retro-desktop"
                      />
                    )}

                    {safeAwards.length > 0 ? (
                      safeAwards.map((award, index) => {
                        const detailText = getAwardDetails(award);
                        return (
                          <HStack
                            key={`${award?.reason || 'xp'}-${index}`}
                            justify="space-between"
                            align={{ base: 'flex-start', sm: 'center' }}
                            direction={{ base: 'column', sm: 'row' }}
                            spacing={{ base: 1, sm: 2 }}
                            {...retroSummaryRowProps}
                          >
                            <VStack align="start" spacing={0}>
                              <Text
                                color="#1f2430"
                                fontSize="sm"
                                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              >
                                {xpReasonLabels[award?.reason] || award?.reason || 'XP Award'}
                              </Text>
                              {detailText && (
                                <Text
                                  color="#4a5160"
                                  fontSize="xs"
                                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                                >
                                  {detailText}
                                </Text>
                              )}
                            </VStack>
                            <Text
                              color="#0f6f17"
                              fontWeight="700"
                              fontSize="sm"
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            >
                              +{award?.amount || 0} XP
                            </Text>
                          </HStack>
                        );
                      })
                    ) : (
                      <Text
                        color="#4a5160"
                        fontSize="xs"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      >
                        No XP awarded for this run.
                      </Text>
                    )}
                  </VStack>

                  {showDataPacketsAward && (
                    <Box mt={3}>
                      <DataPacketsEarnedBadge
                        dataPackets={resolvedDataPackets}
                        theme="retro-desktop"
                      />
                    </Box>
                  )}
                </Box>
              )}

              {nextProblem && (
                <Box {...retroSectionBoxProps}>
                  <Text {...retroSectionTitleProps} mb={3}>
                    Next Mission Available:
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <HStack {...retroSummaryRowProps} spacing={2} flexWrap="wrap">
                      <Text
                        fontWeight="700"
                        color="#0f6f17"
                        fontSize="sm"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      >
                        {nextProblem.title}
                      </Text>
                      <Badge
                        bg="#dfe8d5"
                        color="#285d2f"
                        border="1px solid #7f7f7f"
                        borderRadius="0"
                        px={2}
                        fontSize="xs"
                        fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      >
                        {nextProblem.difficulty}
                      </Badge>
                    </HStack>

                    <Text
                      fontSize="xs"
                      color="#4a5160"
                      mb={2}
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    >
                      Select mode:
                    </Text>

                    <Flex gap={2} flexWrap="wrap" direction={{ base: 'column', sm: 'row' }}>
                      <Button
                        {...createRetroButtonProps('#0f6f17')}
                        onClick={() => handleModeSelect('practice')}
                        size="xs"
                        w={{ base: '100%', sm: 'auto' }}
                      >
                        Free Play
                      </Button>
                      <Button
                        {...createRetroButtonProps('#0a2c9a')}
                        onClick={() => handleModeSelect('ranked')}
                        size="xs"
                        w={{ base: '100%', sm: 'auto' }}
                      >
                        Ranked
                      </Button>
                      <Button
                        {...createRetroButtonProps('#7c4914')}
                        onClick={() => handleModeSelect('challenge')}
                        size="xs"
                        w={{ base: '100%', sm: 'auto' }}
                      >
                        Challenge
                      </Button>
                    </Flex>
                  </VStack>
                </Box>
              )}

              {/* Social share */}
              <Box {...retroSectionBoxProps} p={3} textAlign="center">
                <SocialShareButtons
                  url={`${window.location.origin}/problems/${problemData?.titleSlug || ''}`}
                  text={`I just solved "${problemData?.title || 'a problem'}" (${problemData?.difficulty || ''}) on CodeGrind! 🎯 Try it yourself! #CodeGrind #coding`}
                  label="Share your solve"
                  surface="problem_workspace_success"
                />
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter
            bg="#d4d0c8"
            justifyContent="center"
            gap={3}
            py={3}
            flexDirection={{ base: 'column', sm: 'row' }}
          >
            <Button
              {...createRetroButtonProps('#0a2c9a')}
              onClick={handleClose}
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              Close Terminal
            </Button>
            <Button
              {...createRetroButtonProps('#0f6f17')}
              onClick={goToProblemList}
              size="sm"
              w={{ base: '100%', sm: 'auto' }}
            >
              {backToBrowseTarget.label}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Challenge Modal for selecting challenges */}
      <ChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        problem={nextProblem}
        onConfirm={handleChallengeConfirm}
      />
    </>
  );
};

export default SuccessModal;
