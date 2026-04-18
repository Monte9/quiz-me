import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) client = new Anthropic();
  return client;
}

export async function callJSON<T>(args: {
  system: string;
  user: string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 1500,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });

  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text");
  }
  const text = block.text.trim();
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let raw: unknown;
  try {
    raw = JSON.parse(stripped);
  } catch {
    throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`);
  }

  const parsed = args.schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Claude output failed schema: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
