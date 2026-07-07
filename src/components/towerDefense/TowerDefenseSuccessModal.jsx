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
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaHeart,
  FaHome,
  FaListUl,
  FaMapMarkedAlt,
  FaRedoAlt,
  FaTrophy,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import XpProgressBar from '../shared/XpProgressBar';
import { api } from '../../services/api';
import useXpLevelUpAnimation from '../../hooks/animations/useXpLevelUpAnimation';
import { useAutoScrollIntoView } from '../../hooks/useMobileXpScroll';
import audioManager from '../../utils/audio/AudioManager';
import audioService from '../../utils/audio/AudioService';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../utils/assets/towerDefenseAssetUrls';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestProgressCtx } from '../../contexts/GuestProgressProvider';
import DataPacketsEarnedBadge from '../shared/DataPacketsEarnedBadge';
import { normalizeDataPacketsPayload } from '../../utils/economy/dataPackets';
import {
  getNextClusterSlug,
  resolveBrowseBackTarget,
  TD_CLUSTER_NAVIGATION_STORAGE_KEY,
} from '../../utils/navigation/clusterNavigation';
import { getProgressTransitionDuration } from '../../utils/game/xpAnimation';
import SocialShareButtons from '../shared/SocialShareButtons';

/**
 * Success modal for Tower Defense game victory
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} props.gameStats - Game statistics object
 * @param {Object} props.problemData - The problem data
 * @returns {JSX.Element} The tower defense success modal component
 */
const TowerDefenseSuccessModal = ({
  isOpen,
  onClose,
  gameStats = {},
  problemData,
  problemListRoute = '/games/tower-defense',
  nextProblemRouteBase = '/games/tower-defense',
  onEnterEndlessMode,
  isLearningMode = false,
  learningNextNode = null,
  onContinueLearning,
  onReturnToMap,
  clusterNavigation = null,
  onGuestSignupWallRequested,
}) => {
  const navigate = useNavigate();
  const xpSectionRef = useRef(null);
  const [showDataPacketsAward, setShowDataPacketsAward] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const auth = useAuth();
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const guestCtx = useGuestProgressCtx();

  // Handle null gameStats by providing a fallback object
  const safeGameStats = gameStats || {};
  const {
    score = 0, // Use 'score' instead of 'finalScore' based on the game logic
    finalScore = 0, // Keep as fallback
    timeSpent = 0,
    formattedTime = '00:00',
    finalCredits = 0,
    finalLives = 0,
    codeSubmissionSuccess = false,
    hasNewHighScore = false,
    hasNewBestTime = false,
    xp: xpPayload = null,
  } = safeGameStats;

  const xpSummary = useMemo(() => {
    const payloadSummary = xpPayload?.summary || null;
    if (isAuthenticated || payloadSummary) return payloadSummary;
    return guestCtx?.xpSummary || null;
  }, [guestCtx?.xpSummary, isAuthenticated, xpPayload?.summary]);
  const levelUpInfo = xpPayload?.levelUp || null;
  const xpAwards = Array.isArray(xpPayload?.awards) ? xpPayload.awards : [];
  const totalXpGained = xpAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
  const dataPacketsPayload = useMemo(
    () =>
      normalizeDataPacketsPayload(safeGameStats?.dataPackets, {
        fallbackXpAmount: totalXpGained,
        fallbackIsExact: !isAuthenticated,
      }),
    [isAuthenticated, safeGameStats?.dataPackets, totalXpGained]
  );
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
    isOpen && Boolean(xpSummary || xpAwards.length > 0 || dataPacketsPayload);

  useAutoScrollIntoView(xpSectionRef, {
    isOpen,
    enabled: Boolean(xpSummary || xpAwards.length > 0 || dataPacketsPayload),
    delayMs: 300,
    repeatDelayMs: 420,
    block: 'center',
  });

  useEffect(() => {
    if (!isOpen || !dataPacketsPayload) {
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
    const phase2Duration = getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress });

    const revealDelay = hasLevelUp
      ? 1090 + phase1Duration + phase2Duration + 120
      : 140 + phase2Duration + 120;

    setShowDataPacketsAward(false);
    const timer = setTimeout(() => setShowDataPacketsAward(true), revealDelay);
    return () => clearTimeout(timer);
  }, [
    dataPacketsPayload,
    hasLevelUp,
    isOpen,
    prefersReducedMotion,
    previousXpProgress,
    xpProgress,
  ]);

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
      details.push('first win');
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

  // Calculate the breach score using the same logic as GameEventManager
  const calculateBreachScore = () => {
    // If we already have a score, use it
    if (score > 0) return score;
    if (finalScore > 0) return finalScore;

    // Otherwise calculate it using the same formula as the victory screen
    const timeBonus = Math.floor(1000 - timeSpent / 10);
    const livesScore = finalLives * 100;
    const creditsScore = Math.floor(finalCredits * 0.5);
    const solutionBonus = codeSubmissionSuccess ? 5000 : 0;
    return livesScore + creditsScore + timeBonus + solutionBonus;
  };

  const breachScore = calculateBreachScore();

  // Handle navigation to different areas
  const handlePlayAgain = () => {
    // Simply reload the page to restart the game
    window.location.reload();
  };

  const backToBrowseTarget = useMemo(
    () =>
      resolveBrowseBackTarget({
        clusterNavigation,
        fallbackPath: problemListRoute,
      }),
    [clusterNavigation, problemListRoute]
  );

  const handleBackToSelection = () => {
    navigate(backToBrowseTarget.path);
  };

  const handleBackToLeaderboards = () => {
    navigate('/leaderboards');
  };

  const handleClose = () => {
    audioManager.stopAllSoundEffects();
    onClose();
  };

  const learningNextLabel = learningNextNode?.label || learningNextNode?.title || null;
  const shouldRouteGuestToSignupWall =
    !isAuthenticated &&
    (isLearningMode
      ? Boolean(guestCtx?.isBeginnerTrialLocked || guestCtx?.hasReachedLearningProblemWall)
      : Boolean(guestCtx?.isProTrialLocked || guestCtx?.hasReachedClusterProblemWall));
  const resolvedTargetId =
    problemData?.questionFrontendId ||
    problemData?.questionId ||
    problemData?.displayNumber ||
    problemData?.metadata?.frontendQuestionId ||
    problemData?.id ||
    problemData?.titleSlug ||
    'UNASSIGNED';

  useEffect(() => {
    if (!isOpen) return;
    audioService.initialize();
  }, [isOpen]);

  // Handle next problem navigation
  const handleNextProblem = async () => {
    if (!problemData) return;

    if (shouldRouteGuestToSignupWall && onGuestSignupWallRequested) {
      onGuestSignupWallRequested?.();
      return;
    }

    const activeProblemSlug = problemData?.titleSlug || problemData?.slug;

    const clusterNextSlug = getNextClusterSlug(clusterNavigation, activeProblemSlug);
    if (clusterNextSlug) {
      const targetUrl = `${nextProblemRouteBase}/${clusterNextSlug}`;
      sessionStorage.setItem(
        TD_CLUSTER_NAVIGATION_STORAGE_KEY,
        JSON.stringify({ clusterNavigation })
      );
      window.location.href = targetUrl;
      return;
    }

    try {
      let nextProblem;

      // Check if this is an AI problem or regular LeetCode/CODEGRIND problem
      const isAIProblem =
        problemData.source === 'AI' ||
        (Boolean(problemData.functionName) && problemData.source !== 'CODEGRIND') ||
        (problemData.questionFrontendId &&
          String(problemData.questionFrontendId).startsWith('AI-'));

      if (isAIProblem) {
        // For AI problems, use the AI problems API
        nextProblem = await api.aiProblems.getNextProblem(
          problemData.id,
          problemData.displayNumber
        );
      } else {
        // For LeetCode problems, use the regular problems API
        const nextLookupToken =
          problemData.questionId ||
          problemData.questionFrontendId ||
          problemData?.metadata?.frontendQuestionId ||
          problemData.titleSlug ||
          problemData.id;

        if (!nextLookupToken) {
          throw new Error('Unable to resolve next-problem lookup token');
        }

        nextProblem = await api.problems.getNextProblem(nextLookupToken);
      }

      if (nextProblem && !nextProblem.error) {
        const nextProblemSlug = nextProblem?.titleSlug || nextProblem?.slug;
        if (!nextProblemSlug) {
          throw new Error('Missing next-problem slug in response');
        }

        const targetUrl = `${nextProblemRouteBase}/${nextProblemSlug}`;

        //console.log('[DEBUG] Tower Defense - Navigating to:', targetUrl);
        //console.log('[DEBUG] Next problem:', nextProblem.title);

        // Force a page reload to ensure proper initialization
        window.location.href = targetUrl;
      } else {
        // If no next problem, show a message and go back to selection
        alert('Congratulations! You have completed all available problems!');
        handleBackToSelection();
      }
    } catch (error) {
      console.error('Error fetching next problem:', error);
      // On error, just go back to selection
      handleBackToSelection();
    }
  };

  const sectionBoxProps = {
    p: { base: 3, md: 4 },
    bg: '#efebe7',
    borderRadius: '0',
    border: '2px solid #5d636e',
    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)',
  };

  const summaryRowProps = {
    p: 3,
    bg: '#d4d0c8',
    borderRadius: '0',
    border: '2px solid #7f7f7f',
    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.68), inset -1px -1px 0 rgba(64,64,64,0.22)',
  };

  const sectionTitleProps = {
    fontSize: { base: 'sm', md: 'md' },
    fontWeight: '700',
    color: '#0a2c9a',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  const createBadgeProps = (tone) => ({
    bg: '#d4d0c8',
    color: tone,
    border: '1px solid #5d636e',
    borderRadius: '0',
    px: 3,
    py: 1,
    fontSize: 'xs',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  });

  const createRetroButtonProps = (toneColor) => ({
    bgImage: `url(${RETRO_WINDOW_BUTTON_ASSET})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '100% 100%',
    bg: '#d4d0c8',
    color: toneColor,
    border: '1px solid rgba(31, 36, 48, 0.35)',
    borderRadius: '0',
    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
    fontWeight: '700',
    boxShadow: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    _hover: {
      bgImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
      transform: 'translateY(1px)',
      bg: '#d4d0c8',
    },
    _active: {
      bgImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
      transform: 'translateY(1px)',
      bg: '#d4d0c8',
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      closeOnOverlayClick={false}
      initialFocusRef={shouldAutoFocusXp ? xpSectionRef : undefined}
    >
      <ModalOverlay backdropFilter="blur(2px)" bg="rgba(9, 18, 34, 0.32)" />
      <ModalContent
        className="cg-panel-window"
        bg="#d4d0c8"
        borderRadius="0"
        color="#1f2430"
        overflow="hidden"
        maxW={{ base: '96vw', md: '82vw', xl: '920px' }}
        mx="auto"
      >
        <ModalHeader className="cg-titlebar" py={2} px={{ base: 3, md: 4 }}>
          <Flex align="center" justify="space-between" gap={3}>
            <HStack spacing={2} minW={0}>
              <FaCheckCircle />
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              >
                mission_complete.exe
              </Text>
            </HStack>
            <Text
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.08em"
              textTransform="uppercase"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            >
              Tower Defense
            </Text>
          </Flex>
        </ModalHeader>

        <ModalBody py={{ base: 3, md: 4 }} px={{ base: 3, md: 6 }} bg="#d4d0c8">
          <VStack spacing={{ base: 3, md: 4 }} align="stretch">
            <Box {...sectionBoxProps}>
              <Text
                fontSize={{ base: 'lg', md: '2xl' }}
                fontWeight="700"
                color="#0a2c9a"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                textTransform="uppercase"
                letterSpacing="0.1em"
                mb={1}
              >
                Mission Complete
              </Text>
              <Text
                color="#1f2430"
                fontSize={{ base: 'sm', md: 'md' }}
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                lineHeight="1.6"
              >
                The defense grid held, the target file is cleared, and your workspace is ready for
                the next run.
              </Text>
            </Box>

            {(xpSummary || xpAwards.length > 0 || dataPacketsPayload) && (
              <Box
                ref={xpSectionRef}
                tabIndex={-1}
                order={{ base: -1, md: 0 }}
                scrollMarginTop="12px"
                {...sectionBoxProps}
              >
                <Text {...sectionTitleProps} mb={2} textAlign={{ base: 'center', md: 'left' }}>
                  XP Sync Report
                </Text>
                <Text
                  color="#0f6f17"
                  fontWeight="bold"
                  fontSize={{ base: '2xl', md: 'xl' }}
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

                  {xpAwards.length > 0 ? (
                    xpAwards.map((award, index) => {
                      const detailText = getAwardDetails(award);
                      return (
                        <HStack
                          key={`${award?.reason || 'xp'}-${index}`}
                          justify="space-between"
                          align={{ base: 'flex-start', sm: 'center' }}
                          direction={{ base: 'column', sm: 'row' }}
                          spacing={{ base: 1, sm: 2 }}
                          p={2}
                          bg="#d4d0c8"
                          borderRadius="0"
                          border="1px solid #7f7f7f"
                        >
                          <VStack align="start" spacing={0}>
                            <Text
                              color="#1f2430"
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              fontSize="sm"
                              fontWeight="700"
                            >
                              {xpReasonLabels[award?.reason] || award?.reason || 'XP Award'}
                            </Text>
                            {detailText && (
                              <Text
                                color="#4f5665"
                                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                                fontSize="xs"
                              >
                                {detailText}
                              </Text>
                            )}
                          </VStack>
                          <Text
                            color="#0f6f17"
                            fontWeight="bold"
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            fontSize="sm"
                          >
                            +{award?.amount || 0} XP
                          </Text>
                        </HStack>
                      );
                    })
                  ) : (
                    <Text
                      color="#4f5665"
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      fontSize="xs"
                    >
                      No XP awarded for this run.
                    </Text>
                  )}

                  {showDataPacketsAward && (
                    <Box mt={3}>
                      <DataPacketsEarnedBadge
                        dataPackets={dataPacketsPayload}
                        theme="retro-desktop"
                      />
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            {/* Problem Info Section */}
            <Box {...sectionBoxProps}>
              <Text {...sectionTitleProps} mb={3}>
                Mission File
              </Text>
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="bold"
                mb={3}
                color="#1f2430"
                fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              >
                {problemData?.title || 'Unlisted Mission'}
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Badge {...createBadgeProps('#0f6f17')}>
                  Difficulty: {problemData?.difficulty?.toUpperCase()}
                </Badge>
                <Badge {...createBadgeProps('#0a2c9a')}>Target ID: {resolvedTargetId}</Badge>
                <Badge {...createBadgeProps(codeSubmissionSuccess ? '#0f6f17' : '#6f5600')}>
                  Result: {codeSubmissionSuccess ? 'Verified' : 'Needs Review'}
                </Badge>
              </HStack>
            </Box>

            {/* Performance Matrix */}
            <Box {...sectionBoxProps}>
              <Text {...sectionTitleProps} mb={4}>
                Run Summary
              </Text>
              <VStack spacing={3} align="stretch">
                <HStack
                  {...summaryRowProps}
                  justify="space-between"
                  align={{ base: 'flex-start', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={{ base: 1, sm: 2 }}
                >
                  <HStack spacing={2} color="#1f2430">
                    <FaClock color="#0a2c9a" />
                    <Text fontFamily="'Tahoma', 'MS Sans Serif', sans-serif" fontSize="md">
                      Clear Time
                    </Text>
                  </HStack>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color={hasNewBestTime ? '#0f6f17' : '#0a2c9a'}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {formattedTime} {hasNewBestTime && '• New Record'}
                  </Text>
                </HStack>

                <HStack
                  {...summaryRowProps}
                  justify="space-between"
                  align={{ base: 'flex-start', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={{ base: 1, sm: 2 }}
                >
                  <HStack spacing={2} color="#1f2430">
                    <FaTrophy color="#6f5600" />
                    <Text fontFamily="'Tahoma', 'MS Sans Serif', sans-serif" fontSize="md">
                      Score
                    </Text>
                  </HStack>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color={hasNewHighScore ? '#8f1f1f' : '#0a2c9a'}
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {breachScore.toLocaleString()} {hasNewHighScore && '• New High'}
                  </Text>
                </HStack>

                <HStack
                  {...summaryRowProps}
                  justify="space-between"
                  align={{ base: 'flex-start', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={{ base: 1, sm: 2 }}
                >
                  <HStack spacing={2} color="#1f2430">
                    <FaCoins color="#6f5600" />
                    <Text fontFamily="'Tahoma', 'MS Sans Serif', sans-serif" fontSize="md">
                      Credits Earned
                    </Text>
                  </HStack>
                  <Text
                    color="#0f6f17"
                    fontWeight="bold"
                    fontSize="md"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {finalCredits.toLocaleString()}
                  </Text>
                </HStack>

                <HStack
                  {...summaryRowProps}
                  justify="space-between"
                  align={{ base: 'flex-start', sm: 'center' }}
                  direction={{ base: 'column', sm: 'row' }}
                  spacing={{ base: 1, sm: 2 }}
                >
                  <HStack spacing={2} color="#1f2430">
                    <FaHeart color={finalLives > 0 ? '#8f1f1f' : '#7f7f7f'} />
                    <Text fontFamily="'Tahoma', 'MS Sans Serif', sans-serif" fontSize="md">
                      Lives Remaining
                    </Text>
                  </HStack>
                  <Text
                    color={finalLives > 0 ? '#0f6f17' : '#8f1f1f'}
                    fontWeight="bold"
                    fontSize="md"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  >
                    {finalLives}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            {/* Achievement Messages */}
            <Box {...sectionBoxProps}>
              <Text {...sectionTitleProps} mb={3}>
                Status Notes
              </Text>
              <VStack spacing={2} align="stretch">
                <Text
                  color="#0f6f17"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  • Base integrity maintained throughout the run.
                </Text>
                <Text
                  color="#0f6f17"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  • Problem file archived to the cleared queue.
                </Text>
                <Text
                  color="#0f6f17"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  • Tower system payout posted to your session log.
                </Text>
                {codeSubmissionSuccess && (
                  <Text
                    color="#0a2c9a"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize={{ base: 'sm', md: 'md' }}
                  >
                    • Algorithm verification passed cleanly.
                  </Text>
                )}
                <Text
                  color="#8f1f1f"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={{ base: 'sm', md: 'md' }}
                  fontWeight="bold"
                >
                  • Ready for the next mission.
                </Text>
              </VStack>
            </Box>

            {/* Social share */}
            <Box
              p={3}
              bg="#efebe7"
              borderRadius="0"
              border="2px solid #5d636e"
              textAlign="center"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
            >
              <SocialShareButtons
                url={`${window.location.origin}/games/tower-defense`}
                text={`Just breached the corporate datafort on "${problemData?.title || 'a mission'}" in Tower Defense on CodeGrind! 🎮 #CodeGrind`}
                label="Share this clear"
                surface="tower_defense_success"
                theme="retro-desktop"
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="2px solid #5d636e"
          justifyContent="center"
          gap={3}
          py={4}
          flexWrap="wrap"
          flexDirection={{ base: 'column', md: 'row' }}
          bg="#d4d0c8"
        >
          {isLearningMode ? (
            <>
              <Button
                leftIcon={<FaMapMarkedAlt />}
                onClick={onReturnToMap || handleClose}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="160px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#0a2c9a')}
              >
                Back To Map
              </Button>
              <Button
                leftIcon={<FaArrowRight />}
                onClick={onContinueLearning || handleClose}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="180px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#0f6f17')}
              >
                {learningNextLabel ? `Continue: ${learningNextLabel}` : 'Continue'}
              </Button>
            </>
          ) : (
            <>
              <Button
                leftIcon={<FaRedoAlt />}
                onClick={handlePlayAgain}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="160px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#0f6f17')}
              >
                Restart Mission
              </Button>

              {onEnterEndlessMode && (
                <Button
                  leftIcon={<FaTrophy />}
                  onClick={onEnterEndlessMode}
                  px={5}
                  py={3}
                  fontSize="sm"
                  whiteSpace="nowrap"
                  minW="180px"
                  height="48px"
                  w={{ base: '100%', md: 'auto' }}
                  {...createRetroButtonProps('#0a2c9a')}
                >
                  Endless Mode
                </Button>
              )}

              <Button
                leftIcon={<FaArrowRight />}
                onClick={handleNextProblem}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="160px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#0a2c9a')}
              >
                Next Target
              </Button>

              <Button
                leftIcon={<FaListUl />}
                onClick={handleBackToSelection}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="170px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#6f5600')}
              >
                {backToBrowseTarget.label}
              </Button>

              <Button
                leftIcon={<FaHome />}
                onClick={handleBackToLeaderboards}
                px={5}
                py={3}
                fontSize="sm"
                whiteSpace="nowrap"
                minW="170px"
                height="48px"
                w={{ base: '100%', md: 'auto' }}
                {...createRetroButtonProps('#8f1f1f')}
              >
                View Leaderboards
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TowerDefenseSuccessModal;
