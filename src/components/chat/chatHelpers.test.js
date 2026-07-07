import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterDuplicateLimitMessages,
  formatCooldown,
  generateUniqueId,
  getResetRemainingSeconds,
  normalizeProblemId,
  sanitizeOutgoingMessage,
  scrubContextText,
  stripHtml,
  truncateText,
  wrapUserCode,
} from './chatHelpers';

describe('chatHelpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates deterministic unique ids when time/random are mocked', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    expect(generateUniqueId()).toBe('1700000000000-4fzzzxjy');
  });

  it('normalizes problem ids based on route context', () => {
    expect(normalizeProblemId('ai-42')).toBe('ai-42');

    window.history.replaceState({}, '', '/ai-problems/two-sum');
    expect(normalizeProblemId('123')).toBe('ai-123');
    expect(normalizeProblemId()).toBe('ai-two-sum');

    window.history.replaceState({}, '', '/problems/two-sum');
    expect(normalizeProblemId('123')).toBe('123');
  });

  it('sanitizes and truncates text helpers', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    expect(stripHtml(null)).toBe('');

    expect(truncateText('abc', 10)).toBe('abc');
    expect(truncateText('abcdef', 3)).toBe('abc\n...[truncated]');

    expect(wrapUserCode('print("hi")')).toBe('[USER_CODE_START]\nprint("hi")\n[USER_CODE_END]');
    expect(wrapUserCode('')).toBe('');
  });

  it('scrubs sensitive terms for context and outgoing payloads', () => {
    expect(scrubContextText('Potential zero-day attack')).toBe('Potential [redacted] [redacted]');
    expect(sanitizeOutgoingMessage('hack and exploit')).toBe('issue and issue');
    expect(scrubContextText(undefined)).toBe('');
    expect(sanitizeOutgoingMessage(undefined)).toBe('');
  });

  it('formats cooldown durations in seconds, minutes, and hours', () => {
    expect(formatCooldown(0)).toBe('0s');
    expect(formatCooldown(45)).toBe('45s');
    expect(formatCooldown(125)).toBe('2m 5s');
    expect(formatCooldown(3660)).toBe('1h 1m');
  });

  it('computes reset countdown from date and string inputs', () => {
    const now = Date.parse('2026-01-02T00:00:00Z');
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(getResetRemainingSeconds(null)).toBeNull();
    expect(getResetRemainingSeconds('not-a-date')).toBeNull();
    expect(getResetRemainingSeconds(new Date(now - 60 * 60 * 1000))).toBe(23 * 60 * 60);
    expect(getResetRemainingSeconds(new Date(now - 30 * 60 * 60 * 1000))).toBe(0);
  });

  it('keeps only the latest limit message and preserves the original array', () => {
    const original = [
      { id: '1', isLimit: true },
      { id: '2', isLimit: false },
      { id: '3', isLimit: true },
      { id: '4', isLimit: true },
      { id: '5', isLimit: false },
    ];

    const filtered = filterDuplicateLimitMessages(original);

    expect(filtered.map((item) => item.id)).toEqual(['2', '4', '5']);
    expect(original.map((item) => item.id)).toEqual(['1', '2', '3', '4', '5']);
  });
});
