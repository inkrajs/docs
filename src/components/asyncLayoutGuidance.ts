import { resolveDocsLocale } from '../docsLocales';

const guidance = {
  loading: {
    'zh-CN': '全屏阻断模式将焦点限制在加载界面，关闭后恢复焦点；非阻断模式不抢焦点。滚动锁独立配置。未知进度不宣称百分比，完成由业务显式传入。提示轮播可暂停，减少动态效果时关闭过渡。为取消、重试和自定义插槽操作保留可访问名称。',
    en: 'Blocking fullscreen loading contains focus and restores it on close; non-blocking loading does not take focus. Scroll locking is independent. Unknown progress never claims a percentage, and completion is explicit. Tips can be paused and respect reduced motion. Name cancel, retry and custom slot controls.',
    ja: '全画面のブロック表示ではフォーカスを内部に保ち、閉じると戻します。非ブロック表示はフォーカスを移しません。スクロール固定は個別に設定できます。不明な進捗を割合で示さず、完了は明示します。ヒントは一時停止でき、動きを減らす設定に従います。操作には分かる名前を付けてください。',
    ko: '전체 화면 차단 모드는 포커스를 내부에 유지하고 닫을 때 돌려줍니다. 비차단 모드는 포커스를 가져오지 않습니다. 스크롤 잠금은 별도 설정입니다. 알 수 없는 진행률은 백분율로 표시하지 않으며 완료는 명시적으로 전달합니다. 도움말 회전은 일시 정지할 수 있고 모션 감소 설정을 따릅니다. 모든 조작에 접근 가능한 이름을 제공하세요.',
    fr: 'Le chargement plein écran bloquant contient le focus et le restitue à la fermeture. Le mode non bloquant ne le déplace pas. Le verrouillage du défilement est indépendant. Une progression inconnue ne donne aucun pourcentage et la fin est explicite. Les conseils peuvent être mis en pause et respectent les mouvements réduits. Nommez chaque commande.',
  },
  'infinite-scroll': {
    'zh-CN': '自动加载、拉动松手加载和按钮加载可独立选择。手机手势保留垂直滚动、嵌套滚动、输入与系统边缘操作，按钮提供键盘替代。加载失败可重试，没有更多时明确结束；同一方向不会重复请求。向前插入内容保留阅读位置，数据项使用稳定标识。',
    en: 'Automatic, pull-and-release and button loading are independently configurable. Touch gestures preserve native scrolling, nested scrollers, editing and system edges; buttons provide a keyboard alternative. Errors can be retried and exhausted directions end explicitly. Requests are deduplicated per direction. Use stable item keys to preserve reading position when prepending.',
    ja: '自動、引いて離す操作、ボタンによる読み込みを個別に設定できます。タッチ操作は通常のスクロール、入力、入れ子の領域やシステム端操作を妨げません。ボタンはキーボードでも使えます。失敗時は再試行でき、終端を明示します。同方向の重複要求を防ぎ、安定したキーで先頭追加時の閲覧位置を保ちます。',
    ko: '자동, 당겼다 놓기, 버튼 로딩을 별도로 설정할 수 있습니다. 터치 제스처는 기본 스크롤, 중첩 스크롤, 입력과 시스템 가장자리 동작을 유지합니다. 버튼은 키보드 대안입니다. 실패 시 재시도하고 끝을 명확히 표시합니다. 방향별 중복 요청을 방지하며 앞에 추가할 때 읽던 위치를 유지하도록 안정적인 키를 사용하세요.',
    fr: 'Le chargement automatique, par traction puis relâchement ou par bouton se configure séparément. Les gestes préservent le défilement natif, les zones imbriquées, la saisie et les bords système. Les boutons offrent une alternative clavier. Les erreurs permettent une nouvelle tentative et la fin est explicite. Les requêtes sont uniques par direction. Utilisez des clés stables pour préserver la position de lecture.',
  },
  masonry: {
    'zh-CN': '瀑布流只改变视觉位置，不改变 DOM、读屏和键盘顺序。用稳定且唯一的 getItemKey 保留内容身份；图片提供替代文字。动态尺寸变化会重新排布，减少动态效果时不播放位移动画。它不负责获取数据，可与 InfiniteScroll 组合。',
    en: 'Masonry changes visual placement, not DOM, screen-reader or keyboard order. Use stable unique item keys and meaningful image alternatives. Dynamic size changes trigger layout; reduced motion disables movement transitions. Data fetching belongs to the application or an InfiniteScroll composition.',
    ja: 'Masonry が変えるのは見た目の配置だけです。DOM、読み上げ、キーボードの順序は保ちます。安定した一意のキーと画像の代替テキストを指定してください。サイズ変更時は再配置し、動きを減らす設定では移動アニメーションを止めます。データ取得はアプリ側で行い、InfiniteScroll と組み合わせられます。',
    ko: 'Masonry는 시각적 배치만 바꾸고 DOM, 스크린 리더와 키보드 순서는 유지합니다. 안정적인 고유 키와 이미지 대체 텍스트를 제공하세요. 크기가 바뀌면 다시 배치하며 모션 감소 설정에서는 이동 애니메이션을 끕니다. 데이터 요청은 앱이 담당하며 InfiniteScroll과 조합할 수 있습니다.',
    fr: 'Masonry change la disposition visuelle, pas l’ordre du DOM, de lecture ou du clavier. Utilisez des clés uniques et stables ainsi que des textes alternatifs pertinents. Les changements de taille recalculent la disposition; les mouvements réduits désactivent les transitions. Les données restent gérées par l’application ou une composition avec InfiniteScroll.',
  },
} as const;

export function asyncLayoutGuidance(component: string, locale: string): string | undefined {
  return guidance[component as keyof typeof guidance]?.[resolveDocsLocale(locale)];
}
