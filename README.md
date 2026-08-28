# Motion Mind Workspace packages

The single source for the **personal Workspace** — the individual's persistent layer across
Motion Mind and Motion Mind Campus. Both applications consume these packages at exact pinned
versions; neither keeps its own copy.

| Package | Layer | Contains | May import |
|---|---|---|---|
| `@motionmind/workspace-contracts` | 1 | types, pure functions, shared behavioural rules | *nothing* |
| `@motionmind/workspace-client` | 2 | data access, streaming, query-key factories | contracts |
| `@motionmind/workspace-react` | 3 | React Query hooks binding Layer 2 to React | 1, 2 |
| `@motionmind/workspace-companion` | 4 | the floating Mentor + Notebook companion | 1–3 |
| `@motionmind/workspace-surfaces` | 5 | full-page Workspace surfaces | 1–4 |

Only `workspace-contracts` exists today (`0.0.0-alpha.0`, a release-pipeline rehearsal). The rest
land in the approved phases.

## Non-negotiable boundaries

- **`workspace-client` must never import React**, `react-dom`, `@tanstack/react-query`, or any
  router. CI enforces this. React Query hooks belong in `workspace-react`.
- **No package ever contains a Supabase URL, key, or singleton.** The authenticated client is
  always injected by the host. The published-contents gate scans for credential material.
- **Packages hold identifiers and display hints, never content.** The gateway re-reads every
  referenced record under the caller's own JWT; authorisation is decided by RLS server-side.
- **Every package must compile under BOTH consuming configurations** — Campus's `strict` +
  `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`, and Motion Mind's looser settings.
  Two CI gates, neither optional.
- **Peer ranges must satisfy npm's resolver, not only bun's.** bun accepts peer mismatches npm
  rejects, so a bun-only check would let Motion Mind's `npm install` break while Campus stays green.

## Gates

```
npm run gates   # build · Campus tsconfig · Motion Mind tsconfig · tests · published contents
node scripts/verify-consumers.mjs   # exact-version install in npm AND bun, with a behaviour smoke test
```

See `RELEASE.md` for publishing, the 24-hour release-age rule, rollback and deprecation.
