import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const PricingHeader = ({
  isAuthenticated,
  displayTier,
  cancelScheduled,
  cancelAtDate,
  onManageBilling,
  onResumeSubscription,
  isResumeLoading,
}) => (
  <Box className="cg-panel-window" overflow="hidden" w="100%" maxW="4xl">
    <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
        membership.exe
      </Text>
    </Box>

    <VStack
      spacing={{ base: 4, md: 6 }}
      textAlign="center"
      w="100%"
      p={{ base: 4, md: 6 }}
      bg="rgba(255,255,255,0.14)"
    >
      <Heading
        fontSize={{ base: '2xl', md: '3xl' }}
        lineHeight={{ base: '1.2', md: '1.1' }}
        color="var(--cg-text)"
        fontFamily="var(--cg-font-retro-display)"
      >
        Membership Plans
      </Heading>
      <Text
        fontSize={{ base: 'md', md: 'xl' }}
        color="var(--cg-muted)"
        fontFamily="var(--cg-font-retro-display)"
        maxW="2xl"
        lineHeight={{ base: '1.6', md: '1.8' }}
        px={{ base: 2, md: 0 }}
      >
        All learning content is free forever. Paid plans remove ads, raise rate limits, and grant
        access to other features not available to free members. Free users can refresh content
        through ads when limits are reached.
      </Text>
      <VStack spacing={2}>
        <Button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onManageBilling();
          }}
          size={{ base: 'md', md: 'md' }}
          color="var(--cg-link)"
          fontFamily="var(--cg-font-retro-display)"
          isDisabled={!isAuthenticated || displayTier === 'FREE'}
          w={{ base: '100%', sm: 'auto' }}
          minH="44px"
        >
          Manage Subscription
        </Button>
        {isAuthenticated && displayTier !== 'FREE' && cancelScheduled && (
          <Button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onResumeSubscription();
            }}
            size={{ base: 'sm', md: 'sm' }}
            color="var(--cg-accent-green)"
            fontFamily="var(--cg-font-retro-display)"
            isLoading={isResumeLoading}
            loadingText="Resuming"
            w={{ base: '100%', sm: 'auto' }}
            minH="40px"
          >
            Resume Subscription
          </Button>
        )}
        {!isAuthenticated && (
          <Text
            color="var(--cg-accent-amber)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
          >
            Sign in to access billing management.
          </Text>
        )}
        {isAuthenticated && displayTier === 'FREE' && (
          <Text
            color="var(--cg-accent-amber)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
          >
            Upgrade to unlock billing management.
          </Text>
        )}
        {isAuthenticated && displayTier !== 'FREE' && cancelScheduled && (
          <Text
            color="var(--cg-accent-amber)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
          >
            Your subscription is set to cancel on{' '}
            {cancelAtDate ? cancelAtDate.toLocaleDateString() : 'the end of your billing period'}.
          </Text>
        )}
      </VStack>
    </VStack>
  </Box>
);

export default PricingHeader;
