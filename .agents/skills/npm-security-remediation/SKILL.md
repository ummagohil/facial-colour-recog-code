---
name: npm-security-remediation
description: Remediates Dependabot alerts and npm audit findings in facial-colour-recog-code. Use to trace affected npm dependencies, apply targeted upgrades, and verify the lockfile and application before GitHub review.
---

# Remediate npm dependency vulnerabilities

1. Work from the repository root. Check Git status and preserve existing edits. Read the root package.json, package-lock.json, and any npm or runtime configuration. Use the Node.js 24 LTS line selected in .nvmrc. Run `nvm install` and `nvm use` if needed. GitHub Actions reads the same file. Record the exact Node and npm versions used.
2. Record the Dependabot advisory ID, affected manifest, vulnerable range, patched range, and dependency path when available. Run `npm audit --json` and `npm audit --omit=dev --json` to capture the full and production-only baselines. Distinguish audit findings from registry failures. Use `npm explain <package>` on an installed tree and inspect the lockfile for every affected copy.
3. Apply the smallest compatible patched version. Update direct dependencies in their existing dependency group. For transitive dependencies, prefer an in-range lockfile update or a targeted upgrade of the parent package. Consider a narrowly scoped npm override only if the parent has no compatible fix and tests can verify the override. Generate lockfile changes with npm. Avoid `npm audit fix --force` and broad version bumps. Check migration notes if a breaking upgrade is required.
4. Try `npm ci` for the baseline and again after updating. If npm reports a peer conflict, inspect the actual versions and constraints. The current react-day-picker 8.10.1 declares peer ranges that exclude React 19 and date-fns 4. Prefer a compatible resolution if it fits the task. The project .npmrc records the existing legacy peer workaround so local npm and CI resolve the tree consistently. Revisit it when the peer conflict is resolved and verify a plain clean install before removing it.
5. Run `npm test -- --run` and `npm run build`. The build script selects webpack. The current `lint` script calls `next lint`, which Next.js 16 removed. Report that baseline limitation unless a working lint command has since been added. For changes that touch rendering or framework behavior, use the existing tests or a mocked response to check the expression-to-colour flow.
6. Repeat both audits, check the resolved versions against the advisory's affected range, and review the manifest and lockfile diff for unrelated changes. Report advisory IDs, resolved versions, commands and results, remaining findings, and any checks blocked by tooling or network access. For a GitHub PR, include the generated lockfile with any manifest changes and confirm the alert's status after the fix reaches the default branch if GitHub access is available.

## Review a Dependabot pull request

- Check the advisory, base branch, and manifest and lockfile diff. Confirm every affected dependency path resolves outside the vulnerable range.
- Check the **npm CI / Install, test and build** job. If it fails, reproduce the same commands locally with the project Node version and diagnose whether the failure is already present on the base branch.
- Report the advisory, installed versions, CI result, and any remaining exposure in a PR-ready summary. For a failed upgrade, propose the narrowest verified follow-up and leave the merge decision to the maintainer.
