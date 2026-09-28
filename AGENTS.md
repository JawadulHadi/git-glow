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

- Use separate TanStack routes for portfolio sections so each page has independent metadata and shareable URLs.
- Keep verified GitHub activity distinct from curated project milestones so editorial context is never presented as contribution data.
- Fetch public GitHub data through a server function and React Query service layer to keep components focused and failures transparent.
