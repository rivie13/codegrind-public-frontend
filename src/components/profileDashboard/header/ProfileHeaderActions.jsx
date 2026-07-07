import { Box, Button, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import SocialShareButtons from '../../shared/SocialShareButtons';

const actionButtonProps = {
  bg: 'var(--cg-window)',
  color: 'var(--cg-text)',
  border: '1px solid var(--cg-window-shadow)',
  boxShadow: 'var(--cg-window-outset)',
  _hover: {
    bg: 'var(--cg-panel-shell)',
  },
  _active: {
    boxShadow: 'var(--cg-window-inset)',
    transform: 'translate(1px, 1px)',
  },
  size: 'sm',
  width: { base: '100%', lg: 'auto' },
};

const createActionButtonProps = (color = 'var(--cg-text)') => ({
  ...actionButtonProps,
  color,
});

const ProfileHeaderActions = ({
  isPublicView,
  onEditProfile,
  onManageBilling,
  billingLoading,
  billingError,
  handleCopyProfileLink,
  onDeleteOpen,
  discordStatus,
  isDiscordLinked,
  canUnlinkDiscord,
  onUnlinkOpen,
  discordOauthStartUrl,
  shareUrl,
  userData,
}) => (
  <VStack
    align={{ base: 'stretch', lg: 'end' }}
    spacing={2}
    minW={{ base: '100%', lg: '180px' }}
    width="100%"
    maxW="100%"
  >
    {!isPublicView && (
      <Button as={RouterLink} to="/store" {...createActionButtonProps('var(--cg-accent-blue)')}>
        OPEN.STORE
      </Button>
    )}
    <Button {...createActionButtonProps('var(--cg-accent-blue)')} onClick={handleCopyProfileLink}>
      COPY.PROFILE.LINK
    </Button>
    {shareUrl && (
      <Box
        p={2}
        border="1px solid var(--cg-window-shadow)"
        borderRadius="0"
        boxShadow="var(--cg-window-outset)"
        bg="var(--cg-window-face)"
        width={{ base: '100%', lg: 'auto' }}
      >
        <Text
          fontFamily="var(--cg-font-retro-display)"
          fontSize="xs"
          color="var(--cg-muted)"
          mb={1.5}
          textAlign={{ base: 'left', lg: 'right' }}
          textTransform="uppercase"
          letterSpacing="1px"
        >
          Share Profile
        </Text>
        <Box display="flex" justifyContent={{ base: 'flex-start', lg: 'flex-end' }}>
          <SocialShareButtons
            url={shareUrl}
            text={`Check out ${userData?.username || 'this'}'s CodeGrind profile! Level ${userData?.progress?.level ?? ''} ${userData?.progress?.roleName ?? ''}. Try coding challenges at CodeGrind! 🎯`}
            compact
          />
        </Box>
      </Box>
    )}
    {!isPublicView && (
      <Button
        {...createActionButtonProps('var(--cg-accent-blue)')}
        onClick={onEditProfile}
        leftIcon={
          <Box as="span" fontSize="10px">
            ⟨⟨
          </Box>
        }
        rightIcon={
          <Box as="span" fontSize="10px">
            ⟩⟩
          </Box>
        }
      >
        EDIT.PROFILE
      </Button>
    )}
    {!isPublicView && onManageBilling && (
      <Button
        {...createActionButtonProps('var(--cg-accent-amber)')}
        onClick={onManageBilling}
        isLoading={billingLoading}
        loadingText="Opening"
      >
        MANAGE.BILLING
      </Button>
    )}
    {!isPublicView && billingError && (
      <Text color="var(--cg-accent-red)" fontFamily="var(--cg-font-retro-display)" fontSize="xs">
        {billingError}
      </Text>
    )}
    {!isPublicView && (
      <Button {...createActionButtonProps('var(--cg-accent-red)')} onClick={onDeleteOpen}>
        DELETE.ACCOUNT
      </Button>
    )}
    <Button
      as="a"
      href="https://discord.gg/6NvX2Q8raT"
      target="_blank"
      rel="noreferrer"
      {...createActionButtonProps('var(--cg-accent-green)')}
    >
      JOIN.DISCORD
    </Button>
    {!isPublicView && (
      <Button
        {...createActionButtonProps('var(--cg-accent-blue)')}
        isDisabled={discordStatus.loading || isDiscordLinked}
        onClick={() => {
          window.location.href = discordOauthStartUrl;
        }}
      >
        {discordStatus.loading
          ? 'DISCORD.LOADING'
          : isDiscordLinked
            ? 'DISCORD.LINKED'
            : 'LINK.DISCORD'}
      </Button>
    )}
    {!isPublicView && isDiscordLinked && (
      <Button
        {...createActionButtonProps('var(--cg-accent-amber)')}
        isDisabled={!canUnlinkDiscord}
        onClick={() => {
          if (!canUnlinkDiscord) {
            return;
          }
          onUnlinkOpen();
        }}
      >
        UNLINK.DISCORD
      </Button>
    )}
    {!isPublicView && isDiscordLinked && !canUnlinkDiscord && (
      <Text
        color="var(--cg-accent-amber)"
        fontFamily="var(--cg-font-retro-display)"
        fontSize="xs"
        maxW={{ base: '100%', lg: '220px' }}
        textAlign={{ base: 'left', lg: 'right' }}
      >
        Set a password and add a valid email before unlinking Discord.
      </Text>
    )}
    {!isPublicView && discordStatus.error && (
      <Text color="var(--cg-accent-red)" fontFamily="var(--cg-font-retro-display)" fontSize="xs">
        {discordStatus.error}
      </Text>
    )}
  </VStack>
);

export default ProfileHeaderActions;
