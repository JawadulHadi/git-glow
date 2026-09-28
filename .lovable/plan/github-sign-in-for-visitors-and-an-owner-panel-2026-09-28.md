# GitHub sign-in for visitors and an owner panel

## What you get
- **Sign in with GitHub** for each visitor. After signing in, the code report reads their real repositories (including private ones they allow), and "Publish to GitHub" writes the README, tags, releases and description straight into their chosen repo. Then it opens that repo.
- **Owner panel** at `/owner`, where you sign in with your email and password. From there you can:
  - Set a new access code or reset the current one. It works right away, with no rebuild.
  - See usage stats: README drafts and code reports per day, successes and failures, and the last 20 requests. The stats never store what people typed.
- The access code still protects the AI features. It's now kept in the database, stored hashed, instead of as a fixed site secret.

## Steps
1. Turn on Lovable Cloud, which provides the database and owner sign-in.
2. Create your owner account with email and password. Only an account marked as owner can open the panel.
3. Add GitHub sign-in for visitors through GitHub's per-user connection. You'll approve a connect card.
4. Update the code report and publishing so they use the signed-in visitor's GitHub and not a shared account.
5. Record every AI request (type, time, success) for the stats.
6. Test in the browser: owner sign-in, changing the code, a draft with the new code, the stats updating, and the GitHub flow.

## Technical details
- Tables: `user_roles` (owner role via `has_role`), `studio_settings` (hashed access code and updated_at, owner-only RLS), `usage_events` (kind, ok, created_at, no content). All tables get GRANTs and RLS.
- Code check: SHA-256 plus timingSafeEqual against the stored hash. The existing `README_STUDIO_ACCESS_CODE` stays as a fallback until the first code is saved in the panel.
- Owner server functions use `requireSupabaseAuth` and a `has_role(owner)` check. Routes go under `_authenticated/owner`.
- GitHub calls use the App User Connector per visitor, keeping tokens on the server and routing through the gateway helper.
