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

async function main() {
  const dir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const body = fs.readFileSync(path.join(dir, file), "utf-8");
    const statements = body
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`→ ${file} (${statements.length} statements)`);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
  }
  console.log("✓ migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
