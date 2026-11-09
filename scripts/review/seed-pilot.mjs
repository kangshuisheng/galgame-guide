import nextEnv from "@next/env";
import { createClient } from "@libsql/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

if (!process.env.TURSO_DATABASE_URL) {
  console.error("TURSO_DATABASE_URL is not set. Review seed aborted.");
  process.exit(1);
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const dataPath = join(process.cwd(), "data", "review-pilot.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));

if (!Array.isArray(data.reviews) || data.reviews.length === 0) {
  console.error("No reviews found in data/review-pilot.json");
  process.exit(1);
}

const now = new Date().toISOString();

for (const review of data.reviews) {
  if (!review.slug || !review.title || !review.reviewTitle) {
    throw new Error(`Invalid review entry: ${review.slug ?? "(missing slug)"}`);
  }

  await db.execute({
    sql: `
      INSERT INTO review_games (
        slug, title, original_title, developer, release_date, platforms, genres,
        summary, guide_slug, vndb_id, vndb_rating, vndb_votes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        original_title = excluded.original_title,
        developer = excluded.developer,
        release_date = excluded.release_date,
        platforms = excluded.platforms,
        genres = excluded.genres,
        summary = excluded.summary,
        guide_slug = excluded.guide_slug,
        vndb_id = excluded.vndb_id,
        vndb_rating = excluded.vndb_rating,
        vndb_votes = excluded.vndb_votes,
        updated_at = excluded.updated_at
    `,
    args: [
      review.slug,
      review.title,
      review.originalTitle ?? null,
      review.developer ?? "",
      review.releaseDate ?? null,
      JSON.stringify(review.platforms ?? []),
      JSON.stringify(review.genres ?? []),
      review.summary ?? "",
      review.guideSlug ?? null,
      review.vndbId ?? null,
      review.vndbRating ?? null,
      review.vndbVotes ?? null,
      now,
    ],
  });

  await db.execute({
    sql: `
      INSERT INTO reviews (
        game_slug, review_title, verdict, overall, scores, highlights, issues,
        audience, similar, faq, body, author, status, published_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
      ON CONFLICT(game_slug) DO UPDATE SET
        review_title = excluded.review_title,
        verdict = excluded.verdict,
        overall = excluded.overall,
        scores = excluded.scores,
        highlights = excluded.highlights,
        issues = excluded.issues,
        audience = excluded.audience,
        similar = excluded.similar,
        faq = excluded.faq,
        body = excluded.body,
        author = excluded.author,
        status = excluded.status,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at
    `,
    args: [
      review.slug,
      review.reviewTitle,
      review.verdict,
      review.overall,
      JSON.stringify(review.scores ?? {}),
      JSON.stringify(review.highlights ?? []),
      JSON.stringify(review.issues ?? []),
      review.audience ?? "",
      JSON.stringify(review.similar ?? []),
      JSON.stringify(review.faq ?? []),
      JSON.stringify(review.body ?? []),
      review.author ?? "Galgame 品鉴编辑部",
      review.publishedAt ?? data.generatedAt ?? now,
      now,
    ],
  });

  await db.execute({
    sql: "DELETE FROM review_sources WHERE game_slug = ?",
    args: [review.slug],
  });

  if (review.vndbId) {
    await db.execute({
      sql: `
        INSERT INTO review_sources (game_slug, source_type, url, title, note, fetched_at)
        VALUES (?, 'vndb', ?, 'VNDB 作品页', '评分与基础元数据参考', ?)
      `,
      args: [review.slug, `https://vndb.org/${review.vndbId}`, now],
    });
  }
}

console.log(`[review] Seeded ${data.reviews.length} pilot reviews.`);
