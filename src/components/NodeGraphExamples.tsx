import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  NodeGraph,
  PencilText,
  Switch,
  addNodeGraphEdge,
  applyNodeGraphEdgeChanges,
  applyNodeGraphNodeChanges,
  type NodeGraphConnection,
  type NodeGraphEdge,
  type NodeGraphNode,
  type NodeGraphNodeData,
  type NodeGraphRef,
  type NodeGraphRenderEdgeProps,
  type NodeGraphRenderNodeProps,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { PropertyTabs } from './PropertyTabs';
import './NodeGraphExamples.css';

type DemoNode = NodeGraphNode<NodeGraphNodeData & { kind?: 'start' | 'step' | 'decision' | 'finish'; status?: string }>;
type DemoEdge = NodeGraphEdge<{ tone?: 'neutral' | 'accent' }>;

const workflowNodes: DemoNode[] = [
  {
    id: 'brief',
    position: { x: 0, y: 70 },
    data: {
      label: '需求草图 / Brief',
      description: '收集目标和约束 / Gather goals and constraints',
      kind: 'start',
      ports: [
        { id: 'out', type: 'source', position: 'right', label: '下一步 / Next step' },
        { id: 'revise-in', type: 'target', position: 'bottom', label: '修改后返回 / Revised work' },
      ],
    },
  },
  {
    id: 'review',
    position: { x: 260, y: 0 },
    data: {
      label: '设计评审 / Review',
      description: '检查内容、交互和视觉 / Check content, behavior and visuals',
      kind: 'decision',
      ports: [
        { id: 'in', type: 'target', position: 'left', label: '评审输入 / Review input' },
        { id: 'approved', type: 'source', position: 'right', label: '通过 / Approved' },
        { id: 'revise', type: 'source', position: 'bottom', label: '修改 / Revise' },
      ],
    },
  },
  {
    id: 'revise',
    position: { x: 270, y: 220 },
    data: {
      label: '调整方案 / Revise',
      description: '保留反馈并继续迭代 / Keep feedback and iterate',
      kind: 'step',
      ports: [
        { id: 'in', type: 'target', position: 'top', label: '待修改 / Needs revision' },
        { id: 'out', type: 'source', position: 'left', label: '返回草图 / Return to brief' },
      ],
    },
  },
  {
    id: 'ship',
    position: { x: 540, y: 70 },
    data: {
      label: '交付 / Ship',
      description: '完成验证并发布 / Finish verification and release',
      kind: 'finish',
      ports: [{ id: 'in', type: 'target', position: 'left', label: '已通过 / Approved work' }],
    },
  },
];

const workflowEdges: DemoEdge[] = [
  { id: 'brief-review', source: 'brief', sourceHandle: 'out', target: 'review', targetHandle: 'in', label: '提交 / Submit' },
  { id: 'review-ship', source: 'review', sourceHandle: 'approved', target: 'ship', targetHandle: 'in', label: '通过 / Approved', data: { tone: 'accent' } },
  { id: 'review-revise', source: 'review', sourceHandle: 'revise', target: 'revise', targetHandle: 'in', label: '有反馈 / Feedback' },
  { id: 'revise-brief', source: 'revise', sourceHandle: 'out', target: 'brief', targetHandle: 'revise-in', label: '再试一次 / Try again' },
];

const dependencyNodes: DemoNode[] = [
  { id: 'tokens', position: { x: 20, y: 40 }, data: { label: 'Design tokens', status: 'stable', ports: [{ id: 'out', type: 'source', position: 'right', label: 'Token output' }] } },
  { id: 'controls', position: { x: 300, y: 0 }, data: { label: 'Controls', status: 'active', ports: [{ id: 'in', type: 'target', position: 'left', label: 'Token input' }, { id: 'out', type: 'source', position: 'right', label: 'Control output' }] } },
  { id: 'docs', position: { x: 590, y: 40 }, data: { label: 'Documentation', status: 'draft', ports: [{ id: 'in', type: 'target', position: 'left', label: 'Component input' }] } },
  { id: 'playground', position: { x: 300, y: 220 }, data: { label: 'Playground', status: 'active', ports: [{ id: 'in', type: 'target', position: 'top', label: 'Control input' }, { id: 'out', type: 'source', position: 'right', label: 'Preview output' }] } },
];

const dependencyEdges: DemoEdge[] = [
  { id: 'tokens-controls', source: 'tokens', sourceHandle: 'out', target: 'controls', targetHandle: 'in', label: 'theme' },
  { id: 'controls-docs', source: 'controls', sourceHandle: 'out', target: 'docs', targetHandle: 'in', label: 'API', data: { tone: 'accent' } },
  { id: 'controls-playground', source: 'controls', sourceHandle: 'out', target: 'playground', targetHandle: 'in', label: 'preview' },
  { id: 'playground-docs', source: 'playground', sourceHandle: 'out', target: 'docs', targetHandle: 'in', label: 'examples' },
];

function statusVariant(status: unknown): 'success' | 'info' | 'warning' {
  if (status === 'stable') return 'success';
  if (status === 'draft') return 'warning';
  return 'info';
}

function DependencyNode({ id, data, selected, readOnly }: NodeGraphRenderNodeProps<DemoNode['data']>) {
  const label = typeof data.label === 'string' ? data.label : id;
  return <div className="node-graph-examples__dependency-node" data-selected={selected || undefined}>
    <Card.Root variant={selected ? 'quiet' : 'paper'} size="sm" divided={false}>
      <Card.Content className="node-graph-examples__dependency-content">
        <PencilText>{label}</PencilText>
        <Badge size="sm" variant={statusVariant(data.status)}>{String(data.status ?? 'active')}</Badge>
      </Card.Content>
    </Card.Root>
    {(data.ports ?? []).map(port => <NodeGraph.Port key={`${port.type}-${port.id}`} {...port} connectable={!readOnly && port.connectable !== false} />)}
  </div>;
}

function DependencyEdge({ edge, path, labelX, labelY, selected }: NodeGraphRenderEdgeProps<DemoEdge>) {
  return <NodeGraph.Edge
    id={edge.id}
    path={path}
    labelX={labelX}
    labelY={labelY}
    label={edge.label}
    selected={selected}
    interactionWidth={0}
    className={edge.data?.tone === 'accent' ? 'node-graph-examples__edge--accent' : undefined}
  />;
}

function GraphFrame({ children }: { children: ReactNode }) {
  return <div className="node-graph-examples__frame">{children}</div>;
}

export function NodeGraphExamples() {
  const { locale } = useLocale();
  const english = locale === 'en';
  const text = (chinese: string, englishText: string) => english ? englishText : chinese;
  const graphRef = useRef<NodeGraphRef>(null);
  const [nodes, setNodes] = useState<DemoNode[]>(workflowNodes);
  const [edges, setEdges] = useState<DemoEdge[]>(workflowEdges);
  const [readOnly, setReadOnly] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [connectOnClick, setConnectOnClick] = useState(true);
  const [zoomOnScroll, setZoomOnScroll] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [message, setMessage] = useState('');

  const displayedNodes = empty ? [] : nodes;
  const displayedEdges = empty ? [] : edges;
  const isValidConnection = useCallback((connection: NodeGraphConnection | DemoEdge) => {
    const duplicate = edges.some(edge => edge.source === connection.source
      && edge.target === connection.target
      && edge.sourceHandle === connection.sourceHandle
      && edge.targetHandle === connection.targetHandle);
    return connection.source !== connection.target && !duplicate;
  }, [edges]);
  const onConnect = useCallback((connection: NodeGraphConnection) => {
    if (!isValidConnection(connection)) {
      setMessage(text('这个连接无效或已存在。', 'This connection is invalid or already exists.'));
      return;
    }
    setEdges(current => addNodeGraphEdge(connection, current));
    setMessage(text('已连接节点。', 'Nodes connected.'));
  }, [isValidConnection, locale]);

  const code = `const [nodes, setNodes] = useState(initialNodes);
const [edges, setEdges] = useState(initialEdges);

<NodeGraph.Root
  aria-label="${text('发布流程', 'Release workflow')}"
  nodes={nodes}
  edges={edges}
  onNodesChange={changes => setNodes(current => applyNodeGraphNodeChanges(changes, current))}
  onEdgesChange={changes => setEdges(current => applyNodeGraphEdgeChanges(changes, current))}
  onConnect={connection => setEdges(current => addNodeGraphEdge(connection, current))}
  isValidConnection={connection => connection.source !== connection.target}
  readOnly={${readOnly}}
  controls={${showControls}}
  controlLabels={{ zoomIn: '${text('放大', 'Zoom in')}', zoomOut: '${text('缩小', 'Zoom out')}', fitView: '${text('适应视图', 'Fit view')}' }}
  connectOnClick={${connectOnClick}}
  zoomOnScroll={${zoomOnScroll}}
  fitView
/>`;

  const dependencyRenderNode = useMemo(() => (props: NodeGraphRenderNodeProps<DemoNode['data']>) => <DependencyNode {...props} />, []);
  const dependencyRenderEdge = useMemo(() => (props: NodeGraphRenderEdgeProps<DemoEdge>) => <DependencyEdge {...props} />, []);

  return <div className="node-graph-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '交互', content: <>
        <Switch label={text('只读模式', 'Read-only mode')} checked={readOnly} onCheckedChange={setReadOnly} />
        <Switch label={text('点按端口连线', 'Tap ports to connect')} checked={connectOnClick} onCheckedChange={setConnectOnClick} disabled={readOnly} />
        <Switch label={text('滚轮缩放', 'Wheel zoom')} checked={zoomOnScroll} onCheckedChange={setZoomOnScroll} />
      </> },
      { label: '布局', content: <>
        <Switch label={text('显示视口控件', 'Show viewport controls')} checked={showControls} onCheckedChange={setShowControls} />
        <Switch label={text('显示空态', 'Show empty state')} checked={empty} onCheckedChange={setEmpty} />
        <Button variant="outline" onClick={() => void graphRef.current?.fitView({ padding: 0.18 })}>{text('适应视图', 'Fit view')}</Button>
        <Button variant="ghost" onClick={() => { setNodes(workflowNodes); setEdges(workflowEdges); setEmpty(false); }}>{text('重置流程', 'Reset workflow')}</Button>
      </> },
    ]} />}>
      <GraphFrame>
        <NodeGraph.Root
          ref={graphRef}
          aria-label={text('发布流程', 'Release workflow')}
          nodes={displayedNodes}
          edges={displayedEdges}
          onNodesChange={changes => setNodes(current => applyNodeGraphNodeChanges(changes, current))}
          onEdgesChange={changes => setEdges(current => applyNodeGraphEdgeChanges(changes, current))}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          readOnly={readOnly}
          controls={showControls}
          controlLabels={{ zoomIn: text('放大', 'Zoom in'), zoomOut: text('缩小', 'Zoom out'), fitView: text('适应视图', 'Fit view') }}
          connectOnClick={connectOnClick}
          zoomOnScroll={zoomOnScroll}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          emptyState={<PencilText>{text('先放一个节点，流程就有了起点。', 'Add a node to give the flow a starting point.')}</PencilText>}
        />
        <span className="visually-hidden" role="status">{message}</span>
      </GraphFrame>
    </ComponentPlayground>

    <ComponentExample title={text('依赖关系与自定义节点', 'Dependencies and custom nodes')} code={`const renderNode = useCallback(props => <DependencyCardNode {...props} />, []);
const renderEdge = useCallback(props => <DependencyEdge {...props} />, []);

<NodeGraph.Root
  aria-label="${text('组件依赖关系', 'Component dependencies')}"
  nodes={dependencyNodes}
  edges={dependencyEdges}
  renderNode={renderNode}
  renderEdge={renderEdge}
  readOnly
  fitView
/>`}>
      <GraphFrame>
        <NodeGraph.Root
          aria-label={text('组件依赖关系', 'Component dependencies')}
          nodes={dependencyNodes}
          edges={dependencyEdges}
          renderNode={dependencyRenderNode}
          renderEdge={dependencyRenderEdge}
          readOnly
          controlLabels={{ zoomIn: text('放大', 'Zoom in'), zoomOut: text('缩小', 'Zoom out'), fitView: text('适应视图', 'Fit view') }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        />
      </GraphFrame>
    </ComponentExample>
  </div>;
}
