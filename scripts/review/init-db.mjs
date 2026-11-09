import nextEnv from "@next/env";
import { createClient } from "@libsql/client";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set. Review DB init aborted.");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("[review] Initializing review tables...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_games (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      original_title TEXT,
      developer TEXT NOT NULL DEFAULT '',
      release_date TEXT,
      platforms TEXT NOT NULL DEFAULT '[]',
      genres TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      guide_slug TEXT,
      vndb_id TEXT,
      vndb_rating REAL,
      vndb_votes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      game_slug TEXT PRIMARY KEY REFERENCES review_games(slug),
      review_title TEXT NOT NULL,
      verdict TEXT NOT NULL,
      overall REAL NOT NULL,
      scores TEXT NOT NULL DEFAULT '{}',
      highlights TEXT NOT NULL DEFAULT '[]',
      issues TEXT NOT NULL DEFAULT '[]',
      audience TEXT NOT NULL DEFAULT '',
      similar TEXT NOT NULL DEFAULT '[]',
      faq TEXT NOT NULL DEFAULT '[]',
      body TEXT NOT NULL DEFAULT '[]',
      author TEXT NOT NULL DEFAULT 'Galgame 品鉴编辑部',
      status TEXT NOT NULL DEFAULT 'published',
      published_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS review_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_slug TEXT NOT NULL REFERENCES review_games(slug),
      source_type TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      note TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(game_slug, source_type, url)
    )
  `);

  await db.execute("CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_reviews_overall ON reviews(overall DESC)");
  await db.execute("CREATE INDEX IF NOT EXISTS idx_review_sources_game ON review_sources(game_slug)");

  console.log("[review] Review tables ready.");
}

main().catch((error) => {
  console.error("[review] DB init failed:", error);
  process.exit(1);
});
