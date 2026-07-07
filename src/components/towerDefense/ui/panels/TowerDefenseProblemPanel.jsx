/**
 * TowerDefenseProblemPanel
 *
 * Embedded panel version of the ProblemDrawer content.
 * Displays problem description, examples, and constraints in the cyberpunk style.
 * Used in the V2 slottable layout system.
 */

import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Flex, Heading, List, ListIcon, ListItem, Progress, Text } from '@chakra-ui/react';
import React, { useEffect, useMemo, useRef } from 'react';
import { FaShieldAlt, FaTerminal } from 'react-icons/fa';
import MarkdownMessage from '../../../chat/MarkdownMessage';
import {
  RETRO_DESKTOP_BADGE_ASSET,
  RETRO_PROGRESS_FILL_ASSET,
  RETRO_WINDOW_BASE_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';

const stripHtmlTags = (html) => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '');
};

const slugToTitle = (slug) => {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
};

const getClassicReferenceName = (problem, problemDescription) => {
  const directName =
    problemDescription?.metadata?.referenceName ||
    problemDescription?.metaData?.referenceName ||
    problem?.metadata?.referenceName ||
    problem?.metaData?.referenceName ||
    problemDescription?.referenceName ||
    problem?.referenceName ||
    null;

  if (directName) return directName;

  const referenceSlug =
    problemDescription?.metadata?.referenceSlug ||
    problemDescription?.metaData?.referenceSlug ||
    problem?.metadata?.referenceSlug ||
    problem?.metaData?.referenceSlug ||
    problemDescription?.referenceSlug ||
    problem?.referenceSlug ||
    null;

  return slugToTitle(referenceSlug);
};

const parseAIProblemExamples = (examples) => {
  if (!examples || examples.length === 0) return [];

  try {
    if (Array.isArray(examples) && typeof examples[0] === 'object' && examples[0].input) {
      return examples;
    }

    let parsedExamples;
    try {
      parsedExamples = Array.isArray(examples) ? examples : JSON.parse(examples);
    } catch {
      parsedExamples = [examples];
    }

    return parsedExamples.map((example) => {
      if (typeof example !== 'string') return example;

      const inputMatch = example.match(
        /<strong>Input:<\/strong>\s*(.*?)(?:<br>|,<br>|<\/p>|<strong>)/i
      );
      const outputMatch = example.match(
        /<strong>Output:<\/strong>\s*(.*?)(?:<br>|,<br>|<\/p>|<strong>)/i
      );
      const explanationMatch = example.match(/<strong>Explanation:<\/strong>\s*(.*?)(?:<\/p>|$)/i);

      if (!inputMatch && !outputMatch) {
        const inputAltMatch = example.match(/Input:?\s*(.*?)(?:Output|$)/i);
        const outputAltMatch = example.match(/Output:?\s*(.*?)(?:Explanation|$)/i);
        const explanationAltMatch = example.match(/Explanation:?\s*(.*?)$/i);

        return {
          input: inputAltMatch ? stripHtmlTags(inputAltMatch[1]).trim() : '',
          output: outputAltMatch ? stripHtmlTags(outputAltMatch[1]).trim() : '',
          explanation: explanationAltMatch ? stripHtmlTags(explanationAltMatch[1]).trim() : '',
        };
      }

      return {
        input: inputMatch ? stripHtmlTags(inputMatch[1]).trim() : '',
        output: outputMatch ? stripHtmlTags(outputMatch[1]).trim() : '',
        explanation: explanationMatch ? stripHtmlTags(explanationMatch[1]).trim() : '',
      };
    });
  } catch (error) {
    console.error('Error parsing problem examples:', error);
    if (typeof examples === 'string') {
      return [
        {
          input: 'Could not parse',
          output: 'Could not parse',
          explanation: stripHtmlTags(examples),
        },
      ];
    }
    return [];
  }
};

const formatExampleValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildLearningFallbackExamples = (problem) => {
  const outputs = Array.isArray(problem?.expectedOutputs) ? problem.expectedOutputs : [];
  const inputs = Array.isArray(problem?.testCases) ? problem.testCases : [];

  if (!outputs.length) return [];

  return outputs.map((output, idx) => {
    const inputValue = inputs[idx];
    const hasInput = Array.isArray(inputValue) ? inputValue.length > 0 : Boolean(inputValue);
    return {
      input: hasInput ? formatExampleValue(inputValue) : '',
      output: formatExampleValue(output),
      explanation: '',
    };
  });
};

const getBreachProgress = ({ currentWave = 1, totalWaves = 5, isMissionComplete = false }) => {
  const parsedTotalWaves = Number(totalWaves);
  const safeTotalWaves =
    Number.isFinite(parsedTotalWaves) && parsedTotalWaves > 0 ? parsedTotalWaves : 1;

  if (isMissionComplete) {
    return 100;
  }

  const parsedCurrentWave = Number(currentWave);
  const safeCurrentWave =
    Number.isFinite(parsedCurrentWave) && parsedCurrentWave > 0 ? parsedCurrentWave : 1;
  const completedWaves = Math.min(Math.max(safeCurrentWave - 1, 0), safeTotalWaves);

  return Math.round((completedWaves / safeTotalWaves) * 100);
};

const TowerDefenseProblemPanel = ({
  problem,
  problemDescription,
  currentWave = 1,
  totalWaves = 5,
  isMissionComplete = false,
  isDemo = false,
  shellTheme = 'default',
  compactMobileLayout = false,
  onScrollStateChange = null,
  tutorialOverlay = null,
  children,
}) => {
  const parseExamplesFunc = parseAIProblemExamples;
  const scrollContainerRef = useRef(null);
  const hasProblemLoaded = Boolean(problem || problemDescription);
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const uiFontFamily = isRetroDesktopTheme
    ? "'Share Tech Mono', 'JetBrains Mono', monospace"
    : "'Orbitron', sans-serif";
  const contentPadding = compactMobileLayout ? 3 : 4;
  const insetPanelPadding = compactMobileLayout ? 2.5 : 3;
  const sectionSpacing = compactMobileLayout ? 3 : 4;
  const retroInsetPanelProps = isRetroDesktopTheme
    ? {
        bg: '#f4efe6',
        borderRadius: '0',
        border: '2px solid #232730',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
      }
    : null;

  const displayTitle = problemDescription?.title || problem?.title || 'Tower Defense Hack';
  const classicReferenceName = getClassicReferenceName(problem, problemDescription);
  const hackingContext =
    problemDescription?.hackingContext || 'Breach the system by building a tower defense solution.';
  const isLearningProblem = problem?.source === 'LEARNING' || problem?.isLearningProblem;
  const baseExamples =
    problemDescription?.examples?.length > 0
      ? problemDescription.examples.some((example) => typeof example === 'string')
        ? parseExamplesFunc(problemDescription.examples)
        : problemDescription.examples
      : parseExamplesFunc(problem?.examples);
  const hasMeaningfulExample =
    Array.isArray(baseExamples) &&
    baseExamples.some((example) => {
      if (!example) return false;
      if (typeof example === 'string') return example.trim().length > 0;
      return Boolean(example.input || example.output || example.explanation);
    });
  const examplesToRender = hasMeaningfulExample
    ? baseExamples
    : isLearningProblem
      ? buildLearningFallbackExamples(problem)
      : baseExamples;
  const breachProgress = getBreachProgress({ currentWave, totalWaves, isMissionComplete });
  const tutorialOverlayNode = useMemo(() => {
    if (!tutorialOverlay?.isVisible) return null;

    const isCompactOverlayLayout = Boolean(tutorialOverlay?.isCompactMobileLayout);

    return (
      <Box
        position={isCompactOverlayLayout ? 'absolute' : { base: 'relative', md: 'sticky' }}
        top={isCompactOverlayLayout ? '48px' : { base: 'auto', md: '74px' }}
        left={isCompactOverlayLayout ? 0 : undefined}
        right={isCompactOverlayLayout ? 0 : undefined}
        zIndex={3}
        px={{ base: 2, md: 4 }}
        pt={isCompactOverlayLayout ? 2 : { base: 2, md: 4 }}
        pb={isCompactOverlayLayout ? 0 : { base: 1, md: 2 }}
        pointerEvents="none"
      >
        <Box
          borderRadius={isRetroDesktopTheme ? '0' : 'xl'}
          border={isRetroDesktopTheme ? '2px solid #232730' : '1px solid rgba(0, 255, 255, 0.42)'}
          bg={
            isRetroDesktopTheme
              ? '#f4efe6'
              : 'linear-gradient(180deg, rgba(2, 18, 34, 0.9) 0%, rgba(2, 10, 22, 0.78) 100%)'
          }
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
              : '0 0 34px rgba(0, 255, 255, 0.2), inset 0 0 30px rgba(0, 255, 255, 0.08)'
          }
          backdropFilter={isRetroDesktopTheme ? undefined : 'blur(8px)'}
          px={isCompactOverlayLayout ? 2.5 : { base: 3, md: 5 }}
          py={isCompactOverlayLayout ? 2 : { base: 3, md: 4 }}
          opacity={tutorialOverlay.isDismissed ? 0 : 1}
          transform={tutorialOverlay.isDismissed ? 'translateY(-12px)' : 'translateY(0)'}
          transition="opacity 0.22s ease, transform 0.22s ease"
          sx={
            isRetroDesktopTheme
              ? undefined
              : {
                  animation: tutorialOverlay.isDismissed
                    ? 'none'
                    : 'tdReadFocusPulse 1.7s ease-in-out infinite',
                  '@keyframes tdReadFocusPulse': {
                    '0%, 100%': {
                      boxShadow:
                        '0 0 26px rgba(0, 255, 255, 0.16), inset 0 0 22px rgba(0, 255, 255, 0.05)',
                      borderColor: 'rgba(0, 255, 255, 0.42)',
                    },
                    '50%': {
                      boxShadow:
                        '0 0 46px rgba(0, 255, 255, 0.28), inset 0 0 32px rgba(0, 255, 255, 0.1)',
                      borderColor: 'rgba(120, 255, 220, 0.78)',
                    },
                  },
                }
          }
        >
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap={isCompactOverlayLayout ? 2 : { base: 3, md: 4 }}
          >
            <Box>
              <Text
                color={isRetroDesktopTheme ? '#0b2ba8' : '#00f5c4'}
                fontSize="xs"
                fontFamily={uiFontFamily}
                letterSpacing="0.14em"
                textTransform="uppercase"
                mb={1}
              >
                Read Me
              </Text>
              <Text
                color={isRetroDesktopTheme ? '#1f2128' : '#f3fbff'}
                fontSize={isCompactOverlayLayout ? '11px' : { base: 'xs', md: 'md' }}
                fontWeight="bold"
                fontFamily={uiFontFamily}
                letterSpacing="0.03em"
                textTransform="uppercase"
              >
                Scroll this mission brief before continuing.
              </Text>
              <Text
                mt={1.5}
                color={isRetroDesktopTheme ? '#434855' : 'rgba(214, 248, 255, 0.82)'}
                fontSize={{ base: '2xs', md: 'xs' }}
                maxW="560px"
                lineHeight={{ base: '1.45', md: '1.6' }}
                display={isCompactOverlayLayout ? 'none' : undefined}
              >
                Read the task, example, and requirements in this panel. The continue button stays
                locked until you scroll through the brief.
              </Text>
            </Box>

            <Flex
              direction="column"
              align="center"
              color={isRetroDesktopTheme ? '#0b2ba8' : '#00e5ff'}
              minW={isCompactOverlayLayout ? '36px' : { base: '40px', md: '52px' }}
              sx={{
                animation: tutorialOverlay.isDismissed
                  ? 'none'
                  : 'tdBriefBounce 1.4s ease-in-out infinite',
                '@keyframes tdBriefBounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(8px)' },
                },
              }}
            >
              <ChevronDownIcon boxSize={isCompactOverlayLayout ? 5 : { base: 6, md: 9 }} />
              <Text
                fontSize={isCompactOverlayLayout ? '9px' : '2xs'}
                fontFamily={uiFontFamily}
                letterSpacing="0.12em"
              >
                SCROLL
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
  }, [isRetroDesktopTheme, tutorialOverlay, uiFontFamily]);

  const handlePanelScroll = (event) => {
    if (typeof onScrollStateChange !== 'function') return;

    const currentTarget = event.currentTarget;
    const maxScroll = Math.max(
      0,
      (currentTarget.scrollHeight || 0) - (currentTarget.clientHeight || 0)
    );
    const currentScroll = Math.max(0, currentTarget.scrollTop || 0);
    const progress = maxScroll > 0 ? currentScroll / maxScroll : 1;

    onScrollStateChange({
      progress,
      hasScrollableOverflow: maxScroll > 32,
      hasScrolled: currentScroll > 24,
      currentScrollPx: currentScroll,
      reachedBottom: maxScroll <= 32 || currentScroll >= maxScroll - 24,
      source: 'scroll',
    });
  };

  useEffect(() => {
    if (typeof onScrollStateChange !== 'function') return;

    const currentTarget = scrollContainerRef.current;
    if (!currentTarget) return;

    const maxScroll = Math.max(
      0,
      (currentTarget.scrollHeight || 0) - (currentTarget.clientHeight || 0)
    );
    const currentScroll = Math.max(0, currentTarget.scrollTop || 0);
    const progress = maxScroll > 0 ? currentScroll / maxScroll : 1;

    onScrollStateChange({
      progress,
      hasScrollableOverflow: maxScroll > 32,
      hasScrolled: currentScroll > 24,
      currentScrollPx: currentScroll,
      reachedBottom: maxScroll <= 32 || currentScroll >= maxScroll - 24,
      source: 'mount',
    });
  }, [onScrollStateChange, problem, problemDescription, tutorialOverlay?.isVisible]);

  if (!hasProblemLoaded) {
    return (
      <Flex
        h="100%"
        align="center"
        justify="center"
        direction="column"
        bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 10, 20, 0.8)'}
        p={6}
        border={isRetroDesktopTheme ? '2px solid #232730' : undefined}
      >
        <Box
          color={isRetroDesktopTheme ? '#0b2ba8' : 'cyan.500'}
          mb={4}
          p={4}
          borderRadius={isRetroDesktopTheme ? '0' : 'full'}
          bg={isRetroDesktopTheme ? '#f4efe6' : 'rgba(0, 200, 255, 0.1)'}
          border={isRetroDesktopTheme ? '2px solid #232730' : '1px solid rgba(0, 200, 255, 0.3)'}
        >
          <FaTerminal size={32} />
        </Box>
        <Text
          color={isRetroDesktopTheme ? '#1f2128' : 'cyan.300'}
          fontFamily={uiFontFamily}
          textAlign="center"
          mb={2}
        >
          {isDemo ? 'DEMO MODE ACTIVE' : 'NO MISSION LOADED'}
        </Text>
        <Text color={isRetroDesktopTheme ? '#3f4550' : 'gray.500'} fontSize="sm" textAlign="center">
          {isDemo
            ? 'Practice your tower defense skills!'
            : 'Select a problem to view mission briefing'}
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={scrollContainerRef}
      flex="1"
      minH="0"
      overflowY="auto"
      bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 10, 20, 0.8)'}
      bgImage={isRetroDesktopTheme ? `url(${RETRO_WINDOW_BASE_ASSET})` : undefined}
      bgRepeat={isRetroDesktopTheme ? 'repeat' : undefined}
      position="relative"
      onScroll={handlePanelScroll}
      sx={{
        scrollbarWidth: 'thin',
        scrollbarColor: isRetroDesktopTheme ? '#8e8e8e #c9c4ba' : '#00ccff #0a0a1a',
        '&::-webkit-scrollbar': {
          width: '8px',
          background: isRetroDesktopTheme ? '#c9c4ba' : '#0a0a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isRetroDesktopTheme ? '#8e8e8e' : '#00ccff',
          borderRadius: isRetroDesktopTheme ? '0' : '8px',
        },
      }}
    >
      {/* Header */}
      <Box
        p={0}
        borderBottom={isRetroDesktopTheme ? '2px solid #10131c' : '1px solid'}
        borderColor={isRetroDesktopTheme ? undefined : 'cyan.900'}
        bg={isRetroDesktopTheme ? '#d4d0c8' : undefined}
        bgGradient={isRetroDesktopTheme ? undefined : 'linear(to-r, #000614, #001a2c)'}
        position="sticky"
        top={0}
        zIndex={1}
        data-tutorial="problem-panel-header"
      >
        {isRetroDesktopTheme ? (
          <Box>
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={compactMobileLayout ? 2 : 3}
              py={compactMobileLayout ? 1.5 : 2}
              bg="#e4ded3"
              borderBottom="1px solid #7a7a7a"
            >
              <Flex align="center" gap={2} minW={0} flex="1">
                <Box
                  as="img"
                  src={RETRO_DESKTOP_BADGE_ASSET}
                  alt=""
                  aria-hidden="true"
                  w="16px"
                  h="16px"
                  imageRendering="pixelated"
                  flexShrink={0}
                />
                <Text
                  color="#1f2128"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  letterSpacing="0.02em"
                  fontSize={compactMobileLayout ? 'xs' : 'sm'}
                  fontWeight="700"
                  noOfLines={1}
                >
                  {displayTitle}
                </Text>
              </Flex>
              <Box
                px={compactMobileLayout ? 1.5 : 2}
                py={compactMobileLayout ? 0.75 : 1}
                bg="#efeae0"
                border="1px solid #7a7a7a"
                boxShadow="inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(84,84,84,0.22)"
                flexShrink={0}
              >
                <Text
                  color="#4a4f57"
                  fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                  fontSize={compactMobileLayout ? '9px' : '10px'}
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  Mission File
                </Text>
              </Box>
            </Flex>
          </Box>
        ) : (
          <Flex alignItems="center" gap={2} p={compactMobileLayout ? 2 : 3}>
            <FaTerminal color="#00ccff" />
            <Text
              bgGradient="linear(to-r, cyan.400, green.400)"
              bgClip="text"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 5px #00ccff"
              letterSpacing="1px"
              fontSize={compactMobileLayout ? 'sm' : 'md'}
              fontWeight="bold"
            >
              Mission: {displayTitle}
            </Text>
          </Flex>
        )}
        {classicReferenceName && (
          <Text
            mt={isRetroDesktopTheme ? 0 : 1}
            px={3}
            pb={2}
            color={isRetroDesktopTheme ? '#35393f' : 'cyan.200'}
            fontSize="xs"
            fontFamily={uiFontFamily}
            letterSpacing="0.3px"
          >
            This problem relates to classic interview problem: {classicReferenceName}
          </Text>
        )}
      </Box>

      {tutorialOverlayNode}

      {/* Content */}
      <Box p={contentPadding}>
        {/* Hacking Context */}
        <Box
          mb={sectionSpacing}
          p={insetPanelPadding}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(0,200,255,0.1)',
                borderRadius: 'md',
                border: '1px solid',
                borderColor: 'cyan.900',
                boxShadow: '0 0 10px rgba(0, 170, 255, 0.2) inset',
              })}
        >
          <Text
            fontStyle={isRetroDesktopTheme ? 'normal' : 'italic'}
            color={isRetroDesktopTheme ? '#1f2128' : 'cyan.300'}
            mb={2}
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px #00ccff'}
            fontSize="sm"
          >
            {hackingContext}
          </Text>
          {isRetroDesktopTheme ? (
            <Box>
              <Text mb={1} fontSize="10px" color="#3f4550" fontFamily={uiFontFamily}>
                Progress
              </Text>
              <Box h="14px" border="2px solid #1d2128" bg="#12161f" overflow="hidden">
                <Box
                  h="100%"
                  w={`${breachProgress}%`}
                  bgImage={`url(${RETRO_PROGRESS_FILL_ASSET})`}
                  bgRepeat="repeat-x"
                  bgSize="auto 100%"
                />
              </Box>
              <Text mt={1.5} fontSize="10px" color="#0b2ba8" fontFamily={uiFontFamily}>
                Mission Progress: {breachProgress}%
              </Text>
            </Box>
          ) : (
            <>
              <Progress size="xs" colorScheme="cyan" value={breachProgress} mb={1} />
              <Text fontSize="xs" color="#00ccff" fontFamily="'Orbitron', sans-serif">
                Breach Progress: {breachProgress}%
              </Text>
            </>
          )}
        </Box>

        {/* Problem Content */}
        <Box
          p={insetPanelPadding}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(10,20,30,0.7)',
                borderRadius: 'md',
                border: '1px solid #001a2c',
                boxShadow: '0 0 10px rgba(0, 100, 255, 0.1) inset',
              })}
          mb={sectionSpacing}
        >
          {/* Description */}
          {problem?.content && (
            <Box mb={4}>
              {isDemo ? (
                <Box
                  className="problem-description"
                  sx={
                    isRetroDesktopTheme
                      ? {
                          color: '#1f2128',
                          p: { mb: 3 },
                          strong: { color: '#0b2ba8', fontFamily: uiFontFamily },
                          code: {
                            fontFamily: 'monospace',
                            bg: '#ffffff',
                            px: 1,
                            borderRadius: '0',
                            color: '#0b2ba8',
                            border: '1px solid #c7c0b3',
                          },
                        }
                      : {
                          p: { mb: 3 },
                          strong: {
                            color: 'cyan.300',
                            fontFamily: "'Orbitron', sans-serif",
                            textShadow: '0 0 2px #00ccff',
                          },
                          code: {
                            fontFamily: 'monospace',
                            bg: 'rgba(0,10,20,0.9)',
                            px: 1,
                            borderRadius: 'sm',
                            color: '#00ffcc',
                          },
                        }
                  }
                >
                  <p>Welcome to CodeGrind! Your first mission is simple.</p>
                  <p>
                    Write a function that returns the exact string: <code>"Hello, CodeGrind!"</code>
                  </p>
                  <p>In the code editor, you will write this solution under the TODO comment:</p>
                  <p>
                    <code>print("Hello, CodeGrind!")</code>
                  </p>
                  <p>
                    Once your code is ready, you will build <strong>defense modules</strong> to
                    protect the system.
                  </p>
                </Box>
              ) : problem.source === 'LEETCODE' || problem.source === 'CODEGRIND' ? (
                <Box
                  className="problem-description"
                  sx={
                    isRetroDesktopTheme
                      ? {
                          color: '#1f2128',
                          p: { mb: 3 },
                          pre: {
                            bg: '#ffffff',
                            p: 3,
                            borderRadius: '0',
                            mb: 4,
                            overflowX: 'auto',
                            border: '2px solid #232730',
                          },
                          code: {
                            fontFamily: 'monospace',
                            bg: '#ffffff',
                            px: 1,
                            borderRadius: '0',
                            color: '#0b2ba8',
                            border: '1px solid #c7c0b3',
                          },
                          ul: { pl: 6, mb: 4 },
                          li: { mb: 2 },
                          strong: {
                            color: '#0b2ba8',
                            fontFamily: uiFontFamily,
                          },
                          sup: { fontSize: 'xs', verticalAlign: 'super' },
                        }
                      : {
                          p: { mb: 3 },
                          pre: {
                            bg: 'rgba(0,10,20,0.9)',
                            p: 3,
                            borderRadius: 'md',
                            mb: 4,
                            overflowX: 'auto',
                            border: '1px solid #001a2c',
                            boxShadow: '0 0 5px rgba(0, 170, 255, 0.1) inset',
                          },
                          code: {
                            fontFamily: 'monospace',
                            bg: 'rgba(0,10,20,0.9)',
                            px: 1,
                            borderRadius: 'sm',
                            color: '#00ffcc',
                          },
                          ul: { pl: 6, mb: 4 },
                          li: { mb: 2 },
                          strong: {
                            color: 'cyan.300',
                            fontFamily: "'Orbitron', sans-serif",
                            textShadow: '0 0 2px #00ccff',
                          },
                          sup: { fontSize: 'xs', verticalAlign: 'super' },
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: problem.content }}
                />
              ) : isLearningProblem ? (
                <Box
                  color={isRetroDesktopTheme ? '#1f2128' : 'gray.300'}
                  sx={
                    isRetroDesktopTheme
                      ? {
                          h1: { fontSize: 'lg', mb: 3, color: '#0b2ba8', fontFamily: uiFontFamily },
                          h2: { fontSize: 'md', mb: 2, color: '#1f2128', fontFamily: uiFontFamily },
                          h3: { fontSize: 'sm', mb: 2, color: '#3f4550', fontFamily: uiFontFamily },
                          p: { mb: 3 },
                          'ul, ol': { pl: 5, mb: 3 },
                          li: { mb: 2 },
                          pre: {
                            bg: '#ffffff',
                            p: 3,
                            borderRadius: '0',
                            mb: 4,
                            overflowX: 'auto',
                            border: '2px solid #232730',
                          },
                          code: {
                            fontFamily: 'monospace',
                            bg: '#ffffff',
                            px: 1,
                            borderRadius: '0',
                            color: '#0b2ba8',
                            border: '1px solid #c7c0b3',
                          },
                          blockquote: {
                            borderLeft: '2px solid #0b2ba8',
                            pl: 3,
                            color: '#3f4550',
                            bg: '#ebe7dd',
                          },
                        }
                      : {
                          h1: { fontSize: 'lg', mb: 3, color: 'cyan.300' },
                          h2: { fontSize: 'md', mb: 2, color: 'cyan.200' },
                          h3: { fontSize: 'sm', mb: 2, color: 'cyan.100' },
                          p: { mb: 3 },
                          'ul, ol': { pl: 5, mb: 3 },
                          li: { mb: 2 },
                          pre: {
                            bg: 'rgba(0,10,20,0.9)',
                            p: 3,
                            borderRadius: 'md',
                            mb: 4,
                            overflowX: 'auto',
                            border: '1px solid #001a2c',
                          },
                          code: {
                            fontFamily: 'monospace',
                            bg: 'rgba(0,10,20,0.9)',
                            px: 1,
                            borderRadius: 'sm',
                            color: '#00ffcc',
                          },
                          blockquote: {
                            borderLeft: '2px solid rgba(0, 255, 140, 0.5)',
                            pl: 3,
                            color: 'gray.200',
                            bg: 'rgba(0, 255, 140, 0.08)',
                          },
                        }
                  }
                >
                  <MarkdownMessage content={problem.content} />
                </Box>
              ) : (
                <Box
                  dangerouslySetInnerHTML={{ __html: problem.content }}
                  sx={
                    isRetroDesktopTheme
                      ? {
                          p: { mb: 3, color: '#1f2128' },
                          code: {
                            fontFamily: 'monospace',
                            bg: '#ffffff',
                            px: 1,
                            borderRadius: '0',
                            color: '#0b2ba8',
                            border: '1px solid #c7c0b3',
                          },
                        }
                      : {
                          p: { mb: 3, color: 'gray.300' },
                          code: {
                            fontFamily: 'monospace',
                            bg: 'rgba(0,10,20,0.9)',
                            px: 1,
                            borderRadius: 'sm',
                            color: '#00ffcc',
                          },
                        }
                  }
                />
              )}
            </Box>
          )}

          {/* Examples */}
          {!isDemo && (examplesToRender?.length > 0 || problem?.examples) && (
            <Box mb={4}>
              <Heading
                size="sm"
                color={isRetroDesktopTheme ? '#0b2ba8' : 'cyan.300'}
                mb={2}
                fontFamily={uiFontFamily}
                textShadow={isRetroDesktopTheme ? 'none' : '0 0 4px #00ccff'}
              >
                Examples
              </Heading>
              {problem?.source === 'AI' && problem?.examples
                ? problem.examples.map((example, idx) => (
                    <Box
                      key={idx}
                      mb={3}
                      p={2}
                      {...(isRetroDesktopTheme
                        ? retroInsetPanelProps
                        : {
                            bg: 'rgba(0,15,30,0.9)',
                            borderRadius: 'md',
                            border: '1px solid #002a3c',
                            boxShadow: '0 0 8px rgba(0, 170, 255, 0.1) inset',
                          })}
                      dangerouslySetInnerHTML={{ __html: example }}
                      sx={
                        isRetroDesktopTheme
                          ? {
                              color: '#1f2128',
                              p: { mb: 2 },
                              strong: { color: '#0b2ba8', fontFamily: uiFontFamily },
                              br: { mb: 1 },
                              code: {
                                fontFamily: 'monospace',
                                bg: '#ffffff',
                                px: 1,
                                borderRadius: '0',
                                color: '#0b2ba8',
                                border: '1px solid #c7c0b3',
                              },
                            }
                          : {
                              p: { mb: 2 },
                              strong: { color: 'cyan.300' },
                              br: { mb: 1 },
                              code: {
                                fontFamily: 'monospace',
                                bg: 'rgba(0,10,20,0.9)',
                                px: 1,
                                borderRadius: 'sm',
                                color: '#00ffcc',
                              },
                            }
                      }
                    />
                  ))
                : (examplesToRender || []).map((example, idx) => (
                    <Box
                      key={idx}
                      mb={3}
                      p={2}
                      {...(isRetroDesktopTheme
                        ? retroInsetPanelProps
                        : {
                            bg: 'rgba(0,15,30,0.9)',
                            borderRadius: 'md',
                            border: '1px solid #002a3c',
                            boxShadow: '0 0 8px rgba(0, 170, 255, 0.1) inset',
                          })}
                      fontSize="sm"
                    >
                      {example?.input && (
                        <Text mb={1}>
                          <Text
                            as="span"
                            fontWeight="bold"
                            fontFamily={uiFontFamily}
                            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                            textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #00ccff'}
                          >
                            Input:
                          </Text>{' '}
                          {formatExampleValue(example.input)}
                        </Text>
                      )}
                      {example?.output && (
                        <Text mb={1}>
                          <Text
                            as="span"
                            fontWeight="bold"
                            fontFamily={uiFontFamily}
                            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                            textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #00ccff'}
                          >
                            Output:
                          </Text>{' '}
                          {formatExampleValue(example.output)}
                        </Text>
                      )}
                      {example?.explanation && (
                        <Text fontSize="xs" color={isRetroDesktopTheme ? '#4d5562' : 'gray.400'}>
                          <Text
                            as="span"
                            fontWeight="bold"
                            fontFamily={uiFontFamily}
                            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                            textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #00ccff'}
                          >
                            Explanation:
                          </Text>{' '}
                          {example.explanation}
                        </Text>
                      )}
                    </Box>
                  ))}
            </Box>
          )}

          {/* Constraints */}
          {!isDemo && (problem?.constraints || problemDescription?.constraints) && (
            <Box mb={3}>
              <Heading
                size="sm"
                color={isRetroDesktopTheme ? '#0b2ba8' : 'cyan.300'}
                mb={2}
                fontFamily={uiFontFamily}
                textShadow={isRetroDesktopTheme ? 'none' : '0 0 4px #00ccff'}
              >
                Constraints
              </Heading>

              {typeof problem?.constraints === 'string' ? (
                problem.constraints.includes('<ul>') || problem.constraints.includes('<li>') ? (
                  <Box
                    p={2}
                    {...(isRetroDesktopTheme
                      ? retroInsetPanelProps
                      : {
                          bg: 'rgba(0,15,30,0.9)',
                          borderRadius: 'md',
                          border: '1px solid #002a3c',
                        })}
                    fontSize="sm"
                    sx={
                      isRetroDesktopTheme
                        ? {
                            color: '#1f2128',
                            ul: { pl: 6, margin: 0 },
                            li: { mb: 2 },
                            code: {
                              fontFamily: 'monospace',
                              bg: '#ffffff',
                              px: 1,
                              borderRadius: '0',
                              color: '#0b2ba8',
                              border: '1px solid #c7c0b3',
                            },
                            sup: { fontSize: 'xs', verticalAlign: 'super' },
                          }
                        : {
                            ul: { pl: 6, margin: 0 },
                            li: { mb: 2 },
                            code: {
                              fontFamily: 'monospace',
                              bg: 'rgba(0,10,20,0.9)',
                              px: 1,
                              borderRadius: 'sm',
                              color: '#00ffcc',
                            },
                            sup: { fontSize: 'xs', verticalAlign: 'super' },
                          }
                    }
                    dangerouslySetInnerHTML={{ __html: problem.constraints }}
                  />
                ) : (
                  <List
                    spacing={2}
                    p={2}
                    {...(isRetroDesktopTheme
                      ? retroInsetPanelProps
                      : {
                          bg: 'rgba(0,15,30,0.9)',
                          borderRadius: 'md',
                          border: '1px solid #002a3c',
                        })}
                    fontSize="sm"
                  >
                    {problem.constraints
                      .split(/\n|\r\n|•|-|•/)
                      .filter((c) => c.trim())
                      .map((constraint, idx) => (
                        <ListItem key={idx} display="flex" alignItems="flex-start">
                          <ListIcon
                            as={FaShieldAlt}
                            color={isRetroDesktopTheme ? '#0b2ba8' : 'cyan.400'}
                            mt={1}
                          />
                          <Text>{stripHtmlTags(constraint).trim()}</Text>
                        </ListItem>
                      ))}
                  </List>
                )
              ) : Array.isArray(problem?.constraints) ? (
                <List
                  spacing={2}
                  p={2}
                  {...(isRetroDesktopTheme
                    ? retroInsetPanelProps
                    : {
                        bg: 'rgba(0,15,30,0.9)',
                        borderRadius: 'md',
                        border: '1px solid #002a3c',
                      })}
                  fontSize="sm"
                >
                  {problem.constraints.map((constraint, idx) => (
                    <ListItem key={idx} display="flex" alignItems="flex-start">
                      <ListIcon
                        as={FaShieldAlt}
                        color={isRetroDesktopTheme ? '#0b2ba8' : 'cyan.400'}
                        mt={1}
                      />
                      <Text>
                        {typeof constraint === 'string'
                          ? stripHtmlTags(constraint)
                          : JSON.stringify(constraint)}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text
                  color={isRetroDesktopTheme ? '#4d5562' : 'gray.400'}
                  p={2}
                  {...(isRetroDesktopTheme
                    ? retroInsetPanelProps
                    : {
                        bg: 'rgba(0,15,30,0.9)',
                        borderRadius: 'md',
                        border: '1px solid #002a3c',
                      })}
                  fontSize="sm"
                >
                  No specific constraints provided.
                </Text>
              )}
            </Box>
          )}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default TowerDefenseProblemPanel;
