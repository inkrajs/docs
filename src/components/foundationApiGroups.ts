import { describeApiProp } from './apiDescriptions.ts';
import type { ApiGroup, ApiRow } from './apiGroupRows.ts';

type SourceRow = readonly [string, string];
type Part = { name: string; rows?: readonly ApiRow[] };
type Assignment = readonly [part: string, prop: string, type?: string];
type Definition = {
  name: string;
  parts: readonly Part[];
  standalone?: boolean;
  unprefixed?: string;
  replace?: boolean;
  assignments?: Readonly<Record<string, readonly Assignment[]>>;
};

const row = (prop: string, type: string, zh: string, en: string): ApiRow => [prop, type, zh, en];
const native = (tag: string, ref: string): ApiRow => row('children / className / style / ref', `ReactNode / string / CSSProperties / ${ref}`, `透传原生 ${tag} 元素属性与 ref。`, `Forwards native ${tag} attributes and ref.`);
const composition = row('asChild / children', 'boolean / ReactNode', '将行为委托给单个子元素，或使用默认元素。', 'Delegates behavior to one child, or uses the default element.');
const text = [row('children', 'string', '文本内容，保留主题文字效果。', 'Text content with themed lettering.'), row('seed', 'string | number', '稳定文字笔迹的种子。', 'Stable seed for the lettering.')];
const positioning = row('side / align / sideOffset / collisionPadding', "'top' | 'right' | 'bottom' | 'left' / 'start' | 'center' | 'end' / number / number", '浮层方向、对齐与避让距离。', 'Popup side, alignment, offset and collision padding.');
const portal = row('container / forceMount', 'HTMLElement | null / true', '指定挂载容器或保留挂载。', 'Selects the portal container or preserves mounting.');
const menuItem = row('disabled / onSelect', 'boolean / (event: Event) => void', '禁用选项与选中回调。', 'Disables the option and handles selection.');
const menuParts: readonly Part[] = [
  { name: 'Root' }, { name: 'Trigger' }, { name: 'Portal' }, { name: 'Content' }, { name: 'Item' },
  { name: 'CheckboxItem', rows: [menuItem] },
  { name: 'RadioGroup' },
  { name: 'RadioItem', rows: [menuItem] },
  { name: 'Label', rows: [native('div', 'HTMLDivElement')] },
  { name: 'Separator', rows: [row('className / style / ref', 'string / CSSProperties / HTMLDivElement', '装饰分隔线属性；不接收 children 或 asChild。', 'Decorative separator props; children and asChild are not supported.')] },
  { name: 'Group', rows: [composition] },
];

// Only explicit public namespaces opt in. Single-component pages retain their existing table.
export const foundationApiDefinitions: Readonly<Record<string, Definition>> = {
  'dependency-graph': { name: 'DependencyGraph', replace: true, parts: [{ name: 'Root', rows: [
    row('nodes', 'DependencyGraphNode[]', '节点数组：id、label、icon?、content?、actions?、footer?、description?、status?、disabled?、data?。id 应唯一；不需要手动位置。', 'Nodes with id, label and optional icon, content, actions, footer, description, status, disabled and data. IDs must be unique; manual positions are unnecessary.'),
    row('edges', 'DependencyGraphEdge[]', '依赖边：唯一 id、source、target、label?；source 为前置节点，target 为依赖它的节点。', 'Edges with unique id, source, target and optional label. The source is a prerequisite of the target.'),
    row('node.sourceAnchor / node.targetAnchor', 'DependencyGraphAnchor', '节点默认连接点：{ x, y, position? }。x/y 为相对整个节点盒的 0–1 坐标，可穿过透明图片留白接近图案；position 为 left/right/top/bottom，控制曲线出入方向。未指定时按布局方向自动分配。', 'Default node anchors: { x, y, position? }. The 0–1 coordinates are relative to the complete node box, allowing connections inside transparent image margins. position is left/right/top/bottom and controls the curve tangent. Omitted anchors use automatic layout-side placement.'),
    row('edge.sourceAnchor / edge.targetAnchor', 'DependencyGraphAnchor', '覆盖该边端点所属节点的默认连接点，适合多个输入在不同位置汇入。超范围坐标钳制到 0–1，非法数值回退自动位置；显式坐标和 position 是节点本地物理位置，不随 LR/RL/TB/BT 自动旋转。', 'Overrides the corresponding node anchor for this edge, allowing separate incoming points. Coordinates are clamped to 0–1; invalid numeric values fall back to automatic placement. Explicit coordinates and position remain local physical positions and do not rotate with LR/RL/TB/BT.'),
    row('direction', "'LR' | 'RL' | 'TB' | 'BT'", '默认 LR；控制依赖展开方向，方向箭头仍指向后继节点。', 'Defaults to LR. Controls layout direction; arrows point toward dependent nodes.'),
    row('nodeVariant', "'card' | 'icon' = 'card'", '默认显示卡片；icon 仅显示图标方框，label 仍提供可访问名称。选中详情由外部组合。', 'Displays a card by default. The icon variant shows only its icon while label supplies the accessible name. Compose selected details outside the graph.'),
    row('nodeWidth / nodeHeight', 'number', 'card 默认 200 / 104，icon 默认 80 / 80。自动布局采用此尺寸；丰富卡片或 Flip 需显式增大并保持正反面同尺寸。', 'Defaults to 200 / 104 for card and 80 / 80 for icon. These are layout dimensions. Enlarge rich cards or Flip explicitly and keep both faces the same size.'),
    row('node.icon / node.actions / node.content / node.footer', 'ReactNode', '卡片左上图标、右上操作、正文与底部区域。正文未提供时使用 description；actions 和 footer 可放真实按钮。', 'Upper-left icon, upper-right actions, body and footer regions. The body falls back to description. Actions and footer can contain real buttons.'),
    row('rankGap / nodeGap', 'number = 96 / 40', '层级之间与同层节点之间的间距。', 'Spacing between ranks and between nodes in one rank.'),
    row('selectedId / defaultSelectedId', 'string | null', '受控或非受控当前节点；与业务完成状态独立。', 'Controlled or initial selected node, independent of completion state.'),
    row('onSelectedIdChange', '(id: string | null) => void', '选中节点变化回调。', 'Called when the selected node changes.'),
    row('onNodeActivate', '(node: DependencyGraphNode) => void', '标题、图标或键盘激活节点时触发；自定义渲染调用 activate()。锁定节点仍可查看，disabled 节点不触发；解锁规则由业务处理。', 'Called when the title, icon or keyboard activates a node; custom renderers call activate(). Locked nodes remain inspectable, disabled nodes do not activate, and your application owns unlocking rules.'),
    row('highlight', "'ancestors' | 'descendants' | 'both' | 'none'", '默认 ancestors；高亮当前节点的前置、后继、双向路径，或关闭路径高亮。', 'Defaults to ancestors. Highlights prerequisite, dependent, both, or no paths for the selected node.'),
    row('renderNode', '(node, { selected, highlighted, activate, renderSurface }) => ReactNode', '自定义整个卡片，不再额外包裹固定纸面。activate() 选择并激活节点；renderSurface(children) 提供当前状态的完整纸面、边框和焦点样式。组合 Flip 时应分别包裹正反面，让整张卡片一起翻转；详情面板由外部组合。', 'Customizes the complete card without an extra fixed paper wrapper. activate() selects and activates the node. renderSurface(children) supplies its paper, border and focus styling. Wrap each Flip face separately so the entire card rotates. Compose details panels outside the graph.'),
    row('statusLabels', "Partial<Record<DependencyGraphStatus, string>>", '覆盖 locked、available、active、completed 状态文案。状态由调用方传入，组件不会自动完成任务。', 'Overrides locked, available, active and completed labels. Statuses are supplied by the caller; the component does not complete work automatically.'),
    row('onIssues', '(issues: DependencyGraphIssue[]) => void', '接收重复 id、缺失端点与循环依赖诊断。不要用无效输入代替业务解锁规则。', 'Receives duplicate-ID, missing-endpoint and cycle diagnostics. Invalid input is not a substitute for application unlock rules.'),
    row('controls', "boolean | { zoomIn?: boolean; zoomOut?: boolean; fitView?: boolean; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }", '默认 true。可分别配置放大、缩小、适应视图按钮（各默认 true），以及工具栏四角位置（默认 bottom-left）。false 隐藏整个工具栏，包括自定义项；三个内置按钮均为 false 时仍可仅显示自定义项。', 'Defaults to true. Configure zoom-in, zoom-out and fit-view buttons individually (each defaults to true), plus one of four corner positions (bottom-left by default). false hides the entire toolbar, including custom items. Disable all three built-ins to show only custom items.'),
    row('extraControls', 'ReactNode | ((api: NodeGraphRef) => ReactNode)', '在内置工具栏后追加自定义内容或按钮。函数可使用 zoomIn、zoomOut、fitView、getViewport；controls=false 时整个区域隐藏。', 'Appends custom content or buttons after built-in controls. A render function receives zoomIn, zoomOut, fitView and getViewport. controls=false hides the whole area.'),
    row('fitView', 'boolean = true', '首次加载及节点布局变化后自动适应画布，独立于工具栏中的适应视图按钮。', 'Automatically fits the viewport initially and after node layout changes, independently of the toolbar fit-view button.'),
    row('minZoom / maxZoom', 'number', '限制画布缩放范围。', 'Bounds the viewport zoom range.'),
    row('panOnDrag / zoomOnScroll / zoomOnPinch', 'boolean', '画布平移、滚轮缩放与双指缩放选项。', 'Viewport panning, wheel zoom and pinch zoom options.'),
    row('onlyRenderVisibleElements', 'boolean', '仅渲染视口内的节点与边，适合较大的图。', 'Renders only viewport-visible nodes and edges for larger graphs.'),
    row('hideAttribution', 'boolean = true', '默认隐藏画布右下来源标记；底层 NodeGraph 默认仍为 false。', 'Hides the lower-right canvas attribution by default. The underlying NodeGraph retains a false default.'),
    row('emptyState / controlLabels', 'ReactNode / NodeGraphControlLabels', '空图内容与缩放控件文案。', 'Empty-graph content and zoom-control labels.'),
    row('className / style / aria-label', 'native div props', '容器样式与可访问名称；为画布提供有界高度。', 'Container styles and accessible name. Give the graph a bounded height.'),
    row('ref', 'NodeGraphRef', '通过 fitView、zoomIn、zoomOut、getViewport 操作视口。', 'Provides fitView, zoomIn, zoomOut and getViewport viewport methods.'),
  ] }] },

  breadcrumb: { name: 'Breadcrumb', replace: true, parts: [
    { name: 'Root', rows: [row('aria-label / dir', "string / 'ltr' | 'rtl'", '导航名称默认使用当前组件语言；dir 控制逻辑方向。', 'The navigation name uses the current component locale; dir controls logical direction.'), native('nav', 'HTMLElement')] },
    { name: 'List', rows: [native('ol', 'HTMLOListElement')] },
    { name: 'Item', rows: [native('li', 'HTMLLIElement')] },
    { name: 'Link', rows: [row('href / target / rel', 'native anchor props', '真实链接，保留浏览器导航行为。', 'A real link with native browser navigation.'), row('variant', 'ButtonLinkProps["variant"]', '默认 link；其余外观沿用 ButtonLink。', 'Defaults to link; other appearances follow ButtonLink.'), row('startIcon / endIcon / disabled', 'ReactNode / ReactNode / boolean', '文字两侧图标与禁用态。', 'Leading/trailing icons and disabled state.')] },
    { name: 'MenuTrigger', rows: [row('variant / startIcon / endIcon / disabled / loading', 'ButtonProps', '按钮属性；默认 link，放在 DropdownMenu.Root 内使用。', 'Button props; defaults to link and must be inside DropdownMenu.Root.')] },
    { name: 'ContextLink', rows: [row('href / variant / startIcon / endIcon / disabled', 'BreadcrumbLinkProps', '链接属性；放在 ContextMenu.Root 内使用。', 'Link properties; must be inside ContextMenu.Root.'), row('longPress / nativeContextMenu / exclude', 'ContextMenuTriggerProps', '控制长按、原生菜单和排除的交互区域。', 'Controls long press, native context menus and excluded targets.')] },
    { name: 'Page', rows: [row('startIcon / endIcon', 'ReactNode', '当前页面两侧图标，始终保留 aria-current="page"。', 'Current-page icons; aria-current="page" is always retained.'), native('span', 'HTMLSpanElement')] },
    { name: 'Separator', rows: [row('children', 'ReactNode', '默认 /；装饰性分隔符不进入无障碍树。', 'Defaults to /; decorative separator is hidden from assistive technology.'), native('li', 'HTMLLIElement')] },
  ] },
  tabs: { name: 'Tabs', parts: [{ name: 'Root' }, { name: 'List' }, { name: 'Trigger' }, { name: 'Content' }] },
  card: { name: 'Card', parts: [{ name: 'Root' }, { name: 'Header' }, { name: 'Title' }, { name: 'Description' }, { name: 'Content' }, { name: 'Footer' }], assignments: {
    'Header.divided / Footer.divided': [['Header', 'divided'], ['Footer', 'divided']],
    'Header / Content / Footer.padding': [['Header', 'padding'], ['Content', 'padding'], ['Footer', 'padding']],
    'Header / Content / Footer.children': [['Header', 'children'], ['Content', 'children'], ['Footer', 'children']],
    'Title / Description.children': [['Title', 'children'], ['Description', 'children']],
  } },
  alert: { name: 'Alert', parts: [{ name: 'Root' }, { name: 'Title', rows: [native('p', 'HTMLParagraphElement')] }, { name: 'Description', rows: [native('div', 'HTMLDivElement')] }], assignments: {
    'Title / Description.children': [['Title', 'children'], ['Description', 'children']],
  } },
  avatar: { name: 'Avatar', parts: [{ name: 'Root' }, { name: 'Image' }, { name: 'Fallback' }] },
  table: { name: 'Table', parts: [
    { name: 'Root', rows: [native('table', 'HTMLTableElement')] }, { name: 'Container' },
    { name: 'Header', rows: [native('thead', 'HTMLTableSectionElement')] },
    { name: 'Body', rows: [native('tbody', 'HTMLTableSectionElement')] },
    { name: 'Footer', rows: [native('tfoot', 'HTMLTableSectionElement')] },
    { name: 'Row' }, { name: 'Head' }, { name: 'Cell' }, { name: 'Caption', rows: [native('caption', 'HTMLTableCaptionElement')] },
  ], assignments: {
    'Head.align / Cell.align': [['Head', 'align'], ['Cell', 'align']],
    'Head / Cell.verticalAlign': [['Head', 'verticalAlign'], ['Cell', 'verticalAlign']],
    'Head / Cell.wrap': [['Head', 'wrap'], ['Cell', 'wrap']],
    'Head / Cell.colSpan / rowSpan': [['Head', 'colSpan / rowSpan'], ['Cell', 'colSpan / rowSpan']],
    'Root / Header / Body / Footer / Caption': [],
  } },
  'dropdown-menu': { name: 'DropdownMenu', parts: menuParts },
  'context-menu': { name: 'ContextMenu', parts: menuParts.map(part => part.name === 'RadioItem' ? { ...part, rows: [...part.rows!, row('value', 'string', '单选项的值。', 'Value of this radio item.')] } : part).concat([
    { name: 'Sub' }, { name: 'SubTrigger' }, { name: 'SubContent' },
  ]) },
  popover: { name: 'Popover', parts: [
    { name: 'Root' }, { name: 'Anchor', rows: [composition] }, { name: 'Trigger' },
    { name: 'Portal', rows: [portal] }, { name: 'Content' }, { name: 'Title', rows: text },
    { name: 'Description', rows: text }, { name: 'Close', rows: [composition, row('disabled', 'boolean', '禁用关闭按钮。', 'Disables the close button.')] },
  ], assignments: { 'Close / Portal': [] } },
  overlay: { name: 'Overlay', parts: [
    { name: 'Root' }, { name: 'Trigger' }, { name: 'Portal' },
    { name: 'Backdrop', rows: [composition, row('forceMount', 'true', '保留遮罩挂载，以便自定义动画。', 'Keeps the backdrop mounted for custom animation.')] },
    { name: 'Content' }, { name: 'Header' }, { name: 'Body', rows: [native('div', 'HTMLDivElement')] },
    { name: 'Footer' }, { name: 'Title', rows: text }, { name: 'Description', rows: text }, { name: 'Close' }, { name: 'CloseButton' },
  ], assignments: {
    'Header.divided / Footer.divided': [['Header', 'divided'], ['Footer', 'divided']],
    'Trigger / Close.asChild': [['Trigger', 'asChild'], ['Close', 'asChild']],
    Body: [], 'Title / Description': [],
  } },
  guide: { name: 'Guide', replace: true, parts: [
    { name: 'Root', rows: [
      row('open / defaultOpen', 'boolean', '受控打开状态或非受控初始状态。', 'Controlled open state or uncontrolled initial state.'),
      row('onOpenChange', '(open, { reason, step, stepId }) => void', '所有打开与关闭请求；reason 区分 trigger、close、escape、finish 和 skip。', 'All open/close requests; reason distinguishes trigger, close, escape, finish, and skip.'),
      row('step / defaultStep', 'number', '从 0 开始的受控步骤或非受控初始步骤；越界值会限制到有效范围。', 'Zero-based controlled step or uncontrolled initial step; out-of-range values are clamped.'),
      row('onStepChange', '(step, { reason, previousStep, stepId }) => void', '上一步或下一步请求；受控父组件可接受或拒绝。', 'Previous/next requests; a controlled parent may accept or reject them.'),
      row('onFinish / onSkip', '() => void', '完成仅在最后一步触发；跳过只触发 onSkip，绝不触发 onFinish。', 'Finish runs only on the final step; skip calls only onSkip and never onFinish.'),
      row('showSkip / showClose', 'boolean', '默认都显示；showSkip=false 隐藏独立跳过操作。', 'Both default to visible; showSkip=false hides the dedicated skip action.'),
      row('skipPlacement', "'panel' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'", '默认 top-end；将跳过操作放在逻辑屏幕角落，若与面板相交会换角或回退到面板内。', 'Defaults to top-end; places Skip in a logical screen corner and switches corner or falls back into the panel if it would overlap the panel.'),
      row('skipAppearance', "'icon' | 'text'", '默认 icon；图标模式使用本地化可访问名称和提示，text 显示完整跳过文案。', 'Defaults to icon; icon mode keeps the localized accessible name and tooltip, while text shows the full skip label.'),
      row('closeOnEscape', 'boolean', '默认 true；false 时 Escape 不关闭。关闭与 Escape 都不会触发完成或跳过。', 'Defaults to true; false keeps Escape from closing. Close and Escape never finish or skip.'),
      row('scrollIntoView', 'boolean | ScrollIntoViewOptions', '默认自动居中目标；false 保留当前滚动位置。减少动态效果时使用即时滚动。', 'Centers the target by default; false preserves scroll. Reduced motion uses instant scrolling.'),
      row('restoreFocus', 'boolean', '默认 true；关闭后返回触发器、打开前焦点或当前目标。', 'Defaults to true; restores the trigger, prior focus, or current target.'),
      row('highlightPadding / highlightRadius', 'number', '高亮外扩与圆角，分别限制为 0-48 和 0-32。', 'Highlight padding and radius, clamped to 0-48 and 0-32.'),
      row('locale / labels', 'string / Partial<GuideLabels>', '使用五语言默认字典，或覆盖导航、关闭、跳过与进度文案。', 'Uses the five-language defaults or overrides navigation, close, skip, and progress copy.'),
      row('portalContainer / className', 'HTMLElement | null / string', '指定 Portal 容器和面板内容类名。', 'Selects the portal container and panel content class.'),
    ] },
    { name: 'Trigger', rows: [composition, row('disabled', 'boolean', '禁用启动引导的触发器。', 'Disables the guide trigger.')] },
    { name: 'Step', rows: [
      row('target', 'string | HTMLElement | RefObject | () => HTMLElement | null', '目标选择器、元素、ref 或解析函数；缺失时回退到视口并取消高亮。', 'Selector, element, ref, or resolver; a missing target falls back to the viewport without a highlight.'),
      row('id', 'string', '回调使用的稳定步骤标识。', 'Stable step identifier reported by callbacks.'),
      row('title', 'string', '引导标题，使用可访问的对话框标题关联。', 'Guide title used as the accessible dialog label.'),
      row('description / children', 'ReactNode', '步骤说明；description 优先于 children。', 'Step description; description takes precedence over children.'),
      row('side / align', "'top' | 'right' | 'bottom' | 'left' / 'start' | 'center' | 'end'", '首选方向与对齐；碰撞时由 Radix 自动翻转。', 'Preferred side and alignment; Radix flips on collisions.'),
      row('sideOffset / collisionPadding', 'number', '目标间距与视口边缘留白，默认 12 / 16。', 'Target offset and viewport collision padding; defaults to 12 / 16.'),
    ] },
  ] },
  tooltip: { name: 'Tooltip', parts: [{ name: 'Provider' }, { name: 'Root' }, { name: 'Trigger' }, { name: 'Portal' }, { name: 'Content' }] },
  accordion: { name: 'Accordion', parts: [
    { name: 'Root' }, { name: 'Item' }, { name: 'Header', rows: [composition] }, { name: 'Trigger' }, { name: 'Content' },
  ], assignments: { 'Root.disabled / Item.disabled': [['Root', 'disabled'], ['Item', 'disabled']] } },
  select: { name: 'Select', parts: [
    { name: 'Root' }, { name: 'Trigger' }, { name: 'Value' }, { name: 'Portal' }, { name: 'Content' }, { name: 'Viewport' },
    { name: 'Group', rows: [composition] }, { name: 'Label', rows: text }, { name: 'Item' },
    { name: 'ItemText', rows: text }, { name: 'ItemIndicator', rows: [composition] },
    { name: 'ScrollUpButton', rows: [composition] }, { name: 'ScrollDownButton', rows: [composition] },
    { name: 'Separator', rows: [row('seed / className / style / ref', 'string | number / string / CSSProperties / HTMLDivElement', '分隔线笔迹及原生元素属性，不接收 children。', 'Separator pencil seed and native element props; children are not supported.')] },
    { name: 'Clear', rows: [row('children / disabled / onClick', 'ReactNode / boolean / MouseEventHandler<HTMLButtonElement>', '仅多选模式；放在 Trigger 外部，清空已选值。', 'Multiple mode only; place outside Trigger to clear selected values.')] },
    { name: 'Searchable' }, { name: 'Stepper' },
  ], assignments: {
    'Trigger props scope': [], Clear: [],
    'Portal/Content.forceMount / Viewport.nonce / Content.updatePositionStrategy': [
      ['Portal', 'forceMount', 'true; single mode only'], ['Content', 'forceMount', 'true; single mode only'],
      ['Viewport', 'nonce', 'string; single mode only'], ['Content', 'updatePositionStrategy', "'optimized' | 'always'; single mode only"],
    ],
  } },
  'hover-card': { name: 'HoverCard', replace: true, parts: [
    { name: 'Root', rows: [row('open / defaultOpen', 'boolean', '受控或初始打开状态，初始默认关闭。', 'Controlled or initial open state; initially closed by default.'), row('onOpenChange', '(open: boolean) => void', '打开状态变更回调。', 'Notifies open-state changes.'), row('openDelay / closeDelay', 'number', '悬停打开与离开关闭延迟，默认 700 / 300 毫秒。', 'Hover-open and departure-close delays; defaults to 700 / 300 ms.')] },
    { name: 'Trigger', rows: [composition, row('disabled', 'boolean', '禁用触发器。', 'Disables the trigger.')] },
    { name: 'Content', rows: [positioning, row('focusOnOpen', "'always' | 'focus-and-press' | 'never' | 'press'", '默认 press；控制打开时何种触发方式可以移动焦点。', 'Defaults to press; controls which activation reasons move focus.'), row('avoidCollisions / showArrow', 'boolean', '碰撞避让默认开启，箭头默认隐藏；内部自动挂载 Portal。', 'Collision avoidance defaults on and arrow defaults off; Content creates its own portal.'), row('onOpenAutoFocus / onCloseAutoFocus', '(event: Event) => void', '阻止默认事件可覆盖焦点行为。', 'Prevent the event default to override focus behavior.')] },
    { name: 'Title', rows: text }, { name: 'Description', rows: text }, { name: 'Close', rows: [composition] },
  ] },
  'image-viewer': { name: 'ImageViewer', parts: [
    { name: 'Root' }, { name: 'Trigger', rows: [composition, row('disabled', 'boolean', '禁用打开查看器的按钮；当前资源由 Root.activeId 控制。', 'Disables the viewer trigger; Root.activeId controls the active item.')] },
    { name: 'Content' }, { name: 'ImageViewerItem' }, { name: 'MediaViewer', rows: [row('Root / Trigger / Content', 'typeof ImageViewer', 'MediaViewer 是 ImageViewer 的别名，三个子组件 API 相同。', 'MediaViewer aliases ImageViewer with the same three component APIs.')] },
  ], assignments: { MediaViewer: [] } },
  hotkey: { name: 'Hotkey', standalone: true, parts: [{ name: 'Hotkey' }, { name: 'HotkeyInput' }] },
  'radio-group': { name: 'RadioGroup', standalone: true, unprefixed: 'RadioGroup', parts: [{ name: 'RadioGroup' }, { name: 'RadioGroupItem' }], assignments: {
    'ref / RadioGroupItem.ref': [['RadioGroup', 'ref', 'HTMLFieldSetElement'], ['RadioGroupItem', 'ref', 'HTMLInputElement']],
  } },
  'choice-grid': { name: 'ChoiceGrid', standalone: true, unprefixed: 'ChoiceGrid', parts: [{ name: 'ChoiceGrid' }, { name: 'ChoiceGridOption' }], assignments: {
    'ref / ChoiceGridOption.ref': [['ChoiceGrid', 'ref', 'HTMLFieldSetElement'], ['ChoiceGridOption', 'ref', 'HTMLInputElement']],
  } },
  flip: { name: 'Flip', standalone: true, replace: true, parts: [
    { name: 'Flip', rows: [row('front / back', 'ReactNode', '正面与背面内容。', 'Front and back content.'), row('flipped / defaultFlipped / onFlippedChange', 'boolean / boolean / (flipped: boolean) => void', '受控状态、初始状态与切换回调。', 'Controlled state, initial state and change callback.'), row('flipEnabled', 'boolean', '默认 true；控制翻面，不禁用两面的内容。', 'Defaults to true; controls flipping without disabling face content.'), row('tilt / tiltAxis / tiltMaxAngle', "boolean / 'both' | 'x' | 'y' / number", '独立设置鼠标倾斜、倾斜方向与角度。', 'Configures mouse tilt, axes and maximum angle independently.'), row('duration / tiltResponse / tiltResetDuration', 'number', '翻面、鼠标倾斜响应和复位的动画时长（毫秒）。', 'Flip, tilt-response and tilt-reset durations in milliseconds.')] },
    { name: 'FlipToggle', rows: [row('flipped', 'boolean', '显式目标状态；省略时切换当前状态，必须放在 Flip 内。', 'Explicit next state; omitted toggles the current state. Must be inside Flip.'), row('variant / size / disabled / children', 'ButtonProps', '沿用按钮外观、尺寸、禁用与内容属性。', 'Uses Button appearance, sizing, disabled and content props.')] },
    { name: 'Tilt', rows: [row('axis / disabled / maxAngle', "'both' | 'x' | 'y' / boolean / number", '倾斜轴、禁用与最大角度，默认 both / false / 8。', 'Tilt axes, disabled state and maximum angle; defaults to both / false / 8.'), row('response / resetDuration', 'number', '跟随鼠标与离开时复位的时长（毫秒）。', 'Pointer-follow and departure-reset durations in milliseconds.'), native('div', 'HTMLDivElement')] },
  ] },
  resizable: { name: 'Resizable', replace: true, parts: [
    { name: 'Root', rows: [row('orientation', "'horizontal' | 'vertical'", '排列方向，默认 horizontal。', 'Panel orientation; defaults to horizontal.'), row('layout / defaultLayout', 'ResizableLayout', '受控或初始布局；面板 id 到百分比的映射。', 'Controlled or initial layout; maps panel IDs to percentages.'), row('onLayoutChange', '(layout: ResizableLayout) => void', '尺寸变化时触发。', 'Runs when the layout changes.'), row('onLayoutCommit', '(layout: ResizableLayout, meta: ResizableLayoutChangeMeta) => void', '布局提交后触发，并提供变更信息。', 'Runs on layout commit with change metadata.'), row('apiRef / rootRef', 'Ref<ResizableRootRef> / Ref<HTMLDivElement>', '分别获取 getLayout/setLayout 命令与根节点。', 'Accesses getLayout/setLayout methods and the root element separately.'), row('resizeTargetMinimumSize', '{ coarse: number; fine: number }', '触摸与精细指针的最小拖拽区域，默认 44 / 12。', 'Minimum targets for coarse/fine pointers; defaults to 44 / 12.')] },
    { name: 'Panel', rows: [row('id', 'string | number', '布局映射中使用的稳定面板标识。', 'Stable panel identifier used in layout maps.'), row('defaultSize / minSize / maxSize', 'number | string', '数字是像素；字符串可使用 %、px、rem 等单位。', 'Numbers are pixels; strings accept %, px, rem and other units.'), row('collapsible / collapsedSize / collapsedThreshold', 'boolean / number | string / number | string', '启用折叠，并配置折叠尺寸和越过边界的距离。', 'Enables collapse and configures collapsed size and threshold.'), row('disabled / groupResizeBehavior', "boolean / 'preserve-relative-size' | 'preserve-pixel-size'", '禁止调整或指定父容器变化时如何保留尺寸。', 'Prevents resizing or selects behavior when the group resizes.'), row('onResize', '(size: PanelSize, id: string | number | undefined, previous: PanelSize | undefined) => void', '提供当前与上一次的百分比及像素尺寸。', 'Reports current and previous sizes in pixels and percentages.'), row('panelRef / elementRef', 'Ref<ResizablePanelRef> / Ref<HTMLDivElement>', '面板命令与 DOM 引用分离；命令支持 collapse、expand、resize、getSize、isCollapsed。', 'Separate imperative and DOM refs; commands include collapse, expand, resize, getSize and isCollapsed.')] },
    { name: 'Handle', rows: [row('label / aria-label', 'string', '拖拽条的无障碍名称，aria-label 优先于 label。', 'Accessible separator name; aria-label takes precedence over label.'), row('lineSeed', 'string | number', '分隔线笔迹种子。', 'Seed for the pencil separator.'), row('disabled / disableDoubleClick', 'boolean', '禁用拖拽或关闭双击恢复默认尺寸。', 'Disables dragging or double-click size reset.'), row('elementRef', 'Ref<HTMLDivElement>', '获取分隔条 DOM 元素。', 'Accesses the separator DOM element.')] },
    { name: 'Hooks', rows: [row('useResizableRootRef / useResizableRootCallbackRef', '() => ref / () => [handle, setHandle]', '获取根布局命令引用。', 'Creates refs for root layout commands.'), row('useResizablePanelRef / useResizablePanelCallbackRef', '() => ref / () => [handle, setHandle]', '获取面板尺寸与折叠命令引用。', 'Creates refs for panel resizing and collapse commands.')] },
  ] },
};

export function getFoundationApiGroups(component: string, source: readonly SourceRow[]): ApiGroup[] | undefined {
  const definition = foundationApiDefinitions[component];
  if (!definition) return undefined;
  const groups = definition.parts.map(part => ({
    id: part.name.replace(/[A-Z]/g, (letter, index) => `${index ? '-' : ''}${letter.toLowerCase()}`),
    title: definition.standalone || ['ImageViewerItem', 'MediaViewer', 'Hooks'].includes(part.name) ? part.name : `${definition.name}.${part.name}`,
    rows: [] as ApiRow[],
  }));
  const byPart = new Map(definition.parts.map((part, index) => [part.name, groups[index]]));
  if (!definition.replace) for (const [key, type] of source) {
    const part = definition.parts.find(candidate => key.startsWith(`${candidate.name}.`));
    const assignments = definition.assignments?.[key] ?? (part
      ? [[part.name, key.slice(part.name.length + 1)]]
      : definition.unprefixed ? [[definition.unprefixed, key]] : []);
    for (const [owner, prop, overrideType] of assignments) {
      byPart.get(owner)?.rows.push(row(prop, overrideType ?? type, describeApiProp(component, key, 'zh-CN'), describeApiProp(component, key, 'en-US')));
    }
  }
  definition.parts.forEach((part, index) => groups[index].rows.push(...(part.rows ?? [])));
  return groups;
}
