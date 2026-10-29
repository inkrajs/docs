import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, DependencyGraph, Flip, PencilSurface, type DependencyGraphNode, type DependencyGraphEdge } from '@inkra/react';
import { __iconData as bookIcon } from 'lucide-react/dist/esm/icons/book-open.mjs';
import { __iconData as ideaIcon } from 'lucide-react/dist/esm/icons/lightbulb.mjs';
import { __iconData as craftIcon } from 'lucide-react/dist/esm/icons/wrench.mjs';
import { __iconData as designIcon } from 'lucide-react/dist/esm/icons/palette.mjs';
import { __iconData as launchIcon } from 'lucide-react/dist/esm/icons/rocket.mjs';
import { PencilText, useLocale } from '../i18n';
import { ComponentPlayground } from './ComponentPlayground';
import { ComponentExample } from './ComponentExample';
import { DocsSelect } from './DocsSelect';
import { DocsIcon, iconPaths, type LucideIconData } from './DocsIcon';
import { iconFilledPaths } from './iconFilledPaths';
import './DependencyGraphExamples.css';
import { DependencyGraphToolbarExample } from './DependencyGraphToolbarExample';

type Direction = 'LR' | 'RL' | 'TB' | 'BT';
function pencilIconCode(icon: LucideIconData, size: number) {
  return `<PencilIcon decorative size={${size}} paths={${JSON.stringify(iconPaths(icon))}} filledPaths={${JSON.stringify(iconFilledPaths(icon))}} />`;
}
const chainEdges: DependencyGraphEdge[] = [{ id: 'a-b', source: 'a', target: 'b' }, { id: 'b-c', source: 'b', target: 'c' }];
const branchEdges: DependencyGraphEdge[] = [
  { id: 'base-left', source: 'base', target: 'left' }, { id: 'base-right', source: 'base', target: 'right' },
  { id: 'left-final', source: 'left', target: 'final' }, { id: 'right-final', source: 'right', target: 'final' },
];
const learningEdges: DependencyGraphEdge[] = [
  { id: 'base-observe', source: 'base', target: 'observe' },
  { id: 'base-practice', source: 'base', target: 'practice' },
  { id: 'base-theory', source: 'base', target: 'theory' },
  { id: 'observe-analysis', source: 'observe', target: 'analysis' },
  { id: 'practice-analysis', source: 'practice', target: 'analysis' },
  { id: 'practice-build', source: 'practice', target: 'build' },
  { id: 'theory-build', source: 'theory', target: 'build' },
  { id: 'observe-design', source: 'observe', target: 'design' },
  { id: 'theory-design', source: 'theory', target: 'design' },
  { id: 'analysis-create', source: 'analysis', target: 'create' },
  { id: 'build-create', source: 'build', target: 'create' },
  { id: 'design-create', source: 'design', target: 'create' },
  { id: 'build-share', source: 'build', target: 'share' },
  { id: 'design-share', source: 'design', target: 'share' },
];
const basicCode = `import { DependencyGraph } from '@inkra/react';

const nodes = [
  { id: 'a', label: 'Foundation' },
  { id: 'b', label: 'Practice' },
  { id: 'c', label: 'Mastery' },
];
const edges = [
  { id: 'a-b', source: 'a', target: 'b' },
  { id: 'b-c', source: 'b', target: 'c' },
];

<DependencyGraph.Root nodes={nodes} edges={edges} />`;

function LearningTree({ technology = false }: { technology?: boolean }) {
  const { t } = useLocale();
  const [completed, setCompleted] = useState<string[]>(['base']);
  const [requirement, setRequirement] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const catalog = useMemo(() => technology ? [
    { id: 'base', label: t('基础研究', 'Foundational research'), description: t('已经掌握', 'Already researched') },
    { id: 'observe', label: t('能源', 'Energy'), description: t('研究成本：20', 'Research cost: 20') },
    { id: 'practice', label: t('材料', 'Materials'), description: t('研究成本：30', 'Research cost: 30') },
    { id: 'theory', label: t('计算', 'Computing'), description: t('研究成本：25', 'Research cost: 25') },
    { id: 'analysis', label: t('储能', 'Energy storage'), description: t('研究成本：40', 'Research cost: 40') },
    { id: 'build', label: t('机械', 'Machinery'), description: t('研究成本：45', 'Research cost: 45') },
    { id: 'design', label: t('控制系统', 'Control systems'), description: t('研究成本：50', 'Research cost: 50') },
    { id: 'create', label: t('自动化', 'Automation'), description: t('研究成本：80', 'Research cost: 80') },
    { id: 'share', label: t('智能网络', 'Smart networks'), description: t('研究成本：70', 'Research cost: 70') },
  ] : [
    { id: 'base', label: t('基础技能', 'Fundamentals'), description: t('已经掌握', 'Already learned') },
    { id: 'observe', label: t('观察', 'Observation'), description: t('识别问题与机会', 'Identify problems and opportunities') },
    { id: 'practice', label: t('实践', 'Practice'), description: t('积累动手经验', 'Gain hands-on experience') },
    { id: 'theory', label: t('理论', 'Theory'), description: t('建立知识框架', 'Build a knowledge framework') },
    { id: 'analysis', label: t('分析', 'Analysis'), description: t('观察与实践汇合', 'Combine observation and practice') },
    { id: 'build', label: t('实现', 'Implementation'), description: t('将理论变成作品', 'Put theory into practice') },
    { id: 'design', label: t('设计', 'Design'), description: t('用知识组织想法', 'Shape ideas with knowledge') },
    { id: 'create', label: t('独立创作', 'Independent creation'), description: t('整合三条能力分支', 'Combine three skill branches') },
    { id: 'share', label: t('协作分享', 'Collaboration'), description: t('把作品带给团队', 'Bring your work to the team') },
  ], [technology, t]);
  const nodes = catalog.map(node => {
    const prerequisites = learningEdges.filter(edge => edge.target === node.id).map(edge => edge.source);
    const ready = !prerequisites.length || (requirement === 'any' ? prerequisites.some(id => completed.includes(id)) : prerequisites.every(id => completed.includes(id)));
    return { ...node, status: completed.includes(node.id) ? 'completed' as const : ready ? 'available' as const : 'locked' as const };
  });
  const activate = (node: DependencyGraphNode) => {
    if (node.status === 'locked') { setMessage(t('先完成前置节点，再继续。', 'Complete the prerequisites first.')); return; }
    if (node.status === 'completed') { setMessage(t('这个节点已经完成。', 'This node is already complete.')); return; }
    setCompleted(previous => [...previous, node.id]);
    setMessage(`${node.label} · ${t('已完成', 'Completed')}`);
  };
  const code = `import { useState } from 'react';
import { DependencyGraph, type DependencyGraphNode } from '@inkra/react';

const catalog = ${JSON.stringify(catalog, null, 2)};
const edges = ${JSON.stringify(learningEdges, null, 2)};

export function LearningTreeDemo() {
  const [completed, setCompleted] = useState<string[]>(['base']);
  const [selected, setSelected] = useState<string | null>(null);
  // Unlocking is application logic; the component displays supplied statuses.
  const nodes: DependencyGraphNode[] = catalog.map(node => {
    const prerequisites = edges.filter(edge => edge.target === node.id)
      .map(edge => edge.source);
    const ready = !prerequisites.length || prerequisites.${requirement === 'any' ? 'some' : 'every'}(id => completed.includes(id));
    return { ...node, status: completed.includes(node.id)
      ? 'completed' : ready ? 'available' : 'locked' };
  });
  return <DependencyGraph.Root nodes={nodes} edges={edges}
    style={{ height: 480 }} nodeWidth={176} rankGap={64}
    selectedId={selected} onSelectedIdChange={setSelected}
    onNodeActivate={node => {
      if (node.status === 'available') setCompleted(previous => [...previous, node.id]);
    }} />;
}`;
  return <ComponentExample id={technology ? 'dependency-graph-technology' : 'dependency-graph-skills'} title={technology ? t('科技树', 'Technology tree') : t('技能树与前置条件', 'Skill tree and prerequisites')} code={code}>
    <div className="dependency-graph-examples__tools">
      {!technology && <DocsSelect label={t('前置条件', 'Prerequisites')} value={requirement} onValueChange={setRequirement} options={[
        ['all', t('全部完成', 'All required')], ['any', t('任一完成', 'Any required')],
      ]} />}
      <Button variant="outline" onClick={() => { setCompleted(['base']); setSelected(null); setMessage(''); }}>{t('重置', 'Reset')}</Button>
    </div>
    <div className="dependency-graph-examples__frame"><DependencyGraph.Root aria-label={technology ? t('科技依赖', 'Technology dependencies') : t('技能依赖', 'Skill dependencies')} nodes={nodes} edges={learningEdges}
      nodeWidth={176} rankGap={64}
      selectedId={selected} onSelectedIdChange={setSelected} onNodeActivate={activate} /></div>
    <PencilText as="p">{technology ? t('9 个节点、4 个层级，能源、材料和计算分支在后续研究中交叉汇合。点击可研究节点继续；资源扣除由业务处理。', 'Nine nodes across four ranks. Energy, materials and computing feed shared research paths. Activate available nodes to continue; your application handles resource costs.') : t('9 个节点、4 个层级，三条学习分支共享前置并汇合到创作与协作。切换全部或任一前置，点击可解锁节点观察路径变化。', 'Nine nodes across four ranks. Three learning branches share prerequisites and join into creation and collaboration. Switch all/any prerequisites and activate available nodes to explore the paths.')}</PencilText>
    <output aria-live="polite">{message || t('选择一个节点查看或继续。', 'Select a node to inspect or continue.')}</output>
  </ComponentExample>;
}


function IconGraphExample() {
  const { t } = useLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const catalog = [
    { id: 'learn', label: t('学习', 'Learning'), icon: bookIcon },
    { id: 'idea', label: t('构思', 'Ideas'), icon: ideaIcon },
    { id: 'craft', label: t('动手', 'Crafting'), icon: craftIcon },
    { id: 'design', label: t('设计', 'Design'), icon: designIcon },
    { id: 'launch', label: t('发布', 'Launch'), icon: launchIcon },
  ];
  const edges: DependencyGraphEdge[] = [
    { id: 'learn-idea', source: 'learn', target: 'idea' },
    { id: 'learn-craft', source: 'learn', target: 'craft' },
    { id: 'idea-design', source: 'idea', target: 'design' },
    { id: 'craft-design', source: 'craft', target: 'design' },
    { id: 'design-launch', source: 'design', target: 'launch' },
  ];
  const nodes = catalog.map(node => ({ ...node, icon: <DocsIcon data={node.icon} size={32} /> }));
  const current = catalog.find(node => node.id === selected);
  const code = `import { useState } from 'react';
import { DependencyGraph, PencilIcon } from '@inkra/react';

const nodes = [
${catalog.map(node => `  { id: ${JSON.stringify(node.id)}, label: ${JSON.stringify(node.label)}, icon: ${pencilIconCode(node.icon, 32)} }`).join(',\n')}
];
const edges = ${JSON.stringify(edges, null, 2)};
export function IconTree() {
  const [selected, setSelected] = useState<string | null>(null);
  return <>
    <DependencyGraph.Root nodes={nodes} edges={edges} nodeVariant="icon"
      nodeWidth={80} nodeHeight={80} rankGap={72}
      selectedId={selected} onSelectedIdChange={setSelected} />
    <output>{nodes.find(node => node.id === selected)?.label}</output>
  </>;
}`;
  return <ComponentExample id="dependency-graph-icon-nodes" title={t('纯图标节点', 'Icon-only nodes')} code={code}>
    <div className="dependency-graph-examples__frame"><DependencyGraph.Root nodes={nodes} edges={edges} nodeVariant="icon"
      nodeWidth={80} nodeHeight={80} rankGap={72} selectedId={selected} onSelectedIdChange={setSelected}
      aria-label={t('纯图标依赖图', 'Icon-only dependency graph')} /></div>
    <output aria-live="polite">{current ? `${t('当前选择', 'Selected')}: ${current.label}` : t('选择一个图标，在画布外展示选中信息。', 'Select an icon to show its label outside the graph.')}</output>
  </ComponentExample>;
}

function CardSlotsExample() {
  const { t } = useLocale();
  const [levels, setLevels] = useState<Record<string, number>>({ a: 1, b: 1, c: 1 });
  const [message, setMessage] = useState('');
  const catalog = [
    { id: 'a', label: t('知识整理', 'Knowledge'), description: t('把零散笔记整理成结构。', 'Organize scattered notes.'), icon: bookIcon },
    { id: 'b', label: t('方案构思', 'Ideas'), description: t('为一个问题准备多个方案。', 'Explore several solutions.'), icon: ideaIcon },
    { id: 'c', label: t('作品发布', 'Publishing'), description: t('让想法成为可以使用的作品。', 'Turn an idea into usable work.'), icon: launchIcon },
  ];
  const nodes = catalog.map(node => ({
    id: node.id, label: node.label,
    icon: <DocsIcon data={node.icon} size={22} />,
    actions: <Button size="sm" variant="ghost" aria-label={`${node.label} · ${t('查看等级', 'View level')}`}
      onClick={() => setMessage(`${node.label} · Lv.${levels[node.id]}`)}><Badge size="sm" variant="accent">{`Lv.${levels[node.id]}`}</Badge></Button>,
    content: <PencilText>{node.description}</PencilText>,
    footer: <Button size="sm" variant="outline" onClick={() => setLevels(previous => ({ ...previous, [node.id]: previous[node.id] + 1 }))}>{t('升级', 'Upgrade')}</Button>,
  }));
  const code = `import { useState } from 'react';
import { Badge, Button, DependencyGraph, PencilIcon, PencilText } from '@inkra/react';

const catalog = [
${catalog.map(({ icon, ...node }) => `  { ...${JSON.stringify(node)}, icon: ${pencilIconCode(icon, 22)} }`).join(',\n')}
];
const edges = ${JSON.stringify(chainEdges, null, 2)};
export function CardTree() {
  const [levels, setLevels] = useState<Record<string, number>>({ a: 1, b: 1, c: 1 });
  const [message, setMessage] = useState('');
  const nodes = catalog.map(node => ({
    id: node.id, label: node.label, icon: node.icon,
    actions: <Button size="sm" variant="ghost"
      onClick={() => setMessage(node.label + ' · Lv.' + levels[node.id])}>
      <Badge size="sm" variant="accent">{'Lv.' + levels[node.id]}</Badge>
    </Button>,
    content: <PencilText>{node.description}</PencilText>,
    footer: <Button size="sm" variant="outline"
      onClick={() => setLevels(previous => ({ ...previous, [node.id]: previous[node.id] + 1 }))}>
      ${t('升级', 'Upgrade')}
    </Button>,
  }));
  return <>
    <DependencyGraph.Root nodes={nodes} edges={edges} nodeWidth={260} nodeHeight={180} />
    <output>{message}</output>
  </>;
}`;
  return <ComponentExample id="dependency-graph-custom-nodes" title={t('自定义卡片区域', 'Custom card regions')} code={code}>
    <div className="dependency-graph-examples__frame"><DependencyGraph.Root nodes={nodes} edges={chainEdges} nodeWidth={260} nodeHeight={180}
      aria-label={t('带操作的依赖卡片', 'Dependency cards with actions')} /></div>
    <PencilText as="p">{t('图标和标题在左上，等级操作在右上，正文和底部按钮各自保留布局。按钮可以独立点击和键盘操作。', 'The icon and title sit at the upper left, level actions at the upper right, followed by content and footer actions. Buttons remain independently clickable and keyboard accessible.')}</PencilText>
    <output aria-live="polite">{message || t('点击右上等级，或使用左下升级按钮。', 'Activate a level badge or use the upgrade button at the lower left.')}</output>
  </ComponentExample>;
}

function FlipGraphExample() {
  const { t } = useLocale();
  const catalog = [
    { id: 'a', label: t('观察', 'Observation'), description: t('从细节中发现值得解决的问题。', 'Find useful problems in everyday details.'), icon: bookIcon },
    { id: 'b', label: t('构思', 'Ideation'), description: t('连接已有知识，提出新的可能。', 'Connect what you know to new possibilities.'), icon: ideaIcon },
    { id: 'c', label: t('创造', 'Creation'), description: t('完成作品，再从反馈中继续迭代。', 'Build, gather feedback and iterate.'), icon: launchIcon },
  ];
  const [details, setDetails] = useState<Record<string, 'intro' | 'xp' | undefined>>({});
  const [progress, setProgress] = useState<Record<string, { level: number; xp: number }>>({
    a: { level: 1, xp: 40 }, b: { level: 1, xp: 20 }, c: { level: 1, xp: 0 },
  });
  const upgrade = (id: string) => setProgress(previous => ({
    ...previous, [id]: { level: previous[id].level + 1, xp: previous[id].xp + 50 },
  }));
  const nodes = catalog.map(({ icon, ...node }) => ({ ...node, icon: <DocsIcon data={icon} size={20} /> }));
  const code = `import { useState } from 'react';
import { Badge, Button, DependencyGraph, Flip, PencilIcon, PencilText } from '@inkra/react';

const nodes = [
${catalog.map(({ icon, ...node }) => `  { ...${JSON.stringify(node)}, icon: ${pencilIconCode(icon, 20)} }`).join(',\n')}
];
const edges = ${JSON.stringify(chainEdges, null, 2)};

export function FlipSkillTree() {
  const [details, setDetails] = useState<Record<string, 'intro' | 'xp' | undefined>>({});
  const [progress, setProgress] = useState<Record<string, { level: number; xp: number }>>({
    a: { level: 1, xp: 40 }, b: { level: 1, xp: 20 }, c: { level: 1, xp: 0 },
  });
  const upgrade = (id: string) => setProgress(previous => ({
    ...previous, [id]: { level: previous[id].level + 1, xp: previous[id].xp + 50 },
  }));
  return <DependencyGraph.Root nodes={nodes} edges={edges} nodeWidth={260} nodeHeight={180}
    renderNode={(node, { activate, renderSurface }) => {
      const mode = details[node.id];
      const current = progress[node.id];
      const show = (next: 'intro' | 'xp' | undefined) => {
        activate(); setDetails(previous => ({ ...previous, [node.id]: next }));
      };
      const upgradeButton = <Button size="sm" variant="outline" onClick={() => upgrade(node.id)}>${t('升级', 'Upgrade')}</Button>;
      return <Flip style={{ width: '100%', height: '100%' }} flipped={Boolean(mode)}
        onFlippedChange={flipped => { if (!flipped) show(undefined); }}
        front={renderSurface(<div className="skill-face">
          <header>
            <Button size="sm" variant="ghost" startIcon={node.icon} onClick={() => show('intro')}>{node.label}</Button>
            <Button size="sm" variant="ghost" onClick={() => show('xp')}><Badge>{'Lv.' + current.level}</Badge></Button>
          </header>
          <PencilText>${t('点标题查看介绍，点等级查看经验。', 'Title: introduction. Level: experience.')}</PencilText>
          <footer>{upgradeButton}</footer>
        </div>)}
        back={renderSurface(<div className="skill-face">
          <header><PencilText>{mode === 'xp' ? ${JSON.stringify(t('累计经验', 'Total experience'))} : ${JSON.stringify(t('技能介绍', 'Skill introduction'))}}</PencilText>
            <Button size="sm" variant="ghost" onClick={() => show(undefined)}>${t('返回', 'Back')}</Button></header>
          {mode === 'xp' ? <PencilText>{current.xp + ' XP · Lv.' + current.level}</PencilText>
            : <PencilText>{String(node.description)}</PencilText>}
          <footer>{upgradeButton}</footer>
        </div>)} />;
    }} />;
}
// Wrap both faces with renderSurface so their paper and border rotate together.
// Give Flip, its scene and both faces the same bounded size:
// .inkra-flip, .inkra-flip__scene, .inkra-flip__face { width:100%; height:100%; }
// .skill-face { height:100%; box-sizing:border-box; padding:12px; display:grid; gap:8px; grid-template-rows:44px 1fr 44px; }
// .skill-face header { display:flex; justify-content:space-between; }
// .skill-face footer { justify-self:start; }`;
  return <ComponentExample id="dependency-graph-flip-cards" title={t('组合 Flip 的技能卡片', 'Skill cards with Flip')} code={code}>
    <div className="dependency-graph-examples__frame"><DependencyGraph.Root nodes={nodes} edges={chainEdges} nodeWidth={260} nodeHeight={180}
      aria-label={t('可翻面的技能依赖图', 'Flippable skill dependency graph')}
      renderNode={(node, { activate, renderSurface }) => {
        const mode = details[node.id];
        const current = progress[node.id];
        const show = (next: 'intro' | 'xp' | undefined) => {
          activate(); setDetails(previous => ({ ...previous, [node.id]: next }));
        };
        const upgradeButton = <Button size="sm" variant="outline" onClick={() => upgrade(node.id)}>{t('升级', 'Upgrade')}</Button>;
        return <Flip className="dependency-graph-examples__flip" flipped={Boolean(mode)}
          onFlippedChange={flipped => { if (!flipped) show(undefined); }}
          front={renderSurface(<div className="dependency-graph-examples__skill-face">
            <header>
              <Button size="sm" variant="ghost" className="dependency-graph-examples__skill-title" startIcon={node.icon} onClick={() => show('intro')}>{node.label}</Button>
              <Button size="sm" variant="ghost" aria-label={`${node.label} · ${t('查看经验', 'View experience')}`} onClick={() => show('xp')}><Badge size="sm" variant="accent">{`Lv.${current.level}`}</Badge></Button>
            </header>
            <PencilText>{t('点标题查看介绍，点等级查看经验。', 'Title: introduction. Level: experience.')}</PencilText>
            <footer>{upgradeButton}</footer>
          </div>)}
          back={renderSurface(<div className="dependency-graph-examples__skill-face">
            <header><PencilText>{mode === 'xp' ? t('累计经验', 'Total experience') : t('技能介绍', 'Skill introduction')}</PencilText>
              <Button size="sm" variant="ghost" onClick={() => show(undefined)}>{t('返回', 'Back')}</Button></header>
            {mode === 'xp' ? <PencilText>{`${current.xp} XP · Lv.${current.level}`}</PencilText>
              : <PencilText>{String(node.description)}</PencilText>}
            <footer>{upgradeButton}</footer>
          </div>)} />;
      }} /></div>
    <PencilText as="p">{t('标题翻到介绍，右上等级徽章翻到经验，背面可返回。左下升级会提升 1 级并获得 50 XP；等级、经验和翻面状态由业务管理。', 'The title flips to an introduction; the upper-right level badge flips to experience. Return from the back. Upgrade at the lower left adds one level and 50 XP. Your application owns levels, experience and flip state.')}</PencilText>
  </ComponentExample>;
}

interface SynthesisItem { image: string; quantity: string }
function SynthesisGraphExample() {
  const { t } = useLocale();
  const [selected, setSelected] = useState<string | null>('potion');
  const nodes = useMemo<DependencyGraphNode<SynthesisItem>[]>(() => [
    { id: 'herb', label: t('林间草药', 'Forest herbs'), data: { image: '/images/synthesis/herb.svg', quantity: '× 3' },
      sourceAnchor: { x: .76, y: .42, position: 'right' } },
    { id: 'water', label: t('清泉水', 'Spring water'), data: { image: '/images/synthesis/water.svg', quantity: '× 2' },
      sourceAnchor: { x: .70, y: .45, position: 'right' } },
    { id: 'crystal', label: t('辉光晶矿', 'Luminous crystal'), data: { image: '/images/synthesis/crystal.svg', quantity: '× 2' },
      sourceAnchor: { x: .78, y: .45, position: 'right' } },
    { id: 'extract', label: t('草本提取液', 'Herbal extract'), data: { image: '/images/synthesis/extract.svg', quantity: '× 1' },
      targetAnchor: { x: .27, y: .46, position: 'left' }, sourceAnchor: { x: .73, y: .46, position: 'right' } },
    { id: 'powder', label: t('晶矿粉末', 'Crystal powder'), data: { image: '/images/synthesis/powder.svg', quantity: '× 1' },
      targetAnchor: { x: .25, y: .47, position: 'left' }, sourceAnchor: { x: .76, y: .47, position: 'right' } },
    { id: 'potion', label: t('晨露药剂', 'Dewdrop potion'), data: { image: '/images/synthesis/potion.svg', quantity: '× 1' },
      targetAnchor: { x: .32, y: .47, position: 'left' } },
  ], [t]);
  const edges = useMemo<DependencyGraphEdge[]>(() => [
    { id: 'herb-extract', source: 'herb', target: 'extract' },
    { id: 'water-extract', source: 'water', target: 'extract',
      sourceAnchor: { x: .68, y: .36, position: 'right' }, targetAnchor: { x: .34, y: .59, position: 'left' } },
    { id: 'water-powder', source: 'water', target: 'powder' },
    { id: 'crystal-powder', source: 'crystal', target: 'powder',
      targetAnchor: { x: .40, y: .63, position: 'bottom' } },
    { id: 'extract-potion', source: 'extract', target: 'potion',
      targetAnchor: { x: .32, y: .39, position: 'left' } },
    { id: 'powder-potion', source: 'powder', target: 'potion',
      targetAnchor: { x: .33, y: .58, position: 'left' } },
  ], []);
  const current = nodes.find(node => node.id === selected);
  const code = `import { useState } from 'react';
import { DependencyGraph, PencilSurface, PencilText,
  type DependencyGraphNode, type DependencyGraphEdge } from '@inkra/react';

type Item = { image: string; quantity: string };
const nodes: DependencyGraphNode<Item>[] = ${JSON.stringify(nodes, null, 2)};
const edges: DependencyGraphEdge[] = ${JSON.stringify(edges, null, 2)};

export function SynthesisDemo() {
  const [selected, setSelected] = useState<string | null>('potion');
  return <>
    <DependencyGraph.Root nodes={nodes} edges={edges}
      nodeWidth={152} nodeHeight={172} rankGap={116} nodeGap={28}
      selectedId={selected} onSelectedIdChange={setSelected}
      renderNode={(node, { selected, activate }) =>
        <button type="button" className="dependency-graph-examples__ingredient"
          aria-label={String(node.label)} aria-pressed={selected}
          data-selected={selected || undefined} onClick={activate}>
          <PencilSurface as="span" aria-hidden="true" variant="outline"
            className="dependency-graph-examples__ingredient-focus" />
          <img src={node.data!.image} alt="" width={128} height={128} draggable={false} />
          <PencilText>{String(node.label)}</PencilText>
          <PencilText className="dependency-graph-examples__ingredient-quantity">
            {node.data!.quantity}
          </PencilText>
        </button>} />
    <output>{String(nodes.find(node => node.id === selected)?.label ?? '')}</output>
  </>;
}
// Each transparent SVG lives in public/images/synthesis/.
// The node is a 152 × 172 box; its 128 × 128 image is centered at the top.
// sourceAnchor/targetAnchor use 0..1 coordinates in the complete node box.
// Edge anchors override node defaults; position controls the curve's tangent.
// .dependency-graph-examples__ingredient {
//   width:100%; height:100%; padding:0; border:0; background:none;
//   display:grid; grid-template-rows:128px 24px 20px; justify-items:center;
// }`;
  return <ComponentExample id="dependency-graph-synthesis" title={t('无框图片与合成配方', 'Frameless images and synthesis recipes')} code={code}>
    <div className="dependency-graph-examples__frame dependency-graph-examples__synthesis">
      <DependencyGraph.Root aria-label={t('无框图片合成图', 'Frameless synthesis graph')} nodes={nodes} edges={edges}
        nodeWidth={152} nodeHeight={172} rankGap={116} nodeGap={28}
        selectedId={selected} onSelectedIdChange={setSelected}
        renderNode={(node, { selected, activate }) => <button type="button"
          className="dependency-graph-examples__ingredient" aria-label={String(node.label)}
          aria-pressed={selected} data-selected={selected || undefined} onClick={activate}>
          <PencilSurface as="span" aria-hidden="true" variant="outline" className="dependency-graph-examples__ingredient-focus" />
          <img src={node.data!.image} alt="" width={128} height={128} draggable={false} />
          <PencilText>{String(node.label)}</PencilText>
          <PencilText className="dependency-graph-examples__ingredient-quantity">{node.data!.quantity}</PencilText>
        </button>} />
    </div>
    <PencilText as="p">{t('直接用透明图片作为节点，不加卡片。草药与水浸取，晶矿与水研磨，再将两种中间材料调和。点击素材可追溯它的前置原料。', 'Transparent images are the nodes themselves. Herbs and water become extract; crystal and water become powder; the intermediates combine into a potion. Select an item to trace its ingredients.')}</PencilText>
    <output aria-live="polite">{current ? `${t('当前选择', 'Selected')}: ${current.label} · ${current.data!.quantity}` : t('选择一种素材。', 'Select an ingredient.')}</output>
    <PencilText as="p">{t('连接点按图片图案的位置设置，避开透明留白；同一药瓶的两条输入边使用不同接入点。坐标相对整个节点盒计算，显式位置不会随布局方向旋转。', 'Anchors follow the artwork rather than its transparent margins. The potion’s two incoming edges meet different points. Coordinates are relative to the complete node box; explicit positions do not rotate when layout direction changes.')}</PencilText>
  </ComponentExample>;
}

export function DependencyGraphExamples() {
  const { t } = useLocale();
  const [direction, setDirection] = useState<Direction>('LR');
  const [issues, setIssues] = useState<string[]>([]);
  const reportIssues = useCallback((value: Array<{ type: string; ids: string[] }>) => setIssues(value.map(issue => `${issue.type}: ${issue.ids.join(', ')}`)), []);
  const basicNodes: DependencyGraphNode[] = useMemo(() => [
    { id: 'a', label: t('基础', 'Foundation') }, { id: 'b', label: t('实践', 'Practice') }, { id: 'c', label: t('掌握', 'Mastery') },
  ], [t]);
  const branchNodes: DependencyGraphNode[] = useMemo(() => [
    { id: 'base', label: t('基础', 'Foundation') }, { id: 'left', label: t('设计', 'Design') },
    { id: 'right', label: t('开发', 'Development') }, { id: 'final', label: t('交付', 'Delivery') },
  ], [t]);
  const invalidEdges = useMemo<DependencyGraphEdge[]>(() => [
    { id: 'a-b', source: 'a', target: 'b' }, { id: 'b-a', source: 'b', target: 'a' }, { id: 'missing', source: 'missing', target: 'c' },
  ], []);
  return <div className="dependency-graph-examples">
    <ComponentPlayground code={basicCode.replace("'Foundation'", JSON.stringify(t('基础', 'Foundation'))).replace("'Practice'", JSON.stringify(t('实践', 'Practice'))).replace("'Mastery'", JSON.stringify(t('掌握', 'Mastery'))).replace('<DependencyGraph.Root nodes={nodes} edges={edges} />', `<DependencyGraph.Root nodes={nodes} edges={edges}${direction === 'LR' ? '' : ` direction="${direction}"`} />`)} controls={<DocsSelect label={t('方向', 'Direction')} value={direction} onValueChange={value => setDirection(value as Direction)} options={[
      ['LR', t('从左到右', 'Left to right')], ['RL', t('从右到左', 'Right to left')], ['TB', t('从上到下', 'Top to bottom')], ['BT', t('从下到上', 'Bottom to top')],
    ]} />}>
      <DependencyGraph.Root aria-label={t('基础依赖图', 'Basic dependency graph')} nodes={basicNodes} edges={chainEdges} direction={direction} />
    </ComponentPlayground>
    <ComponentExample id="dependency-graph-branch-and-join" title={t('分支与汇合', 'Branch and join')} code={`const nodes = ${JSON.stringify(branchNodes, null, 2)};\nconst edges = ${JSON.stringify(branchEdges, null, 2)};\n\n<DependencyGraph.Root nodes={nodes} edges={edges} direction="TB" />`}>
      <div className="dependency-graph-examples__frame"><DependencyGraph.Root aria-label={t('分支与汇合依赖', 'Branch and join dependencies')} nodes={branchNodes} edges={branchEdges} direction="TB" /></div>
      <PencilText as="p">{t('同一个节点可以拥有多个前置节点，层级和位置自动计算。', 'A node can have multiple prerequisites. Ranks and positions are calculated automatically.')}</PencilText>
    </ComponentExample>
    <DependencyGraphToolbarExample />
    <IconGraphExample />
    <CardSlotsExample />
    <LearningTree />
    <LearningTree technology />
    <SynthesisGraphExample />
    <FlipGraphExample />
    <ComponentExample id="dependency-graph-invalid-data" title={t('异常数据与诊断', 'Invalid data and diagnostics')} code={`<DependencyGraph.Root nodes={nodes} edges={edges} onIssues={setIssues} />\n// Report duplicate IDs, missing endpoints and cycles through onIssues.`}>
      <div className="dependency-graph-examples__frame"><DependencyGraph.Root aria-label={t('异常依赖数据', 'Invalid dependency data')} nodes={basicNodes} edges={invalidEdges} onIssues={reportIssues} /></div>
      <output className="dependency-graph-examples__diagnostics">{issues.join('\n') || t('没有诊断', 'No diagnostics')}</output>
      <PencilText as="p">{t('缺失端点的边和环内连线不会渲染；重复 id 仅保留第一项。用 onIssues 接入自己的错误提示或日志。', 'Edges with missing endpoints and edges within cycles are omitted; duplicate IDs keep the first item. Use onIssues for your own feedback or logs.')}</PencilText>
    </ComponentExample>
  </div>;
}
