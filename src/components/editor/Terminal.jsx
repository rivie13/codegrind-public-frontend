import { Box, Spinner, Text } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef, useState } from 'react';
import BottomBannerAd from '../ads/BottomBannerAd';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeExecutionDisplayText } from '../../utils/ui/userFacingErrors';
import './Terminal.css';

// Define keyframe animations for cyberpunk terminal effects
const scanLineAnimation = keyframes`
  0% { transform: translateY(0); opacity: 0.2 }
  50% { opacity: 0.3 }
  100% { transform: translateY(100%); opacity: 0.2 }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 255, 140, 0.3); }
  50% { box-shadow: 0 0 15px rgba(0, 255, 140, 0.5); }
  100% { box-shadow: 0 0 5px rgba(0, 255, 140, 0.3); }
`;

const Terminal = ({
  executionResult,
  isLoading = false,
  showAd = false,
  adSlotId = '9351579126',
  terminalHeight = '100%',
}) => {
  const auth = useAuth();
  const user = auth?.user;
  const [showCursor, setShowCursor] = useState(true);
  const terminalContentRef = useRef(null);
  const shouldShowAd = useMemo(() => {
    if (!showAd) return false;
    const storedTier =
      typeof window !== 'undefined' ? localStorage.getItem('membership_tier') : null;
    const rawTier = (user?.membershipTier || storedTier || 'FREE').toUpperCase();
    const normalizedTier = rawTier === 'PRO' ? 'PREMIUM' : rawTier;
    const isAdFree = normalizedTier.includes('PREMIUM') || normalizedTier.includes('UNLIMITED');
    return !isAdFree;
  }, [showAd, user?.membershipTier]);

  // Add blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (terminalContentRef.current) {
      terminalContentRef.current.scrollTop = terminalContentRef.current.scrollHeight;
    }
  }, [executionResult]);

  // Process the execution result to properly render HTML
  const processResult = () => {
    if (!executionResult) {
      return 'Run your code to see the output here...';
    }

    // First sanitize IP addresses from the execution result
    const sanitizedResult = sanitizeExecutionDisplayText(executionResult);

    // Then enhance raw text with spans for highlighting
    let enhancedText = sanitizedResult
      .replace(/✅|success|passed/gi, '<span class="success">$&</span>')
      .replace(/❌|error|failed|fail/gi, '<span class="error">$&</span>')
      .replace(/warning/gi, '<span class="warning">$&</span>')
      .replace(/input:/gi, '<span class="input">$&</span>');

    // The text already contains span tags from the backend,
    // so we'll return it directly for dangerouslySetInnerHTML
    return DOMPurify.sanitize(enhancedText);
  };

  return (
    <Box
      ref={terminalContentRef}
      bg="rgba(0, 0, 0, 0.9)"
      color="#00ff8c"
      p={4}
      pb={10}
      fontFamily="'Courier New', monospace"
      fontSize="sm"
      overflowY="auto"
      overflowX="hidden"
      minH="200px"
      h="100%"
      position="relative"
      className="terminal-content terminal-scrollable"
      border="1px solid rgba(0, 255, 140, 0.3)"
      borderRadius="4px"
      sx={{
        animation: `${pulseGlow} 4s infinite ease-in-out`,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1a1a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 255, 140, 0.5)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 255, 140, 0.7)',
        },
        scrollBehavior: 'smooth',
        '.success': { color: '#00ff8c', textShadow: '0 0 5px rgba(0, 255, 140, 0.7)' },
        '.error': { color: '#ff3860', textShadow: '0 0 5px rgba(255, 56, 96, 0.7)' },
        '.warning': { color: '#ffdd57', textShadow: '0 0 5px rgba(255, 221, 87, 0.7)' },
        '.input': { color: '#00ccff', textShadow: '0 0 5px rgba(0, 204, 255, 0.7)' },
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: '10px',
        left: '10px',
        width: '30px',
        height: '30px',
        border: '1px solid rgba(0, 255, 140, 0.3)',
        borderRight: 'none',
        borderBottom: 'none',
        zIndex: 0,
      }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '30px',
        height: '30px',
        border: '1px solid rgba(0, 255, 140, 0.3)',
        borderLeft: 'none',
        borderTop: 'none',
        zIndex: 0,
      }}
    >
      {/* Digital Grid Background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgImage="linear-gradient(rgba(0, 255, 140, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 140, 0.05) 1px, transparent 1px)"
        bgSize="20px 20px"
        opacity="0.15"
        sx={{
          '@keyframes scrollGrid': {
            '0%': { backgroundPosition: '0 0' },
            '100%': { backgroundPosition: '20px 20px' },
          },
          animation: 'scrollGrid 30s linear infinite',
        }}
        pointerEvents="none"
        zIndex="0"
      />

      {/* Horizontal scan line effect */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="3px"
        bg="rgba(0, 255, 140, 0.2)"
        boxShadow="0 0 5px rgba(0, 255, 140, 0.5)"
        sx={{
          animation: `${scanLineAnimation} 3s linear infinite`,
        }}
        pointerEvents="none"
        zIndex="1"
      />

      {isLoading ? (
        <Box
          display="flex"
          alignItems="center"
          gap={3}
          justifyContent="flex-start"
          mb={2}
          position="relative"
          zIndex="2"
        >
          <Spinner color="#00ff8c" size="sm" thickness="2px" speed="0.8s" />
          <Text
            color="#00ff8c"
            fontFamily="'Orbitron', monospace"
            fontSize="sm"
            letterSpacing="1px"
            textShadow="0 0 5px rgba(0, 255, 140, 0.5)"
          >
            INITIALIZING CODE SUBMISSION...
          </Text>
        </Box>
      ) : null}

      <Box position="relative" zIndex="2">
        {/* Use dangerouslySetInnerHTML to render the HTML content */}
        <Box
          mb={2}
          css={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: processResult() }}
        />

        {!isLoading && (
          <Box
            as="span"
            display="inline-block"
            opacity={showCursor ? 1 : 0}
            position="relative"
            verticalAlign="middle"
            color="#00ff8c"
            sx={{
              textShadow: '0 0 5px rgba(0, 255, 140, 0.7)',
            }}
          >
            █
          </Box>
        )}
      </Box>

      {shouldShowAd && (
        <Box
          position="relative"
          width="100%"
          minHeight="90px"
          mt={4}
          p={2}
          className="terminal-ad-container"
          border="1px dashed rgba(0, 255, 140, 0.3)"
          borderRadius="4px"
          zIndex="2"
        >
          <BottomBannerAd slotId={adSlotId} />
        </Box>
      )}
    </Box>
  );
};

export default Terminal;
