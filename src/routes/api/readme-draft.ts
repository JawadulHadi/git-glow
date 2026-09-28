import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { timingSafeEqual } from "crypto";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

const requestSchema = z.object({
  accessCode: z.string().min(1),
  repositoryName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  existingReadme: z.string().max(40000).default(""),
});

const brandBrief = `You write GitHub README files for Jawad Ul Hadi, a backend lead engineer (portfolio: https://juh-bukhari.vercel.app, GitHub: https://github.com/JawadulHadi).
Brand voice: friendly, professional, precise, outcome-focused. Sentence case headings. No emojis walls, no hype.
Structure: a title with a one-line value statement, a short overview, key features, architecture or how it works (a mermaid diagram only if the input supports it), tech stack, getting started (only commands present in or clearly implied by the input), usage, project status, and a brief footer: "Built by Jawad Ul Hadi" linking to the portfolio.
Strict rules: never invent metrics, users, benchmarks, badges for services not mentioned, licences, or commands. Preserve accurate technical facts from the existing README. Where information is missing, leave a short HTML comment such as <!-- Add setup steps --> instead of fabricating.
Return only the README markdown, with no surrounding code fence.`;

function codesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/readme-draft")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        const ownerCode = process.env["README_STUDIO_ACCESS_CODE"];
        if (!apiKey || !ownerCode) {
          return jsonError(500, "The README studio is not configured yet.");
        }

        const parsed = requestSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return jsonError(400, "Please provide a repository name and description.");
        }
        const input = parsed.data;
        if (!codesMatch(input.accessCode, ownerCode)) {
          return jsonError(401, "That owner access code is not correct.");
        }

        const userPrompt = `Repository: ${input.repositoryName}\n\nDescription:\n${input.description}\n\nExisting README:\n${input.existingReadme || "(none provided)"}`;

        const headers = new Headers({
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        });
        const incomingRunId = request.headers.get(RUN_ID_HEADER)?.trim();
        if (incomingRunId) headers.set(RUN_ID_HEADER, incomingRunId);

        let upstream: Response;
        try {
          upstream = await fetch(GATEWAY_URL, {
            method: "POST",
            signal: request.signal,
            headers,
            body: JSON.stringify({
              model: MODEL,
              instructions: brandBrief,
              input: userPrompt,
              stream: true,
              store: false,
              reasoning: { effort: "medium", summary: "auto" },
              include: ["reasoning.encrypted_content"],
            }),
          });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }

        if (!upstream.ok || !upstream.body) {
          const body = await upstream.text();
          let message = `The writing service returned an error (${upstream.status}).`;
          if (upstream.status === 402)
            message = "AI credits have run out. Add credits in Settings → Plans & credits.";
          else if (upstream.status === 429)
            message = "Too many requests right now. Please wait a moment and try again.";
          else {
            try {
              const detail = JSON.parse(body) as { error?: { message?: string }; message?: string };
              message = detail.error?.message ?? detail.message ?? message;
            } catch {
              // keep the generic message
            }
          }
          return jsonError(upstream.status, message);
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        const reader = upstream.body.getReader();
        let buffer = "";
        let wroteText = false;

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) {
                if (!wroteText)
                  controller.enqueue(
                    encoder.encode("\n[[error]]The model returned an empty draft."),
                  );
                controller.close();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data:")) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const event = JSON.parse(payload) as {
                    type?: string;
                    delta?: string;
                    error?: { message?: string };
                    response?: { error?: { message?: string } };
                  };
                  if (event.type === "response.output_text.delta" && event.delta) {
                    wroteText = true;
                    controller.enqueue(encoder.encode(event.delta));
                  } else if (event.type === "error" || event.type === "response.failed") {
                    const message =
                      event.error?.message ??
                      event.response?.error?.message ??
                      "The draft could not be completed.";
                    wroteText = true;
                    controller.enqueue(encoder.encode(`\n[[error]]${message}`));
                  }
                } catch {
                  // ignore partial or non-JSON lines
                }
              }
            }
          },
          cancel() {
            void reader.cancel();
          },
        });

        const responseHeaders = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
        const runId = upstream.headers.get(RUN_ID_HEADER);
        if (runId) responseHeaders.set(RUN_ID_HEADER, runId);
        return new Response(upstream.body, { headers: responseHeaders }); void stream;
      },
    },
  },
});
