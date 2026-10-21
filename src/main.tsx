import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'inkra/tokens.css';
import 'inkra/styles.css';
import { App } from './App';
import { LocaleProvider } from './i18n';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <LocaleProvider><App /></LocaleProvider>
  </StrictMode>,
);
