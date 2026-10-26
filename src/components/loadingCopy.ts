type LoadingDocsCopy = {
  mode: string;
  preset: string;
  status: string;
  progress: string;
  loadingOption: string;
  errorOption: string;
  completeOption: string;
  determinateOption: string;
  indeterminateOption: string;
  hiddenOption: string;
  blocking: string;
  lockScroll: string;
  tips: string;
  openFullscreen: string;
  close: string;
  retry: string;
  continue: string;
  loadingTitle: string;
  loadingDescription: string;
  errorTitle: string;
  completeTitle: string;
  simulationTitle: string;
  simulationDescription: string;
  startSimulation: string;
  sceneTitle: string;
  sceneDescription: string;
  character: string;
  regionLabel: string;
  stageSession: string;
  stageAssets: string;
  stageWorld: string;
  tipOne: string;
  tipTwo: string;
  tipThree: string;
};

const copy: Record<string, LoadingDocsCopy> = {
  en: {
    mode: 'Carrier', preset: 'Layout preset', status: 'Business state', progress: 'Progress mode', loadingOption: 'Loading', errorOption: 'Error', completeOption: 'Complete', determinateOption: 'Determinate', indeterminateOption: 'Indeterminate', hiddenOption: 'Hidden', blocking: 'Block interaction', lockScroll: 'Lock page scroll', tips: 'Show tip controls', openFullscreen: 'Open fullscreen preview', close: 'Cancel loading', retry: 'Retry', continue: 'Continue', loadingTitle: 'Preparing the expedition', loadingDescription: 'The application owns this state and decides when loading is complete.', errorTitle: 'Preparation paused', completeTitle: 'Expedition ready', simulationTitle: 'UI timer simulation', simulationDescription: 'This example advances a local UI timer only. It does not load a real map, network request, or game asset.', startSimulation: 'Start simulated preparation', sceneTitle: 'Fullscreen scene presets', sceneDescription: 'Switch layouts without duplicating component logic. The illustrated landscape is a local decorative scene.', character: 'Switch character', regionLabel: 'Loading preview region', stageSession: 'Open session', stageAssets: 'Prepare local assets', stageWorld: 'Arrange scene', tipOne: 'You can review controls while non-blocking loading stays at the edge.', tipTwo: 'Unknown work stays indeterminate instead of showing a made-up percentage.', tipThree: 'Cancel and retry notify the application; they never complete work by themselves.',
  },
  'zh-CN': {
    mode: '承载方式', preset: '布局预设', status: '业务状态', progress: '进度方式', loadingOption: '加载中', errorOption: '错误', completeOption: '已完成', determinateOption: '确定进度', indeterminateOption: '未知进度', hiddenOption: '隐藏', blocking: '阻断交互', lockScroll: '锁定页面滚动', tips: '显示提示控制', openFullscreen: '打开全屏预览', close: '取消加载', retry: '重试', continue: '继续', loadingTitle: '正在准备远征', loadingDescription: '业务应用拥有状态，并明确决定何时完成。', errorTitle: '准备已暂停', completeTitle: '远征准备就绪', simulationTitle: 'UI 定时器模拟', simulationDescription: '此示例只推进本地 UI 定时器，不加载真实地图、网络请求或游戏资源。', startSimulation: '开始模拟准备', sceneTitle: '全屏场景预设', sceneDescription: '切换布局而不复制组件逻辑；插画景观只是本地装饰场景。', character: '切换角色', regionLabel: '加载预览区域', stageSession: '建立会话', stageAssets: '准备本地资源', stageWorld: '布置场景', tipOne: '非阻断加载停靠在边缘时，仍可操作页面。', tipTwo: '未知工作保持不定进度，不显示编造的百分比。', tipThree: '取消和重试只通知业务，不会自行宣称任务完成。',
  },
  ja: {
    mode: '表示領域', preset: 'レイアウト', status: '業務状態', progress: '進捗方式', loadingOption: '読み込み中', errorOption: 'エラー', completeOption: '完了', determinateOption: '確定進捗', indeterminateOption: '不確定進捗', hiddenOption: '非表示', blocking: '操作をブロック', lockScroll: 'スクロールを固定', tips: 'ヒント操作を表示', openFullscreen: '全画面プレビュー', close: '読み込みをキャンセル', retry: '再試行', continue: '続ける', loadingTitle: '遠征を準備中', loadingDescription: '完了状態はアプリケーションが明示的に管理します。', errorTitle: '準備を一時停止', completeTitle: '遠征の準備完了', simulationTitle: 'UI タイマーのシミュレーション', simulationDescription: 'ローカル UI タイマーだけを進めます。実際の地図、通信、ゲーム素材は読み込みません。', startSimulation: '準備シミュレーションを開始', sceneTitle: '全画面シーンのプリセット', sceneDescription: 'コンポーネントを複製せずにレイアウトを切り替えます。背景はローカル装飾です。', character: 'キャラクター切替', regionLabel: '読み込みプレビュー', stageSession: 'セッションを開始', stageAssets: 'ローカル素材を準備', stageWorld: 'シーンを配置', tipOne: '非ブロッキングの端表示中もページを操作できます。', tipTwo: '不明な進捗に架空の割合を表示しません。', tipThree: 'キャンセルと再試行はアプリへ通知するだけです。',
  },
  ko: {
    mode: '표시 영역', preset: '레이아웃', status: '업무 상태', progress: '진행 방식', loadingOption: '로딩 중', errorOption: '오류', completeOption: '완료', determinateOption: '확정 진행', indeterminateOption: '미확정 진행', hiddenOption: '숨김', blocking: '상호작용 차단', lockScroll: '페이지 스크롤 잠금', tips: '도움말 컨트롤 표시', openFullscreen: '전체 화면 미리보기', close: '로딩 취소', retry: '다시 시도', continue: '계속', loadingTitle: '원정 준비 중', loadingDescription: '완료 상태는 애플리케이션이 명시적으로 결정합니다.', errorTitle: '준비 일시 중지', completeTitle: '원정 준비 완료', simulationTitle: 'UI 타이머 시뮬레이션', simulationDescription: '로컬 UI 타이머만 진행합니다. 실제 지도, 네트워크 요청, 게임 리소스를 불러오지 않습니다.', startSimulation: '준비 시뮬레이션 시작', sceneTitle: '전체 화면 장면 프리셋', sceneDescription: '컴포넌트를 복제하지 않고 레이아웃을 전환합니다. 배경은 로컬 장식 장면입니다.', character: '캐릭터 전환', regionLabel: '로딩 미리보기 영역', stageSession: '세션 열기', stageAssets: '로컬 리소스 준비', stageWorld: '장면 배치', tipOne: '비차단 가장자리 로딩 중에도 페이지를 조작할 수 있습니다.', tipTwo: '알 수 없는 작업에는 임의의 백분율을 표시하지 않습니다.', tipThree: '취소와 재시도는 애플리케이션에 알릴 뿐입니다.',
  },
  fr: {
    mode: 'Zone', preset: 'Disposition', status: 'État métier', progress: 'Type de progression', loadingOption: 'Chargement', errorOption: 'Erreur', completeOption: 'Terminé', determinateOption: 'Déterminée', indeterminateOption: 'Indéterminée', hiddenOption: 'Masquée', blocking: 'Bloquer les interactions', lockScroll: 'Bloquer le défilement', tips: 'Afficher les commandes', openFullscreen: 'Ouvrir en plein écran', close: 'Annuler le chargement', retry: 'Réessayer', continue: 'Continuer', loadingTitle: 'Préparation de l’expédition', loadingDescription: 'L’application contrôle explicitement l’état et la fin du chargement.', errorTitle: 'Préparation interrompue', completeTitle: 'Expédition prête', simulationTitle: 'Simulation du minuteur UI', simulationDescription: 'Cet exemple avance uniquement un minuteur local. Il ne charge ni carte réelle, ni requête réseau, ni ressource de jeu.', startSimulation: 'Démarrer la préparation simulée', sceneTitle: 'Préréglages plein écran', sceneDescription: 'Changez la disposition sans dupliquer le composant. Le paysage est une scène décorative locale.', character: 'Changer de personnage', regionLabel: 'Zone d’aperçu du chargement', stageSession: 'Ouvrir la session', stageAssets: 'Préparer les ressources locales', stageWorld: 'Composer la scène', tipOne: 'Le chargement non bloquant reste au bord sans empêcher les interactions.', tipTwo: 'Une progression inconnue ne produit aucun pourcentage inventé.', tipThree: 'Annuler et réessayer notifient l’application sans simuler la fin.',
  },
};

export function loadingDocsCopy(locale: string): LoadingDocsCopy {
  return copy[locale] ?? copy.en;
}
