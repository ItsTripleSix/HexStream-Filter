# Local builds and tests

[← HexStream Filter](../README.md) · [Verification results](../VERIFICATION.md) · [Firefox signing source notes](../REVIEW.md)

## Reproduce a browser package

Verified environment: **Node.js 24.19.0**, **pnpm 11.25.0**, Windows. Build scripts use portable Node APIs and need no Android SDK, account credentials, private rules or GitHub Actions.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm build
pnpm lint
```

`pnpm build` creates Firefox/Chrome folders under `dist/` and deterministic unsigned ZIPs under `artifacts/`. ZIP entries have fixed timestamps and stable order. Mozilla adds signatures separately; compare the unsigned payload, not the added signature files. The signed manifest's final newline can be normalized without changing its data.

Readable extension source is in `src/`. The build concatenates `core/metadata.js` and `bridge.js` into `bridge.bundle.js`, copies the source/vendor files and generates the browser manifests. MAIN and isolated-world helpers intentionally have distinct paths. Own source is not minified or obfuscated.

The build verifies the bundled RE2JS runtime and license against the pinned `re2js 2.8.6` dependency. Browser profiles, user settings, screenshots, test reports, caches and test frameworks are excluded from installable packages.

## Unicode presets

`src/core/language-presets.js` is generated readable data plus a small recognizer. The complete generator/specification is `tools/generate-language-presets.cjs`. To deliberately regenerate:

```sh
node tools/generate-language-presets.cjs
pnpm test
pnpm build
```

Use Node 24.19.0 for the verified Unicode 17.0 data. The generator enumerates the runtime's Unicode Script properties and documented combining-mark ranges. It takes no user settings/files and downloads nothing. The generated file is included, so a normal build need not regenerate it. The Unicode notice is bundled in `src/vendor/UNICODE-LICENSE.txt`.

## Browser checks

Set `FIREFOX_BINARY` and `CHROME_BINARY` to suitable browser executables, then:

```sh
pnpm test:browsers
node tools/compatibility-tests.cjs
```

Use Chrome for Testing with extension-loading support. The suite creates isolated profiles and checks synthetic Twitch-shaped responses, actual options pages, public live Twitch layouts, hidden tags, navigation/card lifecycle, imports, independent Languages scopes and a 500-card / 10,000-exact-rule stress case. Firefox's test installation grants private-window access only inside its temporary test context. Authenticated Following is not represented as verified.

For the cache-expiry regression, set `HEXSTREAM_TEST_BROWSER=firefox` and `HEXSTREAM_SOAK_MS=310000`. The test holds a card across repeated player-shaped responses and resume events beyond five minutes, checking for visibility transitions. Synthetic lifecycle checks supplement real browsing; they do not prove every authenticated player session is covered.

An optional `HEXSTREAM_PRIVATE_IMPORT` variable can point to a locally chosen export for an additional import/save check. Contents stay in memory and the isolated profile, are cleared after the check and never enter fixtures, screenshots, packages or reports. Test profiles are removed after browser shutdown. Prefer fictional inputs for shared bug reports and development.

## Distribution

Releases are assembled from locally tested artifacts. GitHub stores source and downloads; no workflow or Actions minutes are required. Firefox signing is a separate unlisted Mozilla submission. Repository documentation can change without altering the signed extension's executable payload.

Keep published source sufficient to reproduce the unsigned packages. Include licenses, attribution, tests, generator and the lockfile; exclude credentials, profiles, private exports, build caches and dependencies. See [CREDITS.md](../CREDITS.md), [LICENSE](../LICENSE) and [REVIEW.md](../REVIEW.md).
