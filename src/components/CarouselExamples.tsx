import { useState } from 'react';
import { Button, Card, Carousel, PencilSurface, PencilText, Switch } from '@inkra/react';
import type { CarouselVisibleItems } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './CarouselExamples.css';

const projects = [
  { id: 'notes', title: '随手笔记', detail: '整理散落的想法，让下一步保持清楚。', action: '打开笔记' },
  { id: 'palette', title: '配色草图', detail: '比较纸面、墨色和彩铅颜料的真实组合。', action: '查看色板' },
  { id: 'review', title: '评审清单', detail: '在交付前检查语义、键盘和窄屏布局。', action: '开始评审' },
  { id: 'archive', title: '灵感归档', detail: '保留已经验证的方案和仍待探索的问题。', action: '浏览归档' },
  { id: 'share', title: '分享草稿', detail: '把当前版本交给协作者继续完善。', action: '分享' },
];

function ProjectCard({ project }: { project: typeof projects[number] }) {
  const { t } = useLocale();
  return <Card.Root className="carousel-examples__card" divided={false}>
    <Card.Content className="carousel-examples__card-content">
      <Card.Title as="h3">{t(project.title)}</Card.Title>
      <Card.Description>{t(project.detail)}</Card.Description>
      <Button variant="outline" onClick={() => undefined}>{t(project.action)}</Button>
    </Card.Content>
  </Card.Root>;
}

export function CarouselExamples() {
  const { locale } = useLocale();
  const text = (chinese: string, english: string) => locale === 'en' ? english : chinese;
  const labels = {
    previous: text('上一组', 'Previous items'), next: text('下一组', 'Next items'),
    pause: text('暂停自动播放', 'Pause autoplay'), play: text('开始自动播放', 'Start autoplay'),
    pages: text('轮播分页', 'Carousel pages'), empty: text('暂无项目', 'No projects'),
    page: (index: number, count: number) => text(`转到第 ${index} 页，共 ${count} 页`, `Go to page ${index} of ${count}`),
    slide: (index: number, count: number) => text(`第 ${index} 项，共 ${count} 项`, `Item ${index} of ${count}`),
    status: (index: number, count: number) => text(`当前第 ${index} 项，共 ${count} 项`, `Current item ${index} of ${count}`),
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controlled, setControlled] = useState(true);
  const [loop, setLoop] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [density, setDensity] = useState<'adaptive' | 'single' | 'pair'>('adaptive');
  const visibleItems: number | CarouselVisibleItems = density === 'adaptive'
    ? { base: 1, sm: 2, md: 3 }
    : density === 'pair' ? 2 : 1;
  const indexProps = controlled ? { currentIndex, onCurrentIndexChange: setCurrentIndex } : { defaultIndex: 0 };
  const code = `<Carousel
  aria-label="${text('创作项目', 'Creative projects')}"
  visibleItems={${density === 'adaptive' ? '{ base: 1, sm: 2, md: 3 }' : density === 'pair' ? '2' : '1'}}
  dir="${direction}"
  loop={${loop}}${autoplay ? '\n  autoplay={{ delay: 5000, pauseOnHover: true, pauseOnFocus: true }}' : ''}${controlled ? `\n  currentIndex={${currentIndex}}\n  onCurrentIndexChange={setCurrentIndex}` : ''}
>
  {projects.map(project => <ProjectCard key={project.id} project={project} />)}
</Carousel>`;

  return <div className="carousel-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('布局', 'Layout'), content: <>
        <DocsSelect label={text('可见项', 'Visible items')} value={density} onValueChange={value => setDensity(value as typeof density)} options={[
          ['adaptive', text('自适应', 'Adaptive')],
          ['single', text('单项', 'One item')],
          ['pair', text('两项', 'Two items')],
        ]} />
        <DocsSelect label={text('阅读方向', 'Reading direction')} value={direction} onValueChange={value => setDirection(value as typeof direction)} options={[
          ['ltr', 'LTR'], ['rtl', 'RTL'],
        ]} />
      </> },
      { label: text('交互', 'Interaction'), content: <>
        <Switch label={text('受控当前项', 'Controlled index')} checked={controlled} onCheckedChange={setControlled} />
        <Switch label={text('循环浏览', 'Loop navigation')} checked={loop} onCheckedChange={setLoop} />
        <Switch label={text('自动播放', 'Autoplay')} checked={autoplay} onCheckedChange={setAutoplay} />
      </> },
    ]} />}>
      <div className="carousel-examples__frame" dir={direction}>
        <Carousel
          {...indexProps}
          aria-label={text('创作项目', 'Creative projects')}
          autoplay={autoplay ? { delay: 5000, pauseOnFocus: true, pauseOnHover: true } : false}
          dir={direction}
          labels={labels}
          loop={loop}
          visibleItems={visibleItems}
        >
          {projects.map(project => <ProjectCard key={project.id} project={project} />)}
        </Carousel>
      </div>
    </ComponentPlayground>

    <ComponentExample title={text('图片与交互内容', 'Images and interactive content')} code={`<Carousel aria-label="${text('主题预览', 'Theme previews')}" visibleItems={{ base: 1, sm: 2 }}>
  <PencilSurface as="figure" variant="paper" data-inkra-theme="light"><img src="/favicon.png" alt="${text('浅色 Inkra 标志', 'Light Inkra mark')}" /></PencilSurface>
  <PencilSurface as="figure" variant="paper" data-inkra-theme="dark"><img src="/favicon-dark.png" alt="${text('深色 Inkra 标志', 'Dark Inkra mark')}" /></PencilSurface>
</Carousel>`}>
      <div className="carousel-examples__frame carousel-examples__frame--images">
        <Carousel aria-label={text('主题预览', 'Theme previews')} labels={labels} visibleItems={{ base: 1, sm: 2 }}>
          <PencilSurface as="figure" variant="paper" data-inkra-theme="light" className="carousel-examples__image-slide">
            <img src="/favicon.png" alt={text('浅色 Inkra 标志', 'Light Inkra mark')} />
            <figcaption><PencilText>{text('浅色纸面', 'Light paper')}</PencilText><Button variant="ghost">{text('查看细节', 'View details')}</Button></figcaption>
          </PencilSurface>
          <PencilSurface as="figure" variant="paper" data-inkra-theme="dark" className="carousel-examples__image-slide">
            <img src="/favicon-dark.png" alt={text('深色 Inkra 标志', 'Dark Inkra mark')} />
            <figcaption><PencilText>{text('深色纸面', 'Dark paper')}</PencilText><Button variant="ghost">{text('查看细节', 'View details')}</Button></figcaption>
          </PencilSurface>
          <PencilSurface as="figure" variant="paper" className="carousel-examples__image-slide">
            <img src="/favicon.png" alt={text('小尺寸 Inkra 标志', 'Compact Inkra mark')} />
            <figcaption><PencilText>{text('紧凑预览', 'Compact preview')}</PencilText><Button variant="ghost">{text('查看细节', 'View details')}</Button></figcaption>
          </PencilSurface>
        </Carousel>
      </div>
    </ComponentExample>

    <ComponentExample title={text('空状态与单项', 'Empty and single item')} code={`<Carousel emptyState={<Empty />}>{items}</Carousel>`}>
      <div className="carousel-examples__states">
        <Carousel aria-label={text('空项目', 'Empty projects')} labels={labels} emptyState={<PencilText>{text('还没有可浏览的项目。', 'There are no projects to browse yet.')}</PencilText>} />
        <Carousel aria-label={text('唯一项目', 'Only project')} labels={labels}><ProjectCard project={projects[0]} /></Carousel>
      </div>
    </ComponentExample>
  </div>;
}
