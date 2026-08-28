/**
 * Published-content gate.
 *
 * Every file that ships to the registry is listed in `expected-contents.json`.
 * CI fails on any addition or removal. This is what stops a test config, a
 * fixture, an .env or a stray source map reaching consumers — it caught
 * `dist/vitest.config.js` during the PR-0 rehearsal.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkgDir = process.argv[2];
if (!pkgDir) { console.error('usage: check-package-contents.mjs <package-dir>'); process.exit(2); }

const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: pkgDir, encoding: 'utf8' });
const actual = JSON.parse(raw.slice(raw.indexOf('[')))[0].files.map((f) => f.path).sort();
const expected = JSON.parse(
  readFileSync(resolve(pkgDir, 'expected-contents.json'), 'utf8')
).files.slice().sort();

const added = actual.filter((f) => !expected.includes(f));
const removed = expected.filter((f) => !actual.includes(f));

if (added.length || removed.length) {
  console.error('Published contents changed.');
  for (const f of added) console.error(`  + ${f}   (unexpected — add to expected-contents.json only if intended)`);
  for (const f of removed) console.error(`  - ${f}   (missing)`);
  process.exit(1);
}
// A tarball must never carry credentials or a project URL.
const FORBIDDEN = /\.env|_authToken|SUPABASE_URL|sb_secret_|service_role/;
for (const f of actual) {
  if (/\.(js|d\.ts|json)$/.test(f)) {
    const body = readFileSync(resolve(pkgDir, f), 'utf8');
    if (FORBIDDEN.test(body)) { console.error(`Forbidden content in ${f}`); process.exit(1); }
  }
}
console.log(`Published contents verified (${actual.length} files, no credentials).`);
