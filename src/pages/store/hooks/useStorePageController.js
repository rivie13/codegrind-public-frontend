import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { useMonaco } from '@monaco-editor/react';
import { useAuth } from '../../../contexts/AuthContext';
import { TOWER_TYPES as TD_TOWER_TYPES } from '../../../components/towerDefense/data/towerTypes';
import { DEPLOYABLE_TYPES } from '../../../game-engine-v2';
import {
  EDITOR_BACKGROUND_PACKS,
  EDITOR_EFFECT_PACKS,
  EDITOR_THEME_PACKS,
  ENEMY_PACKS,
  OPEN_SOURCE_FONT_PACKS,
  PROFILE_BACKGROUND_PACKS,
  PROFILE_BADGE_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  PROFILE_DEFAULT_BACKGROUND_PACK,
  PROFILE_DEFAULT_BADGE_PACK,
  PROFILE_DEFAULT_CALLING_CARD_PACK,
  TD_BACKGROUND_PACKS,
  TD_DAMAGE_TEXT_PACKS,
  TD_DEPLOYABLE_PACKS,
  TD_DEATH_FX_PACKS,
  TD_MAP_PACKS,
  TD_SPECIAL_UPGRADE_PACKS,
  TD_TOWER_UNLOCK_PACKS,
  TOWER_PACKS,
} from '../../../data/cosmetics/quickCosmeticPacks';
import { api } from '../../../services/api';
import {
  buildMonacoOptionsFromFont,
  ensureMonacoTheme,
  getMonacoThemeName,
} from '../../../utils/monaco/cosmeticThemeTools';
import {
  EDITOR_SURFACE_CONFIGS,
  registerSurfaceThemeForStore,
} from '../../../utils/monaco/editorSurfaceBaselines';
import {
  DEPLOYABLE_PREVIEW_POSITIONS,
  TD_GAMEPLAY_DEMO_MODE,
  TD_PREVIEW_KIND,
  VARIABLE_AURA_NEIGHBOR_KEYS,
  getDeployableInfo,
  getDeployableKeyFromPack,
  getMainCodePreviewTowers,
  getSpecialLevelForDemo,
  getSpecialUpgradeInfo,
  getSpecialTowerKeyFromPack,
} from '../tdGameplayPreview.utils';
import {
  RETRO_DESKTOP_BACKGROUND_PACK,
  RETRO_DESKTOP_DAMAGE_TEXT_PACK,
  RETRO_DESKTOP_DEATH_FX_PACK,
  RETRO_DESKTOP_ENEMY_PACK,
  RETRO_DESKTOP_MAP_PACK,
  RETRO_DESKTOP_SHELL_COSMETICS,
  RETRO_DESKTOP_TOWER_PACK,
} from '../../games/towerDefenseV2/embeddedShellThemes';
import useStoreCatalog from './useStoreCatalog';
import useStoreQuickslots, { normalizeQuickslots } from './useStoreQuickslots';
import {
  EDITOR_BACKGROUND_PACK_OPTIONS,
  EDITOR_DEFAULT_ID,
  EDITOR_EFFECT_PACK_OPTIONS,
  EDITOR_FONT_PACK_OPTIONS,
  EDITOR_THEME_PACK_OPTIONS,
  FONT_STYLESHEET_URL,
  LOCAL_CATALOG_FALLBACK_PACKS,
  RAINBOW_CHAR_DELAY_STEPS,
  RAINBOW_ROTATING_THEME_IDS,
  TD_ATTACK_FX_PACKS,
  TD_BACKGROUND_PACK_OPTIONS,
  TD_HOMEPAGE_DEFAULT_ID,
  TD_MAP_PACK_OPTIONS,
  TD_PATH_GRADIENT_PACKS,
  TD_PATH_NODES,
  TD_PREVIEW_TOWER_POSITIONS,
  TD_TOWER_PACK_OPTIONS,
  ensureRainbowCharStyleSheet,
  expandPathNodes,
  findPackByStoreSlug,
  getDefaultPackId,
  getPackById,
  isAnimatedKeywordToken,
} from '../storePage.constants';

const useStorePageController = () => {
  const { user } = useAuth();
  const toast = useToast();
  const monacoInstance = useMonaco();
  const gameCanvasRef = useRef(null);
  const previewEditorRef = useRef(null);
  const rainbowDecorationIdsRef = useRef([]);
  const previewDifficultyRef = useRef(0);
  const didInitialStoreLoadRef = useRef(false);
  const checkoutModal = useDisclosure();

  const [activeSectionId, setActiveSectionId] = useState('editor');
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [equipBusySlot, setEquipBusySlot] = useState(null);
  const [batchEquipBusy, setBatchEquipBusy] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const [items, setItems] = useState([]);
  const [inventoryItemIds, setInventoryItemIds] = useState(new Set());
  const [equippedBySlot, setEquippedBySlot] = useState({});
  const [cartSlugs, setCartSlugs] = useState([]);
  const [mountedAt, setMountedAt] = useState(() => Date.now());

  const [catalogCategoryFilters, setCatalogCategoryFilters] = useState([]);
  const [catalogStatusFilters, setCatalogStatusFilters] = useState([]);
  const [catalogPrimarySort, setCatalogPrimarySort] = useState('price-asc');
  const [catalogSecondarySort, setCatalogSecondarySort] = useState('name-asc');

  const [themeId, setThemeId] = useState(EDITOR_DEFAULT_ID);
  const [fontId, setFontId] = useState('jetstream-mono');
  const [backgroundId, setBackgroundId] = useState(EDITOR_DEFAULT_ID);
  const [effectId, setEffectId] = useState(EDITOR_DEFAULT_ID);
  const [editorSurface, setEditorSurface] = useState('tdEditor');

  const [tdMapPackId, setTdMapPackId] = useState(TD_HOMEPAGE_DEFAULT_ID);
  const [tdBackgroundPackId, setTdBackgroundPackId] = useState(TD_HOMEPAGE_DEFAULT_ID);
  const [towerPackId, setTowerPackId] = useState(TD_HOMEPAGE_DEFAULT_ID);
  const [enemyPackId, setEnemyPackId] = useState('default');
  const [lightningInternalMode, setLightningInternalMode] = useState('edge-sweep');
  const [lightningLinkMode, setLightningLinkMode] = useState('off');
  const [pathGradientMode, setPathGradientMode] = useState(TD_HOMEPAGE_DEFAULT_ID);
  const [tdAttackFxMode, setTdAttackFxMode] = useState('none');
  const [tdPreviewKind, setTdPreviewKind] = useState(TD_PREVIEW_KIND.COSMETIC);
  const [tdGameplayDemoMode, setTdGameplayDemoMode] = useState(TD_GAMEPLAY_DEMO_MODE.BASELINE);
  const [tdSpecialSolo, setTdSpecialSolo] = useState(false);
  const [tdDeployableSolo, setTdDeployableSolo] = useState(false);
  const [damageTextPackId, setDamageTextPackId] = useState('default');
  const [deathFxPackId, setDeathFxPackId] = useState('default');
  const [tdTowerUnlockPackId, setTdTowerUnlockPackId] = useState(TD_TOWER_UNLOCK_PACKS[0].id);
  const [tdSpecialUpgradePackId, setTdSpecialUpgradePackId] = useState(
    TD_SPECIAL_UPGRADE_PACKS[0].id
  );
  const [tdDeployablePackId, setTdDeployablePackId] = useState(TD_DEPLOYABLE_PACKS[0].id);

  const [profileBackgroundPackId, setProfileBackgroundPackId] = useState(
    PROFILE_DEFAULT_BACKGROUND_PACK.id
  );
  const [profileCardPackId, setProfileCardPackId] = useState(PROFILE_DEFAULT_CALLING_CARD_PACK.id);
  const [profileBadgePackId, setProfileBadgePackId] = useState(PROFILE_DEFAULT_BADGE_PACK.id);

  const { quickslots, setQuickslots } = useStoreQuickslots(user?.id);
  const currentUserLevel = useMemo(
    () => Number(user?.progress?.level ?? user?.level ?? 1),
    [user?.level, user?.progress?.level]
  );

  const resetTdCosmeticDefaults = useCallback(() => {
    setTdPreviewKind(TD_PREVIEW_KIND.COSMETIC);
    setTdMapPackId(TD_HOMEPAGE_DEFAULT_ID);
    setTdBackgroundPackId(TD_HOMEPAGE_DEFAULT_ID);
    setTowerPackId(TD_HOMEPAGE_DEFAULT_ID);
    setEnemyPackId('default');
    setDamageTextPackId('default');
    setDeathFxPackId('default');
    setPathGradientMode(TD_HOMEPAGE_DEFAULT_ID);
    setTdAttackFxMode('none');
    setLightningInternalMode('edge-sweep');
    setLightningLinkMode('off');
    setMountedAt(Date.now());
  }, []);

  const resetTdGameplayDefaults = useCallback(() => {
    setTdPreviewKind(TD_PREVIEW_KIND.GAMEPLAY);
    setTdTowerUnlockPackId(getDefaultPackId(TD_TOWER_UNLOCK_PACKS));
    setTdSpecialUpgradePackId(getDefaultPackId(TD_SPECIAL_UPGRADE_PACKS));
    setTdDeployablePackId(getDefaultPackId(TD_DEPLOYABLE_PACKS));
    setTdGameplayDemoMode(TD_GAMEPLAY_DEMO_MODE.BASELINE);
    setTdSpecialSolo(false);
    setTdDeployableSolo(false);
    setMountedAt(Date.now());
  }, []);

  const {
    effectiveCatalogItems,
    effectiveItemBySlug,
    cartItems,
    catalogCategories,
    filteredCatalogItems,
    cartTotal,
  } = useStoreCatalog({
    items,
    currentUserLevel,
    inventoryItemIds,
    cartSlugs,
    catalogCategoryFilters,
    catalogStatusFilters,
    catalogPrimarySort,
    catalogSecondarySort,
    fallbackPacks: LOCAL_CATALOG_FALLBACK_PACKS,
  });

  const getPackOwnership = useCallback(
    (pack) => {
      const isExplicitFree = Boolean(pack?.free);
      const fallbackPrice = Number(pack?.priceDataPackets ?? 0);

      if (!pack?.storeSlug) {
        const shouldTreatAsFree = isExplicitFree || fallbackPrice <= 0;
        return {
          owned: shouldTreatAsFree,
          free: shouldTreatAsFree,
          unavailable: false,
          storeItem: null,
          price: fallbackPrice,
          lockedByLevel: false,
        };
      }

      const legacySlugs = Array.isArray(pack?.legacyStoreSlugs)
        ? pack.legacyStoreSlugs.filter((slug) => typeof slug === 'string')
        : [];
      const candidateItems = [pack.storeSlug, ...legacySlugs]
        .map((slug) => effectiveItemBySlug.get(slug))
        .filter(Boolean);
      const canonicalStoreItem = effectiveItemBySlug.get(pack.storeSlug) || null;
      const ownedStoreItem =
        candidateItems.find(
          (item) => !item._localFallback && (Boolean(item.owned) || inventoryItemIds.has(item.id))
        ) || null;
      const storeItem = ownedStoreItem || canonicalStoreItem || candidateItems[0] || null;
      const owned = Boolean(ownedStoreItem);
      // Fall back to pack's own priceDataPackets when store API is unavailable
      const price = Number(
        canonicalStoreItem?.dynamicPrice ??
          canonicalStoreItem?.priceDataPackets ??
          storeItem?.dynamicPrice ??
          storeItem?.priceDataPackets ??
          pack?.priceDataPackets ??
          0
      );

      return {
        owned,
        free: false,
        unavailable: !storeItem,
        storeItem,
        price,
        lockedByLevel: Boolean(canonicalStoreItem?.lockedByLevel ?? storeItem?.lockedByLevel),
      };
    },
    [effectiveItemBySlug, inventoryItemIds]
  );

  const getSelectablePacks = useCallback(
    (packs) =>
      packs.filter((pack) => {
        const status = getPackOwnership(pack);
        if (status.free || pack?.defaultUnlocked) return true;
        if (status.owned) return true;
        if (status.storeItem) return true;
        return Boolean(pack?.storeSlug);
      }),
    [getPackOwnership]
  );

  const resolveSelectablePackId = useCallback(
    (packs, currentId) => {
      const selectablePacks = getSelectablePacks(packs);
      if (selectablePacks.length === 0) return packs[0]?.id ?? currentId;
      if (selectablePacks.some((pack) => pack.id === currentId)) return currentId;
      const preferredDefault = selectablePacks.find((pack) => pack?.defaultUnlocked || pack?.free);
      return preferredDefault?.id ?? selectablePacks[0].id;
    },
    [getSelectablePacks]
  );

  const themePack = useMemo(
    () => (themeId === EDITOR_DEFAULT_ID ? null : getPackById(EDITOR_THEME_PACKS, themeId)),
    [themeId]
  );
  const fontPack = useMemo(
    () => (fontId === EDITOR_DEFAULT_ID ? null : getPackById(OPEN_SOURCE_FONT_PACKS, fontId)),
    [fontId]
  );
  const backgroundPack = useMemo(
    () =>
      backgroundId === EDITOR_DEFAULT_ID
        ? null
        : getPackById(EDITOR_BACKGROUND_PACKS, backgroundId),
    [backgroundId]
  );
  const effectPack = useMemo(
    () => (effectId === EDITOR_DEFAULT_ID ? null : getPackById(EDITOR_EFFECT_PACKS, effectId)),
    [effectId]
  );

  const selectedThemeOption = useMemo(
    () => getPackById(EDITOR_THEME_PACK_OPTIONS, themeId),
    [themeId]
  );
  const selectedFontOption = useMemo(() => getPackById(EDITOR_FONT_PACK_OPTIONS, fontId), [fontId]);
  const selectedBackgroundOption = useMemo(
    () => getPackById(EDITOR_BACKGROUND_PACK_OPTIONS, backgroundId),
    [backgroundId]
  );
  const selectedEffectOption = useMemo(
    () => getPackById(EDITOR_EFFECT_PACK_OPTIONS, effectId),
    [effectId]
  );

  const tdMapPack = useMemo(
    () =>
      tdMapPackId === TD_HOMEPAGE_DEFAULT_ID
        ? RETRO_DESKTOP_MAP_PACK
        : getPackById(TD_MAP_PACKS, tdMapPackId),
    [tdMapPackId]
  );
  const tdBackgroundPack = useMemo(
    () =>
      tdBackgroundPackId === TD_HOMEPAGE_DEFAULT_ID
        ? RETRO_DESKTOP_BACKGROUND_PACK
        : getPackById(TD_BACKGROUND_PACKS, tdBackgroundPackId),
    [tdBackgroundPackId]
  );
  const towerPack = useMemo(
    () =>
      towerPackId === TD_HOMEPAGE_DEFAULT_ID
        ? RETRO_DESKTOP_TOWER_PACK
        : getPackById(TOWER_PACKS, towerPackId),
    [towerPackId]
  );
  const enemyPack = useMemo(
    () =>
      enemyPackId === 'default' ? RETRO_DESKTOP_ENEMY_PACK : getPackById(ENEMY_PACKS, enemyPackId),
    [enemyPackId]
  );
  const damageTextPack = useMemo(
    () =>
      damageTextPackId === 'default'
        ? RETRO_DESKTOP_DAMAGE_TEXT_PACK
        : getPackById(TD_DAMAGE_TEXT_PACKS, damageTextPackId),
    [damageTextPackId]
  );
  const deathFxPack = useMemo(
    () =>
      deathFxPackId === 'default'
        ? RETRO_DESKTOP_DEATH_FX_PACK
        : getPackById(TD_DEATH_FX_PACKS, deathFxPackId),
    [deathFxPackId]
  );
  const resolvedPathGradientMode = useMemo(
    () =>
      pathGradientMode === TD_HOMEPAGE_DEFAULT_ID
        ? RETRO_DESKTOP_SHELL_COSMETICS.pathGradientMode
        : pathGradientMode,
    [pathGradientMode]
  );
  const resolvedTdAttackFxMode = useMemo(
    () =>
      tdAttackFxMode === 'none' ? RETRO_DESKTOP_SHELL_COSMETICS.tdAttackFxMode : tdAttackFxMode,
    [tdAttackFxMode]
  );
  const selectedTdMapOption = useMemo(
    () => getPackById(TD_MAP_PACK_OPTIONS, tdMapPackId),
    [tdMapPackId]
  );
  const selectedTdBackgroundOption = useMemo(
    () => getPackById(TD_BACKGROUND_PACK_OPTIONS, tdBackgroundPackId),
    [tdBackgroundPackId]
  );
  const selectedTowerOption = useMemo(
    () => getPackById(TD_TOWER_PACK_OPTIONS, towerPackId),
    [towerPackId]
  );
  const tdTowerUnlockPack = useMemo(
    () => getPackById(TD_TOWER_UNLOCK_PACKS, tdTowerUnlockPackId),
    [tdTowerUnlockPackId]
  );
  const tdSpecialUpgradePack = useMemo(
    () => getPackById(TD_SPECIAL_UPGRADE_PACKS, tdSpecialUpgradePackId),
    [tdSpecialUpgradePackId]
  );
  const tdDeployablePack = useMemo(
    () => getPackById(TD_DEPLOYABLE_PACKS, tdDeployablePackId),
    [tdDeployablePackId]
  );
  const tdSpecialInfo = useMemo(
    () => getSpecialUpgradeInfo(tdSpecialUpgradePack, TD_TOWER_TYPES),
    [tdSpecialUpgradePack]
  );
  const tdDeployableInfo = useMemo(
    () => getDeployableInfo(tdDeployablePack, DEPLOYABLE_TYPES),
    [tdDeployablePack]
  );

  const isSpecialActive = tdGameplayDemoMode !== TD_GAMEPLAY_DEMO_MODE.BASELINE;

  const selectedSpecialTier = useMemo(() => {
    if (!tdSpecialUpgradePack?.storeSlug) return 1;
    return String(tdSpecialUpgradePack.storeSlug).includes('special2') ? 2 : 1;
  }, [tdSpecialUpgradePack]);

  const handleSpecialToggle = useCallback(() => {
    if (isSpecialActive) {
      setTdGameplayDemoMode(TD_GAMEPLAY_DEMO_MODE.BASELINE);
    } else {
      setTdGameplayDemoMode(
        selectedSpecialTier === 2
          ? TD_GAMEPLAY_DEMO_MODE.SPECIAL_2
          : TD_GAMEPLAY_DEMO_MODE.SPECIAL_1
      );
    }
  }, [isSpecialActive, selectedSpecialTier]);

  const handleDeployableAddToMap = useCallback(() => {
    const engine = gameCanvasRef.current?._gameLogicRef?.current;
    if (!engine) return;
    const deployableKey = getDeployableKeyFromPack(tdDeployablePack);
    const previewPos = DEPLOYABLE_PREVIEW_POSITIONS[deployableKey];
    if (!previewPos) return;
    engine.placeDeployable(deployableKey, previewPos);
  }, [tdDeployablePack]);

  const profileBackgroundPack = useMemo(
    () => getPackById(PROFILE_BACKGROUND_PACKS, profileBackgroundPackId),
    [profileBackgroundPackId]
  );
  const profileCallingCardPack = useMemo(
    () => getPackById(PROFILE_CALLING_CARD_PACKS, profileCardPackId),
    [profileCardPackId]
  );
  const profileBadgePack = useMemo(
    () => getPackById(PROFILE_BADGE_PACKS, profileBadgePackId),
    [profileBadgePackId]
  );

  const selectedProfileBackgroundOption = useMemo(
    () => getPackById(PROFILE_BACKGROUND_PACKS, profileBackgroundPackId),
    [profileBackgroundPackId]
  );
  const selectedProfileCardOption = useMemo(
    () => getPackById(PROFILE_CALLING_CARD_PACKS, profileCardPackId),
    [profileCardPackId]
  );
  const selectedProfileBadgeOption = useMemo(
    () => getPackById(PROFILE_BADGE_PACKS, profileBadgePackId),
    [profileBadgePackId]
  );

  const tdBoardTheme = useMemo(() => {
    if (!tdBackgroundPack && !tdMapPack) return null;
    return {
      ...(tdBackgroundPack || {}),
      ...(tdMapPack || {}),
    };
  }, [tdBackgroundPack, tdMapPack]);

  const densePathNodes = useMemo(() => expandPathNodes(TD_PATH_NODES), []);
  const tdGeneratedMap = useMemo(() => {
    const rows = 10;
    const cols = 20;
    const map = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    densePathNodes.forEach(([row, col]) => {
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        map[row][col] = 1;
      }
    });
    return {
      rows,
      cols,
      map,
      pathNodes: densePathNodes,
    };
  }, [densePathNodes]);

  const tdGameplayPreviewTowers = useMemo(() => getMainCodePreviewTowers(), []);
  const tdGameplayAvailableTowerTypes = useMemo(
    () => tdGameplayPreviewTowers.map((tower) => tower.type),
    [tdGameplayPreviewTowers]
  );

  const editorThemeOverrides = useMemo(
    () => ({
      editorColors: {
        background: '#00000000',
        lineHighlight: '#ffffff10',
      },
      monacoColors: {
        'editorGutter.background': '#00000000',
      },
    }),
    []
  );

  const monacoOptions = useMemo(() => {
    const base = buildMonacoOptionsFromFont(fontPack);
    return {
      ...base,
      cursorSmoothCaretAnimation: effectPack?.cursorGlow ?? false,
      renderLineHighlightOnlyWhenFocus: !(effectPack?.linePulse ?? false),
      readOnly: true,
    };
  }, [effectPack?.cursorGlow, effectPack?.linePulse, fontPack]);

  const applyEquippedSelections = useCallback(
    (equipped) => {
      if (!equipped || typeof equipped !== 'object') return;
      const equippedValues = Object.values(equipped).filter(Boolean);
      if (equippedValues.length === 0) return;

      const findEquipped = (packs, fallback) => {
        const found = equippedValues.find((item) =>
          Boolean(findPackByStoreSlug(packs, item?.slug, null))
        );
        if (!found?.slug) return fallback;
        const resolvedPack = findPackByStoreSlug(packs, found.slug, null);
        return resolvedPack?.id ?? fallback;
      };

      setThemeId(findEquipped(EDITOR_THEME_PACKS, EDITOR_DEFAULT_ID));
      setFontId(findEquipped(OPEN_SOURCE_FONT_PACKS, EDITOR_DEFAULT_ID));
      setBackgroundId(findEquipped(EDITOR_BACKGROUND_PACKS, EDITOR_DEFAULT_ID));
      setEffectId(findEquipped(EDITOR_EFFECT_PACKS, EDITOR_DEFAULT_ID));

      setTdMapPackId(findEquipped(TD_MAP_PACKS, tdMapPackId));
      setTdBackgroundPackId(findEquipped(TD_BACKGROUND_PACKS, tdBackgroundPackId));
      setTowerPackId(findEquipped(TOWER_PACKS, towerPackId));
      setEnemyPackId(findEquipped(ENEMY_PACKS, enemyPackId));
      setDamageTextPackId(findEquipped(TD_DAMAGE_TEXT_PACKS, damageTextPackId));
      setDeathFxPackId(findEquipped(TD_DEATH_FX_PACKS, deathFxPackId));
      setPathGradientMode(findEquipped(TD_PATH_GRADIENT_PACKS, pathGradientMode));
      setTdAttackFxMode(findEquipped(TD_ATTACK_FX_PACKS, tdAttackFxMode));
      setTdTowerUnlockPackId(findEquipped(TD_TOWER_UNLOCK_PACKS, tdTowerUnlockPackId));
      setTdSpecialUpgradePackId(findEquipped(TD_SPECIAL_UPGRADE_PACKS, tdSpecialUpgradePackId));
      setTdDeployablePackId(findEquipped(TD_DEPLOYABLE_PACKS, tdDeployablePackId));

      setProfileBackgroundPackId(findEquipped(PROFILE_BACKGROUND_PACKS, profileBackgroundPackId));
      setProfileCardPackId(findEquipped(PROFILE_CALLING_CARD_PACKS, profileCardPackId));
      setProfileBadgePackId(findEquipped(PROFILE_BADGE_PACKS, profileBadgePackId));
    },
    [
      damageTextPackId,
      deathFxPackId,
      enemyPackId,
      pathGradientMode,
      profileBackgroundPackId,
      profileBadgePackId,
      profileCardPackId,
      tdAttackFxMode,
      tdDeployablePackId,
      tdBackgroundPackId,
      tdMapPackId,
      tdSpecialUpgradePackId,
      tdTowerUnlockPackId,
      towerPackId,
    ]
  );

  const loadStoreData = useCallback(async () => {
    setLoading(true);

    const [walletResult, itemsResult, inventoryResult, equippedResult] = await Promise.allSettled([
      api.store.getWallet(),
      api.store.getItems(),
      api.store.getInventory(),
      api.store.getEquipped(),
    ]);

    if (walletResult.status === 'fulfilled') {
      setWalletBalance(Number(walletResult.value?.balance ?? 0));
    } else {
      setWalletBalance(null);
    }

    if (itemsResult.status === 'fulfilled') {
      setItems(Array.isArray(itemsResult.value?.items) ? itemsResult.value.items : []);
    } else {
      setItems([]);
      toast({
        title: 'Store items unavailable',
        description: 'Store catalog could not be loaded right now.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
        position: 'top',
      });
    }

    if (inventoryResult.status === 'fulfilled') {
      const inventory = Array.isArray(inventoryResult.value?.inventory)
        ? inventoryResult.value.inventory
        : [];
      setInventoryItemIds(new Set(inventory.map((entry) => entry?.itemId).filter(Boolean)));
    } else {
      setInventoryItemIds(new Set());
    }

    if (equippedResult.status === 'fulfilled') {
      setEquippedBySlot(
        equippedResult.value?.equipped && typeof equippedResult.value.equipped === 'object'
          ? equippedResult.value.equipped
          : {}
      );
      applyEquippedSelections(equippedResult.value?.equipped);
    } else {
      setEquippedBySlot({});
    }

    setLoading(false);
  }, [applyEquippedSelections, toast]);

  useEffect(() => {
    if (didInitialStoreLoadRef.current) return;
    didInitialStoreLoadRef.current = true;
    loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    setThemeId((prev) => resolveSelectablePackId(EDITOR_THEME_PACK_OPTIONS, prev));
    setFontId((prev) => resolveSelectablePackId(EDITOR_FONT_PACK_OPTIONS, prev));
    setBackgroundId((prev) => resolveSelectablePackId(EDITOR_BACKGROUND_PACK_OPTIONS, prev));
    setEffectId((prev) => resolveSelectablePackId(EDITOR_EFFECT_PACK_OPTIONS, prev));

    setTdMapPackId((prev) => resolveSelectablePackId(TD_MAP_PACK_OPTIONS, prev));
    setTdBackgroundPackId((prev) => resolveSelectablePackId(TD_BACKGROUND_PACK_OPTIONS, prev));
    setTowerPackId((prev) => resolveSelectablePackId(TD_TOWER_PACK_OPTIONS, prev));
    setEnemyPackId((prev) => resolveSelectablePackId(ENEMY_PACKS, prev));
    setDamageTextPackId((prev) => resolveSelectablePackId(TD_DAMAGE_TEXT_PACKS, prev));
    setDeathFxPackId((prev) => resolveSelectablePackId(TD_DEATH_FX_PACKS, prev));
    setPathGradientMode((prev) => resolveSelectablePackId(TD_PATH_GRADIENT_PACKS, prev));
    setTdAttackFxMode((prev) => resolveSelectablePackId(TD_ATTACK_FX_PACKS, prev));
    setTdTowerUnlockPackId((prev) => resolveSelectablePackId(TD_TOWER_UNLOCK_PACKS, prev));
    setTdSpecialUpgradePackId((prev) => resolveSelectablePackId(TD_SPECIAL_UPGRADE_PACKS, prev));
    setTdDeployablePackId((prev) => resolveSelectablePackId(TD_DEPLOYABLE_PACKS, prev));

    setProfileBackgroundPackId((prev) => resolveSelectablePackId(PROFILE_BACKGROUND_PACKS, prev));
    setProfileCardPackId((prev) => resolveSelectablePackId(PROFILE_CALLING_CARD_PACKS, prev));
    setProfileBadgePackId((prev) => resolveSelectablePackId(PROFILE_BADGE_PACKS, prev));
  }, [resolveSelectablePackId]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_STYLESHEET_URL;
    link.setAttribute('data-cg-store-fonts', 'true');
    document.head.appendChild(link);

    return () => {
      const existing = document.querySelector('link[data-cg-store-fonts="true"]');
      if (existing?.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, []);

  useEffect(() => {
    if (!monacoInstance) return;
    if (themePack) {
      ensureMonacoTheme(monacoInstance, themePack, editorThemeOverrides);
      monacoInstance.editor.setTheme(getMonacoThemeName(themePack.id));
    } else {
      registerSurfaceThemeForStore(monacoInstance, editorSurface);
      monacoInstance.editor.setTheme(EDITOR_SURFACE_CONFIGS[editorSurface].storeThemeName);
    }
  }, [editorSurface, editorThemeOverrides, monacoInstance, themePack]);

  useEffect(() => {
    const editor = previewEditorRef.current;
    if (!editor || !monacoInstance) return;

    const clearDecorations = () => {
      rainbowDecorationIdsRef.current = editor.deltaDecorations(
        rainbowDecorationIdsRef.current,
        []
      );
    };

    if (!themePack || !RAINBOW_ROTATING_THEME_IDS.has(themePack.id)) {
      clearDecorations();
      return;
    }

    ensureRainbowCharStyleSheet();
    const model = editor.getModel();
    if (!model) {
      clearDecorations();
      return;
    }

    const rainbowDecorations = [];
    let charIndex = 0;
    const tokenizedLines = monacoInstance.editor.tokenize(model.getValue(), model.getLanguageId());

    for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber += 1) {
      const line = model.getLineContent(lineNumber);
      const lineTokens = tokenizedLines?.[lineNumber - 1] || [];

      for (let tokenIndex = 0; tokenIndex < lineTokens.length; tokenIndex += 1) {
        const token = lineTokens[tokenIndex];
        const tokenType = token?.type || '';
        if (!isAnimatedKeywordToken(tokenType)) continue;

        const startOffset = token.offset;
        const endOffset =
          tokenIndex + 1 < lineTokens.length ? lineTokens[tokenIndex + 1].offset : line.length;

        for (let offset = startOffset; offset < endOffset; offset += 1) {
          const char = line[offset];
          if (!char || /\s/.test(char)) continue;

          const delayClass = `cg-rainbow-delay-${charIndex % RAINBOW_CHAR_DELAY_STEPS}`;
          rainbowDecorations.push({
            range: new monacoInstance.Range(lineNumber, offset + 1, lineNumber, offset + 2),
            options: {
              inlineClassName: `cg-rainbow-char cg-rainbow-theme-${themePack.id} ${delayClass}`,
            },
          });
          charIndex += 1;
        }
      }
    }

    rainbowDecorationIdsRef.current = editor.deltaDecorations(
      rainbowDecorationIdsRef.current,
      rainbowDecorations
    );

    return () => {
      clearDecorations();
    };
  }, [monacoInstance, themePack]);

  useEffect(() => {
    if (activeSectionId !== 'td' && activeSectionId !== 'combo') {
      return undefined;
    }

    const previewDifficulties = ['normal', 'hard', 'nightmare'];
    const gameplayPreviewTowers = tdGameplayPreviewTowers;

    const gameplayPlacedByKey = new Map();

    const applyGameplaySpecialLevels = () => {
      const engine = gameCanvasRef.current?._gameLogicRef?.current;
      if (!engine?.towers?.length) return;

      const demoLevel = getSpecialLevelForDemo(tdGameplayDemoMode);
      const focusTowerKey = getSpecialTowerKeyFromPack(tdSpecialUpgradePack);

      engine.towers.forEach((tower) => {
        tower.specialUpgradeLevel = 0;
      });

      if (!focusTowerKey || demoLevel <= 0) return;

      const focusState = gameplayPreviewTowers.find((tower) => tower.key === focusTowerKey);
      if (!focusState) return;

      const placedPos = gameplayPlacedByKey.get(focusTowerKey);
      const focusTower = engine.towers.find((tower) => {
        if (tower.type !== focusState.type) return false;
        if (!placedPos) return true;
        return tower.position?.row === placedPos.row && tower.position?.col === placedPos.col;
      });
      if (!focusTower) return;

      const maxSpecial = focusTower.specialUpgradeCosts?.length || 0;
      focusTower.specialUpgradeLevel = Math.min(demoLevel, maxSpecial);
    };

    const placePreviewTowers = () => {
      if (!gameCanvasRef.current) return;
      TD_PREVIEW_TOWER_POSITIONS.forEach((tower) => {
        gameCanvasRef.current.placeTower?.(tower.type, tower.row, tower.col);
      });
    };

    const placeGameplayPreviewTowers = () => {
      if (!gameCanvasRef.current) return;

      gameplayPlacedByKey.clear();

      const engine = gameCanvasRef.current?._gameLogicRef?.current;

      if (tdDeployableSolo) {
        // Deployable focus: empty map so deployable effect is uncluttered
        return;
      }

      let targetTowers = gameplayPreviewTowers;

      if (tdSpecialSolo) {
        const focusKey = getSpecialTowerKeyFromPack(tdSpecialUpgradePack);
        if (focusKey) {
          // Variable Special II aura needs neighbouring towers to show the buff effect
          const soloKeys =
            focusKey === 'VARIABLE' ? ['VARIABLE', ...VARIABLE_AURA_NEIGHBOR_KEYS] : [focusKey];
          targetTowers = gameplayPreviewTowers.filter((t) => soloKeys.includes(t.key));
        }
      }

      const failedPlacements = [];

      targetTowers.forEach((tower) => {
        const placed = gameCanvasRef.current.placeTower?.(tower.type, tower.row, tower.col);
        if (placed) {
          gameplayPlacedByKey.set(tower.key, { row: tower.row, col: tower.col });
        } else {
          failedPlacements.push(tower);
        }
      });

      if (!engine || failedPlacements.length === 0) return;

      const occupiedCells = new Set(
        (engine.towers || []).map((tower) => `${tower.position?.row},${tower.position?.col}`)
      );

      const findFallbackCell = () => {
        for (let row = 0; row < engine.gridRows; row += 1) {
          for (let col = 0; col < engine.gridCols; col += 1) {
            const key = `${row},${col}`;
            if (occupiedCells.has(key)) continue;
            if (!engine.isValidTowerPosition?.({ row, col })) continue;
            return { row, col };
          }
        }
        return null;
      };

      failedPlacements.forEach((tower) => {
        const fallback = findFallbackCell();
        if (!fallback) return;

        const placed = gameCanvasRef.current.placeTower?.(tower.type, fallback.row, fallback.col);
        if (!placed) return;

        occupiedCells.add(`${fallback.row},${fallback.col}`);
        gameplayPlacedByKey.set(tower.key, fallback);
      });
    };

    const setPreviewLevel = () => {
      const engine = gameCanvasRef.current?._gameLogicRef?.current;
      engine?.setPlayerLevel?.(18);
    };

    const bootPreviewRun = () => {
      if (!gameCanvasRef.current) return;
      gameCanvasRef.current.resetGame?.();
      setPreviewLevel();

      if (tdPreviewKind === TD_PREVIEW_KIND.GAMEPLAY) {
        placeGameplayPreviewTowers();
        applyGameplaySpecialLevels();
        previewDifficultyRef.current = 0;
        gameCanvasRef.current.startWave?.('normal');
        return;
      }

      placePreviewTowers();
      previewDifficultyRef.current = 0;
      gameCanvasRef.current.startWave?.(previewDifficulties[previewDifficultyRef.current]);
    };

    const tickPreview = () => {
      if (!gameCanvasRef.current) return;
      setPreviewLevel();

      const status = gameCanvasRef.current.gameStatus;
      if (status === 'level-complete' || status === 'game-over') {
        bootPreviewRun();
        return;
      }

      if (tdPreviewKind === TD_PREVIEW_KIND.GAMEPLAY) {
        if (status === 'ready' || status === 'wave-complete' || status === 'prehack') {
          gameCanvasRef.current.startWave?.('normal');
        }
        return;
      }

      if (status === 'ready' || status === 'wave-complete' || status === 'prehack') {
        previewDifficultyRef.current =
          (previewDifficultyRef.current + 1) % previewDifficulties.length;
        gameCanvasRef.current.startWave?.(previewDifficulties[previewDifficultyRef.current]);
      }
    };

    let disposed = false;
    let bootRetryTimer = null;

    const tryBootPreviewRun = () => {
      let attempts = 0;
      const maxAttempts = 20;

      const bootWhenReady = () => {
        if (disposed) return;

        if (gameCanvasRef.current) {
          bootPreviewRun();
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          bootRetryTimer = window.setTimeout(bootWhenReady, 100);
        }
      };

      bootWhenReady();
    };

    const initTimer = window.setTimeout(() => {
      if (!disposed) {
        tryBootPreviewRun();
      }
    }, 120);
    const interval = window.setInterval(tickPreview, 1200);

    return () => {
      disposed = true;
      window.clearTimeout(initTimer);
      if (bootRetryTimer) {
        window.clearTimeout(bootRetryTimer);
      }
      window.clearInterval(interval);
    };
  }, [
    activeSectionId,
    deathFxPack,
    damageTextPack,
    mountedAt,
    pathGradientMode,
    tdAttackFxMode,
    tdBoardTheme,
    tdDeployableSolo,
    tdGameplayDemoMode,
    tdGameplayPreviewTowers,
    tdPreviewKind,
    tdGeneratedMap,
    tdSpecialSolo,
    tdSpecialUpgradePack,
    towerPack,
  ]);

  const editorSelectionEntries = useMemo(
    () => [
      { pack: selectedThemeOption, packs: EDITOR_THEME_PACK_OPTIONS, slotOverride: 'editor.theme' },
      { pack: selectedFontOption, packs: EDITOR_FONT_PACK_OPTIONS, slotOverride: 'editor.font' },
      {
        pack: selectedBackgroundOption,
        packs: EDITOR_BACKGROUND_PACK_OPTIONS,
        slotOverride: 'editor.background',
      },
      {
        pack: selectedEffectOption,
        packs: EDITOR_EFFECT_PACK_OPTIONS,
        slotOverride: 'editor.effect',
      },
    ],
    [selectedBackgroundOption, selectedEffectOption, selectedFontOption, selectedThemeOption]
  );

  const tdCosmeticSelectionEntries = useMemo(
    () => [
      { pack: selectedTdMapOption, packs: TD_MAP_PACK_OPTIONS, slotOverride: 'td.mapPack' },
      {
        pack: selectedTdBackgroundOption,
        packs: TD_BACKGROUND_PACK_OPTIONS,
        slotOverride: 'td.backgroundPack',
      },
      { pack: selectedTowerOption, packs: TD_TOWER_PACK_OPTIONS, slotOverride: 'td.towerPack' },
      {
        pack: getPackById(ENEMY_PACKS, enemyPackId),
        packs: ENEMY_PACKS,
        slotOverride: 'td.enemyPack',
      },
      {
        pack: getPackById(TD_DAMAGE_TEXT_PACKS, damageTextPackId),
        packs: TD_DAMAGE_TEXT_PACKS,
        slotOverride: 'td.damageText',
      },
      {
        pack: getPackById(TD_DEATH_FX_PACKS, deathFxPackId),
        packs: TD_DEATH_FX_PACKS,
        slotOverride: 'td.deathFx',
      },
      {
        pack: getPackById(TD_PATH_GRADIENT_PACKS, pathGradientMode),
        packs: TD_PATH_GRADIENT_PACKS,
        slotOverride: 'td.pathGradient',
      },
      {
        pack: getPackById(TD_ATTACK_FX_PACKS, tdAttackFxMode),
        packs: TD_ATTACK_FX_PACKS,
        slotOverride: 'td.attackFx',
      },
    ],
    [
      damageTextPackId,
      deathFxPackId,
      enemyPackId,
      pathGradientMode,
      selectedTdBackgroundOption,
      selectedTdMapOption,
      selectedTowerOption,
      tdAttackFxMode,
    ]
  );

  const tdGameplaySelectionEntries = useMemo(
    () =>
      [
        { pack: tdTowerUnlockPack, packs: TD_TOWER_UNLOCK_PACKS },
        { pack: tdSpecialUpgradePack, packs: TD_SPECIAL_UPGRADE_PACKS },
        { pack: tdDeployablePack, packs: TD_DEPLOYABLE_PACKS },
      ].filter((entry) => Boolean(entry.pack)),
    [tdDeployablePack, tdSpecialUpgradePack, tdTowerUnlockPack]
  );

  const profileSelectionEntries = useMemo(
    () => [
      {
        pack: selectedProfileBackgroundOption,
        packs: PROFILE_BACKGROUND_PACKS,
        slotOverride: 'profile.background',
      },
      {
        pack: selectedProfileCardOption,
        packs: PROFILE_CALLING_CARD_PACKS,
        slotOverride: 'profile.callingCard',
      },
      {
        pack: selectedProfileBadgeOption,
        packs: PROFILE_BADGE_PACKS,
        slotOverride: 'profile.badge',
      },
    ],
    [selectedProfileBackgroundOption, selectedProfileBadgeOption, selectedProfileCardOption]
  );

  const getSelectionsForSection = useCallback(
    (sectionId = activeSectionId) => {
      if (sectionId === 'editor') return editorSelectionEntries;
      if (sectionId === 'td') {
        return tdPreviewKind === TD_PREVIEW_KIND.GAMEPLAY
          ? tdGameplaySelectionEntries
          : tdCosmeticSelectionEntries;
      }
      if (sectionId === 'profile') return profileSelectionEntries;
      return [
        ...editorSelectionEntries,
        ...tdCosmeticSelectionEntries,
        ...tdGameplaySelectionEntries,
        ...profileSelectionEntries,
      ];
    },
    [
      activeSectionId,
      editorSelectionEntries,
      profileSelectionEntries,
      tdCosmeticSelectionEntries,
      tdGameplaySelectionEntries,
      tdPreviewKind,
    ]
  );

  const getPacksForCurrentSection = useCallback(
    () =>
      getSelectionsForSection()
        .map((entry) => entry.pack)
        .filter(Boolean),
    [getSelectionsForSection]
  );

  const getSelectionEquipState = useCallback(
    ({ pack, packs = [], slotOverride = null }) => {
      const status = getPackOwnership(pack);
      const resolvedSlot =
        slotOverride ||
        pack?.storeSlot ||
        status?.storeItem?.slot ||
        packs.find((candidate) => candidate?.storeSlot)?.storeSlot ||
        null;
      const equippedSlug = resolvedSlot ? equippedBySlot?.[resolvedSlot]?.slug : null;
      const isDefaultEquipped = Boolean(
        pack?.defaultUnlocked && !pack?.storeSlug && resolvedSlot && !equippedSlug
      );
      const legacySlugs = Array.isArray(pack?.legacyStoreSlugs) ? pack.legacyStoreSlugs : [];
      const isSelectedEquipped = Boolean(
        pack?.storeSlug &&
        equippedSlug &&
        (pack.storeSlug === equippedSlug || legacySlugs.includes(equippedSlug))
      );

      return {
        pack,
        packs,
        slotOverride,
        status,
        resolvedSlot,
        isDefaultEquipped,
        isEquipped: isDefaultEquipped || isSelectedEquipped,
        shouldUnequipDefault: Boolean(pack?.defaultUnlocked && !pack?.storeSlug),
      };
    },
    [equippedBySlot, getPackOwnership]
  );

  const addPackToCart = useCallback(
    (pack) => {
      const { owned, storeItem, lockedByLevel } = getPackOwnership(pack);
      if (!storeItem || owned || lockedByLevel) {
        if (lockedByLevel) {
          toast({
            title: 'Item is level locked',
            description: `Reach level ${storeItem?.requiresLevel || pack?.requiresLevel || 1} to purchase this item.`,
            status: 'info',
            duration: 2500,
            isClosable: true,
            position: 'top',
          });
        }
        return;
      }
      setCartSlugs((prev) => (prev.includes(storeItem.slug) ? prev : [...prev, storeItem.slug]));
    },
    [getPackOwnership, toast]
  );

  const addAllNotOwnedInSectionToCart = useCallback(() => {
    const packs = getPacksForCurrentSection();
    const slugs = packs
      .map((pack) => getPackOwnership(pack))
      .filter((status) => status.storeItem && !status.owned && !status.lockedByLevel)
      .map((status) => status.storeItem.slug);

    if (slugs.length === 0) {
      toast({
        title: 'Everything in this view is already owned',
        status: 'info',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setCartSlugs((prev) => {
      const merged = new Set(prev);
      slugs.forEach((slug) => merged.add(slug));
      return Array.from(merged);
    });
  }, [getPackOwnership, getPacksForCurrentSection, toast]);

  const removeFromCart = useCallback((slug) => {
    setCartSlugs((prev) => prev.filter((value) => value !== slug));
  }, []);

  const toggleCatalogFilter = useCallback((setter, value) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((entry) => entry !== value) : [...prev, value]
    );
  }, []);

  const walletAfterCheckout = Number.isFinite(walletBalance) ? walletBalance - cartTotal : null;

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0 || checkoutBusy) return;

    setCheckoutBusy(true);
    const purchasedSlugs = [];
    const failed = [];

    for (let i = 0; i < cartItems.length; i += 1) {
      const item = cartItems[i];
      try {
        await api.store.purchase({ itemSlug: item.slug });
        purchasedSlugs.push(item.slug);
      } catch {
        failed.push(item.slug);
      }
    }

    setCartSlugs((prev) => prev.filter((slug) => !purchasedSlugs.includes(slug)));
    await loadStoreData();

    if (purchasedSlugs.length > 0) {
      toast({
        title: `Purchased ${purchasedSlugs.length} item${purchasedSlugs.length > 1 ? 's' : ''}`,
        status: 'success',
        duration: 3200,
        isClosable: true,
        position: 'top',
      });
    }

    if (failed.length > 0) {
      toast({
        title: 'Some purchases failed',
        description: `${failed.length} item${failed.length > 1 ? 's' : ''} could not be purchased.`,
        status: 'warning',
        duration: 4200,
        isClosable: true,
        position: 'top',
      });
    }

    setCheckoutBusy(false);
    if (failed.length === 0) {
      checkoutModal.onClose();
    }
  }, [cartItems, checkoutBusy, checkoutModal, loadStoreData, toast]);

  const runEquipMutation = useCallback(async (selectionState) => {
    if (selectionState.shouldUnequipDefault) {
      await api.store.unequip({ slot: selectionState.resolvedSlot });
      return;
    }

    await api.store.equip({
      slot: selectionState.resolvedSlot,
      itemId: selectionState.status.storeItem.id,
    });
  }, []);

  const handleEquipSelection = useCallback(
    async ({ pack, packs, slotOverride }) => {
      if (!pack || equipBusySlot || batchEquipBusy) return;

      const selectionState = getSelectionEquipState({ pack, packs, slotOverride });
      const { resolvedSlot, shouldUnequipDefault, status, isEquipped } = selectionState;

      if (!resolvedSlot) {
        toast({
          title: 'Equip slot unavailable',
          description: 'This cosmetic cannot be equipped yet.',
          status: 'warning',
          duration: 2200,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      if (isEquipped) {
        toast({
          title: 'Already equipped',
          status: 'info',
          duration: 1800,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      if (!shouldUnequipDefault && !status.owned) {
        toast({
          title: 'Purchase required',
          description: 'Buy this cosmetic before equipping it.',
          status: 'info',
          duration: 2200,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      setEquipBusySlot(resolvedSlot);
      try {
        await runEquipMutation(selectionState);
        await loadStoreData();

        toast({
          title: shouldUnequipDefault ? 'Default equipped' : 'Cosmetic equipped',
          status: 'success',
          duration: 2200,
          isClosable: true,
          position: 'top',
        });
      } catch {
        toast({
          title: 'Unable to equip right now',
          status: 'warning',
          duration: 2400,
          isClosable: true,
          position: 'top',
        });
      } finally {
        setEquipBusySlot(null);
      }
    },
    [batchEquipBusy, equipBusySlot, getSelectionEquipState, loadStoreData, runEquipMutation, toast]
  );

  const handleEquipAllInView = useCallback(async () => {
    if (equipBusySlot || batchEquipBusy) return;

    const pending = [];
    let alreadyEquippedCount = 0;
    let purchaseRequiredCount = 0;
    let unavailableCount = 0;
    const seenSlots = new Set();

    getSelectionsForSection().forEach((entry) => {
      const selectionState = getSelectionEquipState(entry);
      if (!selectionState.pack || !selectionState.resolvedSlot) {
        unavailableCount += 1;
        return;
      }

      if (seenSlots.has(selectionState.resolvedSlot)) {
        return;
      }
      seenSlots.add(selectionState.resolvedSlot);

      if (selectionState.isEquipped) {
        alreadyEquippedCount += 1;
        return;
      }

      if (!selectionState.shouldUnequipDefault && !selectionState.status.owned) {
        purchaseRequiredCount += 1;
        return;
      }

      if (!selectionState.shouldUnequipDefault && !selectionState.status.storeItem) {
        unavailableCount += 1;
        return;
      }

      pending.push(selectionState);
    });

    if (pending.length === 0) {
      toast({
        title:
          alreadyEquippedCount > 0 && purchaseRequiredCount === 0 && unavailableCount === 0
            ? 'Everything in this view is already equipped'
            : 'Nothing in this view can be equipped right now',
        description:
          purchaseRequiredCount > 0
            ? `${purchaseRequiredCount} item${purchaseRequiredCount === 1 ? '' : 's'} still need to be purchased.`
            : undefined,
        status: 'info',
        duration: 2600,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setBatchEquipBusy(true);
    let changedCount = 0;
    let failedCount = 0;

    try {
      for (let index = 0; index < pending.length; index += 1) {
        try {
          await runEquipMutation(pending[index]);
          changedCount += 1;
        } catch {
          failedCount += 1;
        }
      }

      await loadStoreData();

      const detailParts = [];
      if (alreadyEquippedCount > 0) {
        detailParts.push(`${alreadyEquippedCount} already equipped`);
      }
      if (purchaseRequiredCount > 0) {
        detailParts.push(`${purchaseRequiredCount} purchase required`);
      }
      if (failedCount > 0) {
        detailParts.push(`${failedCount} failed`);
      }

      toast({
        title: `Equipped ${changedCount} item${changedCount === 1 ? '' : 's'} in view`,
        description: detailParts.length > 0 ? detailParts.join(' • ') : undefined,
        status: failedCount > 0 ? 'warning' : 'success',
        duration: 3400,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setBatchEquipBusy(false);
    }
  }, [
    batchEquipBusy,
    equipBusySlot,
    getSelectionEquipState,
    getSelectionsForSection,
    loadStoreData,
    runEquipMutation,
    toast,
  ]);

  const buildQuickslotSummary = useCallback((sectionId, snapshot) => {
    if (!snapshot) return 'Empty slot';

    if (sectionId === 'editor') {
      return [
        getPackById(EDITOR_THEME_PACK_OPTIONS, snapshot.themeId)?.name,
        getPackById(EDITOR_FONT_PACK_OPTIONS, snapshot.fontId)?.name,
        getPackById(EDITOR_BACKGROUND_PACK_OPTIONS, snapshot.backgroundId)?.name,
        getPackById(EDITOR_EFFECT_PACK_OPTIONS, snapshot.effectId)?.name,
      ]
        .filter(Boolean)
        .join(' • ');
    }

    if (sectionId === 'td') {
      if (snapshot.tdPreviewKind === TD_PREVIEW_KIND.GAMEPLAY) {
        return [
          'Gameplay',
          getPackById(TD_TOWER_UNLOCK_PACKS, snapshot.tdTowerUnlockPackId)?.name,
          getPackById(TD_SPECIAL_UPGRADE_PACKS, snapshot.tdSpecialUpgradePackId)?.name,
          getPackById(TD_DEPLOYABLE_PACKS, snapshot.tdDeployablePackId)?.name,
        ]
          .filter(Boolean)
          .join(' • ');
      }

      return [
        'Cosmetic',
        getPackById(TD_MAP_PACK_OPTIONS, snapshot.tdMapPackId)?.name,
        getPackById(TD_TOWER_PACK_OPTIONS, snapshot.towerPackId)?.name,
        getPackById(TD_ATTACK_FX_PACKS, snapshot.tdAttackFxMode)?.name,
      ]
        .filter(Boolean)
        .join(' • ');
    }

    return [
      getPackById(PROFILE_BACKGROUND_PACKS, snapshot.profileBackgroundPackId)?.name,
      getPackById(PROFILE_CALLING_CARD_PACKS, snapshot.profileCardPackId)?.name,
      getPackById(PROFILE_BADGE_PACKS, snapshot.profileBadgePackId)?.name,
    ]
      .filter(Boolean)
      .join(' • ');
  }, []);

  const getQuickslotSnapshotForSection = useCallback(
    (sectionId) => {
      if (sectionId === 'editor') {
        return {
          themeId,
          fontId,
          backgroundId,
          effectId,
          editorSurface,
          savedAt: new Date().toISOString(),
        };
      }

      if (sectionId === 'td') {
        return {
          tdPreviewKind,
          tdMapPackId,
          tdBackgroundPackId,
          towerPackId,
          enemyPackId,
          lightningInternalMode,
          lightningLinkMode,
          pathGradientMode,
          tdAttackFxMode,
          tdGameplayDemoMode,
          tdSpecialSolo,
          tdDeployableSolo,
          damageTextPackId,
          deathFxPackId,
          tdTowerUnlockPackId,
          tdSpecialUpgradePackId,
          tdDeployablePackId,
          savedAt: new Date().toISOString(),
        };
      }

      return {
        profileBackgroundPackId,
        profileCardPackId,
        profileBadgePackId,
        savedAt: new Date().toISOString(),
      };
    },
    [
      backgroundId,
      damageTextPackId,
      deathFxPackId,
      editorSurface,
      effectId,
      enemyPackId,
      fontId,
      lightningInternalMode,
      lightningLinkMode,
      pathGradientMode,
      profileBackgroundPackId,
      profileBadgePackId,
      profileCardPackId,
      tdAttackFxMode,
      tdBackgroundPackId,
      tdDeployablePackId,
      tdDeployableSolo,
      tdGameplayDemoMode,
      tdMapPackId,
      tdPreviewKind,
      tdSpecialSolo,
      tdSpecialUpgradePackId,
      tdTowerUnlockPackId,
      themeId,
      towerPackId,
    ]
  );

  const applyQuickslotSnapshot = useCallback((sectionId, snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;

    if (sectionId === 'editor') {
      setThemeId(snapshot.themeId ?? EDITOR_DEFAULT_ID);
      setFontId(snapshot.fontId ?? getDefaultPackId(EDITOR_FONT_PACK_OPTIONS));
      setBackgroundId(snapshot.backgroundId ?? EDITOR_DEFAULT_ID);
      setEffectId(snapshot.effectId ?? EDITOR_DEFAULT_ID);
      setEditorSurface(snapshot.editorSurface ?? 'tdEditor');
      return;
    }

    if (sectionId === 'td') {
      setTdPreviewKind(snapshot.tdPreviewKind ?? TD_PREVIEW_KIND.COSMETIC);
      setTdMapPackId(snapshot.tdMapPackId ?? TD_HOMEPAGE_DEFAULT_ID);
      setTdBackgroundPackId(snapshot.tdBackgroundPackId ?? TD_HOMEPAGE_DEFAULT_ID);
      setTowerPackId(snapshot.towerPackId ?? TD_HOMEPAGE_DEFAULT_ID);
      setEnemyPackId(snapshot.enemyPackId ?? 'default');
      setLightningInternalMode(snapshot.lightningInternalMode ?? 'edge-sweep');
      setLightningLinkMode(snapshot.lightningLinkMode ?? 'off');
      setPathGradientMode(snapshot.pathGradientMode ?? TD_HOMEPAGE_DEFAULT_ID);
      setTdAttackFxMode(snapshot.tdAttackFxMode ?? 'none');
      setTdGameplayDemoMode(snapshot.tdGameplayDemoMode ?? TD_GAMEPLAY_DEMO_MODE.BASELINE);
      setTdSpecialSolo(Boolean(snapshot.tdSpecialSolo));
      setTdDeployableSolo(Boolean(snapshot.tdDeployableSolo));
      setDamageTextPackId(snapshot.damageTextPackId ?? 'default');
      setDeathFxPackId(snapshot.deathFxPackId ?? 'default');
      setTdTowerUnlockPackId(snapshot.tdTowerUnlockPackId ?? TD_TOWER_UNLOCK_PACKS[0].id);
      setTdSpecialUpgradePackId(snapshot.tdSpecialUpgradePackId ?? TD_SPECIAL_UPGRADE_PACKS[0].id);
      setTdDeployablePackId(snapshot.tdDeployablePackId ?? TD_DEPLOYABLE_PACKS[0].id);
      setMountedAt(Date.now());
      return;
    }

    setProfileBackgroundPackId(
      snapshot.profileBackgroundPackId ?? PROFILE_DEFAULT_BACKGROUND_PACK.id
    );
    setProfileCardPackId(snapshot.profileCardPackId ?? PROFILE_DEFAULT_CALLING_CARD_PACK.id);
    setProfileBadgePackId(snapshot.profileBadgePackId ?? PROFILE_DEFAULT_BADGE_PACK.id);
  }, []);

  const saveQuickslot = useCallback(
    (sectionId, index) => {
      const snapshot = getQuickslotSnapshotForSection(sectionId);
      setQuickslots((prev) => ({
        ...normalizeQuickslots(prev),
        [sectionId]: normalizeQuickslots(prev)[sectionId].map((entry, entryIndex) =>
          entryIndex === index ? snapshot : entry
        ),
      }));

      toast({
        title: `Saved ${sectionId.toUpperCase()} quickslot ${index + 1}`,
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top',
      });
    },
    [getQuickslotSnapshotForSection, setQuickslots, toast]
  );

  const loadQuickslot = useCallback(
    (sectionId, index) => {
      const snapshot = quickslots?.[sectionId]?.[index] ?? null;
      if (!snapshot) {
        toast({
          title: 'Quickslot is empty',
          status: 'info',
          duration: 1800,
          isClosable: true,
          position: 'top',
        });
        return;
      }

      applyQuickslotSnapshot(sectionId, snapshot);
      toast({
        title: `Loaded ${sectionId.toUpperCase()} quickslot ${index + 1}`,
        status: 'success',
        duration: 1800,
        isClosable: true,
        position: 'top',
      });
    },
    [applyQuickslotSnapshot, quickslots, toast]
  );

  const clearQuickslot = useCallback(
    (sectionId, index) => {
      setQuickslots((prev) => ({
        ...normalizeQuickslots(prev),
        [sectionId]: normalizeQuickslots(prev)[sectionId].map((entry, entryIndex) =>
          entryIndex === index ? null : entry
        ),
      }));

      toast({
        title: `Cleared ${sectionId.toUpperCase()} quickslot ${index + 1}`,
        status: 'info',
        duration: 1800,
        isClosable: true,
        position: 'top',
      });
    },
    [setQuickslots, toast]
  );

  return {
    activeSectionId,
    addAllNotOwnedInSectionToCart,
    addPackToCart,
    backgroundId,
    backgroundPack,
    batchEquipBusy,
    buildQuickslotSummary,
    cartItems,
    cartSlugs,
    cartTotal,
    catalogCategories,
    catalogCategoryFilters,
    catalogPrimarySort,
    catalogSecondarySort,
    catalogStatusFilters,
    checkoutBusy,
    checkoutModal,
    clearQuickslot,
    damageTextPack,
    damageTextPackId,
    deathFxPack,
    deathFxPackId,
    effectiveCatalogItems,
    editorSurface,
    editorThemeOverrides,
    effectId,
    effectPack,
    enemyPack,
    enemyPackId,
    equipBusySlot,
    filteredCatalogItems,
    fontId,
    gameCanvasRef,
    getPackOwnership,
    getSelectablePacks,
    getSelectionEquipState,
    handleCheckout,
    handleDeployableAddToMap,
    handleEquipAllInView,
    handleEquipSelection,
    handleSpecialToggle,
    inventoryItemIds,
    isSpecialActive,
    lightningInternalMode,
    lightningLinkMode,
    loadQuickslot,
    loadStoreData,
    loading,
    monacoOptions,
    pathGradientMode,
    previewEditorRef,
    profileBackgroundPack,
    profileBackgroundPackId,
    profileBadgePack,
    profileBadgePackId,
    profileCallingCardPack,
    profileCardPackId,
    quickslots,
    removeFromCart,
    resolvedPathGradientMode,
    resolvedTdAttackFxMode,
    resetTdCosmeticDefaults,
    resetTdGameplayDefaults,
    saveQuickslot,
    setActiveSectionId,
    setBackgroundId,
    setCartSlugs,
    setCatalogCategoryFilters,
    setCatalogPrimarySort,
    setCatalogSecondarySort,
    setCatalogStatusFilters,
    setDamageTextPackId,
    setDeathFxPackId,
    setEditorSurface,
    setEffectId,
    setEnemyPackId,
    setFontId,
    setLightningInternalMode,
    setLightningLinkMode,
    setMountedAt,
    setPathGradientMode,
    setProfileBackgroundPackId,
    setProfileBadgePackId,
    setProfileCardPackId,
    setTdAttackFxMode,
    setTdBackgroundPackId,
    setTdDeployablePackId,
    setTdDeployableSolo,
    setTdMapPackId,
    setTdPreviewKind,
    setTdSpecialSolo,
    setTdSpecialUpgradePackId,
    setTdTowerUnlockPackId,
    setThemeId,
    setTowerPackId,
    tdAttackFxMode,
    tdBackgroundPackId,
    tdBoardTheme,
    tdDeployableInfo,
    tdDeployablePack,
    tdDeployablePackId,
    tdDeployableSolo,
    tdGameplayAvailableTowerTypes,
    tdGameplayDemoMode,
    tdGeneratedMap,
    tdMapPackId,
    tdPreviewKind,
    tdSpecialInfo,
    tdSpecialSolo,
    tdSpecialUpgradePack,
    tdSpecialUpgradePackId,
    tdTowerUnlockPackId,
    themeId,
    themePack,
    toggleCatalogFilter,
    towerPack,
    towerPackId,
    walletAfterCheckout,
    walletBalance,
  };
};

export default useStorePageController;
