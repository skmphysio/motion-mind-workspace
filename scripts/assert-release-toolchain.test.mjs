import { describe, expect, it } from 'vitest';
import { satisfiesNpmMinimum, satisfiesNodeMajor } from './assert-release-toolchain.mjs';

describe('npm minimum for trusted publishing (>= 11.5.1)', () => {
  it('accepts the minimum and anything above', () => {
    for (const v of ['11.5.1', '11.5.2', '11.6.0', '11.19.0', '11.19.1', '12.0.2'])
      expect(satisfiesNpmMinimum(v), v).toBe(true);
  });
  it('rejects anything below', () => {
    for (const v of ['11.5.0', '11.4.9', '11.0.0', '10.9.7', '9.8.1'])
      expect(satisfiesNpmMinimum(v), v).toBe(false);
  });
  it('compares numerically, not lexically', () => {
    expect(satisfiesNpmMinimum('11.19.0')).toBe(true);   // "11.19" < "11.5" as strings
    expect(satisfiesNpmMinimum('11.10.0')).toBe(true);
  });
  it('handles prerelease and build metadata, and rejects junk', () => {
    expect(satisfiesNpmMinimum('12.0.0-pre.1')).toBe(true);
    expect(satisfiesNpmMinimum('11.5.1+build.5')).toBe(true);
    expect(satisfiesNpmMinimum('')).toBe(false);
    expect(satisfiesNpmMinimum('latest')).toBe(false);
    expect(satisfiesNpmMinimum('11.5')).toBe(false);
  });
});

describe('node major for the release job (>= 24)', () => {
  it('accepts 24 and above, rejects below', () => {
    expect(satisfiesNodeMajor('v24.20.0')).toBe(true);
    expect(satisfiesNodeMajor('24.0.0')).toBe(true);
    expect(satisfiesNodeMajor('v26.1.0')).toBe(true);
    expect(satisfiesNodeMajor('v22.22.2')).toBe(false);
    expect(satisfiesNodeMajor('v20.11.0')).toBe(false);
  });
});
