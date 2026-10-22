import { useMemo, useState } from 'react';
import { Button, Switch, Transfer, type TransferChangeDetails, type TransferItem } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './TransferExamples.css';

const people: TransferItem[] = [
  { id: 'ada', label: 'Ada Lovelace', description: 'Analytical notes', keywords: ['math', 'writing'] },
  { id: 'grace', label: 'Grace Hopper', description: 'Compiler systems', keywords: ['systems', 'navy'] },
  { id: 'margaret', label: 'Margaret Hamilton', description: 'Flight software', keywords: ['space', 'software'] },
  { id: 'katherine', label: 'Katherine Johnson', description: 'Orbital calculations', keywords: ['space', 'math'] },
  { id: 'radia', label: 'Radia Perlman', description: 'Network protocols', keywords: ['network', 'systems'] },
  { id: 'review', label: 'Review account', description: 'Locked by policy', disabled: true, keywords: ['locked'] },
];

const labels = {
  sourceTitle: '可选成员 / Available people',
  targetTitle: '已选成员 / Selected people',
  sourceSearchLabel: '搜索可选成员 / Search available people',
  targetSearchLabel: '搜索已选成员 / Search selected people',
  sourceClearSearch: '清除可选成员搜索 / Clear available search',
  targetClearSearch: '清除已选成员搜索 / Clear selected search',
  sourceSearchPlaceholder: '姓名、领域 / Name or field',
  targetSearchPlaceholder: '筛选已选 / Filter selected',
  selectAllSource: '选择当前筛选的可选成员 / Select filtered available people',
  selectAllTarget: '选择当前筛选的已选成员 / Select filtered selected people',
  sourceEmpty: '没有更多可选成员 / No more available people',
  targetEmpty: '尚未选择成员 / No people selected',
  sourceNoResults: '当前筛选没有可选成员 / No available matches',
  targetNoResults: '当前筛选没有已选成员 / No selected matches',
  moveToTarget: '移到已选 / Move to selected',
  moveToSource: '移回可选 / Move to available',
  moveSelectedToTarget: '移动当前筛选并勾选的成员到已选 / Move checked filtered people to selected',
  moveSelectedToSource: '移动当前筛选并勾选的成员到可选 / Move checked filtered people to available',
  batchActions: '批量移动当前可见成员 / Move visible people in batches',
};

function eventSummary(details: TransferChangeDetails) {
  return `${details.action} · ${details.direction} · ${details.movedKeys.join(', ')}`;
}

export function TransferExamples() {
  const { t } = useLocale();
  const [targetKeys, setTargetKeys] = useState<string[]>(['grace', 'margaret']);
  const [disabled, setDisabled] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [lastEvent, setLastEvent] = useState('');
  const code = useMemo(() => `const [targetKeys, setTargetKeys] = useState(['grace', 'margaret']);

<Transfer
  items={people}
  targetKeys={targetKeys}
  onTargetKeysChange={(nextKeys, details) => setTargetKeys(nextKeys)}
  labels={labels}
  searchable={${searchable}}
  disabled={${disabled}}
/>`, [disabled, searchable]);

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: t('交互'), content: <Switch label={t('显示搜索 / Show search')} checked={searchable} onCheckedChange={setSearchable} /> },
      { label: t('状态'), content: <Switch label={t('整体禁用 / Disable all')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="transfer-example__playground" data-testid="transfer-playground">
        <Transfer
          disabled={disabled}
          formatCount={({ visible, total, selected }) => selected > 0
            ? `${selected} 已勾选 / checked · ${visible}/${total}`
            : `${visible}/${total}`}
          items={people}
          labels={labels}
          onTargetKeysChange={(next, details) => {
            setTargetKeys(next);
            setLastEvent(eventSummary(details));
          }}
          searchable={searchable}
          targetKeys={targetKeys}
        />
        <output aria-live="polite" className="transfer-example__status">
          {lastEvent || t('等待移动 / Waiting for a move')}
        </output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={t('非受控初始选择 / Uncontrolled initial selection')} code={`<Transfer items={people} defaultTargetKeys={['ada', 'katherine']} labels={labels} />`}>
      <div className="transfer-example__frame" data-testid="transfer-uncontrolled">
        <Transfer items={people.slice(0, 5)} defaultTargetKeys={['ada', 'katherine']} labels={labels} />
      </div>
    </ComponentExample>

    <ComponentExample title={t('空态与外部重置 / Empty state and external reset')} code={`<Transfer items={people.slice(0, 2)} targetKeys={targetKeys} onTargetKeysChange={setTargetKeys} />`}>
      <div className="transfer-example__stack" data-testid="transfer-empty-state">
        <Transfer
          items={people.slice(0, 2)}
          labels={labels}
          onTargetKeysChange={setTargetKeys}
          targetKeys={targetKeys.filter(key => key === 'ada' || key === 'grace')}
        />
        <Button variant="ghost" onClick={() => setTargetKeys([])}>{t('清空已选 / Clear selected')}</Button>
      </div>
    </ComponentExample>
  </>;
}
