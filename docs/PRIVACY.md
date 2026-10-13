# Privacy

[← HexStream Filter](../README.md)

## What stays where

| Data | Location |
| --- | --- |
| Saved rules, exceptions and filtering toggle | Local extension storage in the current browser profile. |
| Public channel/title/category/tag metadata | Bounded memory caches while Twitch pages run. |
| Recent “Why hidden?” explanations | Current tab's memory, capped at 100. |
| Exported rules | A JSON file you explicitly download. |

All default lists are empty. Language choices start off. No personal blocklist is included. Rules are not uploaded, cloud-synced or sent to the page.

## Permissions and page access

The only extension API permission is `storage`. Host access is limited to `https://www.twitch.tv/*`. There is no browser cookies, browsing-history or identity API permission.

To see tags omitted from the card, the extension observes Twitch's existing responses from its exact HTTPS GraphQL endpoint. It does not add Twitch API calls, read request authentication headers, collect cookies or copy account storage. Only selected public fields—channel identity, display name, title, category and tag names—cross the metadata bridge.

The page-side bridge runs in Twitch's page environment, which Twitch can inspect or modify. Messages are untrusted and projected/validated again before use. The bridge receives no stored rules and exposes no extension settings-mutation command to the page.

There is no telemetry, external analytics, remote executable code or extension account. The regex engine and Unicode preset data are bundled locally. Twitch and the browser still make their own normal requests.

## Backups and bug reports

Exports reveal your preferences, including channel choices. Keep backups somewhere private. You do not need to attach your personal export to report a bug; use a small fictional example that reproduces it.

Do not post tokens, cookies, account credentials or unsanitized browser logs. Uninstalling or clearing extension data can remove settings, so export first if you intend to keep them.

## Downloads and updates

Firefox packages are Mozilla-signed for self-distribution through GitHub. Signing does not create a public store listing. Chrome packages use manual unpacked loading. Updates currently require downloading/installing a new package; there is no automatic update URL or extension-operated update service.

GitHub, Mozilla and your browser handle their own download/signing infrastructure under their own policies. [Installation and update steps →](INSTALLING.md)
