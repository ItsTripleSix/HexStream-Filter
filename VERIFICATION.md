# HexStream Filter 0.3.0 verification

## Verified results

The 0.3.0 release uses the locally tested executable payload approved by Mozilla for unlisted signing. Public documentation and project links were prepared separately; they do not alter the installable payload.

- **98 automated tests passed**: matching/imports, all exception scopes, metadata sanitization, card lifecycle, stale saves, options UI and Languages behavior.
- **57 browser checks passed** across Firefox **157.0.1** and Chrome for Testing **155.0.8059.39**: 37 regression/UI checks plus 20 wider live-layout/performance checks.
- **Mozilla web-ext: zero errors, warnings or notices.** Mozilla's online package validation also reported zero errors or warnings.
- Both browsers verified live filtering using a supplied tag absent from the visible chips. In the final regression runs, the sampled stream supplied seven tags while three chips were visible. Counts are observations, not a promise about every stream.
- Compatible private exports were exercised only as optional local inputs. They imported and saved intact, were cleared afterward and never entered source, fixtures, packages or screenshots. All eight default lists remain empty.
- The submitted source rebuilt byte-identical Firefox and Chrome unsigned ZIPs. The signed XPI retains the audited executable bytes; Mozilla adds signature metadata and normalizes the manifest's final newline.
- Release artifacts are built locally. GitHub Actions is not required.

## Languages and interface

All 36 presets compile through the bundled linear-time engine, match writing-system samples and leave plain ASCII game text alone. Supplementary Han/kana, decomposed accents, scope independence, pause/whitelists, compatible exports, strict custom-range recognition and the combined-rule limit are covered.

Existing custom character expressions are preserved after normal surrounding-whitespace trimming. Draft/save/reload, search, independent field choices and stale editor protection are exercised. The helper adds no metadata observer, extra filtering pass, settings schema, permissions or network calls.

Chrome's actual Languages page was rendered at desktop and 390-pixel widths with no horizontal overflow. Firefox's actual options page exercised search, empty defaults and independent scope saves. The Firefox test protocol does not screenshot privileged extension pages; the public screenshot is a clean-default Chrome rendering of the shared UI.

## Filtering stability and coverage

Tests cover partial player responses, complete-list replacement (including empty lists), responsive chip removal, navigation/back events, cache expiry, recycled cards and wrapper changes. Only complete supplied freeform tags establish complete coverage. Partial data cannot erase a known complete list.

The earlier 0.2.2 Firefox soak held a filtered card across **310 seconds** of repeated player-shaped responses and resume events, producing **zero hidden-attribute changes** past the five-minute shared-cache expiry. That longer soak was not repeated for the 0.3.0 options-page feature. The corresponding runtime remains unchanged.

Live layout checks cover Home, Search, category directories, category tiles, sidebar rows, clips and videos. External help links are not treated as channel identities. Nested selectors share one visibility decision; obsolete wrappers release their hidden state. Main browsing buttons remain compact at 24 × 24 pixels, with no added sidebar buttons.

## Efficiency

Exact rules use indexes; regexes use pinned bundled RE2JS 2.8.6. Metadata caches are bounded to 2,000 filtering-side items and 500 bridge items, with a five-minute shared TTL. Recent explanations are capped at 100. Additional last-known evidence belongs only to connected DOM cards and is never persisted.

Content tests instrument the same JavaScript realm and verify **zero full scans** for repeated unrelated player/chat text changes. New cards, relevant field edits, rule changes, fresh metadata, navigation and resume still trigger evaluation. Identical metadata refreshes TTL without scheduling a redundant scan.

Both browsers processed a synthetic **500-card / 10,000-exact-rule** batch with **zero visibility transitions** during ten unrelated player updates. Observed initial timings were 438 ms in Firefox and 98.3 ms in Chrome, including deliberate 80 ms batching, DOM work and concurrent test load. These are local stress observations, not performance guarantees. No extra Twitch API fetching or thumbnail preloading is introduced.

## Practical limits

- Complete tags depend on Twitch supplying them. Partial coverage is labeled, and archived clips/videos never borrow current live tags.
- Signed-in Following, all Twitch experiments, arbitrary other-extension combinations and multi-hour authenticated sessions are not claimed as automated coverage. Synthetic player/navigation conditions supplement real-world browsing.
- Writing-system presets inspect written characters, not speech or declared stream language. Shared alphabets cannot distinguish languages; combining accents can overlap.
- Phone-only language identification, followed-channel exemptions, allowed words and emoji controls are unsupported browser features. Enabled unsupported import settings require an explicit compatible-lists-only choice.
- Lookarounds, backreferences and repetition counts above 1,000 are unsupported. Java, JavaScript and RE2 regex dialects differ; regex inputs are capped at 1,000 UTF-16 code units.
- Firefox is signed for self-distribution, without a public store listing. Chrome uses manual unpacked loading. No automatic update URL is configured.
- Reload existing Twitch tabs after installation/update. Normal updates retain the extension ID and settings storage key; export saved rules before changing installations.

See [installation](docs/INSTALLING.md), [matching details](docs/FILTERING.md), [build instructions](docs/DEVELOPMENT.md) and [signing-source notes](REVIEW.md).
