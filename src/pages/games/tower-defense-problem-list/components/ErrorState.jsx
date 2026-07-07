import { Box, Button, Heading, Text } from '@chakra-ui/react';

function ErrorState({ error, onRetry }) {
  return (
    <Box
      textAlign="center"
      my={8}
      py={8}
      px={{ base: 4, md: 6 }}
      bg="var(--cg-window-face)"
      border="1px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
    >
      <Box
        width="56px"
        height="56px"
        display="grid"
        placeItems="center"
        margin="0 auto"
        mb={4}
        bg="rgba(139, 31, 31, 0.12)"
        border="1px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-inset)"
      >
        <Text fontSize="2xl" fontWeight="700" color="var(--cg-accent-red)">
          !
        </Text>
      </Box>

      <Heading
        color="var(--cg-accent-red)"
        size="md"
        mb={3}
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        Catalog Load Failed
      </Heading>

      <Text
        color="var(--cg-text)"
        mb={5}
        maxW="500px"
        mx="auto"
        p={3}
        bg="var(--cg-window)"
        border="1px solid var(--cg-window-shadow)"
        boxShadow="var(--cg-window-inset)"
      >
        {error}
      </Text>

      <Button onClick={onRetry} color="var(--cg-accent-red)">
        Retry Connection
      </Button>
    </Box>
  );
}

export default ErrorState;
