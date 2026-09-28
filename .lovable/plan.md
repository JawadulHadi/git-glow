# Convert the site into a fictional README Studio

## Outcome
Replace the personal portfolio with a focused README-writing product. No public page, generated README, image, metadata, test, or bundled profile export will contain Jawad Ul Hadi’s personal details.

## Changes
- Make the README Studio the home page and primary experience, with a concise product header and no portfolio navigation.
- Use a clearly fictional example developer, **Alex Morgan**, and a fictional repository, **signal-cache**, for sample content.
- Keep the private owner access code requirement and the existing AI drafting flow.
- Make generated READMEs brand-neutral: no personal footer, portrait, banner, email, profile URL, location, or personal GitHub account.
- Change “Publish to GitHub” so the owner provides the target GitHub owner/account along with the repository name; pre-filled links will use that input rather than a hardcoded account.
- Remove the old portfolio routes, GitHub activity code, personal data module, profile-export package, and personal brand images from the public project.
- Replace the personal favicon with a neutral README Studio mark and update all page metadata.
- Update tests and project guidance for the new product scope.

## Verification
- Search the shipped project for personal names, addresses, contact details, profile URLs, and Qeloma references.
- Run unit tests and lint checks.
- Verify the drafting form and mobile/desktop presentation in the browser.
- Confirm the preview build is clean.

## Technical details
- Keep TanStack Start and the existing server-only AI Gateway endpoint.
- Preserve streaming output, explicit stop behavior, safe model errors, and constant-time owner-code checking.
- Use semantic Tailwind tokens and existing interface controls.
