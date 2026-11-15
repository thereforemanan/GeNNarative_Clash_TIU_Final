import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.DATABASE_PATH || join(process.cwd(), "data", "creatorpilot.sqlite3");
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
// Multiple Next.js workers may load API routes at the same time during a
// production build. Give concurrent SQLite schema setup a chance to finish.
db.exec("PRAGMA busy_timeout = 10000;");
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'English',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS drafts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    idea TEXT NOT NULL DEFAULT '',
    business_details TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'scheduled', 'published')),
    scheduled_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS drafts_user_updated_idx ON drafts(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS drafts_calendar_idx ON drafts(user_id, scheduled_at);
`);

export default db;
