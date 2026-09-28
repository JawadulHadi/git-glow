# Visitor analytics and live GitHub publishing

## Build
- Record privacy-conscious studio visits without storing page content, repository URLs, IP addresses, or access codes.
- Extend the owner dashboard with 14-day opens, unique visitors, report generations, conversion rate, daily activity, and recent events.
- Count a visitor once per browser session and distinguish README studio opens from code report opens.
- Add a wiki-ready `WIKI.md` option to the existing GitHub publishing panel; keep the existing copy-to-wiki action because GitHub does not offer an API for writing Wiki pages.
- Preserve the current per-user GitHub connection: authenticated visitors can analyze private repositories they can access, publish the README, brand SVGs, report, tag, and Release, then open the repository directly.

## Live verification
- Sign in with Google in the preview and connect the requesting user's GitHub account through the existing authorization flow.
- Analyze `repo-radiance-forge.git` after resolving its GitHub owner from the connected account.
- Publish the generated report, README/brand assets, wiki-ready document, tag, and Release to that repository.
- Open the returned GitHub repository URL and confirm the README references the in-repository banner and mark, and that the Release and files exist.

## Technical details
- Add a locked-down analytics table with explicit service-role grants and row-level security; only server functions can write or read it.
- Generate a random session identifier in session storage and send only the identifier plus the page category to a validated server function.
- Keep AI requests protected by the owner access code and count successful and failed report/publish operations separately.
- Update tests and browser-check the Google sign-in, analytics cards, report generation, and direct repository opening.
