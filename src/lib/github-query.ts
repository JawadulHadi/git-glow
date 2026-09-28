import { queryOptions } from "@tanstack/react-query";
import { getPublicGithubActivity } from "./github.functions";

export const githubActivityQueryOptions = () =>
  queryOptions({
    queryKey: ["github", "public-activity"],
    queryFn: () => getPublicGithubActivity(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
