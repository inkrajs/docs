import { Button, PencilSurface } from '@inkra/react';
import { __iconData as plusIcon } from 'lucide-react/dist/esm/icons/plus.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { IconDesign } from './IconDesign';
import './TypographySystem.css';

const textRules = [
  { token: '3xl', size: 28, line: 'tight', role: '页面标题', usage: '每页唯一主标题；不用在卡片或侧栏。' },
  { token: '2xl', size: 24, line: 'tight', role: '章节标题', usage: '用于页面主要章节，不替代普通分组标题。' },
  { token: 'xl', size: 20, line: 'ui', role: '面板标题', usage: '用于弹层、独立工具和内容分组。' },
  { token: 'lg', size: 17, line: 'ui', role: '卡片标题', usage: '用于列表卡片标题与大号按钮。' },
  { token: 'md', size: 15, line: 'body', role: '正文', usage: '说明文字与阅读内容的默认值；常规控件改用 1.45 行高。' },
  { token: 'sm', size: 13, line: 'ui', role: '辅助信息', usage: '时间、计数、字段帮助与小号按钮；不用承载长正文。' },
  { token: 'xs', size: 12, line: 'ui', role: '紧凑标记', usage: '仅用于短刻度、紧凑标记和超小按钮；错误提示仍用 13px 以上。' },
] as const;

const iconRules = [
  { token: 'xs', size: 14, text: 12, button: 32, role: '紧凑行内图标', usage: '配 12px 短标签或超小按钮，不用于独立触屏主操作。' },
  { token: 'sm', size: 16, text: 13, button: 36, role: '辅助操作图标', usage: '配 13px 标签、小号按钮或紧凑表格操作。' },
  { token: 'md', size: 20, text: 15, button: 44, role: '常规操作图标', usage: '默认档：导航、输入框、工具栏与常规按钮。' },
  { token: 'lg', size: 24, text: 17, button: 48, role: '大号操作图标', usage: '配 17px 标签与大号按钮；不因操作重要就随意放大。' },
] as const;

export function TypographySystem() {
  const { t } = useLocale();
  return <div className="typography-system">
    <section aria-labelledby="font-family-title">
      <PencilText as="h2" id="font-family-title">字体</PencilText>
      <div className="typography-system__families">
        <div><PencilText as="h3">界面文字</PencilText><PencilText className="typography-system__writing">山水有相逢</PencilText><PencilText>Inkra · Aa Bb Cc</PencilText></div>
        <div><PencilText as="h3">代码与数值</PencilText><code className="typography-system__numbers">0123456789</code><code>const color = '#4b96aa';</code></div>
      </div>
      <PencilText as="p" className="typography-system__note">界面使用手写字体；代码、色值和对齐数值使用等宽字体。数字表格不要用比例字宽制造参差。</PencilText>
    </section>
    <section aria-labelledby="typography-title">
      <PencilText as="h2" id="typography-title">字号</PencilText>
      <div className="typography-system__rules">
        {textRules.map(rule => <div className="typography-rule" key={rule.token}>
          <div className="typography-rule__sample" style={{ fontSize: `var(--inkra-text-${rule.token})`, lineHeight: `var(--inkra-line-${rule.line})` }}>
            <PencilText>{rule.role}</PencilText>
          </div>
          <div className="typography-rule__details">
            <span className="typography-rule__measure">{rule.size}px · {t('行高')} {({ tight: 1.2, ui: 1.45, body: 1.6 })[rule.line]}</span>
            <PencilText as="p">{rule.usage}</PencilText>
          </div>
        </div>)}
      </div>
      <PencilText as="p" className="typography-system__note">窄屏先换行或重排，不按视口缩小字号。正文与控件至少保持各自默认档；同一行操作使用同一字号。</PencilText>
    </section>
    <section aria-labelledby="line-height-title">
      <PencilText as="h2" id="line-height-title">行高</PencilText>
      <div className="typography-system__line-examples">
        {([{ label: '标题', size: 24, line: 1.2 }, { label: '控件', size: 15, line: 1.45 }, { label: '正文', size: 15, line: 1.6 }]).map(item => <div key={item.label}>
          <PencilText>{item.label}</PencilText><span className="typography-rule__measure">{item.size}px / {Math.round(item.size * item.line * 100) / 100}px</span>
          <PencilText as="p" style={{ fontSize: item.size, lineHeight: item.line }}>{t('文字之间留有呼吸。') + '\n' + t('内容之间保持联系。')}</PencilText>
        </div>)}
      </div>
    </section>
    <section aria-labelledby="font-weight-title">
      <PencilText as="h2" id="font-weight-title">字重</PencilText>
      <PencilText as="p">手写字重固定为 400；强调依靠字号和前景颜色，不叠加伪粗体破坏笔触。</PencilText>
    </section>
    <section aria-labelledby="font-color-title">
      <PencilText as="h2" id="font-color-title">字体色</PencilText>
      <div className="typography-system__color-examples">
        {(['light', 'dark'] as const).map(theme => <PencilSurface variant="paper" key={theme} data-inkra-theme={theme} className="typography-system__text-colors" seed={`type-colors-${theme}`}>
          <PencilText as="h3">{theme === 'light' ? '浅色' : '深色'}</PencilText>
          <PencilText style={{ color: 'var(--inkra-ink)' }}>主要文字</PencilText>
          <PencilText style={{ color: 'var(--inkra-ink-muted)' }}>次要文字</PencilText>
          <PencilText style={{ color: 'var(--inkra-ink-subtle)' }}>辅助文字</PencilText>
        </PencilSurface>)}
      </div>
    </section>
  </div>;
}

export function IconSystem() {
  const { t } = useLocale();
  return <div className="typography-system">
    <IconDesign />
    <section aria-labelledby="icon-size-title">
      <PencilText as="h2" id="icon-size-title">图标尺寸与搭配</PencilText>
      <PencilText as="p" className="typography-system__note">尺寸指图标占位盒，不是外部点击区域。图标与文字居中对齐，默认间距 8px；按钮内间距由按钮尺寸统一管理。</PencilText>
      <div className="typography-system__rules">
        {iconRules.map(rule => <div className="typography-rule" key={rule.token}>
          <div className="icon-rule__sample" style={{ fontSize: `var(--inkra-text-${rule.token})` }}>
            <span className="icon-rule__glyph" data-icon-size={rule.size}><DocsIcon data={plusIcon} size={rule.size} seed={`icon-rule-${rule.token}`} /></span>
            <PencilText>新建笔记</PencilText>
          </div>
          <div className="typography-rule__details">
            <PencilText>{rule.role}</PencilText>
            <span className="typography-rule__measure">{t('图标')} {rule.size}px · {t('文字')} {rule.text}px · {t('按钮')} {rule.button}px</span>
            <PencilText as="p">{rule.usage}</PencilText>
          </div>
        </div>)}
      </div>
      <PencilText as="p" className="typography-system__note">所有交互命中区域至少 44 × 44px；小图标不缩小命中区域。纯图标按钮必须提供可访问名称，悬停或聚焦时显示提示。</PencilText>
      <PencilText as="p" className="typography-system__note">现有文档导航与主题图标保留 28–30px 彩铅展示尺寸；新增控件按上述四档执行，不把展示特例扩散为新默认值。</PencilText>
      <div className="typography-system__button-pairs">
        {(['xs', 'sm', 'md', 'lg'] as const).map(size => <div key={size}>
          <Button size={size} disabled startIcon={<DocsIcon data={plusIcon} size={20} seed={`type-button-${size}`} />}>{t('新建笔记')}</Button>
          <span className="typography-rule__measure">{({ xs: 12, sm: 13, md: 15, lg: 17 })[size]}px / {({ xs: 14, sm: 16, md: 20, lg: 24 })[size]}px</span>
        </div>)}
      </div>
    </section>
  </div>;
}
