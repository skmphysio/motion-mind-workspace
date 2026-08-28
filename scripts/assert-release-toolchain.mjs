/**
 * Release-toolchain gate.
 *
 * npm's trusted publishing (OIDC) requires a recent npm. Asserting it here — as
 * a script rather than inline shell — means the comparison is testable and the
 * release job fails loudly on an old toolchain instead of silently publishing
 * without provenance.
 */
export function satisfiesNpmMinimum(version, minimum = [11, 5, 1]) {
  const parts = String(version).trim().split('+')[0].split('-')[0].split('.').map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return false;
  for (let i = 0; i < 3; i += 1) {
    if (parts[i] > minimum[i]) return true;
    if (parts[i] < minimum[i]) return false;
  }
  return true; // exactly the minimum
}

export function satisfiesNodeMajor(version, minimum = 24) {
  const major = Number(String(version).replace(/^v/, '').split('.')[0]);
  return Number.isFinite(major) && major >= minimum;
}

// Executed directly by the release workflow.
if (import.meta.url === `file://${process.argv[1]}`) {
  const node = process.versions.node;
  const npm = process.env.NPM_VERSION ?? '';
  const problems = [];
  if (!satisfiesNodeMajor(node)) problems.push(`Node 24+ required for the release job, got ${node}`);
  if (!satisfiesNpmMinimum(npm)) problems.push(`npm >= 11.5.1 required for trusted publishing, got ${npm || '(unset)'}`);
  if (problems.length) { for (const p of problems) console.error(p); process.exit(1); }
  console.log(`toolchain ok — node ${node}, npm ${npm}`);
}
