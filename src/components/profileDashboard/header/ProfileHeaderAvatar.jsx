import { Avatar, Box, HStack, Spinner, Text, Tooltip, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';

const RARITY_COLORS = {
  common: { color: 'var(--cg-muted)', label: 'COMMON' },
  rare: { color: 'var(--cg-link)', label: 'RARE' },
  epic: { color: 'var(--cg-accent-blue)', label: 'EPIC' },
  legendary: { color: 'var(--cg-accent-amber)', label: 'LEGENDARY' },
};

const BadgeTooltipContent = ({ pack }) => {
  const rarity = RARITY_COLORS[pack.rarity] || RARITY_COLORS.common;
  return (
    <VStack align="start" spacing={1} p={1}>
      <HStack spacing={2} align="center">
        <Text
          fontFamily="var(--cg-font-retro-display)"
          fontWeight="700"
          fontSize="sm"
          color="var(--cg-text)"
        >
          {pack.name}
        </Text>
        <Text
          fontFamily="var(--cg-font-retro-display)"
          fontSize="xs"
          color={rarity.color}
          fontWeight="700"
        >
          [{rarity.label}]
        </Text>
      </HStack>
      <Text fontFamily="var(--cg-font-retro-display)" fontSize="xs" color="var(--cg-muted)">
        {pack.description}
      </Text>
      <Text fontFamily="var(--cg-font-retro-display)" fontSize="xs" color="var(--cg-link)">
        UNLOCK: Purchase from Store · {pack.priceDataPackets} Data Packets
      </Text>
    </VStack>
  );
};

const MotionBox = motion(Box);

const ProfileHeaderAvatar = ({
  userData,
  imageError,
  isImageLoading,
  avatarLoading,
  profileBadgePack,
  onImageError,
}) => (
  <MotionBox
    initial={{ scale: 0.9 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.5 }}
    position="relative"
  >
    <Box
      p={{ base: 2.5, md: 3 }}
      bg="var(--cg-window-face)"
      border="2px solid var(--cg-window-shadow)"
      boxShadow="var(--cg-window-outset)"
      position="relative"
    >
      <Box
        position="relative"
        p={1}
        bg="var(--cg-panel-shell)"
        border="1px solid var(--cg-window-dark)"
        boxShadow="var(--cg-window-inset)"
      >
        <Avatar
          size={{ base: 'xl', md: '2xl' }}
          name={userData?.username}
          src={userData?.avatarUrl}
          bg="var(--cg-window-face)"
          border="1px solid var(--cg-window-shadow)"
          borderRadius="6px"
          position="relative"
          zIndex={1}
          onError={onImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {import.meta.env.DEV && (
          <Box
            position="absolute"
            top="-25px"
            right="0"
            fontSize="xs"
            color="gray.400"
            display="none"
          >
            {userData?.avatarUrl ? `URL: ${userData.avatarUrl.slice(0, 20)}...` : 'No URL'}
            {imageError ? ' (Error)' : ''}
          </Box>
        )}

        {(isImageLoading || avatarLoading) && (
          <Box
            position="absolute"
            inset={1}
            zIndex={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="rgba(240, 240, 224, 0.82)"
            borderRadius="4px"
          >
            <Spinner color="var(--cg-link)" size="md" />
          </Box>
        )}

        {userData?.avatarUrl && imageError && (
          <Box
            position="absolute"
            inset={1}
            zIndex={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="rgba(240, 240, 224, 0.88)"
            borderRadius="4px"
            color="var(--cg-accent-red)"
            fontSize="xs"
            fontFamily="var(--cg-font-retro-display)"
            textAlign="center"
            p={2}
          >
            Image
            <br />
            Error
          </Box>
        )}
      </Box>

      {profileBadgePack?.glyph && (
        <Tooltip
          label={<BadgeTooltipContent pack={profileBadgePack} />}
          placement="bottom-end"
          hasArrow
          bg="var(--cg-window-face)"
          color="var(--cg-text)"
          border="1px solid var(--cg-window-shadow)"
          borderRadius="0"
          maxW="240px"
          openDelay={200}
        >
          <Box
            position="absolute"
            right="-8px"
            bottom="-6px"
            zIndex={3}
            w="34px"
            h="34px"
            borderRadius="0"
            bg={profileBadgePack.badgeBackground}
            border="1px solid var(--cg-window-shadow)"
            boxShadow="var(--cg-window-outset)"
            color="var(--cg-text)"
            fontFamily="var(--cg-font-retro-display)"
            fontSize="xs"
            fontWeight="700"
            display="flex"
            alignItems="center"
            justifyContent="center"
            letterSpacing="0.04em"
            cursor="help"
          >
            {profileBadgePack.glyph}
          </Box>
        </Tooltip>
      )}
    </Box>
  </MotionBox>
);

export default ProfileHeaderAvatar;
