import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import { Button, DatePicker, TimePicker } from '@inkra/react';

const initialDate = new Date(2026, 9, 22);
const sizes = ['sm', 'md', 'lg'] as const;

function Item({ testId, children }: { testId: string; children: ReactNode }) {
  return <div data-testid={testId} style={{ minWidth: 0, width: 'min(100%, 380px)' }}>{children}</div>;
}

function PickerSharedControlFixture() {
  return <main id="picker-shared-control-fixture" style={{ boxSizing: 'border-box', display: 'grid', gap: 24, padding: 20 }}>
    <section aria-label="Picker sizes" style={{ display: 'grid', gap: 16 }}>
      {sizes.map(size => <div key={size} data-testid={`size-${size}`} style={{ display: 'grid', gap: 12 }}>
        <Item testId={`date-${size}`}><DatePicker defaultValue={initialDate} locale="en-US" size={size} /></Item>
        <Item testId={`time-${size}`}><TimePicker defaultValue="09:30" locale="en-US" size={size} /></Item>
      </div>)}
    </section>

    <section aria-label="Localized picker actions" style={{ display: 'grid', gap: 12 }}>
      <Item testId="date-en"><DatePicker defaultValue={initialDate} locale="en-US" /></Item>
      <Item testId="date-zh"><DatePicker defaultValue={initialDate} locale="zh-CN" /></Item>
      <Item testId="time-en"><TimePicker defaultValue="09:30" locale="en-US" /></Item>
      <Item testId="time-zh"><TimePicker defaultValue="09:30" locale="zh-CN" /></Item>
    </section>

    <section aria-label="Picker states" style={{ display: 'grid', gap: 12 }}>
      <Item testId="date-disabled"><DatePicker defaultValue={initialDate} disabled locale="en-US" /></Item>
      <Item testId="date-readonly"><DatePicker defaultValue={initialDate} readOnly locale="en-US" /></Item>
      <Item testId="time-disabled"><TimePicker defaultValue="09:30" disabled locale="en-US" /></Item>
      <Item testId="time-readonly"><TimePicker defaultValue="09:30" readOnly locale="en-US" /></Item>
    </section>

    <section aria-label="RTL pickers" style={{ display: 'grid', gap: 12 }}>
      <Item testId="date-rtl"><DatePicker defaultValue={initialDate} dir="rtl" locale="en-US" /></Item>
      <Item testId="time-rtl"><TimePicker defaultValue="09:30" dir="rtl" locale="en-US" /></Item>
    </section>

    <section aria-label="Picker reset forms" style={{ display: 'grid', gap: 16 }}>
      <form aria-label="Date reset form" data-testid="date-reset-form" style={{ display: 'grid', gap: 8, width: 'min(100%, 380px)' }}>
        <DatePicker defaultValue={initialDate} locale="en-US" name="departure" />
        <Button type="reset" variant="outline">Reset date</Button>
      </form>
      <form aria-label="Time reset form" data-testid="time-reset-form" style={{ display: 'grid', gap: 8, width: 'min(100%, 380px)' }}>
        <TimePicker defaultValue="09:30" locale="en-US" name="meetingTime" />
        <Button type="reset" variant="outline">Reset time</Button>
      </form>
    </section>
  </main>;
}

export function mountPickerSharedControlFixture() {
  const docsRoot = document.getElementById('root');
  if (docsRoot) docsRoot.hidden = true;
  document.getElementById('picker-shared-control-host')?.remove();
  const host = document.createElement('div');
  host.id = 'picker-shared-control-host';
  document.body.append(host);
  createRoot(host).render(<PickerSharedControlFixture />);
}
