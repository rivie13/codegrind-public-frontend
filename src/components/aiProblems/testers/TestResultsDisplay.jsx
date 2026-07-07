import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

// Utility to hide IP addresses and ports in error messages
function sanitizeErrorMessage(errorMsg) {
  if (!errorMsg) return '';
  // Replace IPv4 addresses with optional port (e.g., 192.168.1.1:8080)
  return errorMsg.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?::\d+)?/g, '[hidden]');
}

/**
 * Component to display test results for a problem solution
 *
 * @param {Object} props
 * @param {Object} props.results - Test results from the solution execution
 * @param {string} props.error - Error message if the test failed to run
 */
const TestResultsDisplay = ({ results, error }) => {
  if (!results && !error) return null;

  return (
    <Box mt={4}>
      {results && (
        <Box
          bg="var(--cg-window-face)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset)"
          overflow="hidden"
        >
          <Box className="cg-titlebar" px={3} py={2}>
            <Heading
              size="sm"
              color="var(--cg-header-text)"
              fontFamily="var(--cg-font-retro-display)"
            >
              Test Results
            </Heading>
          </Box>
          <Box p={4} bg="rgba(255,255,255,0.14)">
            {results.success ? (
              <Text
                color="var(--cg-accent-green)"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
              >
                All tests passed! ✓
              </Text>
            ) : (
              <Text
                color="var(--cg-accent-red)"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
              >
                Some tests failed. ✗
              </Text>
            )}

            <Box mt={4}>
              <Heading
                size="xs"
                color="var(--cg-text)"
                fontFamily="var(--cg-font-retro-display)"
                mb={2}
              >
                Execution Details
              </Heading>
              <VStack spacing={2} align="stretch">
                {results.testResults &&
                  results.testResults.map((result, index) => (
                    <TestResultItem key={index} result={result} index={index} />
                  ))}
              </VStack>
            </Box>
          </Box>
        </Box>
      )}

      {error && (
        <Box
          p={4}
          bg="var(--cg-window-face)"
          mt={4}
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-outset)"
        >
          <Heading
            size="sm"
            color="var(--cg-accent-red)"
            fontFamily="var(--cg-font-retro-display)"
            mb={2}
          >
            Error
          </Heading>
          <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)" lineHeight="1.7">
            {sanitizeErrorMessage(error)}
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Individual test result item component
 */
const TestResultItem = ({ result, index }) => {
  // Only consider a test passed if the result.passed field is explicitly true
  const isPassed = result.passed === true;

  // Helper to format the input/output values for display
  const formatValue = (value) => {
    // Handle null/undefined but explicitly allow 0
    if (value === null || value === undefined) return 'n/a';

    // Handle arrays
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }

    // Try to parse numeric strings and display them without quotes
    if (typeof value === 'string') {
      // If the string is a valid number, convert and display it as a number
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') {
        return String(num);
      }
      // Otherwise keep it as a quoted string
      return `"${value}"`;
    }

    // Other values (numbers, booleans) just convert to string
    return String(value);
  };

  // Use nullish coalescing (??) instead of logical OR (||) to handle 0 correctly
  const expectedOutput = result.expectedOutput ?? result.expected;
  // Actual output might be in stdout (for successful cases) or actualOutput
  const actualOutput = result.actualOutput ?? result.stdout;

  return (
    <Box
      p={3}
      bg={isPassed ? 'rgba(36, 106, 42, 0.12)' : 'rgba(139, 31, 31, 0.12)'}
      mb={3}
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
    >
      <Text
        color={isPassed ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'}
        fontWeight="bold"
        fontFamily="var(--cg-font-retro-display)"
      >
        Test {index + 1}: {isPassed ? 'Passed' : 'Failed'}
      </Text>

      <Box mt={2}>
        <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
          <Text as="span" fontWeight="bold" color="var(--cg-link)">
            Input:
          </Text>{' '}
          <Text as="span" fontFamily="var(--cg-font-retro-display)">
            {formatValue(result.input)}
          </Text>
        </Text>

        <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
          <Text as="span" fontWeight="bold" color="var(--cg-link)">
            Expected:
          </Text>{' '}
          <Text as="span" fontFamily="var(--cg-font-retro-display)">
            {formatValue(expectedOutput)}
          </Text>
        </Text>

        <Text color="var(--cg-text)" fontFamily="var(--cg-font-retro-display)">
          <Text
            as="span"
            fontWeight="bold"
            color={isPassed ? 'var(--cg-link)' : 'var(--cg-accent-red)'}
          >
            Actual:
          </Text>{' '}
          <Text
            as="span"
            fontFamily="var(--cg-font-retro-display)"
            color={isPassed ? 'var(--cg-text)' : 'var(--cg-accent-red)'}
          >
            {formatValue(actualOutput)}
          </Text>
        </Text>
      </Box>

      {!isPassed && result.error && (
        <Box
          mt={2}
          p={2}
          bg="var(--cg-window)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
        >
          <Text
            color="var(--cg-accent-red)"
            fontFamily="var(--cg-font-retro-display)"
            whiteSpace="pre-wrap"
            fontSize="sm"
          >
            {sanitizeErrorMessage(result.error)}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default TestResultsDisplay;
