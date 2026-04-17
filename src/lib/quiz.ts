import fs from "fs";
import path from "path";

const historyPath = path.join(process.cwd(), "history.json");

export type Difficulty = "easy" | "medium" | "hard" | "xhard";
export type Medium = "text" | "image";
export type Result = "correct" | "partial" | "wrong" | "skipped";

export interface Interest {
  name: string;
  addedAt: string;
}

export interface Question {
  id: string;
  difficulty: Difficulty;
  medium: Medium;
  topic: string;
  question: string;
  answerKey: string;
  userAnswer: string | null;
  result: Result | null;
  thoughtfulnessScore: number | null;
  imagePath: string | null;
  grade: string | null;
  createdAt: string;
}

export interface History {
  interests: Interest[];
  questions: Question[];
}

function readHistory(): History {
  if (!fs.existsSync(historyPath)) {
    return { interests: [], questions: [] };
  }
  const raw = fs.readFileSync(historyPath, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<History>;
    return {
      interests: parsed.interests ?? [],
      questions: parsed.questions ?? [],
    };
  } catch {
    return { interests: [], questions: [] };
  }
}

export function getAllQuestions(): Question[] {
  const { questions } = readHistory();
  return [...questions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getQuestionById(id: string): Question | null {
  const { questions } = readHistory();
  return questions.find((q) => q.id === id) ?? null;
}

export function getAllIds(): string[] {
  const { questions } = readHistory();
  return questions.map((q) => q.id);
}

export function getInterests(): Interest[] {
  return readHistory().interests;
}
