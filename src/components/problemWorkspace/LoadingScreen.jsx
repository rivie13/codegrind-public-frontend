import { Box, Flex, Text } from '@chakra-ui/react';

const LoadingScreen = ({
  animationsEnabled,
  settings,
  customScanLineAnimation,
  customGlitchAnimation,
}) => (
  <Box
    height="100vh"
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
    width="100%"
    position="relative"
    overflow="hidden"
    bg="linear-gradient(180deg, rgba(236, 233, 216, 0.36), rgba(212, 208, 200, 0.5))"
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
      className="cg-panel-window"
      width={{ base: '92%', sm: '480px' }}
      maxW="480px"
      overflow="hidden"
    >
      <Flex className="cg-titlebar" px={3} py={2} align="center" justify="space-between" gap={3}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
          workspace.boot
        </Text>
        <Text fontSize="10px" fontWeight="700" textTransform="uppercase">
          Loading
        </Text>
      </Flex>

      <Box
        p={{ base: 5, md: 6 }}
        bg="rgba(255,255,255,0.16)"
        borderTop="1px solid var(--cg-window-dark)"
      >
        <Flex justify="center" gap={3} mb={5}>
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              width="18px"
              height="18px"
              bg={index === 1 ? 'var(--cg-link)' : 'var(--cg-window)'}
              border="1px solid var(--cg-window-shadow)"
              boxShadow={index === 1 ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'}
              sx={{
                animation: animationsEnabled
                  ? `loadingPulse 1.2s ease-in-out ${index * 0.12}s infinite`
                  : undefined,
                '@keyframes loadingPulse': {
                  '0%, 100%': { opacity: 0.45 },
                  '50%': { opacity: 1 },
                },
              }}
            />
          ))}
        </Flex>

        <Text
          color="var(--cg-text)"
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight="700"
          textAlign="center"
          textTransform="uppercase"
          letterSpacing="0.08em"
          sx={{
            animation:
              animationsEnabled && settings.glitchEffects.enabled
                ? `${customGlitchAnimation} 2s infinite`
                : undefined,
          }}
        >
          Loading Problem
        </Text>

        <Text mt={3} color="var(--cg-muted)" fontSize="sm" textAlign="center" lineHeight="1.7">
          Preparing the workspace shell, problem brief, and editor session.
        </Text>

        <Box
          mt={5}
          h="12px"
          bg="rgba(0, 0, 0, 0.12)"
          border="1px solid var(--cg-window-dark)"
          boxShadow="var(--cg-window-inset)"
          overflow="hidden"
          position="relative"
        >
          <Box
            width="32%"
            height="100%"
            bg="var(--cg-link)"
            sx={{
              animation: animationsEnabled ? 'loadingBar 1.8s linear infinite' : undefined,
              '@keyframes loadingBar': {
                '0%': { transform: 'translateX(-120%)' },
                '100%': { transform: 'translateX(360%)' },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  </Box>
);

export default LoadingScreen;
