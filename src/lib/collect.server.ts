import { githubRequest, repoPath } from "./github-gateway.server";
import { formatDate, formatNumber, type FactLine, type RepoRef, type SourceFacts } from "./sources";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: SourceFacts }>();

async function cached(key: string, load: () => Promise<SourceFacts>): Promise<SourceFacts> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await load();
  if (value.available) cache.set(key, { at: Date.now(), value });
  return value;
}

async function getJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "readme-studio" } });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

function unavailable(source: string, url: string, status: number): SourceFacts {
  const note =
    status === 404
      ? "not found or not public."
      : status === 403 || status === 429
        ? "rate limited right now, try again later."
        : `the source returned status ${status || "no response"}.`;
  return { source, url, available: false, note, lines: [] };
}

type GhRepo = {
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  pushed_at: string;
  default_branch: string;
  license: { name: string } | null;
};
type GhCommit = { sha: string; html_url: string; commit: { message: string; author: { name: string; date: string } | null } };
type GhRelease = { tag_name: string; name: string | null; html_url: string; published_at: string | null };
type GhContributor = { login: string; contributions: number; html_url: string };

async function collectGithub(ref: RepoRef): Promise<SourceFacts> {
  const base = repoPath(ref.owner, ref.repo);
  const url = `https://github.com/${ref.owner}/${ref.repo}`;
  const source = `GitHub · ${ref.owner}/${ref.repo}`;
  const repo = await githubRequest<GhRepo>(base);
  if (!repo.ok) return unavailable(source, url, repo.status);
  const [languages, commits, releases, contributors] = await Promise.all([
    githubRequest<Record<string, number>>(`${base}/languages`),
    githubRequest<GhCommit[]>(`${base}/commits?per_page=8`),
    githubRequest<GhRelease[]>(`${base}/releases?per_page=5`),
    githubRequest<GhContributor[]>(`${base}/contributors?per_page=5`),
  ]);
  const r = repo.data;
  const lines: FactLine[] = [
    { text: `Description: ${r.description ?? "none set"}`, url: r.html_url },
    {
      text: `${formatNumber(r.stargazers_count)} stars, ${formatNumber(r.forks_count)} forks, ${formatNumber(r.open_issues_count)} open issues and pull requests`,
      url: r.html_url,
    },
    { text: `Created ${formatDate(r.created_at)}, last push ${formatDate(r.pushed_at)}`, url: r.html_url },
    { text: `Licence: ${r.license?.name ?? "none detected"}`, url: r.html_url },
  ];
  if (languages.ok) {
    const total = Object.values(languages.data).reduce((sum, n) => sum + n, 0);
    const top = Object.entries(languages.data)
      .slice(0, 5)
      .map(([name, bytes]) => `${name} ${formatNumber(Math.round((bytes / total) * 1000) / 10)} %`);
    if (top.length) lines.push({ text: `Languages: ${top.join(", ")}`, url: r.html_url });
  }
  if (contributors.ok && contributors.data.length) {
    lines.push({
      text: `Top contributors: ${contributors.data.map((c) => `${c.login} (${formatNumber(c.contributions)})`).join(", ")}`,
      url: `${url}/graphs/contributors`,
    });
  }
  if (releases.ok) {
    for (const release of releases.data) {
      lines.push({
        text: `Release ${release.tag_name}${release.name && release.name !== release.tag_name ? ` “${release.name}”` : ""}${release.published_at ? ` on ${formatDate(release.published_at)}` : ""}`,
        url: release.html_url,
      });
    }
  }
  if (commits.ok) {
    for (const commit of commits.data) {
      const title = commit.commit.message.split("\n")[0]?.slice(0, 100) ?? "";
      const date = commit.commit.author?.date ? formatDate(commit.commit.author.date) : "unknown date";
      lines.push({ text: `Commit ${commit.sha.slice(0, 7)} on ${date}: ${title}`, url: commit.html_url });
    }
  }
  return { source, url, available: true, lines };
}

type GlProject = {
  web_url: string;
  description: string | null;
  star_count: number;
  forks_count: number;
  created_at: string;
  last_activity_at: string;
};
type GlCommit = { short_id: string; title: string; created_at: string; web_url: string };
type GlRelease = { tag_name: string; name: string; released_at: string; _links: { self: string } };

async function collectGitlab(ref: RepoRef): Promise<SourceFacts> {
  const id = encodeURIComponent(`${ref.owner}/${ref.repo}`);
  const api = `https://gitlab.com/api/v4/projects/${id}`;
  const url = `https://gitlab.com/${ref.owner}/${ref.repo}`;
  const source = `GitLab · ${ref.owner}/${ref.repo}`;
  const project = await getJson<GlProject>(api);
  if (!project.ok) return unavailable(source, url, project.status);
  const [languages, commits, releases] = await Promise.all([
    getJson<Record<string, number>>(`${api}/languages`),
    getJson<GlCommit[]>(`${api}/repository/commits?per_page=8`),
    getJson<GlRelease[]>(`${api}/releases?per_page=5`),
  ]);
  const p = project.data;
  const lines: FactLine[] = [
    { text: `Description: ${p.description || "none set"}`, url: p.web_url },
    { text: `${formatNumber(p.star_count)} stars, ${formatNumber(p.forks_count)} forks`, url: p.web_url },
    { text: `Created ${formatDate(p.created_at)}, last activity ${formatDate(p.last_activity_at)}`, url: p.web_url },
  ];
  if (languages.ok) {
    const top = Object.entries(languages.data).map(([name, pct]) => `${name} ${formatNumber(pct)} %`);
    if (top.length) lines.push({ text: `Languages: ${top.slice(0, 5).join(", ")}`, url: p.web_url });
  }
  if (releases.ok) {
    for (const release of releases.data) {
      lines.push({ text: `Release ${release.tag_name} on ${formatDate(release.released_at)}`, url: `${url}/-/releases/${encodeURIComponent(release.tag_name)}` });
    }
  }
  if (commits.ok) {
    for (const commit of commits.data) {
      lines.push({ text: `Commit ${commit.short_id} on ${formatDate(commit.created_at)}: ${commit.title.slice(0, 100)}`, url: commit.web_url });
    }
  }
  return { source, url, available: true, lines };
}

type BbRepo = { description: string; language: string; created_on: string; updated_on: string; links: { html: { href: string } } };
type BbCommits = { values: { hash: string; date: string; message: string; links: { html: { href: string } } }[] };

async function collectBitbucket(ref: RepoRef): Promise<SourceFacts> {
  const api = `https://api.bitbucket.org/2.0/repositories/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;
  const url = `https://bitbucket.org/${ref.owner}/${ref.repo}`;
  const source = `Bitbucket · ${ref.owner}/${ref.repo}`;
  const repo = await getJson<BbRepo>(api);
  if (!repo.ok) return unavailable(source, url, repo.status);
  const commits = await getJson<BbCommits>(`${api}/commits?pagelen=8`);
  const r = repo.data;
  const lines: FactLine[] = [
    { text: `Description: ${r.description || "none set"}`, url: r.links.html.href },
    { text: `Main language: ${r.language || "not set"}`, url: r.links.html.href },
    { text: `Created ${formatDate(r.created_on)}, last update ${formatDate(r.updated_on)}`, url: r.links.html.href },
  ];
  if (commits.ok) {
    for (const commit of commits.data.values) {
      lines.push({
        text: `Commit ${commit.hash.slice(0, 7)} on ${formatDate(commit.date)}: ${commit.message.split("\n")[0]?.slice(0, 100) ?? ""}`,
        url: commit.links.html.href,
      });
    }
  }
  return { source, url, available: true, lines };
}

type NpmLatest = { version: string; description?: string; license?: string };
type NpmDownloads = { downloads: number };
type NpmTimes = { time: Record<string, string> };

async function collectNpm(name: string): Promise<SourceFacts> {
  const url = `https://www.npmjs.com/package/${name}`;
  const source = `npm · ${name}`;
  const latest = await getJson<NpmLatest>(`https://registry.npmjs.org/${name}/latest`);
  if (!latest.ok) return unavailable(source, url, latest.status);
  const [downloads, times] = await Promise.all([
    getJson<NpmDownloads>(`https://api.npmjs.org/downloads/point/last-month/${name}`),
    getJson<NpmTimes>(`https://registry.npmjs.org/${name}`),
  ]);
  const lines: FactLine[] = [
    { text: `Latest version ${latest.data.version}${latest.data.license ? `, licence ${latest.data.license}` : ""}`, url },
  ];
  if (times.ok) {
    const versions = Object.keys(times.data.time).filter((key) => key !== "created" && key !== "modified");
    const published = times.data.time[latest.data.version];
    lines.push({
      text: `${formatNumber(versions.length)} published versions${published ? `, latest on ${formatDate(published)}` : ""}`,
      url: `${url}?activeTab=versions`,
    });
  }
  if (downloads.ok) {
    lines.push({ text: `${formatNumber(downloads.data.downloads)} downloads in the last month`, url: `https://npm-stat.com/charts.html?package=${name}` });
  }
  return { source, url, available: true, lines };
}

type PypiInfo = { info: { version: string; license: string | null; summary: string | null }; releases: Record<string, { upload_time_iso_8601: string }[]> };
type PypiRecent = { data: { last_month: number } };

async function collectPypi(name: string): Promise<SourceFacts> {
  const url = `https://pypi.org/project/${name}/`;
  const source = `PyPI · ${name}`;
  const info = await getJson<PypiInfo>(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`);
  if (!info.ok) return unavailable(source, url, info.status);
  const recent = await getJson<PypiRecent>(`https://pypistats.org/api/packages/${encodeURIComponent(name.toLowerCase())}/recent`);
  const latestFiles = info.data.releases[info.data.info.version] ?? [];
  const uploaded = latestFiles[0]?.upload_time_iso_8601;
  const lines: FactLine[] = [
    { text: `Latest version ${info.data.info.version}${uploaded ? ` on ${formatDate(uploaded)}` : ""}`, url },
    { text: `${formatNumber(Object.keys(info.data.releases).length)} published versions`, url: `${url}#history` },
  ];
  if (recent.ok) {
    lines.push({ text: `${formatNumber(recent.data.data.last_month)} downloads in the last month`, url: `https://pypistats.org/packages/${name.toLowerCase()}` });
  }
  return { source, url, available: true, lines };
}

export async function collectFacts(input: { repo: RepoRef | null; npmPackage?: string; pypiPackage?: string }): Promise<SourceFacts[]> {
  const jobs: Promise<SourceFacts>[] = [];
  const { repo, npmPackage, pypiPackage } = input;
  if (repo) {
    const key = `${repo.host}:${repo.owner}/${repo.repo}`.toLowerCase();
    const loader = repo.host === "github" ? collectGithub : repo.host === "gitlab" ? collectGitlab : collectBitbucket;
    jobs.push(cached(key, () => loader(repo)));
  }
  if (npmPackage) jobs.push(cached(`npm:${npmPackage}`, () => collectNpm(npmPackage)));
  if (pypiPackage) jobs.push(cached(`pypi:${pypiPackage}`, () => collectPypi(pypiPackage)));
  return Promise.all(jobs);
}
