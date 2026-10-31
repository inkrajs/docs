import { useLocale } from '../i18n';
import { GuidanceMarkdown } from './GuidanceMarkdown';
import { markdownAccessibility } from './MarkdownExamples';

export default function MarkdownGuidance() {
  const { locale } = useLocale();
  return <GuidanceMarkdown source={markdownAccessibility[locale === 'en' ? 'en' : 'zh']} />;
}
