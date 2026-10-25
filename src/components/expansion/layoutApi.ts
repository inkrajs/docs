import type { ApiGroup, ApiRow } from '../apiGroupRows';

const common = (element: string): ApiRow[] => [
  ['as', 'LayoutElement', `'${element}'`, '渲染的语义元素，可选 div、section、article、nav、header、footer、main、aside、ul、ol、li。', 'Semantic element: div, section, article, nav, header, footer, main, aside, ul, ol or li.'],
  ['children', 'ReactNode', '-', '区域内容。', 'Region content.'],
  ['className', 'string', '-', '附加到区域根元素的类名。', 'Additional root element class name.'],
  ['style', 'CSSProperties', '-', '根元素内联样式，可覆盖组件生成的样式。', 'Root inline styles, applied after generated styles.'],
  ['ref', 'React.Ref<HTMLElement>', '-', '区域根元素引用。', 'Reference to the root element.'],
  ['HTML attributes / events', 'HTMLAttributes<HTMLElement>', '-', '透传原生属性、事件、ARIA 和 data-*。', 'Forwards native attributes, events, ARIA and data-* attributes.'],
];
const padding: ApiRow = ['padding', 'LayoutSpace', '5', '内边距 token；支持 0、1、2、3、4、5、6、8、10、12、16，默认 20px。', 'Padding token: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12 or 16; 20px by default.'];
const gap: ApiRow = ['gap', 'LayoutSpace', '0', '子区域间距 token；支持 0、1、2、3、4、5、6、8、10、12、16。', 'Child-region spacing token: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12 or 16.'];

export const layoutApiGroups: readonly ApiGroup[] = [
  {
    id: 'root', title: 'Layout.Root', rows: [
      ...common('div'), gap,
      ['sidebarWidth', "CSSProperties['width']", '240', '页头品牌槽与默认侧栏共享宽度；支持 px 数字、CSS 长度或百分比。设为 0 同步隐藏两处内容并退出键盘与读屏顺序，内部状态保留。嵌套 Root 使用自己的默认值。', 'Shared width for the header brand slot and default sidebar. Accepts pixel numbers, CSS lengths or percentages. Set to 0 to hide both from layout, keyboard and accessibility navigation while retaining mounted state. Nested roots reset to their own default.'],
      ['collapseAt', "'sm' | 'md' | 'never'", "'sm'", '按容器宽度将直属 Body 内侧栏上下堆叠：sm 小于 640px，md 小于 768px；never 保持横向。', 'Stacks sidebars in the direct Body using container width: sm below 640px, md below 768px; never keeps the horizontal layout.'],
      ['swipeNavigation', 'LayoutSwipeNavigation', '-', '触摸侧栏手势配置；展开状态、侧栏呈现和动画由使用方控制。', 'Touch navigation configuration; consumers own sidebar state, presentation and animation.'],
      ['swipeNavigation.enabled', 'boolean', 'true', '提供手势配置时默认启用；false 暂停手势。', 'Enabled when swipe configuration is supplied; false suspends gestures.'],
      ['swipeNavigation.open', 'boolean', '必填 / required', '受控侧栏展开状态。', 'Controlled sidebar open state.'],
      ['swipeNavigation.onOpenChange', '(open: boolean) => void', '必填 / required', '触摸释放且超过阈值时请求展开或收起。', 'Requests opening or closing on touch release after crossing the threshold.'],
      ['swipeNavigation.side', "'start' | 'end'", "'start'", '侧栏所在逻辑边缘，遵循 RTL 方向。', 'Logical sidebar edge, respecting RTL direction.'],
      ['swipeNavigation.edgeWidth', 'number', '24', '闭合时可发起展开手势的边缘宽度，单位为局部 CSS px。', 'Edge width for starting an opening gesture, in local CSS pixels.'],
      ['swipeNavigation.threshold', 'number', '48', '触发状态变化所需的水平触摸距离，单位为局部 CSS px。', 'Horizontal touch distance required to request a state change, in local CSS pixels.'],
      ['onTouchStart', 'TouchEventHandler<HTMLElement>', '-', '先于内部手势执行；preventDefault() 可阻止本次手势。', 'Runs before internal gesture handling; preventDefault() vetoes the gesture.'],
      ['data-layout-swipe-ignore', 'HTML data attribute', '-', '放在后代元素上，排除该区域的侧栏手势。原生输入和横向滚动区域自动排除。', 'Place on descendants to exclude their subtree from sidebar gestures. Inputs and horizontal scrolling regions are excluded automatically.'],
    ],
  },
  {
    id: 'header', title: 'Layout.Header', rows: [
      ...common('header'), padding,
      ['sidebar', 'ReactNode', '-', '逻辑起始侧品牌槽，使用 Root.sidebarWidth 与下方侧栏对齐；children 放在另一列。省略时保持原单区域结构。', 'Leading brand slot aligned with the sidebar through Root.sidebarWidth; children occupy the other column. Omitting it preserves the original single-region structure.'],
      ['sidebarDivided', 'boolean', 'false', '品牌槽末端居中的浅色彩铅短竖线，最长 32px 且尊重 padding；与侧栏边缘同轴，窄屏上下重排时隐藏。', 'Muted pencil separator centered on the brand-slot edge, up to 32px tall and bounded by padding. Aligns with the sidebar edge and hides when the header stacks.'],
      ['divided', 'boolean', 'false', '在页头底部展示分割线。', 'Shows a divider below the header.'],
    ],
  },
  { id: 'body', title: 'Layout.Body', rows: [...common('div'), gap] },
  {
    id: 'sidebar', title: 'Layout.Sidebar', rows: [
      ...common('aside'), padding,
      ['width', "CSSProperties['width']", 'Root.sidebarWidth / 240', '省略时继承当前 Root 共享宽度；显式值优先。数字按 px，支持 CSS 长度或百分比；0 隐藏但保留内部状态，堆叠时填满容器。', 'Inherits the current Root shared width when omitted; explicit values take priority. Numbers use px, with CSS lengths and percentages supported. Zero hides the region while retaining state; fills the container when stacked.'],
      ['divided', 'boolean', 'false', '横向布局在逻辑末端展示分割线，堆叠时改到底部。', 'Shows a divider on the logical end edge, or below the sidebar when stacked.'],
    ],
  },
  { id: 'content', title: 'Layout.Content', rows: [...common('div'), padding] },
  {
    id: 'footer', title: 'Layout.Footer', rows: [
      ...common('footer'), padding,
      ['divided', 'boolean', 'false', '在页脚顶部展示分割线。', 'Shows a divider above the footer.'],
    ],
  },
];
