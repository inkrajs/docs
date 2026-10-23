import { useId, useState } from 'react';
import { Select } from '@inkra/react';
import type { SelectTriggerProps } from '@inkra/react';
import { PencilText, translateOptionLabel, useLocale } from '../i18n';

export function DocsSelect({ label, value, onValueChange, options, disabled = false, hideLabel = false, startIcon }: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  disabled?: boolean;
  hideLabel?: boolean;
  startIcon?: SelectTriggerProps['startIcon'];
}) {
  const { locale, t } = useLocale();
  const id = useId();
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  return <div className="docs-select">
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
