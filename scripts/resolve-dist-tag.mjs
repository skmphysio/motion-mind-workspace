/**
 * The npm dist-tag a version must be published under, derived from the version
 * itself.
 *
 * `v0.0.0-alpha.0` failed at the publish call with
 *
 *   npm error You must specify a tag using --tag when publishing a prerelease version.
 *
 * after every gate had passed. npm 11 refuses to guess a dist-tag for a
 * prerelease. npm 10 did guess — it published prereleases to `latest` and
 * exited 0 — so a rehearsal on npm 10 passes by doing the WRONG thing, which is
 * precisely how this reached a real release. The release job installs npm
 * >= 11.5.1 for trusted publishing, so the two majors disagree exactly where it
 * matters.
 *
 * Deriving the tag from the version removes the choice from the command line:
 * there is no hand-maintained `--tag alpha` to forget when the version reaches
 * 1.0.0, and no way to put a prerelease on `latest`.
 */

/** semver: major.minor.patch[-prerelease][+build] */
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function resolveDistTag(version) {
  const match = SEMVER.exec(String(version ?? '').trim());
  if (!match) {
    throw new Error(`Not a semver version: ${JSON.stringify(version)}`);
  }

  const [, major, minor, patch, prerelease] = match;
  if (prerelease === undefined) return 'latest';

  // `1.0.0-rc.1` publishes under `rc`; the numeric part is the iteration, not a
  // channel anyone would install by name.
  const identifier = prerelease.split('.')[0];

  if (identifier === '' || /^\d+$/.test(identifier)) {
    throw new Error(
      `Prerelease "${prerelease}" carries no channel name to publish under. ` +
        `Use a named prerelease, e.g. ${major}.${minor}.${patch}-alpha.0`,
    );
  }
  if (identifier === 'latest') {
    throw new Error(
      'A prerelease must never take the "latest" dist-tag: a plain ' +
        '`npm install` would resolve to it.',
    );
  }
  return identifier;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  try {
    process.stdout.write(`${resolveDistTag(version)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
