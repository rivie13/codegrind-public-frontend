import { Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

function LeaderboardLoading() {
  return (
    <Box className="cg-panel-window" minH="420px" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="700" letterSpacing="0.08em">
          leaderboards.exe
        </Text>
      </Box>

      <VStack spacing={6} p={{ base: 4, md: 6 }} bg="rgba(255,255,255,0.14)" align="stretch">
        <Heading
          color="var(--cg-text)"
          fontSize="2xl"
          fontFamily="var(--cg-font-retro-display)"
          textAlign="center"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Accessing Global Leaderboards
        </Heading>

        <Box
          width="100%"
          position="relative"
          overflow="hidden"
          border="2px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          bg="var(--cg-window-face)"
        >
          <Box
            width="100%"
            py={3}
            px={4}
            borderBottom="1px solid var(--cg-window-dark)"
            bg="rgba(255,255,255,0.18)"
          >
            <HStack spacing={4}>
              {['RANK', 'USERNAME', 'SCORE', 'TIME', 'EFFICIENCY'].map((label, i) => (
                <Text
                  key={i}
                  flex={i === 1 ? 2 : 1}
                  color="var(--cg-text)"
                  fontWeight="bold"
                  fontSize="sm"
                  textAlign={i === 0 ? 'center' : 'left'}
                  fontFamily="var(--cg-font-retro-display)"
                  letterSpacing="0.06em"
                >
                  {label}
                </Text>
              ))}
            </HStack>
          </Box>

          {[...Array(8)].map((_, i) => (
            <Box
              key={i}
              width="100%"
              py={3}
              px={4}
              borderBottom="1px solid var(--cg-window-mid)"
              bg={i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
            >
              <HStack spacing={4}>
                {[0, 1, 2, 3, 4].map((col) => (
                  <Box
                    key={col}
                    flex={col === 1 ? 2 : 1}
                    height="20px"
                    bg="rgba(0, 0, 0, 0.08)"
                    boxShadow="var(--cg-window-inset)"
                  />
                ))}
              </HStack>
            </Box>
          ))}
        </Box>

        <HStack justifyContent="center" pt={2}>
          <Text
            color="var(--cg-link)"
            fontSize="2xl"
            animation="blink 1s infinite 0.1s"
            sx={{ '@keyframes blink': { '0%, 100%': { opacity: 0.3 }, '50%': { opacity: 1 } } }}
          >
            .
          </Text>
          <Text color="var(--cg-link)" fontSize="2xl" animation="blink 1s infinite 0.3s">
            .
          </Text>
          <Text color="var(--cg-link)" fontSize="2xl" animation="blink 1s infinite 0.5s">
            .
          </Text>
        </HStack>

        <VStack spacing={1} alignItems="center">
          <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)" fontSize="sm">
            Restoring ranking data and comparison metrics
          </Text>
          <Text color="var(--cg-muted)" fontSize="xs" fontFamily="var(--cg-font-retro-display)">
            Retrieving data from {Math.floor(Math.random() * 100) + 100} competitive nodes
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
}

export default LeaderboardLoading;
