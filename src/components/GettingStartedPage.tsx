import { useEffect, useState } from 'react';
import { Button, Markdown } from '@inkra/react';
import { PencilText, useLocale } from '../i18n';
import type { RoutePath } from '../routes';
import { PageHeading } from './PageHeading';
import { skillOnboardingMessages } from './skillOnboardingMessages';
import './GettingStartedPage.css';

export function GettingStartedPage({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  const { locale } = useLocale();
  const copy = skillOnboardingMessages[locale];
  const guideUrl = new URL('/start.md', typeof window === 'undefined' ? 'https://inkrajs.github.io' : window.location.origin).href;
  const request = copy.prompt.replace('{guideUrl}', guideUrl);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => setStatus('idle'), [request]);
  async function copyRequest() {
    try { await navigator.clipboard.writeText(request); setStatus('copied'); }
    catch { setStatus('failed'); }
  }
  const onboarding = [copy.introduction, `\`\`\`markdown\n${request}\n\`\`\``].join('\n\n');
  const resources = `${copy.followUp}\n\n[${copy.aiGuide}](/docs/ai-guide) · [${copy.manual}](/docs/installation)`;
  return (
    <article className="documentation">
      <PageHeading title="快速开始" description={copy.description} />
      <section className="content-section getting-started-content getting-started-skill" aria-labelledby="getting-started-skill-title">
        <PencilText as="h2" id="getting-started-skill-title" seed="skill-start-heading">{copy.heading}</PencilText>
        <Markdown className="getting-started-skill__markdown" labels={{ copy: copy.copy, copied: copy.copied, copyFailed: copy.copyFailed }}>{onboarding}</Markdown>
        <Button fullWidth className="getting-started-skill__copy" variant="outline" onClick={() => void copyRequest()}>{status === 'copied' ? copy.copied : copy.copy}</Button>
        <span className="sr-only" role="status">{status === 'copied' ? copy.copied : status === 'failed' ? copy.copyFailed : ''}</span>
        {status === 'failed' && <p role="status">{copy.copyFailed}</p>}
        <Markdown onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const href = event.target instanceof Element ? event.target.closest('a')?.getAttribute('href') : null;
          if (href === '/docs/ai-guide' || href === '/docs/installation') {
            event.preventDefault();
            onNavigate(href === '/docs/ai-guide' ? '/ai-guide' : '/installation');
          }
        }}>{resources}</Markdown>
      </section>
    </article>
  );
}
