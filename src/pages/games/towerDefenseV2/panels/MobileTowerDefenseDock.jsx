import React from 'react';
import { Box, Button, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';

const formatUnlockGateLabel = (storeGate) => {
  if (!storeGate?.locked) return null;

  const levelLabel = storeGate?.minLevel ? `L${storeGate.minLevel}` : 'LOCKED';
  const dpLabel = storeGate?.requiredDp ? ` • ${storeGate.requiredDp} DP` : '';
  return `${levelLabel}${dpLabel}`;
};

const TARGETING_LABELS = {
  closest: 'Closest',
  furthest: 'Furthest',
  'highest-health': 'Highest HP',
  'lowest-health': 'Lowest HP',
};

const TARGETING_COMPACT_LABELS = {
  closest: 'Close',
  furthest: 'Far',
  'highest-health': 'High HP',
  'lowest-health': 'Low HP',
};

const formatTargetingLabel = (targetingMode, compact = false) => {
  if (!targetingMode) return compact ? 'Target' : 'Unknown';

  const labelMap = compact ? TARGETING_COMPACT_LABELS : TARGETING_LABELS;
  return labelMap[targetingMode] || targetingMode.replace(/-/g, ' ');
};

const hexToRgba = (hexColor, alpha = 1) => {
  const normalized = String(hexColor || '')
    .trim()
    .replace('#', '');

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  if (expanded.length !== 6) {
    return `rgba(0, 204, 255, ${alpha})`;
  }

  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const formatTowerLabel = (towerType) =>
  String(towerType || 'Tower')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/AI/g, 'AI ')
    .replace(/\s+/g, ' ')
    .trim();

const getTutorialAttribute = (towerType) => {
  switch (
    String(towerType)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
  ) {
    case 'FUNCTION':
      return 'tower-function';
    case 'OBJECT':
      return 'tower-object';
    case 'VARIABLE':
      return 'tower-variable';
    case 'IFCONDITION':
    case 'CONDITIONAL':
      return 'tower-conditional';
    case 'FORLOOP':
    case 'LOOP':
      return 'tower-for-loop';
    case 'WHILELOOP':
      return 'tower-while-loop';
    case 'ARRAY':
      return 'tower-array';
    case 'BURSTTURRET':
      return 'tower-burst-turret';
    case 'BLASTTURRET':
      return 'tower-blast-turret';
    case 'LOG':
      return 'tower-log';
    default:
      return null;
  }
};

const isTowerSelected = (selectedTowerType, tower) => {
  if (!selectedTowerType || !tower) return false;

  return [tower.key, tower.type, tower.conceptKey]
    .filter(Boolean)
    .some((value) => String(value).toUpperCase() === String(selectedTowerType).toUpperCase());
};

const WINDOW_OUTSET =
  'inset 1px 1px 0 #ffffff, inset 2px 2px 0 #f6f2ee, inset -1px -1px 0 #404040, inset -2px -2px 0 #808080';
const WINDOW_INSET =
  'inset 1px 1px 0 #404040, inset 2px 2px 0 #808080, inset -1px -1px 0 #ffffff, inset -2px -2px 0 #f6f2ee';
const TITLE_BAR_BG = 'linear-gradient(90deg, #0a2c9a 0%, #1084d0 100%)';
const RETRO_SURFACE = '#c0c0c0';
const RETRO_BODY = '#d4d0c8';
const RETRO_SHELL = '#efebe7';
const RETRO_TEXT = '#161616';
const RETRO_TEXT_MUTED = '#3b3b3b';
const RETRO_BUTTON_TEXT_PROPS = {
  fontFamily: 'var(--cg-font-retro-display)',
  fontWeight: '700',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const createRetroButtonSx = ({
  accentColor = '#0a2c9a',
  selected = false,
  disabled = false,
  selectedBg = '#e6eefc',
} = {}) => ({
  borderRadius: '0',
  border: '1px solid rgba(75, 75, 75, 0.28)',
  borderLeft: '4px solid',
  borderLeftColor: disabled ? 'rgba(128, 128, 128, 0.45)' : accentColor,
  bg: disabled ? '#c6c3bd' : selected ? selectedBg : RETRO_SURFACE,
  color: disabled ? '#6b6b6b' : RETRO_TEXT,
  boxShadow: selected ? WINDOW_INSET : WINDOW_OUTSET,
  _hover: disabled ? undefined : { bg: RETRO_SHELL },
  _active: disabled
    ? undefined
    : {
        boxShadow: WINDOW_INSET,
        bg: '#b7b4ac',
        transform: 'translate(1px, 1px)',
      },
  _disabled: {
    opacity: 0.72,
    cursor: 'not-allowed',
    color: '#6b6b6b',
  },
});

export default function MobileTowerDefenseDock({
  isExpanded,
  onToggle,
  onOpenLoadout,
  selectedTower,
  selectedTowerCanUpgrade,
  selectedTowerCanSpecialUpgrade,
  selectedTowerTargeting,
  nextSelectedTowerTargeting,
  onUpgradeSelectedTower,
  onSpecialUpgradeSelectedTower,
  onSetSelectedTowerTargeting,
  onSellSelectedTower,
  onClearSelectedTower,
  canQuickPlaceTowers,
  quickTowers,
  towerUnlockGates,
  selectedTowerType,
  canQuickPlaceDeployables,
  quickDeployables,
  deployableUnlockGates,
  selectedDeployableType,
  placementPalette,
  onPlacementPaletteChange,
  credits,
  onQuickTowerSelection,
  onQuickDeployableSelection,
}) {
  const canShowPaletteTabs = canQuickPlaceTowers && canQuickPlaceDeployables;
  const activePalette =
    placementPalette === 'deployables' && canQuickPlaceDeployables
      ? 'deployables'
      : canQuickPlaceTowers
        ? 'towers'
        : 'deployables';

  return (
    <Box
      position="fixed"
      left="calc(env(safe-area-inset-left, 0px) + 10px)"
      bottom="calc(env(safe-area-inset-bottom, 0px) + 14px)"
      zIndex={24}
      pointerEvents="none"
    >
      {isExpanded && (
        <Box
          position="absolute"
          left="0"
          bottom="42px"
          zIndex={23}
          w="min(208px, calc(100vw - 26px))"
          maxW="calc(100vw - 26px)"
          maxH="min(60vh, 420px)"
          overflowY="auto"
          overscrollBehavior="contain"
          bg={RETRO_SURFACE}
          border="1px solid #5a5a5a"
          borderRadius="0"
          boxShadow={`${WINDOW_OUTSET}, 3px 3px 0 rgba(64, 64, 64, 0.48)`}
          p="0"
          overflowX="hidden"
          data-testid="mobile-tower-dock"
          data-tutorial="mobile-tower-dock"
          pointerEvents="auto"
        >
          <Box px={2.5} py={2} bg={TITLE_BAR_BG}>
            <Flex align="center" justify="space-between" gap={2}>
              <Text
                color="white"
                fontFamily="var(--cg-font-retro-display)"
                fontSize="0.64rem"
                fontWeight="700"
                letterSpacing="0.06em"
                textTransform="uppercase"
                noOfLines={1}
              >
                field-ops.exe
              </Text>
              <Flex align="center" gap={2} flexShrink={0}>
                <Text
                  color="rgba(255, 255, 255, 0.9)"
                  fontFamily="var(--cg-font-retro-terminal)"
                  fontSize="0.62rem"
                  textTransform="uppercase"
                  whiteSpace="nowrap"
                >
                  tower control
                </Text>
                <Button
                  size="xs"
                  onClick={onToggle}
                  minW="unset"
                  h="20px"
                  px={2}
                  sx={createRetroButtonSx({ accentColor: '#808080', selectedBg: RETRO_SHELL })}
                  {...RETRO_BUTTON_TEXT_PROPS}
                  fontSize="0.58rem"
                >
                  Hide
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Box px={2} py={2} bg={RETRO_BODY}>
            <VStack spacing={1.5} align="stretch">
              <Box px={2.5} py={1.5} bg={RETRO_SHELL} boxShadow={WINDOW_INSET}>
                <Text
                  color={RETRO_TEXT_MUTED}
                  fontFamily="var(--cg-font-retro-terminal)"
                  fontSize="0.68rem"
                  lineHeight="1.4"
                  textTransform="uppercase"
                >
                  Quick tower controls
                </Text>
              </Box>

              <Button
                size="xs"
                onClick={onOpenLoadout}
                width="100%"
                sx={createRetroButtonSx({ accentColor: '#0f6f17', selectedBg: '#ddebdc' })}
                {...RETRO_BUTTON_TEXT_PROPS}
                fontSize="0.68rem"
              >
                Open Loadout
              </Button>

              {selectedTower && (
                <Box>
                  <Box px={2} py={1.5} mb={1.5} bg={RETRO_SHELL} boxShadow={WINDOW_INSET}>
                    <Text
                      color={RETRO_TEXT_MUTED}
                      fontSize="2xs"
                      fontFamily="var(--cg-font-retro-terminal)"
                      letterSpacing="0.04em"
                      textTransform="uppercase"
                      noOfLines={2}
                    >
                      {quickTowers.find((t) => t.type === selectedTower?.type)?.displayName ||
                        selectedTower?.type ||
                        'Tower'}{' '}
                      #{selectedTower?.id} | R {Number(selectedTower?.range || 0).toFixed(1)} |{' '}
                      {formatTargetingLabel(selectedTowerTargeting)}
                    </Text>
                  </Box>

                  <SimpleGrid columns={2} spacing={1.5}>
                    <Button
                      size="xs"
                      isDisabled={!selectedTowerCanUpgrade}
                      onClick={() => onUpgradeSelectedTower?.()}
                      width="100%"
                      justifyContent="space-between"
                      sx={createRetroButtonSx({
                        accentColor: '#0f6f17',
                        disabled: !selectedTowerCanUpgrade,
                        selectedBg: '#ddebdc',
                      })}
                      {...RETRO_BUTTON_TEXT_PROPS}
                      aria-label={`Upgrade (${selectedTower?.nextUpgradeCost ?? 'MAX'})`}
                    >
                      <Text fontSize="2xs">UP</Text>
                      <Text fontSize="2xs">{selectedTower?.nextUpgradeCost ?? 'MAX'}</Text>
                    </Button>
                    <Button
                      size="xs"
                      isDisabled={!selectedTowerCanSpecialUpgrade}
                      onClick={() => onSpecialUpgradeSelectedTower?.()}
                      width="100%"
                      justifyContent="space-between"
                      sx={createRetroButtonSx({
                        accentColor: '#8a5a00',
                        disabled: !selectedTowerCanSpecialUpgrade,
                        selectedBg: '#f2e1c8',
                      })}
                      {...RETRO_BUTTON_TEXT_PROPS}
                      aria-label={`Special (${selectedTower?.nextSpecialUpgradeCost ?? 'MAX'})`}
                    >
                      <Text fontSize="2xs">SP</Text>
                      <Text fontSize="2xs">{selectedTower?.nextSpecialUpgradeCost ?? 'MAX'}</Text>
                    </Button>
                    <Button
                      size="xs"
                      isDisabled={Boolean(selectedTower?.targetingLocked)}
                      onClick={() => onSetSelectedTowerTargeting?.(nextSelectedTowerTargeting)}
                      width="100%"
                      justifyContent="space-between"
                      sx={createRetroButtonSx({
                        accentColor: '#0a2c9a',
                        disabled: Boolean(selectedTower?.targetingLocked),
                      })}
                      {...RETRO_BUTTON_TEXT_PROPS}
                      aria-label={`Target ${nextSelectedTowerTargeting}`}
                    >
                      <Text fontSize="2xs" flexShrink={0}>
                        TGT
                      </Text>
                      <Text fontSize="2xs" textAlign="right" flex="1" minW="0" noOfLines={1}>
                        {formatTargetingLabel(nextSelectedTowerTargeting, true)}
                      </Text>
                    </Button>
                    <Button
                      size="xs"
                      isDisabled={!onSellSelectedTower}
                      onClick={() => onSellSelectedTower?.()}
                      sx={createRetroButtonSx({
                        accentColor: '#8f1f1f',
                        disabled: !onSellSelectedTower,
                      })}
                      {...RETRO_BUTTON_TEXT_PROPS}
                      aria-label="Sell tower"
                    >
                      Sell
                    </Button>
                  </SimpleGrid>

                  <Button
                    size="xs"
                    mt={1.5}
                    width="100%"
                    onClick={() => onClearSelectedTower?.()}
                    sx={createRetroButtonSx({ accentColor: '#808080', selectedBg: RETRO_SHELL })}
                    {...RETRO_BUTTON_TEXT_PROPS}
                  >
                    Clear Target
                  </Button>
                </Box>
              )}

              {(canQuickPlaceTowers || canQuickPlaceDeployables) && (
                <Box>
                  {canShowPaletteTabs && (
                    <SimpleGrid columns={2} spacing={1.5} mb={1.5}>
                      <Button
                        size="xs"
                        onClick={() => onPlacementPaletteChange?.('towers')}
                        sx={createRetroButtonSx({
                          accentColor: '#0f6f17',
                          selected: activePalette === 'towers',
                          selectedBg: '#ddebdc',
                        })}
                        {...RETRO_BUTTON_TEXT_PROPS}
                      >
                        Towers
                      </Button>
                      <Button
                        size="xs"
                        onClick={() => onPlacementPaletteChange?.('deployables')}
                        sx={createRetroButtonSx({
                          accentColor: '#8a5a00',
                          selected: activePalette === 'deployables',
                          selectedBg: '#f2e1c8',
                        })}
                        {...RETRO_BUTTON_TEXT_PROPS}
                      >
                        Deploy
                      </Button>
                    </SimpleGrid>
                  )}

                  {activePalette === 'towers' && canQuickPlaceTowers && quickTowers.length > 0 ? (
                    <Box data-tutorial="mobile-tower-quick-buy">
                      <Text
                        color="#0a2c9a"
                        fontSize="2xs"
                        fontFamily="var(--cg-font-retro-display)"
                        letterSpacing="0.04em"
                        textTransform="uppercase"
                        mb={1}
                      >
                        Quick Towers
                      </Text>

                      <SimpleGrid columns={2} spacing={1.5}>
                        {quickTowers.map((tower) => {
                          const gateKey =
                            tower.conceptKey || tower.key || tower.type?.toUpperCase();
                          const storeGate = towerUnlockGates[gateKey];
                          const towerAccentColor = tower.color || '#00ccff';
                          const isStoreLocked = Boolean(storeGate?.locked);
                          const canAfford = credits >= Number(tower.cost || 0);
                          const isSelected = isTowerSelected(selectedTowerType, tower);
                          const isDisabled = !canAfford || isStoreLocked;
                          const helperText = isStoreLocked
                            ? formatUnlockGateLabel(storeGate)
                            : !canAfford
                              ? 'Need bits'
                              : `${tower.cost} bits`;

                          const tutorialAttr = getTutorialAttribute(tower.type);
                          const tutorialProps = tutorialAttr
                            ? { 'data-tutorial': tutorialAttr }
                            : {};

                          return (
                            <Button
                              key={tower.key}
                              size="xs"
                              h="auto"
                              minH="42px"
                              px={2}
                              py={1.5}
                              display="flex"
                              alignItems="stretch"
                              justifyContent="flex-start"
                              textAlign="left"
                              whiteSpace="normal"
                              sx={createRetroButtonSx({
                                accentColor: towerAccentColor,
                                selected: isSelected,
                                disabled: isDisabled,
                                selectedBg: hexToRgba(towerAccentColor, 0.18),
                              })}
                              opacity={isDisabled ? 0.7 : 1}
                              isDisabled={isDisabled}
                              onClick={() => onQuickTowerSelection(tower.type)}
                              aria-label={tower.displayName || formatTowerLabel(tower.type)}
                              data-selected={isSelected ? 'true' : 'false'}
                              {...tutorialProps}
                            >
                              <VStack spacing={0} align="stretch" flex="1" minW="0">
                                <Text fontSize="2xs" fontWeight="bold" noOfLines={1}>
                                  {tower.displayName || formatTowerLabel(tower.type)}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color={
                                    isStoreLocked
                                      ? '#694b8a'
                                      : isDisabled
                                        ? '#6b6b6b'
                                        : hexToRgba(towerAccentColor, 0.92)
                                  }
                                  noOfLines={1}
                                >
                                  {helperText}
                                </Text>
                              </VStack>
                            </Button>
                          );
                        })}
                      </SimpleGrid>
                    </Box>
                  ) : null}

                  {activePalette === 'deployables' &&
                  canQuickPlaceDeployables &&
                  quickDeployables.length > 0 ? (
                    <Box data-tutorial="mobile-deployable-dock">
                      <Text
                        color="#8a5a00"
                        fontSize="2xs"
                        fontFamily="var(--cg-font-retro-display)"
                        letterSpacing="0.04em"
                        textTransform="uppercase"
                        mb={1}
                      >
                        Quick Deployables
                      </Text>

                      <SimpleGrid columns={2} spacing={1.5}>
                        {quickDeployables.map((deployable) => {
                          const gateKey = deployable.key || deployable.type?.toUpperCase();
                          const storeGate = deployableUnlockGates[gateKey];
                          const isStoreLocked = Boolean(storeGate?.locked);
                          const canAfford = credits >= Number(deployable.cost || 0);
                          const isSelected =
                            selectedDeployableType === deployable.key ||
                            selectedDeployableType === deployable.type;
                          const isDisabled = !canAfford || isStoreLocked;
                          const helperText = isStoreLocked
                            ? formatUnlockGateLabel(storeGate)
                            : !canAfford
                              ? 'Need bits'
                              : `${deployable.cost} bits`;

                          return (
                            <Button
                              key={deployable.key}
                              size="xs"
                              h="auto"
                              minH="42px"
                              px={2}
                              py={1.5}
                              display="flex"
                              alignItems="stretch"
                              justifyContent="flex-start"
                              textAlign="left"
                              whiteSpace="normal"
                              sx={createRetroButtonSx({
                                accentColor: '#8a5a00',
                                selected: isSelected,
                                disabled: isDisabled,
                                selectedBg: '#f2e1c8',
                              })}
                              opacity={isDisabled ? 0.7 : 1}
                              isDisabled={isDisabled}
                              onClick={() => onQuickDeployableSelection(deployable.key)}
                              aria-label={deployable.type}
                            >
                              <VStack spacing={0} align="stretch" flex="1" minW="0">
                                <Text fontSize="2xs" fontWeight="bold" noOfLines={1}>
                                  {deployable.icon} {deployable.type}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color={
                                    isStoreLocked ? '#694b8a' : isDisabled ? '#6b6b6b' : '#8a5a00'
                                  }
                                  noOfLines={1}
                                >
                                  {helperText}
                                </Text>
                              </VStack>
                            </Button>
                          );
                        })}
                      </SimpleGrid>
                    </Box>
                  ) : null}
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      )}

      <Box
        position="relative"
        display="flex"
        justifyContent="flex-start"
        pointerEvents={isExpanded ? 'none' : 'auto'}
        opacity={isExpanded ? 0 : 1}
        transform={isExpanded ? 'translate3d(-8px, 0, 0)' : 'translate3d(0, 0, 0)'}
        transformOrigin="bottom left"
        transition="opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)"
      >
        <Button
          aria-label="Open tower defense quick actions"
          onClick={onToggle}
          size="xs"
          minW="44px"
          h="34px"
          pointerEvents="auto"
          sx={createRetroButtonSx({ accentColor: '#0f6f17', selectedBg: '#ddebdc' })}
          {...RETRO_BUTTON_TEXT_PROPS}
          fontSize="0.66rem"
          data-tutorial="mobile-td-toggle"
        >
          TD
        </Button>
      </Box>
    </Box>
  );
}
