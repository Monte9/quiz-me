---
name: run-local
description: Launch the quiz-me Next.js app locally and drive it (e.g. for screenshots), including in a headless cloud container with NO Neon or Anthropic credentials — via local Postgres behind a Neon HTTP shim. Use when asked to run, start, build, or screenshot the app.
---

# Run quiz-me locally

The app reads/writes Postgres **only** through Neon's serverless HTTP driver
(`@neondatabase/serverless`), which POSTs SQL to `https://<host>/sql`. It does
**not** open a normal Postgres TCP connection, so you cannot just point
`DATABASE_URL` at a local `postgres://` and have it work. Pick the path below.

## Path A — real credentials (simplest)

If you have a real Neon string and Anthropic key, set them and go:

```bash
export DATABASE_URL='postgres://...neon.tech/...?sslmode=require'
export ANTHROPIC_API_KEY='sk-ant-...'
pnpm install
pnpm db:migrate   # idempotent
pnpm db:seed      # loads users.json into Postgres
pnpm dev          # http://localhost:3000
```

This is the only path that exercises live quiz generation/grading (`/api/quiz/*`).

## Path B — no credentials (offline UI + screenshots)

For seeing the UI or taking screenshots in a cloud container with no secrets.
Stands up local Postgres and a tiny HTTPS shim that translates Neon's `/sql`
HTTP protocol to a real `pg` connection. **Verified working in this repo's
Claude Code cloud container (Postgres 16, root user).**

### 1. Start Postgres + create the DB

```bash
pg_ctlcluster 16 main start
su postgres -c "psql -c \"alter user postgres password 'postgres'\" && createdb -O postgres quizme"
```

### 2. Hosts + TLS cert for the shim

The driver rewrites the host's first DNS label to `api.` and POSTs to
`https://api.<rest>/sql`. So use a `DATABASE_URL` host like `db.neon.local`
(first label ≠ `api`); the shim must serve `api.neon.local` over TLS.

```bash
grep -q neon.local /etc/hosts || echo '127.0.0.1 db.neon.local api.neon.local' >> /etc/hosts
mkdir -p /tmp/neon-shim && cd /tmp/neon-shim
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 7 \
  -subj '/CN=api.neon.local' -addext 'subjectAltName=DNS:api.neon.local,DNS:db.neon.local'
npm init -y >/dev/null && npm install pg   # pg is NOT a project dep; install here
```

### 3. The shim

Save as `/tmp/neon-shim/shim.js` and run `node shim.js` (needs port 443 → root):

```js
// Neon serverless HTTP driver shim (@neondatabase/serverless 1.x) over local pg.
// Speaks POST /sql with {query,params} or {queries:[...]}, Neon-Raw-Text-Output
// + Neon-Array-Mode headers, replies {command,rowCount,fields,rows} as raw text
// arrays parsed client-side by dataTypeID.
const https = require("https"), fs = require("fs"), { Pool } = require("pg");
const rawText = { getTypeParser: () => (v) => v };
const pool = new Pool({ connectionString: "postgres://postgres:postgres@127.0.0.1:5432/quizme" });
async function runOne(client, q) {
  const r = await client.query({ text: q.query, values: q.params ?? [], rowMode: "array", types: rawText });
  return { command: r.command, rowCount: r.rowCount ?? 0,
    fields: (r.fields ?? []).map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
    rows: r.rows ?? [], rowAsArray: true };
}
https.createServer(
  { key: fs.readFileSync("/tmp/neon-shim/key.pem"), cert: fs.readFileSync("/tmp/neon-shim/cert.pem") },
  (req, res) => {
    let body = ""; req.on("data", (c) => (body += c));
    req.on("end", async () => {
      const client = await pool.connect();
      try {
        const p = JSON.parse(body); let out;
        if (Array.isArray(p.queries)) {
          await client.query("begin"); const results = [];
          for (const q of p.queries) results.push(await runOne(client, q));
          await client.query("commit"); out = { results };
        } else out = await runOne(client, p);
        res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(out));
      } catch (e) {
        try { await client.query("rollback"); } catch {}
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ message: e.message, code: e.code, severity: e.severity, detail: e.detail, hint: e.hint, position: e.position }));
      } finally { client.release(); }
    });
  }
).listen(443, () => console.log("neon shim on :443"));
```

```bash
cd /tmp/neon-shim && (node shim.js > shim.log 2>&1 &) && sleep 1 && cat shim.log
```

### 4. Point the app at the shim, migrate, seed, run

```bash
export NODE_EXTRA_CA_CERTS=/tmp/neon-shim/cert.pem
export DATABASE_URL='postgres://postgres:postgres@db.neon.local/quizme?sslmode=require'
export ANTHROPIC_API_KEY=dummy   # browsing needs no real key; /api/quiz/* will 401
pnpm db:migrate && pnpm db:seed
pnpm dev > /tmp/next-dev.log 2>&1 &
timeout 60 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done' && echo UP
```

`users.json` seeds only **1** question, so most pages look empty. For
representative screenshots, insert a few demo rows straight into Postgres
(**local only — never commit fake data**). Shape:

```sql
-- MC (easy/medium): needs options + correct_index; freeform (hard/xhard): grade carries the reference.
insert into questions (id, username, difficulty, medium, topic, question, answer_key, user_answer, result, options, correct_index, model, status, created_at, graded_at)
values ('demo-mc','monte','medium','text','geography','Which strait carries ~25% of traded goods by sea?',
        'The Strait of Malacca, between the Malay Peninsula and Sumatra.','Strait of Malacca','correct',
        '["Strait of Hormuz","Strait of Malacca","Sunda Strait","Lombok Strait"]',1,'claude-haiku-4-5','graded',now(),now());
```

Cover a spread of difficulties and `result` values (correct/partial/wrong/skipped,
plus an xhard with `thoughtfulness_score`) so the stat tiles and filters render.

## Screenshots with Playwright

A Chromium build is preinstalled at `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`).
**Pin the matching driver** or Playwright will demand a fresh download:

```bash
cd /tmp && mkdir -p pw && cd pw && npm init -y >/dev/null
npm install playwright@1.56.1   # MUST match the preinstalled browser build
```

Launch with `chromium.launch({ args: ["--no-sandbox"] })`, use
`{ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }` for crisp
shots, `goto(url, { waitUntil: "networkidle" })`, and check `page.on("console"...)`
for errors before trusting a shot. Pages worth capturing: `/` (+ fullPage),
`/questions`, `/monte`, `/questions/<id>`. Compress with the project's `sharp`
(`png({ compressionLevel: 9, palette: true })`) before committing to `docs/`.

## Gotchas (recap)

- **No raw local Postgres** — the Neon HTTP driver needs the shim (Path B) or a real Neon URL (Path A).
- **Host rewrite** — driver POSTs to `api.<host>`; cert SAN + /etc/hosts must cover it.
- **`pg` is not a project dependency** — install it in the shim's scratch dir, not `package.json`.
- **Playwright version pin** — match `/opt/pw-browsers`; mismatched versions error out.
- **No live Claude offline** — the sandbox gateway rejects placeholder keys, so `/api/quiz/*` only works on Path A.
- **Clean the tree** — `pnpm dev` rewrites `next-env.d.ts`; `git checkout next-env.d.ts` before committing.
