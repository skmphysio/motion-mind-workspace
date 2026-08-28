/**
 * Internal boundary enforcement.
 *
 * One package, five areas — but the areas are not interchangeable. `contracts`
 * must stay dependency-free so it compiles under both hosts' TypeScript
 * settings, and `client` must stay framework-independent so the data layer is
 * usable and testable without a renderer.
 *
 * These are the rules that stop one package quietly becoming a tangle. Each is
 * negative-tested by `check-boundaries.test.mjs`, so the check fails when
 * violated rather than merely existing.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** A module-level Supabase singleton binds the package to one host's client. */
const SUPABASE_SINGLETON = /import\s+\{[^}]*\bsupabase\b[^}]*\}\s+from|from\s+['"][^'"]*integrations\/supabase\/client['"]/;

export const RULES = {
  contracts: [
    { name: 'react', re: /from\s+['"]react(-dom)?['"]/ },
    { name: 'react-query', re: /@tanstack\/react-query/ },
    { name: 'router', re: /react-router|@tanstack\/react-router/ },
    { name: 'supabase-sdk', re: /@supabase\// },
    { name: 'supabase-singleton', re: SUPABASE_SINGLETON },
  ],
  client: [
    { name: 'react', re: /from\s+['"]react(-dom)?['"]/ },
    { name: 'react-query', re: /@tanstack\/react-query/ },
    { name: 'router', re: /react-router|@tanstack\/react-router/ },
    { name: 'supabase-singleton', re: SUPABASE_SINGLETON },
  ],
};

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

/** Returns the violations found, so the test can assert on them directly. */
export function findViolations(root = 'src') {
  const violations = [];
  for (const [area, rules] of Object.entries(RULES)) {
    const dir = join(root, area);
    for (const file of walk(dir)) {
      if (!/\.tsx?$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
      const body = readFileSync(file, 'utf8');
      for (const rule of rules) {
        if (rule.re.test(body)) violations.push({ file, area, rule: rule.name });
      }
    }
  }
  return violations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = findViolations();
  for (const v of violations) console.error(`  FAIL  ${v.file} — ${v.area} may not import ${v.rule}`);
  if (violations.length) process.exit(1);
  console.log('  PASS — contracts and client honour their boundaries');
}
