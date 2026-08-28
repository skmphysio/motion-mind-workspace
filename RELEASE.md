# Release process

## Toolchain

The release job runs on a **GitHub-hosted runner**, on **Node 24**, with **npm ≥ 11.5.1** — the
minimum for npm's trusted publishing (OIDC). `scripts/assert-release-toolchain.mjs` enforces both
and is unit-tested, including the case that bites naïve comparisons: `11.19.0` is *newer* than
`11.5.1` numerically but *older* lexically.

**Package-manager caching is disabled in the release job.** CI may cache; the release job resolves
fresh.

Permissions are exactly `contents: read` and `id-token: write`.

## First publication bootstrap — read before the first release of any new package name

Trusted publishing is configured in npm's **package** settings, and those do not exist until the
package does. The first publish of a brand-new name therefore cannot use OIDC. The bootstrap is
deliberately narrow and short-lived:

1. Create a **granular access token** on npm, scoped to **`@motionmind/workspace-contracts` only**,
   **read-and-write**, with the **shortest expiry** npm allows. Do not use a classic automation
   token, and do not scope it to the whole account or organisation.
2. Add it as the repository secret **`NPM_BOOTSTRAP_TOKEN`**. It is consumed **only** by the
   release job — never on a laptop, never in another workflow.
3. Tag the release. The job publishes with `--access public`, with provenance, and prints a warning
   that a bootstrap token was used.
4. **Immediately** configure **OIDC trusted publishing** in the npm package settings, linking
   `@motionmind/workspace-contracts` to `skmphysio/motion-mind-workspace` and the `release.yml`
   workflow.
5. **Delete the `NPM_BOOTSTRAP_TOKEN` secret and revoke the token on npm.** Both. Deleting the
   secret without revoking leaves a live credential.
6. Publish the **second alpha** to prove the tokenless path. With the secret gone, `NODE_AUTH_TOKEN`
   is empty and the same step falls back to OIDC — no workflow edit. That second publish **is** the
   PR-0 gate for the permanent release path.

The publish step handles both modes and needs no change between them.

## Publishing (steady state)

```bash
npm version <new> --workspace packages/workspace-contracts
git tag workspace-contracts@<new>
git push && git push --tags
```

The job re-runs the **full enforced gate set** on the tagged commit, checks the tag against the
package version, then publishes.

`publishConfig.provenance: true` additionally makes `npm publish` **fail outside a supported CI
provider**:

```
npm error EUSAGE Automatic provenance generation not supported for provider: null
```

Verified during the PR-0 rehearsal. **That refusal is the protection — never pass
`--provenance=false` in CI.** (The PR-0 local-registry rehearsal used the override deliberately,
against a throwaway registry, purely to exercise the consumer path.)

## Versions in PR-0

PR-0 is a **release-pipeline rehearsal** and stays on alpha versions:

| Version | Purpose |
|---|---|
| `0.0.0-alpha.0` | first publish; proves the pipeline, contents, provenance and both consumers |
| `0.0.0-alpha.1` | second publish, **tokenless via OIDC**; proves the permanent release path |

**`0.1.0` belongs to PR-1** — the completed Layer 1 contracts. Do not publish it during PR-0.

## The enforced gates

`npm run gates` — the single command CI and the release job both run:

```
build · Campus tsconfig · Motion Mind tsconfig · tests
      · published contents · publint · attw
```

`publint` and `attw` are **inside** the gate, so they run before every publication rather than only
during manual verification.

`attw` ignores exactly one rule, `cjs-resolves-to-esm`, and nothing else. These packages are
ESM-only by design and both consumers are ESM/Vite bundlers, which attw reports green; there is no
CJS consumer. A negative test confirms that breaking the `exports.types` entry still fails both
`publint` and `attw`.

## The 24-hour release-age rule — VERIFIED, and it is a hard block

Campus's `bunfig.toml` sets `minimumReleaseAge = 86400`. A freshly published version does not merely
warn; `bun install` **fails to resolve it**:

```
error: No version matching "@motionmind/workspace-contracts" found for specifier "0.0.0-alpha.0"
       (blocked by minimum-release-age: 86400 seconds)
error: @motionmind/workspace-contracts@0.0.0-alpha.0 failed to resolve
```

**The release order is therefore fixed: publish → wait 24 hours → open the Campus adoption PR.**
Publishing and adopting on the same day will fail at `bun install`. Motion Mind (npm) is not subject
to this, so a version may legitimately be live in Motion Mind a day before Campus — worth
remembering when a parity gate spans both.

`minimumReleaseAgeExcludes` is **emergency-only and requires owner confirmation**, per the comment
already in Campus's `bunfig.toml`. It works — verified — but adding `@motionmind/*` as standing
policy would discard the soak period the guard exists to provide.

See `scripts/verify-release-age.md` to reproduce the test.

## Version pinning

Both applications pin **exact** versions — `"@motionmind/workspace-contracts": "1.2.3"`, never `^`
or `~`. Lockfiles are committed; CI installs with `--frozen-lockfile`. Renovate/Dependabot must not
auto-bump `@motionmind/*`: a version move is deliberate, reviewed, and paired with the parity gate
it satisfies.

## Rollback

**Rollback is pinning the previous exact version** in the affected application and redeploying. No
code change, no republish.

- **Never `npm unpublish`.** It breaks consumers and is unavailable after 72 hours.
- Mark a bad version with
  `npm deprecate '@motionmind/<pkg>@<version>' 'Use <good version>: <reason>'`.
- Every deletion PR in either application records the pre-deletion commit SHA and the exact package
  version that replaced it.

## Published contents

`scripts/check-package-contents.mjs` diffs the packed file list against each package's
`expected-contents.json`, fails CI on any addition or removal, then scans for credential material.
It earned its place during the rehearsal by catching `dist/vitest.config.js` leaking into the
tarball.
