import overview from "../../docs/overview.md?raw";
import codeReport from "../../docs/code-report.md?raw";
import publishing from "../../docs/publishing.md?raw";
import privacy from "../../docs/privacy-and-limits.md?raw";
import type { PublishFile } from "./publish";

/** The studio's own documentation, ready to publish to a repository's docs folder. */
export const appDocs: PublishFile[] = [
  { path: "docs/overview.md", content: overview },
  { path: "docs/code-report.md", content: codeReport },
  { path: "docs/publishing.md", content: publishing },
  { path: "docs/privacy-and-limits.md", content: privacy },
];
