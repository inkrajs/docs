import { PencilText } from '../i18n';
import { CardListDemo, ColorUsageTable, useResolvedTheme } from './ColorSystem';
import './UsageGuide.css';

const rules = [
  ['内容层级', '页面标题 28px、章节 24px、分组 20px、卡片标题 17px；正文 15px、说明 13px。字重保持 400，不用伪粗体强调。'],
  ['文字与背景', '标题和正文用主要文字，说明用次要文字，时间和计数用辅助文字。文字必须与实际纸面配对，主题色不直接当实心底色。'],
  ['间距归属', '同一段留白只由一层负责：容器已有 padding，首尾子元素不再叠同向 margin；父层已有 gap，子元素不再叠同向 margin。'],
  ['间距选择', '图标与文字间距 8px，重复条目 16px，内容分组 24px，独立章节 32px。普通容器内边距 16px，弹层 24px；不能叠加凑出这些值。'],
  ['圆角与界线', '页面与连续区域用 0px，小标记 3px，普通控件 6px，卡片与弹层 8px。边界使用彩铅描边，不额外叠一条 CSS 实线。'],
  ['图标与控件', '14/16/20/24px 图标分别搭配 12/13/15/17px 文字与 32/36/44/48px 控件；实际点击区域至少 44px。'],
  ['状态与反馈', '同一操作区只设一个主操作。错误、成功与选中状态同时提供文字或图形；加载不改变按钮尺寸，禁用必须阻止交互。'],
  ['页面与适配', '文档页统一左右 20px，不设分类眉题。窄屏先换行或改单列，不缩小正文；亮暗示例在窄屏跟随页头主题。'],
  ['滚动归属', '侧栏与分割线保持固定可视高度；正文按实际内容滚动，不设置多余的滚动尾部。固定高度只用于需要稳定切换的预览区域。'],
  ['示例结构', '组件页面分为示例、API、无障碍；补充示例的标题在卡片顶部，源码入口在底部。'],
] as const;

export function UsageGuide({ theme }: { theme: 'auto' | 'light' | 'dark' }) {
  const currentTheme = useResolvedTheme(theme);
  return <div className="color-system usage-guide" data-current-theme={currentTheme}>
    <dl className="usage-guide__rules">
      {rules.map(([label, rule]) => <div key={label}>
        <dt><PencilText>{label}</PencilText></dt>
        <dd><PencilText>{rule}</PencilText></dd>
      </div>)}
    </dl>
    <ColorUsageTable />
    <CardListDemo />
  </div>;
}
