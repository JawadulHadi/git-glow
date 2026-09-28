import { createFileRoute } from "@tanstack/react-router";
import { ReadmeStudio } from "@/components/readme-studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "repo.io · Professional repository documentation" },
      {
        name: "description",
        content:
          "Turn trusted repository context into a polished, accurate, professionally structured README.",
      },
      { property: "og:title", content: "repo.io · Repository documentation" },
      {
        property: "og:description",
        content:
          "Draft clear GitHub documentation from facts you provide, without invented details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return <ReadmeStudio />;
}
