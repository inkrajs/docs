import { foundationComponents, foundationNames } from './componentRoutes.ts';

const pageNames: Record<string, string> = {
  '/blog': '博客',
  '/blog/from-travel-journal-to-inkra': '从旅行手账，到 Inkra',
  '/ecosystem': '生态',
  '/getting-started': '快速开始',
  '/ai-guide': '与 AI 一起开发',
  '/installation': '手动接入',
  '/internationalization': '国际化',
  '/theming': '主题定制',
  '/design-standard': '设计规范',
  '/usage-guide': '使用指南',
  '/components/button': 'Button',
  ...Object.fromEntries(foundationComponents.map(name => [`/components/${name}`, foundationNames[name]])),
};

// Shared by client navigation and static direct-entry pages.
export function pageTitle(pathname: string, translate: (text: string) => string = text => text): string {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'Inkra';
  const docsPath = path.replace(/^\/docs(?=\/|$)/, '') || '/getting-started';
  const name = pageNames[docsPath] ?? pageNames['/getting-started'];
  return `${translate(name)} · Inkra`;
}
