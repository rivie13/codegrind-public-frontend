import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
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
  TD_DEATH_FX_PACKS,
  TD_MAP_PACKS,
  TOWER_PACKS,
} from '../../data/cosmetics/quickCosmeticPacks';
import {
  RETRO_DESKTOP_DAMAGE_TEXT_PACK,
  RETRO_DESKTOP_DEATH_FX_PACK,
  RETRO_DESKTOP_ENEMY_PACK,
  RETRO_DESKTOP_MAP_THEME,
  RETRO_DESKTOP_SHELL_COSMETICS,
  RETRO_DESKTOP_TOWER_PACK,
} from '../../pages/games/towerDefenseV2/embeddedShellThemes';

const DEFAULT_PATH_GRADIENT_MODE = RETRO_DESKTOP_SHELL_COSMETICS.pathGradientMode;
const DEFAULT_ATTACK_FX_MODE = RETRO_DESKTOP_SHELL_COSMETICS.tdAttackFxMode;

const STORE_PACK_GROUPS = [
  EDITOR_THEME_PACKS,
  OPEN_SOURCE_FONT_PACKS,
  EDITOR_BACKGROUND_PACKS,
  EDITOR_EFFECT_PACKS,
  TD_MAP_PACKS,
  TD_BACKGROUND_PACKS,
  TOWER_PACKS,
  ENEMY_PACKS,
  TD_DAMAGE_TEXT_PACKS,
  TD_DEATH_FX_PACKS,
  PROFILE_BACKGROUND_PACKS,
  PROFILE_CALLING_CARD_PACKS,
  PROFILE_BADGE_PACKS,
];

const DEFAULT_UNLOCKED_STORE_SLUGS = new Set(
  STORE_PACK_GROUPS.flatMap((packs) =>
    packs
      .filter((pack) => pack?.defaultUnlocked && typeof pack?.storeSlug === 'string')
      .map((pack) => pack.storeSlug)
  )
);

const findPackByStoreSlug = (packs, slug) => {
  if (!slug) return null;
  return (
    packs.find(
      (pack) =>
        pack?.storeSlug === slug ||
        (Array.isArray(pack?.legacyStoreSlugs) && pack.legacyStoreSlugs.includes(slug))
    ) || null
  );
};

export default function useEquippedCosmetics() {
  const { isAuthenticated } = useAuth();
  const [equippedBySlot, setEquippedBySlot] = useState({});
  const [ownedSlugs, setOwnedSlugs] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setEquippedBySlot({});
      setOwnedSlugs([]);
      return;
    }

    setLoading(true);
    try {
      const [equippedPayload, inventoryPayload] = await Promise.all([
        api.store.getEquipped(),
        api.store.getInventory(),
      ]);

      setEquippedBySlot(
        equippedPayload?.equipped && typeof equippedPayload.equipped === 'object'
          ? equippedPayload.equipped
          : {}
      );

      const inventoryRows = Array.isArray(inventoryPayload?.inventory)
        ? inventoryPayload.inventory
        : [];
      setOwnedSlugs(
        inventoryRows.map((row) => row?.item?.slug).filter((slug) => typeof slug === 'string')
      );
    } catch {
      setEquippedBySlot({});
      setOwnedSlugs([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const resolved = useMemo(() => {
    const ownedSet = new Set(ownedSlugs);
    const isServerAllowedSlug = (slug) =>
      typeof slug === 'string' && (ownedSet.has(slug) || DEFAULT_UNLOCKED_STORE_SLUGS.has(slug));

    const slot = (name) => equippedBySlot?.[name]?.slug;
    const resolvePack = (packs, slotName) => {
      const slug = slot(slotName);
      if (!isServerAllowedSlug(slug)) return null;
      return findPackByStoreSlug(packs, slug);
    };

    const editorThemePack = resolvePack(EDITOR_THEME_PACKS, 'editor.theme');
    const editorFontPack = resolvePack(OPEN_SOURCE_FONT_PACKS, 'editor.font');
    const editorBackgroundPack = resolvePack(EDITOR_BACKGROUND_PACKS, 'editor.background');
    const editorEffectPack = resolvePack(EDITOR_EFFECT_PACKS, 'editor.effect');

    const tdMapPack = resolvePack(TD_MAP_PACKS, 'td.mapPack') || RETRO_DESKTOP_MAP_THEME;
    const tdBackgroundPack =
      resolvePack(TD_BACKGROUND_PACKS, 'td.backgroundPack') || RETRO_DESKTOP_MAP_THEME;
    const tdTowerPack = resolvePack(TOWER_PACKS, 'td.towerPack') || RETRO_DESKTOP_TOWER_PACK;
    const tdEnemyPack = resolvePack(ENEMY_PACKS, 'td.enemyPack') || RETRO_DESKTOP_ENEMY_PACK;
    const tdDamageTextPack =
      resolvePack(TD_DAMAGE_TEXT_PACKS, 'td.damageText') || RETRO_DESKTOP_DAMAGE_TEXT_PACK;
    const tdDeathFxPack =
      resolvePack(TD_DEATH_FX_PACKS, 'td.deathFx') || RETRO_DESKTOP_DEATH_FX_PACK;

    const tdPathGradientSlug = slot('td.pathGradient');
    const tdPathGradientMode = isServerAllowedSlug(tdPathGradientSlug)
      ? findPackByStoreSlug(
          [
            { id: 'amber-flow', storeSlug: 'td.fx.path-gradient.amber-flow.v1' },
            { id: 'plasma-ribbon', storeSlug: 'td.fx.path-gradient.plasma-ribbon.v1' },
            { id: 'neon-vein', storeSlug: 'td.fx.path-gradient.neon-vein.v1' },
            { id: 'flat', storeSlug: 'td.fx.path-gradient.flat.v1' },
          ],
          tdPathGradientSlug
        )?.id || DEFAULT_PATH_GRADIENT_MODE
      : DEFAULT_PATH_GRADIENT_MODE;

    const tdAttackFxSlug = slot('td.attackFx');
    const tdAttackFxMode = isServerAllowedSlug(tdAttackFxSlug)
      ? findPackByStoreSlug(
          [
            { id: 'pulse-rings', storeSlug: 'td.fx.attack.pulse-rings.v1' },
            { id: 'ember-sparks', storeSlug: 'td.fx.attack.ember-sparks.v1' },
            { id: 'ion-scan', storeSlug: 'td.fx.attack.ion-scan.v1' },
            { id: 'marker-burst', storeSlug: 'td.fx.attack.marker-burst.v1' },
            { id: 'data-stream', storeSlug: 'td.fx.attack.data-stream.v1' },
            { id: 'void-tendrils', storeSlug: 'td.fx.attack.void-tendrils.v1' },
          ],
          tdAttackFxSlug
        )?.id || DEFAULT_ATTACK_FX_MODE
      : DEFAULT_ATTACK_FX_MODE;

    const profileBackgroundPack =
      resolvePack(PROFILE_BACKGROUND_PACKS, 'profile.background') ||
      PROFILE_DEFAULT_BACKGROUND_PACK;
    const profileCallingCardPack =
      resolvePack(PROFILE_CALLING_CARD_PACKS, 'profile.callingCard') ||
      PROFILE_DEFAULT_CALLING_CARD_PACK;
    const profileBadgePack =
      resolvePack(PROFILE_BADGE_PACKS, 'profile.badge') || PROFILE_DEFAULT_BADGE_PACK;

    return {
      editorThemePack,
      editorFontPack,
      editorBackgroundPack,
      editorEffectPack,
      tdMapPack,
      tdBackgroundPack,
      tdTowerPack,
      tdEnemyPack,
      tdDamageTextPack,
      tdDeathFxPack,
      tdPathGradientMode,
      tdAttackFxMode,
      profileBackgroundPack,
      profileCallingCardPack,
      profileBadgePack,
    };
  }, [equippedBySlot, ownedSlugs]);

  return {
    loading,
    equippedBySlot,
    refresh,
    ...resolved,
  };
}
