# Inkra Documentation

[中文](README.zh-CN.md)

Interactive documentation and examples for the Inkra React component library.
This repository owns the playground, search, translations and consumer tests.
Component implementation and API contracts remain in inkrajs/inkra.

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

## Prepare The Unpublished Candidate

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

Build checks the candidate, TypeScript, Vite and static route entrypoints.
Push, PR and manual CI rebuild the exact product commit in library-candidate.json
and reject archive or lockfile drift before running installed-package browser
smoke checks. This workflow does not publish npm or deploy the website.

With the local dev server running on port 4180, run `npx playwright install
chromium` and `npm run test:browser`. This covers selected sidebar, Select, Input
and InputNumber interactions at desktop/mobile sizes, not the full component
catalog or browser hydration. Additional `scripts/verify-*.mjs` checks are
historical regressions and may need updates as the docs evolve.

Public hosting is owned by inkrajs/inkrajs.github.io. Its release.json pins this
repository's exact commit; its Pages workflow builds this application once at
the host root. The homepage is / and documentation is /docs. Build emits real
HTML entrypoints for every documented route and its legacy alias, so Pages
direct refresh works without a 404 redirect hack. Trailing slashes normalize
in the client. This site deployment is not a React 0.1.0 npm release.

Run `node scripts/verify-homepage.mjs` against the local server for homepage
interaction checks and desktop/mobile screenshots in Chinese and English.
Set `BASE_URL` to verify another preview or the deployed website.

## License

MIT for repository code; bundled fonts and library notices retain their terms.
