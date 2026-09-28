<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Project architecture

- Keep README generation behind the existing owner access code because AI usage must not be publicly consumable.
- Require the GitHub owner as user input because publishing must never target a hardcoded personal account.
- Keep generated content identity-neutral because the studio is a reusable product, not a personal portfolio.
- Keep "Verified facts" deterministic (built by src/lib/sources.ts formatFacts) and stream AI text only as a separate interpretation, because facts must never be model-written.
- Route all GitHub reads and writes through the connector gateway helper in src/lib/github-gateway.server.ts, because credentials must stay server-side.
- Store brand SVGs inside each published repo under .github/brand/, because READMEs must not depend on this site being live.
- Call GitHub as each signed-in visitor via the GitHub App User Connector (encrypted keys in app_user_connections), because publishing must never use a shared account; the shared connection is only a public-read fallback for reports.
- Store the owner access code as a SHA-256 hash in studio_settings (env secret only as fallback), because the owner must change it without a rebuild.
- Store only hashed per-session visit identifiers and page categories for analytics, because usage reporting must not retain repository URLs, content, access codes, or IP addresses.
