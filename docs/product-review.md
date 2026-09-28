# Product review: From README Studio to Code Report Studio

## Status

Phase 2 (repository report) and GitHub publishing are built. See docs/code-report.md and docs/publishing.md.

## Decision

The broader idea is justified. README generation is a useful first workflow, but Markdown is a delivery format rather than the whole product. The stronger product is a repository analysis studio that turns selected code and verified development history into a short, useful report.

## Proposed experience

1. The user selects a repository or pastes a focused code sample.
2. The studio reads only the content the user explicitly provides or connects.
3. It identifies structure, dependencies, important logic, tests, and documented decisions.
4. It retrieves verifiable public history from supported sources, starting with GitHub commits, releases, issues, and pull requests.
5. It produces a concise Markdown report with links back to every external source.
6. Verified facts and AI interpretation appear in separate sections.

## Suggested report

- Repository purpose
- Architecture summary
- Key execution paths
- Quality and testing signals
- Recent development history
- Risks and missing documentation
- Recommended next actions
- Source links and retrieval dates

## Trust and privacy

- Never claim activity that cannot be verified.
- Label model-generated interpretation clearly.
- Do not retain private code beyond what is required to process the request.
- Require explicit connection and permission before reading a private repository.
- Never send access tokens, owner codes, or private credentials to the writing model.
- Let users exclude files before analysis.

## Supported sources

Start with GitHub because its repository, commit, release, issue, and pull-request data share one permission model. Add other platforms only when each has a clear connection flow, source attribution, and data-use policy. “All platforms” should not be promised in the first release.

## Cost model

The interface can be free to try, but analysis is not cost-free. Repository APIs have rate limits and model requests consume paid credits. A sustainable version should use small input limits, cached public metadata, focused file selection, and a visible usage allowance. It should never promise unlimited free analysis.

## Delivery phases

### Phase 1 — Current release

Generate a professional README from a repository description and optional existing README. Keep access owner-only.

### Phase 2 — Repository report

Add GitHub repository selection, file filtering, commit and release summaries, and a downloadable Markdown report.

### Phase 3 — Connected evidence

Add selected external sources one at a time, with explicit permissions and citations. Preserve a strict boundary between verified evidence and model interpretation.

## Recommendation

Launch the neutral README Studio first, then validate demand for repository reports. Build GitHub analysis next; do not begin with an undefined “all platforms” promise.
