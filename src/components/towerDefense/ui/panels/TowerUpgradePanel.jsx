import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { FaCheck, FaChevronDown, FaTimes } from 'react-icons/fa';
import { TOWER_TYPES } from '../../data/towerTypes';
import { TARGETING_MODES } from '../../../../game-engine-v2/constants';
import {
  RETRO_WINDOW_BUTTON_ASSET,
  RETRO_WINDOW_BUTTON_PRESSED_ASSET,
} from '../../../../utils/assets/towerDefenseAssetUrls';

const TARGETING_LABELS = {
  closest: 'Closest',
  furthest: 'Furthest',
  'highest-health': 'Highest Health',
  'lowest-health': 'Lowest Health',
};

const TIER_LABEL = {
  1: 'Tier I',
  2: 'Tier II',
};

const SPECIAL_UNLOCK_REQUIREMENTS = {
  1: { level: 6, dp: 30 },
  2: { level: 10, dp: 50 },
};

const createRetroButtonSx = (pressed = false) => ({
  backgroundImage: `url(${pressed ? RETRO_WINDOW_BUTTON_PRESSED_ASSET : RETRO_WINDOW_BUTTON_ASSET})`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  backgroundColor: '#d4d0c8',
  color: '#1f2128',
  borderRadius: '0',
  border: '1px solid rgba(31, 33, 40, 0.35)',
  boxShadow: 'none',
  px: 3,
  py: 1.5,
  minH: '30px',
  fontWeight: '700',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  _hover: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
  },
  _active: {
    backgroundImage: `url(${RETRO_WINDOW_BUTTON_PRESSED_ASSET})`,
    transform: 'translateY(1px)',
  },
  _disabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
    filter: 'grayscale(0.18)',
  },
});

const TowerUpgradePanel = ({
  selectedTower,
  credits,
  onUpgrade,
  onSpecialUpgrade,
  onTargetingChange,
  onSell,
  onClose,
  disabled = false,
  hardcoreMode = false,
  isSpecialUpgradeUnlocked,
  shellTheme = 'default',
}) => {
  const controlsLocked = disabled || hardcoreMode;
  const formatNumber = (value, digits = 1) => {
    if (Number.isNaN(Number(value))) return '-';
    return Number(value).toFixed(digits);
  };

  const formatInt = (value) => {
    if (Number.isNaN(Number(value))) return '-';
    return Math.round(Number(value));
  };

  const towerConfig = useMemo(() => {
    if (!selectedTower) return null;
    const key = selectedTower.type?.toUpperCase()?.replace(/\s+/g, '_');
    return (
      TOWER_TYPES[key] ||
      Object.values(TOWER_TYPES).find((tower) => tower.type === selectedTower.type) ||
      null
    );
  }, [selectedTower]);

  const specialUpgrades = towerConfig?.specialUpgrades || [];
  const specialEffects = towerConfig?.specialEffects || [];
  const activeSpecialEffects = specialEffects.slice(0, selectedTower?.specialUpgradeLevel || 0);
  const nextSpecialIndex = selectedTower?.specialUpgradeLevel || 0;
  const nextSpecialTier = nextSpecialIndex + 1;
  const nextSpecialUnlock = SPECIAL_UNLOCK_REQUIREMENTS[nextSpecialTier] || null;
  const nextSpecialLocked = isSpecialUpgradeUnlocked
    ? !isSpecialUpgradeUnlocked(selectedTower?.type, nextSpecialTier)
    : false;
  const nextSpecialUpgrade = specialUpgrades[nextSpecialIndex];
  const nextSpecialEffect = specialEffects[nextSpecialIndex];
  const targetingLocked = Boolean(selectedTower?.targetingLocked);
  const effectiveTargeting =
    selectedTower?.effectiveTargeting || selectedTower?.targeting || 'closest';
  const manualTargeting = selectedTower?.targeting || 'closest';
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const uiFontFamily = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', monospace";
  const headingColor = isRetroDesktopTheme ? '#0b2ba8' : '#00ccff';
  const bodyTextColor = isRetroDesktopTheme ? '#4d5562' : '#88AACC';
  const secondaryTextColor = isRetroDesktopTheme ? '#6b7280' : '#6f8fb0';
  const summaryTextColor = isRetroDesktopTheme ? '#3f4550' : '#cceeff';
  const panelSurfaceProps = isRetroDesktopTheme
    ? {
        bg: '#f4efe6',
        borderRadius: '0',
        border: '2px solid #232730',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
      }
    : null;
  const sectionBorderColor = isRetroDesktopTheme
    ? 'rgba(33, 37, 44, 0.24)'
    : 'rgba(0, 204, 255, 0.2)';

  const formatEffectSummary = () => {
    if (!activeSpecialEffects.length) {
      const hasMultiTarget = specialEffects.some(
        (effect) => Number.isFinite(effect.extraTargets) && effect.extraTargets > 0
      );
      if (hasMultiTarget) {
        return ['Targets per attack: 1', 'No special upgrades installed.'];
      }
      return ['No special upgrades installed.'];
    }

    const summary = [];
    const multiTargetEffects = activeSpecialEffects
      .map((effect) => effect.multiTarget)
      .filter(Boolean);
    const multiTarget = multiTargetEffects[multiTargetEffects.length - 1];
    const extraTargets = Math.max(
      ...activeSpecialEffects.map((effect) => effect.extraTargets || 0),
      multiTarget?.extraTargets || 0,
      0
    );
    const damageMultiplier = activeSpecialEffects.reduce(
      (mult, effect) => (effect.damageMultiplier ? mult * (1 + effect.damageMultiplier) : mult),
      1
    );
    const rangeBonus = activeSpecialEffects.reduce(
      (total, effect) => total + (effect.rangeBonus || 0),
      0
    );
    const targeting = activeSpecialEffects.find((effect) => effect.targeting)?.targeting;
    const execute = activeSpecialEffects.find((effect) => effect.execute)?.execute;
    const splash = activeSpecialEffects.find((effect) => effect.splash)?.splash;
    const slow = activeSpecialEffects.find((effect) => effect.slow)?.slow;
    const field = activeSpecialEffects.find((effect) => effect.field)?.field;
    const delayedDamage = activeSpecialEffects.find(
      (effect) => effect.delayedDamage
    )?.delayedDamage;
    const aura = activeSpecialEffects.find((effect) => effect.aura)?.aura;

    const typeBonuses = activeSpecialEffects.reduce((acc, effect) => {
      if (!effect.typeDamageBonus) return acc;
      Object.entries(effect.typeDamageBonus).forEach(([type, bonus]) => {
        acc[type] = Math.max(acc[type] || 0, bonus);
      });
      return acc;
    }, {});

    if (multiTarget) {
      const modeLabel =
        {
          burst: 'Burst sweep',
          fork: 'Forked shot',
          chain: 'Chain bounce',
          pierce: 'Piercing shot',
        }[multiTarget.mode] || 'Multi-shot';
      summary.push(`Special mode: ${modeLabel}`);
      summary.push(`Targets per attack: ${1 + (multiTarget.extraTargets || 0)}`);
      if (
        multiTarget.secondaryDamageMultiplier != null &&
        multiTarget.secondaryDamageMultiplier !== 1
      ) {
        summary.push(
          `Secondary damage: ${Math.round(multiTarget.secondaryDamageMultiplier * 100)}%`
        );
      }
      if (multiTarget.delayMs) {
        summary.push(`Chain delay: ${formatNumber(multiTarget.delayMs / 1000, 2)}s`);
      }
    } else if (extraTargets > 0) {
      summary.push(`Targets per attack: ${1 + extraTargets}`);
    }

    if (damageMultiplier > 1) {
      summary.push(`Bonus damage: +${Math.round((damageMultiplier - 1) * 100)}%`);
    }
    if (rangeBonus > 0) {
      summary.push(`Bonus range: +${formatNumber(rangeBonus, 1)}`);
    }
    if (targeting) {
      summary.push(`Targeting: ${targeting.replace('-', ' ')}`);
    }
    if (execute) {
      summary.push(
        `Execute: ${Math.round((execute.chance || 0) * 100)}% under ${Math.round((execute.threshold || 0) * 100)}% HP`
      );
    }
    if (splash) {
      summary.push(
        `Splash: ${formatNumber(splash.radius, 1)} tiles @ ${Math.round((splash.damageMultiplier || 0) * 100)}% dmg`
      );
    }
    if (slow) {
      summary.push(
        `Slow: ${Math.round((1 - (slow.factor || 1)) * 100)}% for ${formatNumber((slow.duration || 0) / 1000, 1)}s`
      );
    }
    if (field) {
      summary.push(
        `Field: ${formatNumber(field.radius, 1)} tiles, ${Math.round((field.damageMultiplier || 0) * 100)}% dmg`
      );
    }
    if (delayedDamage) {
      summary.push(
        `Delayed: ${Math.round((delayedDamage.damageMultiplier || 0) * 100)}% after ${formatNumber((delayedDamage.delayMs || 0) / 1000, 1)}s`
      );
    }
    if (aura) {
      summary.push(
        `Aura: +${Math.round((aura.damageMultiplier || 0) * 100)}% dmg & +${Math.round((aura.speedMultiplier || 0) * 100)}% SPD (${formatNumber(aura.radius, 1)} tiles)`
      );
    }

    const bonusTypes = Object.entries(typeBonuses);
    if (bonusTypes.length) {
      summary.push(
        `Type bonus: ${bonusTypes.map(([type, bonus]) => `${type} +${Math.round(bonus * 100)}%`).join(', ')}`
      );
    }

    return summary.length ? summary : ['Special upgrades active.'];
  };

  const formatEffectDetails = (effect) => {
    if (!effect) return [];
    const details = [];
    const multiTarget = effect.multiTarget;

    if (multiTarget) {
      const modeLabel =
        {
          burst: 'Burst sweep',
          fork: 'Forked shot',
          chain: 'Chain bounce',
          pierce: 'Piercing shot',
        }[multiTarget.mode] || 'Multi-shot';
      details.push(`Mode: ${modeLabel}`);
      details.push(`Extra targets: ${multiTarget.extraTargets || 0}`);
      if (
        multiTarget.secondaryDamageMultiplier != null &&
        multiTarget.secondaryDamageMultiplier !== 1
      ) {
        details.push(
          `Secondary damage: ${Math.round(multiTarget.secondaryDamageMultiplier * 100)}%`
        );
      }
      if (multiTarget.delayMs) {
        details.push(`Chain delay: ${formatNumber(multiTarget.delayMs / 1000, 2)}s`);
      }
    }

    if (effect.damageMultiplier) {
      details.push(`Bonus damage: +${Math.round(effect.damageMultiplier * 100)}%`);
    }
    if (effect.rangeBonus) {
      details.push(`Bonus range: +${formatNumber(effect.rangeBonus, 1)}`);
    }
    if (effect.targeting) {
      details.push(`Targeting: ${effect.targeting.replace('-', ' ')}`);
    }
    if (effect.execute) {
      details.push(
        `Execute: ${Math.round((effect.execute.chance || 0) * 100)}% under ${Math.round((effect.execute.threshold || 0) * 100)}% HP`
      );
    }
    if (effect.splash) {
      details.push(
        `Splash: ${formatNumber(effect.splash.radius, 1)} tiles @ ${Math.round((effect.splash.damageMultiplier || 0) * 100)}% dmg`
      );
    }
    if (effect.slow) {
      details.push(
        `Slow: ${Math.round((1 - (effect.slow.factor || 1)) * 100)}% for ${formatNumber((effect.slow.duration || 0) / 1000, 1)}s`
      );
    }
    if (effect.field) {
      details.push(
        `Field: ${formatNumber(effect.field.radius, 1)} tiles, ${Math.round((effect.field.damageMultiplier || 0) * 100)}% dmg`
      );
    }
    if (effect.delayedDamage) {
      details.push(
        `Delayed: ${Math.round((effect.delayedDamage.damageMultiplier || 0) * 100)}% after ${formatNumber((effect.delayedDamage.delayMs || 0) / 1000, 1)}s`
      );
    }
    if (effect.aura) {
      details.push(
        `Aura: +${Math.round((effect.aura.damageMultiplier || 0) * 100)}% dmg & +${Math.round((effect.aura.speedMultiplier || 0) * 100)}% SPD (${formatNumber(effect.aura.radius, 1)} tiles)`
      );
    }
    if (effect.typeDamageBonus) {
      details.push(
        `Type bonus: ${Object.entries(effect.typeDamageBonus)
          .map(([type, bonus]) => `${type} +${Math.round(bonus * 100)}%`)
          .join(', ')}`
      );
    }

    return details;
  };

  return (
    <Box
      data-tutorial="tower-upgrade-panel"
      mt={3}
      pt={3}
      px={3}
      pb={3}
      borderTop={
        isRetroDesktopTheme
          ? '1px solid rgba(33, 37, 44, 0.24)'
          : '1px solid rgba(0, 255, 140, 0.15)'
      }
      bg={isRetroDesktopTheme ? '#d4d0c8' : undefined}
    >
      <Text
        fontSize="xs"
        color={headingColor}
        fontWeight="bold"
        fontFamily={uiFontFamily}
        mb={2}
        letterSpacing={isRetroDesktopTheme ? '0.08em' : undefined}
      >
        MODULE UPGRADES
      </Text>

      {selectedTower ? (
        <Box
          bg={isRetroDesktopTheme ? panelSurfaceProps.bg : 'rgba(0, 10, 20, 0.6)'}
          borderRadius={isRetroDesktopTheme ? panelSurfaceProps.borderRadius : 'md'}
          border={
            isRetroDesktopTheme ? panelSurfaceProps.border : '1px solid rgba(0, 255, 140, 0.2)'
          }
          p={3}
          boxShadow={isRetroDesktopTheme ? panelSurfaceProps.boxShadow : undefined}
        >
          <HStack justify="space-between" align="start">
            <Box>
              <HStack spacing={2} align="center">
                <Text
                  color={isRetroDesktopTheme ? '#0b2ba8' : selectedTower.color || '#00ff8c'}
                  fontWeight="bold"
                  fontSize="sm"
                  fontFamily={uiFontFamily}
                >
                  {(towerConfig && towerConfig.displayName) || selectedTower.type} Module
                </Text>
                {towerConfig?.isNonCode && (
                  <Badge
                    bg={isRetroDesktopTheme ? '#e4d9bd' : '#2b1a00'}
                    color={isRetroDesktopTheme ? '#6a4b12' : '#ffb703'}
                    fontSize="9px"
                    borderRadius={isRetroDesktopTheme ? '0' : 'sm'}
                    px={1}
                  >
                    NO CODE GEN
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" color={bodyTextColor} mt={1} fontFamily={uiFontFamily}>
                Level {selectedTower.upgradeLevel + 1}/3 • Grid [{selectedTower.position.row},{' '}
                {selectedTower.position.col}]
              </Text>
            </Box>
            {onClose && (
              <IconButton
                aria-label="Close upgrade panel"
                icon={<FaTimes />}
                size="xs"
                variant="ghost"
                color={bodyTextColor}
                _hover={{ color: headingColor }}
                onClick={onClose}
              />
            )}
          </HStack>
          <Flex
            mt={2}
            fontSize="10px"
            color={summaryTextColor}
            justify="space-between"
            wrap="wrap"
            borderTop={`1px solid ${sectionBorderColor}`}
            pt={2}
            fontFamily={uiFontFamily}
          >
            <Text mr={2}>DMG: {formatInt(selectedTower.damage)}</Text>
            <Text mr={2}>RNG: {formatNumber(selectedTower.range, 1)}</Text>
            <Text>SPD: {formatNumber(selectedTower.attackSpeed, 1)}/s</Text>
          </Flex>

          <Box mt={3} pt={2} borderTop={`1px solid ${sectionBorderColor}`}>
            <Text
              fontSize="10px"
              color={headingColor}
              mb={2}
              opacity={0.8}
              fontFamily={uiFontFamily}
            >
              TARGETING PRIORITY
            </Text>
            <Menu matchWidth>
              <MenuButton
                as={Button}
                width="100%"
                size="sm"
                rightIcon={<FaChevronDown />}
                isDisabled={controlsLocked || targetingLocked || !onTargetingChange}
                bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(0, 10, 20, 0.9)'}
                color={isRetroDesktopTheme ? '#1f2128' : '#cceeff'}
                border={
                  isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 204, 255, 0.35)'
                }
                borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                fontSize="12px"
                fontWeight="medium"
                textAlign="left"
                justifyContent="space-between"
                fontFamily={uiFontFamily}
                _hover={{
                  bg: isRetroDesktopTheme ? '#ece7dc' : 'rgba(0, 20, 40, 0.95)',
                  borderColor: isRetroDesktopTheme ? '#0b2ba8' : 'rgba(0, 204, 255, 0.6)',
                }}
                _active={{
                  bg: isRetroDesktopTheme ? '#ece7dc' : 'rgba(0, 24, 48, 1)',
                }}
                _focusVisible={{
                  borderColor: isRetroDesktopTheme ? '#0b2ba8' : '#00ccff',
                  boxShadow: isRetroDesktopTheme ? 'none' : '0 0 0 1px #00ccff',
                }}
                _disabled={{
                  opacity: 0.65,
                  cursor: 'not-allowed',
                  bg: isRetroDesktopTheme ? '#cbc6bb' : 'rgba(0, 10, 20, 0.75)',
                }}
                variant={isRetroDesktopTheme ? 'unstyled' : 'solid'}
              >
                {TARGETING_LABELS[targetingLocked ? effectiveTargeting : manualTargeting] ||
                  (targetingLocked ? effectiveTargeting : manualTargeting)}
              </MenuButton>
              <MenuList
                minW="unset"
                width="100%"
                bg={isRetroDesktopTheme ? '#f4efe6' : 'rgba(2, 16, 28, 0.98)'}
                border={
                  isRetroDesktopTheme ? '2px solid #5d636e' : '1px solid rgba(0, 204, 255, 0.35)'
                }
                boxShadow={
                  isRetroDesktopTheme
                    ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
                    : '0 14px 32px rgba(0, 0, 0, 0.45)'
                }
                p={1}
              >
                {TARGETING_MODES.map((mode) => {
                  const isActive =
                    mode === (targetingLocked ? effectiveTargeting : manualTargeting);
                  return (
                    <MenuItem
                      key={mode}
                      icon={
                        isActive ? (
                          <FaCheck color={isRetroDesktopTheme ? '#285d2f' : '#00ff8c'} />
                        ) : (
                          <Box w="14px" />
                        )
                      }
                      onClick={() => onTargetingChange?.(mode)}
                      bg={
                        isActive
                          ? isRetroDesktopTheme
                            ? '#d7e0ef'
                            : 'rgba(0, 204, 255, 0.18)'
                          : 'transparent'
                      }
                      color={
                        isActive
                          ? isRetroDesktopTheme
                            ? '#1f2430'
                            : '#e6fbff'
                          : isRetroDesktopTheme
                            ? '#3f4550'
                            : '#b9e7ff'
                      }
                      borderRadius={isRetroDesktopTheme ? '0' : 'sm'}
                      fontSize="12px"
                      fontFamily={uiFontFamily}
                      _hover={{
                        bg: isRetroDesktopTheme ? '#e7edf7' : 'rgba(0, 204, 255, 0.14)',
                        color: isRetroDesktopTheme ? '#1f2430' : '#f3feff',
                      }}
                      _focus={{
                        bg: isRetroDesktopTheme ? '#e7edf7' : 'rgba(0, 204, 255, 0.2)',
                        color: isRetroDesktopTheme ? '#1f2430' : '#f3feff',
                      }}
                    >
                      {TARGETING_LABELS[mode] || mode}
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
            <Text
              fontSize="10px"
              color={bodyTextColor}
              mt={2}
              opacity={0.8}
              fontFamily={uiFontFamily}
            >
              Active target rule: {TARGETING_LABELS[effectiveTargeting] || effectiveTargeting}
            </Text>
            {targetingLocked ? (
              <Text
                fontSize="10px"
                color={isRetroDesktopTheme ? '#7c4914' : '#ffb703'}
                mt={1}
                opacity={0.85}
                fontFamily={uiFontFamily}
              >
                Locked by active special upgrade targeting behavior.
              </Text>
            ) : (
              <Text
                fontSize="10px"
                color={bodyTextColor}
                mt={1}
                opacity={0.7}
                fontFamily={uiFontFamily}
              >
                Change how this module ranks enemies before applying duplicate-target mitigation.
              </Text>
            )}
          </Box>

          <Box mt={3} pt={2} borderTop={`1px solid ${sectionBorderColor}`}>
            <Text
              fontSize="10px"
              color={headingColor}
              mb={2}
              opacity={0.8}
              fontFamily={uiFontFamily}
            >
              SPECIAL ABILITY STATUS
            </Text>
            <VStack
              align="stretch"
              spacing={1}
              fontSize="10px"
              color={bodyTextColor}
              fontFamily={uiFontFamily}
            >
              {formatEffectSummary().map((line, index) => (
                <Text key={index}>{line}</Text>
              ))}
            </VStack>
            <Text
              fontSize="10px"
              color={bodyTextColor}
              mt={2}
              opacity={0.7}
              fontFamily={uiFontFamily}
            >
              Special upgrades enhance this module's unique ability. Core upgrades only boost stats.
            </Text>

            {nextSpecialUpgrade && nextSpecialEffect && (
              <Box mt={2} pt={2} borderTop={`1px solid ${sectionBorderColor}`}>
                <Text
                  fontSize="10px"
                  color={isRetroDesktopTheme ? '#5d2e8c' : '#c38cff'}
                  mb={1}
                  opacity={0.85}
                  fontFamily={uiFontFamily}
                >
                  NEXT SPECIAL: {nextSpecialUpgrade.name}
                </Text>
                {nextSpecialUpgrade.effect && (
                  <Text
                    fontSize="9px"
                    color={isRetroDesktopTheme ? '#5d2e8c' : '#b8a6ff'}
                    mb={1}
                    opacity={0.8}
                    fontFamily={uiFontFamily}
                  >
                    {nextSpecialUpgrade.effect}
                  </Text>
                )}
                <VStack
                  align="stretch"
                  spacing={1}
                  fontSize="9px"
                  color={bodyTextColor}
                  fontFamily={uiFontFamily}
                >
                  {formatEffectDetails(nextSpecialEffect).map((line, index) => (
                    <Text key={index}>{line}</Text>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>

          {specialUpgrades.length > 0 && (
            <Box mt={3} pt={2} borderTop={`1px solid ${sectionBorderColor}`}>
              <Text
                fontSize="10px"
                color={headingColor}
                mb={2}
                opacity={0.8}
                fontFamily={uiFontFamily}
              >
                SPECIAL UPGRADES
              </Text>
              <VStack
                align="stretch"
                spacing={2}
                fontSize="10px"
                color={bodyTextColor}
                fontFamily={uiFontFamily}
              >
                {specialUpgrades.map((upgrade, index) => {
                  const tier = index + 1;
                  const unlockRequirement = SPECIAL_UNLOCK_REQUIREMENTS[tier] || null;
                  const lockedByGate = isSpecialUpgradeUnlocked
                    ? !isSpecialUpgradeUnlocked(selectedTower?.type, tier)
                    : false;
                  const isActive = index < (selectedTower.specialUpgradeLevel || 0);
                  const isNext = index === (selectedTower.specialUpgradeLevel || 0);
                  return (
                    <Box key={upgrade.name}>
                      <Flex justify="space-between" align="center">
                        <Text>{upgrade.name}</Text>
                        <HStack spacing={2}>
                          <Text>{upgrade.cost}</Text>
                          {isActive && (
                            <Badge
                              bg={isRetroDesktopTheme ? '#d9ecd7' : 'rgba(0, 255, 140, 0.2)'}
                              color={isRetroDesktopTheme ? '#285d2f' : '#00ff8c'}
                              fontSize="9px"
                              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                            >
                              ACTIVE
                            </Badge>
                          )}
                          {!isActive && !lockedByGate && isNext && (
                            <Badge
                              bg={isRetroDesktopTheme ? '#d7e0ef' : 'rgba(0, 204, 255, 0.2)'}
                              color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                              fontSize="9px"
                              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                            >
                              NEXT
                            </Badge>
                          )}
                          {!isActive && lockedByGate && (
                            <Badge
                              bg={isRetroDesktopTheme ? '#ddd2ec' : 'rgba(180, 80, 255, 0.2)'}
                              color={isRetroDesktopTheme ? '#5d2e8c' : '#d6a1ff'}
                              fontSize="9px"
                              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
                            >
                              LOCKED
                            </Badge>
                          )}
                        </HStack>
                      </Flex>
                      {!isActive && lockedByGate && unlockRequirement && (
                        <Text
                          fontSize="9px"
                          color={isRetroDesktopTheme ? '#5d2e8c' : '#d6a1ff'}
                          mt={1}
                          fontFamily={uiFontFamily}
                        >
                          {TIER_LABEL[tier] || `Tier ${tier}`} Locked • Requires Level{' '}
                          {unlockRequirement.level} • {unlockRequirement.dp} DP
                        </Text>
                      )}
                      {upgrade.effect && (
                        <Text
                          fontSize="9px"
                          color={secondaryTextColor}
                          mt={1}
                          fontFamily={uiFontFamily}
                        >
                          {upgrade.effect}
                        </Text>
                      )}
                      {specialEffects[index] && (
                        <VStack
                          align="stretch"
                          spacing={1}
                          fontSize="9px"
                          color={bodyTextColor}
                          mt={1}
                          fontFamily={uiFontFamily}
                        >
                          {formatEffectDetails(specialEffects[index]).map((line, detailIndex) => (
                            <Text key={detailIndex}>{line}</Text>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  );
                })}
              </VStack>
              <Text fontSize="9px" color={secondaryTextColor} mt={2} fontFamily={uiFontFamily}>
                Special upgrades are separate from core stat upgrades.
              </Text>
            </Box>
          )}
          {hardcoreMode ? (
            <Box
              mt={3}
              px={2}
              py={2}
              borderRadius={isRetroDesktopTheme ? '0' : 'md'}
              border={
                isRetroDesktopTheme ? '2px solid #7c4914' : '1px dashed rgba(255, 204, 0, 0.35)'
              }
              bg={isRetroDesktopTheme ? '#efe0c3' : 'rgba(30, 20, 0, 0.25)'}
            >
              <Text
                fontSize="10px"
                color={isRetroDesktopTheme ? '#7c4914' : '#ffcc00'}
                fontWeight="bold"
                mb={1}
                fontFamily={uiFontFamily}
              >
                HARDCORE MODE: TERMINAL ONLY
              </Text>
              <VStack
                align="stretch"
                spacing={1}
                fontSize="9px"
                color={isRetroDesktopTheme ? '#7c4914' : '#c9b36b'}
                fontFamily={uiFontFamily}
              >
                <Text>/tower upgrade</Text>
                <Text>/tower upgrade --special</Text>
                <Text>/tower sell</Text>
              </VStack>
            </Box>
          ) : (
            <>
              <Button
                mt={3}
                size="sm"
                width="100%"
                colorScheme={isRetroDesktopTheme ? undefined : 'blue'}
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                onClick={onUpgrade}
                isDisabled={
                  controlsLocked ||
                  !selectedTower.canUpgrade ||
                  selectedTower.nextUpgradeCost == null ||
                  credits < selectedTower.nextUpgradeCost
                }
                fontFamily={uiFontFamily}
                sx={isRetroDesktopTheme ? createRetroButtonSx() : undefined}
              >
                Upgrade ({selectedTower.nextUpgradeCost ?? 'MAX'} Bits)
              </Button>
              <Button
                mt={2}
                size="sm"
                width="100%"
                colorScheme={isRetroDesktopTheme ? undefined : 'purple'}
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                onClick={onSpecialUpgrade}
                isDisabled={
                  controlsLocked ||
                  !selectedTower.canSpecialUpgrade ||
                  selectedTower.nextSpecialUpgradeCost == null ||
                  credits < selectedTower.nextSpecialUpgradeCost ||
                  nextSpecialLocked
                }
                fontFamily={uiFontFamily}
                sx={isRetroDesktopTheme ? createRetroButtonSx() : undefined}
              >
                Special Upgrade ({selectedTower.nextSpecialUpgradeCost ?? 'MAX'} Bits)
              </Button>
              {nextSpecialLocked && nextSpecialUnlock && (
                <Text
                  fontSize="10px"
                  color={isRetroDesktopTheme ? '#5d2e8c' : '#d6a1ff'}
                  mt={1}
                  textAlign="center"
                  fontFamily={uiFontFamily}
                >
                  {TIER_LABEL[nextSpecialTier] || `Tier ${nextSpecialTier}`} Locked • Requires Level{' '}
                  {nextSpecialUnlock.level} • {nextSpecialUnlock.dp} DP
                </Text>
              )}
              <Button
                mt={2}
                size="sm"
                width="100%"
                colorScheme={isRetroDesktopTheme ? undefined : 'red'}
                variant={isRetroDesktopTheme ? 'unstyled' : 'outline'}
                onClick={onSell}
                isDisabled={controlsLocked}
                fontFamily={uiFontFamily}
                sx={isRetroDesktopTheme ? createRetroButtonSx() : undefined}
              >
                Sell (+{selectedTower.sellValue} Bits)
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Text fontSize="xs" color={bodyTextColor} fontFamily={uiFontFamily}>
          Click a module on the grid to view upgrade options.
        </Text>
      )}
    </Box>
  );
};

export default TowerUpgradePanel;
