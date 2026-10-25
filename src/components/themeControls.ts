export const themeRenderControls = [
  { key: 'variation', token: '--inkra-letter-variation', zh: '笔压变化', en: 'Pressure variation', value: 0.2, min: 0, max: 1, step: 0.01, group: 'text' },
  { key: 'breaks', token: '--inkra-letter-breaks', zh: '断笔程度', en: 'Stroke breaks', value: 0.5, min: 0, max: 0.5, step: 0.01, group: 'text' },
  { key: 'outline', token: '--inkra-letter-outline', zh: '轮廓浓度', en: 'Outline intensity', value: 0.9, min: 0.2, max: 1, step: 0.01, group: 'text' },
  { key: 'fill', token: '--inkra-letter-fill', zh: '填色浓度', en: 'Fill intensity', value: 0.9, min: 0.1, max: 1, step: 0.01, group: 'text' },
  { key: 'grain', token: '--inkra-letter-grain', zh: '颗粒感', en: 'Grain', value: 0.6, min: 0, max: 1, step: 0.01, group: 'text' },
  { key: 'width', token: '--inkra-stroke-width', zh: '线条粗细', en: 'Stroke weight', value: 2, min: 0.3, max: 3, step: 0.1, group: 'lines' },
  { key: 'roughness', token: '--inkra-stroke-amplitude', zh: '线条起伏', en: 'Stroke roughness', value: 1.5, min: 0, max: 4, step: 0.1, group: 'lines' },
  { key: 'washStrength', token: '--inkra-wash-strength', zh: '涂色浓度', en: 'Fill strength', value: 0.8, min: 0, max: 1, step: 0.01, group: 'wash' },
  { key: 'washSpacing', token: '--inkra-wash-spacing', zh: '笔触间距', en: 'Stroke spacing', value: 2, min: 1, max: 6, step: 0.1, group: 'wash' },
  { key: 'washRoughness', token: '--inkra-wash-roughness', zh: '涂色起伏', en: 'Fill roughness', value: 3, min: 0, max: 6, step: 0.1, group: 'wash' },
  { key: 'washAngle', token: '--inkra-wash-angle', zh: '涂色角度', en: 'Fill angle', value: -45, min: -85, max: 85, step: 1, group: 'wash' },
] as const;

export type ThemeRenderSettings = Record<typeof themeRenderControls[number]['key'], number>;
export const defaultThemeRender = Object.fromEntries(themeRenderControls.map(control => [control.key, control.value])) as ThemeRenderSettings;

export function themeRenderTokens(settings: ThemeRenderSettings) {
  return Object.fromEntries(themeRenderControls.map(control => {
    const unit = ['width', 'roughness', 'washSpacing'].includes(control.key) ? 'px' : control.key === 'washAngle' ? 'deg' : '';
    return [control.token, `${settings[control.key]}${unit}`];
  }));
}
