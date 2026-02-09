# Publishing (VS Code Marketplace)

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
- If you have screenshots, add them to the README so they appear on the Marketplace listing.
