import { describe, expect, it } from 'vitest';

import {
  PORT_MERIDIAN_CREDIT_REGISTRY,
  PORT_MERIDIAN_CREDIT_SUMMARY,
  PORT_MERIDIAN_CREDIT_STATUS,
} from './portMeridianCredits';

describe('PORT_MERIDIAN_CREDIT_REGISTRY', () => {
  it('groups credits by unique creator', () => {
    const ids = PORT_MERIDIAN_CREDIT_REGISTRY.map((entry) => entry.id);
    const creatorNames = PORT_MERIDIAN_CREDIT_REGISTRY.map((entry) => entry.creator);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(creatorNames).size).toBe(creatorNames.length);
  });

  it('tracks complete item metadata and summary counts', () => {
    const items = PORT_MERIDIAN_CREDIT_REGISTRY.flatMap((entry) => entry.items);

    expect(items.length).toBe(PORT_MERIDIAN_CREDIT_SUMMARY.packCount);
    expect(PORT_MERIDIAN_CREDIT_SUMMARY.creatorCount).toBe(PORT_MERIDIAN_CREDIT_REGISTRY.length);
    expect(
      PORT_MERIDIAN_CREDIT_SUMMARY.activePackCount + PORT_MERIDIAN_CREDIT_SUMMARY.stagedPackCount
    ).toBe(items.length);

    items.forEach((item) => {
      expect(item.title).toBeTruthy();
      expect(item.url).toMatch(/^https?:\/\//);
      expect(item.usage).toBeTruthy();
      expect(PORT_MERIDIAN_CREDIT_STATUS[item.status]).toBeTruthy();
    });
  });

  it('includes Karl Casey once with the active White Bat Audio track catalog', () => {
    const karlCaseyEntry = PORT_MERIDIAN_CREDIT_REGISTRY.find(
      (entry) => entry.creator === 'Karl Casey @ White Bat Audio'
    );

    expect(karlCaseyEntry).toBeTruthy();
    expect(karlCaseyEntry.items).toHaveLength(1);
    expect(karlCaseyEntry.items[0]).toEqual(
      expect.objectContaining({
        status: 'active',
        title: 'White Bat Audio background music catalog',
        url: 'https://whitebataudio.com',
      })
    );
    expect(karlCaseyEntry.items[0].details?.length).toBeGreaterThan(0);
  });
});
