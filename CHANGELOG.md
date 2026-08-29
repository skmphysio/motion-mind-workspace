# Changelog — @motionmindpkg/workspace

### 0.0.0-alpha.2 — tokenless release proof (planned)
Republished with no `NPM_BOOTSTRAP_TOKEN` present, proving the permanent OIDC trusted-publishing
path. No source change from `alpha.1`.

### 0.0.0-alpha.1 — first publication
- Publish commands now pass an explicit `--tag`, derived from the version by
  `scripts/resolve-dist-tag.mjs`. npm 11 refuses to publish a prerelease without one; npm 10
  guessed `latest` and exited 0, so a rehearsal on npm 10 passed by doing the wrong thing.
- The preflight installs the same npm the release job uses and rehearses the real publish command
  under `--dry-run`, so an argument or manifest fault is caught before a tag is spent.
- `v0.0.0-alpha.0` was tagged but never published: the release failed at the publish call. Nothing
  under that version exists on the registry, and a published version is never reused.

### 0.0.0-alpha.0 — Release 1, task 1 (pending first publication)
- Package name is `@motionmindpkg/workspace`; the scope matches the `motionmindpkg` npm
  organisation.
- Consolidated into a single package at the repository root with five subpath exports:
  `contracts`, `client`, `react`, `companion`, `surfaces`.
- Contracts: surface and wire context, the Workspace route model and `/dashboard` compatibility
  map, the single note-preview rule, the host-adapter contract, and the vocabulary mirrors.
- Client: the injected-database contract — no framework, no singleton.
- React: `WorkspaceProvider` and hooks.
- Companion and surfaces: declared contracts; implementations arrive in Releases 2–4.
- Release engineering carried over from PR-0: toolchain assertion, dual TypeScript gates, published
  contents gate, provenance controls, release-age procedure.
- Added: boundary enforcement, a consumer matrix across npm and bun at React 18 and 19, and
  lazy-loading verification.
- Not consumed by any application. No production behaviour changes.

`0.1.0` is reserved for Release 1's completed contracts.
