import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const HomeLoading = ({
  fullScreen = true,
  title = 'INITIALIZING CODEGRIND',
  message = 'Syncing client modules and validating session...'
}) => {
  const containerStyles = fullScreen
    ? {
        minH: '100vh',
        bg: '#0a0e17'
      }
    : {
        minH: 'auto',
        bg: 'transparent'
      };

  return (
    <Box
      position="relative"
      width="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={fullScreen ? 0 : { base: 6, md: 8 }}
      overflow="hidden"
      {...containerStyles}
    >
      {fullScreen && (
        <Box
          position="absolute"
          inset={0}
          opacity={0.2}
          background="linear-gradient(#00ccff10 1px, transparent 1px), linear-gradient(90deg, #00ccff10 1px, transparent 1px)"
          backgroundSize="32px 32px"
          animation="moveGrid 18s linear infinite"
          sx={{
            '@keyframes moveGrid': {
              '0%': { backgroundPosition: '0px 0px' },
              '100%': { backgroundPosition: '32px 32px' }
            }
          }}
        />
      )}

      <Box
        position="relative"
        zIndex={1}
        px={{ base: 6, md: 8 }}
        py={{ base: 6, md: 7 }}
        borderRadius="lg"
        border="1px solid rgba(0, 255, 255, 0.35)"
        bg={fullScreen ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)'}
        boxShadow="0 0 24px rgba(0, 255, 255, 0.25)"
        textAlign="center"
        maxW="520px"
      >
        <VStack spacing={3}>
          <Heading
            size={fullScreen ? 'md' : 'sm'}
            color="#00FFFF"
            fontFamily="'Orbitron', sans-serif"
            textShadow="0 0 12px rgba(0, 255, 255, 0.6)"
          >
            {title}
          </Heading>
          <Text color="gray.300" fontFamily="monospace">
            {message}
          </Text>
          <HStack spacing={2} justify="center" pt={1}>
            {['0s', '0.2s', '0.4s'].map((delay) => (
              <Box
                key={delay}
                width="8px"
                height="8px"
                borderRadius="full"
                bg="#00ccff"
                animation={`blink 1s infinite ${delay}`}
                sx={{
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 0.25 },
                    '50%': { opacity: 1 }
                  }
                }}
              />
            ))}
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default HomeLoading;
