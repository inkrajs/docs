import { createRoot } from 'react-dom/client';
import { Alert, Button, Pagination, PencilText, Rating, Skeleton, Tree } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: { preview: (number | null)[]; value: number[]; close: boolean[]; page: number[] } = { preview: [], value: [], close: [], page: [] };
  const options = {
    hoverPreview: true, disabled: false, readOnly: false, ratingValue: undefined as number | undefined,
    form: 'rating-form', count: 5, step: .5, preventReset: false,
    alertOpen: undefined as boolean | undefined, total: 10, page: undefined as number | undefined,
    simple: false, hideSingle: false, previousNext: true, indent: 24,
    size: 'md' as 'sm' | 'md' | 'lg', rtl: false,
  };
  function update(next: Partial<typeof options> = {}) {
    Object.assign(options, next);
    root.render(<div dir={options.rtl ? 'rtl' : 'ltr'} style={{ display: 'grid', gap: 24, padding: 16, maxWidth: 680 }}>
      <form id="rating-form" onReset={event => {
        if (options.preventReset) event.preventDefault();
        // Consumers often rerender from their reset handler.
        update();
      }}><Button type="reset">Reset rating</Button></form>
      <form id="other-form"><Button type="reset">Reset other</Button></form>
      <Rating name="score" form={options.form} aria-label="Score" defaultValue={2.5} step={options.step} count={options.count}
        value={options.ratingValue} disabled={options.disabled} readOnly={options.readOnly} hoverPreview={options.hoverPreview}
        onValueChange={value => events.value.push(value)} onPreviewChange={value => events.preview.push(value)} />
      <Alert.Root closable open={options.alertOpen} onOpenChange={value => events.close.push(value)} closeLabel="Dismiss notice">
        <Alert.Title>Saved changes</Alert.Title><Alert.Description>A long notification remains readable beside its own dismiss control.</Alert.Description>
      </Alert.Root>
      <Pagination totalPages={options.total} page={options.page} defaultPage={2} simple={options.simple}
        hideOnSinglePage={options.hideSingle} showPreviousNext={options.previousNext} onPageChange={value => events.page.push(value)}
        renderPage={(page, { isCurrent }) => <PencilText>{`${isCurrent ? '[' : ''}${page}${isCurrent ? ']' : ''}`}</PencilText>}
        renderSummary={(page, total) => <PencilText>{`${page} of ${total}`}</PencilText>} />
      <Tree.Root aria-label="Folders" defaultExpandedKeys={['root']} size={options.size} indent={options.indent}>
        <Tree.Item id="root" textValue="Folder"><Tree.ItemContent>{({ isExpanded, level, isSelected }) => <>
          <Tree.ItemTitle>Folder</Tree.ItemTitle><Tree.ItemDescription>{`${isExpanded ? 'Open' : 'Closed'} level ${level} selected ${isSelected}`}</Tree.ItemDescription>
        </>}</Tree.ItemContent>
          <Tree.Item id="child" textValue="Note"><Tree.ItemContent>{({ level }) => <Tree.ItemTitle>{`Note level ${level}`}</Tree.ItemTitle>}</Tree.ItemContent></Tree.Item>
        </Tree.Item>
      </Tree.Root>
      <Skeleton width="75%" height={40} animation="pulse" />
    </div>);
  }
  update();
  return { update, events, unmount: () => root.unmount() };
}
