import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import useStoreCatalog, {
  buildLocalCatalogItems,
  compareCatalogItemsByCriterion,
} from './useStoreCatalog';

describe('useStoreCatalog helpers', () => {
  it('compares catalog items by supported sort criteria', () => {
    const a = {
      displayName: 'Alpha',
      dynamicPrice: 10,
      requiresLevel: 2,
      _cgOwned: false,
      _cgLevelLocked: true,
    };
    const b = {
      displayName: 'Beta',
      dynamicPrice: 20,
      requiresLevel: 4,
      _cgOwned: true,
      _cgLevelLocked: false,
    };

    expect(compareCatalogItemsByCriterion(a, b, 'name-asc')).toBeLessThan(0);
    expect(compareCatalogItemsByCriterion(a, b, 'price-desc')).toBeGreaterThan(0);
    expect(compareCatalogItemsByCriterion(a, b, 'level-asc')).toBeLessThan(0);
    expect(compareCatalogItemsByCriterion(a, b, 'owned-first')).toBe(1);
    expect(compareCatalogItemsByCriterion(a, b, 'locked-first')).toBe(-1);
  });

  it('builds local catalog fallback items and deduplicates slugs', () => {
    const fallback = buildLocalCatalogItems({
      userLevel: 2,
      packs: [
        {
          storeSlug: 'editor.theme.neon',
          name: 'Neon Theme',
          storeCategory: 'editor_theme',
          priceDataPackets: 30,
          requiresLevel: 1,
        },
        {
          storeSlug: 'editor.theme.neon',
          name: 'Neon Theme Duplicate',
          storeCategory: 'editor_theme',
          priceDataPackets: 999,
          requiresLevel: 10,
        },
        {
          storeSlug: 'td.attack.ion',
          name: 'Ion Attack',
          storeCategory: 'td_attack_fx',
          priceDataPackets: 75,
          requiresLevel: 5,
        },
        {
          storeSlug: 'free.item',
          name: 'Free Item',
          free: true,
          priceDataPackets: 0,
        },
      ],
    });

    expect(fallback).toHaveLength(2);
    expect(fallback[0]).toMatchObject({
      slug: 'editor.theme.neon',
      category: 'editor_theme',
      lockedByLevel: false,
      _localFallback: true,
    });
    expect(fallback[1]).toMatchObject({
      slug: 'td.attack.ion',
      lockedByLevel: true,
      dynamicPrice: 75,
    });
  });
});

describe('useStoreCatalog', () => {
  it('derives filtered catalog items, cart items, and totals', () => {
    const { result } = renderHook(() =>
      useStoreCatalog({
        items: [
          {
            id: 'alpha-id',
            slug: 'alpha',
            displayName: 'Alpha Theme',
            category: 'editor',
            dynamicPrice: 40,
            requiresLevel: 1,
            owned: false,
          },
          {
            id: 'beta-id',
            slug: 'beta',
            displayName: 'Beta Tower FX',
            category: 'td',
            dynamicPrice: 10,
            requiresLevel: 4,
            owned: false,
          },
          {
            id: 'gamma-id',
            slug: 'gamma',
            displayName: 'Gamma Badge',
            category: 'profile',
            dynamicPrice: 25,
            requiresLevel: 1,
            owned: true,
          },
        ],
        currentUserLevel: 2,
        inventoryItemIds: new Set(['alpha-id']),
        cartSlugs: ['alpha', 'beta', 'gamma'],
        catalogCategoryFilters: ['td'],
        catalogStatusFilters: ['not-owned', 'in-cart'],
        catalogPrimarySort: 'price-asc',
        catalogSecondarySort: 'name-asc',
        fallbackPacks: [],
      })
    );

    expect(result.current.catalogCategories).toEqual(['editor', 'profile', 'td']);
    expect(result.current.effectiveItemBySlug.get('alpha')?.displayName).toBe('Alpha Theme');

    const betaItem = result.current.effectiveCatalogItems.find((item) => item.slug === 'beta');
    expect(betaItem?.lockedByLevel).toBe(true);

    expect(result.current.filteredCatalogItems).toHaveLength(1);
    expect(result.current.filteredCatalogItems[0].slug).toBe('beta');

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].slug).toBe('beta');
    expect(result.current.cartTotal).toBe(10);
  });

  it('falls back to local catalog packs when API items are unavailable', () => {
    const { result } = renderHook(() =>
      useStoreCatalog({
        items: [],
        currentUserLevel: 1,
        inventoryItemIds: new Set(),
        cartSlugs: [],
        catalogCategoryFilters: [],
        catalogStatusFilters: [],
        catalogPrimarySort: 'price-asc',
        catalogSecondarySort: 'name-asc',
        fallbackPacks: [
          {
            storeSlug: 'profile.background.neon',
            name: 'Neon Profile',
            storeCategory: 'profile_background',
            priceDataPackets: 60,
            requiresLevel: 3,
          },
        ],
      })
    );

    expect(result.current.effectiveCatalogItems).toHaveLength(1);
    expect(result.current.effectiveCatalogItems[0]).toMatchObject({
      slug: 'profile.background.neon',
      lockedByLevel: true,
      _localFallback: true,
    });
  });

  it('hides legacy td board-theme rows when split map/background categories are present', () => {
    const { result } = renderHook(() =>
      useStoreCatalog({
        items: [
          {
            id: 'legacy-board-id',
            slug: 'td.board.solar-circuit.v1',
            displayName: 'Solar Circuit (Legacy)',
            category: 'td_board_theme',
            dynamicPrice: 70,
            requiresLevel: 3,
            metadata: { slot: 'td.boardTheme' },
          },
          {
            id: 'map-pack-id',
            slug: 'td.map.solar-circuit.v1',
            displayName: 'Solar Circuit Map',
            category: 'td_map_pack',
            dynamicPrice: 70,
            requiresLevel: 3,
          },
          {
            id: 'background-pack-id',
            slug: 'td.background.solar-circuit.v1',
            displayName: 'Solar Circuit Background',
            category: 'td_background_pack',
            dynamicPrice: 70,
            requiresLevel: 3,
          },
        ],
        currentUserLevel: 10,
        inventoryItemIds: new Set(),
        cartSlugs: [],
        catalogCategoryFilters: [],
        catalogStatusFilters: [],
        catalogPrimarySort: 'name-asc',
        catalogSecondarySort: 'none',
        fallbackPacks: [],
      })
    );

    expect(result.current.catalogCategories).toEqual(['td_background_pack', 'td_map_pack']);
    expect(result.current.filteredCatalogItems.map((item) => item.slug)).toEqual([
      'td.background.solar-circuit.v1',
      'td.map.solar-circuit.v1',
    ]);

    // Legacy slugs remain addressable for ownership/equip compatibility.
    expect(result.current.effectiveItemBySlug.get('td.board.solar-circuit.v1')).toBeTruthy();
  });
});
