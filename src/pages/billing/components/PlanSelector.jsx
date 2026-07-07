import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const PlanSelector = ({
  billingCycle,
  onBillingCycleChange,
  displayTier,
  premiumActionLabel,
  unlimitedActionLabel,
  isPremiumCurrent,
  isUnlimitedCurrent,
  loadingTier,
  onCheckout,
}) => (
  <VStack spacing={{ base: 5, md: 6 }} w="100%">
    <Heading
      fontSize={{ base: 'xl', md: '2xl' }}
      color="var(--cg-text)"
      fontFamily="var(--cg-font-retro-display)"
      textAlign="center"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      Choose your plan
    </Heading>

    <Flex
      gap={3}
      wrap="wrap"
      justify="center"
      direction={{ base: 'column', sm: 'row' }}
      w="100%"
      maxW={{ base: '100%', sm: '480px' }}
    >
      {['MONTHLY', 'QUARTERLY', 'YEARLY'].map((cycle) => (
        <Button
          key={cycle}
          onClick={() => onBillingCycleChange(cycle)}
          size={{ base: 'md', md: 'sm' }}
          bg={billingCycle === cycle ? 'rgba(255,255,255,0.26)' : 'var(--cg-window-face)'}
          color={billingCycle === cycle ? 'var(--cg-link)' : 'var(--cg-text)'}
          border="2px solid var(--cg-window-shadow)"
          boxShadow={billingCycle === cycle ? 'var(--cg-window-inset)' : 'var(--cg-window-outset)'}
          fontFamily="var(--cg-font-retro-display)"
          _hover={{ bg: 'rgba(255,255,255,0.2)' }}
          w={{ base: '100%', sm: 'auto' }}
          minH="44px"
        >
          {cycle.toLowerCase()}
        </Button>
      ))}
    </Flex>

    <Flex wrap="wrap" gap={{ base: 4, md: 6 }} justify="center" w="100%">
      <Box
        className="cg-panel-window"
        overflow="hidden"
        flex="1"
        minW={{ base: '100%', sm: '260px' }}
        maxW={{ base: '100%', sm: '320px' }}
      >
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            FREE
          </Text>
        </Box>
        <VStack spacing={4} align="start" p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.14)">
          <Text
            color="var(--cg-text)"
            fontSize={{ base: 'sm', md: 'sm' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            Free access to all content with rate limited usage of shared free models from OpenRouter
          </Text>
          <Text
            color="var(--cg-accent-green)"
            fontSize={{ base: 'md', md: 'lg' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            $0 / month
          </Text>
          <Button
            isDisabled
            w="100%"
            color="var(--cg-accent-green)"
            minH="44px"
            fontFamily="var(--cg-font-retro-display)"
          >
            {displayTier === 'FREE' ? 'Current Tier' : 'Included'}
          </Button>
        </VStack>
      </Box>

      <Box
        className="cg-panel-window"
        overflow="hidden"
        flex="1"
        minW={{ base: '100%', sm: '260px' }}
        maxW={{ base: '100%', sm: '320px' }}
      >
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            PREMIUM
          </Text>
        </Box>
        <VStack spacing={4} align="start" p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.14)">
          <Text
            color="var(--cg-text)"
            fontSize={{ base: 'sm', md: 'sm' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            Access premium models (Gemini 3.1, Command R+), code analysis, higher daily limits, fewer ads
          </Text>
          <Text
            color="var(--cg-link)"
            fontSize={{ base: 'md', md: 'lg' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            {billingCycle === 'MONTHLY' && '$4.99 / month'}
            {billingCycle === 'QUARTERLY' && '$9.99 / quarter'}
            {billingCycle === 'YEARLY' && '$34.99 / year'}
          </Text>
          {isPremiumCurrent ? (
            <Button
              isDisabled
              w="100%"
              color="var(--cg-link)"
              minH="44px"
              fontFamily="var(--cg-font-retro-display)"
            >
              Current Tier
            </Button>
          ) : (
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onCheckout('PREMIUM', billingCycle);
              }}
              isLoading={loadingTier === `PREMIUM_${billingCycle}`}
              loadingText="Redirecting"
              w="100%"
              color="var(--cg-link)"
              minH="44px"
              fontFamily="var(--cg-font-retro-display)"
            >
              {premiumActionLabel}
            </Button>
          )}
        </VStack>
      </Box>

      <Box
        className="cg-panel-window"
        overflow="hidden"
        flex="1"
        minW={{ base: '100%', sm: '260px' }}
        maxW={{ base: '100%', sm: '320px' }}
      >
        <Box className="cg-titlebar" px={{ base: 3, md: 4 }} py={2}>
          <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em">
            UNLIMITED
          </Text>
        </Box>
        <VStack spacing={4} align="start" p={{ base: 5, md: 6 }} bg="rgba(255,255,255,0.14)">
          <Text
            color="var(--cg-text)"
            fontSize={{ base: 'sm', md: 'sm' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            Access all premium models (Gemini 3.1, Command R+, Gemma 4), 30 analyses/day, no limits, no ads
          </Text>
          <Text
            color="var(--cg-accent-amber)"
            fontSize={{ base: 'md', md: 'lg' }}
            fontFamily="var(--cg-font-retro-display)"
          >
            {billingCycle === 'MONTHLY' && '$9.99 / month'}
            {billingCycle === 'QUARTERLY' && '$19.99 / quarter'}
            {billingCycle === 'YEARLY' && '$69.99 / year'}
          </Text>
          {isUnlimitedCurrent ? (
            <Button
              isDisabled
              w="100%"
              color="var(--cg-accent-amber)"
              minH="44px"
              fontFamily="var(--cg-font-retro-display)"
            >
              Current Tier
            </Button>
          ) : (
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onCheckout('UNLIMITED', billingCycle);
              }}
              isLoading={loadingTier === `UNLIMITED_${billingCycle}`}
              loadingText="Redirecting"
              w="100%"
              color="var(--cg-accent-amber)"
              minH="44px"
              fontFamily="var(--cg-font-retro-display)"
            >
              {unlimitedActionLabel}
            </Button>
          )}
        </VStack>
      </Box>
    </Flex>
  </VStack>
);

export default PlanSelector;
