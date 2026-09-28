# Backend lead portfolio and GitHub profile

## Goal
Replace the current portfolio with a cleaner version of the selected kinetic-glass direction, and produce a coordinated GitHub profile README. The result will emphasize architecture leadership, public projects, and truthful activity evidence without adding a conventional experience section.

## Visual direction
- Keep the selected dark glass composition, asymmetric hero, project/activity emphasis, and restrained technical feel.
- Replace the current display font with a more neutral professional grotesk paired with a readable sans-serif and restrained monospace labels.
- Replace pink with a professional cyan, blue, and cool green palette.
- Use subtle grid light, soft directional washes, and architectural line effects instead of drifting color blobs.
- Use crisp button fills, border sweeps, and small arrow movement rather than bounce, glow, or brightness animations.
- Support keyboard navigation, strong contrast, reduced motion, and polished mobile layouts.

## Portfolio structure
Create distinct pages with shared navigation and unique page metadata:

1. **Home**
   - Jawad Ul Hadi and “Backend Lead Engineer” as the first viewport signal.
   - Concise positioning around multi-tenant SaaS, AI systems, and reliability.
   - Preserve only verified impact figures from the supplied profile.
   - Preview verified GitHub activity and featured Qeloma projects.

2. **Projects**
   - Feature Qeloma Verdict, Qeloma OCR, Qeloma Lens Studio, and Qeloma Voice Studio.
   - Use the supplied repository links and descriptions without inventing stacks, metrics, or status labels.
   - Give each project a contribution-style activity row derived from public repository signals when available.
   - Add a separate, explicitly labeled curated milestone timeline using only supplied facts.

3. **Case study**
   - Rebuild “Designing for AI Failure” around Retry → Retrieval fallback → Rule-based output.
   - Present the architecture as a clean native diagram rather than decorative imagery.

4. **Credentials**
   - Present core capabilities and selected certifications compactly.
   - Avoid unverified dates and omit the conflicting graduation year until confirmed.
   - Link to the complete certification source rather than recreating a badge wall.

5. **Contact**
   - Provide direct GitHub, portfolio, email, WhatsApp, and Gravatar actions from the uploaded profile.
   - Keep the tone professional and concise.

## GitHub activity and project charts
- Fetch public GitHub profile and repository activity on the server, with clear loading, unavailable, and empty states.
- Label this section “Verified public GitHub activity”; never display invented contribution totals.
- Keep the project milestone visualization visually distinct and label it “Curated project activity.”
- Explain that private work is not attributed to projects; GitHub’s native anonymized private-contribution setting remains the truthful way to include private contribution counts.
- Link every visible project signal back to its public repository.

## GitHub profile package
Create a clean exportable profile package based on the uploaded archive:
- Rewrite the profile `README.md` into a concise, recruiter-scannable structure: positioning, current focus, selected projects, architecture themes, writing, and contact.
- Reduce the technology badge wall to a small capability matrix.
- Preserve theme-aware banner assets only if they still match the new visual system.
- Include setup guidance for GitHub-native pinned repositories, Activity overview, and private contribution visibility.
- Do not fabricate or backfill contributions; projects appear through real repository links and the separate curated activity treatment.
- Update stale portfolio links to the replacement site’s final URL once available.

## Technical approach
- Use TanStack Start routes with shared navigation and semantic Tailwind v4 design tokens.
- Add a small GitHub service layer and server function for public data; React Query handles loading and caching in the interface.
- Keep secrets out of browser code. Public data should work without sign-in; if GitHub rate limits prevent reliable charts, show a transparent fallback link to the native profile rather than mock data.
- Add focused unit tests for activity transformation and date/number formatting.
- Record the multi-route and live-versus-curated activity decisions in the project architecture notes.

## Verification
- Check every page at desktop and mobile sizes for overflow, overlap, navigation, and readable charts.
- Verify all external links and repository names.
- Verify live GitHub failures degrade honestly and do not become fabricated chart values.
- Run tests and lint, then confirm the preview builds without errors.
- Review the exported README for GitHub rendering, heading order, descriptive links, and image alt text.

## Content safeguards
- No detailed employment history.
- No invented project technologies, commit counts, metrics, or milestones.
- Do not publish the conflicting 2017/2018 graduation year or uncertain certification dates.
- Treat the current portfolio and uploaded archive as source material, with the uploaded README’s public project URLs taking priority.
