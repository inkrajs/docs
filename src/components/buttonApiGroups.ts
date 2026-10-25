import type { ApiGroup, ApiRow } from './apiGroupRows.ts';

const sharedRows: readonly ApiRow[] = [
  ['variant', "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'", "'primary'", '视觉与语义层级。', 'Visual and semantic hierarchy.'],
  ['size', "'xs' | 'sm' | 'md' | 'lg' | 'icon-xs' | 'icon-sm' | 'icon' | 'icon-lg'", "'md'", '文字或纯图标尺寸。', 'Text or icon-only sizing.'],
  ['startIcon / endIcon', 'ReactNode', '-', '逻辑起始侧与结束侧图标。', 'Logical leading and trailing icons.'],
  ['loading', 'boolean', 'false', '展示加载态并阻止重复触发。', 'Displays loading state and prevents repeated activation.'],
  ['fullWidth', 'boolean', 'false', '撑满可用宽度。', 'Fills the available width.'],
  ['align', "'start' | 'center' | 'end'", "'center'", '内容对齐。', 'Content alignment.'],
  ['loadingPosition', "'start' | 'center' | 'end'", "'center'", '两侧加载保留文字和固定槽位；纯图标始终居中。', 'Side loading retains text and fixed slots; icon-only loading stays centered.'],
  ['loadingIndicator', 'ReactNode', '-', '替换装饰性加载图标，不放交互内容。', 'Replaces the decorative loading indicator; do not insert interactive content.'],
  ['seed', 'string | number', '-', '稳定材质采样；省略时自动生成。', 'Stable material seed; automatically generated when omitted.'],
];

export const buttonApiGroups: readonly ApiGroup[] = [
  { id: 'button', title: 'Button', rows: [
    ...sharedRows,
    ['disabled', 'boolean', 'false', '禁用原生按钮。', 'Disables the native button.'],
    ['type / name / value / form', 'native button props', '-', '原生按钮与表单语义。', 'Native button and form semantics.'],
    ['ref', 'HTMLButtonElement', '-', '原生按钮引用。', 'Native button ref.'],
  ] },
  { id: 'button-link', title: 'ButtonLink', rows: [
    ...sharedRows,
    ['href / target / rel / download', 'native anchor props', '-', '原生锚点导航与下载属性。', 'Native anchor navigation and download attributes.'],
    ['disabled', 'boolean', 'false', '禁用或加载时移除 href、退出 Tab 顺序并阻止激活。', 'When disabled or loading, removes href, leaves the tab order and prevents activation.'],
    ['ref', 'HTMLAnchorElement', '-', '原生锚点引用。', 'Native anchor ref.'],
  ] },
  { id: 'button-group', title: 'ButtonGroup', rows: [
    ['orientation', "'horizontal' | 'vertical'", "'horizontal'", '分组方向；组件使用 role="group"。', 'Group orientation; the component uses role="group".'],
    ['size / variant', 'ButtonSize / ButtonVariant', '-', '组内默认尺寸和外观，子按钮可以覆盖。', 'Default child sizing and appearance; children may override them.'],
    ['disabled', 'boolean', 'false', '禁用组内按钮和链接，子项不可解除。', 'Disables child buttons and links; children cannot override it.'],
    ['fullWidth', 'boolean', 'false', '撑满可用宽度。', 'Fills the available width.'],
    ['equalWidth', 'boolean', 'false', '等宽按钮；窄屏保留局部滚动。', 'Equal-width buttons with local scrolling in narrow layouts.'],
    ['children / className / style / ref', 'ReactNode / string / CSSProperties / HTMLDivElement', '-', '原生分组容器属性。', 'Native group container attributes.'],
  ] },
];
