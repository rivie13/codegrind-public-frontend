import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const CurrentStatus = ({ displayTier, onManageBilling }) => (
  <VStack spacing={{ base: 3, md: 4 }} w="100%">
    <Heading
      fontSize={{ base: 'xl', md: '2xl' }}
      color="var(--cg-text)"
      fontFamily="var(--cg-font-retro-display)"
      textAlign="center"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      Current plan: {displayTier}
    </Heading>

    <Box
      bg="var(--cg-panel-shell)"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
      p={{ base: 4, md: 4 }}
      w="100%"
    >
      <Text
        color={displayTier === 'FREE' ? 'var(--cg-text)' : 'var(--cg-accent-green)'}
        textAlign="center"
        fontFamily="var(--cg-font-retro-display)"
        fontSize={{ base: 'md', md: 'lg' }}
      >
        {displayTier === 'FREE'
          ? 'All content is free. You have basic rate limits and can refresh access through ads.'
          : 'All content stays free. Your plan removes ads and boosts rate limits.'}
      </Text>
    </Box>
    {displayTier !== 'FREE' && (
      <Button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          onManageBilling();
        }}
        size={{ base: 'md', md: 'md' }}
        color="var(--cg-link)"
        fontFamily="var(--cg-font-retro-display)"
        w={{ base: '100%', sm: 'auto' }}
        minH="44px"
      >
        Manage Billing
      </Button>
    )}
  </VStack>
);

export default CurrentStatus;
