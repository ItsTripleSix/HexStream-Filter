# Credits

HexStream Filter by TripleSix is an independent browser extension. Its implementation, interface and branding were written for HexStream. No Unwanted Twitch source code or artwork is bundled.

[Unwanted Twitch by kwaschny](https://github.com/kwaschny/unwanted-twitch) established the useful channel/category/tag/title blocking workflow. HexStream supports compatible list imports and credits that inspiration. Compatibility does not imply affiliation or endorsement.

The HexStream logo is shared with [HexStream for Android](https://github.com/ItsTripleSix/HexStream). The Android app is based on Xtra by Andrey Asadchy, maintained by crackededed and other contributors. This extension does not bundle Xtra's Android implementation.

Regex matching uses [RE2JS 2.8.6 by Oleksii Vasyliev](https://github.com/le0pard/re2js), under the MIT license. Its unmodified browser bundle and upstream license are included in `src/vendor/`. This library is separate from Unwanted Twitch and provides linear-time regex matching.

Writing-system presets use Unicode 17.0 Script properties supplied by the pinned Node.js development runtime. The reproducible generator is included in `tools/`; no Unicode data is fetched at runtime. Unicode's copyright and permission notice is included in `src/vendor/UNICODE-LICENSE.txt`. Combining-accent ranges are identified separately from Script membership.

The extension is licensed under AGPL-3.0-only. Third-party components retain their respective licenses. Development tools are separate dependencies; no code is loaded from a CDN at runtime.
