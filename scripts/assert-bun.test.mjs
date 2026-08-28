import { describe, expect, it } from 'vitest';
import { satisfiesBunMinimum, detectBun, MINIMUM_BUN } from './assert-bun.mjs';

describe('bun minimum version', () => {
  it('accepts the minimum and anything above', () => {
    for (const v of ['1.1.0', '1.1.1', '1.2.0', '1.3.11', '1.10.0', '2.0.0'])
      expect(satisfiesBunMinimum(v), v).toBe(true);
  });
  it('rejects anything below', () => {
    for (const v of ['1.0.999', '1.0.0', '0.8.1'])
      expect(satisfiesBunMinimum(v), v).toBe(false);
  });
  it('compares numerically, not lexically', () => {
    // "1.10" < "1.9" as strings; the whole point of not using a string compare.
    expect(satisfiesBunMinimum('1.10.0')).toBe(true);
    expect(satisfiesBunMinimum('1.3.11')).toBe(true);
  });
  it('handles a v prefix, prerelease and build metadata, and rejects junk', () => {
    expect(satisfiesBunMinimum('v1.3.11')).toBe(true);
    expect(satisfiesBunMinimum('1.2.0-canary.1')).toBe(true);
    expect(satisfiesBunMinimum('1.2.0+abc')).toBe(true);
    expect(satisfiesBunMinimum('')).toBe(false);
    expect(satisfiesBunMinimum('latest')).toBe(false);
    expect(satisfiesBunMinimum('1.3')).toBe(false);
  });
  it('detects the bun on PATH in this environment', () => {
    const v = detectBun();
    // Null is a legitimate answer on a runner without bun; the assertion script
    // turns that into a clear failure. Here we only require the two agree.
    if (v !== null) expect(satisfiesBunMinimum(v, MINIMUM_BUN)).toBe(true);
  });
});
