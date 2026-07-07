import { describe, it, expect } from 'vitest';
import { formatResponsiveASCII, getLineClassName } from './terminalFormatting.js';

describe('formatResponsiveASCII', () => {
  it('returns line unchanged on large screens', () => {
    const line = '██████████ long ascii art line that is over 60 chars ████████████████';
    expect(formatResponsiveASCII(line, false)).toBe(line);
  });

  it('returns plain text lines unchanged on small screens', () => {
    const line = 'Hello World';
    expect(formatResponsiveASCII(line, true)).toBe(line);
  });

  it('truncates long ASCII art lines to 60 chars on small screens', () => {
    const line = '██' + 'A'.repeat(70); // has block char, over 60 chars
    const result = formatResponsiveASCII(line, true);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it('returns short ASCII art lines unchanged on small screens', () => {
    const line = '██ short'; // has block char, under 60 chars
    expect(formatResponsiveASCII(line, true)).toBe(line);
  });

  it('handles box-drawing characters (═ ╗) as ASCII art triggers', () => {
    const line = '╗' + 'B'.repeat(70);
    const result = formatResponsiveASCII(line, true);
    expect(result.length).toBeLessThanOrEqual(60);
  });
});

describe('getLineClassName', () => {
  it('returns terminal-line for plain lines', () => {
    expect(getLineClassName('Hello')).toBe('terminal-line');
  });

  it('adds system-message class for [SYSTEM] tag', () => {
    expect(getLineClassName('[SYSTEM] boot complete')).toBe('terminal-line system-message');
  });

  it('adds kernel-message class for [KERNEL] tag', () => {
    expect(getLineClassName('[KERNEL] loaded')).toBe('terminal-line kernel-message');
  });

  it('adds alert-message class for [ALERT] tag', () => {
    expect(getLineClassName('[ALERT] warning')).toBe('terminal-line alert-message');
  });

  it('adds breach-message class for [BREACH] tag', () => {
    expect(getLineClassName('[BREACH] detected')).toBe('terminal-line breach-message');
  });

  it('adds success-message class for [SUCCESS] tag', () => {
    expect(getLineClassName('[SUCCESS] mission complete')).toBe('terminal-line success-message');
  });

  it('adds critical-message class for [CRITICAL] tag', () => {
    expect(getLineClassName('[CRITICAL] failure')).toBe('terminal-line critical-message');
  });

  it('adds module-message class for [MODULE] tag', () => {
    expect(getLineClassName('[MODULE] loaded')).toBe('terminal-line module-message');
  });

  it('adds upgrade-message class for [UPGRADE] tag', () => {
    expect(getLineClassName('[UPGRADE] applied')).toBe('terminal-line upgrade-message');
  });

  it('adds security-message class for [SECURITY] tag', () => {
    expect(getLineClassName('[SECURITY] scan')).toBe('terminal-line security-message');
  });

  it('adds verify-message class for [VERIFY] tag', () => {
    expect(getLineClassName('[VERIFY] checksum')).toBe('terminal-line verify-message');
  });

  it('adds verify-message class for [VERIFICATION] tag', () => {
    expect(getLineClassName('[VERIFICATION] done')).toBe('terminal-line verify-message');
  });

  it('adds warning-message class for [FAILURE] tag', () => {
    expect(getLineClassName('[FAILURE] crash')).toBe('terminal-line warning-message');
  });

  it('adds warning-message class for [WARNING] tag', () => {
    expect(getLineClassName('[WARNING] low health')).toBe('terminal-line warning-message');
  });

  it('adds protocol-message class for [PROTOCOL] tag', () => {
    expect(getLineClassName('[PROTOCOL] init')).toBe('terminal-line protocol-message');
  });

  it('adds protocol-message class for [COMPILE] tag', () => {
    expect(getLineClassName('[COMPILE] success')).toBe('terminal-line protocol-message');
  });

  it('adds analytics-message class for [ANALYTICS] tag', () => {
    expect(getLineClassName('[ANALYTICS] report')).toBe('terminal-line analytics-message');
  });

  it('adds intel-message class for [INTEL] tag', () => {
    expect(getLineClassName('[INTEL] gathered')).toBe('terminal-line intel-message');
  });

  it('adds ascii-success class for [VERIF-SUCCESS] tag', () => {
    expect(getLineClassName('[VERIF-SUCCESS]')).toBe('terminal-line ascii-success');
  });

  it('adds ascii-fail class for [VERIF-FAIL] tag', () => {
    expect(getLineClassName('[VERIF-FAIL]')).toBe('terminal-line ascii-fail');
  });

  it('adds ascii-art class for triple block chars', () => {
    expect(getLineClassName('███ art')).toBe('terminal-line ascii-art');
  });

  it('adds ascii-art class for ██╗ pattern', () => {
    expect(getLineClassName('██╗ header')).toBe('terminal-line ascii-art');
  });

  it('adds ascii-art class for ╚══ pattern', () => {
    expect(getLineClassName('╚══ footer')).toBe('terminal-line ascii-art');
  });
});
