import { sanitizeCustomColors } from './themeColors';
import { defaultThemeRender, themeRenderControls, type ThemeRenderSettings } from './themeControls';

export type FontRender = Pick<ThemeRenderSettings, 'variation' | 'breaks' | 'outline' | 'fill' | 'grain'>;
const preset = (variation: number, breaks: number, outline: number, fill: number, grain: number): FontRender =>
  ({ variation, breaks, outline, fill, grain });

// Thin connected handwriting keeps its fine joins; broader strokes carry more texture.
// Xiaolai uses the user's revised screenshot preset from 2026-10-28.
export const themeFonts = [
  { id: 'xiaolai', zh: '小赖字体', en: 'Xiaolai', family: 'Inkra Xiaolai', preset: preset(.10, .31, .44, .85, .40) },
  { id: 'yozai', zh: '悠哉', en: 'Yozai', family: 'Trip Map Hand', preset: preset(.20, .30, .30, 1.00, .20) },
  { id: 'marker', zh: '霞鹜漫黑', en: 'LXGW Marker Gothic', family: 'Inkra Marker', file: 'Marker', preset: preset(.15, .15, .45, .90, .30) },
  { id: 'chenyu', zh: '辰宇落雁（繁体）', en: 'Chenyu (Traditional)', family: 'Inkra Chenyu', file: 'Chenyu', preset: preset(.05, 0, .70, 1, .10), traditional: true },
  { id: 'brush', zh: '马善政楷书', en: 'Ma Shan Zheng', family: 'Inkra Brush', file: 'Brush', preset: preset(.20, .25, .60, .90, .35) },
  { id: 'longcang', zh: '龙藏体', en: 'Long Cang', family: 'Inkra LongCang', file: 'LongCang', preset: preset(.15, .15, .65, .95, .25) },
  { id: 'zhimang', zh: '志莽行书', en: 'Zhi Mang Xing', family: 'Inkra ZhiMangXing', file: 'ZhiMangXing', preset: preset(.25, .10, .50, .95, .30) },
  { id: 'liujian', zh: '刘建毛草', en: 'Liu Jian Mao Cao', family: 'Inkra LiuJianMaoCao', file: 'LiuJianMaoCao', preset: preset(.10, .05, .70, 1, .15) },
  { id: 'wenkai', zh: '霞鹜文楷 TC', en: 'LXGW WenKai TC', family: 'Inkra WenKai', file: 'WenKai', preset: preset(.15, .20, .75, .90, .30) },
  { id: 'iansui', zh: '芫荽（繁体）', en: 'Iansui (Traditional)', family: 'Inkra Iansui', file: 'Iansui', preset: preset(.10, .15, .70, .95, .20), traditional: true },
  { id: 'huninn', zh: '粉圆（繁体）', en: 'Huninn (Traditional)', family: 'Inkra Huninn', file: 'Huninn', preset: preset(.10, .15, .55, .90, .25), traditional: true },
  { id: 'kuaile', zh: '站酷快乐体', en: 'ZCOOL KuaiLe', family: 'Inkra KuaiLe', file: 'KuaiLe', preset: preset(.25, .25, .50, .85, .40) },
  { id: 'huangyou', zh: '站酷庆科黄油体', en: 'ZCOOL QingKe HuangYou', family: 'Inkra HuangYou', file: 'HuangYou', preset: preset(.15, .20, .40, .85, .35) },
  { id: 'serif', zh: '思源宋体', en: 'Noto Serif SC', family: 'Inkra NotoSerif', file: 'NotoSerif', preset: preset(.10, .10, .65, .95, .20) },
  { id: 'sans', zh: '思源黑体', en: 'Noto Sans SC', family: 'Inkra NotoSans', file: 'NotoSans', preset: preset(.15, .20, .50, .90, .30) },
  { id: 'caveat', zh: 'Caveat', en: 'Caveat', family: 'Inkra Caveat', file: 'Caveat', preset: preset(.12, .06, .55, .96, .12) },
  { id: 'patrickhand', zh: 'Patrick Hand', en: 'Patrick Hand', family: 'Inkra PatrickHand', file: 'PatrickHand', preset: preset(.12, .08, .60, .94, .18) },
  { id: 'kalam', zh: 'Kalam', en: 'Kalam', family: 'Inkra Kalam', file: 'Kalam', preset: preset(.16, .08, .52, .96, .16) },
  { id: 'handlee', zh: 'Handlee', en: 'Handlee', family: 'Inkra Handlee', file: 'Handlee', preset: preset(.08, .03, .68, 1, .08) },
  { id: 'yomogi', zh: 'Yomogi', en: 'Yomogi', family: 'Inkra Yomogi', file: 'Yomogi', preset: preset(.08, .04, .66, .98, .10) },
  { id: 'kleeone', zh: 'Klee One', en: 'Klee One', family: 'Inkra KleeOne', file: 'KleeOne', preset: preset(.07, .02, .64, .98, .07) },
  { id: 'yujisyuku', zh: 'Yuji Syuku', en: 'Yuji Syuku', family: 'Inkra YujiSyuku', file: 'YujiSyuku', preset: preset(.18, .06, .48, .96, .14) },
  { id: 'yujimai', zh: 'Yuji Mai', en: 'Yuji Mai', family: 'Inkra YujiMai', file: 'YujiMai', preset: preset(.12, .04, .52, .98, .11) },
  { id: 'hachimarupop', zh: 'Hachi Maru Pop', en: 'Hachi Maru Pop', family: 'Inkra HachiMaruPop', file: 'HachiMaruPop', preset: preset(.09, .03, .62, .96, .09) },
  { id: 'gaegu', zh: 'Gaegu', en: 'Gaegu', family: 'Inkra Gaegu', file: 'Gaegu', preset: preset(.12, .06, .58, .96, .14) },
  { id: 'nanumpen', zh: 'Nanum Pen Script', en: 'Nanum Pen Script', family: 'Inkra NanumPen', file: 'NanumPen', preset: preset(.14, .04, .54, .98, .10) },
  { id: 'nanumbrush', zh: 'Nanum Brush Script', en: 'Nanum Brush Script', family: 'Inkra NanumBrush', file: 'NanumBrush', preset: preset(.18, .05, .46, .95, .13) },
  { id: 'himelody', zh: 'Hi Melody', en: 'Hi Melody', family: 'Inkra HiMelody', file: 'HiMelody', preset: preset(.08, .02, .67, 1, .06) },
  { id: 'singleday', zh: 'Single Day', en: 'Single Day', family: 'Inkra SingleDay', file: 'SingleDay', preset: preset(.11, .04, .57, .97, .12) },
];
export const defaultFont = themeFonts[0];
export const getThemeFont = (id: string) => themeFonts.find(font => font.id === id) ?? defaultFont;
export const fontStack = (id: string) => `"${getThemeFont(id).family}", "Inkra Xiaolai", "Trip Map Hand", "Kaiti SC", "STKaiti", cursive`;

type FontLanguage = 'zh' | 'en' | 'fr' | 'ja' | 'ko';
const latinFonts = new Set(['caveat', 'patrickhand', 'kalam', 'handlee']);
const japaneseHandwriting = new Set(['yomogi', 'kleeone', 'yujisyuku', 'yujimai', 'hachimarupop']);
const koreanHandwriting = new Set(['gaegu', 'nanumpen', 'nanumbrush', 'himelody', 'singleday']);
// Coverage describes supported sample languages, not a promise of every Unicode glyph.
const frenchFonts = new Set(['xiaolai', 'marker', 'wenkai', 'iansui', 'huninn', 'caveat', 'patrickhand', 'kalam', 'handlee', 'yomogi', 'kleeone', 'yujisyuku', 'yujimai']);
const japaneseFonts = new Set(['xiaolai', 'marker', 'wenkai', 'iansui', 'serif', 'sans', ...japaneseHandwriting]);
const koreanFonts = new Set(['xiaolai', ...koreanHandwriting]);
const languageNames: Record<FontLanguage, string> = { zh: '中文', en: 'EN', fr: 'FR', ja: '日本語', ko: '한국어' };
const languageSearch: Record<FontLanguage, string> = {
  zh: '中文 汉字 漢字 Chinese chinois',
  en: '英语 英文 English anglais latin 拉丁',
  fr: '法语 法文 Français francais French français latin 拉丁',
  ja: '日语 日文 日本語 Japanese japonais',
  ko: '韩语 韩文 한국어 Korean coréen',
};
const primaryLanguage = (id: string): FontLanguage => latinFonts.has(id) ? 'en' : japaneseHandwriting.has(id) ? 'ja' : koreanHandwriting.has(id) ? 'ko' : 'zh';
export function fontLanguages(id: string): FontLanguage[] {
  const primary = primaryLanguage(id);
  return [...new Set<FontLanguage>([
    primary, 'en',
    ...(frenchFonts.has(id) ? ['fr' as const] : []),
    ...(japaneseFonts.has(id) ? ['ja' as const] : []),
    ...(koreanFonts.has(id) ? ['ko' as const] : []),
  ])];
}
const samples = {
  zh: { title: '山水之间，自在远行。', body: '让时间慢下来，停留一会。', card: '山水之间，\n自在远行。' },
  en: { title: 'A little inspiration', body: 'Slow down. Make room for ideas.', card: 'A little\ninspiration' },
  fr: { title: 'Écrire en liberté', body: 'Un café, un rêve, un cœur léger.', card: 'Écrire en liberté\nUn cœur léger' },
  ja: { title: '小さなひらめき', body: 'ゆっくり、今日を書こう。', card: '小さな\nひらめき' },
  ko: { title: '작은 영감', body: '천천히 오늘을 기록해요.', card: '작은 영감\n오늘의 기록' },
};
export function fontSpecimen(id: string, locale: string) {
  const font = getThemeFont(id);
  const languages = fontLanguages(font.id);
  const requested = locale.split('-')[0] as FontLanguage;
  const language = languages.includes(requested) ? requested : primaryLanguage(font.id);
  const traditional = language === 'zh' && font.traditional;
  return {
    ...(traditional
      ? { title: '山水之間，自在遠行。', body: '讓時間慢下來，停留一會。', card: '山水之間，\n自在遠行。' }
      : samples[language]),
    lang: language === 'zh' ? (traditional ? 'zh-Hant' : 'zh-Hans') : language,
    label: languages.map(value => languageNames[value]).join(' · '),
  };
}
export function orderedThemeFonts(locale: string, query = '') {
  const normalized = query.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase();
  const searchedLanguage = (Object.keys(languageSearch) as FontLanguage[]).find(language =>
    languageSearch[language].normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().split(' ').includes(normalized));
  const language = searchedLanguage ?? locale.split('-')[0] as FontLanguage;
  const score = (id: string) => (primaryLanguage(id) === language || (language === 'fr' && latinFonts.has(id))) ? 0 : fontLanguages(id).includes(language) ? 1 : 2;
  return [...themeFonts].sort((a, b) => score(a.id) - score(b.id));
}
export function fontMatchesQuery(id: string, query: string, _locale: string) {
  const font = getThemeFont(id);
  const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase();
  return [font.id, font.zh, font.en, font.family, ...fontLanguages(font.id).map(language => languageSearch[language])]
    .some(value => normalize(value).includes(normalize(query)));
}
export type ThemeSettings = {
  palette: string;
  customColors: string[];
  font: string;
  textEffect: boolean;
  render: ThemeRenderSettings;
  fonts: Record<string, FontRender>;
};
export const defaultThemeSettings: ThemeSettings = {
  palette: 'default', customColors: [], font: defaultFont.id, textEffect: true, render: { ...defaultThemeRender }, fonts: {},
};
export function fontRender(render: ThemeRenderSettings): FontRender {
  const { variation, breaks, outline, fill, grain } = render;
  return { variation, breaks, outline, fill, grain };
}
export function changeThemeFont(settings: ThemeSettings, id: string): ThemeSettings {
  const font = getThemeFont(id);
  const fonts = { ...settings.fonts, [settings.font]: fontRender(settings.render) };
  return { ...settings, font: font.id, fonts, render: { ...settings.render, ...(fonts[font.id] ?? font.preset) } };
}
function sanitizeRender(value: unknown, defaults: ThemeRenderSettings): ThemeRenderSettings {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(themeRenderControls.map(control => {
    const number = source[control.key];
    return [control.key, typeof number === 'number' && Number.isFinite(number)
      ? Math.min(control.max, Math.max(control.min, number)) : defaults[control.key]];
  })) as ThemeRenderSettings;
}
export function readThemeSettings(value: unknown): ThemeSettings {
  if (!value || typeof value !== 'object') return defaultThemeSettings;
  const saved = value as Partial<ThemeSettings>;
  // Keep existing users' old font and tuning together when migrating v1.
  const font = getThemeFont(typeof saved.font === 'string' ? saved.font : 'yozai');
  const fonts: Record<string, FontRender> = {};
  for (const entry of themeFonts) {
    const previous = saved.fonts?.[entry.id];
    if (previous) fonts[entry.id] = fontRender(sanitizeRender(previous, { ...defaultThemeRender, ...entry.preset }));
  }
  return {
    palette: typeof saved.palette === 'string' ? saved.palette : 'default',
    customColors: sanitizeCustomColors(saved.customColors),
    font: font.id, fonts,
    textEffect: typeof saved.textEffect === 'boolean' ? saved.textEffect : true,
    render: sanitizeRender(saved.render, { ...defaultThemeRender, ...font.preset }),
  };
}

const pending = new Map<string, Promise<void>>();
export function loadThemeFont(id: string, sampleText = '一页灵感'): Promise<void> {
  const font = getThemeFont(id);
  // Unicode-range faces (notably Xiaolai's extended script coverage) must load
  // for the actual specimen, even after the base font has been cached.
  const loadSample = async () => {
    const loaded = await document.fonts.load(`15px "${font.family}"`, sampleText);
    if (!loaded.length) throw new Error('Font unavailable');
  };
  if (pending.has(font.id)) return pending.get(font.id)!.then(loadSample);
  const request = (async () => {
    if (font.file) {
      const face = new FontFace(font.family, `url("${import.meta.env.BASE_URL}fonts/theme/${font.file}.woff2")`, { weight: '400', style: 'normal' });
      await face.load();
      document.fonts.add(face);
    } else {
      const loaded = await document.fonts.load(`15px "${font.family}"`, '一页灵感');
      if (!loaded.length) throw new Error('Font unavailable');
    }
  })().catch(error => { pending.delete(font.id); throw error; });
  pending.set(font.id, request);
  return request.then(loadSample);
}
