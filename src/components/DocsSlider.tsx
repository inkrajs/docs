import { Slider } from 'inkra';
import { useId } from 'react';
import { PencilText, useLocale } from '../i18n';

interface DocsSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export function DocsSlider({ label, value, onValueChange, unit = '', ...props }: DocsSliderProps) {
  const id = useId();
  const { t } = useLocale();
  return <div className="docs-slider-control">
    <PencilText id={id}>{t(label)}</PencilText>
    <Slider {...props} value={[value]} onValueChange={values => onValueChange(values[0])} aria-labelledby={id} getValueLabel={current => `${current}${unit}`} />
    <output>{value}{unit}</output>
  </div>;
}
