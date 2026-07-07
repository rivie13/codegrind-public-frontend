import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const UI_FONT_FAMILY = "'Tahoma', 'MS Sans Serif', sans-serif";

export default function UniverseRulesOverlay({ isActive, onAcknowledge }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Small delay to let the tower placement action settle
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <AnimatePresence>
      {isVisible && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundColor="rgba(40, 52, 68, 0.28)"
          backdropFilter="blur(3px)"
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={10000}
        >
          <MotionBox
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="cg-panel-window"
            width="90%"
            maxWidth="540px"
            backgroundColor="#d4d0c8"
            borderRadius="0"
            border="2px solid #686868"
            boxShadow="inset 1px 1px 0 rgba(255, 255, 255, 0.82), inset -1px -1px 0 rgba(104, 104, 104, 0.34), 0 10px 25px rgba(0, 0, 0, 0.2)"
            overflow="hidden"
          >
            {/* Title Bar */}
            <Flex
              className="cg-titlebar"
              px={3}
              py={2}
              justifyContent="space-between"
              alignItems="center"
              bg="linear-gradient(90deg, #000080 0%, #0a3ca6 100%)"
              borderBottom="1px solid #081a77"
            >
              <Text
                color="#f5f7ff"
                fontFamily={UI_FONT_FAMILY}
                fontSize="sm"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                universe_rules.exe
              </Text>
              <Text
                color="rgba(245, 247, 255, 0.85)"
                fontFamily={UI_FONT_FAMILY}
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.08em"
                textTransform="uppercase"
              >
                TUTORIAL
              </Text>
            </Flex>

            {/* Content Wrapper */}
            <Box padding="16px" backgroundColor="#d4d0c8">
              {/* Crisp White Inset Dialog Scroll Box */}
              <Box
                bg="#ffffff"
                border="1px solid #7f7f7f"
                boxShadow="var(--cg-window-inset)"
                p={4}
                maxH="380px"
                overflowY="auto"
                display="flex"
                flexDirection="column"
                gap={4}
              >
                {/* Header */}
                <Box borderBottom="1px solid #d4d0c8" pb={2.5}>
                  <Text
                    color="#0a2c9a"
                    fontFamily={UI_FONT_FAMILY}
                    fontSize="md"
                    fontWeight="700"
                    letterSpacing="0.04em"
                    mb={1}
                    textTransform="uppercase"
                  >
                    Universe Rules
                  </Text>
                  <Text
                    color="#000000"
                    fontFamily={UI_FONT_FAMILY}
                    fontSize="xs"
                    fontWeight="700"
                    lineHeight="1.5"
                  >
                    In CodeGrind, your code and your defense are completely synced.
                  </Text>
                </Box>

                {/* Rule 1 */}
                <VStack align="stretch" spacing={1.5}>
                  <Text
                    fontFamily={UI_FONT_FAMILY}
                    fontSize="xs"
                    fontWeight="700"
                    color="#0a2c9a"
                    letterSpacing="0.04em"
                  >
                    1. BIDIRECTIONAL SYNC
                  </Text>
                  <Text fontFamily={UI_FONT_FAMILY} fontSize="xs" color="#000000" lineHeight="1.6">
                    • <strong>Code to Tower:</strong> Press <strong>Enter</strong> to create a new
                    line of code ➔ the terminal suggests a matching defense tower to purchase (e.g.,
                    a for loop or if statement) based on your previous line of code.
                    <br />• <strong>Tower to Code:</strong> Place a tower on the grid ➔ a
                    corresponding code skeleton is automatically injected into your editor. Review
                    and fix up the syntax!
                  </Text>
                </VStack>

                {/* Rule 2 */}
                <VStack align="stretch" spacing={1.5}>
                  <Text
                    fontFamily={UI_FONT_FAMILY}
                    fontSize="xs"
                    fontWeight="700"
                    color="#0a2c9a"
                    letterSpacing="0.04em"
                  >
                    2. CORRECTNESS VS. EFFICIENCY
                  </Text>
                  <Text fontFamily={UI_FONT_FAMILY} fontSize="xs" color="#000000" lineHeight="1.6">
                    • <strong>Correctness:</strong> Your code's logical correctness is what
                    determines if you can face the final wave to beat the level. At the final wave,
                    we run your code against the level's test cases. If it passes, you have to
                    survive the final wave to win. If it fails, you go to an endless nightmare mode
                    where you try to survive as long as possible.
                    <br />• <strong>Runtime & Leaderboards:</strong> While code efficiency does not
                    block survival, your code's execution time (runtime) determines your leaderboard
                    ranking. Optimize your logic to claim the top spot!
                    <br />• <strong>NOTE:</strong> Leaderboard scoring is not available for the
                    learning path problems.
                  </Text>
                </VStack>
              </Box>

              {/* Action Button Footer */}
              <Flex justifyContent="center" mt={4}>
                <Button
                  onClick={() => {
                    setIsVisible(false);
                    setTimeout(onAcknowledge, 300);
                  }}
                  bg="#d4d0c8"
                  color="#000000"
                  fontFamily={UI_FONT_FAMILY}
                  fontWeight="700"
                  fontSize="xs"
                  px={8}
                  py={2.5}
                  borderRadius="0"
                  border="1px solid #7f7f7f"
                  boxShadow="var(--cg-window-outset)"
                  _hover={{ bg: '#ece7de' }}
                  _active={{
                    boxShadow: 'var(--cg-window-inset)',
                    transform: 'translateY(1px)',
                    bg: '#efebe7',
                  }}
                >
                  I Understand
                </Button>
              </Flex>
            </Box>
          </MotionBox>
        </Box>
      )}
    </AnimatePresence>
  );
}
