import {
  Avatar,
  Box,
  Link as ChakraLink,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useHasHydrated from '../../hooks/useHasHydrated';
import useCompactLandscapeShellMode from '../../hooks/useCompactLandscapeShellMode';
import { api } from '../../services/api';
import { normalizeSitePath } from '../seo/siteMetadata';
import { SEO_LANDING_PAGE_PATHS } from '../../data/seoLandingPages';
import CodegrindWordmark from './CodegrindWordmark';

//import logger from utils
import logger from '../../utils/core/logger';

const AuthForms = lazy(() => import('../auth/AuthForms'));

function Navigation() {
  const XP_CONFIG = { base: 150, linear: 45, quadratic: 18 };

  const getXpForNextLevel = (level) => {
    const step = Math.max(level - 1, 0);
    return XP_CONFIG.base + XP_CONFIG.linear * step + XP_CONFIG.quadratic * step * step;
  };

  const getTotalXpForLevel = (level) => {
    let total = 0;
    for (let current = 1; current < level; current += 1) {
      total += getXpForNextLevel(current);
    }
    return total;
  };

  const calculateLevelFromXp = (totalXp) => {
    let computedLevel = 1;
    while (totalXp >= getTotalXpForLevel(computedLevel + 1)) {
      computedLevel += 1;
    }
    return computedLevel;
  };

  const location = useLocation();
  const hasHydrated = useHasHydrated();
  const isCompactLandscapeShellMode = useCompactLandscapeShellMode();
  const { logout, user, isAuthenticated } = useAuth();
  const toast = useToast();
  const {
    isOpen: isAuthModalOpen,
    onOpen: onAuthModalOpen,
    onClose: onAuthModalClose,
  } = useDisclosure();
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [isLogoAnimationEnabled, setIsLogoAnimationEnabled] = useState(true);
  const normalizedPathname = normalizeSitePath(location.pathname);
  const isLearningRoute = normalizedPathname.startsWith('/learning');
  const isProblemRoute = normalizedPathname.includes('/problems') && !isLearningRoute;
  const isPracticeGuideRoute = SEO_LANDING_PAGE_PATHS.includes(normalizedPathname);
  const [learningRateLimit, setLearningRateLimit] = useState(null);
  const [learningCooldownRemaining, setLearningCooldownRemaining] = useState(0);
  const displayName = user?.username || user?.displayName || user?.email || 'Agent';
  const progressSummary =
    user?.progress && typeof user.progress === 'object' ? user.progress : null;
  const totalXp = Number.isFinite(Number(progressSummary?.xp))
    ? Math.max(0, Number(progressSummary.xp))
    : Number.isFinite(Number(user?.xp))
      ? Math.max(0, Number(user.xp))
      : 0;
  const levelFromXp = calculateLevelFromXp(totalXp);
  const level = Number.isFinite(Number(progressSummary?.level))
    ? Math.max(1, Number(progressSummary.level))
    : levelFromXp;
  const xpToNextLevel = Number.isFinite(Number(progressSummary?.xpToNextLevel))
    ? Math.max(0, Number(progressSummary.xpToNextLevel))
    : getXpForNextLevel(level);
  const xpIntoLevel = Number.isFinite(Number(progressSummary?.xpIntoLevel))
    ? Math.max(0, Number(progressSummary.xpIntoLevel))
    : Math.max(0, totalXp - getTotalXpForLevel(level));
  const cappedXpIntoLevel = xpToNextLevel > 0 ? Math.min(xpIntoLevel, xpToNextLevel) : 0;
  const xpProgressPercent =
    xpToNextLevel > 0 ? Math.min(100, Math.round((cappedXpIntoLevel / xpToNextLevel) * 100)) : 0;

  useEffect(() => {
    const storedValue = window.localStorage.getItem('codegrind-logo-animation-enabled');
    if (storedValue !== null) {
      setIsLogoAnimationEnabled(storedValue === 'true');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('codegrind-logo-animation-enabled', String(isLogoAnimationEnabled));
  }, [isLogoAnimationEnabled]);

  useEffect(() => {
    if (!isAuthenticated || !isLearningRoute) {
      setLearningRateLimit(null);
      setLearningCooldownRemaining(0);
      return undefined;
    }

    const pathParts = location.pathname.split('/').filter(Boolean);
    const pathId = pathParts.length >= 2 ? pathParts[1] : null;

    if (!pathId || pathId === 'learning') {
      setLearningRateLimit(null);
      return undefined;
    }

    let isMounted = true;
    let pollId = null;

    const fetchRateLimit = async () => {
      try {
        const response = await api.learningPath.getRateLimit(pathId);
        if (isMounted) {
          setLearningRateLimit(response?.rateLimit || null);
        }
      } catch {
        if (isMounted) {
          setLearningRateLimit(null);
        }
      }
    };

    fetchRateLimit();
    pollId = window.setInterval(fetchRateLimit, 30000);

    return () => {
      isMounted = false;
      if (pollId) window.clearInterval(pollId);
    };
  }, [isAuthenticated, isLearningRoute, location.pathname]);

  useEffect(() => {
    if (!learningRateLimit || learningRateLimit.unlimited) {
      setLearningCooldownRemaining(0);
      return;
    }
    const nextValue = Number.isFinite(learningRateLimit.adCooldownRemaining)
      ? Math.max(0, Math.floor(learningRateLimit.adCooldownRemaining))
      : 0;
    setLearningCooldownRemaining(nextValue);
  }, [learningRateLimit]);

  useEffect(() => {
    if (!isAuthenticated || !isLearningRoute || learningCooldownRemaining <= 0) return undefined;
    const timer = window.setInterval(() => {
      setLearningCooldownRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, isLearningRoute, learningCooldownRemaining]);

  useEffect(() => {
    if (isAuthenticated && isAuthModalOpen) {
      onAuthModalClose();
    }
  }, [isAuthenticated, isAuthModalOpen, onAuthModalClose]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      //use logger only
      logger.error('Logout failed:');
      logger.debug(error.stack);
    }
  };

  // Helper function to show authentication required toast
  const showAuthToast = (featureName) => {
    toast({
      title: 'Authentication Required',
      description: `Please sign up or log in to access ${featureName}. Create an account to unlock all features!`,
      status: 'warning',
      duration: 5000,
      isClosable: true,
      position: 'top',
      render: ({ title, description, onClose }) => (
        <Box
          bg="var(--cg-window-face)"
          border="2px solid var(--cg-window-shadow)"
          p={4}
          color="var(--cg-text)"
          boxShadow="var(--cg-window-outset), 10px 10px 0 rgba(0, 0, 0, 0.12)"
          maxW="450px"
        >
          <Box
            fontWeight="bold"
            color="var(--cg-accent-amber)"
            mb={2}
            fontFamily="var(--cg-font-retro-display)"
            textTransform="uppercase"
            letterSpacing="0.08em"
          >
            {title}
          </Box>
          <Box fontSize="sm" mb={3} fontFamily="var(--cg-font-retro-display)">
            {description}
          </Box>
          <HStack spacing={2}>
            <Box
              as="button"
              fontSize="xs"
              bg="var(--cg-window-face)"
              color="var(--cg-accent-amber)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              px={3}
              py={1}
              fontFamily="var(--cg-font-retro-display)"
              _hover={{ bg: 'rgba(255,255,255,0.18)' }}
              onClick={() => {
                onClose();
                onAuthModalOpen();
              }}
            >
              Sign Up / Login
            </Box>
            <Box
              as="button"
              fontSize="xs"
              bg="var(--cg-window-face)"
              color="var(--cg-muted)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset)"
              px={3}
              py={1}
              fontFamily="var(--cg-font-retro-display)"
              _hover={{ bg: 'rgba(255,255,255,0.18)', color: 'var(--cg-text)' }}
              onClick={onClose}
            >
              Close
            </Box>
          </HStack>
        </Box>
      ),
    });
  };

  // Helper function to handle protected link clicks
  const handleProtectedLinkClick = (e, path, featureName) => {
    if (!isAuthenticated) {
      e.preventDefault();
      showAuthToast(featureName);
      return false;
    }
    return true;
  };

  const formatCooldown = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return 'Ready';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins <= 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const desktopNavDisplay = isCompactLandscapeShellMode ? 'none' : { base: 'none', md: 'flex' };
  const mobileNavDisplay = isCompactLandscapeShellMode ? 'flex' : { base: 'flex', md: 'none' };
  const navHorizontalPadding = isCompactLandscapeShellMode ? '16px' : { base: '16px', md: '40px' };
  const mobileMenuMaxHeight = isCompactLandscapeShellMode
    ? 'calc(100dvh - 180px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
    : 'calc(100dvh - 128px - env(safe-area-inset-top) - env(safe-area-inset-bottom))';
  const retroShellProps = {
    bg: 'linear-gradient(180deg, #ece9d8 0%, #d6d1c8 100%)',
    borderBottom: '2px solid var(--cg-window-shadow)',
    boxShadow: 'var(--cg-window-outset), 0 8px 0 rgba(0, 0, 0, 0.08)',
  };
  const dropdownMenuProps = {
    bg: 'var(--cg-window-face)',
    border: '2px solid var(--cg-window-shadow)',
    boxShadow: 'var(--cg-window-outset), 10px 10px 0 rgba(0, 0, 0, 0.12)',
    borderRadius: '0',
    backdropFilter: 'none',
    padding: '0',
  };
  const dropdownItemProps = {
    bg: 'transparent',
    color: 'var(--cg-text)',
    fontFamily: 'var(--cg-font-retro-display)',
    fontSize: 'sm',
    _hover: { bg: 'rgba(255,255,255,0.26)', color: 'var(--cg-text)' },
    _focus: {
      bg: 'rgba(255,255,255,0.26)',
      color: 'var(--cg-text)',
      boxShadow: 'var(--cg-window-inset)',
    },
    transition: 'none',
  };
  const getNavTone = (active, accent = 'var(--cg-link)') => ({
    color: active ? accent : 'var(--cg-text)',
    bg: active ? 'rgba(255,255,255,0.28)' : 'transparent',
    boxShadow: active ? 'var(--cg-window-inset)' : 'none',
    px: 2,
    py: 1,
    fontWeight: active ? '700' : '500',
    fontSize: 'sm',
    fontFamily: 'var(--cg-font-retro-display)',
    _hover: {
      color: active ? accent : 'var(--cg-text)',
      bg: 'rgba(255,255,255,0.2)',
      textDecoration: 'none',
    },
    transition: 'none',
    position: 'relative',
  });
  const getUpgradeTone = (active) => ({
    ...getNavTone(active, 'var(--cg-accent-amber)'),
    px: 3,
    bg: active ? 'rgba(255,255,255,0.32)' : 'rgba(118, 81, 0, 0.12)',
  });

  const renderProfileSummary = () => {
    if (!isAuthenticated) return null;

    return (
      <Box px={3} py={3} borderBottom="1px solid var(--cg-window-dark)" bg="rgba(255,255,255,0.16)">
        <HStack spacing={3} align="start">
          <Avatar
            size="sm"
            src={user?.avatarUrl || undefined}
            name={displayName}
            bg="var(--cg-panel-shell)"
            color="var(--cg-link)"
            border="1px solid var(--cg-window-shadow)"
          />
          <Box flex="1" minW={0}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="var(--cg-text)"
              fontFamily="var(--cg-font-retro-display)"
              noOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              fontSize="xs"
              color="var(--cg-link)"
              fontFamily="var(--cg-font-retro-display)"
              mb={2}
            >
              Level {level}
            </Text>
            <Progress
              value={xpProgressPercent}
              size="xs"
              borderRadius="0"
              bg="var(--cg-panel-shell)"
              sx={{
                boxShadow: 'var(--cg-window-inset)',
                '> div': {
                  bg: 'linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))',
                },
              }}
            />
            <Text
              fontSize="xs"
              color="var(--cg-muted)"
              fontFamily="var(--cg-font-retro-display)"
              mt={1}
            >
              {cappedXpIntoLevel}/{xpToNextLevel} XP
            </Text>
          </Box>
        </HStack>
      </Box>
    );
  };

  if (!hasHydrated) {
    return (
      <Box
        as="nav"
        {...retroShellProps}
        position="fixed"
        top="0"
        width="100%"
        zIndex="1000"
        height="54px"
      >
        <Flex
          maxW="container.xl"
          mx="auto"
          h="100%"
          justify="space-between"
          align="center"
          px={navHorizontalPadding}
        >
          <ChakraLink as={Link} to="/" _hover={{ textDecoration: 'none' }}>
            <CodegrindWordmark
              animationEnabled={false}
              containerProps={{
                minH: '28px',
                width: '100%',
                px: 0,
                justifyContent: 'flex-start',
              }}
              textProps={{
                as: 'h2',
                fontSize: { base: 'xl', md: '2xl' },
                textAlign: 'left',
              }}
              cursorProps={{ ml: 0.5 }}
            />
          </ChakraLink>
          <HStack spacing={6} display={desktopNavDisplay}>
            <ChakraLink as={Link} to="/" {...getNavTone(location.pathname === '/')}>
              Home
            </ChakraLink>
            <ChakraLink as={Link} to="/about" {...getNavTone(false)}>
              About
            </ChakraLink>
            <ChakraLink as={Link} to="/faq" {...getNavTone(false)}>
              FAQ
            </ChakraLink>
            <ChakraLink as={Link} to="/updates" {...getNavTone(false)}>
              Updates
            </ChakraLink>
          </HStack>
          <IconButton
            aria-label="Open navigation"
            icon={<HamburgerIcon />}
            color="var(--cg-text)"
            display={mobileNavDisplay}
            _hover={{ bg: 'rgba(255,255,255,0.2)', color: 'var(--cg-link)' }}
          />
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      as="nav"
      {...retroShellProps}
      position="fixed"
      top="0"
      width="100%"
      zIndex="1000"
      height="54px"
    >
      <Flex
        maxW="container.xl"
        mx="auto"
        h="100%"
        justify="space-between"
        align="center"
        px={navHorizontalPadding}
      >
        <Menu
          isOpen={isLogoMenuOpen}
          onClose={() => setIsLogoMenuOpen(false)}
          onOpen={() => setIsLogoMenuOpen(true)}
          usePortal={false}
        >
          <Box>
            <MenuButton
              as={Box}
              cursor="pointer"
              role="button"
              tabIndex={0}
              onClick={() => setIsLogoMenuOpen((prev) => !prev)}
              minW={{ base: '152px', md: '182px' }}
            >
              <ChakraLink as={Link} to="/" _hover={{ textDecoration: 'none' }}>
                <CodegrindWordmark
                  loop
                  animationEnabled={isLogoAnimationEnabled}
                  containerProps={{
                    minH: '28px',
                    width: '100%',
                    px: 0,
                    justifyContent: 'flex-start',
                  }}
                  textProps={{
                    as: 'h2',
                    fontSize: { base: 'xl', md: '2xl' },
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                  cursorProps={{ ml: 0.5 }}
                />
              </ChakraLink>
            </MenuButton>
            <MenuList {...dropdownMenuProps}>
              <MenuItem
                onClick={() => setIsLogoAnimationEnabled((prev) => !prev)}
                {...dropdownItemProps}
              >
                Animation: {isLogoAnimationEnabled ? 'On' : 'Off'}
              </MenuItem>
              <MenuItem as={Link} to="/" {...dropdownItemProps}>
                Home
              </MenuItem>
            </MenuList>
          </Box>
        </Menu>
        <Box flex="1" display={desktopNavDisplay} justifyContent="center">
          {isLearningRoute && isAuthenticated && learningRateLimit ? (
            <Tooltip
              label="Learning activity rate limit. You have a limited number of credits depending on membership for the amount of learning activities you can do before a cooldown is enforced. Watch an ad or wait for the daily refresh to get more credits. Ad refreshes are also on a separate cooldown."
              placement="bottom"
              hasArrow
              bg="var(--cg-window-face)"
              color="var(--cg-text)"
              border="2px solid var(--cg-window-shadow)"
              px={3}
              py={2}
              fontSize="xs"
              fontFamily="var(--cg-font-retro-display)"
            >
              <Box
                px={3}
                py={1}
                border="2px solid var(--cg-window-shadow)"
                bg="var(--cg-panel-shell)"
                boxShadow="var(--cg-window-inset)"
                maxW={{ md: '240px', lg: '440px' }}
              >
                <Text
                  fontSize={{ md: '2xs', lg: 'xs' }}
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {learningRateLimit.unlimited
                    ? 'Learning: Unlimited'
                    : `Learning: ${learningRateLimit.remaining}/${learningRateLimit.limit}`}
                  {!learningRateLimit.unlimited
                    ? ` • Cooldown ${formatCooldown(learningCooldownRemaining)}`
                    : ''}
                </Text>
              </Box>
            </Tooltip>
          ) : null}
        </Box>
        <HStack spacing={6} display={desktopNavDisplay}>
          <ChakraLink as={Link} to="/" {...getNavTone(location.pathname === '/')}>
            Home
          </ChakraLink>
          <Menu>
            <MenuButton {...getNavTone(isProblemRoute)}>Problems</MenuButton>
            <MenuList {...dropdownMenuProps}>
              <MenuItem
                as={isAuthenticated ? Link : 'button'}
                to={isAuthenticated ? '/problems' : undefined}
                onClick={(e) =>
                  !isAuthenticated && handleProtectedLinkClick(e, '/problems', 'Interview Problems')
                }
                {...dropdownItemProps}
              >
                Interview Problems
              </MenuItem>
              <MenuItem as={Link} to="/ai-problems" {...dropdownItemProps}>
                AI Generated Problems
              </MenuItem>
            </MenuList>
          </Menu>
          <ChakraLink as={Link} to="/games" {...getNavTone(location.pathname.includes('/games'))}>
            Games
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="/learning"
            {...getNavTone(location.pathname.startsWith('/learning'))}
          >
            Learning
          </ChakraLink>
          <ChakraLink
            as={isAuthenticated ? Link : 'button'}
            to={isAuthenticated ? '/store' : undefined}
            onClick={(e) =>
              !isAuthenticated && handleProtectedLinkClick(e, '/store', 'Data Packet Store')
            }
            {...getNavTone(location.pathname.startsWith('/store'))}
          >
            Store
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="/leaderboards"
            {...getNavTone(location.pathname === '/leaderboards')}
          >
            Leaderboards
          </ChakraLink>

          {/* More Menu for less frequently used items */}
          <Menu>
            <MenuButton
              {...getNavTone(
                ['about', 'privacy-policy', 'updates', 'blog', 'faq'].some((path) =>
                  location.pathname.includes(path)
                ) || isPracticeGuideRoute
              )}
            >
              More
            </MenuButton>
            <MenuList {...dropdownMenuProps}>
              <MenuItem as={Link} to="/about" {...dropdownItemProps}>
                How It Works
              </MenuItem>
              <MenuItem as={Link} to="/faq" {...dropdownItemProps}>
                FAQ
              </MenuItem>
              <MenuItem as={Link} to="/coding-interview-practice" {...dropdownItemProps}>
                Practice Guides
              </MenuItem>
              <MenuItem as={Link} to="/blog" {...dropdownItemProps}>
                Blog
              </MenuItem>
              <MenuItem as={Link} to="/updates" {...dropdownItemProps}>
                Updates
              </MenuItem>
              <MenuItem
                as="a"
                href="https://stats.uptimerobot.com/MYXleQpuCX"
                target="_blank"
                rel="noopener noreferrer"
                {...dropdownItemProps}
              >
                CodeGrind Status Page (External)
              </MenuItem>
              <MenuItem as={Link} to="/privacy-policy" {...dropdownItemProps}>
                Privacy & Your Data
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Upgrade Membership - Keep prominent */}
          <ChakraLink
            as={isAuthenticated ? Link : 'button'}
            to={isAuthenticated ? '/pricing' : undefined}
            onClick={(e) =>
              !isAuthenticated && handleProtectedLinkClick(e, '/pricing', 'Upgrade Membership')
            }
            {...getUpgradeTone(location.pathname === '/pricing')}
          >
            Upgrade
          </ChakraLink>

          {isAuthenticated ? (
            <Menu>
              <MenuButton {...getNavTone(location.pathname.startsWith('/profile'))}>
                Profile
              </MenuButton>
              <MenuList {...dropdownMenuProps}>
                {renderProfileSummary()}
                <MenuItem as={Link} to="/profile" {...dropdownItemProps}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout} {...dropdownItemProps}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <ChakraLink as="button" type="button" onClick={onAuthModalOpen} {...getNavTone(false)}>
              Sign In
            </ChakraLink>
          )}
        </HStack>

        <Box display={mobileNavDisplay}>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Open navigation menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              color="var(--cg-text)"
              _hover={{ color: 'var(--cg-link)', bg: 'rgba(255,255,255,0.18)' }}
              _active={{ bg: 'rgba(255,255,255,0.24)' }}
            />
            <MenuList
              {...dropdownMenuProps}
              minW="220px"
              maxH={mobileMenuMaxHeight}
              overflowY="auto"
              overscrollBehavior="contain"
              touchAction="pan-y"
              sx={{
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <MenuItem as={Link} to="/" {...dropdownItemProps}>
                Home
              </MenuItem>
              <MenuItem
                as={isAuthenticated ? Link : 'button'}
                to={isAuthenticated ? '/problems' : undefined}
                onClick={(e) =>
                  !isAuthenticated && handleProtectedLinkClick(e, '/problems', 'Interview Problems')
                }
                {...dropdownItemProps}
              >
                Problems — Interview
              </MenuItem>
              <MenuItem as={Link} to="/ai-problems" {...dropdownItemProps}>
                Problems — AI Generated
              </MenuItem>
              <MenuItem as={Link} to="/games" {...dropdownItemProps}>
                Games
              </MenuItem>
              <MenuItem as={Link} to="/learning" {...dropdownItemProps}>
                Learning
              </MenuItem>
              <MenuItem
                as={isAuthenticated ? Link : 'button'}
                to={isAuthenticated ? '/store' : undefined}
                onClick={(e) =>
                  !isAuthenticated && handleProtectedLinkClick(e, '/store', 'Data Packet Store')
                }
                {...dropdownItemProps}
              >
                Store
              </MenuItem>
              <MenuItem as={Link} to="/leaderboards" {...dropdownItemProps}>
                Leaderboards
              </MenuItem>
              <Box height="1px" bg="var(--cg-window-dark)" my={1} mx={3} />
              <MenuItem as={Link} to="/about" {...dropdownItemProps}>
                How It Works
              </MenuItem>
              <MenuItem as={Link} to="/faq" {...dropdownItemProps}>
                FAQ
              </MenuItem>
              <MenuItem as={Link} to="/coding-interview-practice" {...dropdownItemProps}>
                Practice Guides
              </MenuItem>
              <MenuItem as={Link} to="/blog" {...dropdownItemProps}>
                Blog
              </MenuItem>
              <MenuItem as={Link} to="/updates" {...dropdownItemProps}>
                Updates
              </MenuItem>
              <MenuItem
                as="a"
                href="https://stats.uptimerobot.com/MYXleQpuCX"
                target="_blank"
                rel="noopener noreferrer"
                {...dropdownItemProps}
              >
                CodeGrind Status Page (External)
              </MenuItem>
              <MenuItem as={Link} to="/privacy-policy" {...dropdownItemProps}>
                Privacy & Your Data
              </MenuItem>
              <Box height="1px" bg="var(--cg-window-dark)" my={1} mx={3} />
              <MenuItem
                as={isAuthenticated ? Link : 'button'}
                to={isAuthenticated ? '/pricing' : undefined}
                onClick={(e) =>
                  !isAuthenticated && handleProtectedLinkClick(e, '/pricing', 'Upgrade Membership')
                }
                {...dropdownItemProps}
                bg="rgba(118, 81, 0, 0.12)"
                color="var(--cg-accent-amber)"
                _hover={{ bg: 'rgba(118, 81, 0, 0.2)', color: 'var(--cg-accent-amber)' }}
                _focus={{
                  bg: 'rgba(118, 81, 0, 0.2)',
                  color: 'var(--cg-accent-amber)',
                  boxShadow: 'var(--cg-window-inset)',
                }}
              >
                Upgrade
              </MenuItem>
              {isAuthenticated ? (
                <>
                  {renderProfileSummary()}
                  <MenuItem as={Link} to="/profile" {...dropdownItemProps}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout} {...dropdownItemProps}>
                    Logout
                  </MenuItem>
                </>
              ) : (
                <MenuItem onClick={onAuthModalOpen} {...dropdownItemProps}>
                  Sign In
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        </Box>
      </Flex>
      {hasHydrated ? (
        <Suspense fallback={null}>
          <Modal isOpen={isAuthModalOpen} onClose={onAuthModalClose} size="lg" isCentered>
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent
              bg="var(--cg-window-face)"
              border="2px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-outset), 14px 14px 0 rgba(0, 0, 0, 0.16)"
              borderRadius="0"
            >
              <ModalHeader
                color="var(--cg-header-text)"
                fontFamily="var(--cg-font-retro-display)"
                textTransform="uppercase"
                letterSpacing="0.08em"
                bg="linear-gradient(90deg, var(--cg-header-start), var(--cg-header-end))"
                borderBottom="1px solid rgba(17,17,17,0.72)"
              >
                Sign Up or Log In
              </ModalHeader>
              <ModalCloseButton color="var(--cg-header-text)" />
              <ModalBody pb={6}>
                <Text
                  color="var(--cg-text)"
                  fontFamily="var(--cg-font-retro-display)"
                  mb={4}
                  fontSize="sm"
                >
                  Create a free account to save progress, unlock all features, and track your coding
                  journey.
                </Text>
                <AuthForms defaultIsLogin />
              </ModalBody>
            </ModalContent>
          </Modal>
        </Suspense>
      ) : null}
    </Box>
  );
}

export default Navigation;
