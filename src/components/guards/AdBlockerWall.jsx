import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  List,
  ListIcon,
  ListItem,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import useAdBlockDetector from '../../hooks/useAdBlockDetector';
import useHasHydrated from '../../hooks/useHasHydrated';
import { readStorage } from '../../utils/web/storage';

/* ── tiny inline icons (no extra dep) ─────────────────────────────── */
const ShieldIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 2.18l7 3.82v4c0 4.63-3.07 8.93-7 10.15-3.93-1.22-7-5.52-7-10.15V8l7-3.82z"
    />
    <path fill="currentColor" d="M11 7h2v6h-2zm0 8h2v2h-2z" />
  </Icon>
);

const CheckIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
  </Icon>
);

/**
 * Full-screen overlay that blocks the site when an ad blocker is detected.
 *
 * Exempt users: PREMIUM / UNLIMITED tier members (they pay, so no ads).
 * While detection is pending (`adBlockDetected === null`) the component
 * renders nothing so the page loads normally.
 */
const AdBlockerWall = () => {
  const { user } = useAuth();
  const hasHydrated = useHasHydrated();
  const { adBlockDetected, recheckAdBlock } = useAdBlockDetector();

  if (!hasHydrated) return null;

  /* ── exempt paid users ──────────────────────────────────────────── */
  const tier = (
    user?.membershipTier ||
    readStorage('localStorage', 'membership_tier') ||
    'FREE'
  ).toUpperCase();
  const normalized = tier === 'PRO' ? 'PREMIUM' : tier;
  const isPaid = normalized.includes('PREMIUM') || normalized.includes('UNLIMITED');

  // Paid users never see the wall
  if (isPaid) return null;

  // Still detecting — render nothing (avoid flash)
  if (adBlockDetected === null) return null;

  // No ad blocker — great, carry on
  if (!adBlockDetected) return null;

  /* ── ad blocker detected — show wall ────────────────────────────── */
  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex="9999"
      bg="blackAlpha.900"
      backdropFilter="blur(8px)"
      align="center"
      justify="center"
      px={4}
    >
      <VStack
        bg="gray.800"
        borderRadius="xl"
        boxShadow="dark-lg"
        maxW="520px"
        w="full"
        p={{ base: 6, md: 10 }}
        spacing={5}
        textAlign="center"
      >
        <ShieldIcon boxSize={14} color="orange.300" />

        <Heading size="lg" color="white">
          Ad Blocker Detected
        </Heading>

        <Text color="gray.300" fontSize="md" lineHeight="tall">
          CodeGrind is free to use and relies on ads to keep the servers running. Please disable
          your ad blocker to continue.
        </Text>

        <Box bg="gray.700" borderRadius="md" p={4} w="full" textAlign="left">
          <Text fontWeight="semibold" color="white" mb={2}>
            How to disable your ad blocker:
          </Text>
          <List spacing={2} color="gray.300" fontSize="sm">
            <ListItem>
              <ListIcon as={CheckIcon} color="green.400" />
              Click the ad blocker icon in your browser toolbar
            </ListItem>
            <ListItem>
              <ListIcon as={CheckIcon} color="green.400" />
              Select &quot;Pause&quot; or &quot;Don&apos;t run on this site&quot;
            </ListItem>
            <ListItem>
              <ListIcon as={CheckIcon} color="green.400" />
              Refresh the page (or click the button below)
            </ListItem>
          </List>
        </Box>

        <Button colorScheme="orange" size="lg" w="full" onClick={recheckAdBlock}>
          I&apos;ve Disabled My Ad Blocker
        </Button>

        <Text color="gray.500" fontSize="xs">
          Prefer an ad-free experience?{' '}
          <Text as="a" href="/pricing" color="cyan.400" _hover={{ textDecoration: 'underline' }}>
            Upgrade to Premium
          </Text>
        </Text>
      </VStack>
    </Flex>
  );
};

export default AdBlockerWall;
