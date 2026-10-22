import { useEffect, useRef, useState } from 'react';
import { Button, Card, PencilText } from '@inkra/react';
import { __iconData as terminalIcon } from 'lucide-react/dist/esm/icons/terminal.mjs';
import { __iconData as codeIcon } from 'lucide-react/dist/esm/icons/code-xml.mjs';
import { __iconData as copyIcon } from 'lucide-react/dist/esm/icons/copy.mjs';
import { __iconData as checkIcon } from 'lucide-react/dist/esm/icons/check.mjs';
import { useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import { CodeBlock } from './CodeBlock';

export function CodeSample({ code, language = 'tsx', seed }: { code: string; language?: 'tsx' | 'bash'; seed?: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const label = t(status === 'copied' ? '已复制代码' : status === 'failed' ? '复制失败' : '复制代码');
  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    timer.current = setTimeout(() => setStatus('idle'), 2000);
  }
  return <Card.Root className="code-sample" seed={seed}>
    <Card.Header className="code-sample__header" align="center" action={
      <Button size="icon" variant="ghost" aria-label={label} data-tooltip={label} onClick={() => void copy()}>
        <DocsIcon data={status === 'copied' ? checkIcon : copyIcon} size={22} />
      </Button>
    }>
      <span className="code-sample__language">
        <DocsIcon data={language === 'bash' ? terminalIcon : codeIcon} size={22} />
        <PencilText>{language === 'bash' ? 'Bash' : 'TSX'}</PencilText>
      </span>
    </Card.Header>
    <Card.Content className="code-sample__body"><CodeBlock code={code} language={language} /></Card.Content>
    <span className="visually-hidden" role="status">{status === 'copied' ? t('示例代码已复制') : status === 'failed' ? t('复制失败，请手动选择代码') : ''}</span>
  </Card.Root>;
}
