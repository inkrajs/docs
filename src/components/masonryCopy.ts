import type { DocsLocale } from '../docsLocales';

export const masonryCopy = {
  'zh-CN': {
    title: 'Masonry',
    layout: '布局',
    behavior: '行为',
    adaptive: '自适应列',
    fixed: '固定列数',
    columnMode: '列模式',
    columns: '列数',
    minColumnWidth: '最小列宽',
    columnGap: '横向间距',
    rowGap: '纵向间距',
    strategy: '布局策略',
    shortest: '最短列',
    sequential: '顺序列',
    direction: '阅读方向',
    animate: '布局过渡',
    add: '新增卡片',
    remove: '移除末项',
    reverse: '反转顺序',
    loadImage: '加载图片',
    hideImage: '移除图片',
    boardLabel: '创作素材瀑布流',
    rtlLabel: 'RTL 顺序布局',
    imageAltLight: 'Inkra 文档浅色主题预览',
    imageAltDark: 'Inkra 文档深色主题预览',
    imageAltAsync: '异步加载的 Inkra 文档浅色主题预览',
    cardSketch: '界面草图',
    cardSketchBody: '把导航、内容和操作先排成可阅读的线框，再进入细节。',
    cardPalette: '纸面配色',
    cardPaletteBody: '比较浅色纸面、墨色和彩铅强调色的真实组合。',
    cardReview: '评审清单',
    cardReviewBody: '键盘、窄屏、RTL、减少动态效果和打印模式都需要独立核对。',
    cardArchive: '灵感归档',
    cardArchiveBody: '保存已验证的构图和仍待探索的问题。',
    cardAsync: '异步素材',
    cardAsyncBody: '图片出现后，后续项目会按新高度重新排布。',
    cardNotes: '研究笔记',
    cardNotesBody: '短摘要与较长段落混排，保持源顺序不变。',
    cardAdded: '新卡片',
    cardAddedBody: '新增内容使用稳定 id，加入后直接参与当前布局策略。',
    apiItems: '要渲染的数据数组。',
    apiGetItemKey: '为每项返回稳定且唯一的 string、number 或 bigint key。',
    apiRenderItem: '按数据、索引和 key 渲染每个项目。',
    apiGetItemProps: '为项目包装层补充原生属性、语义或 className。',
    apiColumns: '固定列数；使用 auto 时按最小列宽自适应。',
    apiMinColumnWidth: '自适应模式下的目标最小列宽，单位为 CSS 像素。',
    apiMaxColumns: '限制自适应模式可生成的最大列数。',
    apiColumnGap: '列之间的水平间距，单位为 CSS 像素。',
    apiRowGap: '同一列相邻项目的垂直间距，单位为 CSS 像素。',
    apiStrategy: 'shortest 放入当前最短列；sequential 按源顺序轮流分列。',
    apiDirection: '显式设置 ltr 或 rtl；省略时读取容器计算方向。',
    apiAnimated: '是否为项目位置变化使用布局过渡；减少动态效果时自动停用。',
  },
  en: {
    title: 'Masonry', layout: 'Layout', behavior: 'Behavior', adaptive: 'Adaptive columns', fixed: 'Fixed columns', columnMode: 'Column mode', columns: 'Columns', minColumnWidth: 'Minimum column width', columnGap: 'Column gap', rowGap: 'Row gap', strategy: 'Layout strategy', shortest: 'Shortest column', sequential: 'Sequential columns', direction: 'Direction', animate: 'Layout transitions', add: 'Add card', remove: 'Remove last item', reverse: 'Reverse order', loadImage: 'Load image', hideImage: 'Remove image', boardLabel: 'Creative material masonry', rtlLabel: 'RTL sequential layout', imageAltLight: 'Light theme preview of the Inkra documentation', imageAltDark: 'Dark theme preview of the Inkra documentation', imageAltAsync: 'Asynchronously loaded light theme preview of the Inkra documentation', cardSketch: 'Interface sketch', cardSketchBody: 'Arrange navigation, content and actions into a readable wireframe before refining details.', cardPalette: 'Paper palette', cardPaletteBody: 'Compare light paper, ink and pencil accents as a real composition.', cardReview: 'Review checklist', cardReviewBody: 'Check keyboard use, narrow screens, RTL, reduced motion and print independently.', cardArchive: 'Idea archive', cardArchiveBody: 'Keep proven compositions alongside the questions still worth exploring.', cardAsync: 'Async asset', cardAsyncBody: 'When the image appears, following items reflow around the measured height.', cardNotes: 'Research notes', cardNotesBody: 'Mix short summaries and longer passages without changing source order.', cardAdded: 'New card', cardAddedBody: 'New content keeps a stable id and joins the active placement strategy.', apiItems: 'The data array to render.', apiGetItemKey: 'Returns a stable, unique string, number or bigint key for each item.', apiRenderItem: 'Renders each item from its data, index and key.', apiGetItemProps: 'Adds native attributes, semantics or a className to the item wrapper.', apiColumns: 'A fixed column count, or auto to adapt from the minimum column width.', apiMinColumnWidth: 'The target minimum column width in CSS pixels for adaptive mode.', apiMaxColumns: 'Limits the maximum columns produced by adaptive mode.', apiColumnGap: 'Horizontal space between columns in CSS pixels.', apiRowGap: 'Vertical space between adjacent items in the same column in CSS pixels.', apiStrategy: 'shortest uses the current shortest column; sequential rotates through columns in source order.', apiDirection: 'Sets ltr or rtl explicitly; when omitted, the computed container direction is used.', apiAnimated: 'Enables position transitions; reduced-motion preferences disable them automatically.',
  },
  ja: {
    title: 'Masonry', layout: 'レイアウト', behavior: '動作', adaptive: '自動列', fixed: '固定列数', columnMode: '列モード', columns: '列数', minColumnWidth: '最小列幅', columnGap: '列間隔', rowGap: '行間隔', strategy: '配置方法', shortest: '最短の列', sequential: '順番の列', direction: '表示方向', animate: '配置のトランジション', add: 'カードを追加', remove: '最後の項目を削除', reverse: '順序を反転', loadImage: '画像を読み込む', hideImage: '画像を削除', boardLabel: '制作素材の Masonry', rtlLabel: 'RTL の順番配置', imageAltLight: 'Inkra ドキュメントのライトテーマプレビュー', imageAltDark: 'Inkra ドキュメントのダークテーマプレビュー', imageAltAsync: '非同期で読み込まれた Inkra ドキュメントのライトテーマプレビュー', cardSketch: '画面スケッチ', cardSketchBody: '細部を整える前に、ナビゲーション、内容、操作を読みやすいワイヤーフレームに並べます。', cardPalette: '紙面の配色', cardPaletteBody: '明るい紙、インク、色鉛筆のアクセントを実際の組み合わせで比べます。', cardReview: 'レビュー項目', cardReviewBody: 'キーボード、狭い画面、RTL、動きの抑制、印刷を個別に確認します。', cardArchive: 'アイデア保管庫', cardArchiveBody: '検証済みの構成と、まだ調べたい問いを残します。', cardAsync: '非同期素材', cardAsyncBody: '画像が現れると、後続の項目が測定後の高さに合わせて再配置されます。', cardNotes: '調査メモ', cardNotesBody: '短い要約と長い文章を混ぜても、ソース順は変わりません。', cardAdded: '新しいカード', cardAddedBody: '新しい内容は安定した id を保ち、現在の配置方法に加わります。', apiItems: '描画するデータ配列。', apiGetItemKey: '各項目に安定した一意の key を返します。', apiRenderItem: 'データ、index、key から各項目を描画します。', apiGetItemProps: '項目ラッパーに属性、意味、className を追加します。', apiColumns: '固定列数。auto では最小列幅から自動調整します。', apiMinColumnWidth: '自動モードの目標最小列幅（CSS px）。', apiMaxColumns: '自動モードで生成する最大列数。', apiColumnGap: '列間の水平間隔（CSS px）。', apiRowGap: '同じ列の項目間の垂直間隔（CSS px）。', apiStrategy: 'shortest は最短列、sequential はソース順で列を巡回します。', apiDirection: 'ltr / rtl を指定。省略時はコンテナの計算済み方向を使います。', apiAnimated: '位置のトランジション。動きを減らす設定では自動停止します。',
  },
  ko: {
    title: 'Masonry', layout: '레이아웃', behavior: '동작', adaptive: '반응형 열', fixed: '고정 열 수', columnMode: '열 모드', columns: '열 수', minColumnWidth: '최소 열 너비', columnGap: '열 간격', rowGap: '행 간격', strategy: '배치 전략', shortest: '가장 짧은 열', sequential: '순차 열', direction: '읽기 방향', animate: '배치 전환', add: '카드 추가', remove: '마지막 항목 제거', reverse: '순서 뒤집기', loadImage: '이미지 불러오기', hideImage: '이미지 제거', boardLabel: '창작 자료 Masonry', rtlLabel: 'RTL 순차 배치', imageAltLight: 'Inkra 문서의 밝은 테마 미리 보기', imageAltDark: 'Inkra 문서의 어두운 테마 미리 보기', imageAltAsync: '비동기로 불러온 Inkra 문서의 밝은 테마 미리 보기', cardSketch: '화면 스케치', cardSketchBody: '세부 작업 전에 탐색, 콘텐츠, 동작을 읽기 쉬운 와이어프레임으로 정리합니다.', cardPalette: '종이 팔레트', cardPaletteBody: '밝은 종이, 잉크, 색연필 강조색을 실제 조합으로 비교합니다.', cardReview: '검토 목록', cardReviewBody: '키보드, 좁은 화면, RTL, 동작 줄이기와 인쇄를 각각 확인합니다.', cardArchive: '아이디어 보관함', cardArchiveBody: '검증한 구성과 아직 탐색할 질문을 함께 보관합니다.', cardAsync: '비동기 자료', cardAsyncBody: '이미지가 나타나면 뒤 항목이 측정된 높이에 맞춰 다시 배치됩니다.', cardNotes: '연구 메모', cardNotesBody: '짧은 요약과 긴 문단을 섞어도 소스 순서는 유지됩니다.', cardAdded: '새 카드', cardAddedBody: '새 콘텐츠는 안정적인 id로 현재 배치 전략에 참여합니다.', apiItems: '렌더링할 데이터 배열입니다.', apiGetItemKey: '각 항목의 안정적이고 고유한 key를 반환합니다.', apiRenderItem: '데이터, index, key로 각 항목을 렌더링합니다.', apiGetItemProps: '항목 래퍼에 속성, 의미 또는 className을 추가합니다.', apiColumns: '고정 열 수이며 auto는 최소 열 너비로 반응합니다.', apiMinColumnWidth: '반응형 모드의 목표 최소 열 너비(CSS px)입니다.', apiMaxColumns: '반응형 모드가 만들 수 있는 최대 열 수입니다.', apiColumnGap: '열 사이의 가로 간격(CSS px)입니다.', apiRowGap: '같은 열 항목 사이의 세로 간격(CSS px)입니다.', apiStrategy: 'shortest는 가장 짧은 열, sequential은 소스 순서로 열을 순환합니다.', apiDirection: 'ltr 또는 rtl을 지정하며 생략하면 컨테이너 방향을 사용합니다.', apiAnimated: '위치 전환을 켜며 동작 줄이기 설정에서는 자동으로 꺼집니다.',
  },
  fr: {
    title: 'Masonry', layout: 'Disposition', behavior: 'Comportement', adaptive: 'Colonnes adaptatives', fixed: 'Nombre fixe', columnMode: 'Mode des colonnes', columns: 'Colonnes', minColumnWidth: 'Largeur minimale', columnGap: 'Espacement horizontal', rowGap: 'Espacement vertical', strategy: 'Stratégie', shortest: 'Colonne la plus courte', sequential: 'Colonnes séquentielles', direction: 'Direction', animate: 'Transitions de disposition', add: 'Ajouter une carte', remove: 'Retirer le dernier élément', reverse: 'Inverser l’ordre', loadImage: 'Charger l’image', hideImage: 'Retirer l’image', boardLabel: 'Masonry de ressources créatives', rtlLabel: 'Disposition séquentielle RTL', imageAltLight: 'Aperçu du thème clair de la documentation Inkra', imageAltDark: 'Aperçu du thème sombre de la documentation Inkra', imageAltAsync: 'Aperçu du thème clair de la documentation Inkra chargé de façon asynchrone', cardSketch: 'Croquis d’interface', cardSketchBody: 'Organisez navigation, contenu et actions dans un schéma lisible avant les détails.', cardPalette: 'Palette papier', cardPaletteBody: 'Comparez le papier clair, l’encre et les accents de crayon dans une composition réelle.', cardReview: 'Liste de revue', cardReviewBody: 'Vérifiez séparément le clavier, les écrans étroits, le RTL, les animations réduites et l’impression.', cardArchive: 'Archives d’idées', cardArchiveBody: 'Conservez les compositions validées et les questions encore à explorer.', cardAsync: 'Ressource asynchrone', cardAsyncBody: 'À l’apparition de l’image, les éléments suivants se replacent selon la hauteur mesurée.', cardNotes: 'Notes de recherche', cardNotesBody: 'Mélangez résumés courts et textes longs sans modifier l’ordre source.', cardAdded: 'Nouvelle carte', cardAddedBody: 'Le nouveau contenu garde un id stable et rejoint la stratégie active.', apiItems: 'Tableau de données à afficher.', apiGetItemKey: 'Renvoie une key stable et unique pour chaque élément.', apiRenderItem: 'Affiche chaque élément à partir de ses données, index et key.', apiGetItemProps: 'Ajoute attributs, sémantique ou className au conteneur de l’élément.', apiColumns: 'Nombre fixe, ou auto selon la largeur minimale.', apiMinColumnWidth: 'Largeur minimale cible en pixels CSS pour le mode adaptatif.', apiMaxColumns: 'Limite le nombre maximal de colonnes adaptatives.', apiColumnGap: 'Espace horizontal entre les colonnes en pixels CSS.', apiRowGap: 'Espace vertical entre les éléments d’une même colonne en pixels CSS.', apiStrategy: 'shortest utilise la colonne la plus courte ; sequential parcourt les colonnes dans l’ordre source.', apiDirection: 'Définit ltr ou rtl ; sinon la direction calculée du conteneur est utilisée.', apiAnimated: 'Active les transitions de position, désactivées automatiquement avec les animations réduites.',
  },
} as const satisfies Record<DocsLocale, Record<string, string>>;

export type MasonryCopyKey = keyof typeof masonryCopy.en;

export function masonryText(locale: DocsLocale, key: MasonryCopyKey): string {
  return masonryCopy[locale][key] ?? masonryCopy.en[key];
}
