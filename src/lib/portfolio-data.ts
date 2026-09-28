export type Project = {
  name: string;
  shortName: string;
  description: string;
  href: string;
  focus: string;
};

export const githubProfileUrl = "https://github.com/JawadulHadi";

export const projects: Project[] = [
  {
    name: "Qeloma Verdict",
    shortName: "qeloma-verdict",
    description:
      "A domain-agnostic decision engine that creates tamper-evident reasoning receipts for accountable automated decisions.",
    href: "https://github.com/Qeloma/qeloma-verdict",
    focus: "Decision systems",
  },
  {
    name: "Qeloma OCR",
    shortName: "qeloma-ocr",
    description:
      "Client-side optical character recognition with per-word confidence, built as part of the Qeloma document intelligence suite.",
    href: "https://github.com/Qeloma/qeloma-ocr",
    focus: "Document intelligence",
  },
  {
    name: "Qeloma Lens Studio",
    shortName: "qeloma_lens_studio",
    description:
      "Document understanding for PDF, DOCX, and image ingestion with Gemini-backed capabilities and deterministic fallbacks.",
    href: "https://github.com/Qeloma/qeloma_lens_studio",
    focus: "Resilient AI",
  },
  {
    name: "Qeloma Voice Studio",
    shortName: "qeloma_voice_studio",
    description:
      "A grounded, real-time voice analyst for working conversationally with your own documents.",
    href: "https://github.com/Qeloma/qeloma_voice_studio",
    focus: "Realtime voice",
  },
];

export const capabilities = [
  ["Backend architecture", "Service boundaries, multi-tenancy, API contracts, event workflows"],
  [
    "AI systems",
    "Provider abstraction, retrieval pipelines, structured generation, agent patterns",
  ],
  ["Reliability", "Retry logic, deterministic fallback, safe migrations, operational resilience"],
  ["Performance", "Indexing, query tuning, caching, queues, latency reduction"],
] as const;

export const impact = [
  { value: "12s → <2s", label: "Dashboard response time" },
  { value: "99.9%", label: "Uptime maintained" },
  { value: "3 layers", label: "AI recovery model" },
] as const;

export const contactLinks = [
  { label: "GitHub", href: githubProfileUrl },
  { label: "Email", href: "mailto:jawadulhadicc@gmail.com" },
  { label: "WhatsApp", href: "https://wa.me/923467248414" },
  { label: "Gravatar", href: "https://gravatar.com/juhbukhari" },
] as const;
