import { createFileRoute } from "@tanstack/react-router";
import { ReadmeStudio } from "@/components/readme-studio";

export const Route = createFileRoute("/readme-studio")({
  head: () => ({
    meta: [
      { title: "README Studio · Professional repository documentation" },
      {
        name: "description",
        content:
          "Private tool for drafting accurate, professionally structured repository READMEs.",
      },
      { property: "og:title", content: "README Studio · Repository documentation" },
      { property: "og:description", content: "Draft polished, on-brand repository READMEs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReadmeStudioPage,
});

function ReadmeStudioPage() {
  return <ReadmeStudio />;
}
