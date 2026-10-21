import type { CSSProperties } from 'react';
import { Button, PencilSurface } from 'inkra';
import { PencilText, useLocale } from '../i18n';
import './GeometrySystem.css';

const radii = [['none', 0], ['sm', 3], ['md', 6], ['lg', 8]] as const;
const spaces = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const insets = [2, 3, 4, 6];

type UsageRule = readonly [string, string, string];
const radiusRules: UsageRule[] = [
  ['页面、全宽区段、连续表格', 'none / 0px', '结构区域保持直边，不把页面区段做成浮动卡片。'],
  ['小色块、内嵌代码、紧凑标记', 'sm / 3px', '只用于小面积元素，不用于主按钮和弹层。'],
  ['普通控件、标签、缩略图', 'md / 6px', '新增控件的默认几何圆角；不要按重要程度随意放大。'],
  ['独立工具、重复内容卡片、弹层', 'lg / 8px', '外层容器上限为 8px；内容分组优先用留白，不再套卡片。'],
];
const paddingRules: UsageRule[] = [
  ['紧凑标记、短提示', 'space-2 / 8px', '仅限短内容，不能拿来压缩表单或弹层。'],
  ['菜单项、紧凑列表行', 'space-3 / 12px', '行高同时满足 44px 命中区域；长文字允许换行。'],
  ['普通内容容器、预览工具', 'space-4 / 16px', '默认内边距；同一层级容器保持一致。'],
  ['弹层内容、独立任务面板', 'space-6 / 24px', '窄屏可降为 16px，不能靠缩小正文腾空间。'],
  ['Button 内部', 'xs/sm/md/lg: 12/16/20/24px', '这是水平内边距；垂直由固定视觉高度居中，不额外叠 padding。'],
];
const gapRules: UsageRule[] = [
  ['标题与紧随的元信息', 'space-1 / 4px', '只用于同一信息单元，不用于两组独立操作。'],
  ['图标与文字、同组操作', 'space-2 / 8px', '默认行内 gap；ButtonGroup 当前保留 4px 的紧凑组合例外。'],
  ['字段标签与输入区域', 'space-2 / 8px', '错误和帮助文字归属该字段，不与下一字段混成一组。'],
  ['独立字段、重复条目', 'space-4 / 16px', '用于同级项目，统一由父容器管理 gap。'],
  ['同一任务中的内容分组', 'space-6 / 24px', '例如表单内容与底部操作区。'],
  ['独立章节', 'space-8 / 32px', '仅布局大区段可用 48/64px；不要放进按钮或紧凑面板。'],
];
const controlRules: UsageRule[] = [
  ['默认表单与常规操作', 'md / 44px', '优先使用；同一操作行保持同一尺寸。'],
  ['高密度桌面工具栏', 'sm / 36px', '只减视觉高度，命中盒仍至少 44px。'],
  ['表格行内次要操作', 'xs / 32px', '仅用于紧凑场景，不作为触屏主操作。'],
  ['独立的触屏主操作', 'lg / 48px', '不是所有 primary 都要 lg；重要性用 variant 表达。'],
];

function UsageRules({ label, rules }: { label: string; rules: UsageRule[] }) {
  const { t } = useLocale();
  return <div className="geometry-rules" role="region" aria-label={t(label)}>
    <table>
      <thead><tr>{['使用场景', '默认值', '约束与例外'].map(text => <th key={text} scope="col"><PencilText>{text}</PencilText></th>)}</tr></thead>
      <tbody>{rules.map(([scene, value, rule]) => <tr key={scene}>
        <th scope="row"><PencilText>{scene}</PencilText></th><td><code>{value}</code></td><td><PencilText>{rule}</PencilText></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

export function GeometrySystem() {
  const { t } = useLocale();
  return (
    <div className="geometry-system">
      <PencilText as="p" className="geometry-principle">先按使用场景选默认值，再处理密度和屏幕约束。同级元素使用同一档；不要为了填满空白临时拼数值。</PencilText>
      <section aria-labelledby="radius-title">
        <PencilText as="h2" id="radius-title">圆角</PencilText>
        <UsageRules label="圆角使用规则" rules={radiusRules} />
        <PencilText as="p" className="geometry-note">圆角示例使用真实彩铅轮廓；直角保留笔压与颗粒，不使用规则实线替代。</PencilText>
        <div className="geometry-examples">
          {radii.map(([name, value]) => (
            <figure key={name}>
              <PencilSurface variant="paper" radius={value} seed="radius-specimen" className="radius-specimen" style={{ borderRadius: `var(--inkra-radius-${name})` }}>
                <PencilText>{`${value}px`}</PencilText>
              </PencilSurface>
              <figcaption><code>radius-{name}</code></figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section aria-labelledby="space-title">
        <PencilText as="h2" id="space-title">间距选择</PencilText>
        <PencilText as="p" className="geometry-note">采用 4px 基础步长，常用 8、16、24、32px。12px 用于紧凑内边距，20px 保留给 md 按钮；0 只用于贴合或重置，不用在两个独立操作之间。</PencilText>
        <details className="geometry-scale-details"><summary>{t('原始间距刻度')}</summary>
        <div className="space-scale">
          {spaces.map(step => (
            <div className="space-scale__row" key={step}>
              <code>space-{step}</code>
              <PencilSurface variant="selection" aria-hidden="true" className="space-scale__bar" style={{ width: `var(--inkra-space-${step})` }} />
              <code>{step * 4}px</code>
            </div>
          ))}
        </div>
        </details>
      </section>
      <section aria-labelledby="padding-title">
        <PencilText as="h2" id="padding-title">内边距</PencilText>
        <UsageRules label="内边距使用规则" rules={paddingRules} />
        <div className="geometry-examples">
          {insets.map(step => (
            <figure key={step}>
              <PencilSurface variant="quiet" className="padding-specimen" style={{ padding: `var(--inkra-space-${step})` }}>
                <span className="geometry-content"><PencilText>内容</PencilText></span>
              </PencilSurface>
              <figcaption><code>space-{step} / {step * 4}px</code></figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section aria-labelledby="gap-title">
        <PencilText as="h2" id="gap-title">元素间距</PencilText>
        <UsageRules label="元素间距使用规则" rules={gapRules} />
        <PencilText as="p" className="geometry-note">间距由一层负责：父容器设 gap 后，子元素不再叠同方向 margin。窄屏先换行或改单列，不挤小组内间距。</PencilText>
        <div className="geometry-examples">
          {insets.map(step => (
            <figure key={step}>
              <div className="gap-specimen" style={{ gap: `var(--inkra-space-${step})` }}>
                {[0, 1, 2].map(index => <PencilSurface key={index} variant="quiet" className="gap-specimen__item" aria-hidden="true" seed={`gap-${index}`} />)}
              </div>
              <figcaption><code>space-{step} / {step * 4}px</code></figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section aria-labelledby="control-title">
        <PencilText as="h2" id="control-title">控件尺寸</PencilText>
        <UsageRules label="控件尺寸使用规则" rules={controlRules} />
        <div className="geometry-examples">
          {(['xs', 'sm', 'md', 'lg'] as const).map(size => (
            <figure key={size}>
              <Button size={size}>{t('保存')}</Button>
              <figcaption><code>control-{size}</code><code style={{ fontSize: 'var(--inkra-text-xs)' } as CSSProperties}>{({ xs: 32, sm: 36, md: 44, lg: 48 })[size]}px</code></figcaption>
            </figure>
          ))}
        </div>
        <PencilText as="p" className="geometry-note">交互命中区域至少 44px；小号控件的视觉表面与命中区域分开计算。</PencilText>
      </section>
    </div>
  );
}
