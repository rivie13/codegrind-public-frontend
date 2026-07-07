import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useHasHydrated from '../../hooks/useHasHydrated';

const AuthForms = lazy(() => import('../../components/auth/AuthForms'));
const WINDOW_OUTSET =
  'inset 1px 1px 0 var(--home-retro-border-light), inset 2px 2px 0 var(--home-retro-border-lighter), inset -1px -1px 0 var(--home-retro-border-dark), inset -2px -2px 0 var(--home-retro-border-mid)';
const WINDOW_INSET =
  'inset 1px 1px 0 var(--home-retro-border-dark), inset 2px 2px 0 var(--home-retro-border-mid), inset -1px -1px 0 var(--home-retro-border-light), inset -2px -2px 0 var(--home-retro-border-lighter)';
const ACTIVE_TITLE_BAR =
  'linear-gradient(90deg, var(--home-retro-title-start) 0%, var(--home-retro-title-end) 100%)';

/**
 * HomeActionBar – compact CTA strip rendered below the TD demo.
 * Shows Sign Up / Login (modal) when unauthenticated, My Profile when logged in,
 * plus quick links to Clusters and Games.
 */
const HomeActionBar = () => {
  const hasHydrated = useHasHydrated();
  const { user, isAuthenticated } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleAuthSuccess = () => {
    onClose();
  };

  const launchButtonProps = {
    size: 'lg',
    bg: 'var(--home-retro-surface)',
    color: 'var(--home-retro-text)',
    borderRadius: '0',
    fontFamily: 'var(--cg-font-retro-display)',
    fontSize: { base: 'xs', md: 'sm' },
    fontWeight: '700',
    letterSpacing: '0.04em',
    px: { base: 6, md: 8 },
    py: { base: 5, md: 6 },
    width: { base: '100%', md: 'auto' },
    maxW: { base: '360px', md: 'none' },
    boxShadow: WINDOW_OUTSET,
    _hover: {
      bg: 'var(--home-retro-surface-shell)',
    },
    _active: {
      bg: 'var(--home-retro-surface-muted)',
      boxShadow: WINDOW_INSET,
      transform: 'translate(1px, 1px)',
    },
    transition: 'background 0.15s ease, transform 0.05s ease',
  };

  return (
    <>
      <Box py={{ base: 6, md: 10 }} px={{ base: 5, md: 8 }} bg="transparent">
        <Box
          borderRadius="0"
          overflow="hidden"
          bg="var(--home-retro-surface)"
          boxShadow={WINDOW_OUTSET}
        >
          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            px={{ base: 4, md: 5 }}
            py={{ base: 2.5, md: 3 }}
            spacing={3}
            bg={ACTIVE_TITLE_BAR}
          >
            <HStack spacing={3}>
              <Text
                color="white"
                fontFamily="var(--cg-font-retro-display)"
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
              >
                shortcuts.exe
              </Text>
            </HStack>
            <Text
              color="rgba(255, 255, 255, 0.92)"
              fontFamily="var(--cg-font-retro-display)"
              fontSize={{ base: 'sm', md: 'md' }}
              lineHeight="1"
              letterSpacing="0.03em"
            >
              {isAuthenticated
                ? `WELCOME BACK, ${(user?.displayName || user?.email || 'AGENT').toUpperCase()}`
                : 'SIGN IN TO SAVE PROGRESS AND KEEP YOUR RUNS'}
            </Text>
          </Stack>

          <Box
            px={{ base: 4, md: 5 }}
            py={{ base: 5, md: 6 }}
            bg="var(--home-retro-surface-strong)"
          >
            <Box px={3} py={2.5} bg="var(--home-retro-surface-shell)" boxShadow={WINDOW_INSET}>
              <Text
                color="var(--home-retro-text-muted)"
                fontFamily="var(--cg-font-retro-terminal)"
                fontSize={{ base: 'sm', md: 'md' }}
                lineHeight="1.5"
              >
                Quick launch shortcuts for your next step: save progress, jump into interview
                clusters, or browse the full game list.
              </Text>
            </Box>
            <Stack
              mt={{ base: 4, md: 5 }}
              spacing={{ base: 4, md: 5 }}
              direction={{ base: 'column', md: 'row' }}
              align="center"
              justify="center"
            >
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  style={{
                    width: '100%',
                    maxWidth: '360px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Button {...launchButtonProps}>MY PROFILE</Button>
                </Link>
              ) : (
                <Button onClick={onOpen} {...launchButtonProps}>
                  SIGN UP / LOGIN
                </Button>
              )}

              <Link
                to="/games/clusters"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button {...launchButtonProps}>EXPLORE CLUSTERS</Button>
              </Link>

              <Link
                to="/games"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Button {...launchButtonProps}>ALL GAMES</Button>
              </Link>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ─── Auth Modal ─── */}
      {hasHydrated ? (
        <Suspense fallback={null}>
          <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
            <ModalOverlay backdropFilter="blur(2px)" bg="rgba(0, 0, 0, 0.25)" />
            <ModalContent
              className="cg-panel-window"
              bg="#d4d0c8"
              borderRadius="0"
              color="#1f2430"
              overflow="hidden"
              maxW={{ base: '96vw', md: '560px' }}
              mx={2}
            >
              <ModalHeader className="cg-titlebar" py={2} px={{ base: 3, md: 4 }}>
                Sign Up or Log In
              </ModalHeader>
              <ModalCloseButton color="var(--cg-header-text)" borderRadius="0" />
              <ModalBody py={{ base: 3, md: 4 }} px={{ base: 3, md: 4 }} bg="#d4d0c8">
                <Box
                  mb={4}
                  px={3}
                  py={2.5}
                  bg="#efebe7"
                  border="1px solid #7f7f7f"
                  boxShadow="var(--cg-window-inset)"
                >
                  <Text
                    color="#1f2430"
                    fontFamily="'Tahoma', 'MS Sans Serif', sans-serif"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="1.6"
                  >
                    Create a free account to save progress, keep your wins, and track your coding
                    journey.
                  </Text>
                </Box>
                <Box display="flex" justifyContent="center">
                  <AuthForms onSuccess={handleAuthSuccess} />
                </Box>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Suspense>
      ) : null}
    </>
  );
};

export default HomeActionBar;
