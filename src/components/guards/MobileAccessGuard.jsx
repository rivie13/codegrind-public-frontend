import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import useIsMobileDevice from '../../hooks/useIsMobileDevice';

// Handheld-allowed: home, own/public profile, info pages, leaderboards, pricing,
// auth verification. Everything not blocked renders normally (fail-open for unknown
// future info pages); known content roots below are blocked explicitly.
const BLOCKED_EXACT_PATHS = new Set(['/profile/submissions', '/ad-test', '/achievements/test']);

// Segment-aware prefixes: matches the prefix itself and anything beneath it.
const BLOCKED_PATH_PREFIXES = [
  '/city',
  '/games',
  '/problems',
  '/learning',
  '/ai-problems',
  '/store',
  '/achievements',
  '/dev',
];

const normalizePathname = (pathname) => {
  if (!pathname || pathname === '/') return '/';
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
};

const matchesPrefix = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export const isHandheldBlockedPath = (pathname) => {
  const path = normalizePathname(pathname);
  if (BLOCKED_EXACT_PATHS.has(path)) return true;
  return BLOCKED_PATH_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
};

const DesktopOnlyNotice = () => (
  <Flex
    minH="100dvh"
    bg="#008080"
    align="center"
    justify="center"
    px={4}
    py={4}
    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
  >
    <Box
      className="cg-panel-window"
      maxW="560px"
      w="full"
      bg="#d4d0c8"
      borderRadius="0"
      overflow="hidden"
    >
      <Box className="cg-titlebar" px={3} py={2}>
        <Text
          color="#f5f7ff"
          fontFamily="var(--cg-font-retro-display)"
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          desktop-only.exe
        </Text>
      </Box>
      <Box p={{ base: 4, md: 5 }} bg="#d4d0c8">
        <Box
          bg="#efebe7"
          border="1px solid #7f7f7f"
          boxShadow="var(--cg-window-inset)"
          p={{ base: 4, md: 5 }}
        >
          <Text
            fontSize={{ base: 'md', md: 'lg' }}
            fontWeight="700"
            color="#0a2c9a"
            fontFamily="var(--cg-font-retro-display)"
            mb={2}
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            Desktop required for this content
          </Text>
          <Text
            color="#1f2430"
            fontSize={{ base: 'sm', md: 'md' }}
            lineHeight="1.7"
            fontFamily="var(--cg-font-retro-display)"
          >
            This part of CodeGrind needs a desktop browser. Your home and profile work fine on
            mobile — switch to a computer to play.
          </Text>
          <Flex mt={4} gap={3} flexWrap="wrap">
            <Button as={RouterLink} to="/" borderRadius="0">
              Back to Home
            </Button>
            <Button as={RouterLink} to="/profile" borderRadius="0" variant="outline">
              Go to Profile
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  </Flex>
);

const MobileAccessGuard = () => {
  const isMobileDevice = useIsMobileDevice();
  const location = useLocation();

  if (!isMobileDevice) return <Outlet />;
  if (isHandheldBlockedPath(location.pathname)) return <DesktopOnlyNotice />;
  return <Outlet />;
};

export default MobileAccessGuard;
