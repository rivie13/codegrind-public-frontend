import { CloseIcon, InfoIcon } from '@chakra-ui/icons';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

const PendingEmailBanner = ({ pendingEmail, onDismiss }) => {
  if (!pendingEmail) return null;

  return (
    <Alert
      status="warning"
      variant="subtle"
      bg="rgba(255, 200, 0, 0.1)"
      border="1px solid rgba(255, 200, 0, 0.5)"
      borderRadius="md"
      mb={4}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #FFC800, transparent)',
      }}
    >
      <AlertIcon color="#FFC800" />
      <VStack align="start" spacing={2} flex="1">
        <AlertTitle color="#FFC800" fontFamily="monospace" fontSize="md">
          📧 Email Change Pending
        </AlertTitle>
        <AlertDescription color="white" fontSize="sm" fontFamily="monospace">
          <Text mb={2}>
            Your email change to <strong style={{ color: '#FFC800' }}>{pendingEmail}</strong> is awaiting verification.
          </Text>
          <HStack spacing={2} fontSize="xs">
            <InfoIcon color="#FFC800" />
            <Text>Check both your old and new email for verification/cancellation links</Text>
          </HStack>
          <HStack spacing={2} fontSize="xs" mt={1}>
            <InfoIcon color="#FFC800" />
            <Text>This request will expire in 24 hours</Text>
          </HStack>
          <HStack spacing={2} fontSize="xs" mt={1}>
            <InfoIcon color="#FFC800" />
            <Text>You can still log in with your current email until verified</Text>
          </HStack>
        </AlertDescription>
      </VStack>
      {onDismiss && (
        <Button
          size="sm"
          variant="ghost"
          color="rgba(255, 200, 0, 0.8)"
          _hover={{ bg: 'rgba(255, 200, 0, 0.1)' }}
          onClick={onDismiss}
          position="absolute"
          top={2}
          right={2}
        >
          <CloseIcon boxSize={3} />
        </Button>
      )}
    </Alert>
  );
};

export default PendingEmailBanner;
