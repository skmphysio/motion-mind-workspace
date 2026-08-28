/**
 * Bun availability and version gate.
 *
 * The consumer matrix runs the SAME probe through npm and through bun, because
 * the two resolvers disagree about peer strictness — bun warns where npm fails.
 * That only tests anything if bun is actually present.
 *
 * The release job previously ran `verify:consumers` without ever installing
 * bun. On a GitHub-hosted runner bun is NOT preinstalled, so the release would
 * have died inside the consumer matrix with an opaque spawn error — after
 * passing every other gate, and immediately before publishing. This asserts the
 * dependency explicitly, before the matrix, so a missing or too-old bun fails
 * fast and says why.
 */
import { execFileSync } from 'node:child_process';

/** Minimum bun that resolves this package's peer ranges and text lockfiles. */
export const MINIMUM_BUN = [1, 1, 0];

export function satisfiesBunMinimum(version, minimum = MINIMUM_BUN) {
  const parts = String(version).trim().replace(/^v/, '').split('+')[0].split('-')[0].split('.').map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return false;
  for (let i = 0; i < 3; i += 1) {
    if (parts[i] > minimum[i]) return true;
    if (parts[i] < minimum[i]) return false;
  }
  return true;
}

/** Returns the installed version, or null when bun is not on PATH. */
export function detectBun() {
  try {
    return execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = detectBun();
  if (version === null) {
    console.error('  FAIL  bun is not installed.');
    console.error('        The consumer matrix runs through npm AND bun; a GitHub-hosted');
    console.error('        runner does not provide bun. Add oven-sh/setup-bun@v2 to this job.');
    process.exit(1);
  }
  if (!satisfiesBunMinimum(version)) {
    console.error(`  FAIL  bun ${version} is older than the required ${MINIMUM_BUN.join('.')}`);
    process.exit(1);
  }
  console.log(`  PASS  bun ${version} present and >= ${MINIMUM_BUN.join('.')}`);
}
