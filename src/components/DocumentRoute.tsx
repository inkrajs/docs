import { lazy, Suspense } from 'react';
import type { ButtonTab, FoundationComponent, RoutePath, Theme } from '../routes';
import { useLocale } from '../i18n';
import { PageHeading } from './PageHeading';

const FoundationPage = lazy(() => import('./FoundationPages').then(module => ({ default: module.FoundationPage })));
const ButtonPage = lazy(() => import('./ButtonDocumentation').then(module => ({ default: module.ButtonPage })));
const GettingStartedPage = lazy(() => import('./GettingStartedPage').then(module => ({ default: module.GettingStartedPage })));
const DesignStandardPage = lazy(() => import('./DesignStandardPage').then(module => ({ default: module.DesignStandardPage })));
const InternationalizationExamples = lazy(() => import('./InternationalizationExamples').then(module => ({ default: module.InternationalizationExamples })));
const ThemeExamples = lazy(() => import('./ThemeExamples').then(module => ({ default: module.ThemeExamples })));
const UsageGuide = lazy(() => import('./UsageGuide').then(module => ({ default: module.UsageGuide })));

export default function DocumentRoute({ route, activeTab, onTabChange, onNavigate, theme }: {
  route: RoutePath;
  activeTab: ButtonTab;
  onTabChange: (tab: ButtonTab) => void;
  onNavigate: (path: RoutePath) => void;
  theme: Theme;
}) {
  const { t } = useLocale();
  return <Suspense fallback={<div className="documentation" role="status">{t('加载中')}</div>}>
    {route === '/components/button' ? <ButtonPage activeTab={activeTab} onTabChange={onTabChange} />
      : route.startsWith('/components/') ? <FoundationPage key={route} component={route.slice('/components/'.length) as FoundationComponent} activeTab={activeTab} onTabChange={onTabChange} />
      : route === '/internationalization' ? <article className="documentation"><PageHeading title="国际化" description="换种语言打招呼，别让用户自己翻译。" /><InternationalizationExamples /></article>
      : route === '/theming' ? <article className="documentation"><PageHeading title="主题定制" description="颜色、笔触都能改，不用和我长得一样。" /><ThemeExamples /></article>
      : route === '/design-standard' ? <DesignStandardPage theme={theme} />
      : route === '/usage-guide' ? <article className="documentation"><PageHeading title="使用指南" /><section className="content-section"><UsageGuide theme={theme} /></section></article>
      : <GettingStartedPage onNavigate={onNavigate} />}
  </Suspense>;
}
