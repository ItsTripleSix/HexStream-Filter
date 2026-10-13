# Firefox signing source: HexStream Filter 0.3.0

This package contains the matching extension source, test sources, pinned dependencies, licenses and reproducible build instructions. Signing is for **unlisted self-distribution**. No public store listing is requested.

## Reproduce the package

Verified environment: Windows, Node.js **24.19.0**, pnpm **11.25.0**. Build scripts use portable Node APIs and require no Android SDK, browser profile, account credentials or private files. Other supported desktop operating systems can run the same build commands.

Install the named Node/pnpm versions from their official distributions or package registries, then run from this folder:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm build
pnpm lint
```

The Firefox payload is `dist/firefox/`; its unsigned ZIP is `artifacts/HexStream-Filter-0.3.0-firefox.zip`. ZIP entries have fixed timestamps and stable order. Mozilla adds its signing files afterward, so compare the unsigned extension payload rather than signature files.

The build copies readable files from `src/`, concatenates `core/metadata.js` and `bridge.js` into `bridge.bundle.js`, and writes the Firefox manifest. The two original files are included here. Distinct helper paths are intentional: Chromium uses different execution worlds for the page bridge and filtering scripts. No own source is minified or obfuscated.

`src/core/language-presets.js` is generated, readable preset data plus its small range-rule recognizer. Its complete source specification and generator are `tools/generate-language-presets.cjs`. Regenerate it with `node tools/generate-language-presets.cjs` under Node 24.19.0 (Unicode 17.0), then run the build above. It enumerates the runtime's Unicode Script properties into explicit code-point ranges, plus documented common combining-accent ranges for the extended Latin option. It takes no user files or settings as input and performs no downloads. The generated file is supplied as well, so ordinary source builds need not regenerate it. Unicode's notice is in `src/vendor/UNICODE-LICENSE.txt`.

The Languages page edits ordinary regex entries in the existing Tags/Titles/Users lists. It recognizes an imported pure Unicode range expression without converting it to a named preset. All new choices start off. No settings schema, filtering pass, metadata observer, permissions or network access are added.

`src/vendor/re2js.js` is the unmodified UMD distribution from **re2js 2.8.6** on npm. Its matching upstream MIT license is `src/vendor/RE2JS-LICENSE.txt`. The build verifies both files against the exact pinned dependency. Upstream project: https://github.com/le0pard/re2js. It is bundled locally, never downloaded or evaluated remotely by the extension.

## Exercise filtering

Open a public Twitch category directory and the extension's options. Lists begin empty. Add a temporary fictional rule or use an actual displayed public field solely for the test, save, and observe the matching card. Clear the test rules afterward. The card's inspector distinguishes complete supplied tags from visible-only data. A complete supplied tag absent from the card's visible chips is still checked.

`pnpm test` exercises imports, exact/contains/regex matching, all exception scopes, metadata sanitization, late and repeated responses, cache expiry, responsive layout changes, recycled cards, cross-tab updates and the options interface. Browser checks require stock Firefox and Chrome for Testing, with executable paths configured as described in README. They create isolated temporary profiles and do not require a Twitch login. Signed-in Following is not represented as verified.

## Permissions and privacy

The only extension API permission is `storage`. Host access is restricted to `https://www.twitch.tv/*`. The page bridge observes existing fetch/XHR responses from the exact HTTPS Twitch GraphQL endpoint and preserves the original request behavior. It does not read request headers, cookies, tokens, credentials or account storage. Sanitized public channel identity, title, category and tag names are projected into bounded memory caches. Page messages are untrusted and projected again in the isolated content script. Stored rules are never sent to the page.

Rules stay in local extension storage. There is no telemetry, remote executable code, extra Twitch API fetching, cloud synchronization, preloaded user list, cross-account data collection or bundled browser profile. Local metadata and recent explanations remain in memory. Imports require an explicit user-selected file; exports are explicit user downloads.

## Credit

Independent browser-extension implementation and assets by TripleSix. Unwanted Twitch inspired the filtering workflow and supplies the compatible import format. Its source and assets are not bundled. Xtra is credited as the foundation of the separate HexStream Android app; Android code is not included here. See CREDITS.md and LICENSE for attribution and licensing.
