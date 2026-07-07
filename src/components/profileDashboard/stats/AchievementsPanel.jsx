import { Box, Grid, GridItem, Text } from '@chakra-ui/react';
import React from 'react';

const AchievementsPanel = ({ achievements }) => {
  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          achievements.log
        </Text>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="rgba(255,255,255,0.14)">
        <Text
          color="var(--cg-muted)"
          fontSize="sm"
          fontFamily="var(--cg-font-retro-display)"
          mb={4}
        >
          Unlocked milestones, streak awards, and progress markers from your CodeGrind history.
        </Text>

        <Grid
          templateColumns={{ base: '1fr', sm: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          gap={{ base: 4, md: 6 }}
        >
          {achievements?.map((achievement) => (
            <Box
              key={achievement.id}
              p={4}
              bg="var(--cg-panel-shell)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              borderRadius="0"
              textAlign="center"
              _hover={{
                bg: 'rgba(255,255,255,0.35)',
              }}
              transition="background 0.2s ease"
            >
              <Text fontSize="3xl" mb={2} color="var(--cg-link)">
                {achievement.icon}
              </Text>
              <Text
                color="var(--cg-accent-amber)"
                fontWeight="bold"
                mb={1}
                fontFamily="var(--cg-font-retro-display)"
                textTransform="uppercase"
                letterSpacing="0.04em"
              >
                {achievement.title}
              </Text>
              <Text color="var(--cg-text)" fontSize="sm" fontFamily="var(--cg-font-retro-display)">
                {achievement.description}
              </Text>
              <Text
                color="var(--cg-muted)"
                fontSize="xs"
                mt={2}
                fontFamily="var(--cg-font-retro-display)"
              >
                Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            </Box>
          ))}
          {(!achievements || achievements.length === 0) && (
            <GridItem colSpan={{ base: 1, md: 4 }}>
              <Box
                p={6}
                textAlign="center"
                bg="var(--cg-panel-shell)"
                border="1px dashed var(--cg-window-dark)"
                boxShadow="var(--cg-window-inset)"
              >
                <Text
                  color="var(--cg-link)"
                  fontFamily="var(--cg-font-retro-display)"
                  textTransform="uppercase"
                >
                  Complete challenges to unlock achievements
                </Text>
              </Box>
            </GridItem>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default AchievementsPanel;
