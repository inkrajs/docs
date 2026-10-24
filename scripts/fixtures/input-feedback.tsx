import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Editable,
  HotkeyInput,
  Textarea,
  type HotkeyInputChangeDetails,
  type HotkeyValue,
} from '@inkra/react';

type InputFeedbackEvents = {
  hotkeyCancel: string[];
  hotkeyChange: Array<{ value: HotkeyValue | null; details: HotkeyInputChangeDetails }>;
  hotkeyConflict: string[];
  internalCancel: string[];
  internalSave: string[];
  externalSave: string[];
  asyncValidation: string[];
  asyncSave: string[];
  customValue: string[];
  preventedBlur: string[];
  preventedSave: string[];
};

type InputFeedbackControls = {
  updateInternalState?: (next: { disabled?: boolean; readOnly?: boolean }) => void;
};

const initialShortcut: HotkeyValue = { key: 'S', code: 'KeyS', modifiers: ['control'] };
const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration));

function InputFeedbackFixture({ controls, events }: { controls: InputFeedbackControls; events: InputFeedbackEvents }) {
  const [shortcut, setShortcut] = useState<HotkeyValue | null>(initialShortcut);
  const [internalValue, setInternalValue] = useState('Internal title');
  const [externalValue, setExternalValue] = useState('External title');
  const [asyncValue, setAsyncValue] = useState('Async title');
  const [customValue, setCustomValue] = useState('Controlled note');
  const [preventedValue, setPreventedValue] = useState('Prevented blur');
  const [internalDisabled, setInternalDisabled] = useState(false);
  const [internalReadOnly, setInternalReadOnly] = useState(false);
  controls.updateInternalState = next => {
    if (next.disabled !== undefined) setInternalDisabled(next.disabled);
    if (next.readOnly !== undefined) setInternalReadOnly(next.readOnly);
  };

  return <main style={{ display: 'grid', gap: 24, maxWidth: 720, padding: 24 }}>
    <section data-testid="hotkey-case">
      <HotkeyInput
        aria-label="Record fixture shortcut"
        clearButtonLabel="Clear fixture shortcut"
        conflictMessage="Reserved shortcut"
        onCancel={() => events.hotkeyCancel.push('cancel')}
        onConflict={(_, message) => events.hotkeyConflict.push(message)}
        onValueChange={(next, details) => {
          setShortcut(next);
          events.hotkeyChange.push({ value: next, details });
        }}
        placeholder="No shortcut"
        platform="windows"
        recordingLabel="Recording shortcut"
        validateHotkey={next => next.code === 'KeyK' && next.modifiers?.includes('control')
          ? 'Reserved shortcut'
          : undefined}
        value={shortcut}
      />
    </section>

    <section data-testid="hotkey-size-case" style={{ display: 'grid', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div data-testid={`hotkey-size-${size}`} key={size}>
        <HotkeyInput
          aria-label={`Hotkey ${size}`}
          clearable={false}
          defaultValue={initialShortcut}
          platform="windows"
          recordingLabel={`Recording ${size}`}
          size={size}
        />
      </div>)}
    </section>

    <section data-testid="internal-editable-case">
      <Editable
        aria-label="Edit internal title"
        blurBehavior="save"
        cancelLabel="Cancel internal"
        disabled={internalDisabled}
        onCancel={value => events.internalCancel.push(value)}
        onSave={value => events.internalSave.push(value)}
        onValueChange={setInternalValue}
        readOnly={internalReadOnly}
        saveLabel="Save internal"
        startEditingLabel="Edit internal title"
        value={internalValue}
      />
    </section>

    <section data-testid="external-blur-case">
      <Editable
        aria-label="Edit external title"
        blurBehavior="save"
        cancelLabel="Cancel external"
        onSave={value => events.externalSave.push(value)}
        onValueChange={setExternalValue}
        saveLabel="Save external"
        startEditingLabel="Edit external title"
        value={externalValue}
      />
      <Button data-testid="external-focus-target">Outside target</Button>
    </section>

    <section data-testid="size-alignment-case" style={{ display: 'grid', gap: 12 }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div data-testid={`size-${size}`} key={size}>
        <Editable
          aria-label={`Edit ${size} value`}
          cancelLabel={`Cancel ${size}`}
          defaultValue={`${size} value`}
          inputProps={{ size }}
          saveLabel={`Save ${size}`}
          startEditingLabel={`Edit ${size} value`}
        />
      </div>)}
    </section>

    <section data-testid="async-validation-case">
      <Editable
        aria-label="Edit async title"
        cancelLabel="Cancel async"
        onSave={async value => {
          events.asyncSave.push(value);
          await wait(35);
        }}
        onValueChange={setAsyncValue}
        saveLabel="Save async"
        startEditingLabel="Edit async title"
        validate={async value => {
          events.asyncValidation.push(value);
          await wait(35);
          return value === 'bad' ? 'Async invalid' : undefined;
        }}
        value={asyncValue}
      />
    </section>

    <section data-testid="custom-controlled-case">
      <Editable
        aria-label="Edit controlled note"
        cancelLabel="Cancel controlled"
        display={value => <a data-editable-ignore href="#controlled-profile" onClick={event => event.preventDefault()}>{value}</a>}
        editor={({ value, onValueChange, ...editorProps }) => <Textarea
          {...editorProps}
          value={value}
          onChange={event => onValueChange(event.currentTarget.value)}
        />}
        multiline
        onValueChange={value => {
          setCustomValue(value);
          events.customValue.push(value);
        }}
        saveLabel="Save controlled"
        startEditingLabel="Edit controlled note"
        value={customValue}
      />
    </section>

    <section data-testid="prevented-blur-case">
      <Editable
        aria-label="Edit prevented blur"
        blurBehavior="save"
        cancelLabel="Cancel prevented"
        editor={({ value, onBlur, onValueChange, ...editorProps }) => <Textarea
          {...editorProps}
          value={value}
          onBlur={event => {
            events.preventedBlur.push(value);
            event.preventDefault();
            onBlur(event);
          }}
          onChange={event => onValueChange(event.currentTarget.value)}
        />}
        multiline
        onSave={value => events.preventedSave.push(value)}
        onValueChange={setPreventedValue}
        saveLabel="Save prevented"
        startEditingLabel="Edit prevented blur"
        value={preventedValue}
      />
      <Button data-testid="prevented-focus-target">Prevented outside target</Button>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: InputFeedbackEvents = {
    hotkeyCancel: [],
    hotkeyChange: [],
    hotkeyConflict: [],
    internalCancel: [],
    internalSave: [],
    externalSave: [],
    asyncValidation: [],
    asyncSave: [],
    customValue: [],
    preventedBlur: [],
    preventedSave: [],
  };
  const controls: InputFeedbackControls = {};
  root.render(<InputFeedbackFixture controls={controls} events={events} />);
  return {
    events,
    updateInternalState: (next: { disabled?: boolean; readOnly?: boolean }) => controls.updateInternalState?.(next),
    unmount: () => root.unmount(),
  };
}
