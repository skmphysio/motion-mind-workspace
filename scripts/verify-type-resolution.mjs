/**
 * Consumer-side type resolution, under BOTH hosts' real compiler settings.
 *
 * This exists because `attw`'s `node10` check fails for subpath exports — that
 * is inherent to the `exports` field without `typesVersions`, and it describes
 * legacy `moduleResolution: "node"`, which NEITHER consumer uses. Verified:
 * Campus sets `moduleResolution: "Bundler"` and Motion Mind sets `"bundler"`,
 * and attw reports every subpath green for `bundler`.
 *
 * So rather than trusting a suppression, this proves the property that actually
 * matters: a consumer using each host's exact settings can import every subpath
 * and get correct types. If either host ever changes resolution mode, this
 * fails and the suppression stops being safe silently.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const pkg = resolve('.');

/** Copied from the two applications' tsconfigs, verbatim in the parts that matter. */
const HOSTS = {
  campus: {
    strict: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true,
    noPropertyAccessFromIndexSignature: true, noImplicitReturns: true,
    noImplicitOverride: true, noFallthroughCasesInSwitch: true,
    moduleResolution: 'Bundler',
  },
  motionMind: {
    strict: false, strictNullChecks: false, noImplicitAny: false,
    moduleResolution: 'bundler',
  },
};

const PROBE = `
import * as root from '@motionmindpkg/workspace';
import { workspacePath, resolveLegacyWorkspacePath, type WorkspaceArea, type WorkspaceHost } from '@motionmindpkg/workspace/contracts';
import { createWorkspaceClient, type WorkspaceClient, type WorkspaceDatabase } from '@motionmindpkg/workspace/client';
import { WorkspaceProvider, useWorkspaceClient } from '@motionmindpkg/workspace/react';
import { COMPANION_MOUNT_RULE, type CompanionMountProps } from '@motionmindpkg/workspace/companion';
import { LAZY_REQUIRED_AREAS, type WorkspaceSurfaceProps } from '@motionmindpkg/workspace/surfaces';

const area: WorkspaceArea = 'notebook';
const db: WorkspaceDatabase = { from: () => ({}), rpc: async () => ({}) };
const client: WorkspaceClient = createWorkspaceClient({ database: db });
const legacy: string | null = resolveLegacyWorkspacePath('/dashboard/notebook/projects/1');

export const proof = {
  cap: root.PREVIEW_MAX_CHARS,
  path: workspacePath(area),
  legacy,
  preview: client.notePreview('a'),
  provider: WorkspaceProvider,
  hook: useWorkspaceClient,
  rule: COMPANION_MOUNT_RULE,
  lazy: LAZY_REQUIRED_AREAS,
};
export type Props = CompanionMountProps | WorkspaceSurfaceProps;
export type Host = WorkspaceHost;
`;

let failed = false;
for (const [host, options] of Object.entries(HOSTS)) {
  const dir = mkdtempSync(join(tmpdir(), `types-${host}-`));
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `types-${host}`, private: true, type: 'module', version: '0.0.0',
    dependencies: { '@motionmindpkg/workspace': `file:${pkg}`, react: '^19.2.0' },
  }, null, 2));
  writeFileSync(join(dir, 'probe.ts'), PROBE);
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
    include: ['probe.ts'],
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', jsx: 'react-jsx',
      lib: ['ES2022', 'DOM'], noEmit: true, skipLibCheck: true, ...options,
    },
  }, null, 2));

  execFileSync('npm', ['install', '--no-fund', '--no-audit', '--silent'], { cwd: dir, stdio: 'pipe' });
  try {
    execFileSync(join(pkg, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], { cwd: dir, stdio: 'pipe' });
    console.log(`  PASS  every subpath type-resolves under ${host}'s settings (moduleResolution: ${options.moduleResolution})`);
  } catch (e) {
    failed = true;
    console.error(`  FAIL  ${host}`);
    console.error(String(e.stdout ?? e.message));
  }
}
process.exit(failed ? 1 : 0);
