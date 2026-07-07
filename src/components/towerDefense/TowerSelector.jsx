import { Badge, Box, Flex, Heading, Text, Tooltip, VStack } from '@chakra-ui/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import audioManager from '../../utils/audio/AudioManager';
import { RETRO_DEFENSE_MATRIX_ICON_ASSET } from '../../utils/assets/towerDefenseAssetUrls';
import {
  formatCoreTowerList,
  getMissingCoreTowerLabels,
  isRequiredCoreTower,
} from '../../utils/towerDefense/coreTowerRequirements';
import { TOWER_TYPES } from './data/towerTypes';
import useGuestFunnel from '../../hooks/guest/useGuestFunnel';

const getAffordabilitySignature = (items, credits) =>
  items
    .map((item) => `${item.conceptKey || item.key || item.type}:${credits >= item.cost ? 1 : 0}`)
    .join('|');

const getArraySignature = (values) =>
  Array.isArray(values)
    ? values
        .map((value) => String(value || ''))
        .sort()
        .join('|')
    : '';

const getAvailabilitySignature = (availableTowerTypes) => {
  if (!availableTowerTypes) return '';
  if (Array.isArray(availableTowerTypes)) {
    return getArraySignature(availableTowerTypes);
  }

  return Object.keys(availableTowerTypes)
    .sort()
    .map((key) => `${key}:${availableTowerTypes[key] ? 1 : 0}`)
    .join('|');
};

const getCoreRequirementSignature = (coreTowerRequirements) =>
  Object.keys(coreTowerRequirements || {})
    .sort()
    .map((key) => `${key}:${coreTowerRequirements[key] ? 1 : 0}`)
    .join('|');

const getUnlockGateSignature = (unlockGates) =>
  Object.keys(unlockGates || {})
    .sort()
    .map((key) => {
      const gate = unlockGates[key] || {};
      return `${key}:${gate.locked ? 1 : 0}:${gate.minLevel ?? ''}:${gate.requiredDp ?? ''}`;
    })
    .join('|');

const TowerSelector = ({
  onSelectTower,
  credits = 0,
  selectedTowerType = null,
  isTowerPlacementMode = false,
  gameStatus,
  availableTowerTypes = null,
  allowedTowerTypes = null,
  initialCodeGenerated = false,
  strictCodeGate = false,
  functionTowerPlaced = false,
  objectTowerPlaced = false,
  coreTowerRequirements = { function: true, object: true },
  onCancelPlacement,
  towerUnlockGates = {},
  shellTheme = 'default',
  isHomepageDemo = false,
}) => {
  // Add internal state to track initialCodeGenerated as a backup
  const funnel = useGuestFunnel();
  const [internalCodeGenerated, setInternalCodeGenerated] = useState(initialCodeGenerated);
  const [activeError, setActiveError] = useState(null);
  const componentRef = useRef(null);

  // Check for DOM and localStorage state on mount and when props change
  useEffect(() => {
    if (strictCodeGate) {
      setInternalCodeGenerated(Boolean(initialCodeGenerated));
      return;
    }
    // Function to check all possible sources for initialCodeGenerated state
    const checkCodeGeneratedState = () => {
      // First use the prop directly
      if (initialCodeGenerated) {
        //console.log('[DEBUG] TowerSelector: initialCodeGenerated true from props');
        setInternalCodeGenerated(true);
        return true;
      }

      // Check localStorage
      const storedValue = localStorage.getItem('_tower_defense_code_generated');
      if (storedValue === 'true') {
        //console.log('[DEBUG] TowerSelector: initialCodeGenerated true from localStorage');
        setInternalCodeGenerated(true);
        return true;
      }

      // Check body class
      if (document.body.classList.contains('initial-code-generated')) {
        //console.log('[DEBUG] TowerSelector: initialCodeGenerated true from body class');
        setInternalCodeGenerated(true);
        return true;
      }

      // Check for DOM element tracker
      const stateTracker = document.getElementById('td-code-generated-flag');
      if (stateTracker) {
        //console.log('[DEBUG] TowerSelector: initialCodeGenerated true from DOM marker');
        setInternalCodeGenerated(true);
        return true;
      }

      // Add class to help identify this component in the DOM
      if (componentRef.current) {
        componentRef.current.classList.add('tower-selector');
      }

      return initialCodeGenerated;
    };

    // Run the check immediately
    checkCodeGeneratedState();

    // Also set up an interval to periodically check
    const intervalId = setInterval(checkCodeGeneratedState, 1000);

    // Listen for custom events
    const handleCodeGenComplete = () => {
      //console.log('[DEBUG] TowerSelector: Received codegen-complete event');
      setInternalCodeGenerated(true);
    };

    const handleCodeGenReset = () => {
      //console.log('[DEBUG] TowerSelector: Received codegen-reset event');
      setInternalCodeGenerated(false);
    };

    const handleCompleteReset = () => {
      //console.log('[DEBUG] TowerSelector: Received game-completely-reset event');
      setInternalCodeGenerated(false);
    };

    document.addEventListener('codegen-complete', handleCodeGenComplete);
    document.addEventListener('codegen-reset', handleCodeGenReset);
    document.addEventListener('game-completely-reset', handleCompleteReset);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('codegen-complete', handleCodeGenComplete);
      document.removeEventListener('codegen-reset', handleCodeGenReset);
      document.removeEventListener('game-completely-reset', handleCompleteReset);
    };
  }, [initialCodeGenerated, strictCodeGate]);

  // If internal state says code is generated but props don't, use internal state
  const effectiveCodeGenerated = strictCodeGate
    ? initialCodeGenerated
    : internalCodeGenerated || initialCodeGenerated;
  const missingCoreTowerLabels = useMemo(
    () =>
      getMissingCoreTowerLabels(coreTowerRequirements, {
        functionTowerPlaced,
        objectTowerPlaced,
      }),
    [coreTowerRequirements, functionTowerPlaced, objectTowerPlaced]
  );
  const coreTowerLabelText = formatCoreTowerList(
    missingCoreTowerLabels.length ? missingCoreTowerLabels : ['core']
  );

  // Filter available tower types based on the code analysis and game state
  const availableTowers = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
    const allowedSet = Array.isArray(allowedTowerTypes)
      ? new Set(allowedTowerTypes.map(normalize))
      : null;
    const isTowerAllowed = (tower) => {
      if (!allowedSet || allowedSet.size === 0) return true;
      const typeKey = normalize(tower.type);
      const conceptKey = normalize(tower.conceptKey);
      const rawKey = normalize(tower.key);
      return allowedSet.has(typeKey) || allowedSet.has(conceptKey) || allowedSet.has(rawKey);
    };

    const filterCoreTowers = (tower) => {
      if (isHomepageDemo && isRequiredCoreTower(tower.type, coreTowerRequirements)) return true;
      if (!isRequiredCoreTower(tower.type, coreTowerRequirements)) return false;
      return missingCoreTowerLabels.includes(tower.type);
    };

    // FIRST CHECK: If game is in prehack state, ALWAYS restrict to Function and Object only
    if (gameStatus === 'prehack') {
      //console.log('[DEBUG] TowerSelector: Game is in prehack state - restricting to Function and Object towers only');
      return Object.values(TOWER_TYPES).filter(
        (tower) => filterCoreTowers(tower) && isTowerAllowed(tower)
      );
    }

    // If the game is in playing or wave-complete state, allow all towers regardless of initialCodeGenerated
    // This lets users buy other tower types after the first wave has started
    if (gameStatus === 'playing' || gameStatus === 'wave-complete') {
      //console.log('[DEBUG] TowerSelector: Game is in playing/wave-complete state - initialCodeGenerated:', effectiveCodeGenerated);

      // Always allow all towers in playing state, regardless of initialCodeGenerated
      if (!availableTowerTypes) {
        //console.log('[DEBUG] TowerSelector: No availableTowerTypes provided, returning all towers');
        const allTowers = Object.values(TOWER_TYPES).filter(isTowerAllowed);
        //console.log('[DEBUG] Available tower types:', allTowers.map(t => t.type));
        return allTowers;
      }

      // Filter towers based on available tower types from parent
      //console.log('[DEBUG] TowerSelector: Filtering towers based on availableTowerTypes', availableTowerTypes);
      const filteredTowers = Object.values(TOWER_TYPES).filter((tower) => {
        if (tower.isNonCode) return isTowerAllowed(tower);
        const conceptKey = tower.conceptKey;
        // Check both the original key and lowercase version
        const isAvailable =
          availableTowerTypes[conceptKey] ||
          availableTowerTypes[conceptKey.toLowerCase()] ||
          availableTowerTypes[conceptKey.toUpperCase()];

        if (conceptKey === 'RETURN_STATEMENT') {
          //console.log(`[DEBUG] Return tower availability check: ${isAvailable} (conceptKey: ${conceptKey})`);
        }

        return isAvailable && isTowerAllowed(tower);
      });

      //console.log('[DEBUG] Filtered tower types:', filteredTowers.map(t => t.type));
      return filteredTowers;
    }

    // Before initial code generation, only allow Function and Object towers
    if (!effectiveCodeGenerated) {
      //console.log('[DEBUG] TowerSelector: Initial code not generated - only showing Function and Object towers');
      //console.log('[DEBUG] State check - prop initialCodeGenerated:', initialCodeGenerated, 'internal:', internalCodeGenerated);
      return Object.values(TOWER_TYPES).filter(
        (tower) => filterCoreTowers(tower) && isTowerAllowed(tower)
      );
    }

    // If no restrictions provided, all towers are available
    if (!availableTowerTypes) {
      //console.log('[DEBUG] TowerSelector: Initial code generated, no restrictions - showing all towers');
      return Object.values(TOWER_TYPES).filter(isTowerAllowed);
    }

    //logger.info('Filtering towers based on code analysis:');
    //logger.debug(availableTowerTypes);

    // Filter towers based on available tower types
    //console.log('[DEBUG] TowerSelector: Initial code generated, filtering by availableTowerTypes');
    return Object.values(TOWER_TYPES)
      .filter((tower) => {
        if (tower.isNonCode) return true;
        const conceptKey = tower.conceptKey;
        // Check both the original key and lowercase version
        return (
          availableTowerTypes[conceptKey] ||
          availableTowerTypes[conceptKey.toLowerCase()] ||
          availableTowerTypes[conceptKey.toUpperCase()]
        );
      })
      .filter(isTowerAllowed);
  }, [
    allowedTowerTypes,
    availableTowerTypes,
    coreTowerRequirements,
    effectiveCodeGenerated,
    gameStatus,
    missingCoreTowerLabels,
  ]);

  // Handle tower selection
  const handleSelectTower = (towerType) => {
    if (isHomepageDemo) {
      const normalizedType = String(towerType)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (normalizedType === 'FUNCTION' && functionTowerPlaced) {
        audioManager.playSoundEffect?.('error');
        setActiveError('Function');
        return;
      }
      if (normalizedType === 'OBJECT' && objectTowerPlaced) {
        audioManager.playSoundEffect?.('error');
        setActiveError('Object');
        return;
      }
    }
    if (onSelectTower) {
      // Play sound when tower is selected
      audioManager.playSoundEffect('button-click');
      onSelectTower(towerType);
    }
  };

  // Handle mouse enter for tower items
  const handleTowerHover = (towerType) => {
    //audioManager.playSoundEffect('ui-hover');
    if (isHomepageDemo) {
      funnel.towerHovered(towerType);
    }
  };

  // Check if game is in a state where towers can be placed
  const canPlaceTowers = ['ready', 'playing', 'wave-complete'].includes(gameStatus);
  const isRetroDesktopTheme = shellTheme === 'retro-desktop';
  const uiFontFamily = isRetroDesktopTheme
    ? "'Tahoma', 'MS Sans Serif', sans-serif"
    : "'Orbitron', sans-serif";
  const retroPanelSurfaceProps = isRetroDesktopTheme
    ? {
        bg: '#d4d0c8',
        borderRight: '2px solid #232730',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
      }
    : null;
  const retroInsetPanelProps = isRetroDesktopTheme
    ? {
        bg: '#f4efe6',
        borderRadius: '0',
        border: '2px solid #232730',
        boxShadow:
          'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)',
      }
    : null;
  const compactMicroFontSize = 'var(--cg-font-size-micro)';
  const compactMetaFontSize = 'var(--cg-font-size-meta)';
  const compactUiFontSize = 'var(--cg-font-size-ui)';
  const compactBodyFontSize = 'var(--cg-font-size-copy)';

  return (
    <VStack
      ref={componentRef}
      width="100%"
      boxSizing="border-box"
      bg={isRetroDesktopTheme ? '#d4d0c8' : '#0a0a1a'}
      p={4}
      spacing={4}
      align="stretch"
      height="100%"
      flexGrow={1}
      minWidth="0"
      borderRight={isRetroDesktopTheme ? retroPanelSurfaceProps.borderRight : '1px solid #0f4667'}
      boxShadow={
        isRetroDesktopTheme
          ? retroPanelSurfaceProps.boxShadow
          : '0 0 15px rgba(0, 180, 255, 0.1) inset'
      }
      sx={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: isRetroDesktopTheme ? '#8e8e8e' : '#0f4667',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: isRetroDesktopTheme ? '#c9c4ba' : '#0a0a1a',
        },
        ...(isRetroDesktopTheme
          ? {}
          : {
              '@keyframes scanline': {
                '0%': {
                  transform: 'translateY(-100%)',
                },
                '100%': {
                  transform: 'translateY(100%)',
                },
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00ccff, transparent)',
                opacity: 0.3,
                animation: 'scanline 4s linear infinite',
              },
            }),
      }}
      className="tower-selector"
      data-initial-code-generated={effectiveCodeGenerated ? 'true' : 'false'}
      data-tutorial="tower-selector"
      position="relative"
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
              w="32px"
              h="32px"
              display="grid"
              placeItems="center"
              border="1px solid #10131c"
              bg="#d4d0c8"
              boxShadow="inset 1px 1px 0 rgba(255,255,255,0.76), inset -1px -1px 0 rgba(110,110,110,0.34)"
              flexShrink={0}
            >
              <Box
                as="img"
                src={RETRO_DEFENSE_MATRIX_ICON_ASSET}
                alt=""
                aria-hidden="true"
                w="18px"
                h="18px"
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
              Defense Matrix
            </Text>
          </Flex>
        </Box>
      ) : (
        <Heading
          size="md"
          color="#00ccff"
          fontFamily="'Orbitron', sans-serif"
          textShadow="0 0 10px #00ccff"
          letterSpacing="1px"
          borderBottom="1px solid #00ccff33"
          pb={2}
          display="flex"
          alignItems="center"
          _before={{
            content: '""',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#00ccff',
            marginRight: '8px',
            boxShadow: '0 0 8px #00ccff',
          }}
        >
          DEFENSE MATRIX
        </Heading>
      )}

      {!effectiveCodeGenerated && gameStatus !== 'playing' && gameStatus !== 'wave-complete' ? (
        <Box
          p={3}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(0, 30, 60, 0.7)',
                borderRadius: 'md',
                borderLeft: '2px solid #00ccff',
              })}
          width="100%"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isRetroDesktopTheme
              ? 'none'
              : 'linear-gradient(45deg, transparent 0%, rgba(0, 204, 255, 0.05) 50%, transparent 100%)',
            borderRadius: isRetroDesktopTheme ? '0' : 'md',
            pointerEvents: 'none',
          }}
        >
          <Text
            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
            fontWeight="bold"
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 5px #00ccff'}
            mb={1}
            fontSize="sm"
          >
            INITIALIZATION REQUIRED
          </Text>
          <Text color={isRetroDesktopTheme ? '#35393f' : '#99ccff'} fontSize="xs" lineHeight="1.4">
            <Box as="span" color={isRetroDesktopTheme ? '#0b2ba8' : '#ff3366'} fontWeight="bold">
              ▶
            </Box>{' '}
            Deploy {coreTowerLabelText} {missingCoreTowerLabels.length === 1 ? 'module' : 'modules'}{' '}
            to initialize core system architecture.
          </Text>
        </Box>
      ) : !effectiveCodeGenerated &&
        (gameStatus === 'playing' || gameStatus === 'wave-complete') ? (
        <Box
          p={3}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(0, 60, 30, 0.5)',
                borderRadius: 'md',
                borderLeft: '2px solid #00ff88',
              })}
          width="100%"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isRetroDesktopTheme
              ? 'none'
              : 'linear-gradient(transparent 0%, rgba(0, 255, 136, 0.05) 50%, transparent 100%)',
            borderRadius: isRetroDesktopTheme ? '0' : 'md',
            pointerEvents: 'none',
          }}
        >
          <Text
            color={isRetroDesktopTheme ? '#285d2f' : '#00ff88'}
            fontWeight="bold"
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 5px #00ff88'}
            mb={1}
            fontSize="sm"
          >
            THREAT DETECTED
          </Text>
          <Text color={isRetroDesktopTheme ? '#35393f' : '#aaffcc'} fontSize="xs" lineHeight="1.4">
            <Box as="span" color={isRetroDesktopTheme ? '#285d2f' : '#ff3366'} fontWeight="bold">
              ■
            </Box>{' '}
            All defense modules unlocked. Each module placed enhances system capabilities.
          </Text>
        </Box>
      ) : null}

      {availableTowers.length === 0 ? (
        <Box
          p={3}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(60, 0, 0, 0.5)',
                borderRadius: 'md',
                borderLeft: '2px solid #ff3366',
              })}
          opacity={0.9}
          width="100%"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isRetroDesktopTheme
              ? 'none'
              : 'linear-gradient(transparent 0%, rgba(255, 51, 102, 0.05) 50%, transparent 100%)',
            borderRadius: isRetroDesktopTheme ? '0' : 'md',
            pointerEvents: 'none',
          }}
        >
          <Text
            color={isRetroDesktopTheme ? '#8b1f18' : '#ff3366'}
            fontWeight="bold"
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 5px #ff3366'}
            mb={1}
            fontSize="sm"
          >
            SYSTEM ERROR
          </Text>
          <Text color={isRetroDesktopTheme ? '#35393f' : '#ffaaaa'} fontSize="xs" lineHeight="1.4">
            <Box as="span" color={isRetroDesktopTheme ? '#8b1f18' : '#ff3366'} fontWeight="bold">
              ✗
            </Box>{' '}
            No deployable modules found. Return to code interface to implement required constructs.
          </Text>
        </Box>
      ) : (
        availableTowers.map((tower) => {
          const isAffordable = credits >= tower.cost;
          const isSelected = selectedTowerType === tower.type;
          const towerColor = tower.color;
          // Store/level gate check using conceptKey (e.g. 'AI_ASSIST')
          const gateKey = tower.conceptKey || tower.type?.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const storeGate = towerUnlockGates[gateKey];
          const isStoreLocked = Boolean(storeGate?.locked);
          const isClickable = isAffordable && canPlaceTowers && !isStoreLocked;
          const hasDisplayableSpecialUpgrades =
            tower.conceptKey !== 'AI_ASSIST' &&
            Array.isArray(tower.specialUpgrades) &&
            tower.specialUpgrades.length > 0;

          // Create data-tutorial attribute based on tower type
          const getTutorialAttribute = (towerType) => {
            {
              isTowerPlacementMode && selectedTowerType && onCancelPlacement ? (
                <Text
                  fontSize="xs"
                  color="#00ccff"
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => onCancelPlacement()}
                >
                  Cancel tower purchase
                </Text>
              ) : null;
            }
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

          const tutorialAttr = getTutorialAttribute(tower.type);
          const tutorialProps = tutorialAttr ? { 'data-tutorial': tutorialAttr } : {};

          return (
            <Box
              key={tower.type}
              data-selected={isSelected ? 'true' : 'false'}
              p={3}
              bg={
                isRetroDesktopTheme
                  ? isSelected
                    ? '#ece7dc'
                    : '#d9d4ca'
                  : isSelected
                    ? 'rgba(20, 20, 40, 0.9)'
                    : 'rgba(15, 15, 30, 0.7)'
              }
              borderRadius={isRetroDesktopTheme ? '0' : 'sm'}
              cursor={isClickable ? 'pointer' : 'not-allowed'}
              _hover={{
                bg: isClickable
                  ? isRetroDesktopTheme
                    ? '#ece7dc'
                    : 'rgba(25, 25, 50, 0.9)'
                  : undefined,
                transform: isClickable
                  ? isRetroDesktopTheme
                    ? 'translateY(1px)'
                    : 'translateY(-1px)'
                  : undefined,
                boxShadow: isClickable
                  ? isRetroDesktopTheme
                    ? 'inset 1px 1px 0 rgba(255, 255, 255, 0.62), inset -1px -1px 0 rgba(66, 72, 82, 0.28)'
                    : `0 0 10px ${towerColor}50`
                  : undefined,
              }}
              borderLeft={isRetroDesktopTheme ? undefined : `2px solid ${towerColor}`}
              border={isRetroDesktopTheme ? '2px solid #232730' : undefined}
              opacity={isClickable ? 1 : 0.6}
              onClick={() => isClickable && handleSelectTower(tower.type)}
              onMouseEnter={() => isClickable && handleTowerHover(tower.type)}
              transition="all 0.2s"
              width="100%"
              position="relative"
              outline={
                isRetroDesktopTheme
                  ? isSelected
                    ? '2px solid #0b2ba8'
                    : 'none'
                  : isSelected
                    ? `1px solid ${towerColor}70`
                    : 'none'
              }
              _after={
                isSelected
                  ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '7px',
                      height: '7px',
                      background: isRetroDesktopTheme ? '#0b2ba8' : towerColor,
                      boxShadow: isRetroDesktopTheme ? 'none' : `0 0 5px ${towerColor}`,
                    }
                  : {}
              }
              {...tutorialProps}
            >
              <Flex justify="space-between" align="center" mb={1} wrap="wrap">
                <Tooltip
                  label={
                    isStoreLocked
                      ? `Locked: ${storeGate?.minLevel ? `Level ${storeGate.minLevel}` : 'Level requirement'}${storeGate?.requiredDp ? ` + ${storeGate.requiredDp} DP unlock` : ' + Store purchase required'}`
                      : !isAffordable
                        ? `Insufficient bits (${tower.cost} required)`
                        : !canPlaceTowers
                          ? 'Deployment unavailable'
                          : ''
                  }
                  isDisabled={isClickable}
                  onOpen={() => audioManager.playSoundEffect('ui-hover')}
                  bg={isRetroDesktopTheme ? '#f4efe6' : 'rgba(0, 0, 30, 0.9)'}
                  color={isRetroDesktopTheme ? '#1f2128' : towerColor}
                  borderRadius="sm"
                  padding="5px 8px"
                  fontSize="xs"
                >
                  <Text
                    color={isRetroDesktopTheme ? '#1f2128' : towerColor}
                    fontWeight="bold"
                    fontFamily={uiFontFamily}
                    textShadow={isRetroDesktopTheme ? 'none' : `0 0 5px ${towerColor}`}
                    letterSpacing="0.5px"
                    fontSize="sm"
                  >
                    {tower.displayName || tower.type}
                  </Text>
                </Tooltip>
                <Flex align="center">
                  <Text
                    color={isRetroDesktopTheme ? '#7b5b13' : '#ffcc00'}
                    mr={2}
                    fontFamily={uiFontFamily}
                    textShadow={isRetroDesktopTheme ? 'none' : '0 0 3px #ffcc00'}
                    fontSize="xs"
                  >
                    {tower.cost}{' '}
                    <Box as="span" fontSize={compactMetaFontSize}>
                      BITS
                    </Box>
                  </Text>
                  {tower.isNonCode && (
                    <Badge
                      bg={isRetroDesktopTheme ? '#e4d9bd' : '#2b1a00'}
                      color={isRetroDesktopTheme ? '#6a4b12' : '#ffb703'}
                      fontSize={compactMicroFontSize}
                      borderRadius="sm"
                      px={1}
                      mr={2}
                    >
                      NO CODE GEN
                    </Badge>
                  )}
                  {isStoreLocked && (
                    <Badge
                      bg={isRetroDesktopTheme ? '#ddd2ec' : '#1a0d2e'}
                      color={isRetroDesktopTheme ? '#5d2e8c' : '#bf7fff'}
                      fontSize={compactMetaFontSize}
                      textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #bf7fff'}
                      borderRadius="sm"
                      px={1}
                      mr={1}
                    >
                      LOCKED
                    </Badge>
                  )}
                  {!isAffordable && (
                    <Badge
                      bg={isRetroDesktopTheme ? '#e8cbc8' : '#3d0a17'}
                      color={isRetroDesktopTheme ? '#8b1f18' : '#ff3366'}
                      fontSize={compactMetaFontSize}
                      textShadow={isRetroDesktopTheme ? 'none' : '0 0 2px #ff3366'}
                      borderRadius="sm"
                      px={1}
                    >
                      LOCKED
                    </Badge>
                  )}
                </Flex>
              </Flex>

              <Text
                color={isRetroDesktopTheme ? '#35393f' : '#cceeff'}
                fontSize={compactBodyFontSize}
                mb={2}
                opacity={0.9}
              >
                {tower.description}
              </Text>
              {isStoreLocked && (
                <Text
                  color={isRetroDesktopTheme ? '#5d2e8c' : '#d6a1ff'}
                  fontSize={compactUiFontSize}
                  mb={2}
                  opacity={0.95}
                >
                  LOCKED: Requires Level {storeGate?.minLevel ?? '?'}
                  {storeGate?.requiredDp ? ` • ${storeGate.requiredDp} DP` : ' • Store Unlock'}
                </Text>
              )}

              <Flex
                justify="space-between"
                fontSize={compactMetaFontSize}
                color={isRetroDesktopTheme ? '#4d5562' : '#88AACC'}
                wrap="wrap"
                borderTop={
                  isRetroDesktopTheme
                    ? '1px solid rgba(33, 37, 44, 0.24)'
                    : '1px dashed rgba(0, 204, 255, 0.2)'
                }
                pt={1}
              >
                <Text mr={2}>DMG: {tower.damage}</Text>
                <Text mr={2}>RNG: {tower.range}</Text>
                <Text>SPD: {tower.attackSpeed}/s</Text>
              </Flex>

              {/* Core upgrades */}
              {tower.upgradeCosts && tower.upgradeCosts.length > 0 && (
                <Box
                  mt={2}
                  pt={1}
                  borderTop={
                    isRetroDesktopTheme
                      ? '1px solid rgba(33, 37, 44, 0.24)'
                      : '1px dashed rgba(0, 204, 255, 0.2)'
                  }
                  width="100%"
                >
                  <Text
                    fontSize={compactMetaFontSize}
                    color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
                    mb={1}
                    opacity={0.8}
                  >
                    CORE UPGRADES:
                  </Text>
                  {tower.upgradeCosts.slice(0, 2).map((cost, index) => (
                    <Flex
                      key={`core-${index}`}
                      justify="space-between"
                      fontSize={compactMetaFontSize}
                      color={isRetroDesktopTheme ? '#4d5562' : '#88AACC'}
                      opacity={0.8}
                    >
                      <Text>Core Upgrade {index + 1}</Text>
                      <Text>{cost}</Text>
                    </Flex>
                  ))}
                  <Text
                    fontSize={compactMetaFontSize}
                    color={isRetroDesktopTheme ? '#4d5562' : '#88AACC'}
                    mt={1}
                    opacity={0.7}
                  >
                    +20% DMG · +0.5 RNG · +10% SPD per level
                  </Text>
                </Box>
              )}

              {/* Special upgrades */}
              {hasDisplayableSpecialUpgrades && (
                <Box
                  mt={2}
                  pt={1}
                  borderTop={
                    isRetroDesktopTheme
                      ? '1px solid rgba(33, 37, 44, 0.24)'
                      : '1px dashed rgba(0, 204, 255, 0.2)'
                  }
                  width="100%"
                >
                  <Text
                    fontSize={compactMetaFontSize}
                    color={isRetroDesktopTheme ? '#5d2e8c' : '#c38cff'}
                    mb={1}
                    opacity={0.9}
                  >
                    SPECIAL UPGRADES:
                  </Text>
                  {tower.specialUpgrades.slice(0, 2).map((upgrade, index) => (
                    <Box key={`special-${index}`} mb={1}>
                      <Flex
                        justify="space-between"
                        fontSize={compactMetaFontSize}
                        color={isRetroDesktopTheme ? '#5d2e8c' : '#bfa6ff'}
                        opacity={0.85}
                      >
                        <Text>{upgrade.name}</Text>
                        <Text>{upgrade.cost}</Text>
                      </Flex>
                      {upgrade.effect && (
                        <Text
                          fontSize={compactMicroFontSize}
                          color={isRetroDesktopTheme ? '#6a5a7f' : '#b8a6ff'}
                          opacity={0.7}
                        >
                          {upgrade.effect}
                        </Text>
                      )}
                    </Box>
                  ))}
                  {tower.specialUpgrades.length > 2 && (
                    <Text
                      fontSize={compactMetaFontSize}
                      color={isRetroDesktopTheme ? '#5d2e8c' : '#bfa6ff'}
                      textAlign="center"
                      mt={1}
                      opacity={0.7}
                    >
                      +{tower.specialUpgrades.length - 2} more...
                    </Text>
                  )}
                </Box>
              )}
              {tower.conceptKey === 'AI_ASSIST' && (
                <Box
                  mt={2}
                  pt={1}
                  borderTop={
                    isRetroDesktopTheme
                      ? '1px solid rgba(33, 37, 44, 0.24)'
                      : '1px dashed rgba(0, 204, 255, 0.2)'
                  }
                  width="100%"
                >
                  <Text
                    fontSize={compactMetaFontSize}
                    color={isRetroDesktopTheme ? '#4d5562' : '#8ce0ff'}
                    opacity={0.85}
                  >
                    Adaptive ability: inherits special behavior from the transformed tower.
                  </Text>
                </Box>
              )}
            </Box>
          );
        })
      )}

      {/* Information about code generation */}
      {!effectiveCodeGenerated && (
        <Box
          p={3}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(0, 20, 40, 0.7)',
                borderRadius: 'sm',
                borderLeft: '2px solid #00ccff',
              })}
          fontSize="xs"
          color={isRetroDesktopTheme ? '#1f2128' : '#00ccff'}
          mt="auto"
          minHeight="auto"
          flexShrink={0}
          width="100%"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isRetroDesktopTheme
              ? 'none'
              : 'linear-gradient(135deg, transparent 0%, rgba(0, 204, 255, 0.05) 50%, transparent 100%)',
            borderRadius: isRetroDesktopTheme ? '0' : 'sm',
            pointerEvents: 'none',
          }}
        >
          <Text
            fontWeight="bold"
            mb={2}
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 4px #00ccff'}
            fontSize="sm"
            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
          >
            SYS_INITIALIZATION
          </Text>
          <Text
            color={isRetroDesktopTheme ? '#35393f' : '#99ccff'}
            fontSize={compactBodyFontSize}
            lineHeight="1.5"
          >
            Deploy {coreTowerLabelText} {missingCoreTowerLabels.length === 1 ? 'module' : 'modules'}{' '}
            to generate core architecture. Additional modules augment defensive capabilities.
          </Text>
        </Box>
      )}

      {/* Information about restricted towers */}
      {effectiveCodeGenerated && availableTowerTypes && (
        <Box
          p={3}
          {...(isRetroDesktopTheme
            ? retroInsetPanelProps
            : {
                bg: 'rgba(0, 20, 40, 0.7)',
                borderRadius: 'sm',
                borderLeft: '2px solid #00ccff',
              })}
          fontSize="xs"
          color={isRetroDesktopTheme ? '#1f2128' : '#00ccff'}
          minHeight="auto"
          flexShrink={0}
          width="100%"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: isRetroDesktopTheme
              ? 'none'
              : 'linear-gradient(135deg, transparent 0%, rgba(0, 204, 255, 0.05) 50%, transparent 100%)',
            borderRadius: isRetroDesktopTheme ? '0' : 'sm',
            pointerEvents: 'none',
          }}
        >
          <Text
            fontWeight="bold"
            mb={2}
            fontFamily={uiFontFamily}
            textShadow={isRetroDesktopTheme ? 'none' : '0 0 4px #00ccff'}
            fontSize="sm"
            color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
          >
            MODULE_STATUS
          </Text>
          <Text
            color={isRetroDesktopTheme ? '#35393f' : '#99ccff'}
            fontSize={compactBodyFontSize}
            lineHeight="1.5"
          >
            Each deployed module adds its programmatic function to your solution. Strategize defense
            and code architecture simultaneously.
          </Text>
        </Box>
      )}

      {/* Instructions */}
      <Box
        p={3}
        {...(isRetroDesktopTheme
          ? retroInsetPanelProps
          : {
              bg: 'rgba(0, 20, 40, 0.7)',
              borderRadius: 'sm',
              borderLeft: '2px solid #00ccff',
            })}
        fontSize="xs"
        color={isRetroDesktopTheme ? '#35393f' : '#aaccff'}
        mt="auto"
        minHeight="auto"
        flexShrink={0}
        width="100%"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isRetroDesktopTheme
            ? 'none'
            : 'linear-gradient(135deg, transparent 0%, rgba(0, 204, 255, 0.05) 50%, transparent 100%)',
          borderRadius: isRetroDesktopTheme ? '0' : 'sm',
          pointerEvents: 'none',
        }}
      >
        <Text
          fontWeight="bold"
          color={isRetroDesktopTheme ? '#0b2ba8' : '#00ccff'}
          mb={2}
          fontFamily={uiFontFamily}
          textShadow={isRetroDesktopTheme ? 'none' : '0 0 4px #00ccff'}
          fontSize="sm"
          display="flex"
          alignItems="center"
          _before={{
            content: '">"',
            marginRight: '4px',
            color: isRetroDesktopTheme ? '#7b5b13' : '#00ffaa',
          }}
        >
          DEPLOYMENT_PROTOCOL
        </Text>
        <Text
          color={isRetroDesktopTheme ? '#35393f' : '#99ccff'}
          fontSize={compactBodyFontSize}
          mb={1}
        >
          01: Select module from inventory
        </Text>
        <Text
          color={isRetroDesktopTheme ? '#35393f' : '#99ccff'}
          fontSize={compactBodyFontSize}
          mb={1}
        >
          02: Click on grid node to deploy
        </Text>
        <Text color={isRetroDesktopTheme ? '#35393f' : '#99ccff'} fontSize={compactBodyFontSize}>
          03: Strategic placement enhances defense
        </Text>
      </Box>

      {activeError && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={100}
          w="85%"
          p={isRetroDesktopTheme ? '2px' : 4}
          bg={isRetroDesktopTheme ? '#d4d0c8' : 'rgba(15, 10, 30, 0.95)'}
          border={isRetroDesktopTheme ? '2px solid' : '1px solid'}
          borderColor={isRetroDesktopTheme ? '#232730' : 'rgba(255, 51, 102, 0.4)'}
          boxShadow={
            isRetroDesktopTheme
              ? 'inset 1px 1px 0 #fff, inset -1px -1px 0 #808080, 2px 2px 10px rgba(0,0,0,0.5)'
              : '0 0 20px rgba(255, 51, 102, 0.25)'
          }
          borderRadius={isRetroDesktopTheme ? '0' : 'md'}
        >
          {isRetroDesktopTheme ? (
            <VStack spacing={0} align="stretch">
              <Flex
                bg="linear-gradient(90deg, #000080, #1080d0)"
                color="white"
                px={2}
                py="3px"
                align="center"
                justify="space-between"
                fontWeight="bold"
                fontSize="xs"
                fontFamily="Tahoma, sans-serif"
              >
                <Text>System Warning</Text>
                <Box
                  as="button"
                  onClick={() => setActiveError(null)}
                  w="14px"
                  h="14px"
                  bg="#d4d0c8"
                  color="black"
                  border="1px solid #808080"
                  boxShadow="inset 1px 1px 0 #fff"
                  display="grid"
                  placeItems="center"
                  fontSize="9px"
                  fontWeight="bold"
                  lineHeight={1}
                >
                  X
                </Box>
              </Flex>
              <Box p={4} bg="#d4d0c8" textAlign="center">
                <Flex align="center" gap={3} mb={4}>
                  <Box
                    bg="#ff0000"
                    color="white"
                    borderRadius="full"
                    w="32px"
                    h="32px"
                    display="grid"
                    placeItems="center"
                    fontSize="lg"
                    fontWeight="bold"
                  >
                    !
                  </Box>
                  <Text
                    color="black"
                    fontSize="xs"
                    fontFamily="Tahoma, sans-serif"
                    textAlign="left"
                  >
                    [Error: {activeError} already initialized]
                  </Text>
                </Flex>
                <Box
                  as="button"
                  onClick={() => setActiveError(null)}
                  px={6}
                  py="3px"
                  bg="#d4d0c8"
                  color="black"
                  border="1px solid #808080"
                  boxShadow="inset 1px 1px 0 #fff"
                  fontSize="xs"
                  fontFamily="Tahoma, sans-serif"
                  fontWeight="bold"
                  mx="auto"
                  _active={{
                    boxShadow: 'inset -1px -1px 0 #fff, inset 1px 1px 0 #808080',
                  }}
                >
                  OK
                </Box>
              </Box>
            </VStack>
          ) : (
            <VStack spacing={3} align="center">
              <Text
                color="#ff3366"
                fontSize="md"
                fontWeight="bold"
                fontFamily="'Orbitron', sans-serif"
              >
                INITIALIZATION FAILED
              </Text>
              <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                [Error: {activeError} already initialized]
              </Text>
              <Box
                as="button"
                onClick={() => setActiveError(null)}
                px={4}
                py={1.5}
                bg="#ff3366"
                color="white"
                fontSize="xs"
                fontWeight="bold"
                borderRadius="sm"
                _hover={{ bg: '#ff5588' }}
              >
                DISMISS
              </Box>
            </VStack>
          )}
        </Box>
      )}
    </VStack>
  );
};

const areEqual = (prevProps, nextProps) => {
  const towerTypes = Object.values(TOWER_TYPES);

  return (
    prevProps.onSelectTower === nextProps.onSelectTower &&
    prevProps.onCancelPlacement === nextProps.onCancelPlacement &&
    prevProps.selectedTowerType === nextProps.selectedTowerType &&
    prevProps.isTowerPlacementMode === nextProps.isTowerPlacementMode &&
    prevProps.gameStatus === nextProps.gameStatus &&
    prevProps.initialCodeGenerated === nextProps.initialCodeGenerated &&
    prevProps.strictCodeGate === nextProps.strictCodeGate &&
    prevProps.functionTowerPlaced === nextProps.functionTowerPlaced &&
    prevProps.objectTowerPlaced === nextProps.objectTowerPlaced &&
    prevProps.shellTheme === nextProps.shellTheme &&
    prevProps.isHomepageDemo === nextProps.isHomepageDemo &&
    getArraySignature(prevProps.allowedTowerTypes) ===
      getArraySignature(nextProps.allowedTowerTypes) &&
    getAvailabilitySignature(prevProps.availableTowerTypes) ===
      getAvailabilitySignature(nextProps.availableTowerTypes) &&
    getCoreRequirementSignature(prevProps.coreTowerRequirements) ===
      getCoreRequirementSignature(nextProps.coreTowerRequirements) &&
    getUnlockGateSignature(prevProps.towerUnlockGates) ===
      getUnlockGateSignature(nextProps.towerUnlockGates) &&
    getAffordabilitySignature(towerTypes, prevProps.credits) ===
      getAffordabilitySignature(towerTypes, nextProps.credits)
  );
};

export default React.memo(TowerSelector, areEqual);
