import { useState, type ReactNode } from 'react';
import { Button, Log, PencilIcon, Switch, type LogEntry, type LogLevelDefinition } from '@inkra/react';
import { __iconData as bugIcon } from 'lucide-react/dist/esm/icons/bug.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/circle-check.mjs';
import { __iconData as infoIcon } from 'lucide-react/dist/esm/icons/info.mjs';
import { __iconData as shieldIcon } from 'lucide-react/dist/esm/icons/shield.mjs';
import { __iconData as swordIcon } from 'lucide-react/dist/esm/icons/swords.mjs';
import { __iconData as triangleIcon } from 'lucide-react/dist/esm/icons/triangle-alert.mjs';

import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon, iconPaths, type LucideIconData } from './DocsIcon';
import { PropertyTabs } from './PropertyTabs';
import { PencilText, useLocale } from '../i18n';
import './LogExamples.css';

type DemoLevel = 'info' | 'success' | 'warning' | 'error';

const levelDefinitions: readonly LogLevelDefinition[] = [
  { value: 'info', label: '信息', tone: 'info' },
  { value: 'success', label: '成功', tone: 'success' },
  { value: 'warning', label: '警告', tone: 'warning' },
  { value: 'error', label: '错误', tone: 'danger' },
];

const iconData: Record<DemoLevel, LucideIconData> = {
  info: infoIcon,
  success: checkIcon,
  warning: triangleIcon,
  error: bugIcon,
};

function LogIcon({ level }: { level: DemoLevel }) {
  return <PencilIcon paths={iconPaths(iconData[level])} size={20} sourceSize={24} />;
}

const initialRecords: readonly LogEntry[] = [
  { id: 'run-1', time: '09:42:01', dateTime: '2026-10-23T09:42:01+08:00', level: 'info', icon: <LogIcon level="info" />, content: '开始同步工作区' },
  { id: 'run-2', time: '09:42:03', dateTime: '2026-10-23T09:42:03+08:00', level: 'success', icon: <LogIcon level="success" />, content: '读取 24 个文件' },
  { id: 'run-3', time: '09:42:04', dateTime: '2026-10-23T09:42:04+08:00', level: 'warning', icon: <LogIcon level="warning" />, content: '缓存接近容量上限' },
  { id: 'run-4', time: '09:42:07', dateTime: '2026-10-23T09:42:07+08:00', level: 'success', icon: <LogIcon level="success" />, content: '同步完成' },
];

const gameEvents: readonly LogEntry[] = [
  { id: 'event-1', time: '回合 1', level: 'info', icon: <PencilIcon paths={iconPaths(swordIcon)} size={20} sourceSize={24} />, content: '游侠向北移动。' },
  { id: 'event-2', time: '回合 1', level: 'warning', icon: <PencilIcon paths={iconPaths(shieldIcon)} size={20} sourceSize={24} />, content: '护盾吸收 8 点伤害' },
  { id: 'event-3', time: '回合 2', level: 'success', icon: <PencilIcon paths={iconPaths(checkIcon)} size={20} sourceSize={24} />, content: '目标已解救' },
];

const labelMessages = {
  filters: '筛选记录级别',
  allLevels: '全部',
  pause: '暂停跟随',
  resume: '恢复跟随',
  latest: '回到底部',
  empty: '暂无记录',
  noMatches: '没有符合筛选条件的记录',
  list: '运行记录',
};

function ExampleFrame({ children }: { children: ReactNode }) {
  return <div className="log-examples__frame">{children}</div>;
}

export function LogExamples() {
  const { t } = useLocale();
  const [records, setRecords] = useState<readonly (LogEntry & { sequence?: number })[]>(initialRecords);
  const labels = Object.fromEntries(Object.entries(labelMessages).map(([key, value]) => [key, t(value)]));
  const localizedLevels = levelDefinitions.map(level => ({ ...level, label: typeof level.label === 'string' ? t(level.label) : level.label }));
  const localizeRecord = (record: LogEntry & { sequence?: number }): LogEntry => ({
    ...record,
    time: typeof record.time === 'string' ? t(record.time) : record.time,
    content: record.sequence ? `${t('新增记录')} ${record.sequence}` : typeof record.content === 'string' ? t(record.content) : record.content,
  });
  const localizedRecords = records.map(localizeRecord);
  const [filteredLevels, setFilteredLevels] = useState<readonly string[] | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [showFollow, setShowFollow] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const visibleRecords = localizedRecords.map(record => ({
    ...record,
    time: showTime ? record.time : undefined,
    dateTime: showTime ? record.dateTime : undefined,
    icon: showIcons ? record.icon : undefined,
  }));
  const code = `<Log
  items={records}
  levels={levels}
  filteredLevels={filteredLevels}
  onFilteredLevelsChange={setFilteredLevels}
  paused={${paused}}
  onPausedChange={setPaused}
  showLevelFilter={${showFilters}}
  showFollowControl={${showFollow}}
  labels={localizedLabels}
/>`;

  function appendRecord() {
    const index = records.length + 1;
    const level = (['info', 'success', 'warning', 'error'] as const)[index % 4];
    setRecords(current => [...current, {
      id: `run-${index}`,
      time: `09:42:${String(index + 4).padStart(2, '0')}`,
      level,
      icon: <LogIcon level={level} />,
      content: '',
      sequence: index,
    }]);
  }

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '内容', content: <>
        <Switch label={t('显示时间')} checked={showTime} onCheckedChange={setShowTime} />
        <Switch label={t('显示图标')} checked={showIcons} onCheckedChange={setShowIcons} />
      </> },
      { label: '交互', content: <>
        <Switch label={t('级别筛选')} checked={showFilters} onCheckedChange={setShowFilters} />
        <Switch label={t('跟随控制')} checked={showFollow} onCheckedChange={setShowFollow} />
        <Switch label={t('暂停自动跟随')} checked={paused} onCheckedChange={setPaused} />
        <Button variant="outline" onClick={appendRecord}>{t('追加记录')}</Button>
        <Button variant="ghost" onClick={() => setRecords([])}>{t('清空记录')}</Button>
      </> },
    ]} />}>
      <ExampleFrame>
        <Log
          aria-label={t('运行记录')}
          items={visibleRecords}
          labels={labels}
          levels={localizedLevels}
          filteredLevels={filteredLevels}
          onFilteredLevelsChange={setFilteredLevels}
          paused={paused}
          onPausedChange={setPaused}
          showFollowControl={showFollow}
          showLevelFilter={showFilters}
        />
      </ExampleFrame>
    </ComponentPlayground>

    <ComponentExample title={t('运行记录')} code={`const [records, setRecords] = useState(initialRecords);\n\n<Button onClick={() => setRecords(current => [...current, nextRecord])}>${t('追加记录')}</Button>\n<Log items={records} levels={levels} labels={localizedLabels} />`}>
      <div className="log-examples__stack">
        <Button size="sm" variant="outline" onClick={appendRecord}>{t('追加记录')}</Button>
        <ExampleFrame><Log items={localizedRecords} labels={labels} levels={localizedLevels} /></ExampleFrame>
      </div>
    </ComponentExample>

    <ComponentExample title={t('游戏事件')} code={`<Log\n  items={gameEvents}\n  levels={levels}\n  defaultPaused\n  labels={{ ...localizedLabels, list: '${t('游戏事件')}' }}\n/>`}>
      <ExampleFrame>
        <Log items={gameEvents.map(localizeRecord)} levels={localizedLevels} defaultPaused labels={{ ...labels, list: t('游戏事件') }} />
      </ExampleFrame>
    </ComponentExample>

    <ComponentExample title={t('空状态与筛选')} code={`<Log items={[]} labels={localizedLabels} />\n<Log items={records} filteredLevels={[]} levels={levels} labels={localizedLabels} />`}>
      <div className="log-examples__empty-grid">
        <ExampleFrame><Log items={[]} labels={labels} showLevelFilter={false} showFollowControl={false} /></ExampleFrame>
        <ExampleFrame><Log items={initialRecords.map(localizeRecord)} filteredLevels={[]} levels={localizedLevels} labels={labels} showFollowControl={false} /></ExampleFrame>
      </div>
    </ComponentExample>
  </>;
}
