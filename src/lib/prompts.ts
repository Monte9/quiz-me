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
JSON keys (exact): "question" (string), "slug" (short kebab-case, 2–4 words).`,

  xhard: `Shape: propose a solution to an unsolved real-world problem.
The "question" field MUST be a structured document with these four sections in order, separated by blank lines:

(1) One short paragraph (3-4 sentences): what the problem is, why it matters now.
(2) One short paragraph (2-3 sentences): what's been tried, by whom, and why it has fallen short.
(3) A line starting with "**Your task:**" followed by 1-2 sentences stating the direct ask.
(4) A line reading exactly "Constraints:" followed by 3-5 bulleted lines (each starting with "- ") — the hard requirements any solution must satisfy. Keep each bullet to one short clause.

Use plain punctuation only. Do NOT use em-dashes or en-dashes. Prefer short, concrete sentences over dense clause-stacking.
JSON keys (exact): "question" (string with the four-section structure above), "slug" (short kebab-case, 2-4 words).`,
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

  hard: `Return: {"result": "correct" | "partial" | "wrong", "grade": "<3–5 sentence feedback that doubles as the reference answer>"}.
"correct" = covered the core mechanism/reasoning.
"partial" = right instinct but missed a key dimension.
"wrong" = misunderstood the concept.
The grade should (a) say what Monte got right or wrong in one sentence, then (b) explain the correct mechanism or reasoning in 2–4 sentences. A reader who never saw Monte's answer should still learn the concept from the grade.`,

  xhard: `Return: {"thoughtfulnessScore": 1 | 2 | 3 | 4 | 5, "grade": "<4–6 sentence feedback that doubles as the reference framing>"}.
Rubric:
1 = surface take, missed major dimensions
2 = starts on the right track but thin
3 = solid framing, missing a dimension or two
4 = strong proposal, considers most tradeoffs
5 = considers all major input variables, weighs tradeoffs, anticipates second-order effects
The grade should (a) name the dimensions Monte hit or missed, then (b) sketch what a strong proposal would consider — input variables, tradeoffs, stakeholders, second-order effects, failure modes. A reader who never saw Monte's answer should still see the shape of a strong answer.`,
};

export function gradingPrompt(
  difficulty: Difficulty,
  question: string,
  answerKey: string | null,
  userAnswer: string,
): { system: string; user: string } {
  const system = `${SHARED_GRADE_SYSTEM}\n\nDifficulty: ${difficulty}\n${GRADE_RULES[difficulty]}`;
  // easy/medium carry a pre-generated reference answer so grading stays
  // consistent with the answer-key shown to the user. hard/xhard grade
  // from scratch — the grade itself is the reference now.
  const ref =
    answerKey && answerKey.trim().length > 0
      ? `\n\nReference answer:\n${answerKey}`
      : "";
  const user = `Question:\n${question}${ref}\n\nMonte's answer:\n${userAnswer}\n\nGrade it. JSON only.`;
  return { system, user };
}

// Skip path: Monte didn't answer, but he still wants to learn the material.
// Produce just the reference answer — no judgment, no "what he got right/wrong".
const SKIP_REFERENCE_RULES: Record<Difficulty, string> = {
  easy: `One sentence. State the correct yes/no and a line of context (who/what/when/why).`,
  medium: `2–4 sentences. State the correct answer and the chain of facts that lead to it.`,
  hard: `3–5 sentences. Explain the core mechanism or reasoning. A reader should learn the concept from this alone.`,
  xhard: `4–6 sentences. Sketch what a strong proposal would consider — input variables, tradeoffs, stakeholders, second-order effects, failure modes.`,
};

export function skippedReferencePrompt(
  difficulty: Difficulty,
  question: string,
): { system: string; user: string } {
  const system = `You are Ash. Monte skipped this question — give him the reference answer he should have known. No judgment, no "you should have tried," just the knowledge.
Respond ONLY with a single JSON object: {"grade": "<reference answer>"}. No prose. No code fences.

Difficulty: ${difficulty}
${SKIP_REFERENCE_RULES[difficulty]}`;
  const user = `Question:\n${question}\n\nProvide the reference answer. JSON only.`;
  return { system, user };
}
