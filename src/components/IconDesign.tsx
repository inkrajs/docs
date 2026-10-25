import { useState } from 'react';
import { PencilLine } from '@inkra/react';
import { __iconData as plus } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as search } from 'lucide-react/dist/esm/icons/search.mjs';
import { __iconData as check } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as x } from 'lucide-react/dist/esm/icons/x.mjs';
import { __iconData as pencil } from 'lucide-react/dist/esm/icons/pencil.mjs';
import { __iconData as trash } from 'lucide-react/dist/esm/icons/trash.mjs';
import { __iconData as download } from 'lucide-react/dist/esm/icons/download.mjs';
import { __iconData as settings } from 'lucide-react/dist/esm/icons/settings.mjs';
import { __iconData as sun } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moon } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as monitor } from 'lucide-react/dist/esm/icons/monitor.mjs';
import { __iconData as info } from 'lucide-react/dist/esm/icons/info.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { DocsSelect } from './DocsSelect';
import { ComponentExample } from './ComponentExample';
import './IconDesign.css';

const icons = [
  { data: plus, label: '新建', use: '创建新内容，不用于展开已有内容。' },
  { data: search, label: '搜索', use: '查找内容，不代替筛选操作。' },
  { data: pencil, label: '编辑', use: '修改已有内容，不用于新建。' },
  { data: check, label: '确认', use: '确认或完成，同时保留文字或选中语义。' },
  { data: x, label: '关闭', use: '关闭当前界面，不代表删除数据。' },
  { data: trash, label: '删除', use: '删除数据，危险操作应明确说明对象。' },
  { data: download, label: '下载', use: '保存文件到设备，不代表云端同步。' },
  { data: settings, label: '设置', use: '调整偏好，不代替更多操作菜单。' },
  { data: monitor, label: '跟随系统', use: '主题跟随系统，使用单选语义。' },
  { data: sun, label: '浅色主题', use: '切换到浅色主题，使用单选语义。' },
  { data: moon, label: '深色主题', use: '切换到深色主题，使用单选语义。' },
  { data: info, label: '信息', use: '补充说明，不能成为必要信息的唯一入口。' },
];

export function IconDesign() {
  const { t } = useLocale();
  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState('24');
  const item = icons[selected];
  return <section className="icon-design" aria-labelledby="icon-design-title">
    <PencilText as="h2" id="icon-design-title">图标设计</PencilText>
    <PencilText as="p">保留熟悉的轮廓，用彩铅表达笔压、颗粒和轻微断笔。简约来自减少细节，不来自牺牲辨识度。</PencilText>
    <div className="icon-design__principles">
      <div><PencilText as="h3">轮廓优先</PencilText><PencilText as="p">沿用 Lucide 图形几何，不混用实心和线性图标；同一含义保持同一图形。</PencilText></div>
      <div><PencilText as="h3">稳定笔触</PencilText><PencilText as="p">重复描边保留露纸与自然提笔。同一 seed 的笔迹稳定，不在悬停时随机抖动。</PencilText></div>
      <div><PencilText as="h3">状态归属控件</PencilText><PencilText as="p">选中铺色与焦点由按钮、Tabs 或 RadioGroup 承载；图标不靠换色独自表达状态。</PencilText></div>
    </div>
    <PencilLine />
    <PencilText as="h3">常用图标</PencilText>
    <div className="icon-design__browser">
      <div className="icon-design__grid" role="group" aria-label={t('常用图标')}>
        {icons.map((icon, index) => <button type="button" className="icon-design__choice" key={icon.data.name} aria-pressed={selected === index} onClick={() => setSelected(index)}>
          <DocsIcon data={icon.data} size={28} />
          <PencilText>{icon.label}</PencilText>
          {selected === index && <PencilLine className="icon-design__selected" />}
        </button>)}
      </div>
      <div className="icon-design__detail">
        <div className="icon-design__samples">
          {(['light', 'dark'] as const).map(theme => <div key={theme} data-inkra-theme={theme} className="icon-design__sample"><DocsIcon data={item.data} size={Number(size)} /><PencilText>{theme === 'light' ? '浅色' : '深色'}</PencilText></div>)}
        </div>
        <DocsSelect label="图标尺寸" value={size} onValueChange={setSize} options={['14', '16', '20', '24'].map(value => [value, `${value}px`] as const)} />
        <div aria-live="polite"><PencilText as="h3">{item.label}</PencilText><code>{item.data.name}</code><PencilText as="p">{item.use}</PencilText></div>
      </div>
    </div>
    <ComponentExample id="icon-design-using-icons" title="图标接入" code={`import { Button, PencilIcon } from '@inkra/react';

const plusPaths = [{ d: 'M12 5v14' }, { d: 'M5 12h14' }];

<Button startIcon={
  <PencilIcon paths={plusPaths} sourceSize={24} size={20}
    seed="new-note" decorative />
}>
  ${t('新建笔记')}
</Button>`}>
      <div className="icon-design__guidance">
        <PencilText as="p">paths 提供路径，sourceSize 描述源坐标范围，size 设置画布占位。画布包含留白，不能把图形可见宽度等同于点击区域。</PencilText>
        <PencilText as="p">有文字时图标为装饰；纯图标操作把 aria-label 放在按钮上，并提供提示。独立传意图标使用 decorative=false 与可访问名称。</PencilText>
        <PencilText as="p">图标继承文字颜色，不写死浅深色值。重要含义保留 DOM 文字，不能只依赖 canvas 成功绘制。</PencilText>
      </div>
    </ComponentExample>
  </section>;
}
