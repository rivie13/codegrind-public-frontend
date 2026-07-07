import { Box, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import React from 'react';

const WINDOW_OUTSET =
  'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';

const DesktopIcon = ({ top, left, label }) => (
  <Box position="absolute" top={top} left={left} opacity={{ base: 0.4, md: 0.58 }}>
    <Box w="34px" h="28px" bg="var(--home-retro-surface)" boxShadow={WINDOW_OUTSET}>
      <Box
        h="6px"
        bg="linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)"
      />
      <Box px="6px" pt="7px">
        <Box w="14px" h="10px" bg="rgba(255, 255, 255, 0.75)" boxShadow={WINDOW_OUTSET} />
      </Box>
    </Box>
    <Text
      mt={1.5}
      color="rgba(255, 255, 255, 0.92)"
      fontFamily="var(--cg-font-retro-display)"
      fontSize="11px"
      lineHeight="1.1"
      textShadow="1px 1px 0 rgba(0, 0, 0, 0.35)"
    >
      {label}
    </Text>
  </Box>
);

const GhostWindow = ({ top, right, width, height }) => (
  <Box
    position="absolute"
    top={top}
    right={right}
    width={width}
    height={height}
    bg="rgba(212, 208, 200, 0.22)"
    boxShadow={WINDOW_OUTSET}
    opacity={{ base: 0.18, md: 0.3 }}
  >
    <Box
      h="18px"
      bg="linear-gradient(90deg, rgba(10, 44, 154, 0.65) 0%, rgba(16, 132, 208, 0.65) 100%)"
    />
  </Box>
);

const HomeBackgroundEffects = ({ showBackground }) => {
  const desktopReveal = keyframes`
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  if (!showBackground) {
    return null;
  }

  return (
    <Box position="absolute" inset="0" overflow="hidden" pointerEvents="none" zIndex="0">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(180deg, rgba(0, 128, 128, 0.18) 0%, rgba(6, 91, 98, 0.26) 100%)"
        animation={`${desktopReveal} 0.45s ease-out forwards`}
      />

      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgImage="linear-gradient(45deg, rgba(255, 255, 255, 0.06) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.06) 50%, rgba(255, 255, 255, 0.06) 75%, transparent 75%, transparent)"
        bgSize="22px 22px"
        opacity="0.12"
      />

      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        height={{ base: '160px', md: '220px' }}
        bg="radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.18), transparent 34%), radial-gradient(circle at 78% 10%, rgba(255, 255, 255, 0.12), transparent 26%)"
        opacity="0.56"
      />

      <DesktopIcon
        top={{ base: '12%', md: '16%' }}
        left={{ base: '4%', md: '5%' }}
        label="My Computer"
      />
      <DesktopIcon
        top={{ base: '27%', md: '31%' }}
        left={{ base: '6%', md: '8%' }}
        label="City Preview"
      />
      <DesktopIcon
        top={{ base: '42%', md: '47%' }}
        left={{ base: '5%', md: '7%' }}
        label="Notes.txt"
      />

      <GhostWindow
        top={{ base: '14%', md: '12%' }}
        right={{ base: '5%', md: '8%' }}
        width={{ base: '128px', md: '188px' }}
        height={{ base: '92px', md: '122px' }}
      />
      <GhostWindow
        top={{ base: '58%', md: '62%' }}
        right={{ base: '7%', md: '11%' }}
        width={{ base: '96px', md: '152px' }}
        height={{ base: '74px', md: '96px' }}
      />
    </Box>
  );
};

export default HomeBackgroundEffects;
