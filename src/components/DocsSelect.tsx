import { useContext, useId, useState } from 'react';
import { RadioGroup, RadioGroupItem, Select, Tooltip } from '@inkra/react';
import type { SelectTriggerProps } from '@inkra/react';
import { PencilText, translateOptionLabel, useLocale } from '../i18n';
import { DocsControlContext } from './DocsControlContext';
import { DocsIcon } from './DocsIcon';
import { resolveChoiceVisuals, type DocsChoiceVisuals } from './docsChoiceVisuals';
import './DocsSelect.css';

export function DocsSelect({ label, value, onValueChange, options, disabled = false, hideLabel = false, startIcon, presentation = 'auto', visuals, optionLabels = 'auto' }: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  disabled?: boolean;
  hideLabel?: boolean;
  startIcon?: SelectTriggerProps['startIcon'];
  presentation?: 'auto' | 'radio' | 'select';
  visuals?: DocsChoiceVisuals;
  optionLabels?: 'auto' | 'visible' | 'hidden';
}) {
  const { locale, t } = useLocale();
  const isPlaygroundControl = useContext(DocsControlContext);
  const id = useId();
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const showRadio = presentation === 'radio' || (presentation === 'auto' && isPlaygroundControl
    && !hideLabel && !startIcon && options.length >= 2 && options.length <= 4);
  const resolvedVisuals = visuals ?? resolveChoiceVisuals(options);
  const showIcons = options.every(([key]) => resolvedVisuals?.[key]);
  const iconOnly = showIcons && (optionLabels === 'hidden' || (optionLabels === 'auto'
    && options.every(([key]) => resolvedVisuals?.[key].labelOptional)));
  if (showRadio) return <div className="docs-select" data-presentation="radio" data-option-count={options.length} data-option-labels={iconOnly ? 'hidden' : 'visible'}>
    <Tooltip.Provider delayDuration={300}>
    <RadioGroup variant="segmented" orientation="horizontal" name={id} role="radiogroup" label={hideLabel ? undefined : t(label)} aria-label={t(label)} value={value} onValueChange={onValueChange} disabled={disabled}>
      {options.map(([key, text]) => {
        const visual = showIcons ? resolvedVisuals?.[key] : undefined;
        const optionLabel = translateOptionLabel(locale, text);
        return <Tooltip.Root key={key}>
          <Tooltip.Trigger asChild>
            <RadioGroupItem value={key} aria-label={optionLabel}
              label={<PencilText ellipsis className="docs-choice-label" title="">{optionLabel}</PencilText>}
              icon={visual && (
                <span className="docs-choice-icon" data-choice-icon={visual.icon.name} data-logical={visual.logical || undefined}>
                  <DocsIcon data={visual.icon} size={visual.size ?? 24} />
                </span>
              )} />
          </Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content>{optionLabel}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root>;
      })}
    </RadioGroup>
    </Tooltip.Provider>
  </div>;
  return <div className="docs-select" data-presentation="select" data-option-count={options.length}>
    {!hideLabel && <PencilText as="label" htmlFor={id}>{label}</PencilText>}
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger id={id} aria-label={t(label)} disabled={disabled} ref={setTrigger} startIcon={startIcon}><Select.Value /></Select.Trigger>
      <Select.Portal container={trigger?.closest<HTMLElement>('.mobile-drawer') ?? undefined}>
        <Select.Content position="popper" sideOffset={4} onKeyDown={event => event.stopPropagation()}>
          <Select.ScrollUpButton /><Select.Viewport>
            {options.map(([key, text]) => {
              const optionLabel = translateOptionLabel(locale, text);
              return <Select.Item key={key} value={key} textValue={optionLabel}><Select.ItemText>{optionLabel}</Select.ItemText><Select.ItemIndicator /></Select.Item>;
            })}
          </Select.Viewport><Select.ScrollDownButton />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>;
}

export const controlSizes = [['sm', '小'], ['md', '中'], ['lg', '大']] as const;
