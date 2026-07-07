import { Box, Flex, HStack, Icon, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { FiArrowRight, FiCheck, FiX } from 'react-icons/fi';

/**
 * Displays the status of a generation step in the AI problem creation process
 * 
 * @param {Object} props
 * @param {string} props.step - The step identifier (e.g., 'title', 'description')
 * @param {Object} props.status - Current status info for the step
 */
const StepIndicator = ({ step, status }) => {
  const getStatusColor = (status) => {
    switch (status.status) {
      case 'completed':
      case 'success': // Added for backward compatibility
        return '#00FF8C'; // Cyberpunk green
      case 'in-progress':
      case 'loading': // Added to handle 'loading' status the same as 'in-progress'
        return '#00FFFF'; // Cyberpunk cyan
      case 'pending':
        return '#1a1a2e'; // Darker cyberpunk background
      case 'failed':
      case 'error':     // Added for backward compatibility
      case 'partial':   // Added for backward compatibility  
        return '#FF3300'; // Cyberpunk red
      case 'skipped':
        return '#FFCC00'; // Cyberpunk amber
      default:
        return '#1a1a2e';
    }
  };

  const getStepLabel = (step) => {
    switch (step) {
      case 'title':
        return 'Generate Title';
      case 'description':
        return 'Generate Problem Description';
      case 'functionName':
        return 'Define Function Name';
      case 'functionParams':
        return 'Define Function Parameters';
      case 'testCases':
        return 'Generate Test Cases';
      case 'expectedOutputs':
        return 'Generate Expected Outputs';
      case 'examples':
        return 'Format Examples';
      case 'codeSnippets':
        return 'Generate Code Snippets';
      case 'constraints':
        return 'Define Constraints';
      case 'solution':
        return 'Generate Solution';
      default:
        return step;
    }
  };
  
  // Add animation for loading state
  const loadingAnimation = status.status === 'loading' || status.status === 'in-progress' 
    ? 'pulse 1.5s infinite ease-in-out' 
    : 'none';
    
  // Get progress based on step position
  const stepOrder = ['title', 'description', 'functionName', 'functionParams', 'testCases', 
                     'expectedOutputs', 'examples', 'codeSnippets', 'constraints', 'solution'];
  const stepIndex = stepOrder.indexOf(step);
  const progress = Math.round((stepIndex / (stepOrder.length - 1)) * 100);
  
  const isActiveOrComplete = status.status === 'completed' || 
                             status.status === 'success' || 
                             status.status === 'loading' || 
                             status.status === 'in-progress';

  return (
    <Flex 
      align="center" 
      mb={3} 
      p={2}
      borderRadius="md"
      bg={(status.status === 'in-progress' || status.status === 'loading') ? 'rgba(0, 255, 255, 0.1)' : 
          status.status === 'completed' || status.status === 'success' ? 'rgba(0, 255, 140, 0.1)' : 
          status.status === 'failed' || status.status === 'error' ? 'rgba(255, 51, 0, 0.1)' : 
          'rgba(26, 26, 46, 0.3)'}
      transition="all 0.3s ease"
      position="relative"
      overflow="hidden"
      border={(status.status === 'in-progress' || status.status === 'loading') ? '1px solid rgba(0, 255, 255, 0.3)' : 
              status.status === 'completed' || status.status === 'success' ? '1px solid rgba(0, 255, 140, 0.3)' : 
              status.status === 'failed' || status.status === 'error' ? '1px solid rgba(255, 51, 0, 0.3)' : 
              '1px solid rgba(26, 26, 46, 0.5)'}
    >
      {/* Progress background for active or completed steps */}
      {isActiveOrComplete && (
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          width={`${progress}%`}
          bg={(status.status === 'in-progress' || status.status === 'loading') ? 'rgba(0, 255, 255, 0.05)' : 
              'rgba(0, 255, 140, 0.05)'}
          zIndex={0}
          transition="width 0.5s ease-out"
        />
      )}
      
      {/* Cyberpunk grid pattern */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        opacity="0.05"
        background={(status.status === 'in-progress' || status.status === 'loading') ? 
                    "radial-gradient(circle at 10px 10px, rgba(0, 255, 255, 0.3) 2px, transparent 2px)" : 
                    status.status === 'completed' || status.status === 'success' ? 
                    "radial-gradient(circle at 10px 10px, rgba(0, 255, 140, 0.3) 2px, transparent 2px)" : 
                    "radial-gradient(circle at 10px 10px, rgba(255, 255, 255, 0.1) 2px, transparent 2px)"}
        backgroundSize="15px 15px"
        pointerEvents="none"
        zIndex={0}
      />
      
      <Box 
        borderRadius="full" 
        width="32px" 
        height="32px" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        color="white"
        bg={getStatusColor(status)}
        mr={3}
        border="2px solid"
        borderColor={(status.status === 'in-progress' || status.status === 'loading') ? '#00FFFF' : 
                     status.status === 'completed' || status.status === 'success' ? '#00FF8C' : 
                     status.status === 'failed' || status.status === 'error' ? '#FF3300' : 
                     'transparent'}
        boxShadow={(status.status === 'in-progress' || status.status === 'loading') ? '0 0 12px #00FFFF' : 
                   status.status === 'completed' || status.status === 'success' ? '0 0 12px #00FF8C' : 
                   status.status === 'failed' || status.status === 'error' ? '0 0 12px #FF3300' : 
                   'none'}
        transition="all 0.3s ease"
        animation={loadingAnimation}
        zIndex={1}
        sx={{
          '@keyframes pulse': {
            '0%': { boxShadow: (status.status === 'in-progress' || status.status === 'loading') ? 
                             '0 0 0 0 rgba(0, 255, 255, 0.7)' : 
                             status.status === 'completed' || status.status === 'success' ?
                             '0 0 0 0 rgba(0, 255, 140, 0.7)' :
                             '0 0 0 0 rgba(255, 51, 0, 0.7)' },
            '70%': { boxShadow: (status.status === 'in-progress' || status.status === 'loading') ? 
                             '0 0 0 10px rgba(0, 255, 255, 0)' : 
                             status.status === 'completed' || status.status === 'success' ?
                             '0 0 0 10px rgba(0, 255, 140, 0)' :
                             '0 0 0 10px rgba(255, 51, 0, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' }
          }
        }}
      >
        {status.status === 'completed' || status.status === 'success' ? (
          <Icon as={FiCheck} fontSize="16px" />
        ) : status.status === 'failed' || status.status === 'error' || status.status === 'partial' ? (
          <Icon as={FiX} fontSize="16px" />
        ) : status.status === 'skipped' ? (
          <Icon as={FiArrowRight} fontSize="14px" />
        ) : (status.status === 'in-progress' || status.status === 'loading') ? (
          <Spinner size="xs" color="white" thickness="2px" speed="0.8s" />
        ) : (
          <Box as="span" fontSize="12px" fontFamily="monospace">
            {status.retryCount > 0 ? status.retryCount : ''}
          </Box>
        )}
      </Box>
      
      <Box flex="1" zIndex={1}>
        <Text 
          color={(status.status === 'in-progress' || status.status === 'loading') ? '#00FFFF' : 
                status.status === 'completed' || status.status === 'success' ? '#00FF8C' : 
                status.status === 'failed' || status.status === 'error' ? '#FF3300' : 
                status.status === 'skipped' ? '#FFCC00' : '#AAAAAA'} 
          fontWeight={(status.status === 'in-progress' || status.status === 'loading' || 
                      status.status === 'completed' || status.status === 'success') ? 'bold' : 'normal'}
          fontFamily="monospace"
          textShadow={(status.status === 'in-progress' || status.status === 'loading') ? '0 0 5px rgba(0, 255, 255, 0.5)' : 
                      status.status === 'completed' || status.status === 'success' ? '0 0 5px rgba(0, 255, 140, 0.5)' : 
                      status.status === 'failed' || status.status === 'error' ? '0 0 5px rgba(255, 51, 0, 0.5)' : 
                      status.status === 'skipped' ? '0 0 5px rgba(255, 204, 0, 0.5)' : 'none'}
        >
          {getStepLabel(step)}
        </Text>
        
        {status.error && (
          <Text 
            color="#FF6650" 
            fontSize="xs" 
            mt={1}
            fontFamily="monospace"
            textShadow="0 0 5px rgba(255, 102, 80, 0.5)"
          >
            Error: {status.error.substring(0, 60)}{status.error.length > 60 ? '...' : ''}
          </Text>
        )}
      </Box>
      
      {(status.status === 'in-progress' || status.status === 'loading') && (
        <HStack spacing={2} ml="auto" zIndex={1}>
          <Text 
            color="#00FFFF" 
            fontSize="sm" 
            fontWeight="bold"
            fontFamily="monospace"
            textShadow="0 0 5px rgba(0, 255, 255, 0.5)"
          >
            {progress}%
          </Text>
          <Spinner size="sm" color="#00FFFF" speed="0.8s" emptyColor="rgba(0, 255, 255, 0.2)" />
        </HStack>
      )}
      
      {(status.status === 'completed' || status.status === 'success') && (
        <Text 
          color="#00FF8C" 
          fontSize="sm" 
          ml="auto" 
          fontWeight="bold" 
          zIndex={1}
          fontFamily="monospace"
          textShadow="0 0 5px rgba(0, 255, 140, 0.5)"
        >
          {progress}%
        </Text>
      )}
    </Flex>
  );
};

export default StepIndicator; 