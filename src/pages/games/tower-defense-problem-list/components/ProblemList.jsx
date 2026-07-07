import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG } from '../../../../data/classicReferenceSlugByCyberSlug';

const MotionBox = motion(Box);

const DIFFICULTY_TONES = {
  EASY: {
    color: 'var(--cg-accent-green)',
    bg: 'rgba(36, 106, 42, 0.14)',
  },
  MEDIUM: {
    color: 'var(--cg-accent-amber)',
    bg: 'rgba(118, 81, 0, 0.14)',
  },
  HARD: {
    color: 'var(--cg-accent-red)',
    bg: 'rgba(139, 31, 31, 0.14)',
  },
  DEFAULT: {
    color: 'var(--cg-link)',
    bg: 'rgba(10, 56, 154, 0.12)',
  },
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

const formatReferenceSlug = (slug) => {
  if (!slug) return null;
  return slug
    .split('-')
    .map((w) => {
      const firstAlpha = w.search(/[a-zA-Z]/);
      if (firstAlpha > 0) {
        return (
          w.slice(0, firstAlpha) + w.charAt(firstAlpha).toUpperCase() + w.slice(firstAlpha + 1)
        );
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
};

const getCanonicalName = (problem) =>
  problem?.metadata?.referenceName ||
  formatReferenceSlug(CLASSIC_REFERENCE_SLUG_BY_CYBER_SLUG[problem?.titleSlug]) ||
  null;

function ProblemList({ problems, currentPage = 1, pageSize = 10 }) {
  const getDifficultyTone = (difficulty) =>
    DIFFICULTY_TONES[String(difficulty || '').toUpperCase()] || DIFFICULTY_TONES.DEFAULT;

  const getDisplayNumber = (problem, index) => {
    const explicitNumber =
      problem?.questionFrontendId ||
      problem?.displayNumber ||
      problem?.questionId ||
      problem?.metadata?.frontendQuestionId ||
      problem?.metaData?.frontendQuestionId;

    if (explicitNumber !== null && explicitNumber !== undefined && String(explicitNumber).trim()) {
      return String(explicitNumber).trim();
    }

    return String((currentPage - 1) * pageSize + index + 1);
  };

  return (
    <VStack
      spacing={4}
      align="stretch"
      as={motion.div}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {problems.length > 0 ? (
        problems.map((problem, index) => (
          <MotionBox
            key={problem.titleSlug || index}
            variants={item}
            p={{ base: 4, md: 5 }}
            bg="var(--cg-window-face)"
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-outset)"
            _hover={{
              bg: 'rgba(255,255,255,0.22)',
              transform: 'translateY(-2px)',
            }}
            transition="all 0.3s"
          >
            <Flex
              justify="space-between"
              align={{ base: 'stretch', lg: 'center' }}
              gap={4}
              direction={{ base: 'column', lg: 'row' }}
            >
              <Box>
                <Text
                  color="var(--cg-muted)"
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  mb={1}
                >
                  Target {getDisplayNumber(problem, index)}
                </Text>
                <Text
                  as={Link}
                  to={`/games/tower-defense/${problem.titleSlug}`}
                  color="var(--cg-accent-blue)"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="700"
                  lineHeight="1.3"
                >
                  {problem.title}
                </Text>
                {getCanonicalName(problem) && (
                  <Text color="var(--cg-muted)" fontSize="xs" mt={1} mb={3}>
                    Reference: {getCanonicalName(problem)}
                  </Text>
                )}

                <HStack spacing={3} flexWrap="wrap" mb={3}>
                  <Text
                    color={getDifficultyTone(problem.difficulty).color}
                    fontWeight="bold"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    display="inline-block"
                    px={2}
                    py={1}
                    bg={getDifficultyTone(problem.difficulty).bg}
                    border="1px solid var(--cg-window-dark)"
                    boxShadow="var(--cg-window-inset)"
                  >
                    {problem.difficulty || 'UNKNOWN'}
                  </Text>

                  {problem.successRate !== undefined && (
                    <Text color="var(--cg-muted)" fontSize="xs">
                      Success Rate: {(problem.successRate * 100).toFixed(1)}%
                    </Text>
                  )}
                </HStack>

                {problem.shortDescription && (
                  <Text color="var(--cg-text)" noOfLines={2} fontSize="sm" lineHeight="1.7">
                    {problem.shortDescription}
                  </Text>
                )}
              </Box>

              <Button
                as={Link}
                to={`/games/tower-defense/${problem.titleSlug}`}
                size="sm"
                color="var(--cg-accent-blue)"
                fontSize="xs"
                px={4}
                alignSelf={{ base: 'flex-start', lg: 'center' }}
              >
                Open Breach
              </Button>
            </Flex>
          </MotionBox>
        ))
      ) : (
        <Box
          textAlign="center"
          my={12}
          p={8}
          bg="var(--cg-window-face)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
        >
          <Text color="var(--cg-accent-red)" fontSize="sm">
            No targets match the current security-level filter.
          </Text>
        </Box>
      )}
    </VStack>
  );
}

export default ProblemList;
