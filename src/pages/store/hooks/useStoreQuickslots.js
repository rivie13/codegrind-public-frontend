import { useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage } from '../../../utils/web/storage';

export const STORE_QUICKSLOT_COUNT = 3;
export const STORE_QUICKSLOT_STORAGE_PREFIX = 'cg-store-quickslots';

export const createEmptyQuickslots = () => ({
  editor: Array.from({ length: STORE_QUICKSLOT_COUNT }, () => null),
  td: Array.from({ length: STORE_QUICKSLOT_COUNT }, () => null),
  profile: Array.from({ length: STORE_QUICKSLOT_COUNT }, () => null),
});

export const normalizeQuickslots = (value) => {
  const empty = createEmptyQuickslots();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return empty;
  }

  return {
    editor: Array.from(
      { length: STORE_QUICKSLOT_COUNT },
      (_, index) => value?.editor?.[index] ?? null
    ),
    td: Array.from({ length: STORE_QUICKSLOT_COUNT }, (_, index) => value?.td?.[index] ?? null),
    profile: Array.from(
      { length: STORE_QUICKSLOT_COUNT },
      (_, index) => value?.profile?.[index] ?? null
    ),
  };
};

export const buildQuickslotStorageKey = (userId) =>
  `${STORE_QUICKSLOT_STORAGE_PREFIX}:${userId || 'anonymous'}`;

const useStoreQuickslots = (userId) => {
  const quickslotStorageKey = useMemo(() => buildQuickslotStorageKey(userId), [userId]);
  const [quickslots, setQuickslots] = useState(() => createEmptyQuickslots());
  const [quickslotsLoaded, setQuickslotsLoaded] = useState(false);

  useEffect(() => {
    setQuickslotsLoaded(false);
    const raw = readStorage('localStorage', quickslotStorageKey);

    if (!raw) {
      setQuickslots(createEmptyQuickslots());
      setQuickslotsLoaded(true);
      return;
    }

    try {
      setQuickslots(normalizeQuickslots(JSON.parse(raw)));
    } catch {
      setQuickslots(createEmptyQuickslots());
    }

    setQuickslotsLoaded(true);
  }, [quickslotStorageKey]);

  useEffect(() => {
    if (!quickslotsLoaded) return;
    writeStorage('localStorage', quickslotStorageKey, JSON.stringify(quickslots));
  }, [quickslotStorageKey, quickslots, quickslotsLoaded]);

  return {
    quickslotStorageKey,
    quickslots,
    setQuickslots,
    quickslotsLoaded,
  };
};

export default useStoreQuickslots;
