// Shared by the design guide and the customizer; no UI or browser dependencies.
export type ThemeName = 'light' | 'dark';
export type PaletteTokens = Partial<Record<`--inkra-${string}`, string>>;

const oceanScale = [
  ['50', '#c4e7f0'],
  ['100', '#b4dfe9'],
  ['200', '#a2d3df'],
  ['300', '#93c7d0'],
  ['400', '#78a9b3'],
  ['500', '#5ca0b0'],
  ['600', '#4b96aa'],
  ['700', '#3e7b8c'],
  ['800', '#305e6b'],
  ['900', '#294c56'],
  ['950', '#172f36'],
] as const;

const inkScale = ['#f5f6f5', '#e6e9e7', '#ced4d0', '#acb7b0', '#85958c', '#64766b', '#4d5e54', '#3b4b41', '#293d33', '#202d25', '#141c17'];
const redScale = ['#fcf3f0', '#f6e2da', '#ecc2b4', '#dfa492', '#cf806b', '#b96350', '#994f3f', '#803c30', '#672e26', '#51251f', '#311510'];
const purpleScale = ['#f7f3f8', '#eee5f0', '#dccbdf', '#c4aacb', '#ac8db5', '#93749d', '#7d6088', '#654b70', '#4e3959', '#3d2c47', '#261b2d'];
const orangeScale = ['#fbf5ed', '#f4e6d2', '#e8cfaa', '#d9b482', '#c59660', '#b47e49', '#976337', '#7b4e2b', '#613d24', '#4b2f1e', '#2e1d13'];
const yellowScale = ['#fbf8ed', '#f4edcf', '#e9dba5', '#d9c478', '#c3aa51', '#a98f39', '#89722d', '#6e5926', '#554421', '#42351d', '#292112'];
const greenScale = ['#f1f7f0', '#e0eedc', '#c5ddbd', '#a4c69b', '#82ad7b', '#629568', '#4c7952', '#395e40', '#294a32', '#203b29', '#112218'];
export const scaleSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
export const themeScales = [
  { id: 'ink', label: '玄墨', values: inkScale.map((hex, index) => [scaleSteps[index], hex] as const) },
  { id: 'ocean', label: '沧浪', values: oceanScale },
  { id: 'red', label: '朱砂', values: redScale.map((hex, index) => [scaleSteps[index], hex] as const) },
  { id: 'green', label: '松青', values: greenScale.map((hex, index) => [scaleSteps[index], hex] as const) },
  { id: 'purple', label: '丁香', values: purpleScale.map((hex, index) => [scaleSteps[index], hex] as const) },
  { id: 'orange', label: '赭橙', values: orangeScale.map((hex, index) => [scaleSteps[index], hex] as const) },
  { id: 'yellow', label: '藤黄', values: yellowScale.map((hex, index) => [scaleSteps[index], hex] as const) },
];

export const darkScales: Record<string, string[]> = {
  purple: ['#493c51', '#584861', '#685570', '#796381', '#8b7493', '#9e87a6', '#b29cba', '#c6b2cc', '#d8c8dc', '#e8ddec', '#f5eef7'],
  orange: ['#584331', '#6a5039', '#7d5e42', '#916e4c', '#a57f58', '#b99169', '#cba57e', '#dcb995', '#e9ccaf', '#f3dfcb', '#faf0e5'],
  yellow: ['#514830', '#615639', '#726640', '#84764a', '#978956', '#aa9c67', '#bdb17d', '#cfc494', '#e0d7af', '#eee7ca', '#f8f4e4'],
  ink: ['#48554f', '#55645b', '#627267', '#708173', '#809184', '#91a194', '#a5b3a6', '#bac6ba', '#cdd7ca', '#dfe7da', '#f0f4eb'],
  ocean: ['#305460', '#376574', '#3e7688', '#47889c', '#529aae', '#63aabc', '#78bbcb', '#90cbd8', '#aadbe5', '#c4e9ef', '#ddf5f8'],
  red: ['#633c36', '#76473e', '#8c5348', '#a36153', '#b87362', '#ca8774', '#d99d8b', '#e7b2a1', '#f0c6b8', '#f7dace', '#fcece4'],
  green: ['#36513d', '#406148', '#4a7252', '#56845e', '#65966c', '#78a77d', '#8eb98f', '#a5cba4', '#bedcba', '#d5ebd0', '#eaf6e5'],
};

export type Palette = typeof themeScales[number];

export function paletteStyle(scale: Palette, theme: ThemeName): PaletteTokens {
  const dark = darkScales[scale.id];
  return {
    '--inkra-accent': theme === 'light' ? scale.values[3][1] : dark[2],
    '--inkra-accent-soft': theme === 'light' ? scale.values[2][1] : dark[1],
    '--inkra-accent-strong': theme === 'light' ? scale.values[8][1] : dark[8],
    '--inkra-on-accent': theme === 'light' ? scale.values[9][1] : dark[10],
    '--inkra-selection-pigment': theme === 'light' ? scale.values[4][1] : dark[3],
    '--inkra-selection-foreground': theme === 'light' ? scale.values[10][1] : dark[10],
  };
}


/** Only opaque solid colors can become a theme pigment. */
export function normalizeThemeColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(hex)) return '#' + [...hex.slice(1)].map(character => character.repeat(2)).join('');
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^#[0-9a-f]{6}ff$/.test(hex)) return hex.slice(0, 7);
  return null;
}

export function customPaletteId(value: string): string {
  const color = normalizeThemeColor(value);
  return color ? `custom:${color}` : 'default';
}

export function sanitizeCustomColors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const colors = new Set<string>();
  for (const entry of value) {
    const color = normalizeThemeColor(entry);
    if (color) colors.add(color);
    if (colors.size === 12) break;
  }
  return [...colors];
}

export function rememberCustomColor(colors: unknown, value: string): string[] {
  const color = normalizeThemeColor(value);
  const previous = sanitizeCustomColors(colors);
  return color ? [color, ...previous.filter(entry => entry !== color)].slice(0, 12) : previous;
}

function colorHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const lightness = (max + min) / 2;
  if (!delta) return [0, 0, lightness];
  const hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [((hue / 6) + 1) % 1, delta / (1 - Math.abs(2 * lightness - 1)), lightness];
}

function shade(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs((hue * 6) % 2 - 1));
  const channels = hue < 1 / 6 ? [chroma, x, 0] : hue < 2 / 6 ? [x, chroma, 0] : hue < 3 / 6 ? [0, chroma, x] : hue < 4 / 6 ? [0, x, chroma] : hue < 5 / 6 ? [x, 0, chroma] : [chroma, 0, x];
  return '#' + channels.map(channel => Math.round((channel + lightness - chroma / 2) * 255).toString(16).padStart(2, '0')).join('');
}

/** Raw custom swatches stay exact; theme surfaces use quieter shades of the same hue. */
export function paletteTokens(id: string, theme: ThemeName): PaletteTokens {
  const builtIn = themeScales.find(scale => scale.id === id);
  if (builtIn) return paletteStyle(builtIn, theme);
  const color = id.startsWith('custom:') ? normalizeThemeColor(id.slice(7)) : null;
  if (!color) return {};
  const [hue, originalSaturation, originalLightness] = colorHsl(color);
  const saturation = Math.min(originalSaturation, .55);
  const colorAt = (lightness: number) => shade(hue, saturation, lightness);
  const dark = theme === 'dark';
  // Preserve the user's lightness choice within a bounded range appropriate to each paper.
  // Black, gray and white must remain distinct even though they have no hue or saturation.
  const l = originalLightness;
  return {
    '--inkra-accent': colorAt(dark ? .16 + .06 * l : .72 + .12 * l),
    '--inkra-accent-soft': colorAt(dark ? .14 + .04 * l : .82 + .08 * l),
    '--inkra-accent-strong': colorAt(dark ? .80 + .08 * l : .20 + .04 * l),
    '--inkra-on-accent': colorAt(dark ? .92 + .04 * l : .12 + .04 * l),
    '--inkra-selection-pigment': colorAt(dark ? .20 + .06 * l : .64 + .12 * l),
    '--inkra-selection-foreground': colorAt(dark ? .92 + .04 * l : .08 + .04 * l),
  };
}
