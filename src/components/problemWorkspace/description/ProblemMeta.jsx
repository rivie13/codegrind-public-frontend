import { Badge, Box, HStack, Text } from '@chakra-ui/react';

const getDifficultyTone = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return {
        color: 'var(--cg-accent-green)',
        bg: 'rgba(36, 106, 42, 0.14)',
      };
    case 'medium':
      return {
        color: 'var(--cg-accent-amber)',
        bg: 'rgba(118, 81, 0, 0.14)',
      };
    case 'hard':
      return {
        color: 'var(--cg-accent-red)',
        bg: 'rgba(139, 31, 31, 0.14)',
      };
    default:
      return {
        color: 'var(--cg-link)',
        bg: 'rgba(10, 56, 154, 0.12)',
      };
  }
};

const ProblemMeta = ({ problemData }) => {
  const classicReferenceName =
    problemData?.metadata?.referenceName || problemData?.metaData?.referenceName || null;
  const difficultyTone = getDifficultyTone(problemData?.difficulty);
  const displayNumber =
    problemData?.questionFrontendId || problemData?.questionId || problemData?.displayNumber;

  return (
    <Box
      w="100%"
      overflowX="auto"
      bg="rgba(255,255,255,0.18)"
      p={4}
      border="1px solid var(--cg-window-dark)"
      boxShadow="var(--cg-window-inset)"
    >
      <Box minWidth="max-content">
        <HStack
          justify="space-between"
          align={{ base: 'start', md: 'center' }}
          mb={2}
          spacing={3}
          flexWrap="wrap"
        >
          <Text
            color="var(--cg-text)"
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="700"
            lineHeight="1.4"
          >
            {displayNumber ? `${displayNumber}. ` : ''}
            {problemData?.title}
          </Text>
          <Badge
            px={3}
            py={1}
            bg={difficultyTone.bg}
            color={difficultyTone.color}
            border="1px solid var(--cg-window-dark)"
            boxShadow="var(--cg-window-outset)"
            fontSize="xs"
            fontWeight="700"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            {problemData?.difficulty}
          </Badge>
        </HStack>
        <Text
          color="var(--cg-muted)"
          fontSize="sm"
          textTransform="uppercase"
          letterSpacing="0.08em"
          fontWeight="700"
        >
          CATEGORY: {problemData?.category || problemData?.problemType || 'General'}
        </Text>
        {classicReferenceName && (
          <Text mt={1} color="var(--cg-link)" fontSize="xs">
            Relates to classic interview problem: {classicReferenceName}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default ProblemMeta;
