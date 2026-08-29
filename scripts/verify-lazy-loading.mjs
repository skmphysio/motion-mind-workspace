/**
 * Lazy-loading verification — the property that makes ONE package safe.
 *
 * Collapsing five packages into one is only sound if a consumer can still keep
 * the heavy areas out of its entry chunk. This builds a real Vite application
 * that eagerly imports `contracts` and `companion` and lazily imports
 * `surfaces`, then asserts the surfaces code landed in a separate chunk.
 *
 * HERMETIC BY CONSTRUCTION.
 *
 * An earlier version appended the synthetic payload straight into
 * `dist/surfaces/index.js` and never removed it. That was wrong twice over: the
 * first run left contaminated build output that could have been packed and
 * published, and a second run failed on a duplicate declaration. A verification
 * script that mutates the artefact it is verifying is worse than no script.
 *
 * The fix is not a cleanup step — cleanup can be skipped when the build throws.
 * The package is COPIED into a temporary directory and the payload is injected
 * only into that copy, so the real `dist/` is never written to at all and there
 * is nothing to restore on any path, including a crash.
 *
 * A before/after fingerprint of `dist/` is asserted anyway, so if this file ever
 * regains a write to the real tree the check fails loudly rather than quietly
 * poisoning a release.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync,
  rmSync, statSync, writeFileSync, appendFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

const pkg = resolve('.');
const MARKER = 'LAZY_PROBE_HEAVY_PAYLOAD';
const WEIGHT = 300_000; // a 300KB literal, standing in for editors and document tooling

/** Content fingerprint of a directory tree — path and bytes, order-independent. */
function fingerprint(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return 'ABSENT';
  const hash = createHash('sha256');
  const walk = (d) =>
    readdirSync(d)
      .sort()
      .forEach((entry) => {
        const path = join(d, entry);
        if (statSync(path).isDirectory()) walk(path);
        else {
          hash.update(relative(dir, path));
          hash.update(readFileSync(path));
        }
      });
  walk(dir);
  return hash.digest('hex');
}

const distBefore = fingerprint(join(pkg, 'dist'));
let workdir;

try {
  workdir = mkdtempSync(join(tmpdir(), 'lazy-probe-'));

  // ── The package COPY. The real dist/ is never touched. ──
  const pkgCopy = join(workdir, 'package-under-test');
  mkdirSync(pkgCopy, { recursive: true });
  cpSync(join(pkg, 'dist'), join(pkgCopy, 'dist'), { recursive: true });
  // Strip lifecycle scripts from the COPY. The probe measures the artefact that
  // is already built; letting npm run `prepare` here would re-run `clean && tsc`
  // inside the copy — wiping the dist under test (and the injected payload with
  // it) and failing because the copy has no toolchain of its own.
  const copiedManifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
  delete copiedManifest.scripts;
  writeFileSync(join(pkgCopy, 'package.json'), JSON.stringify(copiedManifest, null, 2));
  cpSync(join(pkg, 'README.md'), join(pkgCopy, 'README.md'));

  // Inject the weight into the COPY only.
  appendFileSync(
    join(pkgCopy, 'dist/surfaces/index.js'),
    `\nexport const __LAZY_PROBE = "${MARKER}${'x'.repeat(WEIGHT)}";\n`,
  );

  // ── The consumer application. ──
  const app = join(workdir, 'app');
  mkdirSync(join(app, 'src'), { recursive: true });
  writeFileSync(
    join(app, 'package.json'),
    JSON.stringify(
      {
        name: 'lazy-probe', private: true, type: 'module', version: '0.0.0',
        dependencies: { '@motionmind/workspace': `file:${pkgCopy}` },
      },
      null, 2,
    ),
  );
  writeFileSync(
    join(app, 'vite.config.ts'),
    `import { defineConfig } from 'vite';\nexport default defineConfig({ build: { minify: false, target: 'es2022' } });\n`,
  );
  writeFileSync(
    join(app, 'index.html'),
    `<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.ts"></script></body></html>`,
  );
  writeFileSync(
    join(app, 'src/main.ts'),
    `
import { workspacePath } from '@motionmind/workspace/contracts';
import { COMPANION_MOUNT_RULE } from '@motionmind/workspace/companion';
document.getElementById('root')!.textContent = workspacePath('notebook') + COMPANION_MOUNT_RULE;
export async function openWorkspace() {
  const surfaces = await import('@motionmind/workspace/surfaces');
  return surfaces.LAZY_REQUIRED_AREAS.length;
}
(globalThis as Record<string, unknown>).openWorkspace = openWorkspace;
`,
  );

  execFileSync('npm', ['install', '--no-fund', '--no-audit', '--silent'], { cwd: app, stdio: 'pipe' });
  execFileSync('npm', ['install', '--no-save', '--no-fund', '--no-audit', '--silent', 'vite@5'], { cwd: app, stdio: 'pipe' });
  execFileSync('npx', ['vite', 'build'], { cwd: app, stdio: 'pipe' });

  const assets = join(app, 'dist/assets');
  let entry = null;
  let lazy = null;
  for (const file of readdirSync(assets)) {
    const body = readFileSync(join(assets, file), 'utf8');
    const record = { file, bytes: body.length, heavy: body.includes(MARKER) };
    if (body.includes('COMPANION_MOUNT_RULE') || body.includes('/workspace/notebook')) entry = record;
    else if (record.heavy) lazy = record;
  }

  console.log(`  entry chunk : ${entry?.file} — ${entry?.bytes} bytes — heavy payload: ${entry?.heavy}`);
  console.log(`  lazy chunk  : ${lazy?.file} — ${lazy?.bytes} bytes — heavy payload: ${lazy?.heavy}`);

  // Absolute and relative: the heavy area must be absent from the entry chunk,
  // present in a separate one, and that chunk must carry the weight itself.
  const split =
    entry && lazy &&
    entry.heavy === false &&
    lazy.heavy === true &&
    lazy.bytes > WEIGHT * 0.9 &&
    entry.bytes < WEIGHT * 0.1;

  const distAfter = fingerprint(join(pkg, 'dist'));
  const untouched = distAfter === distBefore;
  console.log(`  package dist unchanged by this run: ${untouched}`);

  if (!split) {
    console.error('  FAIL — the heavy area leaked into the entry chunk');
    process.exit(1);
  }
  if (!untouched) {
    console.error('  FAIL — this run modified the real dist/; the probe is not hermetic');
    process.exit(1);
  }
  console.log('  PASS — heavy area stayed lazy, and the package was not modified');
} finally {
  // The temporary tree is the ONLY thing that ever held injected content, so
  // discarding it is total — on success, on assertion failure, and on a throw
  // from the Vite build.
  if (workdir) rmSync(workdir, { recursive: true, force: true });
  const distFinal = fingerprint(join(pkg, 'dist'));
  if (distFinal !== distBefore) {
    console.error('  FAIL — dist/ differs after cleanup; injected content escaped');
    process.exitCode = 1;
  }
}
