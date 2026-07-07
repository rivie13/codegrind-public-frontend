import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ResolutionWarning = ({ problemId }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [screenInfo, setScreenInfo] = useState({ width: 0, height: 0 });
  
  // Check for the resolution on component mount or when problemId changes
  useEffect(() => {
    const checkResolution = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenInfo({ width, height });
      
      // Show warning for 1440p (2560x1440) or 4K (3840x2160) and similar high resolutions
      const isHighResolution = width > 1920 || height > 1080;
      
      // Instead of using localStorage permanently, we'll use a session-based approach
      // with a unique key per problem to ensure the warning appears for each new problem
      const warningKey = `td_resolution_warning_${problemId || 'default'}`;
      const hasAcknowledgedThisProblem = sessionStorage.getItem(warningKey) === 'true';
      
      setShowWarning(isHighResolution && !hasAcknowledgedThisProblem);
    };
    
    checkResolution();
    
    // Also check on resize
    window.addEventListener('resize', checkResolution);
    return () => window.removeEventListener('resize', checkResolution);
  }, [problemId]); // Re-run when problemId changes
  
  const handleAcknowledge = () => {
    // Store acknowledgment for this specific problem in sessionStorage
    const warningKey = `td_resolution_warning_${problemId || 'default'}`;
    sessionStorage.setItem(warningKey, 'true');
    setShowWarning(false);
  };
  
  if (!showWarning) return null;
  
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="10000"
      backdropFilter="blur(5px)"
      bg="rgba(0, 0, 0, 0.8)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="4"
    >
      <Box
        bg="#0a0e17"
        borderRadius="md"
        border="2px solid #00ccff"
        p={6}
        maxWidth="600px"
        boxShadow="0 0 30px rgba(0, 204, 255, 0.5)"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: '-1px',
          left: '-1px',
          right: '-1px',
          bottom: '-1px',
          borderRadius: 'md',
          padding: '1px',
          background: 'linear-gradient(45deg, #00ccff, #00ff8c)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
      >
        <Flex direction="column" align="center" gap={4}>
          <Flex align="center" gap={3}>
            <FaExclamationTriangle size="28px" color="#ff9100" />
            <Heading 
              color="#ff9100" 
              size="lg"
              fontFamily="'Orbitron', sans-serif"
              textShadow="0 0 10px rgba(255, 145, 0, 0.7)"
            >
              HIGH RESOLUTION DETECTED
            </Heading>
          </Flex>
          
          <Text color="#00ccff" fontSize="md" textAlign="center">
            Your screen resolution is <strong>{screenInfo.width}x{screenInfo.height}</strong>
          </Text>
          
          <Text color="#fff" textAlign="center" fontSize="md">
            <strong>NOTICE:</strong> CODE BREACH is currently in BETA and not yet optimized for high resolution displays (1440p/4K).
          </Text>
          
          <Text color="#fff" textAlign="center" fontSize="md">
            You may experience reduced graphics quality or performance issues at your current resolution.
          </Text>
          
          <Text color="#00ff8c" fontWeight="bold" textAlign="center" fontSize="md">
            For the best gaming experience, we recommend playing at 1080p resolution.
          </Text>
          
          <Button
            mt={2}
            colorScheme="orange"
            onClick={handleAcknowledge}
            fontFamily="'Orbitron', sans-serif"
            size="lg"
            boxShadow="0 0 15px rgba(255, 145, 0, 0.5)"
            _hover={{
              boxShadow: "0 0 25px rgba(255, 145, 0, 0.8)",
              transform: "scale(1.05)"
            }}
          >
            I ACKNOWLEDGE
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default ResolutionWarning; 