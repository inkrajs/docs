import { PencilLine } from '@inkra/react';
import type { MouseEvent } from 'react';
import { __iconData as arrowLeftIcon } from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import { __iconData as arrowRightIcon } from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';
import './BlogPage.css';

export const originBlogPath = '/blog/from-travel-journal-to-inkra' as const;
type BlogPath = '/blog' | typeof originBlogPath;

type BlogPageProps = {
  article?: boolean;
  onNavigate: (path: BlogPath) => void;
};

function follow(event: MouseEvent<HTMLAnchorElement>, path: BlogPath, onNavigate: BlogPageProps['onNavigate']) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onNavigate(path);
}

function useBlogText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

function BackToBlog({ onNavigate }: Pick<BlogPageProps, 'onNavigate'>) {
  const text = useBlogText();
  return <a className="blog-back" href="/blog" onClick={event => follow(event, '/blog', onNavigate)}>
    <DocsIcon data={arrowLeftIcon} size={20} />
    <PencilText>{text('所有手记', 'All stories')}</PencilText>
  </a>;
}

export function BlogPage({ article = false, onNavigate }: BlogPageProps) {
  const text = useBlogText();
  const title = text('从旅行手账，到 Inkra', 'From a travel journal to Inkra');
  const description = text(
    '一个旅行规划网站里的笔触和文字，怎样慢慢长成了通用的手绘组件库。',
    'How pencil strokes and lettering from a travel planning website grew into a reusable component library.',
  );

  if (!article) return <main id="main-content" className="blog-page blog-index">
    <header className="blog-heading">
      <PencilText as="h1">{text('博客', 'Blog')}</PencilText>
      <PencilText as="p">{text('记下 Inkra 的来处，和一路做东西的过程。', 'Notes on where Inkra began, and the things we make along the way.')}</PencilText>
    </header>
    <PencilLine className="blog-rule" seed="blog-index-heading" />
    <ol className="blog-entries" aria-label={text('博客文章', 'Blog posts')}>
      <li>
        <article className="blog-entry">
          <a className="blog-entry__link" href={originBlogPath}
            aria-labelledby="blog-origin-title" aria-describedby="blog-origin-summary"
            onClick={event => follow(event, originBlogPath, onNavigate)}>
            <div className="blog-entry__picture">
              <img src="/images/blog/inkra-origin-cover.png" width={1672} height={941}
                alt={text('水彩插图：旅行手账里的地图、路线与逐渐展开的界面组件。', 'Watercolor illustration of a travel journal, a map and interface components unfolding from its pages.')}
                decoding="async" fetchPriority="high" />
            </div>
            <div className="blog-entry__copy">
              <div className="blog-meta"><PencilText>{text('项目手记', 'Project journal')}</PencilText><time dateTime="2026-10-30">2026.10.30</time></div>
              <PencilText as="h2" id="blog-origin-title" className="blog-entry__title">{title}</PencilText>
              <PencilText as="p" id="blog-origin-summary" className="blog-entry__summary">{description}</PencilText>
              <span className="blog-entry__read"><PencilText>{text('读这篇手记', 'Read the story')}</PencilText><DocsIcon data={arrowRightIcon} size={20} /></span>
            </div>
          </a>
        </article>
      </li>
    </ol>
    <PencilLine className="blog-rule" seed="blog-index-footer" />
    <PencilText as="p" className="blog-endnote">{text('慢慢写，也慢慢做。', 'A little writing. A little making.')}</PencilText>
  </main>;

  return <main id="main-content" className="blog-page blog-detail">
    <BackToBlog onNavigate={onNavigate} />
    <article className="blog-article" aria-labelledby="origin-article-title">
      <header className="blog-article__heading">
        <div className="blog-meta"><PencilText>{text('项目手记', 'Project journal')}</PencilText><time dateTime="2026-10-30">2026.10.30</time></div>
        <PencilText as="h1" id="origin-article-title">{title}</PencilText>
        <PencilText as="p" className="blog-article__intro">{description}</PencilText>
      </header>
      <figure className="blog-figure blog-figure--cover">
        <img src="/images/blog/inkra-origin-cover.png" width={1672} height={941}
          alt={text('水彩插图：摊开的旅行手账，手绘地图与基础界面组件。', 'Watercolor illustration of an open travel journal with a hand-drawn map and interface components.')}
          decoding="async" fetchPriority="high" />
        <PencilText as="figcaption">{text('水彩插图 · 从旅行手账里展开的一点想法。', 'Watercolor illustration · An idea unfolding from a travel journal.')}</PencilText>
      </figure>
      <div className="blog-article__body">
        <section aria-labelledby="origin-travel-title">
          <PencilText as="h2" id="origin-travel-title">{text('最开始，是一个旅行规划网站', 'It began with a travel planning website')}</PencilText>
          <PencilText as="p">{text('最开始，我在做一个旅行规划网站。我想让它有手绘旅行手账的感觉，文字和线条放在一起，能让人觉得它们属于同一本手账。', 'At first, I was building a travel planning website. I wanted it to feel like a hand-drawn travel journal, with lettering and lines that looked as though they belonged on the same page.')}</PencilText>
          <PencilText as="p">{text('为此，我找过一些现成的组件库和绘图库。但看下来，总觉得还差一点。很多方案只是让线条有些抖动，文字仍然是普通字体，整体没有我想要的铅笔笔触和手账感。', 'I looked at existing component and drawing libraries, but the ones I found never quite felt right. Many gave the lines a little wobble while leaving the lettering as an ordinary font. I was still missing the pencil texture and journal-like feeling I had in mind.')}</PencilText>
          <PencilText as="p">{text('后来，就决定自己试着做。一开始这些尝试都发生在旅行网站里，跟着页面上的实际需要，一点点调整。', 'So I decided to try making it myself. Those early experiments happened inside the travel website, taking shape around what the pages needed.')}</PencilText>
        </section>
        <figure className="blog-figure">
          <img src="/images/blog/travel-map.png" width={1218} height={853} loading="lazy" decoding="async"
            alt={text('旅行网站的真实界面截图：手绘的新西兰地图、地点和路线。', 'Actual screenshot of the travel website: a hand-drawn New Zealand map with places and routes.')} />
          <PencilText as="figcaption">{text('旅行网站的真实界面截图 · Inkra 的起点。', 'Actual travel website screenshot · Where Inkra started.')}</PencilText>
        </figure>
        <section aria-labelledby="origin-lettering-title">
          <PencilText as="h2" id="origin-lettering-title">{text('文字，比想象中花时间', 'The lettering took longer than I expected')}</PencilText>
          <PencilText as="p">{text('真正反复打磨最久的，是文字效果。笔触要有，文字也要看得清楚。只有线条像手绘，文字却没有相同的质感，整个页面还是很难有手账的感觉。', 'The lettering was the part I spent the most time refining. It needed a pencil texture while remaining clear and readable. Hand-drawn lines alone could not give the whole page that journal-like feeling.')}</PencilText>
          <PencilText as="p">{text('同时，输入、选择和复制这些日常操作，也都应该照常工作。输入框里能正常打字，读到一段文字时能选中、能复制，这些要求要和笔触效果一起成立。', 'Typing, selecting and copying also needed to work as usual. I wanted people to be able to type into a field, select a passage and copy it, with the pencil effect still feeling like part of the interface.')}</PencilText>
          <PencilText as="p">{text('要在笔触、清晰度和正常使用之间找到合适的状态，需要反复来回调。这块花的时间，比最初想象的长。', 'Finding a balance between texture, legibility and everyday use took a lot of back-and-forth. I stayed with this part longer than I had expected.')}</PencilText>
        </section>
        <figure className="blog-figure blog-figure--illustration">
          <img src="/images/blog/inkra-origin-lettering.png" width={1536} height={1024} loading="lazy" decoding="async"
            alt={text('水彩插图：铅笔、文字笔迹与手写便签。', 'Watercolor illustration of pencils, lettering and handwritten notes.')} />
          <PencilText as="figcaption">{text('水彩插图 · 留住笔触，也让文字好好工作。', 'Watercolor illustration · Keeping the texture, and keeping the words usable.')}</PencilText>
        </figure>
        <section aria-labelledby="origin-components-title">
          <PencilText as="h2" id="origin-components-title">{text('慢慢抽出来，也慢慢长大', 'Gradually becoming a library')}</PencilText>
          <PencilText as="p">{text('做着做着，我开始觉得，这些效果也适合用在旅行网站以外的项目里。最先让我产生这个想法的，就是笔触和文字效果。', 'As I worked, I began to see how these effects could fit projects beyond the travel website. The pencil strokes and lettering were what first made me think about that possibility.')}</PencilText>
          <PencilText as="p">{text('我就想，把它们和基础组件一起抽出来，以后做其他东西时，也能直接用上这套风格。一开始，我是边做旅行网站，边把组件整理出来。', 'I wanted to extract those effects alongside the basic components, so that I could use this style in other projects too. At first, I kept building the travel website and extracting components alongside it.')}</PencilText>
          <PencilText as="p">{text('后来组件越来越多，投入的精力也慢慢转向了 Inkra。它就这样从一个具体的旅行规划网站里，逐渐长成了一个通用的手绘风格组件库。', 'As the number of components grew, more of my attention gradually moved to Inkra. That is how a component library grew out of one particular travel planning website.')}</PencilText>
        </section>
      </div>
      <footer className="blog-article__footer">
        <PencilLine className="blog-rule" seed="blog-article-footer" />
        <BackToBlog onNavigate={onNavigate} />
      </footer>
    </article>
  </main>;
}
