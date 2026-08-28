# Release process

## Publishing

Publishing happens **only** from `.github/workflows/release.yml`, on a tag, through OIDC trusted
publishing with provenance. There is no long-lived npm token in any developer environment.

```
npm version <new> --workspace packages/workspace-contracts
git tag workspace-contracts@<new> && git push --tags
```

`publishConfig.provenance: true` makes `npm publish` **fail outside a supported CI provider**:

```
npm error EUSAGE Automatic provenance generation not supported for provider: null
```

Verified during the PR-0 rehearsal. **That refusal is the protection — never pass
`--provenance=false` in CI.** (The PR-0 local-registry rehearsal used the override deliberately,
against a throwaway registry, and only to exercise the consumer path.)

## The 24-hour release-age rule — VERIFIED, and it is a hard block

Campus's `bunfig.toml` sets `minimumReleaseAge = 86400`. A freshly published version does not
merely warn; `bun install` **fails to resolve it**:

```
error: No version matching "@motionmind/workspace-contracts" found for specifier "0.0.0-alpha.0"
       (blocked by minimum-release-age: 86400 seconds)
error: @motionmind/workspace-contracts@0.0.0-alpha.0 failed to resolve
```

**Therefore the release order is fixed:**

1. Publish the package version.
2. **Wait 24 hours.** This is the soak period, not an obstacle.
3. Open the Campus PR that bumps the pinned version.

Publishing and adopting in Campus on the same day will fail at `bun install`. Motion Mind (npm) is
not subject to this and can adopt immediately, so a version may legitimately be live in Motion Mind
a day before Campus.

**`minimumReleaseAgeExcludes` is emergency-only and requires owner confirmation**, per the comment
already in `bunfig.toml`. It works — verified — but adding `@motionmind/*` to it as standing policy
would discard the soak period the guard exists to provide.

## Version pinning

Both applications pin **exact** versions — `"@motionmind/workspace-contracts": "1.2.3"`, never `^`
or `~`. Lockfiles are committed; CI installs with `--frozen-lockfile`. Renovate/Dependabot must not
auto-bump `@motionmind/*`: a version move is deliberate, reviewed, and paired with the parity gate
it satisfies.

## Rollback

**Rollback is pinning the previous exact version** in the affected application and redeploying. No
code change, no republish.

- **Never `npm unpublish`.** It breaks consumers and is unavailable after 72 hours.
- Mark a bad version with `npm deprecate '@motionmind/<pkg>@<version>' 'Use <good version>: <reason>'`.
- Every deletion PR in either application records the pre-deletion commit SHA and the exact package
  version that replaced it.

## Published contents

`scripts/check-package-contents.mjs` diffs the packed file list against each package's
`expected-contents.json` and fails CI on any addition or removal, then scans for credential
material. It earned its place during the rehearsal by catching `dist/vitest.config.js` leaking into
the tarball.
