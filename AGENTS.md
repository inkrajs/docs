# Inkra Documentation

This is the independent inkrajs/docs repository. Preserve current changes.
Use npm and the checked-in lockfile. The `@inkra/react` library is installed from
the public registry at an exact version, or vendor/inkra.tgz for an explicitly
prepared local candidate. Never alias to a sibling source directory.

- Read README.md and library-candidate.json before changing the package.
- Component behavior, types, tokens and design contracts belong to inkrajs/inkra.
- Preserve the bilingual playground and styling during repository setup.
- Keep the primary preview at the component's basic usage and defaults, with only necessary labels/content. Order supplements from single capabilities and common options to combinations, custom rendering and boundary cases. Do not prepend a new feature's validation matrix ahead of basic examples; keep advanced features available in controls or later examples and keep displayed source synchronized.
- Every new catalog icon must work in both outline and filled modes, including its installed-package pixel checks in scripts/verify-icon-fill.mjs. Supply iconFilledPaths for silhouettes that cannot be derived safely from an outline; keep per-icon colors configurable rather than hard-coded.
- Build with npm run build; check:candidate verifies archive identity.
- A successful build is not visual or real-device acceptance.
- Do not commit, push, deploy or publish without explicit authorization.
- The user requests parallel work for separable implementation, documentation and verification tasks. Delegate bounded subtasks with explicit file ownership; the main chat must monitor progress, resolve blockers and verify the integrated result. Keep dependent edits sequential and avoid concurrent writes to the same files. Create user-owned Codex chats only when explicitly requested.

## CI decisions for AI agents

- Before creating or updating a PR, follow [the AI CI guide](docs/ai-ci-guide.md). Proactively declare eligible, actually passing local tests when the authorized account, trusted base policy, exact head/base, candidate SHA-256, test groups and tested environment match. Do not wait for a separate user request for each honest declaration within an authorized PR task.
- Run meaningful affected local checks and reuse valid unchanged-input results. Do not repeat a full browser suite just to obtain a waiver, or start optional full browser CI because a declaration exists. Ordinary docs PRs keep their build-only browser policy.
- Include actual commands, results and report links; never invent passes, claim an untested runtime, expand your own authorization, or exempt a failing test. Refresh tests and declarations when bound inputs change.
- Inspect CI's accepted decision and the exact online/locally confirmed lists. Keep mandatory build, type, candidate-identity and report coverage gates. Diagnose rejected requests instead of assuming the declaration skipped a job.
- Wait for required PR checks and the requested merge, sync the checkout, then finish. Do not wait for post-merge runs, repeat full validation, publish npm or deploy the site unless those outcomes were requested.
