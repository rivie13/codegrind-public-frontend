import { useMemo } from 'react';

const hasInventoryItem = (inventoryItemIds, itemId) => {
  if (!itemId || typeof inventoryItemIds?.has !== 'function') {
    return false;
  }
  return inventoryItemIds.has(itemId);
};

const SPLIT_TD_CATEGORIES = new Set(['td_map_pack', 'td_background_pack']);

const isLegacyTdBoardThemeItem = (item) => {
  if (!item || typeof item.slug !== 'string') {
    return false;
  }

  const category = item?.category || '';
  const slot = item?.metadata?.slot || '';
  if (category !== 'td_board_theme' && slot !== 'td.boardTheme') {
    return false;
  }

  return item.slug.startsWith('td.board.');
};

export const compareCatalogItemsByCriterion = (a, b, criterion) => {
  const aPrice = Number(a?.dynamicPrice ?? a?.priceDataPackets ?? 0);
  const bPrice = Number(b?.dynamicPrice ?? b?.priceDataPackets ?? 0);
  const aLevel = Number(a?.requiresLevel ?? 1);
  const bLevel = Number(b?.requiresLevel ?? 1);
  const aName = String(a?.displayName || a?.slug || '').toLowerCase();
  const bName = String(b?.displayName || b?.slug || '').toLowerCase();
  const aOwned = Boolean(a?._cgOwned);
  const bOwned = Boolean(b?._cgOwned);
  const aLocked = Boolean(a?._cgLevelLocked);
  const bLocked = Boolean(b?._cgLevelLocked);

  switch (criterion) {
    case 'name-asc':
      return aName.localeCompare(bName);
    case 'name-desc':
      return bName.localeCompare(aName);
    case 'price-asc':
      return aPrice - bPrice;
    case 'price-desc':
      return bPrice - aPrice;
    case 'level-asc':
      return aLevel - bLevel;
    case 'level-desc':
      return bLevel - aLevel;
    case 'owned-first':
      if (aOwned !== bOwned) return aOwned ? -1 : 1;
      return 0;
    case 'locked-first':
      if (aLocked !== bLocked) return aLocked ? -1 : 1;
      return 0;
    default:
      return 0;
  }
};

export const buildLocalCatalogItems = ({ packs = [], userLevel = 1 } = {}) => {
  const uniqueBySlug = new Map();

  packs.forEach((pack) => {
    if (!pack?.storeSlug || pack.free) return;
    if (uniqueBySlug.has(pack.storeSlug)) return;

    uniqueBySlug.set(pack.storeSlug, {
      id: `local-${pack.storeSlug}`,
      slug: pack.storeSlug,
      displayName: pack.name,
      category: pack.storeCategory || pack.category || 'cosmetic',
      requiresLevel: Number(pack.requiresLevel ?? 1),
      priceDataPackets: Number(pack.priceDataPackets ?? 0),
      dynamicPrice: Number(pack.priceDataPackets ?? 0),
      owned: false,
      lockedByLevel: Number(userLevel) < Number(pack.requiresLevel ?? 1),
      _localFallback: true,
    });
  });

  return Array.from(uniqueBySlug.values());
};

const useStoreCatalog = ({
  items,
  currentUserLevel,
  inventoryItemIds,
  cartSlugs,
  catalogCategoryFilters,
  catalogStatusFilters,
  catalogPrimarySort,
  catalogSecondarySort,
  fallbackPacks,
}) => {
  const effectiveCatalogItems = useMemo(() => {
    const sourceItems =
      Array.isArray(items) && items.length > 0
        ? items
        : buildLocalCatalogItems({ packs: fallbackPacks, userLevel: currentUserLevel });

    return sourceItems.map((item) => {
      const requiresLevel = Number(item?.requiresLevel ?? 1);
      const lockedByLevel = Boolean(item?.lockedByLevel) || currentUserLevel < requiresLevel;

      return {
        ...item,
        requiresLevel,
        lockedByLevel,
      };
    });
  }, [currentUserLevel, fallbackPacks, items]);

  const visibleCatalogItems = useMemo(() => {
    const hasSplitTdCategories = effectiveCatalogItems.some((item) =>
      SPLIT_TD_CATEGORIES.has(item?.category)
    );

    if (!hasSplitTdCategories) {
      return effectiveCatalogItems;
    }

    return effectiveCatalogItems.filter((item) => !isLegacyTdBoardThemeItem(item));
  }, [effectiveCatalogItems]);

  const effectiveItemBySlug = useMemo(() => {
    const map = new Map();
    effectiveCatalogItems.forEach((item) => {
      if (item?.slug) {
        map.set(item.slug, item);
      }
    });
    return map;
  }, [effectiveCatalogItems]);

  const cartItems = useMemo(() => {
    return cartSlugs
      .map((slug) => effectiveItemBySlug.get(slug))
      .filter(Boolean)
      .filter(
        (item) =>
          item._localFallback || (!item.owned && !hasInventoryItem(inventoryItemIds, item.id))
      );
  }, [cartSlugs, effectiveItemBySlug, inventoryItemIds]);

  const catalogCategories = useMemo(() => {
    return Array.from(
      new Set(visibleCatalogItems.map((item) => item?.category || 'misc').filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [visibleCatalogItems]);

  const filteredCatalogItems = useMemo(() => {
    const statusFilterSet = new Set(catalogStatusFilters);
    const categoryFilterSet = new Set(catalogCategoryFilters);
    const cartSlugSet = new Set(cartSlugs);

    const prepared = visibleCatalogItems.map((item) => {
      const owned = hasInventoryItem(inventoryItemIds, item?.id) || Boolean(item?.owned);
      const inCart = cartSlugSet.has(item?.slug);
      const levelLocked = Boolean(item?.lockedByLevel);
      return {
        ...item,
        _cgOwned: owned,
        _cgInCart: inCart,
        _cgLevelLocked: levelLocked,
      };
    });

    const filtered = prepared.filter((item) => {
      if (categoryFilterSet.size > 0 && !categoryFilterSet.has(item.category || 'misc')) {
        return false;
      }

      if (statusFilterSet.size === 0) {
        return true;
      }

      const matchesStatus = {
        owned: item._cgOwned,
        'not-owned': !item._cgOwned,
        'level-locked': item._cgLevelLocked,
        'level-unlocked': !item._cgLevelLocked,
        'in-cart': item._cgInCart,
      };

      return Array.from(statusFilterSet).some((statusId) => matchesStatus[statusId]);
    });

    const activeSorts = [catalogPrimarySort, catalogSecondarySort].filter(
      (criterion, index, array) =>
        criterion && criterion !== 'none' && array.indexOf(criterion) === index
    );

    return [...filtered].sort((a, b) => {
      for (let i = 0; i < activeSorts.length; i += 1) {
        const diff = compareCatalogItemsByCriterion(a, b, activeSorts[i]);
        if (diff !== 0) return diff;
      }
      return compareCatalogItemsByCriterion(a, b, 'name-asc');
    });
  }, [
    cartSlugs,
    catalogCategoryFilters,
    catalogPrimarySort,
    catalogSecondarySort,
    catalogStatusFilters,
    visibleCatalogItems,
    inventoryItemIds,
  ]);

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.dynamicPrice ?? item.priceDataPackets ?? 0),
        0
      ),
    [cartItems]
  );

  return {
    effectiveCatalogItems,
    effectiveItemBySlug,
    cartItems,
    catalogCategories,
    filteredCatalogItems,
    cartTotal,
  };
};

export default useStoreCatalog;
