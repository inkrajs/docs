import { useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, DataTable, type DataTableColumnDef, type DataTablePaginationState, type DataTableProps } from '@inkra/react';

type Row = { id: string; name: string; status: string; count: number };
type Events = {
  accepted: DataTablePaginationState[];
  rejected: DataTablePaginationState[];
  corrections: DataTablePaginationState[];
  dynamic: DataTablePaginationState[];
  correctionRenders: number;
  stableCorrections: DataTablePaginationState[];
};

const rows: Row[] = [
  { id: 'alpha', name: 'Alpha notebook', status: 'Draft', count: 8 },
  { id: 'beta', name: 'Beta notebook with a deliberately long readable name', status: 'Complete', count: 3 },
  { id: 'gamma', name: 'Gamma notebook', status: 'Review', count: 13 },
  { id: 'delta', name: 'Delta notebook', status: 'Draft', count: 5 },
  { id: 'epsilon', name: 'Epsilon notebook', status: 'Complete', count: 2 },
];

const stableRejected = { pageIndex: 9, pageSize: 2 };
const expandedRows: Row[] = [...rows, { id: 'zeta', name: 'Zeta notebook', status: 'Draft', count: 1 }];

function StableCorrectionCase({ events }: { events: Events }) {
  const [data, setData] = useState(rows);
  const [revision, setRevision] = useState(0);
  const columns = useMemo<DataTableColumnDef<Row>[]>(() => [{ accessorKey: 'name', header: 'Notebook name' }], []);
  const rejectCorrection = useCallback<NonNullable<DataTableProps<Row>['onPaginationChange']>>(updater => {
    if (typeof updater !== 'function') events.stableCorrections.push(updater);
  }, [events]);
  return <section data-testid="stable-correction-case">
    <Button onClick={() => setData(expandedRows)}>Grow rejected rows</Button>
    <Button onClick={() => setRevision(value => value + 1)}>Rerender stable correction {revision}</Button>
    <DataTable data={data} columns={columns} getRowId={row => row.id} pagination
      paginationState={stableRejected} onPaginationChange={rejectCorrection} />
  </section>;
}

function update(updater: DataTablePaginationState | ((current: DataTablePaginationState) => DataTablePaginationState), current: DataTablePaginationState) {
  return typeof updater === 'function' ? updater(current) : updater;
}

function Fixture({ events }: { events: Events }) {
  const columns = useMemo<DataTableColumnDef<Row>[]>(() => [
    { accessorKey: 'name', header: 'Notebook name' },
    { accessorKey: 'status', header: () => <strong data-testid="custom-header">Custom status</strong>, enableSorting: false },
    { accessorKey: 'count', header: 'Entry count', cell: context => <strong data-custom-cell>{String(context.getValue())}</strong> },
  ], []);
  const [accepted, setAccepted] = useState<DataTablePaginationState>({ pageIndex: 0, pageSize: 2 });
  const rejected = { pageIndex: 0, pageSize: 2 };
  const correctionRejected = { pageIndex: 9, pageSize: 2 };
  const [correctionRender, setCorrectionRender] = useState(0);
  const [dynamicData, setDynamicData] = useState(rows);
  const [dynamic, setDynamic] = useState<DataTablePaginationState>({ pageIndex: 2, pageSize: 2 });
  events.correctionRenders += 1;

  return <main style={{ display: 'grid', gap: 24, maxWidth: 900, padding: 24 }}>
    <StableCorrectionCase events={events} />
    <section data-testid="accepted-case">
      <DataTable data={rows} columns={columns} filterable filterLabel="Filter accepted rows" getRowId={row => row.id} pagination
        paginationLabel="Accepted pagination" paginationState={accepted}
        onPaginationChange={updater => {
          const next = update(updater, accepted);
          events.accepted.push(next);
          setAccepted(next);
        }} />
    </section>

    <section data-testid="rejected-case">
      <DataTable data={rows} columns={columns} getRowId={row => row.id} pagination
        paginationLabel="Rejected pagination" paginationState={rejected}
        onPaginationChange={updater => { events.rejected.push(update(updater, rejected)); }} />
    </section>

    <section data-testid="correction-case">
      <Button onClick={() => setCorrectionRender(value => value + 1)}>Rerender rejected correction {correctionRender}</Button>
      <DataTable data={rows} columns={columns} getRowId={row => row.id} pagination
        paginationLabel="Correction pagination" paginationState={correctionRejected}
        onPaginationChange={updater => { events.corrections.push(update(updater, correctionRejected)); }} />
    </section>

    <section data-testid="dynamic-case">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button onClick={() => setDynamicData([])}>Empty dynamic rows</Button>
        <Button onClick={() => setDynamicData(rows)}>Restore dynamic rows</Button>
        <Button onClick={() => setDynamicData(rows.slice(0, 1))}>Shrink dynamic rows</Button>
      </div>
      <DataTable data={dynamicData} columns={columns} emptyMessage="No dynamic rows" getRowId={row => row.id} pagination
        paginationLabel="Dynamic pagination" paginationState={dynamic}
        onPaginationChange={updater => {
          const next = update(updater, dynamic);
          events.dynamic.push(next);
          setDynamic(next);
        }} />
    </section>

    <section data-testid="narrow-rtl-case" dir="rtl" style={{ inlineSize: 232, maxInlineSize: '100%', minInlineSize: 0 }}>
      <DataTable data={rows} columns={columns} getRowId={row => row.id} pagination
        paginationLabel="RTL narrow pagination" defaultPagination={{ pageIndex: 0, pageSize: 2 }} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { accepted: [], rejected: [], corrections: [], dynamic: [], correctionRenders: 0, stableCorrections: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
