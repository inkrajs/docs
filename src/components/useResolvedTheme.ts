import { useEffect, useState } from 'react';

type ThemeName = 'light' | 'dark';

export function useResolvedTheme(theme: ThemeName | 'auto'): ThemeName {
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return theme === 'auto' ? systemDark ? 'dark' : 'light' : theme;
}

