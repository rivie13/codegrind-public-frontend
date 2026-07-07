import { Box, Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const ActivityTimeline = ({ userData }) => {
  if (!userData || !userData.activityTimeline) return null;

  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          activity_timeline.log
        </Text>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="rgba(255,255,255,0.14)">
        <Text
          color="var(--cg-muted)"
          fontSize="sm"
          fontFamily="var(--cg-font-retro-display)"
          mb={4}
        >
          Chronological history of recent solves, attempts, and profile-linked milestones.
        </Text>

        <VStack align="stretch" spacing={4}>
          {userData.activityTimeline.map((activity) => (
            <Box
              key={activity.id}
              p={4}
              bg="var(--cg-panel-shell)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              borderRadius="0"
              borderLeft="4px"
              borderLeftColor={
                activity.details?.status === 'accepted'
                  ? 'var(--cg-accent-green)'
                  : 'var(--cg-accent-red)'
              }
              _hover={{
                bg: 'rgba(255,255,255,0.35)',
              }}
              transition="background 0.2s ease"
            >
              <Text
                color="var(--cg-text)"
                fontSize="lg"
                fontWeight="bold"
                fontFamily="var(--cg-font-retro-display)"
                display="flex"
                alignItems="center"
                mb={3}
                textTransform="uppercase"
                letterSpacing="0.04em"
              >
                {activity.description || 'Unknown Activity'}
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
                <GridItem>
                  <VStack align="stretch" spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Problem:
                      </Text>
                      <Text
                        color="var(--cg-link)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {activity.description?.split(' ').slice(1).join(' ') || 'Unknown'}
                      </Text>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Status:
                      </Text>
                      <Text
                        color={
                          activity.details?.status === 'accepted'
                            ? 'var(--cg-accent-green)'
                            : 'var(--cg-accent-red)'
                        }
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        textTransform="uppercase"
                      >
                        {activity.details?.status || 'Unknown'}
                      </Text>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Difficulty:
                      </Text>
                      <Text
                        color={
                          activity.details?.difficulty === 'easy'
                            ? 'var(--cg-accent-green)'
                            : activity.details?.difficulty === 'medium'
                              ? 'var(--cg-accent-amber)'
                              : 'var(--cg-accent-red)'
                        }
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        textTransform="uppercase"
                      >
                        {activity.details?.difficulty || 'Unknown'}
                      </Text>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Language:
                      </Text>
                      <Text
                        color="var(--cg-accent-amber)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {activity.details?.language || 'Unknown'}
                      </Text>
                    </Box>
                  </VStack>
                </GridItem>
                <GridItem>
                  <VStack align="stretch" spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Mode:
                      </Text>
                      <Box
                        as="span"
                        bg="var(--cg-window-face)"
                        px={2}
                        py={0}
                        borderRadius="0"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                        color={
                          activity.details?.mode === 'tower-defense'
                            ? 'var(--cg-link)'
                            : 'var(--cg-muted)'
                        }
                        border="1px solid var(--cg-window-shadow)"
                        boxShadow="var(--cg-window-inset)"
                        textTransform="uppercase"
                      >
                        {activity.details?.mode || 'freeplay'}
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Text
                        color="var(--cg-muted)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        Date:
                      </Text>
                      <Text
                        color="var(--cg-text)"
                        fontSize="xs"
                        fontFamily="var(--cg-font-retro-display)"
                      >
                        {activity.timestamp
                          ? new Date(activity.timestamp).toLocaleString()
                          : 'Unknown Date'}
                      </Text>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default ActivityTimeline;
