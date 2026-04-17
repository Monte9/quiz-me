import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set (check .env.local)");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

interface Interest {
  name: string;
  addedAt: string;
}

interface Question {
  id: string;
  difficulty: string;
  medium: string;
  topic: string;
  question: string;
  answerKey: string;
  userAnswer: string | null;
  result: string | null;
  thoughtfulnessScore: number | null;
  imagePath: string | null;
  grade: string | null;
  createdAt: string;
}

interface UserData {
  displayName: string;
  createdAt: string;
  claimedAt: string | null;
  password: string | null;
  inviteCode: string | null;
  interests: Interest[];
  questions: Question[];
}

interface UsersFile {
  users: Record<string, UserData>;
}

async function main() {
  const jsonPath = path.join(process.cwd(), "users.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as UsersFile;

  let userCount = 0;
  let questionCount = 0;

  for (const [username, u] of Object.entries(data.users)) {
    await sql`
      insert into users (username, display_name, created_at, claimed_at, password, invite_code, interests)
      values (
        ${username},
        ${u.displayName},
        ${u.createdAt},
        ${u.claimedAt},
        ${u.password},
        ${u.inviteCode},
        ${JSON.stringify(u.interests)}::jsonb
      )
      on conflict (username) do update set
        display_name = excluded.display_name,
        claimed_at   = excluded.claimed_at,
        password     = excluded.password,
        invite_code  = excluded.invite_code,
        interests    = excluded.interests
    `;
    userCount++;

    for (const q of u.questions) {
      const status = q.result === "skipped" ? "skipped" : q.result ? "graded" : "pending";
      const gradedAt = status === "graded" || status === "skipped" ? q.createdAt : null;

      await sql`
        insert into questions (
          id, username, difficulty, medium, topic, question, answer_key,
          user_answer, result, thoughtfulness_score, image_path, grade,
          status, created_at, graded_at
        )
        values (
          ${q.id}, ${username}, ${q.difficulty}, ${q.medium}, ${q.topic},
          ${q.question}, ${q.answerKey}, ${q.userAnswer}, ${q.result},
          ${q.thoughtfulnessScore}, ${q.imagePath}, ${q.grade},
          ${status}, ${q.createdAt}, ${gradedAt}
        )
        on conflict (id) do update set
          user_answer          = excluded.user_answer,
          result               = excluded.result,
          thoughtfulness_score = excluded.thoughtfulness_score,
          grade                = excluded.grade,
          status               = excluded.status,
          graded_at            = excluded.graded_at
      `;
      questionCount++;
    }
  }

  console.log(`✓ seeded ${userCount} users, ${questionCount} questions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
