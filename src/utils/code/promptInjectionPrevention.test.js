import { describe, expect, it } from 'vitest';
import {
  demarcateUserInput,
  prepareForPrompt,
  sanitizeForPrompt,
} from './promptInjectionPrevention';

describe('promptInjectionPrevention', () => {
  it('removes role markers, code fences, inline ticks, and control characters', () => {
    const sanitized = sanitizeForPrompt('system: ```print("ok")``` assistant:\u0001`done`');

    expect(sanitized).toContain('print("ok")');
    expect(sanitized).toContain('done');
    expect(sanitized).not.toMatch(/system:|assistant:|`|\u0001/i);
  });

  it('returns an empty string for non-string input', () => {
    expect(sanitizeForPrompt(null)).toBe('');
    expect(sanitizeForPrompt({})).toBe('');
  });

  it('demarcates raw user input with fixed boundaries', () => {
    expect(demarcateUserInput('hello')).toBe('[USER_INPUT_START]\nhello\n[USER_INPUT_END]');
  });

  it('prepares prompt input by sanitizing then demarcating', () => {
    expect(prepareForPrompt('user: `hello`')).toBe('[USER_INPUT_START]\nhello\n[USER_INPUT_END]');
  });
});
