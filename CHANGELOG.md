# Changelog — @motionmind/workspace

### 0.0.0-alpha.1 — tokenless release proof (planned)
Republished with no `NPM_BOOTSTRAP_TOKEN` present, proving the permanent OIDC trusted-publishing
path. No source change from `alpha.0`.

### 0.0.0-alpha.0 — Release 1, task 1 (pending first publication)
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
