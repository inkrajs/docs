# Inkra Documentation

[中文](README.zh-CN.md)

Version 0.12.0 adds DependencyGraph for skill trees, technology trees and synthesis
recipes. It provides automatic layered layout, dependency-path highlighting,
custom node content and normalized connection anchors. Examples include icon
nodes, frameless image recipes and complete Flip cards. NodeGraph and
DependencyGraph viewport controls can be individually hidden or extended with
custom actions.

Browser shards are balanced using recorded timings in `scripts/browser-timings.mjs`
(release run 40398411054). The longest checks start first, with the existing two
workers per shard. Timings affect scheduling only: new checks receive a default
weight, and the report gate still requires every selected check exactly once.
Regenerate timing hints only from retained successful CI reports; a historical
scheduling replay is not a measurement of the next cloud run.

Interactive documentation and examples for the Inkra React component library.
This repository owns the playground, search, translations and consumer tests.
Component implementation and API contracts remain in inkrajs/inkra.

The earlier 0.11.0 release added NumberTicker's optional `animation="morph"` mode:
exact decimal shifts retain fixed-width glyphs, move the decimal point, and
reveal entering zeros with sliding, fading and right-edge clipping. The default
duration is 420ms; ordinary changes use place-aligned rolling, and the existing
count and roll modes remain available. Log's latest-record action is now a compact
floating icon button instead of a full-width footer.

Component pages start with basic usage and progress through common options,
composition, custom rendering and boundary cases. CI supports explicit local-test
confirmations from configured maintainers, bound to the exact commit, candidate,
test group and environment; required package/build and coverage gates remain.
See [the AI CI guide](docs/ai-ci-guide.md) for the declaration workflow.

The earlier 0.10.0 release added CircularSlider and the optional circular Switch appearance.
The slider supports touch and keyboard input, configurable arcs, and icon/text
content in the center; the switch keeps a quiet off-state ring and animates its
accent arc without a thumb. Linear Slider and RangeSlider now reach the track
endpoints by default, with `thumbAlignment="contain"` retaining inset placement.
Xiaolai is the default font, with updated lettering parameters, a scoped plain-text
mode, inherited typography across color themes, and grapheme-safe rendering.
Action and selection washes are softer while retaining the pencil texture.

The documentation adds a searchable 29-font gallery and picker with native-language
specimens, lazy loading and separate settings per font. Theme customization includes
circular controls, remembered custom colors and the Dingxiang, Zhecheng and Tenghuang
palettes. Design standards separate their typography/material sections and compare
outline, filled and multicolor icons. Draft changes stay inside the preview until Save.

The earlier 0.9.0 release introduced Guide (including a distinct skip
action), Loading (six presets, fullscreen slots and rotating tips), four-way
InfiniteScroll with mobile pull-and-release, responsive Masonry, and NumberTicker
digit rolling. Their routes include interactive examples and API documentation;
Loading, InfiniteScroll and Masonry also have five-language accessibility notes.
The InfiniteScroll examples compose actual Loading and Masonry components.
Each new component has an installed-package browser check registered in the
shared suite. Mobile gesture checks use Chromium touch input, not real devices.

This checkout installs the exact public npm release `@inkra/react@0.12.0`.
`library-candidate.json` records its released source commit and archive hashes.
CI and website deployment install that registry version and verify the archive,
lockfile and installed package without a source alias.
Documentation changes do not publish npm packages or deploy the website.

## Local Development

Install the pinned registry dependency, then build and preview:

```sh
npm ci
npm run build
npm run dev -- --port 4180
```

No sibling library checkout or vendor archive is needed for normal development.
Only when testing unpublished library changes, use the separate candidate
procedure below before installing dependencies.

## Local Routes And Page Actions

The brand links to `/`, a half-viewport introduction and interactive component
gallery, including Breadcrumb, Calendar and JourneyMap. Samples have their own
content layouts, not mandatory card headers and footers.
Drafts, tasks, text settings, favorites and dialog edits stay in page memory;
theme and language reuse the site's persistent preferences. `/blog` lists project
stories with individual article pages; `/ecosystem` is an empty resource page.
Documentation lives under `/docs`, starting
at `/docs/getting-started`; previous root-level documentation URLs remain
compatible and normalize to the new prefix. Header navigation uses real links
with the shared pencil selection and focus styling.

Page actions copy, preview or download the current documentation view as
Markdown. Examples export their initial sample code, not live form values.
The four assistant entries open v0, ChatGPT, Claude or Scira in a new tab and
copy documentation for the user to paste. They do not send local URLs or input
values to those services. Clipboard failures expose selectable Markdown.
Destination/prompt checks use intercepted calls, not authenticated AI sessions.

## Prepare An Unpublished Candidate

This optional procedure replaces the registry dependency with a verified local
archive. In an inkrajs/inkra checkout at the source revision you want to test:

```sh
npm ci
npm run build
GITHUB_SHA=$(git rev-parse HEAD) npm run check:package
```

Then, in this repository:

```sh
npm run prepare:library -- /path/to/inkra
npm run build
npm run dev -- --port 4180
```

Preparation verifies the product manifest SHA-256, copies the ignored archive
to vendor/inkra.tgz, records library-candidate.json and installs it. Review
candidate metadata and lockfile changes together. npm ci needs that archive
first; never substitute an unverified registry package with the same name.
CI can pass `--lockfile-only` after the checkout path, then run `npm ci` once.
This option prepares the archive and lockfile without installing node_modules;
the default local preparation still installs the candidate.

For a reproducible candidate, run the product package check with
`GITHUB_SHA=$(git rev-parse HEAD) npm run check:package`.
Rebuild the product and prepare again after library edits; there is no implicit
source link. Review and commit the exact revision, integrity and lockfile together.

## Checks And Publication

The Start navigation has separate `/docs/internationalization` and `/docs/theming`
pages. Getting Started stays focused on installation. The language page uses the installed InkraProvider with
English, Simplified Chinese, Japanese, Korean and French dictionaries. The docs
language controls expose those same five locales, persist the selected locale,
and pass it to library defaults. Navigation, shared playground controls and the
Getting Started, Internationalization and Theming pages have translated copy.
The rest of the reference catalog is not fully translated: registered messages
fall back to English, and older bilingual examples retain their existing copy.
Do not describe these entries as complete five-language reference documentation.
Developers can override typed message keys globally or in nested providers;
explicit component copy wins, and application text and submitted values are unchanged.
`node scripts/verify-i18n.mjs` checks five-language switching, custom messages,
portals, retained input/selection, regional date and exact-bigint formatting,
painted text and 1543/1305/390/320px layouts against the installed candidate.
`node scripts/verify-docs-locales.mjs` checks actual site language menus,
provider inheritance, persistence, preserved drafts and responsive navigation.
These provider APIs are included in the published 0.5.0 release.

The theme page uses the installed `ThemeProvider` from `@inkra/react/theme`.
It demonstrates local light/dark/system modes, palette variables and icon weight,
plus the same text, line and fill controls used by the site customizer, and composition
with the language provider. Both entries share the parameter definitions. `node scripts/verify-theme-provider.mjs`
checks scoped inheritance, portal updates, retained drafts, system/forced colors,
navigation and narrow layouts. Both provider demos reuse `ComponentPlayground`:
preview/code tabs, adjacent properties on wide containers, and a settings toggle
on narrow containers. No redundant section title repeats the page heading.
It also checks real pencil-pixel changes for each material group and long
internationalization paragraphs at Retina resolution. Empty searchable-select
clear slots collapse without changing the control's outer dimensions.

Primary playgrounds show the component and necessary labels, without demo-only
debug outputs, helper prose or form actions. Advanced composition and native
submit/reset examples remain below. `verify-minimal-playgrounds.mjs` checks ten
representative pages in both locales; the AST contract guards playground children
without hiding component-owned validation or accessibility feedback.

Breadcrumb links default to the pencil-underlined link appearance and accept
logical start/end icons. Page, link and dropdown-trigger items share header-safe
text, icon, padding, gap and baseline geometry without hover movement. The
composition example uses the installed DropdownMenu and ContextMenu for selection,
right-click, keyboard menu keys and optional touch long press.
`node scripts/verify-breadcrumb.mjs` covers those contracts plus RTL, constrained
long paths and stable header geometry; it is an installed-package browser check.

Editable defaults to plain clickable text and supports built-in Input, Textarea
and dropdown/searchable/stepper Select editors. Text actions occupy the existing
right action slot; multiline Enter inserts a line and Ctrl/Command+Enter saves.
`verify-editable-builtins.mjs` covers shared surfaces, focus, portals, validation
and async saves on desktop and narrow screens using the installed candidate.

Markdown shares Inkra typography, Checkbox task states, pencil list markers,
links, quotes, separators and Table, and renders actual accessibility guidance.
Its examples show emphasis, inline/block code and structured content separately.
Inline links keep the surrounding text baseline, with decorative underlines out
of flow. Code blocks reuse the getting-started Card treatment with a language
header, pencil syntax coloring, and a localized copy action. Inline code uses a
clipped theme-pigment wash seeded by its content, stable across rerenders.
Selected navigation text and icons use the theme's on-accent foreground;
`verify-nav-foreground.mjs` compares them with the design-standard samples.
Task checkboxes and text occupy
separate columns, and deletion marks follow the real wrapped lines.
`verify-markdown.mjs` checks rendering, safe URLs, stable focus, local scrolling,
painted pixels and forced-color/print fallbacks. `verify-pencil-emphasis.mjs`
compares actual regular/bold/italic/combined glyph pixels and cache invalidation.

PanZoom defaults to a gentle wheel step of 0.001; wheelStep configures sensitivity
without changing touch pinch or keyboard zoom. verify-pan-zoom-speed.mjs checks
actual wheel deltas, modifiers, boundaries and controlled reconciliation.
The icon catalog has 290 pencil-rendered icons, including editing, devices,
tools, weather, file states, media, navigation and game rewards.
Catalog paint is mounted only for the visible scroll window, its two-row buffer
and focused items. Offscreen buttons retain accessible names and fixed-size
empty icon slots; scrolling never swaps pencil glyphs for plain SVGs.
`verify-icon-performance.mjs` guards canvas bounds, stable native focus/clicks,
scrolling, search and preview-only edits. `measure-icon-page.mjs` reports three
fresh-context runs; timings are local development measurements, not production SLAs.
verify-icon-expansion.mjs checks paths, painted pixels, bilingual search and
desktop/narrow layouts against the installed candidate.
PencilIcon defaults to an independent 1.5 stroke weight and full intensity.
It accepts strokeWidth and intensity overrides and inherited
--inkra-icon-stroke-width / --inkra-icon-intensity tokens. verify-icon-stroke.mjs
checks actual pixels, composed badges, cache reuse, bounds and live controls.
The nine-icon preview uses a 16-128px size slider. Pressure and gap strength are
independent; breakCount is a maximum limited by displayed stroke length, so
larger icons may have more gaps while short strokes stay readable. DPR does not
change the count. The short-stroke check measures actual width and gap pixels.
The published icon component also provides outline/filled variants, independent
fill colors and authored multi-region silhouettes. The icon page displays both
variants and editable folder colors; the catalog has its own appearance switch.
`node scripts/verify-icon-fill.mjs` checks every catalog entry in both variants,
transparent holes, overlapping shapes, colors, cached round trips and RTL badges.
New catalog geometry must satisfy this dual-variant contract. The published
archive identity is recorded in library-candidate.json.
The catalog includes 47 authored multicolor presets, primarily two semantic
regions with restrained pencil texture. Region colors inherit the theme and
can be overridden independently; unsupported icons keep their monochrome fill.
`verify-icon-color-paths.mjs` checks all presets at small/large sizes, light/dark
themes, custom colors and reset. `verify-icon-color-docs.mjs` checks the actual
gallery controls and localized labels; `verify-icon-scroll.mjs` checks visible
paint continuity during scrolling.
verify-palette-softness.mjs checks all four palettes in both themes, sampled
foreground contrast over the rendered pencil backgrounds and narrow layouts.

Tabs keeps native horizontal scrolling by default. Optional menu overflow retains
the selected tab when it fits, while optional edge buttons only scroll the strip.
`verify-tabs-overflow.mjs` covers controlled selection, focus, resize, changing
labels/items, RTL and system colors. `verify-tabs-overflow-docs.mjs` exercises the
localized controls and examples against the installed package.

Empty includes eight theme-aware pencil illustrations, responsive preset sizes and
custom visual slots. `verify-empty.mjs` checks distinct rendered pixels, localized
controls, narrow containers, accessible names, canvas loss and SVG fallbacks in
forced colors and print against the installed candidate.

Toast supports nine independently managed positions and interchangeable card/compact
appearances. `verify-toast.mjs` checks per-position limits and timers, pause isolation,
updates, async notifications, keyboard focus, swipe dismissal and responsive layouts.
`verify-toast-docs.mjs` exercises localized placement/style controls, the position grid
and multi-queue example against the installed candidate.

The header theme customizer uses the installed Drawer, Tabs and Slider components.
Theme mode, palette, lettering, stroke and fill edits affect only the preview Card until
Save applies them globally and persists them locally. Cancel, Escape and closing
discard drafts; Reset changes only the draft until saved. A separate divider
separates the preview from settings. Tokens affect actual library canvas renderers
without remounting the page. Storage failure is reported while the saved changes
still apply for the current session. The usage-guide task example uses Card, Badge, Checkbox,
ToggleGroup, Progress and Empty, with shared light/dark sample state.

Browser smoke checks include `verify-docs-spacing.mjs` and
`verify-theme-customizer.mjs`. Spacing checks measure actual element boundaries,
not just individual padding values: heading and standalone dividers own their
20px trailing space, and content must not add another top gap. Customizer checks
cover draft isolation and zero background canvas redraws on preview/close,
save/cancel/reset, border/icon/fill pixel changes, persistence, storage failures, focus return,
forced colors, responsive headers and the task-list interactions.

`node scripts/verify-property-extensions.mjs` checks Tree indentation and state
rendering, Pagination display controls, Rating hover and native form reset,
Alert dismissal, and Skeleton reduced-motion behavior. It uses one browser and
the installed candidate, then captures both locales at desktop and narrow sizes.

`verify-text-first-paint.mjs` checks first-frame pencil lettering on desktop and
mobile, delayed fonts, runtime Latin glyph reuse, parameter invalidation,
offscreen deferral and readable canvas-failure fallback. Font faces load when
used; Xiaolai's common and extended characters are separate resources.
There is no pre-rendered alphabet asset or page-wide text loading gate.

The design standard's font gallery searches the shared 29-font catalog and
loads specimens only as they become visible in its horizontal list. Each font
uses its own lettering preset and inherits the plain/pencil text setting.
Successful loads are reused by the gallery and theme customizer; failed loads
can be retried. Optional fonts currently download one complete WOFF2 per font.
`node scripts/verify-font-gallery.mjs` checks loading, search, retries, cache
reuse and desktop/mobile layout.

The gallery and customizer prioritize fonts for the current interface language,
without changing the saved font. Search accepts font names and language names.
Caveat, Patrick Hand, Kalam and Handlee offer distinct English/French handwriting;
Japanese choices include Yomogi, Klee One, Yuji Syuku, Yuji Mai and Hachi Maru Pop.
Korean choices include Gaegu, Nanum Pen Script, Nanum Brush Script, Hi Melody
and Single Day. Specimens use verified native
glyphs and carry their language tag. French accents and ligatures are checked
against the font cmap; unsupported characters in application text still use the
fallback stack. Each optional font retains its OFL license and pinned source in
public/fonts/theme. Xiaolai's extended face loads when the specimen needs it.

API documentation shares the installed Inkra Table and PencilText components.
Code examples share a Prism-tokenized pencil CodeBlock, with theme-aware syntax
colors and unchanged selectable/copyable source. `verify-docs-code.mjs` checks
both API layouts, source fidelity, escaping, dark/mobile layouts and forced colors.
Standalone Getting Started snippets use Card headers with language icons/names
and copy actions. `verify-code-samples.mjs` checks copying, denied clipboard access
and narrow-screen layout without adding duplicate headers to playgrounds.

Editable lettering paints synchronously through a private offscreen buffer and
bounded per-editor glyph cache. Committed text keeps its pencil texture during
IME composition; the preedit range uses native-style underlined text. The native
control retains input, caret and selection ownership. Chromium protocol tests in
`verify-editable-composition.mjs` cover commit/cancel/replacement, controlled and
uncontrolled values, pixel stability and forced-color fallback. These are not
automated acceptance of the macOS system candidate window.

ColorPicker, Upload and Transfer have installed-package regression fixtures in
`scripts/fixtures`. Their `verify-*-refinement.mjs` checks cover native/external
form reset, color normalization, composition, keyboard focus, upload cancellation,
narrow containers and delayed controlled transfers. `verify-refinement-docs.mjs`
also exercises the actual bilingual examples and API tables, including RTL/native
text fallback and restoring pencil lettering without retaining stale canvas width.

Slider and RangeSlider share cancel-aware form reset with consistent submitted,
accessible and displayed values. `verify-slider-refinement.mjs` checks native,
external, canceled and controlled resets plus input events and range constraints.
`verify-rating-refinement.mjs` covers pencil focus, pointer-to-keyboard continuity,
internal scrolling and off-grid maximum values. `verify-numeric-controls-docs.mjs`
checks the bilingual examples, actual API rows and desktop/narrow screenshots.

Selection controls and ChoiceGrid use pencil focus with native keyboard/form
semantics. `verify-selection-refinement.mjs` covers cancel-aware reset, controlled
values and changing external form owners. `verify-choice-grid-refinement.mjs`
covers option lettering, native choices and container-responsive columns.
`verify-selection-controls-docs.mjs` checks real bilingual examples, form values,
focus pixels and desktop/narrow screenshots using the installed archive.

Tabs and Accordion have installed-package checks in `verify-tabs-refinement.mjs`
and `verify-accordion-refinement.mjs`: controlled retries, keyboard navigation,
retained panel state, collapsed focus exclusion and system-color fallbacks.
`verify-disclosure-docs.mjs` exercises preserved input drafts in both locales at
desktop and narrow widths. `verify-layout-style-sync.mjs` checks live stylesheet
order, retained mirror nodes, link relation changes and subtree cleanup without
continuous idle invalidation. These bounded checks do not establish that every
reported browser crash is resolved.

`verify-initial-theme-ink.mjs` compares real lettering/icon canvas pixels with
computed foreground colors on saved dark loads and light/dark switches, with and
without reduced motion. Reduced motion disables transitions completely; only
CSS animations retain a minimal completion tick for presence primitives.

Modal and Command regressions use `verify-drawer-refinement.mjs`,
`verify-alert-dialog-refinement.mjs` and `verify-command-refinement.mjs` against
the installed package. They exercise short-view content and action reachability,
RTL centering, safe initial focus, pencil editing, IME and keyboard behavior.
`verify-modal-docs.mjs` checks live localized Drawer save/cancel feedback,
asynchronous confirmation and composed Command focus return at desktop/narrow sizes.
The Drawer sample saves only in preview memory; it does not persist remote data.

DataTable, Log and Pagination have installed-package regression fixtures in
`verify-data-table-refinement.mjs`, `verify-log-refinement.mjs` and
`verify-pagination-refinement.mjs`. They cover pencil text/focus, distinct sort
directions, controlled pagination retries and bounded correction callbacks,
empty results, narrow custom labels, natural sizing, RTL and forced colors.
The Log playground grows with its records by default; its optional bounded mode
scrolls records independently. The latest action occupies a separate footer.
Very short containers can scroll the entire Log to keep controls reachable while
retaining a usable record viewport. `verify-content-docs.mjs` exercises localized
table selection/filtering, natural/bounded logs and changing pagination totals,
with desktop/narrow screenshots and internal geometry checks.

Every API row includes a Chinese and English property description. Contract tests
check coverage as APIs grow and reject invented media APIs. AudioPlayer, Carousel and ImageViewer
have installed-package fixtures in `verify-audio-player-refinement.mjs`,
`verify-carousel-refinement.mjs` and `verify-image-viewer-refinement.mjs`.
These cover stable media callbacks, controlled settings, container-responsive
slides, pencil focus, RTL tools and same-id source recovery. `verify-media-docs.mjs`
exercises the live localized examples, a generated WAV, real project actions,
loaded image assets and desktop/narrow screenshots using one browser worker.

ImageViewer now fills the viewport without a visible title bar. `MediaViewer`
is the same public component under a resource-oriented name and supports mixed
image/video items. The local video example is generated from public repository
artwork by `node scripts/generate-viewer-video.mjs` (requires ffmpeg); it uses no
remote media. `verify-media-viewer-video.mjs` covers real playback and cleanup,
while `verify-media-viewer-layout.mjs` checks decoded pixels and reachable controls
at desktop, narrow and short viewport sizes. `verify-pan-zoom-drag.mjs` exercises
pointer and touch movement immediately after fitting, without first zooming in.
These are local Chromium checks, not real-device acceptance or arbitrary-file support.

Layout primitives have their own navigation
category and interactive pages. The Layout notebook offers full-width headers,
shared-column brand/navigation headers,
full-height sidebars, split headers on either side, right navigation, two sidebars
and a header/content/footer composition. Its 390/768/1024/1920px preview scales to the available width
and height; content scrolls inside the workspace while the header and footer
remain visible. Compact navigation offers an overlay drawer, full-page navigation,
partial push or full-page push. Push modes do not dim content by default; the
backdrop is independently configurable. The mobile example enables the library's
optional `Layout.Root.swipeNavigation`: swipe inward from the sidebar edge to open,
or back toward that edge to close. Release commits at 48 local CSS pixels;
`side`, `edgeWidth` and `threshold` are configurable. Inputs, horizontal scrollers,
multitouch and vertical scrolling are excluded; custom tools can use
`data-layout-swipe-ignore`. Button and Escape navigation remain available.
`verify-layout-gestures.mjs` uses Chromium touch input, not a real device.
`verify-layout-sidebar.mjs` covers these compositions, resizing,
disclosure focus/keyboard behavior, RTL and local scroll boundaries.
`verify-layout-header.mjs` checks equal navigation padding and aligned icons,
unframed header actions, and stable first/second-level breadcrumb text when a
current page becomes a link. Long header paths scroll within their own region.
`Layout.Root.sidebarWidth` shares a column between `Layout.Header.sidebar` and
an inherited-width `Layout.Sidebar`. The brand/navigation example synchronizes
that column with resizing and collapse; its header divider uses the same muted,
inset pencil treatment as Tabs. `verify-layout-shared-header.mjs` exercises
pointer and keyboard resizing, collapse restoration, live tabs and narrow/RTL
layouts. Layout examples and API are split into its six actual subcomponents.
Other compound pages use the same `ApiGroups` renderer with stable deep links;
`verify-api-groups.mjs` checks reload, history navigation and narrow layouts.
The documentation shell itself now consumes `Layout.Root`, `Layout.Header`,
`Layout.Body`, `Layout.Sidebar` and `Layout.Content`. Its brand and navigation
share the sidebar width; only site content and responsive placement remain in
docs CSS. The mobile directory stays outside the Layout containment and inert
background, preserving viewport positioning and focus return. Header actions
use ghost buttons, while homepage controls retain their existing appearance.
`verify-docs-layout.mjs` checks shared geometry, sticky scrolling, width changes,
search and drawers from 320px to 1543px.
The sidebar uses Resizable with a shared 200-360px header boundary. On mobile,
navigation tabs replace the brand row and a search icon opens a full-screen
search interface; `verify-mobile-search.mjs` covers focus, results and dismissal.
Textarea supports near-limit or always-visible
remaining/fraction/progress indicators and an optional pencil resize handle.
Selection stays native without hiding editable text or doubling painted glyphs.
Regression checks include `verify-textarea-selection.mjs`, `verify-layout.mjs`
and `verify-tree-timeline.mjs`.

Tree and floating controls have installed-package checks in
`verify-tree-refinement.mjs`, `verify-menu-refinement.mjs` and
`verify-floating-refinement.mjs`. They cover deep narrow trees, pencil focus,
long menu labels, nested RTL menus, short-view floating bounds and system-color
fallbacks. `verify-floating-docs.mjs` checks the live native-menu exclusion sample,
editable content, action feedback, Popover focus return and localized Tooltip
directions. Native menu checks assert that browser defaults are not prevented;
they do not automate the operating system menu itself.

Build checks the candidate, TypeScript, Vite and static route entrypoints.
Push, PR and manual CI install a pinned registry release directly. For a local
candidate they rebuild the exact product commit in library-candidate.json and
reject archive or lockfile drift. Ordinary PR and main-push CI only validate the
package identity and production build; they do not run contract or browser tests.
`npm run build` does not run tests implicitly. Run `npm run test:contracts`
separately when needed. This workflow does not publish npm or deploy the website.

For browser validation, manually run the workflow with `run_browser` enabled
(off by default). That run also executes contract tests and the full browser suite.
A passing ordinary build is not browser-interaction acceptance.

With the local dev server running on port 4180, run `npx playwright install
chromium` and `npm run test:browser`. This covers selected sidebar, Select, Input
and InputNumber interactions at desktop/mobile sizes, not the full component
catalog or browser hydration. Additional `scripts/verify-*.mjs` checks are
historical regressions and may need updates as the docs evolve.
Set INKRA_DOCS_URL to run the browser smoke suite against another local port
without interrupting an existing documentation server.

Local smoke checks run sequentially. Optional browser CI prepares the candidate and build once,
then distributes the browser suite across four independent runners, with at most two
checks per runner. Each runner shares one server. Set `BROWSER_SHARD=1/4` to run
one shard, or use `node scripts/browser-smoke.mjs --list` to inspect its plan.
Release validation adds the homepage with `BROWSER_INCLUDE_HOMEPAGE=true`.
The suite completes every check and reports failures together; a stuck check
has a ten-minute deadline with child-process cleanup. Per-check timings, errors
and logs are saved in .ci-results and CI step summaries. Failed runs also retain
available screenshots and the Vite log for 14 days.

The required `docs` job requires a successful build. Only when browser validation
is explicitly requested does it also reject failed/skipped browser jobs, missing
or duplicate shard reports, a mismatched suite digest and incomplete/failed checks. Rerun failed
jobs to replace failed shard reports while retaining successful shards and the
prepared input artifact. An artifact from the build job alone is not browser
acceptance. Superseded PR runs are cancelled; main runs are not.
The full catalog scan follows actual sidebar links while reusing the application shell.

The component-aware selection tooling remains available for targeted checks,
but ordinary PR/main CI does not create a browser plan or launch browser runners.
Explicit manual browser runs use a full plan. When selection tooling is used,
component/helper dependencies select their owning checks; shared or unknown changes
conservatively select the full suite. A selection starts only
`min(4, selected checks)` browser runners; a trusted zero-check plan starts none.

For optional browser runs, the build uploads the JSON plan as the single source of truth. Every shard report
records its plan digest, tested revision, full-suite digest and selected-suite
digest. The final `docs` gate reloads that plan against its own checkout and current
suite, then rejects stale identities, missing or duplicate shards/checks, unplanned
results, incomplete checks and any failure. Skipped checks are listed as skipped;
they are never reported as passing. `npm run test:browser` without a plan remains a
full local suite.

Public hosting is owned by inkrajs/inkrajs.github.io. Its release.json pins this
repository's exact commit; its Pages workflow builds this application once at
the host root. The homepage is / and documentation is /docs. Build emits real
HTML entrypoints for every documented route and its legacy alias, so Pages
direct refresh works without a 404 redirect hack. Trailing slashes normalize
in the client. Website deployment and npm publication remain separate workflows.

Run `node scripts/verify-homepage.mjs` against the local server for homepage
interaction checks and desktop/mobile screenshots in Chinese and English.
Set `BASE_URL` to verify another preview or the deployed website.

ColorSwatch is shared by the icon playground, theme customization and ColorPicker
presets. ColorPicker supports inline, compact, popover and swatches presentations.
ColorSwatch lives with form inputs; primary color previews omit demo-only status
text. `allowGradient` opts into structured linear, radial, conic and repeating
gradients, editable stops and geometry. `formatColorPaint` serializes CSS/form
values; arbitrary CSS gradient parsing is not supported. `maxStops` limits new
stops without truncating imported values. `verify-color-gradients.mjs` checks the
installed editor and its controlled, form, disabled and responsive contracts.
`verify-color-presentations.mjs` exercises both locales, keyboard selection,
controlled rejection, external form reset, focus return, disabled state, real
pigment pixels, light/dark, forced colors and narrow/short RTL layouts using the
installed package. `verify-color-picker-refinement.mjs` retains the input/IME and
reset regression checks. These are local Chromium checks, not device acceptance.

## License

MIT for repository code; bundled fonts and library notices retain their terms.
