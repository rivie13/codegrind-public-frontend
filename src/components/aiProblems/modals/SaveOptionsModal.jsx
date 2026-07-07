import {
  Badge,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { FiArrowRight, FiPlus } from 'react-icons/fi';
import audioManager from '../../../utils/audio/AudioManager';
import audioService from '../../../utils/audio/AudioService';
import {
  buildProgressTransition,
  getProgressTransitionDuration,
  getXpNumbersForPercent,
} from '../../../utils/game/xpAnimation';
import { useMobileXpScroll } from '../../../hooks/useMobileXpScroll';
import DataPacketsEarnedBadge from '../../shared/DataPacketsEarnedBadge';
import { normalizeDataPacketsPayload } from '../../../utils/economy/dataPackets';
import SocialShareButtons from '../../shared/SocialShareButtons';
import XpProgressBar from '../../shared/XpProgressBar';

/**
 * Modal shown after a problem is successfully saved
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} props.title - Problem title
 * @param {string} props.problemNumber - Problem number/ID
 * @param {Object|null} props.xpSummary - XP summary after save
 * @param {Array} props.xpAwards - XP awards for this save
 * @param {Object|null} props.levelUpInfo - Level-up info if user leveled up
 * @param {Function} props.onGoToProblem - Handler for navigating to the problem list
 * @param {Function} props.onCreateAnother - Handler for creating another problem
 */
const SaveOptionsModal = ({
  isOpen,
  onClose,
  title,
  problemNumber,
  xpSummary,
  xpAwards,
  levelUpInfo,
  dataPacketAward,
  onGoToProblem,
  onCreateAnother,
}) => {
  const xpSectionRef = useRef(null);
  const safeAwards = Array.isArray(xpAwards) ? xpAwards : [];
  const totalXpGained = safeAwards.reduce((sum, award) => sum + (award?.amount || 0), 0);
  const resolvedDataPackets = normalizeDataPacketsPayload(dataPacketAward, {
    fallbackXpAmount: totalXpGained,
    fallbackIsExact: true,
  });
  const [showDataPacketsAward, setShowDataPacketsAward] = useState(false);
  const [animatedXpProgress, setAnimatedXpProgress] = useState(0);
  const [progressTransition, setProgressTransition] = useState('width 1.2s ease');
  const [xpDisplayMode, setXpDisplayMode] = useState('current');
  const [levelUpEmphasisActive, setLevelUpEmphasisActive] = useState(false);
  const previousXpIntoLevel = Number(levelUpInfo?.previousXpIntoLevel ?? 0);
  const previousXpToNextLevel = Number(levelUpInfo?.previousXpToNextLevel ?? 0);
  const hasLevelUp = Boolean(levelUpInfo?.newLevel && Number.isFinite(previousXpToNextLevel));
  const previousXpProgress =
    hasLevelUp && previousXpToNextLevel > 0
      ? Math.min(100, Math.round((previousXpIntoLevel / previousXpToNextLevel) * 100))
      : 0;
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(
    levelUpInfo?.previousLevel || xpSummary?.level || 1
  );
  const [displayRoleName, setDisplayRoleName] = useState(
    levelUpInfo?.previousRoleName || xpSummary?.roleName || 'Greenhorn'
  );
  const xpIntoLevel = Number(xpSummary?.xpIntoLevel ?? 0);
  const xpToNextLevel = Number(xpSummary?.xpToNextLevel ?? 0);
  const xpProgress =
    xpToNextLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)) : 0;
  const xpDisplay =
    hasLevelUp && xpDisplayMode === 'previous'
      ? {
          into: previousXpIntoLevel,
          toNext: previousXpToNextLevel,
          remaining: Math.max(0, previousXpToNextLevel - previousXpIntoLevel),
        }
      : {
          into: xpIntoLevel,
          toNext: xpToNextLevel,
          remaining: xpSummary ? Math.max(0, xpToNextLevel - xpIntoLevel) : null,
        };
  const animatedXpDisplay = getXpNumbersForPercent({
    percent: animatedXpProgress,
    toNext: xpDisplay.toNext,
    showRemaining: Boolean(xpSummary),
  });

  useMobileXpScroll(xpSectionRef, isOpen, totalXpGained, 300);

  const handleClose = () => {
    audioManager.stopAllSoundEffects();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    audioService.initialize();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !xpSummary) return;
    const timers = [];

    if (hasLevelUp) {
      setShowLevelUpCelebration(false);
      setDisplayLevel(levelUpInfo.previousLevel);
      setDisplayRoleName(levelUpInfo.previousRoleName || xpSummary.roleName || 'Greenhorn');
      setXpDisplayMode('previous');
    } else {
      setShowLevelUpCelebration(false);
      setDisplayLevel(xpSummary.level);
      setDisplayRoleName(xpSummary.roleName || 'Greenhorn');
      setXpDisplayMode('current');
    }

    if (hasLevelUp) {
      setProgressTransition(
        buildProgressTransition(
          getProgressTransitionDuration({ fromPercent: previousXpProgress, toPercent: 100 })
        )
      );
      setAnimatedXpProgress(previousXpProgress);
      timers.push(setTimeout(() => setAnimatedXpProgress(100), 140));
      timers.push(
        setTimeout(() => {
          setShowLevelUpCelebration(true);
          setDisplayLevel(levelUpInfo.newLevel);
          setDisplayRoleName(levelUpInfo.newRoleName || xpSummary.roleName || 'Greenhorn');
          setXpDisplayMode('current');
          setLevelUpEmphasisActive(true);
        }, 1450)
      );
      timers.push(setTimeout(() => setLevelUpEmphasisActive(false), 2550));
      timers.push(
        setTimeout(() => {
          setProgressTransition('none');
          setAnimatedXpProgress(0);
        }, 1850)
      );
      timers.push(
        setTimeout(() => {
          setProgressTransition(
            buildProgressTransition(
              getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
            )
          );
          setAnimatedXpProgress(xpProgress);
        }, 1950)
      );
    } else {
      setAnimatedXpProgress(0);
      setProgressTransition(
        buildProgressTransition(
          getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress })
        )
      );
      timers.push(setTimeout(() => setAnimatedXpProgress(xpProgress), 140));
    }

    if (xpProgress > 0) {
      audioManager.playSoundEffect('progress-bar');
    }
    return () => timers.forEach(clearTimeout);
  }, [hasLevelUp, isOpen, levelUpInfo, previousXpProgress, xpProgress, xpSummary]);

  useEffect(() => {
    if (!isOpen || !levelUpInfo?.newLevel) return;
    audioManager.playSoundEffect('level-up-begin');
    const endTimer = setTimeout(() => {
      audioManager.playSoundEffect('level-up-end');
    }, 300);
    const impactTimer = setTimeout(() => {
      audioManager.playSoundEffect('level-up-impact');
    }, 1100);
    return () => {
      clearTimeout(endTimer);
      clearTimeout(impactTimer);
    };
  }, [isOpen, levelUpInfo]);

  useEffect(() => {
    if (!isOpen || !resolvedDataPackets) {
      setShowDataPacketsAward(false);
      return undefined;
    }

    const phase2Duration = getProgressTransitionDuration({ fromPercent: 0, toPercent: xpProgress });
    const revealDelay = hasLevelUp ? 1950 + phase2Duration + 120 : 140 + phase2Duration + 120;

    setShowDataPacketsAward(false);
    const timer = setTimeout(() => setShowDataPacketsAward(true), revealDelay);
    return () => clearTimeout(timer);
  }, [hasLevelUp, isOpen, resolvedDataPackets, xpProgress]);

  const xpReasonLabels = {
    ai_problem_created: 'AI Problem Created',
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
    if (award?.metadata?.aiUsageCount === 0) {
      details.push('no AI assists');
    }
    return details.length > 0 ? details.join(' • ') : null;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay backdropFilter="blur(2px)" bg="rgba(9, 18, 34, 0.32)" />
      <ModalContent
        className="cg-panel-window"
        bg="#d4d0c8"
        color="#1f2430"
        borderRadius="0"
        overflow="hidden"
        maxWidth={{ base: '96vw', md: '550px' }}
        width={{ base: '96vw', md: '90%' }}
      >
        <ModalHeader
          className="cg-titlebar"
          color="#f5f7ff"
          fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
          py={2}
          px={{ base: 4, md: 6 }}
          fontSize="xs"
        >
          Problem Saved Successfully
        </ModalHeader>

        <ModalBody px={{ base: 4, md: 6 }} bg="#d4d0c8">
          <VStack align="start" spacing={{ base: 2, md: 3 }} py={2}>
            <Text
              fontWeight="700"
              fontSize="lg"
              color="#0a2c9a"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              width="100%"
              textAlign="center"
              pb={1}
              borderBottom="1px solid #7f7f7f"
              textTransform="uppercase"
              letterSpacing="0.08em"
            >
              {title}
            </Text>

            <Badge
              bg="#efebe7"
              color="#0a2c9a"
              border="1px solid #7f7f7f"
              boxShadow="var(--cg-window-inset)"
              borderRadius="0"
              px={3}
              py={1}
              fontSize="sm"
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              alignSelf="center"
            >
              Problem #{problemNumber}
            </Badge>

            <Text
              mt={2}
              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
              color="#1f2430"
              textAlign="center"
              width="100%"
            >
              Your problem has been saved. What would you like to do next?
            </Text>

            {(xpSummary || safeAwards.length > 0 || resolvedDataPackets) && (
              <Box
                ref={xpSectionRef}
                w="100%"
                order={{ base: -1, md: 0 }}
                mt={3}
                p={{ base: 3, md: 4 }}
                bg="#efebe7"
                borderRadius="0"
                border="2px solid #5d636e"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
              >
                <Text
                  fontWeight="700"
                  mb={3}
                  color="#0a2c9a"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={{ base: 'sm', md: 'sm' }}
                  textAlign="center"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  XP Sync Report
                </Text>
                <Text
                  color="#0f6f17"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontWeight="700"
                  textAlign="center"
                  fontSize={{ base: '2xl', md: 'xl' }}
                  mb={3}
                >
                  +{totalXpGained} XP
                </Text>
                <VStack spacing={3} align="stretch">
                  {xpSummary && (
                    <XpProgressBar
                      animatedXpProgress={animatedXpProgress}
                      progressTransition={progressTransition}
                      showLevelUpCelebration={showLevelUpCelebration}
                      levelUpEmphasisActive={levelUpEmphasisActive}
                      displayLevel={displayLevel}
                      displayRoleName={displayRoleName}
                      animatedXpDisplay={animatedXpDisplay}
                      newLevel={levelUpInfo?.newLevel}
                      newRoleName={levelUpInfo?.newRoleName}
                      roleChanged={Boolean(levelUpInfo?.roleChanged)}
                      totalXpGained={totalXpGained}
                      theme="retro-desktop"
                    />
                  )}

                  {safeAwards.length > 0 ? (
                    safeAwards.map((award, index) => {
                      const detailText = getAwardDetails(award);
                      return (
                        <VStack
                          key={`${award?.reason || 'xp'}-${index}`}
                          p={2}
                          bg="#d4d0c8"
                          border="1px solid #7f7f7f"
                          boxShadow="var(--cg-window-inset)"
                          spacing={0}
                          align="center"
                        >
                          <Text
                            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                            fontSize="sm"
                            color="#1f2430"
                            textAlign="center"
                          >
                            {xpReasonLabels[award?.reason] || award?.reason || 'XP Award'}: +
                            {award?.amount || 0} XP
                          </Text>
                          {detailText && (
                            <Text
                              fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                              fontSize="xs"
                              color="#4a5160"
                              textAlign="center"
                            >
                              {detailText}
                            </Text>
                          )}
                        </VStack>
                      );
                    })
                  ) : (
                    <Text
                      fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                      fontSize="sm"
                      color="#4a5160"
                      textAlign="center"
                    >
                      No XP awarded for this save.
                    </Text>
                  )}

                  {showDataPacketsAward && (
                    <Box mt={2}>
                      <DataPacketsEarnedBadge
                        dataPackets={resolvedDataPackets}
                        theme="retro-desktop"
                      />
                    </Box>
                  )}
                </VStack>
              </Box>
            )}

            <Box
              w="100%"
              mt={2}
              p={3}
              bg="#efebe7"
              borderRadius="0"
              border="2px solid #5d636e"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(64,64,64,0.22)"
            >
              <SocialShareButtons
                url={`${window.location.origin}/ai-problems/browse`}
                text={`I just created "${title || 'an AI problem'}" on CodeGrind! ⚡ #CodeGrind #coding`}
                label="Share your creation"
                surface="ai_problem_saved_success"
              />
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter
          bg="#d4d0c8"
          pt={4}
          px={{ base: 4, md: 6 }}
          display="flex"
          flexDirection={{ base: 'column', sm: 'row' }}
          justifyContent="center"
          alignItems="center"
          gap={3}
        >
          <Button
            bg="#d4d0c8"
            color="#0a2c9a"
            border="1px solid #7f7f7f"
            borderRadius="0"
            boxShadow="var(--cg-window-outset)"
            _hover={{ bg: '#efebe7', color: '#0a2c9a' }}
            _active={{ boxShadow: 'var(--cg-window-inset)', transform: 'translateY(1px)' }}
            mr={{ base: 0, sm: 5 }}
            leftIcon={<FiArrowRight />}
            onClick={onGoToProblem}
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.06em"
            minWidth="175px"
            width={{ base: '100%', sm: 'auto' }}
            px={4}
            py={2}
            fontSize="sm"
          >
            Go to Problems List
          </Button>

          <Button
            bg="#d4d0c8"
            color="#0f6f17"
            border="1px solid #7f7f7f"
            borderRadius="0"
            boxShadow="var(--cg-window-outset)"
            _hover={{ bg: '#efebe7', color: '#0f6f17' }}
            _active={{ boxShadow: 'var(--cg-window-inset)', transform: 'translateY(1px)' }}
            leftIcon={<FiPlus />}
            onClick={onCreateAnother}
            fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.06em"
            minWidth="175px"
            width={{ base: '100%', sm: 'auto' }}
            px={4}
            py={2}
            fontSize="sm"
          >
            Create Another Problem
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SaveOptionsModal;
