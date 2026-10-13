# Install, update and bring your lists

[← HexStream Filter](../README.md)

## Pick the right file

Get files from [this repository's Releases page](https://github.com/ItsTripleSix/HexStream-Filter/releases).

| File | Purpose |
| --- | --- |
| `*-firefox-signed.xpi` | Normal, persistent Firefox installation. Leave it as an XPI; don't extract it. |
| `*-chrome.zip` | Chrome unpacked installation. Extract before loading. |
| `*-firefox.zip` | Unsigned Firefox development build; temporary loading only. |
| `*-Source.zip` | Source, tests, licenses and build instructions. Not an installable extension. |
| `SHA256SUMS.txt` | Checksums for the downloadable files. |

## Firefox — recommended

Requires desktop Firefox **142 or later**.

1. Download `HexStream-Filter-0.3.0-firefox-signed.xpi`.
2. Type `about:addons` in Firefox's address bar.
3. Open the gear menu and select **Install Add-on From File…**.
4. Choose the XPI, review Firefox's permission prompt and approve installation.
5. Reload every Twitch tab already open. Existing pages need the new scripts.
6. Open HexStream Filter from Firefox's extensions menu. Pin it if you want easy access.
7. Select **Manage your rules**. Add rules or import a JSON export, then **Save rules**.

Mozilla signing lets the XPI remain installed through browser restarts. It is self-distributed here on GitHub, without a public Mozilla store listing. You do not need a Mozilla developer account to install it.

For private-window browsing, explicitly allow HexStream in Firefox's add-on settings. Rules share that profile's extension storage; private browsing is not a separate rule profile. If the options page reports that HexStream is unavailable, try a normal window or check that private-window permission.

### Updating Firefox

1. **Export saved** once for safekeeping. Keep that backup private.
2. Download the new signed XPI from Releases.
3. Install it through the same **Install Add-on From File…** menu, without uninstalling the existing extension.
4. Reload Twitch tabs and verify your saved lists.

Normal updates use the same extension ID and storage key. There is currently **no automatic update URL**: a GitHub upload does not silently update an installed copy. Uninstalling or clearing extension data can remove settings; keep a backup before changing installations.

### Temporary Firefox development loading

Extract `*-firefox.zip`, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select its `manifest.json`. Reload Twitch. This installation disappears when Firefox closes. Export your rules before moving between temporary and permanent installations, and import the backup if necessary.

## Chrome

Requires desktop Chrome **120 or later**.

1. Download `HexStream-Filter-0.3.0-chrome.zip`.
2. Extract it into a permanent folder you control. Don't load it from inside the ZIP.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the extracted folder that contains `manifest.json`.
6. Reload Twitch tabs. Open HexStream Filter → **Manage your rules**.
7. Add or import rules and **Save rules**.

Keep the extracted folder: Chrome loads the extension from there. This is not a Chrome Web Store installation; Chrome can show a developer-extension notice.

### Updating Chrome

Export saved rules first. Close extension pages, replace the contents of the **same extracted folder** with the new Chrome package, then click HexStream's **Reload** control on `chrome://extensions`. Reload Twitch tabs. Don't remove/re-add it or move the folder unless you have a settings backup; unpacked extension identity can depend on its location.

## Import from Unwanted Twitch

1. Export your list as JSON from Unwanted Twitch.
2. Open HexStream → **Manage your rules** → **Import JSON**.
3. Choose the file. Review **Tags**, **Titles**, **Users**, **Categories** and any supported whitelist lists.
4. Choose **Save rules** to apply it. **Reload saved** cancels the draft.
5. Reload Twitch if needed. Pause the other filtering extension while comparing results so two sets of rules aren't changing the same cards.

An import replaces **all lists in the editor**, not just the selected tab. It does not merge into the existing draft. Export saved settings before replacing a configuration you want to keep. The import is validated; an error does not replace the saved configuration.

Ordinary Unwanted Twitch exports do not need **Compatible lists only**. That option is for files containing enabled phone-only controls that the browser cannot carry over. Open **Import options** below the editor to choose it deliberately. The omitted features are reported. [Format and matching limits →](FILTERING.md#imports-exports-and-limits)

## First useful check

Open a category directory, inspect a card with ⬡ and add one temporary rule using a field you can see. Save and confirm that the card hides. Pause filtering to restore it. Remove the test rule and save again. All default lists are empty, so merely installing HexStream should hide nothing.

## If something looks off

| Symptom | Check |
| --- | --- |
| Nothing is hidden | Filtering is enabled, rules are saved, and the field matches. Plain text is whole-field exact; use `~phrase` for a title containing a phrase. |
| It uses only visible tags | Complete metadata has not been supplied for that card/view. Let the directory load and inspect coverage. HexStream does not fetch missing tags itself. |
| A stream stays hidden after removing a rule | Check other lists, broad custom character rules and another filtering extension. **Why hidden?** shows recent evidence; inspect the current rules too. |
| A language preset seems impossible to turn off | A separate broad **Custom character rule** may still cover those characters. Uncheck it for the relevant field and save. |
| Changes don't apply | Choose **Save rules**. After an extension update, reload both the extension where required and existing Twitch tabs. |
| A stale-save message appears | Another editor/tab changed saved settings. Copy any draft you need, **Reload saved**, then reapply your edit. |
| No buttons appear in the sidebar | Intentional. Sidebar filtering works; inspection buttons are on main browsing cards. |
| An imported regex is rejected | Check the reported list/rule and [supported syntax](FILTERING.md#rule-syntax). Unsupported expressions are rejected rather than silently skipped. |

If a reproducible problem remains, [report it](https://github.com/ItsTripleSix/HexStream-Filter/issues/new) with browser/extension versions and steps. Don't attach a personal list or account credentials.
