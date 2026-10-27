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
import { __iconData as folder } from 'lucide-react/dist/esm/icons/folder.mjs';
import { __iconData as fileText } from 'lucide-react/dist/esm/icons/file-text.mjs';
import { __iconData as camera } from 'lucide-react/dist/esm/icons/camera.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { iconFillCopy } from './iconFillCopy';
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

const principles = [
  ['轮廓与双版本', '所有现有和新增图标都提供 outline 与 filled 两版，保持相同语义、熟悉轮廓和占位尺寸；不能简单把线框路径全部填实。'],
  ['柔和填充', '主体连续填色，孔洞保持透明，开放箭头和加号不强行闭合。外缘与孔洞边缘向内柔和渐淡，不画锋利硬边，也不整体模糊。'],
  ['可配置颜色', 'fillColor 与描边颜色独立，可使用主题变量或自定义颜色，例如不同颜色的文件夹。多色区域可分别覆盖，恢复默认后继续跟随主题。'],
  ['克制的多色', '只为适合分区的图标提供多色，其他图标保留单色填充。优先主体轮廓与一处识别特征，通常两块颜色；不为了第三种颜色添加细节。'],
  ['统一彩铅材质', '彩色版沿用项目的主题颜料、纸齿铺色和轻微手绘边缘。减少重复缝线、装饰亮点和细碎分区；排线不能抢过图形，也不用普通 SVG 的硬描边代替。'],
  ['稳定笔触', '默认笔宽 1.5、浓度 1，支持独立配置笔宽、浓度、断笔和笔压。同一 seed 的笔迹稳定，切换外观或颜色不改变图标盒，不在悬停时随机抖动。'],
] as const;

export function IconDesign() {
  const { t, locale } = useLocale();
  const appearance = iconFillCopy(locale);
  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState('24');
  const item = icons[selected];
  return <section className="icon-design" aria-labelledby="icon-design-title">
    <PencilText as="h2" id="icon-design-title">图标设计</PencilText>
    <PencilText as="p">保留熟悉的轮廓，用彩铅表达笔压、颗粒和轻微断笔。简约来自减少细节，不来自牺牲辨识度。</PencilText>
    <div className="icon-design__variants">
      {(['outline', 'filled', 'colorful'] as const).map(mode => <figure key={mode} className="icon-design__variant">
        <PencilText as="figcaption">{appearance[mode]}</PencilText>
        <div className="icon-design__variant-icons">
          {[folder, fileText, camera].map(data => <DocsIcon key={data.name} data={data} size={36} variant={mode === 'outline' ? 'outline' : 'filled'} colorful={mode === 'colorful'} />)}
        </div>
      </figure>)}
    </div>
    <div className="icon-design__principles">
      {principles.map(([title, description]) => <div key={title}><PencilText as="h3">{title}</PencilText><PencilText as="p">{description}</PencilText></div>)}
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
        <DocsSelect label="图标尺寸" presentation="radio" value={size} onValueChange={setSize} options={['14', '16', '20', '24'].map(value => [value, `${value}px`] as const)} />
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
