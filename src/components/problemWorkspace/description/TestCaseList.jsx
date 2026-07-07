import { Box, Text, VStack } from '@chakra-ui/react';

const TestCaseList = ({ examples }) => {
  if (!examples?.length) return null;

  return (
    <VStack spacing={4} align="stretch">
      {examples.map((example, index) => (
        <Box
          key={index}
          p={4}
          bg="rgba(255,255,255,0.18)"
          border="1px solid var(--cg-window-dark)"
          boxShadow="var(--cg-window-inset)"
        >
          <Text
            fontWeight="700"
            color="var(--cg-accent-green)"
            mb={2}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Example {index + 1}
          </Text>
          <Box
            fontSize="sm"
            color="var(--cg-text)"
            bg="rgba(0,0,0,0.12)"
            p={3}
            border="1px solid var(--cg-window-dark)"
            boxShadow="var(--cg-window-inset)"
            sx={{
              strong: {
                color: 'var(--cg-link)',
                fontWeight: '700',
              },
              code: {
                bg: 'rgba(0,0,0,0.12)',
                px: 1,
                py: 0.5,
                border: '1px solid var(--cg-window-dark)',
                color: 'var(--cg-accent-green)',
              },
            }}
            dangerouslySetInnerHTML={{ __html: example }}
          />
        </Box>
      ))}
    </VStack>
  );
};

export default TestCaseList;
