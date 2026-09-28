export const BRAND_LOGO_PATH = ".github/brand/logo.svg";
export const BRAND_BANNER_PATH = ".github/brand/banner.svg";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const LOGO_SHAPES = `<rect width="64" height="64" rx="14" fill="#0f172a"/>
  <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#14b8a6" stroke-opacity=".45" stroke-width="2"/>
  <path d="M19 13h19l8 8v30H19z" fill="#f8fafc"/>
  <path d="M38 13v9h8" fill="none" stroke="#14b8a6" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M25 31h14M25 38h14M25 45h8" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M44 38l6-6 3 3-6 6-4 1z" fill="#14b8a6"/>`;

/** Neutral studio logo: a document plate with a teal pen nib. */
export function buildLogoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128" role="img" aria-label="Logo">
  ${LOGO_SHAPES}
</svg>
`;
}

/** Banner that shows the repository name and a short tagline next to the logo. */
export function buildBannerSvg(title: string, tagline: string): string {
  const safeTitle = escapeXml(title.slice(0, 48));
  const safeTagline = escapeXml(tagline.slice(0, 90));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 320" width="1280" height="320" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1120"/>
      <stop offset="1" stop-color="#111c33"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#14b8a6"/>
      <stop offset="1" stop-color="#14b8a6" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0v32" fill="none" stroke="#1e293b" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1280" height="320" rx="24" fill="url(#bg)"/>
  <rect width="1280" height="320" rx="24" fill="url(#grid)" opacity=".7"/>
  <g transform="translate(96 96) scale(2)">
    ${LOGO_SHAPES}
  </g>
  <text x="272" y="162" fill="#f8fafc" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="60" font-weight="700">${safeTitle}</text>
  <rect x="274" y="186" width="420" height="4" rx="2" fill="url(#rule)"/>
  <text x="274" y="232" fill="#94a3b8" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="26">${safeTagline}</text>
</svg>
`;
}

/** Adds the banner and logo to the top of a README, using repository-relative paths. */
export function withBrandHeader(readme: string, repositoryName: string): string {
  if (readme.includes(BRAND_BANNER_PATH)) return readme;
  const alt = escapeXml(repositoryName);
  return `<p align="center"><img src="${BRAND_BANNER_PATH}" alt="${alt} banner" width="100%"></p>
<p align="center"><img src="${BRAND_LOGO_PATH}" alt="${alt} logo" width="72"></p>

${readme.trimStart()}`;
}
