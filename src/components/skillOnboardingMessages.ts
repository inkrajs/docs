import type { DocsLocale } from '../docsLocales';

type SkillOnboardingCopy = {
  heading: string;
  description: string;
  aiGuide: string;
  introduction: string;
  download: string;
  guide: string;
  prompt: string;
  requestLabel: string;
  copy: string;
  copied: string;
  copyFailed: string;
  details: string;
  install: string;
  manualInstall: string;
  followUp: string;
  skillGuide: string;
  routing: string;
  docs: string;
  design: string;
  catalog: string;
  readableDocs: string;
  manual: string;
  button: string;
};

export const skillOnboardingMessages: Record<DocsLocale, SkillOnboardingCopy> = {
  'zh-CN': {
    description: '你出点子，AI 来落笔。', aiGuide: '与 AI 一起开发',
    heading: '让 AI 帮你开始',
    introduction: '把下面这段话发给你正在使用的 AI，它会根据当前项目和运行环境完成接入。',
    download: '备用：下载 ZIP', guide: '阅读接入指南',
    requestLabel: '发给 AI 的话',
    prompt: '请按照这份指南，把 Inkra 接入当前项目，并沿用现有项目结构和主题：\n\n{guideUrl}',
    copy: '复制请求', copied: '请求已复制', copyFailed: '复制失败，请选择上方文字手动复制。',
    details: '手动安装与更多资料',
    install: '需要手动管理技能时，可在项目目录运行以下命令（Node.js 22.20+）。通常交给 AI 读取指南并选择适合当前工具的方式即可。',
    manualInstall: '默认安装到当前项目，由 CLI 处理所选 Agent 的目录。也可使用独立 ZIP；保留完整目录，并避免覆盖已有自定义。',
    followUp: '接好后，直接描述你想做的界面，或发送已有页面让它调整。AI 会按需查阅组件文档和设计规范。', skillGuide: '技能使用说明',
    routing: '入口按需组织独立的组件文档与设计说明，不必预先安装全套。下面的资料供需要直接使用这些能力的开发者查阅。',
    docs: '组件库 skill：有哪些组件、如何选用，以及当前版本的 API、示例、接入和排障。',
    design: '设计 skill：围绕业务需求组织组件、信息层级、状态和交互，沿用项目主题；需要时再设计自定义图标。',
    catalog: 'Skill 能力目录', readableDocs: 'Agent 文档索引', manual: '手动接入', button: '存下一点灵感',
  },
  en: {
    description: 'You bring the idea. Let AI sketch the interface.', aiGuide: 'Build with AI',
    heading: 'Start with your AI assistant',
    introduction: 'Send the request below to your AI assistant. It will adapt the setup to your project and environment.',
    download: 'Alternative: download ZIP', guide: 'Read the setup guide',
    requestLabel: 'Request for your AI',
    prompt: 'Follow this guide to set up Inkra in the current project, preserving its structure and theme:\n\n{guideUrl}',
    copy: 'Copy request', copied: 'Request copied', copyFailed: 'Could not copy. Select the request above and copy it manually.',
    details: 'Manual installation and resources',
    install: 'To manage skills manually, run this command in your project (Node.js 22.20+). Usually your assistant can read the guide and choose the appropriate method for its runtime.',
    manualInstall: 'The CLI installs into the current project by default and handles the selected agent’s directories. An independent ZIP is also available; keep the complete folder and preserve existing customizations.',
    followUp: 'Then describe the interface you want, or ask it to improve an existing page. You do not need to remember component names, install commands or skill names.', skillGuide: 'Skill usage guide',
    routing: 'The entry loads independent component and design guidance as needed; installing the whole set is unnecessary. The resources below are for developers who want to use them directly.',
    docs: 'Component-library skill: discover and choose components, then find version-specific APIs, examples, setup and troubleshooting.',
    design: 'Design skill: compose components, hierarchy, states and interactions for your task while preserving your theme; create custom icons when needed.',
    catalog: 'Skill directory', readableDocs: 'Agent documentation index', manual: 'Set up manually', button: 'Save a little inspiration',
  },
  ja: {
    description: 'アイデアはあなたから。画面づくりは AI と一緒に。', aiGuide: 'AI と開発する',
    heading: 'AI と一緒にはじめる',
    introduction: '次の依頼文をお使いの AI に送ってください。プロジェクトと実行環境に合わせて導入を進めます。',
    download: '別の方法：ZIP をダウンロード', guide: '導入ガイドを読む',
    requestLabel: 'AI に送る依頼文',
    prompt: '次のガイドに従って、既存の構成とテーマを保ちながら、このプロジェクトに Inkra を導入してください：\n\n{guideUrl}',
    copy: '依頼文をコピー', copied: '依頼文をコピーしました', copyFailed: 'コピーできませんでした。上の依頼文を選択してコピーしてください。',
    details: '手動インストールと関連資料',
    install: 'スキルを手動管理する場合は、プロジェクト内で次を実行します（Node.js 22.20 以降）。通常は AI がガイドを読み、実行環境に合う方法を選びます。',
    manualInstall: '標準では CLI が選択した Agent のプロジェクト用ディレクトリに配置します。独立 ZIP も利用でき、フォルダー全体と既存のカスタマイズを保ってください。',
    followUp: '導入後は、作りたい画面や既存ページの改善をそのまま依頼できます。部品名やコマンド、スキル名を覚える必要はありません。', skillGuide: 'スキルの使い方',
    routing: '入口は必要に応じて独立した部品・デザインの説明を読みます。一式の事前導入は不要です。各機能を直接使う場合は以下を参照してください。',
    docs: 'コンポーネント skill：利用できる部品と選び方、バージョンに合う API、例、導入、トラブル対応を案内します。',
    design: 'デザイン skill：既存テーマを保ち、目的に合わせてコンポーネント、情報階層、状態、操作を組み立てます。必要な場合はアイコンも設計します。',
    catalog: 'Skill 一覧', readableDocs: 'Agent 向け文書一覧', manual: '手動で導入する', button: 'ひらめきを残す',
  },
  ko: {
    description: '아이디어는 당신이, 화면은 AI와 함께 그려요.', aiGuide: 'AI와 함께 개발하기',
    heading: 'AI와 함께 시작하기',
    introduction: '아래 요청을 사용 중인 AI에게 보내세요. 현재 프로젝트와 실행 환경에 맞게 연결해 줍니다.',
    download: '다른 방법: ZIP 다운로드', guide: '연결 가이드 읽기',
    requestLabel: 'AI에게 보낼 요청',
    prompt: '이 가이드에 따라 기존 구조와 테마를 유지하면서 현재 프로젝트에 Inkra를 연결해 주세요:\n\n{guideUrl}',
    copy: '요청 복사', copied: '요청을 복사했습니다', copyFailed: '복사하지 못했습니다. 위 요청을 선택해 직접 복사해 주세요.',
    details: '직접 설치 및 참고 자료',
    install: '스킬을 직접 관리하려면 프로젝트에서 아래 명령을 실행하세요(Node.js 22.20+). 일반적으로 AI가 가이드를 읽고 실행 환경에 맞는 방법을 선택하면 됩니다.',
    manualInstall: 'CLI는 기본적으로 선택한 Agent의 프로젝트 디렉터리에 설치합니다. 개별 ZIP도 사용할 수 있으며 전체 폴더와 기존 사용자 설정을 유지하세요.',
    followUp: '연결한 뒤에는 원하는 화면을 설명하거나 기존 페이지 개선을 요청하세요. 컴포넌트 이름이나 설치 명령, 스킬 이름을 외울 필요가 없습니다.', skillGuide: '스킬 사용 안내',
    routing: '진입점은 필요한 컴포넌트와 디자인 안내만 읽으므로 전체를 미리 설치할 필요가 없습니다. 직접 사용할 때는 아래 자료를 참고하세요.',
    docs: '컴포넌트 skill: 사용할 수 있는 컴포넌트와 선택 기준, 버전에 맞는 API, 예제, 연결 방법과 문제 해결을 안내합니다.',
    design: '디자인 skill: 기존 테마를 유지하면서 요구에 맞게 컴포넌트, 정보 구조, 상태와 상호작용을 구성합니다. 필요할 때 사용자 정의 아이콘도 설계합니다.',
    catalog: 'Skill 목록', readableDocs: 'Agent 문서 색인', manual: '직접 연결하기', button: '작은 영감 저장하기',
  },
  fr: {
    description: 'À vous les idées, à l’IA les premiers traits.', aiGuide: 'Développer avec l’IA',
    heading: 'Commencer avec votre assistant IA',
    introduction: 'Envoyez la demande ci-dessous à votre assistant IA. Il adaptera la mise en place à votre projet et à son environnement.',
    download: 'Autre option : télécharger le ZIP', guide: 'Lire le guide de mise en place',
    requestLabel: 'Demande pour votre IA',
    prompt: 'Suis ce guide pour intégrer Inkra au projet actuel, en conservant sa structure et son thème :\n\n{guideUrl}',
    copy: 'Copier la demande', copied: 'Demande copiée', copyFailed: 'Copie impossible. Sélectionnez la demande ci-dessus pour la copier manuellement.',
    details: 'Installation manuelle et ressources',
    install: 'Pour gérer les skills manuellement, exécutez cette commande dans le projet (Node.js 22.20+). En général, votre assistant peut lire le guide et choisir la méthode adaptée.',
    manualInstall: 'Le CLI installe par défaut dans le projet, aux emplacements de l’Agent choisi. Un ZIP indépendant est aussi disponible ; conservez le dossier complet et vos personnalisations.',
    followUp: 'Ensuite, décrivez l’interface souhaitée ou demandez à améliorer une page existante. Aucun nom de composant, de commande ou de skill à mémoriser.', skillGuide: 'Guide des skills',
    routing: 'L’entrée consulte les guides indépendants des composants et du design selon le besoin, sans installer tout l’ensemble. Les ressources ci-dessous permettent de les utiliser directement.',
    docs: 'Skill composants : découvrir et choisir les composants, puis trouver les API de la version utilisée, des exemples, l’installation et le dépannage.',
    design: 'Skill conception : composer les composants, la hiérarchie, les états et les interactions selon votre besoin en conservant le thème ; créer des icônes si nécessaire.',
    catalog: 'Répertoire des skills', readableDocs: 'Index documentaire pour les Agents', manual: 'Installer manuellement', button: 'Garder une idée',
  },
};
