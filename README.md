# @motionmindpkg/workspace

The **Motion Mind Workspace** — the individual's own space in the ecosystem, built once and
presented natively in both Motion Mind and Motion Mind Campus.

Workspace holds what belongs to the person rather than to an institution: Workspace Home, My
Learning, Notebook, Mentor, Growth Book, Profile, CV Export, personal files, and account and
credits. Institution-restricted Courses, Offerings, assignments and marks stay institution-governed
and are not part of Workspace.

One repository, one package, one version.

## Areas

Internal boundaries within a single package, reached through subpath exports.

| Subpath | Contains | May import |
|---|---|---|
| `@motionmindpkg/workspace/contracts` | Vocabulary, types, route model, pure rules | *nothing* |
| `@motionmindpkg/workspace/client` | Framework-independent data operations | contracts |
| `@motionmindpkg/workspace/react` | Hooks and providers | contracts, client, react |
| `@motionmindpkg/workspace/companion` | Mentor and the floating Notebook panel | contracts, client, react |
| `@motionmindpkg/workspace/surfaces` | Full Workspace pages — **load lazily** | all of the above |

The package root re-exports **contracts only**, so a bare import never pulls a renderer or a page
into a consumer's entry chunk.

Release 1 ships contracts, client and react as implementations, and companion and surfaces as their
declared contracts. The companion arrives in Release 2 and the surfaces in Releases 3–4; declaring
the boundaries now is what lets packaging, types and lazy loading be verified before any page
depends on them.

## Non-negotiable boundaries

- **`contracts` and `client` must never import React**, React Query, a router, or a module-level
  Supabase singleton. `scripts/check-boundaries.mjs` enforces this in CI and is negative-tested.
- **No package code constructs a Supabase client.** The authenticated client is always injected by
  the host, because the two applications build theirs differently.
- **Identifiers and display hints travel; content does not.** The gateway re-reads every referenced
  record under the caller's own JWT, so authorisation is decided by RLS server-side.
- **Everything must compile under BOTH hosts' TypeScript settings** — Campus's `strict` +
  `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`, and Motion Mind's looser settings.
  Two CI gates, neither optional.
- **React 18 and React 19 are both supported.** Motion Mind runs 18, Campus runs 19. The peer range
  is exercised in npm and bun at both majors rather than assumed.

## Routes

Workspace serves the same paths in both hosts: `/workspace`, `/workspace/learning`,
`/workspace/notebook`, `/workspace/growth`, `/workspace/profile`, `/workspace/account`.
`resolveLegacyWorkspacePath()` maps every `/dashboard…` URL to its Workspace equivalent, preserving
the remaining path so old bookmarks land where they used to.

Internal names are not renamed: database tables, RPCs, storage buckets and existing source
directories keep names containing "dashboard". Renaming stable objects adds migration risk without
changing anything a member sees.

## Commands

```bash
npm run gates              # build · both tsconfigs · tests · boundaries · contents · publint · attw
npm run verify:consumers   # npm × bun × React 18 × React 19, every subpath, exact version
npm run verify:lazy        # proves the heavy area stays out of the entry chunk
```

See `RELEASE.md` for publishing, the bootstrap procedure, the 24-hour release-age rule, and
rollback.
