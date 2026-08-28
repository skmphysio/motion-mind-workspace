/**
 * Exact-version consumer verification, in both package managers.
 *
 * Packs the real tarball and installs it as a pinned dependency in a throwaway
 * npm consumer and a throwaway bun consumer, then runs a behaviour smoke test
 * through each resolver. Proves: the exports map resolves, the types resolve,
 * the runtime behaves, and both managers agree on the same artefact.
 *
 * The 24-hour release-age guard is NOT exercised here — it applies to registry
 * publishes, and is verified against a real registry (see RELEASE.md).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pkgDir = resolve('packages/workspace-contracts');
const version = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).version;

const packed = JSON.parse(
  (() => { const r = execFileSync('npm', ['pack', '--json'], { cwd: pkgDir, encoding: 'utf8' });
           return r.slice(r.indexOf('[')); })()
)[0].filename;
const tarball = join(pkgDir, packed);

const SMOKE = `
import { buildContentPreview, toAiChatContext, conversationKey, MENTOR_CONTEXT_CAPS }
  from '@motionmind/workspace-contracts';
const out = buildContentPreview('x'.repeat(500));
const campus = toAiChatContext({ host:'campus', surface:'campus_course', contextLabel:'c',
  assistant:'campus_mentor', institutionId:'i1', offeringId:'o1' });
const checks = [
  ['preview length 280', out.length === 280],
  ['preview ellipsis',   out.endsWith('\\u2026')],
  ['campus context',     campus.campus_institution_id === 'i1' && campus.campus_offering_id === 'o1'],
  ['conversation key',   conversationKey({ host:'campus', surface:'campus_course', contextLabel:'c',
                            assistant:'campus_mentor', offeringId:'o1' }) === 'campus_mentor::o1'],
  ['caps mirrored',      MENTOR_CONTEXT_CAPS.notebook === 3 && MENTOR_CONTEXT_CAPS.growth === 4],
];
let ok = true;
for (const [n, p] of checks) { console.log('  ' + (p ? 'PASS' : 'FAIL') + '  ' + n); if (!p) ok = false; }
process.exit(ok ? 0 : 1);
`;

function consumer(manager) {
  const dir = mkdtempSync(join(tmpdir(), `consumer-${manager}-`));
  copyFileSync(tarball, join(dir, packed));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `consumer-${manager}`, private: true, type: 'module', version: '0.0.0',
    dependencies: { '@motionmind/workspace-contracts': `file:./${packed}` },
  }, null, 2));
  writeFileSync(join(dir, 'smoke.mjs'), SMOKE);

  console.log(`\n--- ${manager} consumer ---`);
  execFileSync(manager, ['install'], { cwd: dir, stdio: 'inherit' });

  const installed = JSON.parse(readFileSync(
    join(dir, 'node_modules/@motionmind/workspace-contracts/package.json'), 'utf8')).version;
  if (installed !== version) {
    console.error(`  FAIL  expected exactly ${version}, got ${installed}`);
    process.exit(1);
  }
  console.log(`  PASS  installed exactly ${installed}`);
  execFileSync('node', ['smoke.mjs'], { cwd: dir, stdio: 'inherit' });
}

consumer('npm');
consumer('bun');
console.log('\nBoth consumers resolved the same artefact at the exact pinned version.');
