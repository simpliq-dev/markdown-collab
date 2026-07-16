# Publishing

## GitHub Releases

GitHub Releases are the primary distribution channel for test builds and direct VSIX installation. They keep generated binaries out of repository history while providing stable, versioned downloads.

1) Update `CHANGELOG.md` and set the intended version with npm:

```bash
npm version 0.0.9 --no-git-tag-version
```

2) Commit and push the version change.

3) Create and push a tag. Tags containing a hyphen become prereleases:

```bash
git tag v0.0.9-test.1
git push origin v0.0.9-test.1
```

The `Publish GitHub release` workflow installs from the lockfile, runs the tests, builds the test kit, creates a ZIP, and publishes both the branded VSIX and complete kit on the repository's [Releases page](https://github.com/simpliq-dev/codex-collab/releases).

Use a stable tag such as `v0.0.9` only after the test build is accepted. Rerunning a tag workflow replaces assets on an existing release rather than creating duplicate releases.

## VS Code Marketplace

This repo is set up to be packaged and published with `vsce`.

## One-time setup

1) Create a publisher in the VS Code Marketplace.

2) Ensure `package.json` has the correct `publisher` value (this must match your Marketplace publisher ID).

3) Create a Personal Access Token (PAT) for publishing and sign in:

```bash
npx @vscode/vsce login <publisher>
```

## Release steps

1) Update `CHANGELOG.md`.

2) Bump the version:

```bash
npm version patch
# or: npm version minor
```

3) Build + package locally:

```bash
npm ci
npm run build
npm run package
```

4) Publish:

```bash
npm run publish
```

## Notes

- `npm run package` produces a `.vsix` file you can install locally for testing.
- `npm run test-kit` packages the extension and creates an ignored `release/markdown-collab-<version>-test-kit/` folder containing a branded VSIX, standalone agent guidance, installation README, and SHA-256 checksum.
- Generated test-kit binaries should be transferred directly or uploaded as GitHub Release assets rather than committed to repository history.
- If you have screenshots, add them to the README so they appear on the Marketplace listing.
