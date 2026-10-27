# Inkra Documentation

This is the independent inkrajs/docs repository. Preserve current changes.
Use npm and the checked-in lockfile. The `@inkra/react` library is installed from
the public registry at an exact version, or vendor/inkra.tgz for an explicitly
prepared local candidate. Never alias to a sibling source directory.

- Read README.md and library-candidate.json before changing the package.
- Component behavior, types, tokens and design contracts belong to inkrajs/inkra.
- Preserve the bilingual playground and styling during repository setup.
- Every new catalog icon must work in both outline and filled modes, including its installed-package pixel checks in scripts/verify-icon-fill.mjs. Supply iconFilledPaths for silhouettes that cannot be derived safely from an outline; keep per-icon colors configurable rather than hard-coded.
- Build with npm run build; check:candidate verifies archive identity.
- A successful build is not visual or real-device acceptance.
- Do not commit, push, deploy or publish without explicit authorization.
- The user requests parallel work for separable implementation, documentation and verification tasks. Delegate bounded subtasks with explicit file ownership; the main chat must monitor progress, resolve blockers and verify the integrated result. Keep dependent edits sequential and avoid concurrent writes to the same files. Create user-owned Codex chats only when explicitly requested.
