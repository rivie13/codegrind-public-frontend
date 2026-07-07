import React, { useEffect, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

export default function InvalidPlacementOverlay() {
  const [activeCoords, setActiveCoords] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleInvalidPlacement = (e) => {
      const { row, col } = e.detail || {};
      setActiveCoords({ row, col, timestamp: Date.now() });

      // Play glitch sound
      const audio = new Audio('/assets/sounds/ui/error-glitch.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    };

    window.addEventListener('td-invalid-placement-attempt', handleInvalidPlacement);
    return () => {
      window.removeEventListener('td-invalid-placement-attempt', handleInvalidPlacement);
    };
  }, []);

  useEffect(() => {
    if (!activeCoords) return;

    const timer = setTimeout(() => {
      setActiveCoords(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [activeCoords]);

  return (
    <AnimatePresence>
      {activeCoords && (
        <MotionBox
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={50}
          pointerEvents="none"
          display="flex"
          alignItems="center"
          justifyContent="center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {/* Full screen red flash */}
          <Box
            position="absolute"
            inset="0"
            bg="rgba(255, 0, 0, 0.15)"
            animation="glitch-flash 0.2s steps(2) infinite"
          />

          <MotionBox
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            bg="rgba(20, 0, 0, 0.9)"
            border="2px solid #ff0000"
            boxShadow="0 0 30px rgba(255, 0, 0, 0.6)"
            p={6}
            borderRadius="8px"
            position="relative"
          >
            <VStack spacing={2}>
              <Text
                fontFamily="'Orbitron', sans-serif"
                fontSize="3xl"
                fontWeight="900"
                color="#ff0000"
                textShadow="0 0 10px rgba(255, 0, 0, 0.8), 2px 2px 0px rgba(0, 255, 255, 0.5)"
                letterSpacing="0.1em"
              >
                INVALID SECTOR
              </Text>
              <Text
                fontFamily="'Share Tech Mono', monospace"
                fontSize="md"
                color="#ff6666"
                textTransform="uppercase"
              >
                Target coordinates [{activeCoords.col}, {activeCoords.row}] restricted
              </Text>
            </VStack>
          </MotionBox>
        </MotionBox>
      )}
    </AnimatePresence>
  );
}
