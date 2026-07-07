import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  ListItem,
  Progress,
  Switch,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import React from 'react';

const detailPanelProps = {
  bg: 'var(--cg-window-face)',
  border: '1px solid var(--cg-window-shadow)',
  borderRadius: 0,
  boxShadow: 'var(--cg-window-outset)',
  p: 3,
  maxW: { base: '100%', md: '540px' },
  width: '100%',
};

const ProfileHeaderDetails = ({
  userData,
  tierStyle,
  displayTier,
  isPublicView,
  isDiscordLinked,
  discordStatus,
  membershipTier,
  showMembershipEnd,
  membershipEndDate,
  optInLoading,
  handleSolveOptInChange,
  xpIntoLevel,
  xpToNextLevel,
  xpProgressValue,
  showXpProgress = true,
  showStoreUpsell = false,
}) => (
  <VStack align="start" spacing={{ base: 3, md: 4 }} width="100%">
    <HStack spacing={3} align="center" flexWrap="wrap">
      <Heading
        color="var(--cg-text)"
        fontFamily="var(--cg-font-retro-display)"
        letterSpacing="0.06em"
        textTransform="uppercase"
        fontSize={{ base: 'xl', md: '2xl' }}
      >
        {userData?.username}
      </Heading>
      <Badge
        px={2}
        py={1}
        borderRadius="0"
        fontFamily="var(--cg-font-retro-display)"
        fontSize="xs"
        letterSpacing="0.5px"
        color={tierStyle.color || 'var(--cg-text)'}
        border="1px solid var(--cg-window-shadow)"
        bg="var(--cg-window)"
        textShadow="none"
      >
        {displayTier} TIER
      </Badge>
    </HStack>
    <Text
      color="var(--cg-muted)"
      fontFamily="var(--cg-font-retro-display)"
      borderLeft="2px solid var(--cg-accent-blue)"
      pl={2}
    >
      <Text as="span" display="inline" wordBreak="break-word">
        <Text as="span" color="var(--cg-link)">
          @{userData?.username}
        </Text>{' '}
        • Joined {new Date(userData?.createdAt).toLocaleDateString()}
      </Text>
    </Text>
    <Box
      color="var(--cg-text)"
      maxW={{ base: '100%', md: '600px' }}
      width="100%"
      bg="var(--cg-panel-shell)"
      p={3}
      borderRadius="0"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-inset)"
      position="relative"
    >
      <Text fontFamily="var(--cg-font-retro-display)">{userData?.bio || 'No bio yet'}</Text>
    </Box>
    <VStack align="start" spacing={2}>
      {userData?.progress && (
        <Text
          color="var(--cg-accent-green)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="sm"
        >
          LEVEL {userData.progress.level ?? 1} · {userData.progress.roleName || 'Greenhorn'}
        </Text>
      )}
      {isDiscordLinked && (
        <Text color="var(--cg-accent-blue)" fontFamily="var(--cg-font-retro-display)" fontSize="sm">
          DISCORD:{' '}
          {userData.discordProfile.globalName || userData.discordProfile.username || 'Linked'} · LVL{' '}
          {userData.discordProfile.level ?? 1}
          {userData.discordProfile.roleName ? ` · ROLE ${userData.discordProfile.roleName}` : ''}
        </Text>
      )}
      {!isPublicView && !discordStatus.loading && !discordStatus.linked && (
        <Box {...detailPanelProps}>
          <Text
            color="var(--cg-accent-blue)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
            mb={2}
          >
            LINK.DISCORD.TO.UNLOCK
          </Text>
          <UnorderedList
            spacing={1}
            pl={4}
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            wordBreak="break-word"
          >
            <ListItem>AI assistant + code help bot inside Discord.</ListItem>
            <ListItem>Community tournaments and ranked ladders.</ListItem>
            <ListItem>Daily/weekly challenges with bonus XP boosts.</ListItem>
            <ListItem>Exclusive community collabs, tips, and squad support.</ListItem>
          </UnorderedList>
        </Box>
      )}
      {!isPublicView && membershipTier === 'FREE' && (
        <Box {...detailPanelProps}>
          <Text
            color="var(--cg-accent-blue)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
            mb={2}
          >
            UPGRADE.FOR.MORE.POWER
          </Text>
          <UnorderedList
            spacing={1}
            pl={4}
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            mb={2}
            wordBreak="break-word"
          >
            <ListItem>Premium/Unlimited tiers with bigger limits and faster workflows.</ListItem>
            <ListItem>
              More AI usage, more code execution, and less/no ads depending on tier chosen.
            </ListItem>
            <ListItem>
              Support the platform and unlock future perks, like the ability to receive early access
              to new features.
            </ListItem>
          </UnorderedList>
          <Button as="a" href="/pricing" size="xs">
            VIEW.PRICING
          </Button>
        </Box>
      )}
      {showMembershipEnd && (
        <Text color="var(--cg-muted)" fontFamily="var(--cg-font-retro-display)" fontSize="xs">
          MEMBERSHIP.ENDS{' '}
          {membershipEndDate ? membershipEndDate.toLocaleDateString() : 'END OF BILLING PERIOD'}
        </Text>
      )}
      {showStoreUpsell && (
        <Box {...detailPanelProps}>
          <Text
            color="var(--cg-accent-amber)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="sm"
            mb={2}
          >
            TRICK.OUT.YOUR.PROFILE
          </Text>
          <UnorderedList
            spacing={1}
            pl={4}
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            mb={2}
            wordBreak="break-word"
          >
            <ListItem>
              Buy calling cards to give your profile a custom frame and color scheme.
            </ListItem>
            <ListItem>Equip a badge to show off your play style on your avatar.</ListItem>
            <ListItem>Choose a profile background from animated and static options.</ListItem>
          </UnorderedList>
          <Button as="a" href="/store" size="xs">
            GO.TO.STORE
          </Button>
        </Box>
      )}
      {!isPublicView && isDiscordLinked && (
        <VStack
          align="start"
          spacing={1}
          color="var(--cg-muted)"
          fontFamily="var(--cg-font-retro-display)"
          fontSize="xs"
        >
          <HStack spacing={3}>
            <Text>ANNOUNCE.SOLVES</Text>
            <Switch
              isChecked={discordStatus.optInSolveAnnouncements}
              isDisabled={optInLoading}
              onChange={(event) => handleSolveOptInChange(event.target.checked)}
              colorScheme="teal"
              size="sm"
            />
          </HStack>
          <Text color="var(--cg-muted)">Share your accepted solves to Discord announcements.</Text>
        </VStack>
      )}
      {userData?.progress && showXpProgress && (
        <Box width="100%" maxW={{ base: '100%', md: '320px' }} pt={1}>
          <Text
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            color="var(--cg-muted)"
            mb={1}
          >
            XP.PROGRESS {xpIntoLevel}/{xpToNextLevel}
          </Text>
          <Progress
            value={xpProgressValue}
            size="sm"
            colorScheme="cyan"
            bg="var(--cg-panel-shell)"
            borderRadius="0"
          />
          <Text
            mt={1}
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            color="var(--cg-muted)"
          >
            XP comes from solves, streaks, speed/perfect bonuses, challenges, and tower defense
            wins.
          </Text>
        </Box>
      )}
    </VStack>
  </VStack>
);

export default ProfileHeaderDetails;
