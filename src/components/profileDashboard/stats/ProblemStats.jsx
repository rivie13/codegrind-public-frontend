import { Box, Grid, Heading, Progress, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import CategorySelector from './CategorySelector';

const DIFFICULTY_META = {
  easy: {
    label: 'Easy Problems',
    color: 'var(--cg-accent-green)',
    bar: 'linear-gradient(90deg, #7ea77d, var(--cg-accent-green))',
  },
  medium: {
    label: 'Medium Problems',
    color: 'var(--cg-accent-amber)',
    bar: 'linear-gradient(90deg, #c7aa4c, var(--cg-accent-amber))',
  },
  hard: {
    label: 'Hard Problems',
    color: 'var(--cg-accent-red)',
    bar: 'linear-gradient(90deg, #b15a5a, var(--cg-accent-red))',
  },
};

const ProblemStats = ({ userData, selectedCategory, setSelectedCategory }) => {
  if (!userData) return null;

  // Helper function to get stats based on selected category
  const getStats = () => {
    switch (selectedCategory) {
      case 'interview':
        return {
          easy: userData.stats.easySolved || 0,
          medium: userData.stats.mediumSolved || 0,
          hard: userData.stats.hardSolved || 0,
          easyProgress: userData.stats.easyProgress || 0,
          mediumProgress: userData.stats.mediumProgress || 0,
          hardProgress: userData.stats.hardProgress || 0,
        };
      case 'interview-td':
        return (
          userData.stats.interviewTD || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
          }
        );
      case 'ai':
        return (
          userData.stats.aiProblems || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
          }
        );
      case 'ai-td':
        return (
          userData.stats.aiProblemsTD || {
            easy: 0,
            medium: 0,
            hard: 0,
            easyProgress: 0,
            mediumProgress: 0,
            hardProgress: 0,
          }
        );
      default:
        return {
          easy: 0,
          medium: 0,
          hard: 0,
          easyProgress: 0,
          mediumProgress: 0,
          hardProgress: 0,
        };
    }
  };

  const stats = getStats();

  return (
    <Box>
      <Text color="var(--cg-muted)" fontSize="sm" fontFamily="var(--cg-font-retro-display)" mb={3}>
        Filter solve totals across interview, AI, and tower-defense tracks.
      </Text>

      {/* Category selector */}
      <CategorySelector
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      <VStack align="stretch" spacing={6} mt={2}>
        {['easy', 'medium', 'hard'].map((key) => (
          <Box
            key={key}
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            p={3}
          >
            <Text
              color={DIFFICULTY_META[key].color}
              mb={2}
              fontSize="sm"
              fontFamily="var(--cg-font-retro-display)"
              display="flex"
              flexDirection={{ base: 'column', sm: 'row' }}
              alignItems={{ base: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
              gap={2}
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              <span>{DIFFICULTY_META[key].label}</span>
              <Box
                as="span"
                bg="var(--cg-window-face)"
                px={2}
                py={1}
                border="1px solid var(--cg-window-shadow)"
                boxShadow="var(--cg-window-outset)"
                color="var(--cg-text)"
              >
                {stats[key]} solved
              </Box>
            </Text>
            <Progress
              value={stats[`${key}Progress`] || 0}
              bg="var(--cg-window-face)"
              borderRadius="0"
              height="10px"
              sx={{
                boxShadow: 'var(--cg-window-inset)',
                '& > div': {
                  background: DIFFICULTY_META[key].bar,
                },
              }}
            />
          </Box>
        ))}

        <Box mt={2} pt={4} borderTop="1px solid var(--cg-window-dark)">
          <Heading
            size="sm"
            color="var(--cg-link)"
            fontFamily="var(--cg-font-retro-display)"
            mb={4}
          >
            Tower Defense Stats
          </Heading>
          <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={4}>
            <Box
              bg="var(--cg-panel-shell)"
              p={3}
              borderRadius="0"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              textAlign="center"
            >
              <Text
                color="var(--cg-muted)"
                fontSize="xs"
                mb={1}
                fontFamily="var(--cg-font-retro-display)"
              >
                UNIQUE.VICTORIES
              </Text>
              <Text
                color="var(--cg-link)"
                fontSize="xl"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
              >
                {userData?.stats?.towerDefenseWins || 0}
              </Text>
            </Box>
            <Box
              bg="var(--cg-panel-shell)"
              p={3}
              borderRadius="0"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              textAlign="center"
            >
              <Text
                color="var(--cg-muted)"
                fontSize="xs"
                mb={1}
                fontFamily="var(--cg-font-retro-display)"
              >
                HIGH.SCORE
              </Text>
              <Text
                color="var(--cg-link)"
                fontSize="xl"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
              >
                {userData?.stats?.towerDefenseHighScore || 0}
              </Text>
            </Box>
            <Box
              bg="var(--cg-panel-shell)"
              p={3}
              borderRadius="0"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              textAlign="center"
            >
              <Text
                color="var(--cg-muted)"
                fontSize="xs"
                mb={1}
                fontFamily="var(--cg-font-retro-display)"
              >
                PERFECT.WINS
              </Text>
              <Text
                color="var(--cg-link)"
                fontSize="xl"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
              >
                {userData?.stats?.towerDefensePerfectWins || 0}
              </Text>
            </Box>
          </Grid>
        </Box>
      </VStack>
    </Box>
  );
};

export default ProblemStats;
