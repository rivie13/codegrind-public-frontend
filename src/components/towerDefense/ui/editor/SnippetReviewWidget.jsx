import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import React from 'react';

const SnippetReviewWidget = ({ visible, top, left, isMobile, onAction }) => {
  if (!visible) return null;

  if (isMobile) {
    return (
      <Box
        bg="rgba(5, 15, 30, 0.95)"
        borderTop="1px solid rgba(0, 204, 255, 0.6)"
        borderBottom="1px solid rgba(0, 204, 255, 0.2)"
        boxShadow="0 -2px 8px rgba(0, 0, 0, 0.4)"
        px={3}
        py={2}
        flexShrink={0}
      >
        <Flex align="center" justify="space-between" gap={2} wrap="wrap">
          <Text fontSize="9px" color="#8fe9ff" fontFamily="monospace" flexShrink={0}>
            SNIPPET REVIEW
          </Text>
          <HStack spacing={1.5} flexWrap="wrap">
            <Button size="xs" colorScheme="cyan" onClick={() => onAction('accept')}>
              Accept
            </Button>
            <Button
              size="xs"
              colorScheme="teal"
              variant="outline"
              onClick={() => onAction('accept-edit')}
            >
              Accept+Edit
            </Button>
            <Button
              size="xs"
              colorScheme="yellow"
              variant="outline"
              onClick={() => onAction('retry')}
            >
              Retry
            </Button>
            <Button size="xs" colorScheme="red" variant="outline" onClick={() => onAction('deny')}>
              Deny
            </Button>
          </HStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      position="absolute"
      top={`${top}px`}
      left={`${left}px`}
      bg="rgba(5, 15, 30, 0.92)"
      border="1px solid rgba(0, 204, 255, 0.6)"
      boxShadow="0 0 12px rgba(0, 0, 0, 0.6)"
      borderRadius="6px"
      px={3}
      py={2}
      zIndex={3}
    >
      <Text fontSize="10px" color="#8fe9ff" mb={2} fontFamily="monospace">
        SNIPPET REVIEW
      </Text>
      <HStack spacing={2}>
        <Button size="xs" colorScheme="cyan" onClick={() => onAction('accept')}>
          Accept
        </Button>
        <Button
          size="xs"
          colorScheme="teal"
          variant="outline"
          onClick={() => onAction('accept-edit')}
        >
          Accept + Edit
        </Button>
        <Button size="xs" colorScheme="yellow" variant="outline" onClick={() => onAction('retry')}>
          Retry
        </Button>
        <Button size="xs" colorScheme="red" variant="outline" onClick={() => onAction('deny')}>
          Deny
        </Button>
      </HStack>
    </Box>
  );
};

export default SnippetReviewWidget;
