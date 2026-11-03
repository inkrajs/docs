import { ButtonLink, PencilLine, PencilText } from '@inkra/react';
import { useLocale } from '../i18n';
import { PageHeading } from './PageHeading';
import './EcosystemPage.css';

export function EcosystemPage() {
  const { t } = useLocale();

  return <main id="main-content" className="ecosystem-page site-page" aria-labelledby="ecosystem-page-title">
    <PageHeading title="生态" titleId="ecosystem-page-title" showActions={false} description={{
      zh: '用 Inkra 做出的作品，以及可以带走的模板与资源。',
      en: 'Things made with Inkra, and templates and resources to make your own.',
    }} />

    <ul className="ecosystem-projects">
      <li>
        <article className="ecosystem-project" aria-labelledby="ecosystem-wand-defense-title">
          <PencilText as="p" className="ecosystem-project__category">{t('小游戏 · PWA', 'Game · PWA')}</PencilText>
          <PencilText as="h2" id="ecosystem-wand-defense-title" className="ecosystem-project__title">{t('无尽巫师', 'Endless Wizard')}</PencilText>
          <PencilText as="p" className="ecosystem-project__description">{t(
            '用 Inkra 搭起的手绘风格小游戏。把法术与奥术编排进法杖，在自动战斗中迎接一波波怪物；支持作为 PWA 安装，随时继续冒险。',
            'A hand-drawn game built with Inkra. Arrange spells and arcana in your wand, then face waves of monsters in automatic combat. Install it as a PWA to keep the adventure close at hand.',
          )}</PencilText>
          <div className="ecosystem-project__actions">
            <ButtonLink href="https://inkrajs.github.io/wand-defense/">{t('开始试玩', 'Play the game')}</ButtonLink>
            <ButtonLink href="https://github.com/inkrajs/wand-defense" variant="outline">{t('查看源码', 'View source')}</ButtonLink>
          </div>
        </article>
        <PencilLine className="ecosystem-project__rule" seed="ecosystem-wand-defense" />
      </li>
    </ul>
  </main>;
}
