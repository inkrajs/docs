import type { foundationNames } from './componentRoutes';

export const originBlogPath = '/blog/from-travel-journal-to-inkra' as const;
export type Theme = 'auto' | 'light' | 'dark';
export type FoundationComponent = keyof typeof foundationNames;
export type RoutePath = '/' | '/blog' | typeof originBlogPath | '/ecosystem' | '/getting-started' | '/internationalization' | '/theming' | '/components/button' | '/design-standard' | '/usage-guide' | `/components/${FoundationComponent}`;
export type ButtonTab = 'preview' | 'api' | 'accessibility';
