import React, { useMemo } from 'react';
import { Badge, Box, Flex, Heading, SimpleGrid, Text, Tooltip, VStack } from '@chakra-ui/react';
import audioManager from '../../../utils/audio/AudioManager';
import { RETRO_UTILITY_ICON_ASSET } from '../../../utils/assets/towerDefenseAssetUrls';
import { DEPLOYABLE_TYPES } from '../../../game-engine-v2';

const getAffordabilitySignature = (items, credits) =>
  items.map((item) => `${item.key || item.type}:${credits >= item.cost ? 1 : 0}`).join('|');

const getUnlockGateSignature = (unlockGates) =>
  Object.keys(unlockGates || {})
    .sort()
    .map((key) => {
      const gate = unlockGates[key] || {};
      return `${key}:${gate.locked ? 1 : 0}:${gate.minLevel ?? ''}:${gate.requiredDp ?? ''}`;
    })
    .join('|');

const DeployableCard = ({
  deployable,
  canAfford,
  isSelected,
  isDisabled,
  onClick,
  isStoreLocked = false,
  storeGate = null,
  shellTheme = 'default',
}) => {
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const uiFontFamily = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', sans-serif";
  const borderColor = isRetroDesktopTheme
    ? isSelected
      ? '#0b2ba8'
      : '#232730'
    : isSelected
      ? '#ff9900'
      : 'rgba(255, 255, 255, 0.12)';
  const glow = isRetroDesktopTheme
    ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
    : isSelected
      ? '0 0 12px rgba(255, 153, 0, 0.4)'
      : '0 0 8px rgba(0, 0, 0, 0.4)';
  const lockMessage = isStoreLocked
    ? `LOCKED: Requires Level ${storeGate?.minLevel ?? '?'}${storeGate?.requiredDp ? ` • ${storeGate.requiredDp} DP` : ' • Store Unlock'}`
    : '';

  return (
    <Tooltip
      label={isStoreLocked ? lockMessage : deployable.description}
      placement="top"
      hasArrow
      bg={isRetroDesktopTheme ? '#f4efe6' : undefined}
      color={isRetroDesktopTheme ? '#1f2128' : undefined}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={isDisabled ? undefined : onClick}
        bg={isRetroDesktopTheme ? (isSelected ? '#ece7dc' : '#f4efe6') : 'rgba(10, 20, 30, 0.9)'}
        borderRadius={isRetroDesktopTheme ? '0' : 'md'}
        border={isRetroDesktopTheme ? `2px solid ${borderColor}` : `1px solid ${borderColor}`}
        px={3}
        py={2}
        opacity={isDisabled ? 0.5 : 1}
        boxShadow={glow}
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        transition="all 0.15s ease"
        _hover={
          !isDisabled
            ? {
                transform: isRetroDesktopTheme ? 'translateY(1px)' : 'translateY(-2px)',
                boxShadow: glow,
              }
            : undefined
        }
      >
        <Flex align="center" justify="space-between" mb={1}>
          <Text
            fontSize="sm"
            color={isRetroDesktopTheme ? '#7c4914' : '#ffcc66'}
            fontWeight="bold"
            fontFamily={uiFontFamily}
          >
            {deployable.icon} {deployable.type}
          </Text>
          <Badge
            bg={
              isRetroDesktopTheme
                ? deployable.placementType === 'path'
                  ? '#d9ecd7'
                  : '#ddd2ec'
                : undefined
            }
            color={
              isRetroDesktopTheme
                ? deployable.placementType === 'path'
                  ? '#285d2f'
                  : '#5d2e8c'
                : undefined
            }
            colorScheme={
              isRetroDesktopTheme
                ? undefined
                : deployable.placementType === 'path'
                  ? 'green'
                  : 'purple'
            }
            fontSize="0.6rem"
          >
            {deployable.placementType === 'path' ? 'PATH' : 'ANY'}
          </Badge>
        </Flex>
        <Text
          fontSize="xs"
          color={isRetroDesktopTheme ? '#3f4550' : '#9bd1ff'}
          fontFamily={uiFontFamily}
        >
          Cost: {deployable.cost} bits
        </Text>
        {!canAfford && (
          <Text
            fontSize="xs"
            color={isRetroDesktopTheme ? '#8b1f18' : '#ff3366'}
            mt={1}
            fontFamily={uiFontFamily}
          >
            Insufficient bits
          </Text>
        )}
        {isStoreLocked && (
          <Text
            fontSize="xs"
            color={isRetroDesktopTheme ? '#5d2e8c' : '#d6a1ff'}
            mt={1}
            fontFamily={uiFontFamily}
          >
            {lockMessage}
          </Text>
        )}
      </Box>
    </Tooltip>
  );
};

const DeployableSelector = ({
  credits = 0,
  selectedDeployableType = null,
  onSelectDeployable,
  gameStatus,
  onCancelPlacement,
  deployableUnlockGates = {},
  shellTheme = 'default',
}) => {
  const deployables = useMemo(() => Object.values(DEPLOYABLE_TYPES), []);
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const uiFontFamily = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', sans-serif";

  const canPlaceDeployables = ['ready', 'playing', 'wave-complete'].includes(gameStatus);

  const handleSelect = (deployableKey) => {
    if (!onSelectDeployable) return;
    audioManager.playSoundEffect('button-click');
    onSelectDeployable(deployableKey);
  };

  return (
    <VStack
      width="100%"
      bg={isRetroDesktopTheme ? '#d4d0c8' : '#0a0a1a'}
      p={4}
      spacing={4}
      align="stretch"
      overflow="auto"
      height="100%"
      flexGrow={1}
      minWidth="280px"
      borderRight={isRetroDesktopTheme ? '2px solid #232730' : '1px solid #2f1f0d'}
      boxShadow={
        isRetroDesktopTheme
          ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
          : '0 0 15px rgba(255, 153, 0, 0.1) inset'
      }
      position="relative"
      data-tutorial="deployable-selector"
    >
      {isRetroDesktopTheme ? (
        <Box
          px={3}
          py={2}
          bg="linear-gradient(180deg, #0b2ba8 0%, #081a77 100%)"
          border="2px solid #10131c"
          borderRadius="0"
          boxShadow="inset 1px 1px 0 rgba(255,255,255,0.22)"
        >
          <Flex align="center" gap={3}>
            <Box
              w="34px"
              h="34px"
              bg="#d4d0c8"
              border="1px solid rgba(8, 26, 119, 0.45)"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.82), inset -1px -1px 0 rgba(66,72,82,0.28)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Box
                as="img"
                src={RETRO_UTILITY_ICON_ASSET}
                alt=""
                aria-hidden="true"
                w="20px"
                h="20px"
                imageRendering="pixelated"
              />
            </Box>
            <Text
              color="#f5f7ff"
              fontFamily={uiFontFamily}
              fontSize="sm"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              Utility Shelf
            </Text>
          </Flex>
        </Box>
      ) : (
        <Heading
          size="md"
          color="#ff9900"
          fontFamily="'Orbitron', sans-serif"
          textShadow="0 0 10px rgba(255, 153, 0, 0.6)"
          letterSpacing="1px"
          borderBottom="1px solid rgba(255, 153, 0, 0.3)"
          pb={2}
        >
          DEPLOYABLES
        </Heading>
      )}

      {!canPlaceDeployables && (
        <Text
          fontSize="sm"
          color={isRetroDesktopTheme ? '#3f4550' : '#9bd1ff'}
          fontFamily={uiFontFamily}
        >
          Deployables unlock once the system is jacked in.
        </Text>
      )}

      <SimpleGrid columns={2} spacing={3} opacity={canPlaceDeployables ? 1 : 0.6}>
        {deployables.map((deployable) => {
          const canAfford = credits >= deployable.cost;
          const isSelected =
            selectedDeployableType === deployable.key || selectedDeployableType === deployable.type;
          const gateKey = deployable.key || deployable.type?.toUpperCase();
          const storeGate = deployableUnlockGates[gateKey];
          const isStoreLocked = Boolean(storeGate?.locked);
          const isDisabled = !canPlaceDeployables || !canAfford || isStoreLocked;
          const cardWithLock = (
            <Box key={deployable.key} position="relative">
              <DeployableCard
                deployable={deployable}
                canAfford={canAfford}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onClick={() => !isStoreLocked && handleSelect(deployable.key)}
                isStoreLocked={isStoreLocked}
                storeGate={storeGate}
                shellTheme={shellTheme}
              />
              {isStoreLocked && (
                <Badge
                  position="absolute"
                  top="4px"
                  right="4px"
                  bg={isRetroDesktopTheme ? '#ddd2ec' : '#1a0d2e'}
                  color={isRetroDesktopTheme ? '#5d2e8c' : '#bf7fff'}
                  fontSize="9px"
                  textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #bf7fff'}
                  borderRadius="sm"
                  px={1}
                >
                  LOCKED
                </Badge>
              )}
            </Box>
          );
          return cardWithLock;
        })}
      </SimpleGrid>

      {selectedDeployableType && (
        <Text
          fontSize="xs"
          color={isRetroDesktopTheme ? '#7c4914' : '#ffcc66'}
          textAlign="center"
          cursor="pointer"
          onClick={() => onCancelPlacement?.()}
          fontFamily={uiFontFamily}
          fontWeight={isRetroDesktopTheme ? '700' : undefined}
        >
          Cancel deployable placement
        </Text>
      )}
    </VStack>
  );
};

const areEqual = (prevProps, nextProps) => {
  const deployables = Object.values(DEPLOYABLE_TYPES);

  return (
    prevProps.selectedDeployableType === nextProps.selectedDeployableType &&
    prevProps.onSelectDeployable === nextProps.onSelectDeployable &&
    prevProps.gameStatus === nextProps.gameStatus &&
    prevProps.onCancelPlacement === nextProps.onCancelPlacement &&
    prevProps.shellTheme === nextProps.shellTheme &&
    getUnlockGateSignature(prevProps.deployableUnlockGates) ===
      getUnlockGateSignature(nextProps.deployableUnlockGates) &&
    getAffordabilitySignature(deployables, prevProps.credits) ===
      getAffordabilitySignature(deployables, nextProps.credits)
  );
};

export default React.memo(DeployableSelector, areEqual);
