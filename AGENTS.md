为 Xiaoya 编写或修改演讲、报告、页面标题、卡片和说明文字前，必须读取并执行
`/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/.codex/skills/de-ai-writing/SKILL.md`。
她指出新的 AI 味表达或界面文案模式时，修正当前产物，并把可复用规则维护进该 skill。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Contributing upstream

This repo is a fork of `xiaoya-yaya/landscape-demo`. Nothing below is written
down anywhere upstream — no `CONTRIBUTING.md`, no `.github/`, no PR template —
so it is only discoverable from a PR failing. PR #1 was closed unmerged for the
first three.

- **Every commit needs a `Signed-off-by` line.** A DCO check gates merging and
  reports `action_required` for any commit without one. Use `git commit -s`, and
  `git rebase --signoff` to fix a branch after the fact. It is enforced by a
  GitHub App, so nothing in the tree hints at it.
- **Vercel previews need the maintainer's team.** Preview deployments run under
  the `xiaoya-yaya` Vercel team; an outside contributor's commits fail the
  deployment check until they are added. The reviewer cannot validate UI changes
  without it, so raise access before opening a UI PR.
- **The fork must be public.** While `vxtto/landscape-demo` was private, the
  maintainer got `Repository not found` fetching the PR head and could not
  verify or rebase it. Same applies to any branch you link for review.
- **Cut branches from current `upstream/main`, not from the fork's `main`.**
  Upstream moves fast and rewrites the landscape UI often; a branch based on a
  stale `main` conflicts and gets sent back. Fetch upstream first.
- `gh pr edit` fails against this repo with a Projects-classic GraphQL
  deprecation error. Use `gh api -X PATCH repos/{owner}/{repo}/pulls/{n}`.
