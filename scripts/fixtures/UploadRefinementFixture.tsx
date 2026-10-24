import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Upload, type UploadChangeReason, type UploadItem } from '@inkra/react';

type UploadRefinementEvents = {
  asyncReasons: UploadChangeReason[];
};

type UploadRefinementControls = {
  resolveUpload?: () => void;
  setDisabled?: (disabled: boolean) => void;
};

const labels = {
  browse: 'Choose fixture files',
  drop: 'or drop fixture files here',
  upload: 'Upload this deliberately long action label',
  retry: 'Retry this deliberately long action label',
  cancel: 'Cancel this deliberately long action label',
  remove: 'Remove this deliberately long action label',
};

function Fixture({ controls, events }: { controls: UploadRefinementControls; events: UploadRefinementEvents }) {
  const [disabled, setDisabled] = useState(false);
  const resolver = useRef<(() => void) | null>(null);
  controls.setDisabled = setDisabled;
  controls.resolveUpload = () => resolver.current?.();
  const [narrowFiles] = useState<UploadItem[]>(() => [
    {
      id: 'long-file',
      file: new File(['fixture'], 'a-deliberately-long-upload-file-name-that-must-truncate-with-pencil-text.pdf', { type: 'application/pdf' }),
      status: 'selected',
    },
    {
      id: 'retry-file',
      file: new File(['retry'], 'retry-file.pdf', { type: 'application/pdf' }),
      status: 'cancelled',
    },
  ]);
  const [asyncFiles, setAsyncFiles] = useState<UploadItem[]>(() => [{
    id: 'async-file',
    file: new File(['async'], 'pending-upload.pdf', { type: 'application/pdf' }),
    status: 'selected',
  }]);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 720, padding: 24 }}>
    <section data-testid="picker-case" style={{ inlineSize: 360 }}>
      <Upload
        aria-label="Picker fixture"
        disabled={disabled}
        inputProps={{ 'aria-label': 'Hidden native picker' }}
        labels={labels}
      />
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 220, maxInlineSize: 220, minInlineSize: 0 }}>
      <Upload
        aria-label="Narrow fixture"
        autoUpload={false}
        defaultFiles={narrowFiles}
        labels={labels}
        onUpload={() => undefined}
      />
    </section>

    <section data-testid="async-case" style={{ inlineSize: 360 }}>
      <Upload
        aria-label="Async fixture"
        autoUpload={false}
        files={asyncFiles}
        labels={labels}
        onFilesChange={(next, details) => {
          setAsyncFiles([...next]);
          events.asyncReasons.push(details.reason);
        }}
        onUpload={() => new Promise<void>(resolve => { resolver.current = resolve; })}
      />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const controls: UploadRefinementControls = {};
  const events: UploadRefinementEvents = { asyncReasons: [] };
  root.render(<Fixture controls={controls} events={events} />);
  return {
    events,
    resolveUpload: () => controls.resolveUpload?.(),
    setDisabled: (disabled: boolean) => controls.setDisabled?.(disabled),
    unmount: () => root.unmount(),
  };
}
