import { Box, Text } from '@chakra-ui/react';
import React from 'react';

const StatusBanner = ({ checkoutStatus, errorMessage, displayTier, isSyncingTier }) => {
  if (!checkoutStatus && !errorMessage) {
    return null;
  }

  const isSuccess = checkoutStatus === 'success';

  return (
    <Box
      w="100%"
      maxW="3xl"
      bg="var(--cg-window-face)"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset)"
      p={4}
      textAlign="center"
    >
      <Text
        color={isSuccess ? 'var(--cg-accent-green)' : 'var(--cg-accent-amber)'}
        fontFamily="var(--cg-font-retro-display)"
      >
        {checkoutStatus === 'success' &&
          (displayTier === 'FREE'
            ? 'Subscription activated. Syncing your tier…'
            : 'Subscription activated. Welcome to the upgraded tier.')}
        {checkoutStatus === 'canceled' && 'Checkout canceled. You can upgrade anytime.'}
        {!checkoutStatus && errorMessage}
      </Text>
      {checkoutStatus === 'success' && displayTier === 'FREE' && isSyncingTier && (
        <Text
          color="var(--cg-accent-green)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
          mt={2}
        >
          This can take a few seconds while we process the webhook.
        </Text>
      )}
    </Box>
  );
};

export default StatusBanner;
