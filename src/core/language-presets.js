// Generated from Unicode 17.0 Script properties by tools/generate-language-presets.cjs.
(function(root){'use strict';const presets=[
  {
    "id": "latinExtended",
    "label": "Accented / extended Latin",
    "sample": "é ñ ø",
    "keywords": "Latin accents European French Spanish Portuguese German Vietnamese Polish Czech Turkish Romanian Italian Dutch Swedish Finnish Danish Norwegian Hungarian Icelandic Croatian",
    "rule": "/[\\u00AA\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02B8\\u02E0-\\u02E4\\u0300-\\u036F\\u1AB0-\\u1ADD\\u1AE0-\\u1AEB\\u1D00-\\u1D25\\u1D2C-\\u1D5C\\u1D62-\\u1D65\\u1D6B-\\u1D77\\u1D79-\\u1DBE\\u1DC0-\\u1EFF\\u2071\\u207F\\u2090-\\u209C\\u212A-\\u212B\\u2132\\u214E\\u2160-\\u2188\\u2C60-\\u2C7F\\uA722-\\uA787\\uA78B-\\uA7DC\\uA7F1-\\uA7FF\\uAB30-\\uAB5A\\uAB5C-\\uAB64\\uAB66-\\uAB69\\uFB00-\\uFB06\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\u{10780}-\\u{10785}\\u{10787}-\\u{107B0}\\u{107B2}-\\u{107BA}\\u{1DF00}-\\u{1DF1E}\\u{1DF25}-\\u{1DF2A}]/u",
    "note": "Includes combining accents, which can also occur with other alphabets."
  },
  {
    "id": "cyrillic",
    "label": "Cyrillic",
    "sample": "Ж Д Я",
    "keywords": "Russian Ukrainian Bulgarian Serbian",
    "rule": "/[\\u0400-\\u0484\\u0487-\\u052F\\u1C80-\\u1C8A\\u1D2B\\u1D78\\u2DE0-\\u2DFF\\uA640-\\uA69F\\uFE2E-\\uFE2F\\u{1E030}-\\u{1E06D}\\u{1E08F}]/u"
  },
  {
    "id": "greek",
    "label": "Greek",
    "sample": "Ω α β",
    "keywords": "Greek",
    "rule": "/[\\u0370-\\u0373\\u0375-\\u0377\\u037A-\\u037D\\u037F\\u0384\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03E1\\u03F0-\\u03FF\\u1D26-\\u1D2A\\u1D5D-\\u1D61\\u1D66-\\u1D6A\\u1DBF\\u1F00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FC4\\u1FC6-\\u1FD3\\u1FD6-\\u1FDB\\u1FDD-\\u1FEF\\u1FF2-\\u1FF4\\u1FF6-\\u1FFE\\u2126\\uAB65\\u{10140}-\\u{1018E}\\u{101A0}\\u{1D200}-\\u{1D245}]/u"
  },
  {
    "id": "arabic",
    "label": "Arabic script",
    "sample": "ع ب ت",
    "keywords": "Arabic Persian Urdu",
    "rule": "/[\\u0600-\\u0604\\u0606-\\u060B\\u060D-\\u061A\\u061C-\\u061E\\u0620-\\u063F\\u0641-\\u064A\\u0656-\\u066F\\u0671-\\u06DC\\u06DE-\\u06FF\\u0750-\\u077F\\u0870-\\u0891\\u0897-\\u08E1\\u08E3-\\u08FF\\uFB50-\\uFD3D\\uFD40-\\uFDCF\\uFDF0-\\uFDFF\\uFE70-\\uFE74\\uFE76-\\uFEFC\\u{10E60}-\\u{10E7E}\\u{10EC2}-\\u{10EC7}\\u{10ED0}-\\u{10ED8}\\u{10EFA}-\\u{10EFF}\\u{1EE00}-\\u{1EE03}\\u{1EE05}-\\u{1EE1F}\\u{1EE21}-\\u{1EE22}\\u{1EE24}\\u{1EE27}\\u{1EE29}-\\u{1EE32}\\u{1EE34}-\\u{1EE37}\\u{1EE39}\\u{1EE3B}\\u{1EE42}\\u{1EE47}\\u{1EE49}\\u{1EE4B}\\u{1EE4D}-\\u{1EE4F}\\u{1EE51}-\\u{1EE52}\\u{1EE54}\\u{1EE57}\\u{1EE59}\\u{1EE5B}\\u{1EE5D}\\u{1EE5F}\\u{1EE61}-\\u{1EE62}\\u{1EE64}\\u{1EE67}-\\u{1EE6A}\\u{1EE6C}-\\u{1EE72}\\u{1EE74}-\\u{1EE77}\\u{1EE79}-\\u{1EE7C}\\u{1EE7E}\\u{1EE80}-\\u{1EE89}\\u{1EE8B}-\\u{1EE9B}\\u{1EEA1}-\\u{1EEA3}\\u{1EEA5}-\\u{1EEA9}\\u{1EEAB}-\\u{1EEBB}\\u{1EEF0}-\\u{1EEF1}]/u"
  },
  {
    "id": "hebrew",
    "label": "Hebrew",
    "sample": "א ב ג",
    "keywords": "Hebrew Yiddish",
    "rule": "/[\\u0591-\\u05C7\\u05D0-\\u05EA\\u05EF-\\u05F4\\uFB1D-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40-\\uFB41\\uFB43-\\uFB44\\uFB46-\\uFB4F]/u"
  },
  {
    "id": "han",
    "label": "Han characters",
    "sample": "漢 字 文",
    "keywords": "Chinese Japanese kanji",
    "rule": "/[\\u2E80-\\u2E99\\u2E9B-\\u2EF3\\u2F00-\\u2FD5\\u3005\\u3007\\u3021-\\u3029\\u3038-\\u303B\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFA6D\\uFA70-\\uFAD9\\u{16FE2}-\\u{16FE3}\\u{16FF0}-\\u{16FF6}\\u{20000}-\\u{2A6DF}\\u{2A700}-\\u{2B81D}\\u{2B820}-\\u{2CEAD}\\u{2CEB0}-\\u{2EBE0}\\u{2EBF0}-\\u{2EE5D}\\u{2F800}-\\u{2FA1D}\\u{30000}-\\u{3134A}\\u{31350}-\\u{33479}]/u"
  },
  {
    "id": "kana",
    "label": "Japanese kana",
    "sample": "ひ カ ナ",
    "keywords": "Japanese hiragana katakana",
    "rule": "/[\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FD-\\u30FF\\u31F0-\\u31FF\\u32D0-\\u32FE\\u3300-\\u3357\\uFF66-\\uFF6F\\uFF71-\\uFF9D\\u{1AFF0}-\\u{1AFF3}\\u{1AFF5}-\\u{1AFFB}\\u{1AFFD}-\\u{1AFFE}\\u{1B000}-\\u{1B122}\\u{1B132}\\u{1B150}-\\u{1B152}\\u{1B155}\\u{1B164}-\\u{1B167}\\u{1F200}]/u"
  },
  {
    "id": "hangul",
    "label": "Korean Hangul",
    "sample": "한 글",
    "keywords": "Korean Hangul",
    "rule": "/[\\u1100-\\u11FF\\u302E-\\u302F\\u3131-\\u318E\\u3200-\\u321E\\u3260-\\u327E\\uA960-\\uA97C\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uFFA0-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]/u"
  },
  {
    "id": "devanagari",
    "label": "Devanagari",
    "sample": "अ क म",
    "keywords": "Hindi Marathi Nepali Sanskrit",
    "rule": "/[\\u0900-\\u0950\\u0955-\\u0963\\u0966-\\u097F\\uA8E0-\\uA8FF\\u{11B00}-\\u{11B09}]/u"
  },
  {
    "id": "thai",
    "label": "Thai",
    "sample": "ก ข ค",
    "keywords": "Thai",
    "rule": "/[\\u0E01-\\u0E3A\\u0E40-\\u0E5B]/u"
  },
  {
    "id": "armenian",
    "label": "Armenian",
    "sample": "Ա Բ Գ",
    "keywords": "Armenian",
    "rule": "/[\\u0531-\\u0556\\u0559-\\u058A\\u058D-\\u058F\\uFB13-\\uFB17]/u"
  },
  {
    "id": "georgian",
    "label": "Georgian",
    "sample": "ა ბ გ",
    "keywords": "Georgian",
    "rule": "/[\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u10FF\\u1C90-\\u1CBA\\u1CBD-\\u1CBF\\u2D00-\\u2D25\\u2D27\\u2D2D]/u"
  },
  {
    "id": "bengali",
    "label": "Bengali",
    "sample": "অ ক ম",
    "keywords": "Bengali Bangla Assamese",
    "rule": "/[\\u0980-\\u0983\\u0985-\\u098C\\u098F-\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC-\\u09C4\\u09C7-\\u09C8\\u09CB-\\u09CE\\u09D7\\u09DC-\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09FE]/u"
  },
  {
    "id": "gurmukhi",
    "label": "Gurmukhi",
    "sample": "ਅ ਕ ਮ",
    "keywords": "Punjabi Gurmukhi",
    "rule": "/[\\u0A01-\\u0A03\\u0A05-\\u0A0A\\u0A0F-\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32-\\u0A33\\u0A35-\\u0A36\\u0A38-\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47-\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A76]/u"
  },
  {
    "id": "gujarati",
    "label": "Gujarati",
    "sample": "અ ક મ",
    "keywords": "Gujarati",
    "rule": "/[\\u0A81-\\u0A83\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2-\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AD0\\u0AE0-\\u0AE3\\u0AE6-\\u0AF1\\u0AF9-\\u0AFF]/u"
  },
  {
    "id": "odia",
    "label": "Odia",
    "sample": "ଅ କ ମ",
    "keywords": "Odia Oriya",
    "rule": "/[\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F-\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32-\\u0B33\\u0B35-\\u0B39\\u0B3C-\\u0B44\\u0B47-\\u0B48\\u0B4B-\\u0B4D\\u0B55-\\u0B57\\u0B5C-\\u0B5D\\u0B5F-\\u0B63\\u0B66-\\u0B77]/u"
  },
  {
    "id": "tamil",
    "label": "Tamil",
    "sample": "அ க ம",
    "keywords": "Tamil",
    "rule": "/[\\u0B82-\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99-\\u0B9A\\u0B9C\\u0B9E-\\u0B9F\\u0BA3-\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD0\\u0BD7\\u0BE6-\\u0BFA\\u{11FC0}-\\u{11FF1}\\u{11FFF}]/u"
  },
  {
    "id": "telugu",
    "label": "Telugu",
    "sample": "అ క మ",
    "keywords": "Telugu",
    "rule": "/[\\u0C00-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3C-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55-\\u0C56\\u0C58-\\u0C5A\\u0C5C-\\u0C5D\\u0C60-\\u0C63\\u0C66-\\u0C6F\\u0C77-\\u0C7F]/u"
  },
  {
    "id": "kannada",
    "label": "Kannada",
    "sample": "ಅ ಕ ಮ",
    "keywords": "Kannada",
    "rule": "/[\\u0C80-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBC-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5-\\u0CD6\\u0CDC-\\u0CDE\\u0CE0-\\u0CE3\\u0CE6-\\u0CEF\\u0CF1-\\u0CF3]/u"
  },
  {
    "id": "malayalam",
    "label": "Malayalam",
    "sample": "അ ക മ",
    "keywords": "Malayalam",
    "rule": "/[\\u0D00-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4F\\u0D54-\\u0D63\\u0D66-\\u0D7F]/u"
  },
  {
    "id": "sinhala",
    "label": "Sinhala",
    "sample": "අ ක ම",
    "keywords": "Sinhala Sinhalese",
    "rule": "/[\\u0D81-\\u0D83\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DE6-\\u0DEF\\u0DF2-\\u0DF4\\u{111E1}-\\u{111F4}]/u"
  },
  {
    "id": "lao",
    "label": "Lao",
    "sample": "ກ ຂ ຄ",
    "keywords": "Lao Laotian",
    "rule": "/[\\u0E81-\\u0E82\\u0E84\\u0E86-\\u0E8A\\u0E8C-\\u0EA3\\u0EA5\\u0EA7-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECE\\u0ED0-\\u0ED9\\u0EDC-\\u0EDF]/u"
  },
  {
    "id": "tibetan",
    "label": "Tibetan",
    "sample": "ཀ ཁ ག",
    "keywords": "Tibetan",
    "rule": "/[\\u0F00-\\u0F47\\u0F49-\\u0F6C\\u0F71-\\u0F97\\u0F99-\\u0FBC\\u0FBE-\\u0FCC\\u0FCE-\\u0FD4\\u0FD9-\\u0FDA]/u"
  },
  {
    "id": "myanmar",
    "label": "Myanmar",
    "sample": "က ခ ဂ",
    "keywords": "Myanmar Burmese",
    "rule": "/[\\u1000-\\u109F\\uA9E0-\\uA9FE\\uAA60-\\uAA7F\\u{116D0}-\\u{116E3}]/u"
  },
  {
    "id": "khmer",
    "label": "Khmer",
    "sample": "ក ខ គ",
    "keywords": "Khmer Cambodian",
    "rule": "/[\\u1780-\\u17DD\\u17E0-\\u17E9\\u17F0-\\u17F9\\u19E0-\\u19FF]/u"
  },
  {
    "id": "mongolian",
    "label": "Mongolian",
    "sample": "ᠠ ᠡ ᠢ",
    "keywords": "Mongolian",
    "rule": "/[\\u1800-\\u1801\\u1804\\u1806-\\u1819\\u1820-\\u1878\\u1880-\\u18AA\\u{11660}-\\u{1166C}]/u"
  },
  {
    "id": "ethiopic",
    "label": "Ethiopic",
    "sample": "ሀ ለ መ",
    "keywords": "Amharic Tigrinya Ethiopic",
    "rule": "/[\\u1200-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u135D-\\u137C\\u1380-\\u1399\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\u{1E7E0}-\\u{1E7E6}\\u{1E7E8}-\\u{1E7EB}\\u{1E7ED}-\\u{1E7EE}\\u{1E7F0}-\\u{1E7FE}]/u"
  },
  {
    "id": "cherokee",
    "label": "Cherokee",
    "sample": "Ꭰ Ꭱ Ꭲ",
    "keywords": "Cherokee",
    "rule": "/[\\u13A0-\\u13F5\\u13F8-\\u13FD\\uAB70-\\uABBF]/u"
  },
  {
    "id": "canadian",
    "label": "Canadian syllabics",
    "sample": "ᐁ ᐃ ᐅ",
    "keywords": "Inuktitut Cree syllabics",
    "rule": "/[\\u1400-\\u167F\\u18B0-\\u18F5\\u{11AB0}-\\u{11ABF}]/u"
  },
  {
    "id": "tifinagh",
    "label": "Tifinagh",
    "sample": "ⴰ ⴱ ⴳ",
    "keywords": "Tamazight Berber Tifinagh",
    "rule": "/[\\u2D30-\\u2D67\\u2D6F-\\u2D70\\u2D7F]/u"
  },
  {
    "id": "yi",
    "label": "Yi",
    "sample": "ꀀ ꀁ ꀂ",
    "keywords": "Yi",
    "rule": "/[\\uA000-\\uA48C\\uA490-\\uA4C6]/u"
  },
  {
    "id": "lisu",
    "label": "Lisu",
    "sample": "ꓐ ꓑ ꓒ",
    "keywords": "Lisu",
    "rule": "/[\\uA4D0-\\uA4FF\\u{11FB0}]/u"
  },
  {
    "id": "vai",
    "label": "Vai",
    "sample": "ꔀ ꔁ ꔂ",
    "keywords": "Vai",
    "rule": "/[\\uA500-\\uA62B]/u"
  },
  {
    "id": "bamum",
    "label": "Bamum",
    "sample": "ꚠ ꚡ ꚢ",
    "keywords": "Bamum",
    "rule": "/[\\uA6A0-\\uA6F7\\u{16800}-\\u{16A38}]/u"
  },
  {
    "id": "ogham",
    "label": "Ogham",
    "sample": "ᚁ ᚂ ᚃ",
    "keywords": "Ogham",
    "rule": "/[\\u1680-\\u169C]/u"
  },
  {
    "id": "runic",
    "label": "Runic",
    "sample": "ᚠ ᚢ ᚦ",
    "keywords": "Runic",
    "rule": "/[\\u16A0-\\u16EA\\u16EE-\\u16F8]/u"
  }
];
const escape=String.raw`\\u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})`;
const characterRule=new RegExp('^/\\[(?:'+escape+'(?:-'+escape+')?)+\\]/[imsu]*$');
root.HexStreamLanguages=Object.freeze({PRESETS:Object.freeze(presets.map(Object.freeze)),SCOPES:Object.freeze(['tags','titles','channels']),isCharacterRule:rule=>typeof rule==='string'&&characterRule.test(rule)});
if(typeof module!=='undefined'&&module.exports)module.exports=root.HexStreamLanguages;
})(globalThis);
