import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, DependencyGraph, Log, Radar, Sortable,
  type DependencyGraphEdge, type DependencyGraphNode, type SortableContainerData } from '@inkra/react';
import { __iconData as bookIcon } from 'lucide-react/dist/esm/icons/book-open.mjs';
import { __iconData as eyeIcon } from 'lucide-react/dist/esm/icons/eye.mjs';
import { __iconData as wrenchIcon } from 'lucide-react/dist/esm/icons/wrench.mjs';
import { __iconData as lightbulbIcon } from 'lucide-react/dist/esm/icons/lightbulb.mjs';
import { __iconData as shareIcon } from 'lucide-react/dist/esm/icons/share-2.mjs';
import { useLocale } from '../i18n';
import { DeferredPencilText as PencilText } from './HomeDemo';
import { DocsIcon } from './DocsIcon';
import { DeferredArtwork } from './HomeDemo';
import './HomeWorkspaceSamples.css';

function useHomeText() {
  const { locale } = useLocale();
  return (zh: string, en: string) => locale === 'en' ? en : zh;
}

type PackingItem = { id: 'camera' | 'notebook' | 'map' | 'pencil' };
const packingIds: PackingItem['id'][] = ['camera', 'notebook', 'map', 'pencil'];
const freshPacking = (): SortableContainerData<PackingItem>[] => [{
  id: 'packing', layout: 'list', items: packingIds.map(id => ({ id })),
}];

export function HomePackingSample() {
  const text = useHomeText();
  const [containers, setContainers] = useState(freshPacking);
  const names = {
    camera: text('相机', 'Camera'), notebook: text('一本手账', 'Travel journal'),
    map: text('折好的地图', 'Folded map'), pencil: text('一支铅笔', 'Pencil'),
  };
  return <div className="home-new-workspace home-new-packing">
    <div className="home-new-workspace__heading">
      <PencilText as="h2">{text('整理一下行囊', 'Pack for a little adventure')}</PencilText>
      <Button size="sm" variant="ghost" onClick={() => setContainers(freshPacking())}>{text('重置', 'Reset')}</Button>
    </div>
    <Sortable containers={containers} getItemId={item => item.id} onChange={setContainers} handle
      getItemLabel={item => names[item.id]} getContainerLabel={() => text('出发清单', 'Packing list')}
      labels={{ handle: text('拖动项目', 'Move item'), screenReaderInstructions: text(
        '按空格或回车拾取，方向键调整顺序，再按空格或回车放下；Escape 取消。',
        'Press Space or Enter to pick up an item, use the arrow keys to move, and press Space or Enter to drop. Escape cancels.',
      ) }}
      className="home-new-packing__list" containerClassName="home-new-packing__container"
      renderItem={({ item, index }) => <div className="home-new-packing__item">
        <PencilText className="home-new-packing__number">{String(index + 1).padStart(2, '0')}</PencilText>
        <PencilText>{names[item.id]}</PencilText>
      </div>} />
    <PencilText as="p" className="home-new-workspace__note">{text('拖动右侧手柄，换个顺序再出发。', 'Drag a handle to put everything in order.')}</PencilText>
  </div>;
}

export function HomeLogSample() {
  const text = useHomeText();
  const [sequences, setSequences] = useState([1, 2, 3]);
  const messages = [
    text('打开一页新的手账。', 'Open a fresh journal page.'),
    text('收好地图和灵感。', 'Gather a map and a little inspiration.'),
    text('准备好下一次出发。', 'Ready for the next adventure.'),
    text('又记下一点新的发现。', 'Write down another small discovery.'),
  ];
  const items = sequences.map(sequence => ({
    id: `home-log-${sequence}`, level: sequence % 3 === 0 ? 'success' : 'info',
    time: String(sequence).padStart(2, '0'), content: messages[Math.min(sequence - 1, 3)],
  }));
  return <div className="home-new-workspace home-new-log">
    <div className="home-new-workspace__heading">
      <PencilText as="h2">{text('一路的小发现', 'Notes along the way')}</PencilText>
      <Badge size="sm">{text('手账', 'Journal')}</Badge>
    </div>
    <Log className="home-new-log__records" aria-label={text('手账记录', 'Journal entries')}
      items={items} showLevelFilter={false} showFollowControl={false}
      levels={[{ value: 'info', label: text('记录', 'Note'), tone: 'info' },
        { value: 'success', label: text('完成', 'Done'), tone: 'success' }]}
      labels={{ list: text('手账记录', 'Journal entries'), latest: text('回到最新记录', 'Back to the latest entry') }} />
    <Button variant="outline" onClick={() => setSequences(current => [...current, current[current.length - 1] + 1].slice(-12))}>
      {text('再记一条', 'Add a note')}
    </Button>
  </div>;
}

const radarKeys = ['observe', 'practice', 'imagine', 'organize', 'express'] as const;
const radarProfiles = [[86, 54, 72, 48, 64], [58, 82, 66, 78, 88]];

export function HomeRadarSample() {
  const text = useHomeText();
  const [profile, setProfile] = useState(0);
  const names = [text('观察', 'Observe'), text('动手', 'Practice'), text('想象', 'Imagine'), text('整理', 'Organize'), text('表达', 'Express')];
  const axes = radarKeys.map((id, index) => ({ id, label: names[index], min: 0, max: 100 }));
  return <div className="home-new-workspace home-new-radar">
    <div className="home-new-workspace__heading">
      <PencilText as="h2">{text('把长处画出来', 'A shape for your strengths')}</PencilText>
      <Badge size="sm">{profile === 0 ? text('探索', 'Explore') : text('创作', 'Create')}</Badge>
    </div>
    <Radar className="home-new-radar__chart" label={text('练习方向示例', 'Practice profile example')}
      axes={axes} series={[{ id: 'practice', label: profile === 0 ? text('探索练习', 'Exploration') : text('创作练习', 'Creation'),
        data: radarKeys.map((axisId, index) => ({ axisId, value: radarProfiles[profile][index] })) }]}
      size="100%" levels={4} showLegend={false} showValues={false} showTable={false} />
    <Button variant="outline" onClick={() => setProfile(current => current === 0 ? 1 : 0)}>{text('换个练习方向', 'Try another direction')}</Button>
  </div>;
}

const skillEdges: DependencyGraphEdge[] = [
  { id: 'start-observe', source: 'start', target: 'observe' },
  { id: 'start-practice', source: 'start', target: 'practice' },
  { id: 'observe-create', source: 'observe', target: 'create' },
  { id: 'practice-create', source: 'practice', target: 'create' },
  { id: 'create-share', source: 'create', target: 'share' },
];

export function HomeSkillsSample() {
  const text = useHomeText();
  const [completed, setCompleted] = useState(['start']);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [compact, setCompact] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setCompact(frame.getBoundingClientRect().width < 620);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const { locale } = useLocale();
  const nodes = useMemo<DependencyGraphNode[]>(() => {
    const label = (zh: string, en: string) => locale === 'en' ? en : zh;
    return [
      { id: 'start', label: label('好奇心', 'Curiosity'), icon: <DocsIcon data={bookIcon} />, description: label('从这里出发', 'Start here') },
      { id: 'observe', label: label('观察', 'Observe'), icon: <DocsIcon data={eyeIcon} />, description: label('发现一点不同', 'Look closer') },
      { id: 'practice', label: label('动手', 'Practice'), icon: <DocsIcon data={wrenchIcon} />, description: label('试着做出来', 'Make a start') },
      { id: 'create', label: label('创作', 'Create'), icon: <DocsIcon data={lightbulbIcon} />, description: label('把想法连起来', 'Join the dots') },
      { id: 'share', label: label('分享', 'Share'), icon: <DocsIcon data={shareIcon} />, description: label('让别人也看到', 'Pass it on') },
    ].map(node => ({ ...node,
      label: <PencilText>{node.label}</PencilText>,
      icon: compact ? undefined : <DeferredArtwork className="home-new-skills__deferred-icon">{node.icon}</DeferredArtwork>,
      description: compact ? undefined : <PencilText>{node.description}</PencilText>, status: completed.includes(node.id) ? 'completed' as const
      : skillEdges.filter(edge => edge.target === node.id).every(edge => completed.includes(edge.source)) ? 'available' as const : 'locked' as const }));
  }, [completed, locale, compact]);
  const activate = (node: DependencyGraphNode) => {
    if (node.status !== 'available') return;
    setCompleted(current => current.includes(node.id) ? current : [...current, node.id]);
    setMessage(node.id);
  };
  return <div className="home-new-workspace home-new-skills">
    <div className="home-new-workspace__heading">
      <div className="home-new-skills__heading"><PencilText as="h2">{text('把灵感连起来', 'Connect a little curiosity')}</PencilText>
        <PencilText className="home-new-workspace__note">{text('点击可用节点，走出你的小小技能树。', 'Activate available nodes to grow a little skill tree.')}</PencilText></div>
      <div className="home-new-skills__actions"><Badge size="sm">{completed.length} / {nodes.length}</Badge>
        <Button size="sm" variant="outline" onClick={() => { setCompleted(['start']); setSelected(null); setMessage(''); }}>{text('重新开始', 'Start again')}</Button></div>
    </div>
    <div ref={frameRef} className="home-new-skills__frame" data-compact={compact}>
      <DependencyGraph.Root key={compact ? 'vertical' : 'horizontal'} nodes={nodes} edges={skillEdges}
        aria-label={text('创作技能树示例', 'Creative skill tree example')} direction={compact ? 'TB' : 'LR'}
        nodeWidth={compact ? 104 : 148} nodeHeight={compact ? 84 : 110} rankGap={compact ? 34 : 52} nodeGap={compact ? 16 : 38}
        selectedId={selected} onSelectedIdChange={setSelected} onNodeActivate={activate}
        zoomOnScroll={false} panOnDrag={!compact} zoomOnPinch minZoom={0.3} maxZoom={1.5} hideAttribution
        statusLabels={{ completed: text('已掌握', 'Learned'), available: text('可以学习', 'Available'), locked: text('等待前置', 'Locked'), active: text('进行中', 'In progress') }}
        controlLabels={{ zoomIn: text('放大技能树', 'Zoom in'), zoomOut: text('缩小技能树', 'Zoom out'), fitView: text('适应画布', 'Fit view') }} />
    </div>
    <output className="home-new-workspace__note" aria-live="polite">{completed.length === nodes.length
      ? text('新的创作旅程，已经准备好了。', 'Ready for another creative adventure.')
      : message ? text(`已掌握「${({ start: '好奇心', observe: '观察', practice: '动手', create: '创作', share: '分享' } as Record<string, string>)[message]}」。`, `Learned ${({ start: 'Curiosity', observe: 'Observe', practice: 'Practice', create: 'Create', share: 'Share' } as Record<string, string>)[message]}.`)
      : text('先完成观察和动手，再继续创作。', 'Explore observation and practice before moving on to creation.')}</output>
  </div>;
}
