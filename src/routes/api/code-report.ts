import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { checkOwner, jsonError, streamModelText } from "@/lib/ai-stream.server";
import { collectFacts } from "@/lib/collect.server";
import { formatFacts, parseRepoUrl } from "@/lib/sources";

const packageName = z
  .string()
  .trim()
  .max(214)
  .regex(/^[@a-zA-Z0-9._/-]*$/, "Invalid package name")
  .default("");

const requestSchema = z.object({
  accessCode: z.string().min(1),
  repositoryUrl: z.string().trim().max(300).default(""),
  npmPackage: packageName,
  pypiPackage: packageName,
  code: z.string().max(20000).default(""),
});

const reportBrief = `You write short, factual code reports in Markdown.
You receive a "Verified facts" section collected from public sources, and optionally a code excerpt the owner pasted.
The verified facts are already shown to the reader above your text. Do not repeat them line by line.
Write only a section starting with the heading "## Interpretation", then these subsections: "### Summary" (2–3 sentences), "### Activity and maintenance", "### Code observations" (only if a code excerpt was provided; otherwise write "No code excerpt was provided."), "### Suggested next steps" (at most 4 bullets).
Rules: under 350 words. Sentence case headings. Label opinions as interpretation. Never invent numbers, users, contributors, dates or history that are not in the facts. If a source was unavailable, say the conclusion is limited. Dates in DD/MM/YYYY. No code fence around the whole answer.`;

export const Route = createFileRoute("/api/code-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return jsonError(400, "Please check the repository link and package names.");
        const input = parsed.data;
        const denied = checkOwner(input.accessCode);
        if (denied) return denied;

        const repo = input.repositoryUrl ? parseRepoUrl(input.repositoryUrl) : null;
        if (input.repositoryUrl && !repo) {
          return jsonError(400, "Use a GitHub, GitLab or Bitbucket repository link.");
        }
        if (!repo && !input.npmPackage && !input.pypiPackage && !input.code) {
          return jsonError(400, "Add a repository link, a package name or a code excerpt.");
        }

        const facts = await collectFacts({
          repo,
          npmPackage: input.npmPackage || undefined,
          pypiPackage: input.pypiPackage || undefined,
        });
        const factsMarkdown = formatFacts(facts);
        const title = repo
          ? `${repo.owner}/${repo.repo}`
          : input.npmPackage || input.pypiPackage || "Code excerpt";
        const today = new Date();
        const stamp = `${String(today.getUTCDate()).padStart(2, "0")}/${String(today.getUTCMonth() + 1).padStart(2, "0")}/${today.getUTCFullYear()}`;
        const prefix = `# Code report: ${title}\n\n_Generated ${stamp}. Verified facts come from public sources; the interpretation is written by AI._\n\n${facts.length ? factsMarkdown : ""}`;

        return streamModelText({
          request,
          instructions: reportBrief,
          prefix,
          input: `${facts.length ? factsMarkdown : "No sources were requested."}\n\nCode excerpt:\n${input.code || "(none provided)"}`,
        });
      },
    },
  },
});
