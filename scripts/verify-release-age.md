# Verifying the 24-hour release-age rule against a real registry

`scripts/verify-consumers.mjs` installs from a packed tarball, which deliberately does **not**
exercise Campus's `minimumReleaseAge` guard — that applies only to registry publishes. To reproduce
the registry behaviour (as done in PR-0):

```bash
npm i --no-save verdaccio@6
mkdir -p /tmp/vd && cat > /tmp/vd/config.yaml <<'EOF'
storage: ./storage
auth: { htpasswd: { file: ./htpasswd, max_users: 1000 } }
uplinks: { npmjs: { url: https://registry.npmjs.org/ } }
packages:
  '@motionmindpkg/*': { access: $all, publish: $authenticated }
  '**':            { access: $all, proxy: npmjs }
EOF
npx verdaccio --config /tmp/vd/config.yaml --listen 4874 &
# register a publisher, then:
npm publish --registry http://localhost:4874 --provenance=false   # override ONLY against a throwaway registry
```

Then in a consumer carrying Campus's `bunfig.toml`:

```toml
[install]
registry = "http://localhost:4874/"
minimumReleaseAge = 86400
```

**Expected — and observed in PR-0:**

```
error: No version matching "@motionmindpkg/workspace" found for specifier "0.0.0-alpha.0"
       (blocked by minimum-release-age: 86400 seconds)
error: @motionmindpkg/workspace@0.0.0-alpha.0 failed to resolve
```

Adding `minimumReleaseAgeExcludes = ["@motionmindpkg/workspace"]` lifts the block and the
package installs at the exact pinned version. That is the emergency path only — see `RELEASE.md`.

Notes from the PR-0 run:
- npm ignores a package-level `.npmrc` inside a workspace; registry auth must sit at the repo root.
- npm and bun recorded the **same** sha512 integrity for the same tarball.
