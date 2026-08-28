import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Guards the hermeticity of the lazy-loading probe.
 *
 * An earlier version appended its synthetic payload straight into
 * `dist/surfaces/index.js` and never removed it: the first run contaminated
 * build output that could have been packed and published, and a second run
 * failed on a duplicate declaration. These assertions exist so that specific
 * mistake cannot come back unnoticed in review.
 */
const source = readFileSync(new URL('./verify-lazy-loading.mjs', import.meta.url), 'utf8');

describe('lazy-loading probe stays hermetic', () => {
  it('injects only into a copy, never into the package under test', () => {
    // DESTINATIONS only. `cpSync(src, dest)` legitimately READS from the real
    // package — copying out of it is the whole mechanism — so only its second
    // argument is a write. For appendFileSync/writeFileSync the first is.
    const singleArg = [...source.matchAll(/(appendFileSync|writeFileSync|mkdirSync|rmSync)\(\s*join\((\w+)/g)]
      .map((m) => m[2]);
    const copyDest = [...source.matchAll(/cpSync\(\s*join\(\w+[^,]*,[^,]*,\s*join\((\w+)/g)]
      .map((m) => m[1]);
    const targets = new Set([...singleArg, ...copyDest]);
    expect(targets.size).toBeGreaterThan(0);
    // `pkg` is the real package root and must never be a write DESTINATION.
    expect([...targets]).not.toContain('pkg');
    for (const target of targets) expect(['pkgCopy', 'app', 'workdir']).toContain(target);
  });

  it('copies the package before injecting anything', () => {
    expect(source.indexOf('cpSync')).toBeLessThan(source.indexOf('appendFileSync'));
  });

  it('discards the temporary tree in a finally block, so a crash cannot leak', () => {
    expect(source).toMatch(/\}\s*finally\s*\{/);
    expect(source).toMatch(/finally\s*\{[\s\S]*rmSync\(workdir[\s\S]*\}/);
  });

  it('asserts the package tree is unchanged, on both the success and cleanup paths', () => {
    expect(source).toMatch(/const distBefore = fingerprint/);
    expect(source).toMatch(/distAfter === distBefore/);
    expect(source).toMatch(/finally\s*\{[\s\S]*distFinal !== distBefore/);
  });
});
