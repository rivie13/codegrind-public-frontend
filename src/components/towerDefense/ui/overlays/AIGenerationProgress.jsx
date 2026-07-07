import { Box, Flex, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React, { useEffect, useRef, useState } from 'react';

// Cyberpunk glitch effect
const glitchAnim = keyframes`
  0% { transform: translate(0); text-shadow: 0 0 5px #0ff, -1px -1px 0 #f0f, 1px 1px 0 #0ff; }
  2% { transform: translate(-2px, 1px); text-shadow: 0 0 7px #0ff, -1px -1px 0 #f0f, 1px 1px 0 #0ff; }
  4% { transform: translate(2px, -1px); text-shadow: 0 0 10px #0ff, -1px -1px 0 #f0f, 1px 1px 0 #0ff; }
  6% { transform: translate(0); text-shadow: 0 0 5px #0ff, -1px -1px 0 #f0f, 1px 1px 0 #0ff; }
  100% { transform: translate(0); text-shadow: 0 0 5px #0ff, -1px -1px 0 #f0f, 1px 1px 0 #0ff; }
`;

// Data flow animation
const dataFlow = keyframes`
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
`;

// Pulse animation
const pulse = keyframes`
  0% { box-shadow: 0 0 10px #0ff; }
  50% { box-shadow: 0 0 20px #0ff; }
  100% { box-shadow: 0 0 10px #0ff; }
`;

// Typing animation
const typing = keyframes`
  from { width: 0 }
  to { width: 100% }
`;

// Slow scan animation for idle state
const scanLine = keyframes`
  0% { left: 0; opacity: 0; }
  5% { opacity: 0.5; }
  45% { opacity: 0.5; }
  50% { left: 100%; opacity: 0; }
  100% { left: 0; opacity: 0; }
`;

const AIGenerationProgress = ({
  isGenerating,
  towerType,
  compact = false,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing neural link...');
  const [isFinishing, setIsFinishing] = useState(false);
  const finishIntervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const progressRef = useRef(0);
  const isActive = isGenerating || isFinishing;

  // Random progress simulation while generating
  useEffect(() => {
    if (isGenerating) {
      setIsFinishing(false);
      if (finishIntervalRef.current) {
        clearInterval(finishIntervalRef.current);
        finishIntervalRef.current = null;
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }

      const messages = [
        'Initializing neural link...',
        'Scanning codebase architecture...',
        'Analyzing solution patterns...',
        'Generating code matrix...',
        'Optimizing token structures...',
        'Synthesizing algorithm fragments...',
        `Building ${towerType} component...`,
        'Verifying syntax integrity...',
        'Finalizing code compilation...',
      ];

      let interval;
      let messageIndex = 0;

      const updateProgress = () => {
        setProgress((prev) => {
          const increment = Math.max(1, 15 * (1 - prev / 100));
          const newProgress = Math.min(99, prev + increment / 10);

          if (newProgress > messageIndex * (100 / messages.length)) {
            setStatusText(messages[Math.min(messageIndex, messages.length - 1)]);
            messageIndex++;
          }

          progressRef.current = newProgress;
          return newProgress;
        });
      };

      interval = setInterval(updateProgress, 300);

      return () => clearInterval(interval);
    }

    if (progressRef.current <= 0) {
      setIsFinishing(false);
      setStatusText('Ready for code synthesis');
      return undefined;
    }

    if (finishIntervalRef.current) {
      return undefined;
    }

    setIsFinishing(true);
    setStatusText('Finalizing code compilation...');

    finishIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        const remaining = 100 - prev;
        const step = Math.max(2, remaining / 3);
        const next = Math.min(100, prev + step);

        progressRef.current = next;

        if (next >= 100) {
          if (finishIntervalRef.current) {
            clearInterval(finishIntervalRef.current);
            finishIntervalRef.current = null;
          }
          finishTimeoutRef.current = setTimeout(() => {
            setIsFinishing(false);
            setProgress(0);
            progressRef.current = 0;
            setStatusText('Ready for code synthesis');
          }, 450);
        }

        return next;
      });
    }, 120);

    return undefined;
  }, [isGenerating, towerType]);

  useEffect(() => {
    return () => {
      if (finishIntervalRef.current) {
        clearInterval(finishIntervalRef.current);
        finishIntervalRef.current = null;
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, []);

  // Compact mode for header integration
  if (compact) {
    return (
      <>
        {/* Progress bar - shows idle animation when not generating */}
        <Box
          height="16px"
          width="100%"
          borderRadius={isRetroDesktopTheme ? '0' : 'sm'}
          border={isRetroDesktopTheme ? '1px solid #6f6f6f' : '1px solid #0ff'}
          overflow="hidden"
          position="relative"
          mt={1}
          bg={isRetroDesktopTheme ? '#f7f4ee' : isActive ? 'transparent' : 'rgba(0,30,50,0.5)'}
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 rgba(255,255,255,0.72), inset -1px -1px 0 rgba(104,104,104,0.18)'
              : undefined
          }
        >
          {/* Progress bar when generating */}
          {isActive ? (
            <Box
              height="100%"
              width={`${progress}%`}
              bg={isRetroDesktopTheme ? '#0b2ba8' : undefined}
              bgGradient={isRetroDesktopTheme ? undefined : 'linear(to-r, #0ff, #f0f, #0ff)'}
              backgroundSize={isRetroDesktopTheme ? undefined : '200% 100%'}
              animation={isRetroDesktopTheme ? undefined : `${dataFlow} 2s linear infinite`}
              transition="width 0.3s ease-out"
            />
          ) : (
            /* Idle scanning animation when not generating */
            <Box
              position="absolute"
              height="100%"
              width="20px"
              bgGradient={
                isRetroDesktopTheme
                  ? 'linear(to-r, transparent, #c0c0c0, transparent)'
                  : 'linear(to-r, transparent, #0ff, transparent)'
              }
              animation={`${scanLine} 3s linear infinite`}
              opacity={isRetroDesktopTheme ? '0.35' : '0.5'}
            />
          )}

          {/* Percentage text or status */}
          <Flex
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color={
                isRetroDesktopTheme
                  ? isActive
                    ? '#f5f7ff'
                    : '#1f2430'
                  : isActive
                    ? 'black'
                    : '#0ff'
              }
              fontWeight="bold"
              fontSize="2xs"
              fontFamily={
                isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'
              }
              mixBlendMode={isRetroDesktopTheme ? 'normal' : isActive ? 'difference' : 'normal'}
            >
              {isActive ? `${Math.round(progress)}%` : 'IDLE'}
            </Text>
          </Flex>
        </Box>

        {/* Status text with typing animation */}
        <Box overflow="hidden" whiteSpace="nowrap" height="14px" mt={1}>
          <Text
            color={isRetroDesktopTheme ? '#0b2ba8' : '#0ff'}
            fontFamily={isRetroDesktopTheme ? "'Tahoma', 'MS Sans Serif', sans-serif" : 'monospace'}
            fontSize={isRetroDesktopTheme ? '10px' : '2xs'}
            fontWeight={isRetroDesktopTheme ? '700' : undefined}
            display="inline-block"
            whiteSpace="nowrap"
            overflow="hidden"
            animation={isRetroDesktopTheme ? undefined : `${typing} 1s steps(40, end)`}
          >
            &gt; {statusText}
          </Text>
          <Text
            as="span"
            color={isRetroDesktopTheme ? '#0b2ba8' : '#0ff'}
            animation={isRetroDesktopTheme ? undefined : 'blink 1s step-end infinite'}
            fontSize={isRetroDesktopTheme ? '10px' : '2xs'}
          >
            {isRetroDesktopTheme ? '' : '_'}
          </Text>
        </Box>
      </>
    );
  }

  // Full mode (original version)
  return (
    <Flex
      direction="column"
      width="100%"
      bg="rgba(0,20,40,0.9)"
      borderRadius="md"
      border="1px solid #0ff"
      p={3}
      mb={3}
      boxShadow="0 0 15px #0ff"
      animation={`${pulse} 2s infinite`}
    >
      <Text
        color="#0ff"
        fontSize="lg"
        fontFamily="'Orbitron', sans-serif"
        mb={1}
        textShadow="0 0 5px #0ff"
        animation={`${glitchAnim} 5s infinite`}
      >
        NEURAL CODE SYNTHESIS
      </Text>

      <Text color="#0ff" fontFamily="monospace" mb={2} fontSize="sm">
        TOWER TYPE:{' '}
        <span style={{ color: '#f0f' }}>{isActive ? towerType || 'UNKNOWN' : 'IDLE'}</span>
      </Text>

      {/* Matrix-style code rain background */}
      <Box
        height="24px"
        width="100%"
        borderRadius="md"
        border="1px solid #0ff"
        overflow="hidden"
        position="relative"
        mb={2}
        bg={isActive ? 'transparent' : 'rgba(0,30,50,0.5)'}
      >
        {/* Progress bar when generating */}
        {isActive ? (
          <Box
            height="100%"
            width={`${progress}%`}
            bgGradient="linear(to-r, #0ff, #f0f, #0ff)"
            backgroundSize="200% 100%"
            animation={`${dataFlow} 2s linear infinite`}
            transition="width 0.3s ease-out"
          />
        ) : (
          /* Idle scanning animation when not generating */
          <Box
            position="absolute"
            height="100%"
            width="20px"
            bgGradient="linear(to-r, transparent, #0ff, transparent)"
            animation={`${scanLine} 3s linear infinite`}
            opacity="0.5"
          />
        )}

        {/* Percentage text */}
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          justifyContent="center"
          alignItems="center"
        >
          <Text
            color={isActive ? 'black' : '#0ff'}
            fontWeight="bold"
            fontSize="xs"
            fontFamily="monospace"
            mixBlendMode={isActive ? 'difference' : 'normal'}
          >
            {isActive ? `${Math.round(progress)}%` : 'NEURAL LINK READY'}
          </Text>
        </Flex>
      </Box>

      {/* Status text with typing animation */}
      <Box overflow="hidden" whiteSpace="nowrap">
        <Text
          color="#0ff"
          fontFamily="monospace"
          fontSize="sm"
          display="inline-block"
          whiteSpace="nowrap"
          overflow="hidden"
          animation={`${typing} 1s steps(40, end)`}
        >
          &gt; {statusText}
        </Text>
        <Text as="span" color="#0ff" animation="blink 1s step-end infinite">
          _
        </Text>
      </Box>
    </Flex>
  );
};

export default AIGenerationProgress;
