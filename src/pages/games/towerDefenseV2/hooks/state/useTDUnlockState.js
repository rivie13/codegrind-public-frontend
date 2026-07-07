/**
 * useTDUnlockState
 *
 * Fetches the player's store inventory and exposes unlock check functions
 * for tower types, deployables, and special upgrade tiers.
 *
 * - Authenticated users: inventory fetched once on mount.
 * - Guests / demo: treated as owning nothing (level-only gates still apply).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../../../../services/api';
import {
  computeDeployableGates,
  computeTowerGates,
  evaluateDeployableGate,
  evaluateSpecialUpgradeGate,
  evaluateTowerGate,
} from '../../../../../utils/towerDefense/tdUnlockPolicy';

export default function useTDUnlockState({ playerLevel = 1, user = null, isDemo = false }) {
  const [ownedSlugs, setOwnedSlugs] = useState(() => new Set());

  useEffect(() => {
    if (!user || isDemo) {
      setOwnedSlugs(new Set());
      return;
    }

    let cancelled = false;

    api.store
      .getInventory()
      .then((data) => {
        if (cancelled) return;
        // Response shape: { inventory: [ { item: { slug: '...' } } ] }
        const items = Array.isArray(data?.inventory)
          ? data.inventory
          : Array.isArray(data)
            ? data
            : [];
        const slugs = new Set(
          items.map((entry) => entry?.item?.slug || entry?.itemSlug || entry?.slug).filter(Boolean)
        );
        setOwnedSlugs(slugs);
      })
      .catch(() => {
        // Silently fail — treat as no store unlocks
        if (!cancelled) setOwnedSlugs(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [user, isDemo]);

  const isTowerUnlocked = useCallback(
    (towerTypeOrKey) => !evaluateTowerGate(towerTypeOrKey, playerLevel, ownedSlugs).locked,
    [playerLevel, ownedSlugs]
  );

  const isDeployableUnlocked = useCallback(
    (deployableKey) => !evaluateDeployableGate(deployableKey, playerLevel, ownedSlugs).locked,
    [playerLevel, ownedSlugs]
  );

  const isSpecialUpgradeUnlocked = useCallback(
    (towerTypeOrKey, tier) =>
      !evaluateSpecialUpgradeGate(towerTypeOrKey, tier, playerLevel, ownedSlugs).locked,
    [playerLevel, ownedSlugs]
  );

  const getTowerLockInfo = useCallback(
    (towerTypeOrKey) => evaluateTowerGate(towerTypeOrKey, playerLevel, ownedSlugs),
    [playerLevel, ownedSlugs]
  );

  const getDeployableLockInfo = useCallback(
    (deployableKey) => evaluateDeployableGate(deployableKey, playerLevel, ownedSlugs),
    [playerLevel, ownedSlugs]
  );

  const getSpecialUpgradeLockInfo = useCallback(
    (towerTypeOrKey, tier) =>
      evaluateSpecialUpgradeGate(towerTypeOrKey, tier, playerLevel, ownedSlugs),
    [playerLevel, ownedSlugs]
  );

  const towerUnlockGates = useMemo(
    () => computeTowerGates(playerLevel, ownedSlugs),
    [playerLevel, ownedSlugs]
  );

  const deployableUnlockGates = useMemo(
    () => computeDeployableGates(playerLevel, ownedSlugs),
    [playerLevel, ownedSlugs]
  );

  return {
    ownedSlugs,
    isTowerUnlocked,
    isDeployableUnlocked,
    isSpecialUpgradeUnlocked,
    getTowerLockInfo,
    getDeployableLockInfo,
    getSpecialUpgradeLockInfo,
    towerUnlockGates,
    deployableUnlockGates,
  };
}
