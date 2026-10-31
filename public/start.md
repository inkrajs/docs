# Start with Inkra

Help the user adopt or use Inkra in their project. Choose the relevant instructions yourself; the user need not learn skill names or installer commands.

## 1. Establish the context

- Identify the active agent from explicit runtime instructions, a native catalog or documented runtime metadata. Do not infer it from an editor name, repository folder or installed agent directory. If uncertain, use reference-reading mode below.
- When repository access is available, inspect its instructions and existing changes. If this runtime can only read URLs, use reference-reading mode and answer the question without claiming project inspection or installation. Find the workspace root, intended monorepo application, framework, package manager and lockfile. Establish the actual `@inkra/react` version from the installed package and lockfile; distinguish it from declared ranges, latest releases and documentation snapshots.
- A request to “follow this guide to set up Inkra in this project” authorizes project-local entry-skill setup and the minimal application integration needed for that goal. A question or a request to inspect the guide is read-only. Reading this page alone does not authorize installation, dependency upgrades, global changes or publication.

## 2. Load only what the task needs

Start with an already available `inkra` skill, if present. Otherwise read [the entry instructions](skills/inkra/SKILL.md). Discover supporting guidance through [the skill registry](skills/registry.json): component discovery and APIs use `inkra-docs`; composition, states, layout and appearance use `inkra-design`. Load relevant references only, and return to the user's task. Reuse already-read instructions and completed setup steps: an entry pointing back here does not restart bootstrap. Do not install the whole collection.

Resolve links against each fetched document URL, including registry URL fields and skill references. Keep these lookups on the explicit documentation origin supplied by the user, including a preview or mirror; generic production links in skill text must not redirect this bootstrap. Never guess a localhost port. Use [the agent documentation index](llms.txt) for component facts. If an endpoint is missing, disclose the gap and use available local instructions/types or public documentation.

## 3. Make the entry discoverable when supported

For authorized setup, use documented native skills support. Reuse an existing `inkra` installation and preserve customizations. Installing the entry does not require supporting skills or an `@inkra/react` upgrade.

Prefer the general [skills CLI](https://github.com/vercel-labs/skills/blob/main/docs/commands.md) when its prerequisites are available (currently Node.js 22.20+). This CLI prerequisite is separate from the library and application prerequisites; inspect those independently. Run from the intended project scope, not your home directory. Resolve the entry's `downloadUrl` from the same-site registry, then use:

```text
npx skills add <resolved-entry-download-URL> --skill inkra --agent <verified-agent-ID> --yes
```

Replace the placeholders with verified values: for example, the CLI identifiers are `codex` and `claude-code` for those respective runtimes. Select only the entry and active agent; omit global/all-agent options. The CLI defaults to project scope and may create shared content plus runtime links. The alternative official repository source is `inkrajs/inkra`; verify availability rather than assuming unpublished skills exist remotely.

Alternatively, fetch the same-site entry ZIP into a temporary directory, inspect its contents and extract the complete skill into a verified project skills directory. The archive contains `inkra/SKILL.md`; for Claude Code the result must be `.claude/skills/inkra/SKILL.md`, without a second nested `inkra` folder. Reject archive paths escaping the destination, unsafe links and collisions with existing custom files. Do not overwrite an existing customized skill, install a runtime or execute a downloaded shell script just to finish this step.

Verified native locations:

- **Codex:** project `.agents/skills/inkra` ([official guidance](https://learn.chatgpt.com/docs/build-skills)).
- **Claude Code:** project `.claude/skills/inkra` ([official guidance](https://code.claude.com/docs/en/skills)); the CLI may link this to shared `.agents/skills/inkra` content.
- **Other agents:** use their current official native-skill instructions and a verified CLI agent identifier. Do not create every possible agent directory or change global skill locations.

Verify installed files and native discovery separately. Use a supported reload if needed, without requiring a new conversation by default. Read the installed instructions and continue even if refreshed native discovery cannot be confirmed; report that limit.

If native skills or installation tools are unavailable, read the same-site entry and relevant supporting instructions directly and complete the current task. Say that this guidance was loaded for this conversation, and that persistent discovery in future conversations has not been installed. Remote reading is not a native installation.

## 4. Complete the requested integration

Use the application's existing structure, theme and package manager. Choose APIs compatible with its installed Inkra version. If the library is missing and integration was requested, use the version-aware setup guidance to add the package and required styles in the correct workspace, then implement the smallest useful example matching the user's goal. Do not upgrade an existing package merely because newer documentation exists.

Preserve unrelated files and local changes. Use proportionate checks and reuse valid results. Report the result, changed application/skill files, package version and verification limits. Advice-only requests require no installation or edits.
