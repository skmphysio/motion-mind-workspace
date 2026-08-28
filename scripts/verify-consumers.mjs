/**
 * Consumer verification: exact-version install, every subpath, both package
 * managers, and BOTH SUPPORTED REACT MAJORS.
 *
 * The React matrix is not ceremony. Motion Mind runs React 18 and Campus runs
 * React 19, and this package declares a peer range spanning both. A range that
 * is merely written down is not a range that resolves — npm and bun disagree
 * about peer strictness (bun warns where npm fails), so the peers are exercised
 * in both, at both majors, rather than assumed.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve('.');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const packed = JSON.parse(
  (() => {
    const r = execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8' });
    return r.slice(r.indexOf('['));
  })(),
)[0].filename;
const tarball = join(root, packed);

const SUBPATH_PROBE = `
import * as root from '@motionmind/workspace';
import * as contracts from '@motionmind/workspace/contracts';
import * as client from '@motionmind/workspace/client';
import * as react from '@motionmind/workspace/react';
import * as companion from '@motionmind/workspace/companion';
import * as surfaces from '@motionmind/workspace/surfaces';

const db = { from: () => ({}), rpc: async () => ({}) };
const c = client.createWorkspaceClient({ database: db });

const checks = [
  ['root re-exports contracts',  root.PREVIEW_MAX_CHARS === 280],
  ['contracts: workspace route', contracts.workspacePath('notebook') === '/workspace/notebook'],
  ['contracts: legacy redirect', contracts.resolveLegacyWorkspacePath('/dashboard/growth/goal/1') === '/workspace/growth/goal/1'],
  ['contracts: preview rule',    contracts.buildContentPreview('x'.repeat(500)).length === 280],
  ['client: injected db kept',   c.database === db],
  ['client: preview via client', c.notePreview('x'.repeat(500)).endsWith('\\u2026')],
  ['react: provider exported',   typeof react.WorkspaceProvider === 'function'],
  ['react: hooks exported',      typeof react.useWorkspaceClient === 'function'],
  ['companion: mount rule',      typeof companion.COMPANION_MOUNT_RULE === 'string'],
  ['surfaces: lazy areas',       surfaces.LAZY_REQUIRED_AREAS.includes('notebook')],
];
let ok = true;
for (const [name, pass] of checks) { console.log('      ' + (pass ? 'PASS' : 'FAIL') + '  ' + name); if (!pass) ok = false; }
process.exit(ok ? 0 : 1);
`;

function consumer(manager, reactVersion) {
  const dir = mkdtempSync(join(tmpdir(), `c-${manager}-react${reactVersion}-`));
  copyFileSync(tarball, join(dir, packed));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: `consumer-${manager}-react${reactVersion}`,
        private: true,
        type: 'module',
        version: '0.0.0',
        dependencies: {
          '@motionmind/workspace': `file:./${packed}`,
          react: reactVersion,
          'react-dom': reactVersion,
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(join(dir, 'probe.mjs'), SUBPATH_PROBE);

  console.log(`\n  --- ${manager} · React ${reactVersion} ---`);
  // npm fails on an unsatisfied peer; bun only warns. Running both is the point.
  execFileSync(manager, ['install'], { cwd: dir, stdio: 'pipe' });

  const installed = JSON.parse(
    readFileSync(join(dir, 'node_modules/@motionmind/workspace/package.json'), 'utf8'),
  ).version;
  if (installed !== version) {
    console.error(`      FAIL  expected exactly ${version}, got ${installed}`);
    process.exit(1);
  }
  const reactInstalled = JSON.parse(
    readFileSync(join(dir, 'node_modules/react/package.json'), 'utf8'),
  ).version;
  console.log(`      PASS  installed exactly ${installed} against react ${reactInstalled}`);
  execFileSync('node', ['probe.mjs'], { cwd: dir, stdio: 'inherit' });
  rmSync(dir, { recursive: true, force: true });
}

for (const manager of ['npm', 'bun']) {
  for (const reactVersion of ['18.3.1', '19.2.0']) consumer(manager, reactVersion);
}
console.log('\n  All subpaths resolved at the exact pinned version, in npm and bun, on React 18 and 19.');
