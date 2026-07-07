import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import PageTemplate from '../../layout/PageTemplate';

const LOADING_STEPS = [
  'Authenticating user credentials',
  'Retrieving problem solving history',
  'Loading achievement records',
  'Processing activity timeline',
];

const LoadingProfile = () => {
  return (
    <PageTemplate>
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" px={4} py={10}>
        <Box className="cg-panel-window" width="100%" maxW="720px" overflow="hidden">
          <Box className="cg-titlebar" px={4} py={2}>
            <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
              profile_loader.sys
            </Text>
          </Box>

          <Box p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.14)">
            <VStack spacing={5} align="stretch">
              <VStack spacing={2} align="start">
                <Heading color="var(--cg-text)" size="lg" fontFamily="var(--cg-font-retro-display)">
                  Accessing User Profile
                </Heading>
                <Text color="var(--cg-muted)" fontSize="sm" lineHeight="1.6" maxW="560px">
                  Preparing dashboard widgets, activity history, achievements, and submissions for
                  display.
                </Text>
              </VStack>

              <Box>
                <Text
                  color="var(--cg-link)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  Loading Progress
                </Text>
                <Box
                  h="16px"
                  bg="var(--cg-window-face)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-inset)"
                  overflow="hidden"
                  sx={{
                    '@keyframes loaderSweep': {
                      '0%': { transform: 'translateX(-60%)' },
                      '100%': { transform: 'translateX(160%)' },
                    },
                  }}
                >
                  <Box
                    h="100%"
                    w="40%"
                    bg="repeating-linear-gradient(90deg, var(--cg-accent-blue) 0 12px, var(--cg-link) 12px 24px)"
                    animation="loaderSweep 1.8s linear infinite"
                  />
                </Box>
              </Box>

              <Box
                bg="var(--cg-panel-shell)"
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-inset)"
                p={4}
              >
                <Text
                  color="var(--cg-link)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  mb={3}
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  Active Tasks
                </Text>
                <VStack align="stretch" spacing={2}>
                  {LOADING_STEPS.map((step, index) => (
                    <Text
                      key={step}
                      color={index === 0 ? 'var(--cg-accent-green)' : 'var(--cg-text)'}
                      fontSize="sm"
                      fontFamily="var(--cg-font-retro-display)"
                      sx={{
                        '@keyframes stepFlicker': {
                          '0%, 100%': { opacity: 0.65 },
                          '50%': { opacity: 1 },
                        },
                        animation: `stepFlicker ${1.6 + index * 0.2}s ease-in-out infinite`,
                      }}
                    >
                      &gt; {step}...
                    </Text>
                  ))}
                </VStack>
              </Box>

              <Text
                color="var(--cg-muted)"
                fontSize="xs"
                fontFamily="var(--cg-font-retro-display)"
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Please wait while the workspace sync completes.
              </Text>
            </VStack>
          </Box>
        </Box>
      </Box>
    </PageTemplate>
  );
};

export default LoadingProfile;
