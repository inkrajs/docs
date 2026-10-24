import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import {
  DatePicker,
  HotkeyInput,
  Input,
  InputNumber,
  Select,
  TagInput,
  TimePicker,
  TreeSelect,
} from '@inkra/react';

const sizes = ['sm', 'md', 'lg'] as const;
const selectItems = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team' },
  { value: 'public', label: 'Public' },
];
const tags = [
  { id: 'react', value: 'react', label: 'React' },
  { id: 'design-system', value: 'design-system', label: 'Design System' },
];
const crowdedTags = [
  ...tags,
  { id: 'accessibility', value: 'accessibility', label: 'Accessibility' },
  { id: 'tokens', value: 'tokens', label: 'Design Tokens' },
];
const treeItems = [
  {
    id: 'notes',
    label: 'Notes',
    children: [
      { id: 'drafts', label: 'Drafts' },
      { id: 'published', label: 'Published' },
    ],
  },
];

function Case({ kind, children }: { kind: string; children: ReactNode }) {
  return <div data-form-size-kind={kind} style={{ minWidth: 0 }}>{children}</div>;
}

function SizeRow({ size }: { size: typeof sizes[number] }) {
  return <section data-form-size={size} style={{ display: 'grid', gap: 16 }}>
    <h2 style={{ margin: 0 }}>{size}</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 21rem), 1fr))', gap: 16 }}>
      <Case kind="input"><Input aria-label={`${size} input`} clearable defaultValue="Inkra" size={size} /></Case>
      <Case kind="input-number"><InputNumber aria-label={`${size} number`} defaultValue={2} decrementButtonLabel="Decrease" incrementButtonLabel="Increase" size={size} /></Case>
      <Case kind="tag-input"><TagInput aria-label={`${size} tags`} clearable={false} size={size} value={[tags[0]]} /></Case>
      <Case kind="tag-input-disabled"><TagInput aria-label={`${size} disabled tags`} disabled size={size} value={tags} /></Case>
      <Case kind="select">
        <Select.Root defaultValue="team">
          <Select.Trigger aria-label={`${size} select`} size={size}><Select.Value>Team</Select.Value></Select.Trigger>
        </Select.Root>
      </Case>
      <Case kind="select-stepper">
        <Select.Stepper aria-label={`${size} stepper select`} defaultValue="team" items={selectItems} size={size} />
      </Case>
      <Case kind="searchable">
        <Select.Searchable aria-label={`${size} searchable select`} clearable defaultValue="team" items={selectItems} size={size} />
      </Case>
      <Case kind="tree-select">
        <TreeSelect aria-label={`${size} tree select`} defaultValue="drafts" items={treeItems} size={size} />
      </Case>
      <Case kind="hotkey">
        <HotkeyInput aria-label={`${size} hotkey`} clearable defaultValue={{ key: 'S', code: 'KeyS', modifiers: ['control'] }} size={size} />
      </Case>
      <Case kind="date-picker">
        <DatePicker aria-label={`${size} date`} clearable defaultValue={new Date(2026, 9, 23)} size={size} />
      </Case>
      <Case kind="time-picker">
        <TimePicker aria-label={`${size} time`} clearable defaultValue="09:30" size={size} />
      </Case>
    </div>
  </section>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<main style={{ display: 'grid', gap: 24, maxWidth: 960, padding: 16 }}>
    {sizes.map(size => <SizeRow key={size} size={size} />)}
    <section data-form-size-wrap style={{ inlineSize: '12rem' }}>
      <TagInput aria-label="Crowded tags" clearable={false} size="md" value={crowdedTags} />
    </section>
  </main>);
  return { unmount: () => root.unmount() };
}
