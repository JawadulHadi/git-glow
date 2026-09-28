import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { checkOwner, jsonError, streamModelText } from "@/lib/ai-stream.server";

const requestSchema = z.object({
  accessCode: z.string().min(1),
  githubOwner: z.string().trim().min(1).max(80),
  repositoryName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  existingReadme: z.string().max(40000).default(""),
});

const brandBrief = `You write polished GitHub README files for software repositories.
Brand voice: friendly, professional, precise, outcome-focused. Use sentence case headings, restrained formatting, and no hype.
Structure: a title with a one-line value statement, a short overview, key features, architecture or how it works (a Mermaid diagram only if the input supports it), tech stack, getting started (only commands present in or clearly implied by the input), usage, and project status.
Strict rules: never invent metrics, users, benchmarks, badges for services not mentioned, licences, or commands. Preserve accurate technical facts from the existing README. Where information is missing, leave a short HTML comment such as <!-- Add setup steps --> instead of fabricating.
Do not add a banner or logo image; the studio adds those itself.
Return only the README markdown, with no surrounding code fence.`;

export const Route = createFileRoute("/api/readme-draft")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return jsonError(400, "Please provide a repository name and description.");
        const input = parsed.data;
        const denied = checkOwner(input.accessCode);
        if (denied) return denied;

        return streamModelText({
          request,
          instructions: brandBrief,
          input: `GitHub owner: ${input.githubOwner}\nRepository: ${input.repositoryName}\n\nDescription:\n${input.description}\n\nExisting README:\n${input.existingReadme || "(none provided)"}`,
        });
      },
    },
  },
});
