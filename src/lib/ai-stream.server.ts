import { timingSafeEqual } from "crypto";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export function codesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

/** Returns an error response when the owner code is missing or wrong, otherwise null. */
export function checkOwner(accessCode: string): Response | null {
  const ownerCode = process.env["README_STUDIO_ACCESS_CODE"];
  if (!ownerCode) return jsonError(500, "The studio is not configured yet.");
  if (!codesMatch(accessCode, ownerCode)) return jsonError(401, "That owner access code is not correct.");
  return null;
}

type StreamOptions = {
  request: Request;
  instructions: string;
  input: string;
  /** Text streamed verbatim before the model output (for example verified facts). */
  prefix?: string;
};

/** Streams a Responses API call as plain text; in-stream failures use the [[error]] marker. */
export async function streamModelText(options: StreamOptions): Promise<Response> {
  const { request, instructions, input, prefix } = options;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return jsonError(500, "The writing service is not configured yet.");

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
        instructions,
        input,
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
  let buffer = "";
  let wroteText = false;
  let wrotePrefix = false;

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
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
          event.error?.message ?? event.response?.error?.message ?? "The text could not be completed.";
        wroteText = true;
        controller.enqueue(encoder.encode(`\n[[error]]${message}`));
      }
    } catch {
      // ignore partial or non-JSON lines
    }
  };

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        if (prefix && !wrotePrefix) {
          wrotePrefix = true;
          controller.enqueue(encoder.encode(prefix));
        }
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) handleLine(line, controller);
      },
      flush(controller) {
        if (prefix && !wrotePrefix) controller.enqueue(encoder.encode(prefix));
        if (buffer) handleLine(buffer, controller);
        if (!wroteText) controller.enqueue(encoder.encode("\n[[error]]The model returned an empty response."));
      },
    }),
  );

  const responseHeaders = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
  const runId = upstream.headers.get(RUN_ID_HEADER);
  if (runId) responseHeaders.set(RUN_ID_HEADER, runId);
  return new Response(stream, { headers: responseHeaders });
}
