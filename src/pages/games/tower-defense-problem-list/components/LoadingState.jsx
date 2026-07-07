import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

function LoadingState() {
  return (
    <Box
      textAlign="center"
      py={12}
      px={{ base: 4, md: 6 }}
      bg="var(--cg-window-face)"
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
    >
      <VStack spacing={4}>
        <Box
          width="56px"
          height="56px"
          display="grid"
          placeItems="center"
          bg="var(--cg-window)"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          color="var(--cg-accent-blue)"
        >
          <Spinner thickness="4px" speed="0.8s" color="currentColor" emptyColor="transparent" />
        </Box>
        <Text
          color="var(--cg-accent-blue)"
          fontSize="lg"
          fontWeight="700"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          Scanning Target Catalog
        </Text>
        <Text color="var(--cg-text)" maxW="42ch" lineHeight="1.7">
          Fetching the latest breach-ready interview and AI problem metadata.
        </Text>
      </VStack>
    </Box>
  );
}

export default LoadingState;
