# Code report and GitHub publishing

## What you get

1. **Code report** (new page, behind the owner code)
   - Paste a repository link from GitHub, GitLab or Bitbucket (public repos), plus an optional npm or PyPI package name.
   - The studio collects verified facts: languages, recent commits, contributors, releases and tags, open issues and pull requests, package versions and downloads.
   - The AI writes a short Markdown report with two separate parts: "Verified facts" (every line links to its source) and "Interpretation" (clearly labelled as AI opinion).
   - Download the report as Markdown, or publish it to a repo.

2. **Publish to GitHub** (from the studio, owner only, using your connected GitHub account)
   - README: create or replace README.md, with the banner and logo at the top.
   - Repo description and topics.
   - Tag and Release: create a tag and a Release with notes written by the studio.
   - Brand files: upload `.github/brand/logo.svg` and `banner.svg` to the repo, so GitHub shows them from the repo itself, not from this site.
   - Documentation: publish docs pages to a `docs/` folder. GitHub offers no way for apps to write Wiki pages, so the studio gives you the pages to paste into the Wiki yourself.
   - After publishing, the studio re-reads the repo and shows a checklist confirming the README, banner, logo, description, tag and Release are there.

3. **Owner info**: stays the fictional demo (Alex Morgan / alex-morgan-demo). The owner field is still typed in each time, and nothing personal is stored.

4. **New neutral logo and banner**: one hand-built SVG logo (a document plate with a pen nib, matching the current site icon) and a matching SVG banner that shows the repository name.

5. **This app's own documentation**: a full docs set in `docs/` (overview, code report, publishing, privacy and limits), which can also be published to a repo.

## Limits I'll state in the app
- Only public repos on GitLab and Bitbucket; private GitHub repos only when your connected account can see them.
- Each report uses AI credits, so it's not unlimited or free to run.
- No made-up activity: if a source can't be reached, the report says so.

## Technical details
- GitHub connector (workspace-owned, via the gateway) for all GitHub reads and writes: contents API for README, docs and brand files; `PATCH repos` and `PUT topics`; `git/refs` and `releases` for tags and Releases. You'll get a GitHub connection prompt.
- GitLab `api/v4/projects`, Bitbucket `2.0/repositories`, npm registry and downloads API, PyPI JSON and pypistats: unauthenticated public fetches in `*.server.ts` collectors with a 10-minute cache and honest "unavailable" states.
- Server routes under `src/routes/api/` are owner-code gated (timingSafeEqual). The report is streamed from `openai/gpt-6-astra` over the Responses API with the same SSE TransformStream pattern. Tokens are never sent to the model.
- Service layer in `src/lib/*.ts`; React Query in the UI; zod validation; vitest tests for URL parsing, fact formatting and publish checklist logic; Playwright check of both pages.
- Update AGENTS.md, docs/product-review.md phases, and roadmap.md.
