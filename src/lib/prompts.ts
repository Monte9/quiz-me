import type { Difficulty } from "@/lib/users";

const SHARED_GEN_SYSTEM = `You are Ash, quizzing Monte on topics he's chosen.
One question per call. Tight. Interesting. Never repeat a question he's already been asked.
Respond ONLY with a single JSON object. No prose. No code fences. No preamble.`;

const DIFFICULTY_RULES: Record<Difficulty, string> = {
  easy: `Shape: binary yes/no question.
Example: "Did Julius Caesar cross the Rubicon in 49 BCE?"
JSON keys (exact): "question" (string), "options" (array of exactly ["Yes", "No"]), "correctIndex" (0 for Yes, 1 for No), "answerKey" (one line of context — who/what/when/why — no need to restate Yes/No), "slug" (short kebab-case, 2–4 words).`,

  medium: `Shape: multiple choice with exactly 4 options, one correct.
The options should be plausible — all from the same category/era/domain, so the wrong ones are believable distractors, not obvious throwaways.
Example question: "Which Mauryan emperor built the Sanchi Stupa?"
Example options: ["Chandragupta", "Bindusara", "Ashoka", "Dasharatha"]
JSON keys (exact): "question" (string), "options" (array of exactly 4 strings), "correctIndex" (0-3, index of the correct option), "answerKey" (2–4 sentences of context — the chain of facts that lead to the answer), "slug" (short kebab-case, 2–4 words).`,

  hard: `Shape: a short-essay concept question. "How does X work?" or "Why does Y happen?"
Example: "How does a transformer model's attention mechanism actually work?"
JSON keys (exact): "question" (string), "answerKey" (a rigorous 5–8 sentence reference answer — what a correct, well-informed explanation would cover, including the concepts that separate a B+ from an A+), "slug" (short kebab-case, 2–4 words).`,

  xhard: `Shape: propose a solution to an unsolved real-world problem.
CRITICAL: the "question" field MUST include 1–2 paragraphs of context before asking the actual question.
Context paragraphs describe: current state of the problem, what's been tried, who's tried it, why approaches have stalled.
Then end with the direct ask, e.g. "What approach would you propose, and why?"
JSON keys (exact): "question" (string), "answerKey" (a "reference framing" — 5–8 sentences describing the dimensions a strong proposal would consider: input variables, tradeoffs, stakeholders, second-order effects, failure modes), "slug" (short kebab-case, 2–4 words).`,
};

export function generationPrompt(
  difficulty: Difficulty,
  topic: string,
  recentQuestions: string[],
): { system: string; user: string } {
  const system = `${SHARED_GEN_SYSTEM}\n\nDifficulty: ${difficulty}\n${DIFFICULTY_RULES[difficulty]}`;
  const asked = recentQuestions.length
    ? `Questions already asked on this topic (DO NOT repeat or closely paraphrase any of these):\n${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "No prior questions on this topic.";
  const user = `Topic: ${topic}\n\n${asked}\n\nAsk one ${difficulty} question on this topic that is distinct from all of the above. Respond with JSON only.`;
  return { system, user };
}

export function discoverGenerationPrompt(
  difficulty: Difficulty,
  excludeTopics: string[],
): { system: string; user: string } {
  const system = `${SHARED_GEN_SYSTEM}

Difficulty: ${difficulty}
${DIFFICULTY_RULES[difficulty]}

Discover mode: YOU pick the topic. It must be fresh for Monte — not in the excluded list below and not closely related to anything on it. Surprise him. Range wide: history, science, philosophy, myth, art, music, sports, tech, economics, linguistics, geography, architecture, anywhere. Pick something with depth, not trivia fluff.
Additional JSON key (required): "topic" — short lowercase label for the topic you picked, 1–3 words, e.g. "astronomy", "ottoman empire", "jazz history", "game theory".`;
  const excluded = excludeTopics.length
    ? `Excluded topics (DO NOT pick any of these or anything closely related):\n${excludeTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
    : "No exclusions yet — pick anything interesting.";
  const user = `${excluded}\n\nPick a fresh topic outside the excluded list, then ask one ${difficulty} question on that topic. Respond with JSON only, including the "topic" field.`;
  return { system, user };
}

const SHARED_GRADE_SYSTEM = `You are Ash, grading Monte's answer.
Be honest. Direct. The friend who tells you when you're wrong. No sycophancy, no hedging.
Respond ONLY with a single JSON object. No prose. No code fences.`;

const GRADE_RULES: Record<Difficulty, string> = {
  easy: `Return: {"result": "correct" | "partial" | "wrong", "grade": "<one-line feedback>"}.
partial is rare for easy — only if the user answered yes/no with a notable caveat.
The grade is one sentence max. Tell him what was right or wrong and the actual answer in one line.`,

  medium: `Return: {"result": "correct" | "partial" | "wrong", "grade": "<one-line feedback>"}.
"correct" = the intended answer or a well-known synonym.
"partial" = adjacent or ballpark (same empire/era/category but wrong specific).
"wrong" = off-base.
The grade is one sentence max.`,

  hard: `Return: {"result": "correct" | "partial" | "wrong", "grade": "<one-line feedback>"}.
"correct" = covered the core mechanism/reasoning.
"partial" = right instinct but missed a key dimension.
"wrong" = misunderstood the concept.
The grade is ONE sentence naming what was sharp, what was missed, or what a stronger take looks like.`,

  xhard: `Return: {"thoughtfulnessScore": 1 | 2 | 3 | 4 | 5, "grade": "<2–3 sentence feedback>"}.
Rubric:
1 = surface take, missed major dimensions
2 = starts on the right track but thin
3 = solid framing, missing a dimension or two
4 = strong proposal, considers most tradeoffs
5 = considers all major input variables, weighs tradeoffs, anticipates second-order effects
The grade names the score's reason and what dimensions he missed or nailed.`,
};

export function gradingPrompt(
  difficulty: Difficulty,
  question: string,
  answerKey: string,
  userAnswer: string,
): { system: string; user: string } {
  const system = `${SHARED_GRADE_SYSTEM}\n\nDifficulty: ${difficulty}\n${GRADE_RULES[difficulty]}`;
  const user = `Question:\n${question}\n\nReference answer:\n${answerKey}\n\nMonte's answer:\n${userAnswer}\n\nGrade it. JSON only.`;
  return { system, user };
}
