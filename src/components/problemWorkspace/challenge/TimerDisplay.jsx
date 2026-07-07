import { Box, Text } from '@chakra-ui/react';
import React from 'react';
import { formatTime } from '../utils/formatters';

/**
 * Displays the timer for the problem workspace
 * 
 * @param {Object} props
 * @param {number} props.timer - Current timer value in seconds
 * @param {boolean} props.isTimeAttack - Whether this is a time attack challenge
 * @returns {JSX.Element} The timer display component
 */
const TimerDisplay = ({ timer, isTimeAttack }) => {
  return (
    <Box>
      <Text
        fontSize="xl"
        fontWeight="bold"
        color={isTimeAttack && timer < 60 ? "red.500" : "white"}
      >
        {formatTime(timer)}
      </Text>
    </Box>
  );
};

export default TimerDisplay; 