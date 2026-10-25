import { useState } from 'react';
import { Button, InventoryGrid, PencilIcon, Switch, type InventoryContainer, type InventoryItem } from '@inkra/react';
import { useLocale } from '../../i18n';
import { __iconData as wrenchIcon } from 'lucide-react/dist/esm/icons/wrench.mjs';
import { __iconData as bottleIcon } from 'lucide-react/dist/esm/icons/milk.mjs';
import { __iconData as mapIcon } from 'lucide-react/dist/esm/icons/map.mjs';
import { __iconData as kitIcon } from 'lucide-react/dist/esm/icons/briefcase-medical.mjs';
import { iconPaths } from '../DocsIcon';
import { ComponentPlayground } from '../ComponentPlayground';
import { DocsSlider } from '../DocsSlider';
import { PropertyTabs } from '../PropertyTabs';
import type { ExpansionDoc } from './types';
import './InventoryGridExamples.css';

interface Equipment extends InventoryItem { kind: 'tool' | 'supply' | 'map' | 'kit' }
const initial: readonly InventoryContainer<Equipment>[] = [
  { id: 'pack', label: '背包', columns: 6, rows: 5, disabledCells: [{ x: 5, y: 4 }], items: [
    { id: 'tool', label: '工具', kind: 'tool', position: { x: 0, y: 0 }, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
    { id: 'supply', label: '补给', kind: 'supply', position: { x: 1, y: 0 }, cells: [{ x: 0, y: 0 }] },
    { id: 'map', label: '地图', kind: 'map', position: { x: 3, y: 0 }, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
    { id: 'kit', label: '修理包', kind: 'kit', position: { x: 2, y: 2 }, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  ] },
  { id: 'storage', label: '收纳', columns: 6, rows: 3, items: [] },
];
const icons = {
  tool: iconPaths(wrenchIcon),
  supply: iconPaths(bottleIcon),
  map: iconPaths(mapIcon),
  kit: iconPaths(kitIcon),
};

export function InventoryGridExamples() {
  const { t } = useLocale();
  const [containers, setContainers] = useState(initial);
  const [size, setSize] = useState(48);
  const [rotation, setRotation] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [reject, setReject] = useState(false);
  const [suppliesOnly, setSuppliesOnly] = useState(false);
  const labels: Record<string, string> = {
    pack: t('背包', 'Backpack'), storage: t('收纳', 'Storage'), tool: t('维修工具', 'Tool'),
    supply: t('补给', 'Supply'), map: t('地图', 'Map'), kit: t('修理包', 'Repair kit'),
  };
  const localized = containers.map(container => ({ ...container, label: labels[container.id], items: container.items.map(item => ({ ...item, label: labels[item.id] })) }));
  const code = `const [containers, setContainers] = useState(${JSON.stringify(initial.map(container => ({ ...container, label: labels[container.id], items: container.items.map(item => ({ ...item, label: labels[item.id] })) })), null, 2)});\n\n<InventoryGrid\n  containers={containers}\n  onChange={${reject ? '() => {}' : 'setContainers'}}\n  cellSize={${size}}\n  allowRotation={${rotation}}\n  disabled={${disabled}}\n  readOnly={${readOnly}}${suppliesOnly ? "\n  canPlace={({ item, target }) => target.id !== 'storage' || item.kind === 'supply'}" : ''}\n  renderItem={item => <EquipmentIcon kind={item.kind} />}\n/>`;
  return <div className="inventory-grid-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <DocsSlider label={t('格子尺寸', 'Cell size')} value={size} onValueChange={setSize}
        min={44} max={128} step={1} unit=" px" /> },
      { label: '交互', content: <>
        <Switch label={t('允许旋转', 'Allow rotation')} checked={rotation} onCheckedChange={setRotation} />
        <Switch label={t('收纳只接受补给', 'Storage accepts supplies only')} checked={suppliesOnly} onCheckedChange={setSuppliesOnly} />
        <Button variant="ghost" onClick={() => setContainers(initial)}>{t('恢复位置', 'Reset positions')}</Button>
      </> },
      { label: '状态', content: <>
        <Switch label={t('禁用', 'Disabled')} checked={disabled} onCheckedChange={setDisabled} />
        <Switch label={t('只读', 'Read only')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={t('拒绝受控更新', 'Reject controlled updates')} checked={reject} onCheckedChange={setReject} />
      </> },
    ]} />}>
      <InventoryGrid containers={localized} onChange={next => { if (!reject) setContainers(next); }} cellSize={size}
        disabled={disabled} readOnly={readOnly} allowRotation={rotation} aria-label={t('物品收纳', 'Item storage')}
        canPlace={({ item, target }) => !suppliesOnly || target.id !== 'storage' || item.kind === 'supply'}
        renderItem={item => <PencilIcon paths={icons[item.kind]} size={28} />} />
    </ComponentPlayground>
  </div>;
}

export const inventoryGridDoc: ExpansionDoc = {
  name: 'InventoryGrid',
  intro: { zh: '大小不一，刚好装下。', en: 'Different shapes. A place for each.' },
  api: [
    ['containers', 'readonly InventoryContainer[]', '背包行列、禁用格与物品；物品 id 跨背包唯一。初始布局必须合法。', 'Container dimensions, disabled cells and items. Item IDs are globally unique and the initial layout must be valid.'],
    ['items[].cells / position / rotation', 'InventoryCell[] / { x, y } / 0 | 90 | 180 | 270', '局部格坐标描述真实形状，旋转后以占格包围盒左上角定位；空洞不占格。', 'Local occupied cells define the shape. Rotations use the occupied bounding box top-left; holes remain available.'],
    ['onChange', '(containers, details) => void', '只在合法放置时请求更新；受控父级拒绝更新时自动回到原位。details 含 from、to 与 move/transfer/rotate。', 'Requests an accepted move, transfer or rotation; rejected controlled updates restore the original position.'],
    ['canPlace', '(context) => boolean', '在边界、禁用格和碰撞检查之后执行自定义规则；不自动挪动其他物品。', 'Custom rule after bounds, blocked-cell and collision checks; never moves other items automatically.'],
    ['disabled / readOnly / allowRotation', 'boolean', '整体禁用、只读和旋转开关；背包与物品可单独 disabled，物品可 rotatable=false。', 'Global editing and rotation controls; containers/items support disabled and items support rotatable=false.'],
    ['cellSize', 'number = 48', '格子尺寸，44–128px；小容器局部滚动，不压缩触屏命中区。', 'Cell size from 44–128px; narrow containers scroll locally without shrinking touch targets.'],
    ['renderItem / getItemLabel / labels', 'render function / label function / InventoryGridLabels', '自定义首个占格的非交互内容、物品名称与读屏文案。', 'Customize noninteractive content in the first occupied cell, accessible item names and announcements.'],
    ['rotateInventoryCells / validateInventoryPlacement / projectInventoryMove', 'pure functions', '可复用的旋转、放置校验与不可变移动函数；失败不删除或丢失物品。', 'Pure rotation, placement validation and immutable move helpers; invalid moves never remove items.'],
  ],
  a11y: {
    zh: 'Tab 聚焦物品，空格或 Enter 拿起；方向键逐格移动，R 旋转，Page Up / Page Down 切换背包，再按空格或 Enter 放下，Escape 取消。禁用格、越界、碰撞和业务限制均会阻止放置；读屏播报坐标与无效状态。触屏长按后拖动，旋转按钮提供相同能力。',
    en: 'Tab to an item and press Space or Enter to pick it up. Arrows move one cell, R rotates, Page Up / Page Down switches containers, Space or Enter drops, and Escape cancels. Blocked cells, bounds, collisions and custom rules reject placement with live feedback. Touch uses press-and-hold dragging and the rotate button.',
  },
  Examples: InventoryGridExamples,
};
