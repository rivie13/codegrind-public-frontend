import { Box, Stat, StatGroup, StatLabel, StatNumber, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

const MotionBox = motion(Box);

const StatsSummary = ({ userData }) => {
  if (!userData) return null;

  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <Box className="cg-panel-window" overflow="hidden">
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="700" letterSpacing="0.08em">
            PROFILE STATS
          </Text>
        </Box>
        <StatGroup
          bg="rgba(255,255,255,0.14)"
          p={{ base: 4, md: 6 }}
          textAlign="center"
          position="relative"
          overflow="hidden"
          flexDirection={{ base: 'column', md: 'row' }}
          gap={{ base: 4, md: 4 }}
        >
          <Stat
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            p={3}
          >
            <StatLabel
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
            >
              PROBLEMS.SOLVED
            </StatLabel>
            <MotionBox
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <StatNumber color="var(--cg-accent-green)" fontFamily="var(--cg-font-retro-display)">
                {userData?.stats?.problemsSolved || 0}
              </StatNumber>
            </MotionBox>
          </Stat>
          <Stat
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            p={3}
          >
            <StatLabel
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
            >
              SUCCESS.RATE
            </StatLabel>
            <MotionBox
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
            >
              <StatNumber color="var(--cg-accent-green)" fontFamily="var(--cg-font-retro-display)">
                {userData?.stats?.successRate || 0}%
              </StatNumber>
            </MotionBox>
          </Stat>
          <Stat
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            p={3}
          >
            <StatLabel
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
            >
              CURRENT.STREAK
            </StatLabel>
            <MotionBox
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
            >
              <StatNumber color="var(--cg-accent-green)" fontFamily="var(--cg-font-retro-display)">
                {userData?.stats?.streak || 0} days
              </StatNumber>
            </MotionBox>
          </Stat>
          <Stat
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            p={3}
          >
            <StatLabel
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
            >
              DATA.PACKETS
            </StatLabel>
            <MotionBox
              animate={{ y: [0, -1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
            >
              <StatNumber color="var(--cg-accent-blue)" fontFamily="var(--cg-font-retro-display)">
                {Number.isFinite(Number(userData?.dataPackets)) ? userData.dataPackets : '—'}
              </StatNumber>
            </MotionBox>
          </Stat>
        </StatGroup>
      </Box>

      <Text
        mt={2}
        fontFamily="var(--cg-font-retro-display)"
        fontSize="xs"
        color="var(--cg-muted)"
        textAlign="center"
      >
        Streak counts consecutive days with at least one accepted solve. Missing a day resets it.
      </Text>
    </MotionBox>
  );
};

export default StatsSummary;
