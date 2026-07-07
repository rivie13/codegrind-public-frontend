import { Box, Text } from '@chakra-ui/react';
import React from 'react';

const FooterNote = () => (
  <Box className="cg-panel-window" p={{ base: 4, md: 6 }} maxW="3xl" w="100%" textAlign="center">
    <Text
      color="var(--cg-muted)"
      fontSize={{ base: 'xs', md: 'sm' }}
      fontFamily="var(--cg-font-retro-display)"
      lineHeight={{ base: '1.6', md: '1.6' }}
    >
      <Text as="span" color="var(--cg-link)" fontWeight="bold">
        NOTICE:
      </Text>{' '}
      All learning content is free to access forever. Paid plans remove ads and increase rate
      limits. Free users can refresh access through ads when limits are reached. Subscription
      features and limits may change over time as the platform evolves. "Unlimited" is subject to
      fair use and may be adjusted to prevent abuse.
    </Text>
  </Box>
);

export default FooterNote;
