import {
  Box,
  Grid,
  HStack,
  Progress,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  PROFILE_BACKGROUND_PACKS,
  PROFILE_BADGE_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  PROFILE_DEFAULT_BACKGROUND_PACK,
  PROFILE_DEFAULT_BADGE_PACK,
  PROFILE_DEFAULT_CALLING_CARD_PACK,
} from '../../../data/cosmetics/quickCosmeticPacks';
import { api, getApiOrigin } from '../../../services/api';
import logger from '../../../utils/core/logger';
import { getUserFacingErrorMessage } from '../../../utils/ui/userFacingErrors';
import ProfileHeaderActions from './ProfileHeaderActions';
import ProfileHeaderAvatar from './ProfileHeaderAvatar';
import ProfileHeaderDetails from './ProfileHeaderDetails';
import ProfileHeaderDialogs from './ProfileHeaderDialogs';

const MotionBox = motion(Box);

const getDiscordOauthStartUrl = () => {
  return (
    import.meta.env.VITE_DISCORD_OAUTH_START_URL || `${getApiOrigin()}/api/discord/oauth/start`
  );
};

const findPackByStoreSlug = (packs, slug, fallback) => {
  if (!slug) return fallback;
  return packs.find((pack) => pack.storeSlug === slug) || fallback;
};

const DATA_PACKET_REASON_LABELS = {
  level_up_bonus: 'LEVEL UP',
  achievement_unlock: 'ACHIEVEMENT',
  tower_defense_solve: 'TOWER DEFENSE',
  problem_solve: 'PROBLEM SOLVE',
  ai_solve: 'AI SOLVE',
  ai_problem_created: 'AI PROBLEM',
  learning_path_node_complete: 'LEARNING PATH',
  signup_bonus: 'SIGNUP BONUS',
  guest_migration: 'GUEST TRANSFER',
  subscription_stipend: 'SUBSCRIPTION',
};

const formatXpTickerItem = (event) => {
  if (!event) {
    return 'NO RECENT XP EVENTS';
  }

  const details = event.details || {};
  const reasonRaw = details.reason || details.mode || event.reason || '';
  const reason =
    typeof reasonRaw === 'string'
      ? reasonRaw.replace(/[_-]+/g, ' ').trim().toUpperCase()
      : 'XP EVENT';
  const statusRaw = details.status || event.status || '';
  const status = typeof statusRaw === 'string' ? statusRaw.toUpperCase() : '';
  const difficultyRaw = details.difficulty || event.difficulty || '';
  const difficulty = typeof difficultyRaw === 'string' ? difficultyRaw.toUpperCase() : '';

  const pieces = [reason || 'XP EVENT'];
  if (status) {
    pieces.push(status);
  }
  if (difficulty) {
    pieces.push(difficulty);
  }

  return pieces.join(' • ');
};

const formatDataPacketReason = (reason) => {
  if (!reason || typeof reason !== 'string') {
    return 'DATA PACKET GAIN';
  }
  if (DATA_PACKET_REASON_LABELS[reason]) {
    return DATA_PACKET_REASON_LABELS[reason];
  }

  return reason.replace(/[_-]+/g, ' ').trim().toUpperCase();
};

const resolveProfileCosmetics = (userData, cosmeticPreview) => {
  const fallbackBackground = PROFILE_DEFAULT_BACKGROUND_PACK;
  const fallbackCallingCard = PROFILE_DEFAULT_CALLING_CARD_PACK;
  const fallbackBadge = PROFILE_DEFAULT_BADGE_PACK;

  if (cosmeticPreview) {
    return {
      background:
        PROFILE_BACKGROUND_PACKS.find((pack) => pack.id === cosmeticPreview.backgroundId) ||
        fallbackBackground,
      callingCard:
        PROFILE_CALLING_CARD_PACKS.find((pack) => pack.id === cosmeticPreview.callingCardId) ||
        fallbackCallingCard,
      badge:
        PROFILE_BADGE_PACKS.find((pack) => pack.id === cosmeticPreview.badgeId) || fallbackBadge,
    };
  }

  const equipped = userData?.equippedCosmetics || {};
  const equippedBackgroundSlug = equipped?.['profile.background']?.slug;
  const equippedCallingCardSlug = equipped?.['profile.callingCard']?.slug;
  const equippedBadgeSlug = equipped?.['profile.badge']?.slug;

  return {
    background: findPackByStoreSlug(
      PROFILE_BACKGROUND_PACKS,
      equippedBackgroundSlug,
      fallbackBackground
    ),
    callingCard: findPackByStoreSlug(
      PROFILE_CALLING_CARD_PACKS,
      equippedCallingCardSlug,
      fallbackCallingCard
    ),
    badge: findPackByStoreSlug(PROFILE_BADGE_PACKS, equippedBadgeSlug, fallbackBadge),
  };
};

const ProfileHeader = ({
  userData,
  onEditProfile,
  onManageBilling,
  billingLoading,
  billingError,
  avatarLoading,
  avatarError,
  isPublicView = false,
  shareUrl,
  cosmeticPreview = null,
  dataPacketsBalance = null,
  dataPacketEvents = [],
}) => {
  const [discordStatus, setDiscordStatus] = useState({
    linked: false,
    loading: true,
    error: null,
    optInSolveAnnouncements: false,
  });
  const [optInLoading, setOptInLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isUnlinkOpen, onOpen: onUnlinkOpen, onClose: onUnlinkClose } = useDisclosure();
  const cancelRef = useRef();
  const unlinkCancelRef = useRef();
  const toast = useToast();
  const { logout } = useAuth();
  const apiBase = getApiOrigin();
  const discordOauthStartUrl = getDiscordOauthStartUrl();

  useEffect(() => {
    if (isPublicView) {
      setDiscordStatus({
        linked: false,
        loading: false,
        error: null,
        optInSolveAnnouncements: false,
      });
      return undefined;
    }
    let isMounted = true;

    const loadDiscordStatus = async () => {
      try {
        const response = await fetch(`${apiBase}/api/discord/oauth/status`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unable to fetch Discord status');
        }

        const data = await response.json();
        if (isMounted) {
          setDiscordStatus({
            linked: Boolean(data?.linked),
            loading: false,
            error: null,
            optInSolveAnnouncements: Boolean(data?.optInSolveAnnouncements),
          });
        }
      } catch (error) {
        if (isMounted) {
          setDiscordStatus({
            linked: false,
            loading: false,
            error: error.message,
            optInSolveAnnouncements: false,
          });
        }
      }
    };

    loadDiscordStatus();
    return () => {
      isMounted = false;
    };
  }, [apiBase, isPublicView]);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const membershipTier = userData?.membershipTier || 'FREE';
  const displayTier = membershipTier === 'PREMIUM' ? 'PRO' : membershipTier;
  const membershipCancelAtPeriodEnd = Boolean(userData?.subscriptionCancelAtPeriodEnd);
  const membershipEndDate = userData?.subscriptionCancelAt
    ? new Date(userData.subscriptionCancelAt)
    : null;
  const showMembershipEnd =
    membershipTier !== 'FREE' && (membershipCancelAtPeriodEnd || Boolean(membershipEndDate));

  const tierStyles = {
    FREE: { color: 'var(--cg-accent-green)' },
    PRO: { color: 'var(--cg-link)' },
    UNLIMITED: { color: 'var(--cg-accent-amber)' },
  };
  const tierStyle = tierStyles[displayTier] || tierStyles.FREE;

  const handleCopyProfileLink = async () => {
    const linkToCopy = shareUrl || '';
    if (!linkToCopy) {
      toast({
        title: 'Link unavailable',
        description: 'Profile link is not ready yet.',
        status: 'warning',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(linkToCopy);
      toast({
        title: 'Link copied',
        description: 'Profile link copied to clipboard.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch {
      window.prompt('Copy your profile link:', linkToCopy);
    }
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await api.auth.deleteAccount();
      const refundDetails = result?.refund;
      const refundMessage = refundDetails?.refunded
        ? 'Prorated refund requested. Check your email for confirmation.'
        : 'No prorated refund was issued.';

      toast({
        title: 'Account deleted',
        description: refundMessage,
        status: 'success',
        duration: 7000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: getUserFacingErrorMessage(error, 'Could not delete your account.'),
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });
      return;
    } finally {
      setIsDeleting(false);
    }

    try {
      await logout();
    } catch {
      // logout already clears local state; ignore
    }
  };

  const handleConfirmUnlink = async () => {
    if (isUnlinking) {
      return;
    }

    setIsUnlinking(true);
    try {
      await api.discord.unlink();
      setDiscordStatus({
        linked: false,
        loading: false,
        error: null,
        optInSolveAnnouncements: false,
      });
      toast({
        title: 'Discord unlinked',
        description: 'Your Discord account is no longer linked.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      toast({
        title: 'Unlink failed',
        description: getUserFacingErrorMessage(error, 'Could not unlink Discord at this time.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsUnlinking(false);
      onUnlinkClose();
    }
  };

  // Function to convert regular image URL to proxied URL
  const getProxiedImageUrl = (url) => {
    if (!url) return null;

    // For i.imgur.com URLs, always load directly (no proxy)
    if (url.includes('imgur.com')) {
      return url; // Return direct URL for Imgur images
    }

    // Get the backend URL
    const baseUrl = getApiOrigin();
    // Use our backend proxy to bypass CORS issues
    const proxiedUrl = `${baseUrl}/api/image-proxy?url=${encodeURIComponent(url)}`;
    logger.debug(`Using proxied URL: ${proxiedUrl}`);
    return proxiedUrl;
  };

  useEffect(() => {
    // Reset error state when userData changes
    if (userData) {
      logger.debug('ProfileHeader received userData:', {
        username: userData.username,
        hasAvatar: Boolean(userData.avatarUrl),
        avatarUrl: userData.avatarUrl,
      });

      if (userData.avatarUrl) {
        logger.debug(`Avatar URL: ${userData.avatarUrl}`);
        setImageError(false);
        setIsImageLoading(true);

        // Preload image to check if it loads correctly
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          logger.info('Avatar image preloaded successfully in ProfileHeader');
          setIsImageLoading(false);
          setImageError(false);
        };

        img.onerror = (e) => {
          logger.error('Failed to preload avatar image in ProfileHeader', {
            url: userData.avatarUrl,
            error: e.message,
          });

          // If the proxied URL fails, try direct loading as fallback (for Imgur)
          if (userData.avatarUrl.includes('i.imgur.com') && !img.src.includes('image-proxy')) {
            logger.info('Trying direct loading for Imgur image');
            // Use our backend proxy as fallback
            const baseUrl = getApiOrigin();
            const fallbackUrl = `${baseUrl}/api/image-proxy?url=${encodeURIComponent(userData.avatarUrl)}`;

            const fallbackImg = new Image();
            fallbackImg.crossOrigin = 'anonymous';

            fallbackImg.onload = () => {
              logger.info('Fallback image load successful');
              setIsImageLoading(false);
              setImageError(false);
            };

            fallbackImg.onerror = () => {
              logger.error('Fallback image load also failed');
              setIsImageLoading(false);
              setImageError(true);
            };

            fallbackImg.src = fallbackUrl;
            return;
          }

          setIsImageLoading(false);
          setImageError(true);
        };

        // Use appropriate URL strategy
        const imgUrl = getProxiedImageUrl(userData.avatarUrl);
        logger.debug(`Loading avatar image from: ${imgUrl}`);
        img.src = imgUrl;
      } else {
        logger.warn('No avatar URL found in userData');
        setIsImageLoading(false);
      }
    }
  }, [userData]);

  // Also respect externally provided avatar loading/error state (from useProfileForm)
  useEffect(() => {
    if (avatarError) {
      logger.warn('External avatarError detected in ProfileHeader');
      setImageError(true);
    }
  }, [avatarError]);

  const handleImageError = () => {
    logger.error('Failed to load avatar image in Avatar component', {
      url: userData?.avatarUrl,
    });
    setImageError(true);
    setIsImageLoading(false);
  };

  const handleSolveOptInChange = async (nextValue) => {
    if (!discordStatus.linked || optInLoading) return;

    try {
      setOptInLoading(true);
      const data = await api.discord.updateSolveOptIn(nextValue);
      setDiscordStatus((prev) => ({
        ...prev,
        optInSolveAnnouncements: Boolean(data?.optInSolveAnnouncements),
      }));
    } catch (error) {
      logger.error('Failed to update solve announcement opt-in:', error);
    } finally {
      setOptInLoading(false);
    }
  };

  const xpIntoLevel = userData?.progress?.xpIntoLevel ?? 0;
  const xpToNextLevel = userData?.progress?.xpToNextLevel ?? 0;
  const xpProgressValue =
    xpToNextLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)) : 0;

  const isDiscordLinked = discordStatus.loading
    ? Boolean(userData?.discordProfile?.linked)
    : discordStatus.linked;

  const hasValidEmail = Boolean(userData?.email) && !userData.email.endsWith('@discord.codegrind');
  const canUnlinkDiscord = Boolean(isDiscordLinked && userData?.hasPassword && hasValidEmail);

  const profileCosmetics = resolveProfileCosmetics(userData, cosmeticPreview);
  const resolvedDataPacketBalance = Number.isFinite(dataPacketsBalance) ? dataPacketsBalance : null;
  const recentDataPacketEvents = Array.isArray(dataPacketEvents)
    ? dataPacketEvents.filter((event) => Number(event?.amount) > 0).slice(0, 10)
    : [];
  const tickerEvents =
    recentDataPacketEvents.length > 0
      ? recentDataPacketEvents
      : [{ id: 'empty', amount: 0, reason: 'No recent packet rewards yet' }];
  const tickerText = tickerEvents
    .map((event) => {
      const amount = Number(event?.amount) || 0;
      if (amount > 0) {
        return `${formatDataPacketReason(event?.reason)} +${amount} DP`;
      }
      return 'NO RECENT DATA PACKET REWARDS';
    })
    .join('   •   ');
  const recentXpEvents = Array.isArray(userData?.activityTimeline)
    ? userData.activityTimeline.slice(0, 10)
    : [];
  const xpTickerText = (
    recentXpEvents.length > 0
      ? recentXpEvents.map((event) => formatXpTickerItem(event))
      : ['NO RECENT XP EVENTS']
  ).join('   •   ');

  if (!userData) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      width="100%"
      maxW="100%"
      overflowX="clip"
      overflowY="visible"
    >
      <Box className="cg-panel-window" overflow="hidden">
        <HStack
          className="cg-titlebar"
          justify="space-between"
          align="center"
          spacing={3}
          px={{ base: 3, md: 4 }}
          py={2}
        >
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="700" letterSpacing="0.08em">
            PROFILE.CONSOLE
          </Text>
          <Text fontSize="var(--cg-font-size-meta)" opacity={0.85} textTransform="uppercase">
            {isPublicView ? 'Read only profile' : 'Authenticated session'}
          </Text>
        </HStack>

        <Grid
          templateColumns={{ base: '1fr', md: 'auto 1fr' }}
          gap={{ base: 6, md: 8 }}
          bg="var(--cg-panel-shell)"
          background={profileCosmetics.background.background}
          backgroundSize={profileCosmetics.background.backgroundSize || '100% 100%'}
          animation={profileCosmetics.background.animation || 'none'}
          p={{ base: 4, md: 6 }}
          borderTop="1px solid var(--cg-window-light)"
          borderRadius="0"
          border="1px solid var(--cg-window-shadow)"
          boxShadow="var(--cg-window-inset)"
          position="relative"
          overflowX="clip"
          overflowY={{ base: 'visible', md: 'hidden' }}
          width="100%"
          maxW="100%"
          minW={0}
          justifyItems={{ base: 'center', md: 'start' }}
        >
          {profileCosmetics.background.overlay && (
            <Box
              position="absolute"
              inset={0}
              bg={profileCosmetics.background.overlay}
              backgroundSize={profileCosmetics.background.overlayBgSize || 'auto'}
              opacity={profileCosmetics.background.overlayOpacity ?? 0.34}
              animation={profileCosmetics.background.overlayAnimation || 'none'}
              pointerEvents="none"
            />
          )}

          {profileCosmetics.callingCard.animatedAccent && (
            <Box
              position="absolute"
              inset={0}
              pointerEvents="none"
              bg={`linear-gradient(120deg, transparent 0%, ${profileCosmetics.callingCard.accentColor}22 35%, transparent 70%)`}
              backgroundSize="180% 180%"
              animation="cosmetic-gradient-flow 3.8s ease-in-out infinite"
            />
          )}

          <ProfileHeaderAvatar
            userData={userData}
            imageError={imageError}
            isImageLoading={isImageLoading}
            avatarLoading={avatarLoading}
            profileBadgePack={profileCosmetics.badge}
            onImageError={handleImageError}
          />

          <Grid
            templateColumns={{ base: '1fr', lg: '1fr auto' }}
            gap={{ base: 4, md: 6 }}
            alignItems={{ base: 'start', lg: 'start' }}
            width="100%"
            minW={0}
          >
            <ProfileHeaderDetails
              userData={userData}
              tierStyle={tierStyle}
              displayTier={displayTier}
              isPublicView={isPublicView}
              isDiscordLinked={isDiscordLinked}
              discordStatus={discordStatus}
              membershipTier={membershipTier}
              showMembershipEnd={showMembershipEnd}
              membershipEndDate={membershipEndDate}
              optInLoading={optInLoading}
              handleSolveOptInChange={handleSolveOptInChange}
              xpIntoLevel={xpIntoLevel}
              xpToNextLevel={xpToNextLevel}
              xpProgressValue={xpProgressValue}
              profileBadgePack={profileCosmetics.badge}
              showXpProgress={isPublicView}
              showStoreUpsell={
                !isPublicView &&
                !userData?.equippedCosmetics?.['profile.background'] &&
                !userData?.equippedCosmetics?.['profile.callingCard'] &&
                !userData?.equippedCosmetics?.['profile.badge']
              }
            />
            <ProfileHeaderActions
              isPublicView={isPublicView}
              onEditProfile={onEditProfile}
              onManageBilling={onManageBilling}
              billingLoading={billingLoading}
              billingError={billingError}
              handleCopyProfileLink={handleCopyProfileLink}
              onDeleteOpen={onDeleteOpen}
              discordStatus={discordStatus}
              isDiscordLinked={isDiscordLinked}
              canUnlinkDiscord={canUnlinkDiscord}
              onUnlinkOpen={onUnlinkOpen}
              discordOauthStartUrl={discordOauthStartUrl}
              shareUrl={
                shareUrl ||
                (userData?.id ? `${window.location.origin}/profile/${userData.id}` : undefined)
              }
              userData={userData}
            />
          </Grid>

          <Grid
            gridColumn="1 / -1"
            templateColumns={
              isPublicView
                ? '1fr'
                : { base: '1fr', xl: 'minmax(0, 1.4fr) minmax(260px, 1fr) minmax(220px, 0.9fr)' }
            }
            gap={3}
            alignItems="stretch"
            width="100%"
            zIndex={1}
          >
            {/* Calling Card Strip */}
            <Box
              position="relative"
              overflow="hidden"
              borderRadius="0"
              border="1px solid var(--cg-window-shadow)"
              boxShadow="var(--cg-window-inset)"
              bg="var(--cg-window-face)"
              px={{ base: 3, md: 5 }}
              py={3}
            >
              {profileCosmetics.callingCard.cardBgOverlay && (
                <Box
                  position="absolute"
                  inset={0}
                  pointerEvents="none"
                  background={profileCosmetics.callingCard.cardBgOverlay}
                  backgroundSize={profileCosmetics.callingCard.cardBgOverlaySize || '100% 100%'}
                  animation={profileCosmetics.callingCard.cardBgOverlayAnimation || 'none'}
                  opacity={0.16}
                  zIndex={0}
                />
              )}
              <Box
                position="absolute"
                top={0}
                bottom={0}
                left={0}
                width="4px"
                bg={profileCosmetics.callingCard.accentColor}
                zIndex={1}
              />
              <Box
                pl={3}
                position="relative"
                zIndex={1}
                minH="100%"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                gap={2}
                minW={0}
              >
                <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap" minW={0}>
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="700"
                      color="var(--cg-text)"
                      letterSpacing="0.06em"
                      lineHeight={1.2}
                      textTransform="uppercase"
                      noOfLines={1}
                    >
                      {userData.username}
                    </Text>
                    {userData?.progress?.roleName && (
                      <Text
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="var(--cg-font-size-meta)"
                        color="var(--cg-muted)"
                        letterSpacing="0.08em"
                        textTransform="uppercase"
                        noOfLines={1}
                      >
                        {userData.progress.roleName}
                      </Text>
                    )}
                  </VStack>

                  <Text
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="xs"
                    color={profileCosmetics.callingCard.accentColor}
                    fontWeight="600"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    whiteSpace={{ base: 'normal', md: 'nowrap' }}
                    textAlign={{ base: 'left', md: 'right' }}
                    maxW="100%"
                    wordBreak="break-word"
                  >
                    {profileCosmetics.callingCard.name}
                  </Text>
                </HStack>

                <HStack
                  justify="space-between"
                  align={{ base: 'stretch', sm: 'center' }}
                  spacing={3}
                  flexWrap="wrap"
                  flexDirection={{ base: 'column', sm: 'row' }}
                >
                  <HStack spacing={2} minW={0}>
                    {profileCosmetics.badge?.glyph && (
                      <Box
                        w="28px"
                        h="28px"
                        borderRadius="0"
                        background={profileCosmetics.badge.badgeBackground}
                        border="1px solid var(--cg-window-shadow)"
                        boxShadow="var(--cg-window-outset)"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        animation={profileCosmetics.badge.badgeAnimation || 'none'}
                      >
                        <Text
                          fontFamily="var(--cg-font-retro-display)"
                          fontSize="var(--cg-font-size-meta)"
                          fontWeight="700"
                          color="var(--cg-text)"
                          letterSpacing="0.05em"
                        >
                          {profileCosmetics.badge.glyph}
                        </Text>
                      </Box>
                    )}

                    <HStack spacing={2} minW={0}>
                      <Text
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="xs"
                        color="var(--cg-muted)"
                        textTransform="uppercase"
                      >
                        {displayTier}
                      </Text>
                      <Text
                        fontFamily="var(--cg-font-retro-display)"
                        fontSize="xs"
                        color={profileCosmetics.callingCard.accentColor}
                        textTransform="uppercase"
                      >
                        LVL {userData?.progress?.level ?? 1}
                      </Text>
                    </HStack>
                  </HStack>

                  <HStack
                    spacing={1}
                    align="center"
                    ml={{ base: 0, md: 'auto' }}
                    w={{ base: '100%', sm: 'auto' }}
                    justify={{ base: 'space-between', sm: 'flex-end' }}
                  >
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="sm"
                      color={profileCosmetics.callingCard.accentColor}
                      fontWeight="700"
                    >
                      {userData?.stats?.problemsSolved ?? 0}
                    </Text>
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="var(--cg-font-size-micro)"
                      color="var(--cg-muted)"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                    >
                      SOLVED
                    </Text>
                  </HStack>
                </HStack>
              </Box>
            </Box>

            {!isPublicView && (
              <Box
                position="relative"
                overflow="hidden"
                borderRadius="0"
                border="1px solid var(--cg-window-shadow)"
                borderLeft={`4px solid ${profileCosmetics.callingCard.accentColor}`}
                bg="var(--cg-panel-shell)"
                boxShadow="var(--cg-window-inset)"
                px={{ base: 3, md: 4 }}
                py={2}
                minW={0}
              >
                <HStack
                  justify="space-between"
                  align={{ base: 'flex-start', sm: 'center' }}
                  spacing={2}
                  mb={2}
                  flexDirection={{ base: 'column', sm: 'row' }}
                >
                  <Text
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="var(--cg-font-size-meta)"
                    color="var(--cg-muted)"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                  >
                    data_packets.log
                  </Text>
                  <Text
                    fontFamily="var(--cg-font-retro-display)"
                    fontSize="sm"
                    color="var(--cg-link)"
                    fontWeight="700"
                  >
                    {resolvedDataPacketBalance ?? '—'} DP
                  </Text>
                </HStack>

                <Box
                  border="1px solid var(--cg-window-shadow)"
                  borderRadius="0"
                  bg="var(--cg-window-face)"
                  boxShadow="var(--cg-window-inset)"
                  px={2}
                  py={1.5}
                  overflow="hidden"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                      'linear-gradient(90deg, var(--cg-window-face) 0%, rgba(240, 240, 224, 0) 8%, rgba(240, 240, 224, 0) 92%, var(--cg-window-face) 100%)',
                    zIndex: 2,
                  }}
                >
                  <MotionBox
                    display="inline-flex"
                    minWidth="max-content"
                    alignItems="center"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 16, ease: 'linear', repeat: Infinity }}
                  >
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="var(--cg-font-size-meta)"
                      color="var(--cg-muted)"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                      pr={8}
                    >
                      {tickerText}
                    </Text>
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="10px"
                      color="var(--cg-muted)"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                    >
                      {tickerText}
                    </Text>
                  </MotionBox>
                </Box>
              </Box>
            )}

            {!isPublicView && userData?.progress && (
              <Box
                borderRadius="0"
                border="1px solid var(--cg-window-shadow)"
                borderLeft="4px solid var(--cg-accent-green)"
                bg="var(--cg-panel-shell)"
                boxShadow="var(--cg-window-inset)"
                px={{ base: 3, md: 4 }}
                py={2}
                minW={0}
              >
                <Text
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="var(--cg-font-size-meta)"
                  color="var(--cg-muted)"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  mb={1}
                >
                  xp_progress.log
                </Text>
                <Text
                  fontFamily="var(--cg-font-retro-display)"
                  fontSize="xs"
                  color="var(--cg-muted)"
                  mb={1}
                >
                  {xpIntoLevel}/{xpToNextLevel}
                </Text>
                <Progress
                  value={xpProgressValue}
                  size="sm"
                  colorScheme="green"
                  bg="var(--cg-window-face)"
                  borderRadius="0"
                  sx={{
                    '> div': {
                      background: 'linear-gradient(90deg, var(--cg-accent-green), #b9d88a)',
                    },
                  }}
                />
                <Box
                  mt={2}
                  border="1px solid var(--cg-window-shadow)"
                  borderRadius="0"
                  bg="var(--cg-window-face)"
                  boxShadow="var(--cg-window-inset)"
                  px={2}
                  py={1}
                  overflow="hidden"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background:
                      'linear-gradient(90deg, var(--cg-window-face) 0%, rgba(240, 240, 224, 0) 8%, rgba(240, 240, 224, 0) 92%, var(--cg-window-face) 100%)',
                    zIndex: 2,
                  }}
                >
                  <MotionBox
                    display="inline-flex"
                    minWidth="max-content"
                    alignItems="center"
                    animate={{ x: ['0%', '-50%'] }}
                    transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
                  >
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="var(--cg-font-size-meta)"
                      color="var(--cg-muted)"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                      pr={8}
                    >
                      {xpTickerText}
                    </Text>
                    <Text
                      fontFamily="var(--cg-font-retro-display)"
                      fontSize="var(--cg-font-size-meta)"
                      color="var(--cg-muted)"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      whiteSpace="nowrap"
                    >
                      {xpTickerText}
                    </Text>
                  </MotionBox>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>

      <ProfileHeaderDialogs
        isPublicView={isPublicView}
        isDeleteOpen={isDeleteOpen}
        cancelRef={cancelRef}
        onDeleteClose={onDeleteClose}
        handleConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
        isUnlinkOpen={isUnlinkOpen}
        unlinkCancelRef={unlinkCancelRef}
        onUnlinkClose={onUnlinkClose}
        handleConfirmUnlink={handleConfirmUnlink}
        isUnlinking={isUnlinking}
      />
    </MotionBox>
  );
};

export default ProfileHeader;
