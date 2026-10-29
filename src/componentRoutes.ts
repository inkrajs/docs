export const expansionComponents = ['toast', 'alert-dialog', 'drawer', 'date-picker', 'time-picker', 'pagination', 'empty', 'toggle-group', 'command', 'upload', 'data-table', 'tree', 'steps', 'timeline', 'stack', 'flex', 'grid', 'container', 'layout', 'inventory-grid'] as const;
export type ExpansionComponent = typeof expansionComponents[number];

export const foundationComponents = ['icon', 'slot', 'markdown', 'popover', 'overlay', 'guide', 'loading', 'infinite-scroll', 'masonry', 'tooltip', 'dropdown-menu', 'context-menu', 'hover-card', 'field', 'input', 'input-number', 'hotkey', 'textarea', 'select', 'color-swatch', 'color-picker', 'tag-input', 'tree-select', 'editable', 'slider', 'range-slider', 'checkbox', 'radio-group', 'switch', 'choice-grid', 'rating', 'keypad', 'tabs', 'breadcrumb', 'accordion', 'badge', 'number-ticker', 'log', 'audio-player', 'typewriter', 'separator', 'skeleton', 'progress', 'sparkline', 'radar', 'heatmap', 'overflow-list', 'virtual-list', 'transfer', 'sortable', 'node-graph', 'dependency-graph', 'carousel', 'image-viewer', 'image-cropper', 'pan-zoom', 'resizable', 'dockable-panel', 'flip', 'scroll-area', 'alert', 'avatar', 'card', 'table', 'calendar', 'day-agenda', 'journey-map', ...expansionComponents] as const;

type ComponentRoute = 'button' | typeof foundationComponents[number];

export const foundationNames: Record<typeof foundationComponents[number], string> = {
  'color-swatch': 'ColorSwatch',
  markdown: 'Markdown',
  icon: 'Icon', slot: 'Slot', 'input-number': 'InputNumber', hotkey: 'Hotkey', slider: 'Slider', breadcrumb: 'Breadcrumb',
  'context-menu': 'ContextMenu', 'hover-card': 'HoverCard', 'color-picker': 'ColorPicker', 'tag-input': 'TagInput', 'tree-select': 'TreeSelect', editable: 'Editable',
  'range-slider': 'RangeSlider', 'choice-grid': 'ChoiceGrid', rating: 'Rating', keypad: 'Keypad', 'audio-player': 'AudioPlayer', typewriter: 'Typewriter',
  sparkline: 'Sparkline', radar: 'Radar', heatmap: 'Heatmap', 'overflow-list': 'OverflowList', 'virtual-list': 'VirtualList', transfer: 'Transfer',
  sortable: 'Sortable', 'node-graph': 'NodeGraph', 'dependency-graph': 'DependencyGraph', carousel: 'Carousel', 'image-viewer': 'ImageViewer', 'image-cropper': 'ImageCropper',
  'pan-zoom': 'PanZoom', resizable: 'Resizable', 'dockable-panel': 'DockablePanel', flip: 'Flip', 'scroll-area': 'ScrollArea',
  calendar: 'Calendar', 'day-agenda': 'DayAgenda', 'journey-map': 'JourneyMap',
  popover: 'Popover', overlay: 'Overlay', field: 'Field', input: 'Input', textarea: 'Textarea', select: 'Select', checkbox: 'Checkbox', 'radio-group': 'RadioGroup', switch: 'Switch', tabs: 'Tabs',
  guide: 'Guide',
  loading: 'Loading', 'infinite-scroll': 'InfiniteScroll', masonry: 'Masonry',
  tooltip: 'Tooltip', accordion: 'Accordion', badge: 'Badge', 'number-ticker': 'NumberTicker', log: 'Log', separator: 'Separator', skeleton: 'Skeleton', progress: 'Progress',
  'dropdown-menu': 'DropdownMenu', alert: 'Alert', avatar: 'Avatar', card: 'Card', table: 'Table',
  toast: 'Toast', 'alert-dialog': 'AlertDialog', drawer: 'Drawer', 'date-picker': 'DatePicker',
  'time-picker': 'TimePicker', pagination: 'Pagination', empty: 'Empty', 'toggle-group': 'ToggleGroup',
  command: 'Command', upload: 'Upload', 'data-table': 'DataTable', tree: 'Tree', steps: 'Steps', timeline: 'Timeline',
  stack: 'Stack', flex: 'Flex', grid: 'Grid', container: 'Container', layout: 'Layout',
  'inventory-grid': 'InventoryGrid',
};

// Ordered for discovery by purpose, independently of route registration order.
export const componentNavigationGroups = [
  { label: '通用', components: ['button', 'icon', 'slot', 'separator'] },
  { label: '布局', components: ['stack', 'flex', 'grid', 'masonry', 'container', 'layout', 'resizable', 'dockable-panel', 'scroll-area', 'infinite-scroll'] },
  { label: '表单输入', components: ['input', 'select', 'textarea', 'input-number', 'hotkey', 'color-swatch', 'color-picker', 'tag-input', 'tree-select', 'editable', 'checkbox', 'radio-group', 'choice-grid', 'switch', 'date-picker', 'time-picker', 'slider', 'range-slider', 'rating', 'keypad', 'toggle-group', 'upload', 'field'] },
  { label: '导航菜单', components: ['tabs', 'dropdown-menu', 'context-menu', 'breadcrumb', 'pagination', 'command', 'steps'] },
  { label: '数据展示', components: ['markdown', 'card', 'table', 'data-table', 'badge', 'number-ticker', 'log', 'audio-player', 'typewriter', 'sparkline', 'radar', 'heatmap', 'overflow-list', 'virtual-list', 'transfer', 'sortable', 'node-graph', 'dependency-graph', 'carousel', 'avatar', 'accordion', 'tree', 'timeline', 'calendar', 'day-agenda', 'journey-map'] },
  { label: '反馈状态', components: ['alert', 'toast', 'loading', 'progress', 'skeleton', 'empty'] },
  { label: '弹层', components: ['overlay', 'drawer', 'popover', 'guide', 'hover-card', 'tooltip', 'image-viewer', 'image-cropper', 'alert-dialog'] },
  { label: '视觉交互', components: ['pan-zoom', 'flip', 'inventory-grid'] },
] satisfies Array<{ label: string; components: ComponentRoute[] }>;

export function isExpansionComponent(value: string): value is ExpansionComponent {
  return expansionComponents.some(component => component === value);
}
