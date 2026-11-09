import { cache } from "react";

import { db } from "@/lib/db";
import type { ReviewFaq, ReviewRecord, ReviewScores, ReviewSimilar } from "@/lib/review/types";

type RawRow = Record<string, unknown>;

const REVIEW_CACHE_TTL_MS = 5 * 60 * 1000;

function parseStringArray(raw: unknown): string[] {
  try {
    const value = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseSimilar(raw: unknown): ReviewSimilar[] {
  try {
    const value = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        title: String((item as ReviewSimilar)?.title ?? "").trim(),
        slug: (item as ReviewSimilar)?.slug
          ? String((item as ReviewSimilar).slug).trim()
          : undefined,
      }))
      .filter((item) => item.title.length > 0);
  } catch {
    return [];
  }
}

function parseFaq(raw: unknown): ReviewFaq[] {
  try {
    const value = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => ({
        question: String((item as ReviewFaq)?.question ?? "").trim(),
        answer: String((item as ReviewFaq)?.answer ?? "").trim(),
      }))
      .filter((item) => item.question.length > 0 && item.answer.length > 0);
  } catch {
    return [];
  }
}

function parseScores(raw: unknown): ReviewScores {
  try {
    const value = JSON.parse(String(raw ?? "{}")) as Partial<ReviewScores>;
    return {
      story: Number(value.story ?? 0),
      characters: Number(value.characters ?? 0),
      music: Number(value.music ?? 0),
      art: Number(value.art ?? 0),
      system: Number(value.system ?? 0),
    };
  } catch {
    return { story: 0, characters: 0, music: 0, art: 0, system: 0 };
  }
}

function mapRow(row: RawRow): ReviewRecord {
  return {
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    originalTitle: row.original_title ? String(row.original_title) : null,
    developer: String(row.developer ?? ""),
    releaseDate: row.release_date ? String(row.release_date) : null,
    platforms: parseStringArray(row.platforms),
    genres: parseStringArray(row.genres),
    summary: String(row.summary ?? ""),
    guideSlug: row.guide_slug ? String(row.guide_slug) : null,
    vndbId: row.vndb_id ? String(row.vndb_id) : null,
    vndbRating: row.vndb_rating == null ? null : Number(row.vndb_rating),
    vndbVotes: row.vndb_votes == null ? null : Number(row.vndb_votes),
    reviewTitle: String(row.review_title ?? ""),
    verdict: String(row.verdict ?? ""),
    overall: Number(row.overall ?? 0),
    scores: parseScores(row.scores),
    highlights: parseStringArray(row.highlights),
    issues: parseStringArray(row.issues),
    audience: String(row.audience ?? ""),
    similar: parseSimilar(row.similar),
    faq: parseFaq(row.faq),
    body: parseStringArray(row.body),
    author: String(row.author ?? "旮旯喵评编辑部"),
    publishedAt: String(row.published_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

const REVIEW_QUERY = `
  SELECT
    r.game_slug AS slug,
    g.title,
    g.original_title,
    g.developer,
    g.release_date,
    g.platforms,
    g.genres,
    g.summary,
    g.guide_slug,
    g.vndb_id,
    g.vndb_rating,
    g.vndb_votes,
    r.review_title,
    r.verdict,
    r.overall,
    r.scores,
    r.highlights,
    r.issues,
    r.audience,
    r.similar,
    r.faq,
    r.body,
    r.author,
    r.published_at,
    r.updated_at
  FROM reviews r
  JOIN review_games g ON g.slug = r.game_slug
  WHERE r.status = 'published'
  ORDER BY r.published_at DESC, r.overall DESC
`;

let allReviewsCache: { at: number; value: ReviewRecord[] } | null = null;
let allReviewsInFlight: Promise<ReviewRecord[]> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function queryWithRetry<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === 3) {
        console.error(`[review] ${label} failed after 3 attempts:`, error instanceof Error ? error.message : error);
        return fallback;
      }
      await sleep(attempt * 800);
    }
  }
  return fallback;
}

export const getAllReviews = cache(async (): Promise<ReviewRecord[]> => {
  if (allReviewsCache && Date.now() - allReviewsCache.at < REVIEW_CACHE_TTL_MS) {
    return allReviewsCache.value;
  }
  if (allReviewsInFlight) return allReviewsInFlight;

  allReviewsInFlight = queryWithRetry(
    async () => {
      const result = await db.execute(REVIEW_QUERY);
      return result.rows
        .map((row) => mapRow(row as RawRow))
        .filter((item) => item.slug && item.title);
    },
    [],
    "getAllReviews",
  )
    .then((reviews) => {
      if (reviews.length > 0) allReviewsCache = { at: Date.now(), value: reviews };
      return reviews;
    })
    .finally(() => {
      allReviewsInFlight = null;
    });

  return allReviewsInFlight;
});

export const getReviewBySlug = cache(async (slug: string): Promise<ReviewRecord | null> => {
  const reviews = await getAllReviews();
  return reviews.find((review) => review.slug === slug) ?? null;
});

/**
 * 资料库 ↔ 喵评的桥。
 *
 * 首选 guide_slug（编辑时明确挂上的作品 slug），老数据没有 guide_slug 时
 * 再按作品名精确匹配，避免只因为标题前缀相同就乱配。
 */
export const getReviewForGame = cache(
  async (guideSlug: string, title?: string): Promise<ReviewRecord | null> => {
    const reviews = await getAllReviews();
    const byGuideSlug = reviews.find((review) => review.guideSlug === guideSlug);
    if (byGuideSlug) return byGuideSlug;
    if (!title) return null;
    return reviews.find((review) => review.title === title) ?? null;
  },
);

export const getReviewSlugs = cache(async (): Promise<string[]> => {
  const reviews = await getAllReviews();
  return reviews.map((review) => review.slug);
});

export const getReviewCount = cache(async (): Promise<number> => {
  const reviews = await getAllReviews();
  return reviews.length;
});
