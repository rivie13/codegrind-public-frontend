import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'easy') return 'var(--cg-accent-green)';
  if (difficulty === 'medium') return 'var(--cg-accent-amber)';
  return 'var(--cg-accent-red)';
};

const RecentActivity = ({ userData, handleViewSubmissions }) => {
  if (!userData || !userData.recentActivity) return null;

  return (
    <Box>
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        mb={4}
        gap={3}
        flexWrap="wrap"
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <Heading size="sm" color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
          Recent submission snapshot
        </Heading>
        {handleViewSubmissions && (
          <Button
            size="sm"
            bg="var(--cg-window-face)"
            color="var(--cg-link)"
            border="2px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-outset)"
            _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            _active={{ boxShadow: 'var(--cg-window-inset)' }}
            onClick={handleViewSubmissions}
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            width={{ base: '100%', md: 'auto' }}
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            View All Submissions
          </Button>
        )}
      </Flex>

      <VStack align="stretch" spacing={4}>
        {userData.recentActivity.map((activity) => (
          <Box
            key={activity.id}
            p={4}
            bg="var(--cg-panel-shell)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-inset)"
            borderRadius="0"
            borderLeft="4px"
            borderLeftColor={
              activity.status === 'accepted' ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'
            }
            _hover={{
              bg: 'rgba(255,255,255,0.35)',
            }}
            transition="background 0.2s ease"
          >
            <Text
              fontSize="md"
              fontWeight="semibold"
              color={
                activity.status === 'accepted' ? 'var(--cg-accent-green)' : 'var(--cg-accent-red)'
              }
              fontFamily="var(--cg-font-retro-display)"
              textTransform="uppercase"
              letterSpacing="0.04em"
            >
              {activity.problem}
            </Text>
            <Flex
              color="var(--cg-muted)"
              fontSize="sm"
              mt={2}
              justify="space-between"
              align={{ base: 'flex-start', md: 'center' }}
              gap={2}
              flexWrap="wrap"
              flexDirection={{ base: 'column', md: 'row' }}
            >
              <Text fontFamily="var(--cg-font-retro-display)">
                <Text
                  as="span"
                  color={
                    activity.status === 'accepted'
                      ? 'var(--cg-accent-green)'
                      : 'var(--cg-accent-red)'
                  }
                >
                  {activity.status}
                </Text>{' '}
                • {activity.date ? new Date(activity.date).toLocaleDateString() : 'Unknown Date'}
              </Text>
              {activity.mode && (
                <Box
                  as="span"
                  ml={2}
                  px={2}
                  py={1}
                  borderRadius="0"
                  bg="var(--cg-window-face)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  color={activity.mode === 'tower-defense' ? 'var(--cg-link)' : 'var(--cg-muted)'}
                  textTransform="uppercase"
                >
                  {activity.mode === 'tower-defense'
                    ? 'Tower Defense'
                    : activity.mode.toUpperCase()}
                </Box>
              )}
              {activity.difficulty && (
                <Box
                  as="span"
                  ml={2}
                  px={2}
                  py={1}
                  borderRadius="0"
                  bg="var(--cg-window-face)"
                  fontSize="xs"
                  fontFamily="var(--cg-font-retro-display)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-outset)"
                  color={getDifficultyTone(activity.difficulty)}
                  textTransform="uppercase"
                >
                  {activity.difficulty.toUpperCase()}
                </Box>
              )}
            </Flex>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default RecentActivity;
