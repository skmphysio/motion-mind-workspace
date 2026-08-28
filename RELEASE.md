# Release process — `@motionmind/workspace`

One repository, one package, one version, one release workflow, one rollback target.

## Toolchain

The release job runs on a **GitHub-hosted runner**, **Node 24**, **npm ≥ 11.5.1** — the minimum for
npm's trusted publishing (OIDC). `scripts/assert-release-toolchain.mjs` enforces both and is
unit-tested, including the case that defeats naïve comparison: `11.19.0` is *newer* than `11.5.1`
numerically but *older* lexically.

**Package-manager caching is disabled in the release job.** CI may cache; the release job resolves
fresh. Permissions are exactly `contents: read` and `id-token: write`.

## First publication bootstrap — read before the very first release

Trusted publishing is configured in npm's **package** settings, and those do not exist until the
package does. The first publish therefore cannot use OIDC.

**The bootstrap token cannot be restricted to `@motionmind/workspace`, because that package does not
yet exist.** Restrict it as tightly as npm allows at that moment:

| Setting | Value |
|---|---|
| Type | **Granular access token** (never a classic automation token) |
| Packages and scopes | **`@motionmind` scope only** — the claimed scope, nothing wider |
| Permission | **Read and write** on packages |
| Bypass 2FA | **Enabled** — required for an unattended CI publish |
| Organizations | **No organization administration permission** |
| Expiry | **The shortest npm offers** |

Then:

1. Add it as the repository secret **`NPM_BOOTSTRAP_TOKEN`**. It is consumed **only** by the release
   job — never on a laptop, never in another workflow.
2. Tag `v0.0.0-alpha.0`. The workflow detects the secret, takes the **bootstrap** publish path, and
   prints a warning naming the follow-up actions.
3. **Immediately** configure **OIDC trusted publishing** in the npm package settings, linking
   `@motionmind/workspace` to `skmphysio/motion-mind-workspace` and `release.yml`.
4. **Delete the `NPM_BOOTSTRAP_TOKEN` secret AND revoke the token on npm.** Both — deleting the
   secret alone leaves a live credential.
5. Tag `v0.0.0-alpha.1`. With the secret gone the workflow takes the **OIDC** path, proving the
   permanent release route. That second publish is the PR-0 completion gate.

### Two explicit publish paths, not a fallback

The workflow contains **two mutually exclusive publish steps**, selected by a `Detect publish mode`
step:

- **bootstrap** — runs only when `NPM_BOOTSTRAP_TOKEN` is non-empty, and receives `NODE_AUTH_TOKEN`.
- **oidc** — runs only when the secret is absent, and receives **no authentication token variable at
  all**.

This is deliberate. An empty `NODE_AUTH_TOKEN` is not a reliable instruction to npm to fall back to
OIDC; the OIDC path must run with the variable simply not present.

## Publishing (steady state)

```bash
npm version <new>
git tag v<new>
git push && git push --tags
```

The job re-runs the full gate set and the consumer matrix on the tagged commit, checks the tag
against the package version, then publishes.

## Versions in PR-0

| Version | Purpose |
|---|---|
| `0.0.0-alpha.0` | first publish — pipeline, contents, provenance, both consumers |
| `0.0.0-alpha.1` | second publish, **tokenless via OIDC** — the permanent path |

`0.1.0` belongs to Release 1's completed contracts. Do not publish it during PR-0.

## The enforced gates

`npm run gates` — the single command CI and the release job both run:

```
build · Campus tsconfig · Motion Mind tsconfig · tests
      · boundaries · published contents · publint · attw
```

Plus, in CI and on release: `verify:consumers` (npm × bun × React 18 × React 19, every subpath) and
`verify:lazy`.

`attw` ignores exactly one rule, `cjs-resolves-to-esm`: the package is ESM-only by design and both
consumers are ESM bundlers, which attw reports green. A negative test confirms that breaking the
`exports.types` entry still fails both `publint` and `attw`.

## The 24-hour release-age rule — VERIFIED, and it is a hard block

Campus's `bunfig.toml` sets `minimumReleaseAge = 86400`. A freshly published version does not warn;
`bun install` **fails to resolve it**:

```
error: No version matching "@motionmind/workspace" found for specifier "0.0.0-alpha.0"
       (blocked by minimum-release-age: 86400 seconds)
```

**The release order is fixed: publish → wait 24 hours → open the Campus adoption PR.** Motion Mind
(npm) is not subject to this, so a version may legitimately be live there a day earlier.

`minimumReleaseAgeExcludes` is **emergency-only and requires owner confirmation**, per the comment
already in Campus's `bunfig.toml`. See `scripts/verify-release-age.md` to reproduce the test.

## Version pinning

Both applications pin **exact** versions — `"@motionmind/workspace": "1.2.3"`, never `^` or `~`.
Lockfiles are committed; CI installs with `--frozen-lockfile`. Renovate and Dependabot must not
auto-bump `@motionmind/workspace`: a version move is deliberate, reviewed, and paired with the
parity gate it satisfies.

**Peer ranges must satisfy npm's resolver, not only bun's.** bun warns where npm fails, so a
bun-only check would let Motion Mind's install break while Campus stayed green. The consumer matrix
exercises both managers at both React majors for exactly this reason.

## Rollback

**Rollback is pinning the previous exact version** in the affected application and redeploying. No
code change, no republish. One package means one version to move.

- **Never `npm unpublish`.** It breaks consumers and is unavailable after 72 hours.
- Mark a bad version with `npm deprecate '@motionmind/workspace@<version>' 'Use <good>: <reason>'`.
- Every deletion PR in either application records the pre-deletion commit SHA and the exact package
  version that replaced it.

## Published contents

`scripts/check-package-contents.mjs` diffs the packed file list against `expected-contents.json`,
fails on any addition or removal, then scans for credential material. It earned its place during the
rehearsal by catching `dist/vitest.config.js` leaking into the tarball.
