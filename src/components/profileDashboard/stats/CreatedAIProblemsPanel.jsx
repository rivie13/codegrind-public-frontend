import { Badge, Box, Button, Flex, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const getDifficultyTone = (difficulty) => {
  if (difficulty === 'easy') return 'var(--cg-accent-green)';
  if (difficulty === 'medium') return 'var(--cg-accent-amber)';
  return 'var(--cg-accent-red)';
};

const CreatedAIProblemsPanel = ({ createdAiProblems = [], createdAiProblemsTotal = 0 }) => {
  const navigate = useNavigate();
  const problems = createdAiProblems || [];

  return (
    <Box className="cg-panel-window" overflow="hidden">
      <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
          ai_created.idx
        </Text>
      </Box>

      <Box p={{ base: 4, md: 6 }} bg="rgba(255,255,255,0.14)">
        <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
          <Heading size="sm" color="var(--cg-link)" fontFamily="var(--cg-font-retro-display)">
            AI problem library
          </Heading>
          <HStack
            spacing={2}
            flexWrap="wrap"
            justify={{ base: 'flex-start', sm: 'flex-end' }}
            width={{ base: '100%', md: 'auto' }}
          >
            <Badge
              bg="var(--cg-window-face)"
              color="var(--cg-link)"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="0"
            >
              {createdAiProblemsTotal} TOTAL
            </Badge>
            <Button
              size="sm"
              bg="var(--cg-window-face)"
              color="var(--cg-link)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
              _active={{ boxShadow: 'var(--cg-window-inset)' }}
              onClick={() => navigate('/ai-problems/create')}
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
              width={{ base: '100%', sm: 'auto' }}
              textTransform="uppercase"
              letterSpacing="0.05em"
            >
              Create New
            </Button>
          </HStack>
        </Flex>

        {problems.length === 0 ? (
          <Box
            p={6}
            bg="var(--cg-panel-shell)"
            borderRadius="0"
            border="1px dashed var(--cg-window-dark)"
            boxShadow="var(--cg-window-inset)"
            textAlign="center"
          >
            <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)" fontSize="sm">
              No AI problems created yet.
            </Text>
            <Button
              mt={4}
              size="sm"
              bg="var(--cg-window-face)"
              color="var(--cg-accent-amber)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
              onClick={() => navigate('/ai-problems/create')}
              fontFamily="var(--cg-font-retro-display)"
              fontSize="xs"
              width={{ base: '100%', sm: 'auto' }}
              textTransform="uppercase"
            >
              Create First
            </Button>
          </Box>
        ) : (
          <VStack align="stretch" spacing={4}>
            {problems.map((problem) => {
              const difficulty = problem.difficulty || 'medium';
              const difficultyColor = getDifficultyTone(difficulty);

              return (
                <Box
                  key={problem.id}
                  p={4}
                  bg="var(--cg-panel-shell)"
                  border="1px solid var(--cg-window-shadow)"
                  boxShadow="var(--cg-window-inset)"
                  borderRadius="0"
                  borderLeft="4px"
                  borderLeftColor={difficultyColor}
                  _hover={{
                    bg: 'rgba(255,255,255,0.35)',
                  }}
                  transition="background 0.2s ease"
                >
                  <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        color={difficultyColor}
                        fontFamily="var(--cg-font-retro-display)"
                        textTransform="uppercase"
                        letterSpacing="0.04em"
                      >
                        {problem.displayNumber ? `AI-${problem.displayNumber}` : `AI-${problem.id}`}{' '}
                        • {problem.title}
                      </Text>
                      <HStack
                        spacing={2}
                        mt={2}
                        color="var(--cg-muted)"
                        fontSize="sm"
                        flexWrap="wrap"
                      >
                        <Badge
                          bg="var(--cg-window-face)"
                          border="1px solid var(--cg-window-shadow)"
                          boxShadow="var(--cg-window-outset)"
                          color={difficultyColor}
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="xs"
                          borderRadius="0"
                        >
                          {difficulty.toUpperCase()}
                        </Badge>
                        {problem.aiModel && (
                          <Badge
                            bg="var(--cg-window-face)"
                            color="var(--cg-link)"
                            border="1px solid var(--cg-window-shadow)"
                            boxShadow="var(--cg-window-outset)"
                            fontFamily="var(--cg-font-retro-display)"
                            fontSize="xs"
                            borderRadius="0"
                          >
                            {problem.aiModel}
                          </Badge>
                        )}
                        {problem.createdAt && (
                          <Text fontFamily="var(--cg-font-retro-display)" fontSize="xs">
                            {new Date(problem.createdAt).toLocaleDateString()}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                    <Button
                      size="sm"
                      bg="var(--cg-window-face)"
                      color="var(--cg-link)"
                      border="2px solid var(--cg-window-shadow)"
                      boxShadow="var(--cg-window-outset)"
                      _hover={{ bg: 'rgba(255,255,255,0.2)' }}
                      onClick={() => navigate(`/ai-problems/${problem.titleSlug}`)}
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="xs"
                      width={{ base: '100%', sm: 'auto' }}
                      textTransform="uppercase"
                    >
                      Open Problem
                    </Button>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
};

export default CreatedAIProblemsPanel;
