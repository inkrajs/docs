# Optional theme fonts

These local WOFF2 fonts load when their preview becomes visible or when selected
in the theme customizer; they are not all downloaded on page load.
Each font retains its own SIL OFL 1.1 license in this directory.
Xiaolai SC and the original Yozai subset are supplied by @inkra/react.
No font is Inkra's original artwork.

Sources for Iansui, Huninn, KuaiLe, HuangYou, Noto Sans/Serif SC, WenKai TC,
LXGW Marker Gothic and Chenyu are recorded in sources.json.
Ma Shan Zheng, Long Cang, Zhi Mang Xing and Liu Jian Mao Cao come from
https://github.com/google/fonts/tree/main/ofl (mashanzheng, longcang,
zhimangxing and liujianmaocao directories).

WOFF2 conversion uses fontTools and Brotli. Variable Noto fonts are instantiated
at weight 400. Character coverage is retained. Fonts labelled Traditional have
incomplete Simplified Chinese coverage; missing glyphs fall back to Xiaolai.

The presets are tuned for their stroke widths and connections: thin connected
fonts use fewer breaks and less grain, while broad shapes tolerate more texture.
The Xiaolai preset is the user's revised 2026-10-28 selection:
.10 / .31 / .44 / .85 / .40, with the pencil effect enabled by default.
The original Yozai font uses the user's revised .20 / .30 / .30 / 1.00 / .20.
Save stores each font's adjustments independently; cancel discards drawer edits.

## Handwriting for other languages

Caveat, Patrick Hand, Kalam and Handlee provide different Latin handwriting
styles for English and French. Their complete source character maps are retained,
including French accents in both cases, œ/Œ, æ/Æ, guillemets and the curly
apostrophe. Yomogi provides Japanese handwriting, including kana and kanji, and
also covers the same French character checklist. Gaegu provides Korean and basic
Latin handwriting; it contains common Hangul syllables, not the entire Hangul
syllable block, and does not provide French accented letters. Unsupported glyphs
must retain the application's fallback stack.

All six are SIL OFL 1.1 fonts from the official google/fonts repository, pinned
to revision a4c0b21f839d7ac65a7d8b49eb81bddd110774a3. Their original licenses,
version strings, immutable source URLs, source and WOFF2 SHA-256 checksums,
conversion settings and cmap-verified sample strings are recorded alongside the
assets in sources.json. Caveat is instantiated at weight 400; the other five use
their Regular face. Conversion preserves all source glyphs and does not add
characters or claim universal language coverage.

Japanese handwriting also includes Klee One (fine pen, suitable for body text),
Yuji Syuku (formal brush), Yuji Mai (expressive brush), and Hachi Maru Pop
(rounded retro lettering, best at larger sizes). All retain their complete
Regular face. The first three cover the French checklist; Hachi Maru Pop lacks
uppercase Ÿ, so its advertised specimen languages are Japanese and English.

Korean handwriting also includes Nanum Pen Script, Nanum Brush Script, Hi Melody
and Single Day. Their Korean specimens and English alphabet are cmap-verified;
they are not advertised for French. Missing application characters retain the
fallback stack. These eight fonts' licenses and immutable source/conversion
records are included in this directory and sources.json, like the other fonts.
