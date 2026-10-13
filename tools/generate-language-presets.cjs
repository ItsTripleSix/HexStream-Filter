// Generate explicit ranges from Node's bundled Unicode Script data, never from user settings.
const fs = require('node:fs'), path = require('node:path');
const specifications = [
  ['latinExtended', 'Accented / extended Latin', 'Latin', 'é ñ ø', 'Latin accents European French Spanish Portuguese German Vietnamese Polish Czech Turkish Romanian Italian Dutch Swedish Finnish Danish Norwegian Hungarian Icelandic Croatian', true],
  ['cyrillic', 'Cyrillic', 'Cyrillic', 'Ж Д Я', 'Russian Ukrainian Bulgarian Serbian'],
  ['greek', 'Greek', 'Greek', 'Ω α β', 'Greek'],
  ['arabic', 'Arabic script', 'Arabic', 'ع ب ت', 'Arabic Persian Urdu'],
  ['hebrew', 'Hebrew', 'Hebrew', 'א ב ג', 'Hebrew Yiddish'],
  ['han', 'Han characters', 'Han', '漢 字 文', 'Chinese Japanese kanji'],
  ['kana', 'Japanese kana', ['Hiragana', 'Katakana'], 'ひ カ ナ', 'Japanese hiragana katakana'],
  ['hangul', 'Korean Hangul', 'Hangul', '한 글', 'Korean Hangul'],
  ['devanagari', 'Devanagari', 'Devanagari', 'अ क म', 'Hindi Marathi Nepali Sanskrit'],
  ['thai', 'Thai', 'Thai', 'ก ข ค', 'Thai'],
  ['armenian', 'Armenian', 'Armenian', 'Ա Բ Գ', 'Armenian'],
  ['georgian', 'Georgian', 'Georgian', 'ა ბ გ', 'Georgian'],
  ['bengali', 'Bengali', 'Bengali', 'অ ক ম', 'Bengali Bangla Assamese'],
  ['gurmukhi', 'Gurmukhi', 'Gurmukhi', 'ਅ ਕ ਮ', 'Punjabi Gurmukhi'],
  ['gujarati', 'Gujarati', 'Gujarati', 'અ ક મ', 'Gujarati'],
  ['odia', 'Odia', 'Oriya', 'ଅ କ ମ', 'Odia Oriya'],
  ['tamil', 'Tamil', 'Tamil', 'அ க ம', 'Tamil'],
  ['telugu', 'Telugu', 'Telugu', 'అ క మ', 'Telugu'],
  ['kannada', 'Kannada', 'Kannada', 'ಅ ಕ ಮ', 'Kannada'],
  ['malayalam', 'Malayalam', 'Malayalam', 'അ ക മ', 'Malayalam'],
  ['sinhala', 'Sinhala', 'Sinhala', 'අ ක ම', 'Sinhala Sinhalese'],
  ['lao', 'Lao', 'Lao', 'ກ ຂ ຄ', 'Lao Laotian'],
  ['tibetan', 'Tibetan', 'Tibetan', 'ཀ ཁ ག', 'Tibetan'],
  ['myanmar', 'Myanmar', 'Myanmar', 'က ခ ဂ', 'Myanmar Burmese'],
  ['khmer', 'Khmer', 'Khmer', 'ក ខ គ', 'Khmer Cambodian'],
  ['mongolian', 'Mongolian', 'Mongolian', 'ᠠ ᠡ ᠢ', 'Mongolian'],
  ['ethiopic', 'Ethiopic', 'Ethiopic', 'ሀ ለ መ', 'Amharic Tigrinya Ethiopic'],
  ['cherokee', 'Cherokee', 'Cherokee', 'Ꭰ Ꭱ Ꭲ', 'Cherokee'],
  ['canadian', 'Canadian syllabics', 'Canadian_Aboriginal', 'ᐁ ᐃ ᐅ', 'Inuktitut Cree syllabics'],
  ['tifinagh', 'Tifinagh', 'Tifinagh', 'ⴰ ⴱ ⴳ', 'Tamazight Berber Tifinagh'],
  ['yi', 'Yi', 'Yi', 'ꀀ ꀁ ꀂ', 'Yi'],
  ['lisu', 'Lisu', 'Lisu', 'ꓐ ꓑ ꓒ', 'Lisu'],
  ['vai', 'Vai', 'Vai', 'ꔀ ꔁ ꔂ', 'Vai'],
  ['bamum', 'Bamum', 'Bamum', 'ꚠ ꚡ ꚢ', 'Bamum'],
  ['ogham', 'Ogham', 'Ogham', 'ᚁ ᚂ ᚃ', 'Ogham'],
  ['runic', 'Runic', 'Runic', 'ᚠ ᚢ ᚦ', 'Runic'],
];
function escape(code) { return code <= 0xffff ? '\\u' + code.toString(16).toUpperCase().padStart(4, '0') : '\\u{' + code.toString(16).toUpperCase() + '}'; }
const presets = specifications.map(([id, label, scripts, sample, keywords, extended]) => {
  const tests = (Array.isArray(scripts) ? scripts : [scripts]).map(script => new RegExp('\\p{Script=' + script + '}', 'u'));
  const mark = /\p{M}/u;
  const ranges = []; let start = -1;
  for (let code = 0; code <= 0x110000; code++) {
    const accent = extended && ((code >= 0x300 && code <= 0x36f) || (code >= 0x1ab0 && code <= 0x1aff) || (code >= 0x1dc0 && code <= 0x1dff));
    const match = code <= 0x10ffff && (!extended || code > 0x7f) && (tests.some(test => test.test(String.fromCodePoint(code))) || (accent && mark.test(String.fromCodePoint(code))));
    if (match && start < 0) start = code;
    if (!match && start >= 0) { ranges.push(escape(start) + (code - 1 === start ? '' : '-' + escape(code - 1))); start = -1; }
  }
  const rule = '/[' + ranges.join('') + ']/u';
  if (rule.length > 4096) throw new Error('Preset exceeds rule limit: ' + id);
  return {id, label, sample, keywords, rule, ...(extended ? {note: 'Includes combining accents, which can also occur with other alphabets.'} : {})};
});
const target = path.resolve(__dirname, '../src/core/language-presets.js');
fs.writeFileSync(target, "// Generated from Unicode " + process.versions.unicode + " Script properties by tools/generate-language-presets.cjs.\n" +
  "(function(root){'use strict';const presets=" + JSON.stringify(presets, null, 2) + ";\n" +
  String.raw`const escape=String.raw\`\\u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})\`;
const characterRule=new RegExp('^/\\[(?:'+escape+'(?:-'+escape+')?)+\\]/[imsu]*$');
root.HexStreamLanguages=Object.freeze({PRESETS:Object.freeze(presets.map(Object.freeze)),SCOPES:Object.freeze(['tags','titles','channels']),isCharacterRule:rule=>typeof rule==='string'&&characterRule.test(rule)});
`.replaceAll('\\`','`') +
  "if(typeof module!=='undefined'&&module.exports)module.exports=root.HexStreamLanguages;\n})(globalThis);\n");
console.log('Generated ' + presets.length + ' writing-system presets using Unicode ' + process.versions.unicode + '.');
