import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findViolations, RULES } from './check-boundaries.mjs';

/** Build a throwaway src tree so the negative cases test the real function. */
function tree(files) {
  const root = mkdtempSync(join(tmpdir(), 'boundary-'));
  for (const area of Object.keys(RULES)) mkdirSync(join(root, area), { recursive: true });
  for (const [path, body] of Object.entries(files)) writeFileSync(join(root, path), body);
  return root;
}

describe('boundary rules', () => {
  it('passes the real package', () => {
    expect(findViolations('src')).toEqual([]);
  });

  it('catches React in client — the rule that matters most', () => {
    const root = tree({ 'client/index.ts': "import { useMemo } from 'react';\n" });
    expect(findViolations(root).map((v) => v.rule)).toContain('react');
  });

  it('catches React, React Query, a router and a Supabase singleton in contracts', () => {
    for (const [body, rule] of [
      ["import { useState } from 'react';", 'react'],
      ["import { useQuery } from '@tanstack/react-query';", 'react-query'],
      ["import { Link } from 'react-router-dom';", 'router'],
      ["import { createClient } from '@supabase/supabase-js';", 'supabase-sdk'],
      ["import { supabase } from '@/integrations/supabase/client';", 'supabase-singleton'],
    ]) {
      const root = tree({ 'contracts/index.ts': body + '\n' });
      expect(findViolations(root).map((v) => v.rule), body).toContain(rule);
    }
  });

  it('allows what the areas legitimately need', () => {
    const root = tree({
      'contracts/index.ts': "export const A = 1;\n",
      'client/index.ts': "import { A } from '../contracts/index.js';\nexport const B = A;\n",
    });
    expect(findViolations(root)).toEqual([]);
  });

  it('ignores test files, which may import anything', () => {
    const root = tree({ 'client/index.test.ts': "import { render } from 'react-dom';\n" });
    expect(findViolations(root)).toEqual([]);
  });
});
