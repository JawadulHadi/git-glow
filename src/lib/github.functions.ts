import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  buildActivityDays,
  type GithubEvent,
  type GithubRepository,
  type PublicActivity,
} from "./github-activity";

const githubResponseSchema = z.array(z.unknown());

const requestGithub = async (path: string): Promise<unknown[]> => {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Jawad-Ul-Hadi-Portfolio",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed [${response.status}]: ${body}`);
  }

  return githubResponseSchema.parse(await response.json());
};

export const getPublicGithubActivity = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicActivity> => {
    const [eventData, repositoryData] = await Promise.all([
      requestGithub("/users/JawadulHadi/events/public?per_page=100"),
      requestGithub("/orgs/Qeloma/repos?per_page=100&sort=pushed"),
    ]);

    const events = eventData as GithubEvent[];
    const wanted = new Set([
      "qeloma-verdict",
      "qeloma-ocr",
      "qeloma_lens_studio",
      "qeloma_voice_studio",
    ]);
    const repositories = (repositoryData as GithubRepository[])
      .filter((repository) => wanted.has(repository.name))
      .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at));

    return {
      days: buildActivityDays(events),
      repositories,
      eventCount: events.length,
      fetchedAt: new Date().toISOString(),
    };
  },
);
