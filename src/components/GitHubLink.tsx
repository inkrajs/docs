import { ButtonLink, PencilIcon, Tooltip } from '@inkra/react';
import { useLocale } from '../i18n';

// Feather v4.29.2 GitHub outline; attribution is in THIRD_PARTY_NOTICES.md.
const githubPaths = [{
  d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
}];

export function GitHubLink() {
  const { t } = useLocale();
  const label = t('GitHub 仓库（新标签页打开）');
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <ButtonLink
            aria-label={label}
            className="header-github"
            href="https://github.com/inkrajs/inkra"
            rel="noopener noreferrer"
            size="icon"
            target="_blank"
            variant="outline"
          >
            <PencilIcon paths={githubPaths} seed="header-github" size={30} sourceSize={24} decorative />
          </ButtonLink>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom" align="end">{label}</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
