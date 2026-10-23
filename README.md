# Inkra Documentation

[中文](README.zh-CN.md)

Interactive documentation and examples for the Inkra React component library.
This repository owns the playground, search, translations and consumer tests.
Component implementation and API contracts remain in inkrajs/inkra.

This revision installs the published `@inkra/react@0.2.0` package from npm.
library-candidate.json records its registry source, exact source commit,
SHA-256 and SHA-512. Build checks the public archive and installed dependency
against those hashes; it does not use a source alias.

## Local Development

For the published release, no sibling library checkout or vendor archive is needed:

```sh
npm ci
npm run build
npm run dev -- --port 4180
```

To preview library changes that are not published, follow
**Prepare An Unpublished Candidate** below.

## Local Routes And Page Actions

The brand links to `/`, a half-viewport introduction and interactive component
gallery, including Breadcrumb, Calendar and JourneyMap. Samples have their own
content layouts, not mandatory card headers and footers.
Drafts, tasks, text settings, favorites and dialog edits stay in page memory;
theme and language reuse the site's persistent preferences. `/blog` and
`/ecosystem` remain empty shells. Documentation lives under `/docs`, starting
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

In an inkrajs/inkra checkout:

```sh
npm ci
npm run build
npm run check:package
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

For a reproducible candidate, run the product package check with
`GITHUB_SHA=$(git rev-parse HEAD) npm run check:package`.
Rebuild the product and prepare again after library edits; there is no implicit
source link. Review and commit the exact revision, integrity and lockfile together.

## Checks And Publication

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

`verify-text-first-paint.mjs` checks first-frame pencil lettering on desktop and
mobile, delayed fonts, runtime Latin glyph reuse, parameter invalidation,
offscreen deferral and readable canvas-failure fallback. The font is preloaded;
there is no pre-rendered alphabet asset or page-wide text loading gate.

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

Every API row includes a Chinese and English property description; the contract
test checks coverage as APIs grow. Layout primitives have their own navigation
category and interactive pages. Textarea supports near-limit or always-visible
remaining/fraction/progress indicators and an optional pencil resize handle.
Selection stays native without hiding editable text or doubling painted glyphs.
Regression checks include `verify-textarea-selection.mjs`, `verify-layout.mjs`
and `verify-tree-timeline.mjs`.

Build checks the candidate, TypeScript, Vite and static route entrypoints.
Push, PR and manual CI install a pinned registry release directly. For a local
candidate they rebuild the exact product commit in library-candidate.json and
reject archive or lockfile drift. Both paths run installed-package browser smoke
checks. This workflow does not publish npm or deploy the website.

With the local dev server running on port 4180, run `npx playwright install
chromium` and `npm run test:browser`. This covers selected sidebar, Select, Input
and InputNumber interactions at desktop/mobile sizes, not the full component
catalog or browser hydration. Additional `scripts/verify-*.mjs` checks are
historical regressions and may need updates as the docs evolve.
Set INKRA_DOCS_URL to run the browser smoke suite against another local port
without interrupting an existing documentation server.

Local smoke checks run sequentially. CI runs at most two independent checks
against the same server; it does not start a server for each check. A failure
stops new checks and waits for active checks to close their browsers. The full
catalog scan follows actual sidebar links while reusing the application shell.

Public hosting is owned by inkrajs/inkrajs.github.io. Its release.json pins this
repository's exact commit; its Pages workflow builds this application once at
the host root. The homepage is / and documentation is /docs. Build emits real
HTML entrypoints for every documented route and its legacy alias, so Pages
direct refresh works without a 404 redirect hack. Trailing slashes normalize
in the client. Website deployment and npm publication remain separate workflows.

Run `node scripts/verify-homepage.mjs` against the local server for homepage
interaction checks and desktop/mobile screenshots in Chinese and English.
Set `BASE_URL` to verify another preview or the deployed website.

## License

MIT for repository code; bundled fonts and library notices retain their terms.
