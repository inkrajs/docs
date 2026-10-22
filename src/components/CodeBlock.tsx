import { useMemo } from 'react';
import { PencilText } from '@inkra/react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import './CodeBlock.css';

Prism.manual = true;

type CodePart = { text: string; classes: string };

function flatten(tokens: (string | Prism.Token)[], classes = ''): CodePart[] {
  return tokens.flatMap(token => {
    if (typeof token === 'string') return [{ text: token, classes }];
    const names = [classes, `token-${token.type}`, ...[token.alias ?? []].flat().map(alias => `token-${alias}`)].filter(Boolean).join(' ');
    return flatten(Array.isArray(token.content) ? token.content : [token.content], names);
  });
}

export function CodeBlock({ code, language = 'tsx', className = '' }: { code: string; language?: 'tsx' | 'bash'; className?: string }) {
  const parts = useMemo(() => flatten(Prism.tokenize(code, Prism.languages[language])).flatMap(part =>
    part.text.split(/(\r?\n)/).filter(Boolean).map(text => ({ ...part, text }))), [code, language]);
  return <pre className={`docs-code ${className}`} data-language={language}><code>{parts.map((part, index) =>
    /\S/.test(part.text)
      ? <PencilText className={part.classes} key={index}>{part.text}</PencilText>
      : part.text
  )}</code></pre>;
}
