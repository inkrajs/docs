import { PencilText, Table } from '@inkra/react';
import { useLocale } from '../i18n';
import './ApiTable.css';
import { describeApiProp } from './apiDescriptions';

export function ApiTable({ rows, label = 'API', component = '' }: { rows: readonly (readonly string[])[]; label?: string; component?: string }) {
  const { t, locale } = useLocale();
  const extended = rows.some(row => row.length === 4);
  const headings = extended ? ['属性', '类型', '默认值', '说明'] : ['属性', '类型', '说明'];
  const describedRows = rows.map(row => row.length > 2 ? row : [...row, describeApiProp(component, row[0], locale)]);
  return <Table.Container className="docs-api-table" role="region" aria-label={label}>
    <Table.Root layout="fixed" aria-label={label}>
      <Table.Header><Table.Row>{headings.map(heading => <Table.Head key={heading}>{t(heading)}</Table.Head>)}</Table.Row></Table.Header>
      <Table.Body>{describedRows.map(row => <Table.Row key={row[0]}>
        {headings.map((heading, index) => <Table.Cell key={heading} verticalAlign="top">
          <PencilText as={index < (extended ? 3 : 2) ? 'code' : 'span'}>{row[index] ?? ''}</PencilText>
        </Table.Cell>)}
      </Table.Row>)}</Table.Body>
    </Table.Root>
  </Table.Container>;
}
