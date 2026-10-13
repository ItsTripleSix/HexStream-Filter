# Rules, full tags and languages

[← HexStream Filter](../README.md) · [Install and update](INSTALLING.md)

## Lists and scope

All block and allow lists start empty. All language presets start off. Settings apply across Twitch accounts in the same browser profile; switching Twitch accounts does not reset them. Browsers and profiles have separate storage.

| Tab | What is matched |
| --- | --- |
| **Tags** | Every available tag name, including undisplayed custom tags when complete metadata is supplied. |
| **Titles** | The available stream, video or clip title. |
| **Users** | Channel login and display name. |
| **Categories** | Game/category names, including category tiles. |
| **Languages** | Character-range rules in Tags, Titles and Users, presented as field checkboxes. |
| **Whitelists** | Whole-channel exemptions and narrower field exceptions. |

One matching unprotected field is enough to hide an item. Turning filtering off restores loaded cards without deleting rules. The popup's **Why hidden?** view keeps up to 100 recent matches in that tab's memory; it is not a permanent log.

## Rule syntax

Put one rule on each line, then **Save rules**.

| Rule | Behavior |
| --- | --- |
| `MyTeam` | Whole-field exact match, ignoring case and accents. |
| `~myteam` | Contains match, ignoring case and accents. |
| `*myteam*` | The same contains behavior. |
| `/team(red\|blue)/i` | Regex search; case-insensitive here. |
| `'MyTeam'` | Literal whole-field match with exact case. |

Plain rules trim text, apply Unicode NFKD normalization, remove combining marks and lowercase. For example, an ordinary `cafe` rule can match `Café`. Quoted literal rules bypass that normalization. Regexes run on the original field, with supported flags `i`, `m`, `s`, `u`.

**Use `~` for phrases inside a title.** A plain `MyTeam` rule doesn't automatically match `MyTeamIsPerfect`.

The bundled RE2JS engine supports groups, alternatives and repetitions with linear-time matching. Lookarounds, backreferences and repetition counts above 1,000 are unsupported. Regex input is limited to the first 1,000 UTF-16 code units. Matching uses Unicode code points, and some boundary, end-anchor and Unicode semantics differ from native JavaScript or Android's Java regex engine. Imported regexes are validated, and a rejected expression is identified by list and rule number.

## Whitelists

| Choice | What it protects |
| --- | --- |
| **Always allow users** | The whole matching channel, bypassing every block list. |
| **User exceptions** | A matching login/display-name value from Users rules. Another name value or another field can still match. |
| **Title exceptions** | A matching title from Titles rules. Tags, Users and Categories still apply. |
| **Tag exceptions** | A matching tag from Tags rules. Other tags and other fields still apply. |

These lists use the same matching syntax. Allowing one tag does not allow every stream carrying it. Category tiles have no creator to exempt.

## Languages and existing character rules

Open **Manage your rules → Languages**. Search the presets, choose the fields for each row and save. There are **36 presets**, including extended Latin/accents, Cyrillic, Greek, Arabic, Hebrew, Han, Japanese kana, Korean Hangul and other writing systems. Unicode 17.0 ranges include supplementary characters. The extended Latin option includes common combining accents, which can also occur with other alphabets.

Each checkbox means **hide matches in that field**:

| Field | Checked by the rule |
| --- | --- |
| **Tags** | Available tag names. |
| **Titles** | Available titles. |
| **Users** | Login and display name. |

These controls detect **written characters**, not the language being spoken, a person's identity or a stream's declared language. Languages sharing an alphabet cannot be separated this way. To block a specific language tag by name, use the ordinary Tags list instead.

### Coming from a giant Unicode regex

Recognized pure Unicode character-range expressions appear as **Custom character rule** rows. **View rule** reveals the expression. The field checkboxes reflect where that exact rule already exists. Nothing is automatically converted or removed.

To replace a broad expression with finer choices:

1. Export saved settings for a private backup.
2. Open Languages and uncheck the custom expression for the fields you want to replace.
3. Check the named presets and fields you want instead.
4. **Save rules** and test the result. **Reload saved** cancels before saving.

Unchecking a field removes only that exact expression from that field. Named presets do not override another broad expression. Arbitrary non-range regexes stay in their ordinary lists.

Underneath, presets are ordinary regex entries in the existing Tags/Titles/Users arrays. They appear in the text editor and survive JSON export/import. There is no extra filtering pass or second settings store. Whitelists, pause, draft preservation and stale-save protection work the same way.

## Full tags and returning to a directory

The page bridge observes existing fetch/XHR responses from the exact HTTPS Twitch GraphQL endpoint. It projects bounded public fields—channel identity, display name, title, category and tags—into messages that are validated again by the isolated filtering script. Stored rules are never passed to the page.

Only a supplied `freeformTags` array establishes complete custom-tag coverage. Player/legacy tag arrays are partial evidence and cannot overwrite a known complete list. A complete list can contain tags absent from the card's visible chips; every supplied tag is checked.

The same connected card retains its last known metadata through shared-cache expiry and temporary chip/text removal. A fresh complete response replaces that evidence, including an empty list. Rule edits, exceptions and pause are reevaluated normally. Detached/recycled cards release or replace state, so another channel doesn't inherit the previous channel's match. This addresses rapid hide/unhide behavior after stream navigation, minimized-player browsing and idle/resume conditions.

The shared cache stays bounded at 2,000 items with a five-minute TTL. The bridge cache is capped at 500; recent explanations at 100. Retained card evidence belongs to connected DOM cards and is not saved to disk. Without a fresh complete response, the last received tags can remain in effect for that card.

Home, Search, live categories, category tiles, sidebar rows, clips and videos have live layout checks. Complete tags depend on the view and response; signed-in Following is not claimed as automated coverage. Archived clips/videos never borrow current live tags. The extension filters loaded content; it does not change Twitch's server pagination. [The Android app's pagination fix is separate.](https://github.com/ItsTripleSix/HexStream/blob/main/docs/PAGINATION.md)

## Imports, exports and limits

Import accepts compatible Unwanted Twitch or HexStream JSON with these list keys:

| JSON key | Editor list |
| --- | --- |
| `categories` | Categories |
| `channels` | Users |
| `tags` | Tags |
| `titles` | Titles |
| `allowedChannels` | Always allow users |
| `allowedUsernames` | User exceptions |
| `allowedTitles` | Title exceptions |
| `allowedTags` | Tag exceptions |

**Import JSON replaces every list in the editor for review. Save applies it; Reload saved discards it.** It is not an additive merge. Identical entries are deduplicated; surrounding whitespace is trimmed. A rejected import leaves saved settings intact.

The extension accepts up to **10,000 combined entries**, **4,096 characters per rule** and **2,000,000 characters per import**. The file chooser also rejects oversized files. The saved export contains these lists, the filtering toggle and settings format/revision fields; it contains no Twitch account credentials. **Export saved** exports the saved configuration and warns if the editor has unsaved changes.

Phone-only language detection, declared-language controls, followed-channel exemptions, allowed words and emoji settings cannot be transferred as browser features. If any unsupported feature is enabled/populated in an import, the normal import rejects it and explains why. **Import options → Compatible lists only** explicitly omits those settings. Ordinary Unwanted Twitch exports do not need that option.

## Using it with HexStream for Android

[HexStream for Android](https://github.com/ItsTripleSix/HexStream) is a separate Xtra-based native app. Its filters and the extension share compatible list concepts, not live storage or identical engines.

- Export/import compatible lists explicitly; there is no automatic phone/browser sync.
- The browser's Languages presets are regex entries. Android-specific language identification and emoji controls are separate features.
- Java and RE2JS regex dialects differ. Check validation and behavior when moving advanced expressions between them.
- Browser lists are global across Twitch accounts in that browser profile. Android lists/proxies are global across saved app accounts.
- Account login and notifications belong to the Android app/Twitch, not this filtering extension.

Keep exports private unless sharing the actual preferences is your intention.
