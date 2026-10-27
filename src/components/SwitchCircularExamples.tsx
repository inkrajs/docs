import { useState } from 'react';
import { CircularSlider, Switch } from '@inkra/react';
import { __iconData as powerIcon } from 'lucide-react/dist/esm/icons/power.mjs';
import { __iconData as volumeIcon } from 'lucide-react/dist/esm/icons/volume-2.mjs';
import { PencilText, useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { DocsIcon } from './DocsIcon';
import './SwitchCircularExamples.css';

export function SwitchCircularExamples() {
  const { t } = useLocale();
  const [sound, setSound] = useState(true);
  const [volume, setVolume] = useState(60);

  return <>
    <ComponentExample id="switch-circular" title={t('圆环开关')} code={`<Switch variant="circular" diameter={120} defaultChecked
  label="${t('音效')}" centerIcon={<PowerIcon />} />
<Switch variant="circular" diameter={120} disabled
  label="${t('禁用')}" centerIcon={<PowerIcon />} />`}>
      <div className="switch-circular-examples__row">
        <Switch variant="circular" diameter={120} defaultChecked label={t('音效')} centerIcon={<DocsIcon data={powerIcon} size={20} />} />
        <Switch variant="circular" diameter={120} disabled label={t('禁用')} centerIcon={<DocsIcon data={powerIcon} size={20} />} />
      </div>
    </ComponentExample>
    <ComponentExample id="switch-circular-parameter" title={t('开关与参数')} code={`const [sound, setSound] = useState(true);
const [volume, setVolume] = useState(60);

<Switch variant="circular" diameter={120}
  checked={sound} onCheckedChange={setSound}
  label="${t('音效')}" centerIcon={<PowerIcon />} />
<CircularSlider size="sm" diameter={120}
  value={volume} onValueChange={setVolume} disabled={!sound}
  aria-label="${t('音量')}" centerIcon={<VolumeIcon />}
  getValueLabel={value => String(value)} />`}>
      <div className="switch-circular-examples__row">
        <Switch variant="circular" diameter={120} checked={sound} onCheckedChange={setSound}
          label={t('音效')} centerIcon={<DocsIcon data={powerIcon} size={20} />} />
        <div className="switch-circular-examples__parameter">
          <CircularSlider size="sm" diameter={120} value={volume} onValueChange={setVolume} disabled={!sound}
            aria-label={t('音量')} centerIcon={<DocsIcon data={volumeIcon} size={20} />} getValueLabel={value => String(value)} />
          <PencilText className="switch-circular-examples__label">{t('音量')}</PencilText>
        </div>
      </div>
    </ComponentExample>
  </>;
}
