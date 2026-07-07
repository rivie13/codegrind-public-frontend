import { Box, Button, Flex, Grid, Heading, Text } from '@chakra-ui/react';
import React from 'react';
import { FaCode, FaShieldAlt } from 'react-icons/fa';

const GameBoard = ({
  playerLost,
  playerWon,
  lives,
  credits,
  formattedTime,
  codeSubmissionSuccess,
  isEndlessMode = false,
  endlessScore = 0,
  endlessWavesSurvived = 0,
  endlessSurvivalSeconds = 0,
  totalWaves = 0,
  onResetGame,
  onNavigateToList,
  navigateToListLabel = 'Back to Problem List',
  containerProps = {},
  contentProps = {},
  children,
}) => {
  const formatSurvivalTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
  };

  const totalWavesCleared = Math.max(0, totalWaves) + Math.max(0, endlessWavesSurvived);

  return (
    <Box flex="3" position="relative" minWidth="0" minH="0" {...containerProps}>
      <Flex
        height="100%"
        minH="0"
        alignItems="center"
        justifyContent="center"
        position="relative"
        overflow="hidden"
        borderRadius="md"
        boxShadow="0 0 30px rgba(0, 255, 255, 0.2)"
        {...contentProps}
      >
        {/* The grid content (TowerDefenseController) is passed as children */}
        {children}

        {/* Game over overlay */}
        {playerLost && !isEndlessMode && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            bg="rgba(0,0,0,0.8)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={4}
            zIndex={10}
          >
            <Text
              fontSize="2xl"
              color="red.400"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 10px rgba(255, 0, 0, 0.7)"
            >
              HACK FAILED: NEURAL FLATLINE
            </Text>

            <Text color="gray.300" textAlign="center" maxW="80%" mb={3}>
              ICE countermeasures have detected and terminated your intrusion.
            </Text>

            <Flex gap={4}>
              <Button colorScheme="red" onClick={onResetGame}>
                Reset Hack
              </Button>

              <Button variant="outline" colorScheme="blue" onClick={onNavigateToList}>
                {navigateToListLabel}
              </Button>
            </Flex>
          </Box>
        )}

        {/* Endless mode game over overlay */}
        {playerLost && isEndlessMode && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            bg="rgba(0,0,0,0.85)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={4}
            zIndex={10}
            p={6}
            backdropFilter="blur(3px)"
          >
            <Text
              fontSize="2xl"
              color="#00ccff"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 10px rgba(0, 204, 255, 0.7)"
            >
              ENDLESS BREACH TERMINATED
            </Text>
            <Text color="gray.300" textAlign="center" maxW="80%" mb={3}>
              The system collapsed your endless intrusion. Here are your final breach metrics.
            </Text>
            <Box
              bg="rgba(0,0,0,0.7)"
              borderRadius="md"
              p={4}
              width="80%"
              maxWidth="520px"
              border="1px solid"
              borderColor="#00ccff"
              mb={4}
            >
              <Heading size="sm" color="#00ccff" mb={3}>
                ENDLESS RUN SUMMARY
              </Heading>
              <Grid templateColumns="1fr 1fr" gap={3}>
                <Text color="gray.300">Endless Survival:</Text>
                <Text color="cyan.300" fontFamily="monospace">
                  {formatSurvivalTime(endlessSurvivalSeconds)}
                </Text>

                <Text color="gray.300">Endless Waves Cleared:</Text>
                <Text color="cyan.300" fontFamily="monospace">
                  {endlessWavesSurvived}
                </Text>

                <Text color="gray.300">Total Waves Cleared:</Text>
                <Text color="cyan.300" fontFamily="monospace">
                  {totalWavesCleared}
                </Text>

                <Text color="gray.300">Endless Score:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {endlessScore}
                </Text>

                <Text color="gray.300">Final Credits:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {credits}
                </Text>
              </Grid>
            </Box>
            <Flex gap={4}>
              <Button colorScheme="cyan" leftIcon={<FaCode />} onClick={onNavigateToList}>
                {navigateToListLabel}
              </Button>
              <Button
                colorScheme="green"
                variant="outline"
                leftIcon={<FaShieldAlt />}
                onClick={onResetGame}
              >
                Retry Hack
              </Button>
            </Flex>
          </Box>
        )}

        {/* Victory screen overlay */}
        {playerWon && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            bg="rgba(0,0,0,0.85)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            gap={4}
            zIndex={10}
            p={6}
            backdropFilter="blur(3px)"
          >
            <Text
              fontSize="3xl"
              bgGradient="linear(to-r, cyan.400, green.400, purple.500)"
              bgClip="text"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 15px rgba(0, 255, 255, 0.8)"
              mb={2}
            >
              SYSTEM COMPROMISED
            </Text>

            <Text
              fontSize="lg"
              color="cyan.300"
              textAlign="center"
              maxW="80%"
              mb={3}
              textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
            >
              Corporate defenses breached! Full access acquired to secure data.
            </Text>

            {/* Stats display */}
            <Box
              bg="rgba(0,0,0,0.7)"
              borderRadius="md"
              p={4}
              width="80%"
              maxWidth="500px"
              border="1px solid"
              borderColor="cyan.700"
              mb={4}
            >
              <Heading size="sm" color="cyan.400" mb={3}>
                BREACH STATISTICS
              </Heading>

              <Grid templateColumns="1fr 1fr" gap={3}>
                <Text color="gray.300">Time to Breach:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {formattedTime}
                </Text>

                <Text color="gray.300">Remaining Neural Stability:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {lives * 10}%
                </Text>

                <Text color="gray.300">Databits Extracted:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {credits}
                </Text>

                <Text color="gray.300">Algorithm Status:</Text>
                <Text color="green.300" fontFamily="monospace">
                  {codeSubmissionSuccess === true ? 'Optimized' : 'Functional'}
                </Text>
              </Grid>
            </Box>

            <Flex gap={4}>
              <Button colorScheme="cyan" leftIcon={<FaCode />} onClick={onNavigateToList}>
                {navigateToListLabel}
              </Button>

              <Button
                colorScheme="green"
                variant="outline"
                leftIcon={<FaShieldAlt />}
                onClick={onResetGame}
              >
                Retry Hack
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default GameBoard;
