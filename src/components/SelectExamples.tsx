import { useState } from 'react';
import { Button, Field, PencilIcon, Select, Slider, Switch, Tooltip } from '@inkra/react';
import { __iconData as languagesIcon } from 'lucide-react/dist/esm/icons/languages.mjs';
import { __iconData as usersIcon } from 'lucide-react/dist/esm/icons/users.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { iconPaths } from './DocsIcon';
import { PencilText, useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import { ComponentExample } from './ComponentExample';
import { DocsSelect, controlSizes } from './DocsSelect';

const visibilityOptions = [['private', '仅自己'], ['team', '团队'], ['public', '公开']] as const;
const archiveOptions = [['drafts', '草稿'], ['notes', '笔记'], ['archive', '归档笔记']] as const;
const languagePaths = iconPaths(languagesIcon);
const usersPaths = iconPaths(usersIcon);
const checkPaths = iconPaths(checkIcon);

function TriggerExamples() {
  const { t } = useLocale();
  const variants = [
    { title: '前置图标', props: {}, code: '' },
    { title: '隐藏下拉箭头', props: { hideIndicator: true }, code: ' hideIndicator' },
    { title: '隐藏选中值', props: { hideValue: true, fullWidth: false }, code: ' hideValue fullWidth={false}' },
    { title: '纯图标触发器', props: { iconOnly: true }, code: ' iconOnly' },
  ];
  return <>{variants.map(({ title, props, code }) => <ComponentExample key={title} title={title} code={`const languagePaths = ${JSON.stringify(languagePaths)};

<Select.Root defaultValue="zh-CN">
  <Tooltip.Provider><Tooltip.Root${props.hideValue || props.iconOnly ? '' : ' open={false}'}>
    <Tooltip.Trigger asChild>
      <Select.Trigger aria-label="${t('语言')}"${code}
        startIcon={<PencilIcon paths={languagePaths} size={22} sourceSize={24} />}>
        <Select.Value />
      </Select.Trigger>
    </Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content>${t('语言')}</Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root></Tooltip.Provider>
  <Select.Portal><Select.Content position="popper" sideOffset={8}>
    <Select.Viewport>
      <Select.Item value="zh-CN"><Select.ItemText>中文</Select.ItemText><Select.ItemIndicator /></Select.Item>
      <Select.Item value="en"><Select.ItemText>English</Select.ItemText><Select.ItemIndicator /></Select.Item>
    </Select.Viewport>
  </Select.Content></Select.Portal>
</Select.Root>`}>
    <div className="component-demo-form">
      <Select.Root defaultValue="zh-CN">
        <Tooltip.Provider><Tooltip.Root open={props.hideValue || props.iconOnly ? undefined : false}>
          <Tooltip.Trigger asChild><Select.Trigger {...props} aria-label={t('语言')} startIcon={<PencilIcon paths={languagePaths} size={22} sourceSize={24} />}><Select.Value /></Select.Trigger></Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content>{t('语言')}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root></Tooltip.Provider>
        <Select.Portal><Select.Content position="popper" sideOffset={8}><Select.Viewport>
          <Select.Item value="zh-CN"><Select.ItemText>中文</Select.ItemText><Select.ItemIndicator /></Select.Item>
          <Select.Item value="en"><Select.ItemText>English</Select.ItemText><Select.ItemIndicator /></Select.Item>
        </Select.Viewport></Select.Content></Select.Portal>
      </Select.Root>
    </div>
  </ComponentExample>)}</>;
}

function VisibilityItems() {
  const { t } = useLocale();
  return <Select.Group>
    <Select.Label>{t('可见范围')}</Select.Label>
    {visibilityOptions.map(([value, label]) => <Select.Item key={value} value={value} disabled={value === 'public'}>
      <Select.ItemText>{t(label)}</Select.ItemText><Select.ItemIndicator />
    </Select.Item>)}
  </Select.Group>;
}

export function SelectExamples() {
  const { t } = useLocale();
  const [value, setValue] = useState('');
  const [multiple, setMultiple] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'dropdown' | 'search-trigger' | 'search-popup' | 'stepper'>('dropdown');
  const [loop, setLoop] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [required, setRequired] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [startIcon, setStartIcon] = useState(false);
  const [endIcon, setEndIcon] = useState(false);
  const [hideValue, setHideValue] = useState(false);
  const [hideIndicator, setHideIndicator] = useState(false);
  const [iconOnly, setIconOnly] = useState(false);
  const [fullWidth, setFullWidth] = useState(true);
  const [textAlign, setTextAlign] = useState<'start' | 'center' | 'end'>('start');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('start');
  const [offset, setOffset] = useState(8);
  const [collisionPadding, setCollisionPadding] = useState(12);
  const [multipleStatus, setMultipleStatus] = useState('');
  const stepper = interactionMode === 'stepper';
  const searchPlacement = interactionMode === 'search-trigger' ? 'trigger' : interactionMode === 'search-popup' ? 'popup' : 'none';
  const playgroundMultiple = !stepper && multiple;
  const resolvedInvalid = invalid;
  const items = visibilityOptions.map(([optionValue, label]) => ({ value: optionValue, label: t(label) }));
  const selectableItems = items.map(item => ({ ...item, disabled: item.value === 'public' }));
  const itemCode = visibilityOptions.map(([item, label]) => `              <Select.Item value="${item}"${item === 'public' ? ' disabled' : ''}><Select.ItemText>${t(label)}</Select.ItemText><Select.ItemIndicator /></Select.Item>`).join('\n');
  const contentCode = `        <Select.Portal>
          <Select.Content position="popper" side="${side}" align="${align}" sideOffset={${offset}} collisionPadding={${collisionPadding}}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>${t('可见范围')}</Select.Label>
${itemCode}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
${playgroundMultiple ? `            <Select.Clear>${t('清空选择')}</Select.Clear>` : ''}
          </Select.Content>
        </Select.Portal>`;
  const triggerPropsCode = `hideValue={${hideValue}} hideIndicator={${hideIndicator}} iconOnly={${iconOnly}} fullWidth={${fullWidth}} textAlign="${textAlign}"${startIcon ? ` startIcon={<PencilIcon paths={${JSON.stringify(usersPaths)}} size={${size === 'sm' ? 18 : size === 'lg' ? 26 : 22}} sourceSize={24} />}` : ''}${endIcon ? ` endIcon={<PencilIcon paths={${JSON.stringify(checkPaths)}} size={${size === 'sm' ? 18 : size === 'lg' ? 26 : 22}} sourceSize={24} />}` : ''}`;
  const dropdownCode = `const [value, setValue] = useState(${JSON.stringify(playgroundMultiple ? values : value)});
const [open, setOpen] = useState(false);
const required = ${required};
const disabled = ${disabled};
const invalid = ${invalid};

  <Field label="${t('可见范围')}" required={required} invalid={invalid} error={invalid ? '${t('请选择可见范围')}' : undefined}>
    <Select.Root ${playgroundMultiple ? `multiple items={${JSON.stringify(items)}} ` : ''}name="visibility" value={value} onValueChange={setValue} open={open} onOpenChange={setOpen} disabled={disabled} readOnly={${readOnly}} dir="${dir}">
      <Tooltip.Provider><Tooltip.Root${iconOnly || hideValue ? '' : ' open={false}'}>
        <Tooltip.Trigger asChild>
          <Select.Trigger aria-label="${t('可见范围')}" size="${size}" ${triggerPropsCode}><Select.Value placeholder="${t('请选择')}" /></Select.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Portal><Tooltip.Content>${t('可见范围')}</Tooltip.Content></Tooltip.Portal>
      </Tooltip.Root></Tooltip.Provider>
${contentCode}
    </Select.Root>
  </Field>`;
  const searchableCode = `const [value, setValue] = useState<${playgroundMultiple ? 'string[]' : 'string | null'}>(${JSON.stringify(playgroundMultiple ? values : value || null)});
const [open, setOpen] = useState(${open});

<Field label="${t('可见范围')}" required={${required}} invalid={${resolvedInvalid}}>
  <Select.Searchable ${playgroundMultiple ? 'multiple ' : ''}items={${JSON.stringify(selectableItems)}}
    name="visibility" value={value} onValueChange={setValue}
    searchPlacement="${searchPlacement}" size="${size}" dir="${dir}"
    placeholder="${t('请选择')}" searchPlaceholder="${t('搜索选项')}" emptyContent="${t('没有匹配的选项')}"
    open={open} onOpenChange={setOpen} side="${side}" align="${align}" sideOffset={${offset}} collisionPadding={${collisionPadding}}
    disabled={${disabled}} readOnly={${readOnly}} />
</Field>`;
  const stepperCode = `const [value, setValue] = useState<string | null>(${JSON.stringify(value || null)});
const items = ${JSON.stringify(selectableItems)};

  <Field label="${t('可见范围')}" required={${required}} invalid={${resolvedInvalid}}>
    <Select.Stepper
      name="visibility" items={items} value={value} onValueChange={setValue}
      loop={${loop}} size="${size}" dir="${dir}"
      placeholder="${t('请选择')}"
      previousLabel="${t('选择上一项')}" nextLabel="${t('选择下一项')}"
      disabled={${disabled}} readOnly={${readOnly}} required={${required}} invalid={${resolvedInvalid}} />
  </Field>`;
  const defaultCode = `<form>
  <Field label="${t('可见范围')}">
    <Select.Root name="visibility" defaultValue="team">
      <Select.Trigger><Select.Value /></Select.Trigger>
      <Select.Portal><Select.Content position="popper" sideOffset={8}>
        <Select.ScrollUpButton /><Select.Viewport>
          <Select.Group><Select.Label>${t('可见范围')}</Select.Label>
${itemCode}
          </Select.Group>
        </Select.Viewport><Select.ScrollDownButton />
      </Select.Content></Select.Portal>
    </Select.Root>
  </Field>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
</form>`;
  const groupedCode = `<Field label="${t('笔记分类')}">
  <Select.Root defaultValue="notes">
    <Select.Trigger><Select.Value /></Select.Trigger>
    <Select.Portal><Select.Content position="popper" sideOffset={8}>
      <Select.ScrollUpButton /><Select.Viewport style={{ maxHeight: 200 }}>
        <Select.Group><Select.Label>${t('笔记分类')}</Select.Label>
${archiveOptions.map(([item, label]) => `          <Select.Item value="${item}"><Select.ItemText>${t(label)}</Select.ItemText><Select.ItemIndicator /></Select.Item>`).join('\n')}
        </Select.Group>
        <Select.Separator />
        <Select.Group><Select.Label>${t('可见范围')}</Select.Label>
${itemCode}
        </Select.Group>
      </Select.Viewport><Select.ScrollDownButton />
    </Select.Content></Select.Portal>
  </Select.Root>
</Field>`;

  return <>
    <ComponentPlayground code={stepper ? stepperCode : searchPlacement === 'none' ? dropdownCode : searchableCode} controls={<PropertyTabs groups={[{ label: '基础', content: <>
      <DocsSelect label="选择模式" value={interactionMode} onValueChange={next => {
        setInteractionMode(next as typeof interactionMode);
        if (next === 'stepper') setMultiple(false);
        setOpen(false);
      }} options={[["dropdown", "下拉选择"], ["search-trigger", "触发器搜索"], ["search-popup", "弹层搜索"], ["stepper", "左右切换"]]} />
      {!stepper && <Switch label={t('多选')} checked={multiple} onCheckedChange={next => { setMultiple(next); setOpen(false); }} />}
      <DocsSelect label="尺寸" value={size} onValueChange={next => setSize(next as typeof size)} options={controlSizes} />
    </> }, ...(interactionMode === 'dropdown' ? [{ label: '内容', content: <>
      <Switch label={t('前置图标')} checked={startIcon} onCheckedChange={setStartIcon} />
      <Switch label={t('后置图标')} checked={endIcon} disabled={iconOnly} onCheckedChange={setEndIcon} />
      <Switch label={t('隐藏选中值')} checked={hideValue || iconOnly} disabled={iconOnly} onCheckedChange={setHideValue} />
      <Switch label={t('隐藏下拉箭头')} checked={hideIndicator || iconOnly} disabled={iconOnly} onCheckedChange={setHideIndicator} />
      <Switch label={t('纯图标触发器')} checked={iconOnly} onCheckedChange={next => { setIconOnly(next); if (next) setStartIcon(true); }} />
      <Switch label={t('撑满宽度')} checked={fullWidth && !iconOnly} disabled={iconOnly} onCheckedChange={setFullWidth} />
      <DocsSelect label="内容对齐" value={textAlign} onValueChange={next => setTextAlign(next as typeof textAlign)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
    </> }] : []), ...(stepper ? [{ label: '交互', content: <>
      <Switch label={t('循环导航')} checked={loop} onCheckedChange={setLoop} />
    </> }] : []), { label: '布局', content: <>
      <DocsSelect label="阅读方向" value={dir} onValueChange={next => setDir(next as typeof dir)} options={[["ltr", "LTR"], ["rtl", "RTL"]]} />
      {!stepper && <>
        <DocsSelect label="方向" value={side} onValueChange={next => setSide(next as typeof side)} options={[["top", "上"], ["right", "右"], ["bottom", "下"], ["left", "左"]]} />
        <DocsSelect label="对齐" value={align} onValueChange={next => setAlign(next as typeof align)} options={[["start", "Start"], ["center", "Center"], ["end", "End"]]} />
        <div><PencilText>偏移</PencilText><Slider aria-label={t('偏移')} min={0} max={32} step={4} value={[offset]} onValueChange={next => setOffset(next[0])} getValueLabel={number => `${number}px`} /><output>{offset}px</output></div>
        <div><PencilText>边缘留白</PencilText><Slider aria-label={t('边缘留白')} min={0} max={32} step={4} value={[collisionPadding]} onValueChange={next => setCollisionPadding(next[0])} getValueLabel={number => `${number}px`} /><output>{collisionPadding}px</output></div>
      </>}
    </> }, { label: '状态', content: <>
      {!stepper && <Switch label={t('展开')} checked={open} disabled={disabled} onCheckedChange={setOpen} />}
      <Switch label={t('必填')} checked={required} onCheckedChange={setRequired} />
      <Switch label={t('只读')} checked={readOnly} onCheckedChange={setReadOnly} />
      <Switch label={t('禁用')} checked={disabled} onCheckedChange={next => { setDisabled(next); if (next) setOpen(false); }} />
      <Switch label={t('错误状态')} checked={invalid} onCheckedChange={setInvalid} />
    </> }]} />}>
      <div className="component-demo-form" dir={dir}>
        <Field label={t('可见范围')} required={required} invalid={resolvedInvalid} error={resolvedInvalid ? t('请选择可见范围') : undefined}>
          {stepper ? <Select.Stepper items={selectableItems} name="visibility"
            value={value || null} onValueChange={setValue}
            loop={loop} size={size} dir={dir} placeholder={t('请选择')}
            previousLabel={t('选择上一项')} nextLabel={t('选择下一项')}
            disabled={disabled} readOnly={readOnly} required={required} invalid={resolvedInvalid}
          /> : searchPlacement !== 'none' ? <Select.Searchable key={`${searchPlacement}-${playgroundMultiple}`}
            {...(playgroundMultiple ? { multiple: true as const, value: values, onValueChange: setValues } : { value: value || null, onValueChange: (next: string | null) => setValue(next ?? '') })}
            items={selectableItems} searchPlacement={searchPlacement}
            name="visibility" placeholder={t('请选择')} searchPlaceholder={t('搜索选项')} emptyContent={t('没有匹配的选项')} clearLabel={t('清空选择')} openLabel={t('展开选项')}
            size={size} dir={dir} open={open} onOpenChange={setOpen} disabled={disabled} readOnly={readOnly}
            side={side} align={align} sideOffset={offset} collisionPadding={collisionPadding}
          /> : <Select.Root key={String(playgroundMultiple)} {...(playgroundMultiple
            ? { multiple: true as const, items, value: values, onValueChange: setValues }
            : { value, onValueChange: setValue })}
            name="visibility" open={open} onOpenChange={setOpen} disabled={disabled} readOnly={readOnly} dir={dir}>
            <Tooltip.Provider><Tooltip.Root open={iconOnly || hideValue ? undefined : false}>
              <Tooltip.Trigger asChild><Select.Trigger size={size} aria-label={t('可见范围')}
                startIcon={startIcon ? <PencilIcon paths={usersPaths} size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22} sourceSize={24} /> : undefined}
                endIcon={endIcon ? <PencilIcon paths={checkPaths} size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22} sourceSize={24} /> : undefined}
                hideValue={hideValue} hideIndicator={hideIndicator} iconOnly={iconOnly} fullWidth={fullWidth} textAlign={textAlign}>
                <Select.Value placeholder={t('请选择')} />
              </Select.Trigger></Tooltip.Trigger>
              <Tooltip.Portal><Tooltip.Content>{t('可见范围')}</Tooltip.Content></Tooltip.Portal>
            </Tooltip.Root></Tooltip.Provider>
            <Select.Portal><Select.Content position="popper" side={side} align={align} sideOffset={offset} collisionPadding={collisionPadding}>
              <Select.ScrollUpButton /><Select.Viewport><VisibilityItems /></Select.Viewport><Select.ScrollDownButton />
              {playgroundMultiple && <Select.Clear>{t('清空选择')}</Select.Clear>}
            </Select.Content></Select.Portal>
          </Select.Root>}
        </Field>
      </div>
    </ComponentPlayground>
    <TriggerExamples />
    <ComponentExample title="多选" code={`const [result, setResult] = useState('');

<form onSubmit={event => {
  event.preventDefault();
  setResult(JSON.stringify(new FormData(event.currentTarget).getAll('categories')));
}} onReset={() => setResult('')}>
  <Field label="${t('笔记分类')}">
    <Select.Root multiple name="categories" defaultValue={['notes']}
      items={${JSON.stringify(archiveOptions.map(([value, label]) => ({ value, label: t(label) })))}}>
      <Select.Trigger><Select.Value placeholder="${t('请选择')}" /></Select.Trigger>
      <Select.Portal><Select.Content position="popper" sideOffset={8}>
        <Select.Viewport>
${archiveOptions.map(([value, label]) => `          <Select.Item value="${value}"><Select.ItemText>${t(label)}</Select.ItemText><Select.ItemIndicator /></Select.Item>`).join('\n')}
        </Select.Viewport>
        <Select.Clear>${t('清空选择')}</Select.Clear>
      </Select.Content></Select.Portal>
    </Select.Root>
  </Field>
  <Button type="submit">${t('读取表单')}</Button>
  <Button type="reset" variant="secondary">${t('重置')}</Button>
  <output aria-live="polite">{result}</output>
</form>`}>
      <form className="component-demo-form" onSubmit={event => {
        event.preventDefault();
        setMultipleStatus(JSON.stringify(new FormData(event.currentTarget).getAll('categories')));
      }} onReset={() => setMultipleStatus('')}>
        <Field label={t('笔记分类')}>
          <Select.Root multiple name="categories" defaultValue={['notes']} items={archiveOptions.map(([value, label]) => ({ value, label: t(label) }))}>
            <Select.Trigger><Select.Value placeholder={t('请选择')} /></Select.Trigger>
            <Select.Portal><Select.Content position="popper" sideOffset={8}>
              <Select.Viewport>{archiveOptions.map(([value, label]) => <Select.Item key={value} value={value}><Select.ItemText>{t(label)}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}</Select.Viewport>
              <Select.Clear>{t('清空选择')}</Select.Clear>
            </Select.Content></Select.Portal>
          </Select.Root>
        </Field>
        <div className="component-demo-row"><Button type="submit">{t('读取表单')}</Button><Button type="reset" variant="secondary">{t('重置')}</Button></div>
        <output className="component-demo-status" aria-live="polite">{multipleStatus}</output>
      </form>
    </ComponentExample>
    <ComponentExample title="默认值与表单重置" code={defaultCode}>
      <form className="component-demo-form">
        <Field label={t('可见范围')}><Select.Root name="visibility" defaultValue="team"><Select.Trigger><Select.Value /></Select.Trigger>
          <Select.Portal><Select.Content position="popper" sideOffset={8}><Select.ScrollUpButton /><Select.Viewport><VisibilityItems /></Select.Viewport><Select.ScrollDownButton /></Select.Content></Select.Portal>
        </Select.Root></Field>
        <div><Button type="reset" variant="secondary">{t('重置')}</Button></div>
      </form>
    </ComponentExample>
    <ComponentExample title="分组与滚动选项" code={groupedCode}>
      <div className="component-demo-form"><Field label={t('笔记分类')}><Select.Root defaultValue="notes">
        <Select.Trigger><Select.Value /></Select.Trigger>
        <Select.Portal><Select.Content position="popper" sideOffset={8}>
          <Select.ScrollUpButton /><Select.Viewport style={{ maxHeight: 200 }}>
            <Select.Group><Select.Label>{t('笔记分类')}</Select.Label>
              {archiveOptions.map(([item, label]) => <Select.Item key={item} value={item}><Select.ItemText>{t(label)}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
            </Select.Group><Select.Separator /><VisibilityItems />
          </Select.Viewport><Select.ScrollDownButton />
        </Select.Content></Select.Portal>
      </Select.Root></Field></div>
    </ComponentExample>
  </>;
}
