import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import type { Difficulty } from "@/lib/quiz-core";

// Model tiers. We pick by difficulty: MC questions are simple enough for
// Haiku; hard essays need Sonnet's reasoning; xhard multi-paragraph
// questions + rubric grading warrant Opus. Swap IDs here if Anthropic
// releases new versions.
export type ModelTier = "haiku" | "sonnet" | "opus";

export const MODELS: Record<ModelTier, string> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-7",
};

export const DIFFICULTY_MODEL: Record<Difficulty, ModelTier> = {
  easy: "haiku",
  medium: "haiku",
  hard: "sonnet",
  xhard: "opus",
};

export function modelForDifficulty(d: Difficulty): string {
  return MODELS[DIFFICULTY_MODEL[d]];
}

// Reverse lookup for UI. Returns the tier name ("Haiku" / "Sonnet" /
// "Opus") for a stored model ID. Unknown IDs fall back to the raw string
// so grandfathered rows still show something useful.
export function tierLabelForModel(model: string | null | undefined): string {
  if (!model) return "";
  for (const [tier, id] of Object.entries(MODELS)) {
    if (id === model) return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
  return model;
}

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
  model?: string;
}): Promise<T> {
  const resp = await getClient().messages.create({
    model: args.model ?? MODELS.sonnet,
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

// Legacy default export for any callers that don't care about tiering.
export const MODEL = MODELS.sonnet;
