import { useMemo, useState } from 'react';
import { Button, Switch, Transfer, type TransferChangeDetails, type TransferItem } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './TransferExamples.css';

const people: TransferItem[] = [
  { id: 'ada', label: 'Ada Lovelace', description: '分析笔记', keywords: ['math', 'writing'] },
  { id: 'grace', label: 'Grace Hopper', description: '编译器系统', keywords: ['systems', 'navy'] },
  { id: 'margaret', label: 'Margaret Hamilton', description: '飞行软件', keywords: ['space', 'software'] },
  { id: 'katherine', label: 'Katherine Johnson', description: '轨道计算', keywords: ['space', 'math'] },
  { id: 'radia', label: 'Radia Perlman', description: '网络协议', keywords: ['network', 'systems'] },
  { id: 'review', label: '评审账户', description: '策略已锁定', disabled: true, keywords: ['locked'] },
];

const labelMessages = {
  sourceTitle: '可选成员',
  targetTitle: '已选成员',
  sourceSearchLabel: '搜索可选成员',
  targetSearchLabel: '搜索已选成员',
  sourceClearSearch: '清除可选成员搜索',
  targetClearSearch: '清除已选成员搜索',
  sourceSearchPlaceholder: '姓名、领域',
  targetSearchPlaceholder: '筛选已选',
  selectAllSource: '选择当前筛选的可选成员',
  selectAllTarget: '选择当前筛选的已选成员',
  sourceEmpty: '没有更多可选成员',
  targetEmpty: '尚未选择成员',
  sourceNoResults: '当前筛选没有可选成员',
  targetNoResults: '当前筛选没有已选成员',
  moveToTarget: '移到已选',
  moveToSource: '移回可选',
  moveSelectedToTarget: '移动当前筛选并勾选的成员到已选',
  moveSelectedToSource: '移动当前筛选并勾选的成员到可选',
  batchActions: '批量移动当前可见成员',
};

export function TransferExamples() {
  const { t } = useLocale();
  const labels = Object.fromEntries(Object.entries(labelMessages).map(([key, value]) => [key, t(value)]));
  const localizedPeople = people.map(person => ({ ...person, label: t(String(person.label)), description: t(String(person.description)) }));
  const [targetKeys, setTargetKeys] = useState<string[]>(['grace', 'margaret']);
  const [disabled, setDisabled] = useState(false);
  const [searchable, setSearchable] = useState(true);
  const [lastEvent, setLastEvent] = useState<TransferChangeDetails | null>(null);
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
      { label: t('交互'), content: <Switch label={t('显示搜索')} checked={searchable} onCheckedChange={setSearchable} /> },
      { label: t('状态'), content: <Switch label={t('整体禁用')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <div className="transfer-example__playground" data-testid="transfer-playground">
        <Transfer
          disabled={disabled}
          formatCount={({ visible, total, selected }) => selected > 0
            ? `${selected} ${t('已勾选')} · ${visible}/${total}`
            : `${visible}/${total}`}
          items={localizedPeople}
          labels={labels}
          onTargetKeysChange={(next, details) => {
            setTargetKeys(next);
            setLastEvent(details);
          }}
          searchable={searchable}
          targetKeys={targetKeys}
        />
        <output aria-live="polite" className="transfer-example__status">
          {lastEvent ? `${t(lastEvent.direction === 'to-target' ? '已移到右侧' : '已移回左侧')} · ${lastEvent.movedKeys.map(key => localizedPeople.find(person => person.id === key)?.label ?? key).join(', ')}` : t('等待移动')}
        </output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={t('非受控初始选择')} code={`<Transfer items={people} defaultTargetKeys={['ada', 'katherine']} labels={labels} />`}>
      <div className="transfer-example__frame" data-testid="transfer-uncontrolled">
        <Transfer items={localizedPeople.slice(0, 5)} defaultTargetKeys={['ada', 'katherine']} labels={labels} />
      </div>
    </ComponentExample>

    <ComponentExample title={t('空态与外部重置')} code={`<Transfer items={people.slice(0, 2)} targetKeys={targetKeys} onTargetKeysChange={setTargetKeys} />`}>
      <div className="transfer-example__stack" data-testid="transfer-empty-state">
        <Transfer
          items={localizedPeople.slice(0, 2)}
          labels={labels}
          onTargetKeysChange={setTargetKeys}
          targetKeys={targetKeys.filter(key => key === 'ada' || key === 'grace')}
        />
        <Button variant="ghost" onClick={() => setTargetKeys([])}>{t('清空已选')}</Button>
      </div>
    </ComponentExample>
  </>;
}
