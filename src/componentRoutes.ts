export const expansionComponents = ['toast', 'alert-dialog', 'drawer', 'date-picker', 'time-picker', 'pagination', 'empty', 'toggle-group', 'command', 'upload', 'data-table', 'tree', 'steps', 'timeline'] as const;
export type ExpansionComponent = typeof expansionComponents[number];

export const foundationComponents = ['icon', 'popover', 'overlay', 'tooltip', 'dropdown-menu', 'field', 'input', 'input-number', 'textarea', 'select', 'slider', 'checkbox', 'radio-group', 'switch', 'tabs', 'breadcrumb', 'accordion', 'badge', 'separator', 'skeleton', 'progress', 'alert', 'avatar', 'card', 'table', 'calendar', 'day-agenda', 'journey-map', ...expansionComponents] as const;

type ComponentRoute = 'button' | typeof foundationComponents[number];

export const foundationNames: Record<typeof foundationComponents[number], string> = {
  icon: 'Icon', 'input-number': 'InputNumber', slider: 'Slider', breadcrumb: 'Breadcrumb',
  calendar: 'Calendar', 'day-agenda': 'DayAgenda', 'journey-map': 'JourneyMap',
  popover: 'Popover', overlay: 'Overlay', field: 'Field', input: 'Input', textarea: 'Textarea', select: 'Select', checkbox: 'Checkbox', 'radio-group': 'RadioGroup', switch: 'Switch', tabs: 'Tabs',
  tooltip: 'Tooltip', accordion: 'Accordion', badge: 'Badge', separator: 'Separator', skeleton: 'Skeleton', progress: 'Progress',
  'dropdown-menu': 'DropdownMenu', alert: 'Alert', avatar: 'Avatar', card: 'Card', table: 'Table',
  toast: 'Toast', 'alert-dialog': 'AlertDialog', drawer: 'Drawer', 'date-picker': 'DatePicker',
  'time-picker': 'TimePicker', pagination: 'Pagination', empty: 'Empty', 'toggle-group': 'ToggleGroup',
  command: 'Command', upload: 'Upload', 'data-table': 'DataTable', tree: 'Tree', steps: 'Steps', timeline: 'Timeline',
};

// Ordered for discovery by purpose, independently of route registration order.
export const componentNavigationGroups = [
  { label: '通用', components: ['button', 'icon', 'separator'] },
  { label: '表单输入', components: ['input', 'select', 'textarea', 'input-number', 'checkbox', 'radio-group', 'switch', 'date-picker', 'time-picker', 'slider', 'toggle-group', 'upload', 'field'] },
  { label: '导航菜单', components: ['tabs', 'dropdown-menu', 'breadcrumb', 'pagination', 'command', 'steps'] },
  { label: '数据展示', components: ['card', 'table', 'data-table', 'badge', 'avatar', 'accordion', 'tree', 'timeline'] },
  { label: '反馈状态', components: ['alert', 'toast', 'progress', 'skeleton', 'empty'] },
  { label: '弹层', components: ['overlay', 'drawer', 'popover', 'tooltip', 'alert-dialog'] },
  { label: '日期与地图', components: ['calendar', 'day-agenda', 'journey-map'] },
] satisfies Array<{ label: string; components: ComponentRoute[] }>;

export function isExpansionComponent(value: string): value is ExpansionComponent {
  return expansionComponents.some(component => component === value);
}
