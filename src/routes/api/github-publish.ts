import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { checkOwner, jsonError } from "@/lib/ai-stream.server";
import { getRequestUserId } from "@/lib/request-user.server";
import { getGithubConnection } from "@/lib/app-user-connections.server";
import { recordUsage } from "@/lib/studio-settings.server";
import { githubRequest as gh, repoPath } from "@/lib/github-gateway.server";
import {
  BRAND_BANNER_PATH,
  BRAND_LOGO_PATH,
  buildBannerSvg,
  buildLogoSvg,
  withBrandHeader,
} from "@/lib/brand";
import type { PublishStep } from "@/lib/publish";

const name = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9._-]+$/);

const requestSchema = z.object({
  accessCode: z.string().min(1),
  owner: name,
  repo: name,
  readme: z.string().max(60000).optional(),
  description: z.string().trim().max(350).optional(),
  topics: z
    .array(z.string().regex(/^[a-z0-9-]{1,50}$/))
    .max(20)
    .optional(),
  release: z
    .object({
      tag: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(/^[A-Za-z0-9._/-]+$/),
      name: z.string().trim().max(200),
      notes: z.string().max(20000),
    })
    .optional(),
  files: z
    .array(
      z.object({
        path: z
          .string()
          .trim()
          .min(1)
          .max(200)
          .regex(/^(docs|\.github)\/[A-Za-z0-9._/-]+\.md$/),
        content: z.string().max(60000),
      }),
    )
    .max(10)
    .optional(),
  brand: z
    .object({ title: z.string().trim().min(1).max(48), tagline: z.string().trim().max(90) })
    .optional(),
});

type RepoInfo = { default_branch: string; html_url: string; description: string | null };
type ContentInfo = { sha: string; content?: string; html_url: string };

function encode(content: string): string {
  return Buffer.from(content, "utf8").toString("base64");
}

async function putFile(
  key: string,
  base: string,
  branch: string,
  path: string,
  content: string,
  message: string,
): Promise<PublishStep> {
  const existing = await gh<ContentInfo>(
    `${base}/contents/${path}?ref=${encodeURIComponent(branch)}`,
    {},
    key,
  );
  const result = await gh<{ content: { html_url: string } }>(
    `${base}/contents/${path}`,
    {
      method: "PUT",
      body: {
        message,
        content: encode(content),
        branch,
        ...(existing.ok ? { sha: existing.data.sha } : {}),
      },
    },
    key,
  );
  if (!result.ok) return { label: path, ok: false, detail: result.message };
  return {
    label: path,
    ok: true,
    detail: existing.ok ? "Updated" : "Created",
    url: result.data.content.html_url,
  };
}

export const Route = createFileRoute("/api/github-publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return jsonError(400, "Please check the owner, repository, tag and file names.");
        }
        const input = parsed.data;
        const denied = await checkOwner(input.accessCode);
        if (denied) return denied;
        const userId = await getRequestUserId(request);
        if (!userId) return jsonError(401, "Sign in and connect your GitHub account to publish.");
        const connection = await getGithubConnection(userId);
        if (!connection) return jsonError(403, "Connect your GitHub account to publish.");
        const githubRequest = <T>(path: string, init: { method?: string; body?: unknown } = {}) =>
          gh<T>(path, init, connection.key);

        const base = repoPath(input.owner, input.repo);
        const repo = await githubRequest<RepoInfo>(base);
        if (!repo.ok) {
          return jsonError(
            repo.status === 404 ? 404 : 502,
            repo.status === 404
              ? "That repository was not found, or the connected GitHub account cannot see it."
              : `GitHub returned an error: ${repo.message}`,
          );
        }
        const branch = repo.data.default_branch;
        const steps: PublishStep[] = [];

        if (input.brand) {
          steps.push(
            await putFile(
              connection.key,
              base,
              branch,
              BRAND_LOGO_PATH,
              buildLogoSvg(),
              "docs: add studio logo",
            ),
          );
          steps.push(
            await putFile(
              connection.key,
              base,
              branch,
              BRAND_BANNER_PATH,
              buildBannerSvg(input.brand.title, input.brand.tagline),
              "docs: add repository banner",
            ),
          );
        }

        if (input.readme) {
          const readme = input.brand ? withBrandHeader(input.readme, input.repo) : input.readme;
          steps.push(
            await putFile(
              connection.key,
              base,
              branch,
              "README.md",
              readme.trimEnd() + "\n",
              "docs: update README",
            ),
          );
        }

        for (const file of input.files ?? []) {
          steps.push(
            await putFile(
              connection.key,
              base,
              branch,
              file.path,
              file.content.trimEnd() + "\n",
              `docs: update ${file.path}`,
            ),
          );
        }

        if (input.description !== undefined && input.description !== "") {
          const result = await githubRequest(base, {
            method: "PATCH",
            body: { description: input.description },
          });
          steps.push({
            label: "Description",
            ok: result.ok,
            detail: result.ok ? "Saved" : result.message,
          });
        }

        if (input.topics && input.topics.length) {
          const result = await githubRequest(`${base}/topics`, {
            method: "PUT",
            body: { names: input.topics },
          });
          steps.push({
            label: "Topics",
            ok: result.ok,
            detail: result.ok ? input.topics.join(", ") : result.message,
          });
        }

        if (input.release) {
          const tag = encodeURIComponent(input.release.tag);
          const existing = await githubRequest<{ html_url: string }>(
            `${base}/releases/tags/${tag}`,
          );
          if (existing.ok) {
            steps.push({
              label: `Release ${input.release.tag}`,
              ok: true,
              detail: "Already exists, left unchanged",
              url: existing.data.html_url,
            });
          } else {
            const created = await githubRequest<{ html_url: string }>(`${base}/releases`, {
              method: "POST",
              body: {
                tag_name: input.release.tag,
                target_commitish: branch,
                name: input.release.name || input.release.tag,
                body: input.release.notes,
              },
            });
            steps.push({
              label: `Tag and release ${input.release.tag}`,
              ok: created.ok,
              detail: created.ok ? "Created" : created.message,
              url: created.ok ? created.data.html_url : undefined,
            });
          }
        }

        // Re-read the repository to confirm what GitHub now shows.
        const checks: PublishStep[] = [];
        const readme = await githubRequest<ContentInfo>(`${base}/readme`);
        const readmeText =
          readme.ok && readme.data.content
            ? Buffer.from(readme.data.content, "base64").toString("utf8")
            : "";
        checks.push({
          label: "README is on the default branch",
          ok: readme.ok,
          detail: readme.ok ? "Found" : "Not found",
          url: readme.ok ? readme.data.html_url : undefined,
        });
        if (input.brand) {
          checks.push({
            label: "README shows the banner and logo",
            ok: readmeText.includes(BRAND_BANNER_PATH) && readmeText.includes(BRAND_LOGO_PATH),
            detail: readmeText.includes(BRAND_BANNER_PATH) ? "Linked at the top" : "Not linked",
          });
          for (const path of [BRAND_BANNER_PATH, BRAND_LOGO_PATH]) {
            const file = await githubRequest<ContentInfo>(
              `${base}/contents/${path}?ref=${encodeURIComponent(branch)}`,
            );
            checks.push({
              label: `${path} exists`,
              ok: file.ok,
              detail: file.ok ? "Found" : "Missing",
              url: file.ok ? file.data.html_url : undefined,
            });
          }
        }
        if (input.description) {
          const fresh = await githubRequest<RepoInfo>(base);
          const matches = fresh.ok && fresh.data.description === input.description;
          checks.push({
            label: "Description matches",
            ok: matches,
            detail: matches ? "Matches" : "Different",
          });
        }
        if (input.release) {
          const tagRef = await githubRequest(
            `${base}/git/ref/tags/${encodeURIComponent(input.release.tag)}`,
          );
          checks.push({
            label: `Tag ${input.release.tag} exists`,
            ok: tagRef.ok,
            detail: tagRef.ok ? "Found" : "Missing",
          });
          const release = await githubRequest<{ html_url: string }>(
            `${base}/releases/tags/${encodeURIComponent(input.release.tag)}`,
          );
          checks.push({
            label: "Release is published",
            ok: release.ok,
            detail: release.ok ? "Found" : "Missing",
            url: release.ok ? release.data.html_url : undefined,
          });
        }

        await recordUsage(
          "publish",
          steps.every((step) => step.ok),
        );
        return Response.json({ steps, checks, repoUrl: repo.data.html_url });
      },
    },
  },
});
