import { Box, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { sanitizeExecutionDisplayText } from '../../../utils/ui/userFacingErrors';

/**
 * Displays the results of code execution
 *
 * @param {Object} props
 * @param {string} props.executionResult - The result of code execution to display
 * @param {boolean} props.isExecuting - Whether code is currently executing
 * @returns {JSX.Element} The execution result panel component
 */
const ExecutionResultPanel = ({ executionResult, isExecuting }) => {
  const displayText = sanitizeExecutionDisplayText(executionResult || '');

  return (
    <Box
      bg="gray.800"
      p={4}
      borderRadius="md"
      height="100%"
      maxHeight="550px"
      overflowY="auto"
      fontFamily="monospace"
      fontSize="sm"
      position="relative"
    >
      {isExecuting && (
        <Box position="absolute" top={4} right={4} zIndex={2}>
          <Spinner size="sm" color="blue.300" speed="0.8s" />
        </Box>
      )}

      <Text whiteSpace="pre-wrap" color="gray.200">
        {displayText || 'Run your code to see results'}
      </Text>
    </Box>
  );
};

export default ExecutionResultPanel;
