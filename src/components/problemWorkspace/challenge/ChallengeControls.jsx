import { Badge, Box, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { FaClock, FaKeyboard, FaRandom, FaRobot, FaStopwatch } from 'react-icons/fa';
import TimerDisplay from './TimerDisplay';

/**
 * Challenge mode controls and status display
 * 
 * @param {Object} props
 * @param {Object} props.challengeState - The current challenge state
 * @param {number} props.timer - Current timer value in seconds
 * @param {number} props.sessionSubmissions - Number of submissions in this session
 * @returns {JSX.Element} The challenge controls component
 */
const ChallengeControls = ({ 
  challengeState, 
  timer,
  sessionSubmissions 
}) => {
  const { 
    isTimerRunning,
    isAIDisabled,
    hasRandomChars,
    hasMatrixBomb,
    isTimeAttack
  } = challengeState;

  return (
    <Box 
      p={3} 
      bg="gray.800" 
      borderRadius="md" 
      borderLeft="4px solid"
      borderColor="purple.500"
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="bold" color="purple.300">Challenge Mode</Text>
          <Text>Submissions: {sessionSubmissions}</Text>
        </HStack>
        
        <HStack>
          <Box flex={1}>
            <HStack spacing={3}>
              {isTimerRunning && (
                <Badge colorScheme="blue" p={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                  <FaClock /> Auto Timer
                </Badge>
              )}
              
              {isAIDisabled && (
                <Badge colorScheme="red" p={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                  <FaRobot /> No AI
                </Badge>
              )}
              
              {hasRandomChars && (
                <Badge colorScheme="orange" p={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                  <FaKeyboard /> Random Chars
                </Badge>
              )}
              
              {hasMatrixBomb && (
                <Badge colorScheme="green" p={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                  <FaRandom /> Matrix
                </Badge>
              )}
              
              {isTimeAttack && (
                <Badge colorScheme="yellow" p={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                  <FaStopwatch /> Time Attack
                </Badge>
              )}
            </HStack>
          </Box>
          
          <TimerDisplay 
            timer={timer} 
            isTimeAttack={isTimeAttack}
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default ChallengeControls; 