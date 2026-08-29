import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveDistTag } from './resolve-dist-tag.mjs';

describe('dist-tag resolution', () => {
  it('gives a release version the latest tag', () => {
    for (const v of ['1.0.0', '0.1.0', '12.34.56', '1.0.0+build.7'])
      expect(resolveDistTag(v), v).toBe('latest');
  });

  it('gives a prerelease its channel name', () => {
    expect(resolveDistTag('0.0.0-alpha.0')).toBe('alpha');
    expect(resolveDistTag('0.0.0-alpha.12')).toBe('alpha');
    expect(resolveDistTag('1.0.0-rc.1')).toBe('rc');
    expect(resolveDistTag('2.0.0-beta')).toBe('beta');
    expect(resolveDistTag('1.0.0-next.3+build.9')).toBe('next');
  });

  it('never puts a prerelease on latest — the property that matters', () => {
    for (const v of ['0.0.0-alpha.0', '1.0.0-rc.1', '2.0.0-beta', '9.9.9-canary.42'])
      expect(resolveDistTag(v), v).not.toBe('latest');
    // and refuses even when the version asks for it by name
    expect(() => resolveDistTag('1.0.0-latest.1')).toThrow(/never take the "latest"/);
  });

  it('refuses a prerelease with no channel name to publish under', () => {
    expect(() => resolveDistTag('1.0.0-1')).toThrow(/no channel name/);
    expect(() => resolveDistTag('1.0.0-0.3')).toThrow(/no channel name/);
  });

  it('refuses anything that is not a version', () => {
    for (const v of ['', '1.0', 'v1.0.0', 'latest', null, undefined, '1.0.0.0'])
      expect(() => resolveDistTag(v), String(v)).toThrow();
  });

  it('resolves this package to a prerelease channel while it is an alpha', () => {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const tag = resolveDistTag(version);
    if (version.includes('-')) expect(tag).not.toBe('latest');
    else expect(tag).toBe('latest');
  });
});
