import { readFile } from "node:fs/promises";
import { join } from "node:path";

const dataPath = join(process.cwd(), "data", "review-pilot.json");
const data = JSON.parse(await readFile(dataPath, "utf8"));
const reviews = Array.isArray(data.reviews) ? data.reviews : [];

const blockedPattern =
  /(绅士|成人|r18|18禁|色情|黄油|里番|肉番|ntr|后宫|巨乳|福利姬|裸体|裸照|性交|性爱|做爱|口交|中出|调教|痴汉|无码|无修正|拔作)/iu;

const errors = [];
const slugs = new Set();

function textOf(review) {
  return [
    review.verdict ?? "",
    ...(review.highlights ?? []),
    ...(review.issues ?? []),
    review.audience ?? "",
    ...(review.body ?? []),
  ].join("");
}

for (const review of reviews) {
  const id = review.slug || "(missing slug)";
  if (!review.slug) errors.push(`${id}: missing slug`);
  if (slugs.has(review.slug)) errors.push(`${id}: duplicate slug`);
  slugs.add(review.slug);

  for (const field of ["title", "developer", "reviewTitle", "verdict", "audience"]) {
    if (!String(review[field] ?? "").trim()) errors.push(`${id}: missing ${field}`);
  }
  if (!Array.isArray(review.highlights) || review.highlights.length < 3) {
    errors.push(`${id}: highlights must have at least 3 items`);
  }
  if (!Array.isArray(review.issues) || review.issues.length < 2) {
    errors.push(`${id}: issues must have at least 2 items`);
  }
  if (!Array.isArray(review.similar) || review.similar.length < 3) {
    errors.push(`${id}: similar must have at least 3 items`);
  }
  if (!Array.isArray(review.faq) || review.faq.length < 3) {
    errors.push(`${id}: faq must have at least 3 items`);
  }
  if (!Array.isArray(review.body) || review.body.length < 3) {
    errors.push(`${id}: body must have at least 3 paragraphs`);
  }
  if (typeof review.overall !== "number" || review.overall < 0 || review.overall > 10) {
    errors.push(`${id}: overall must be 0-10`);
  }
  for (const key of ["story", "characters", "music", "art", "system"]) {
    const value = review.scores?.[key];
    if (typeof value !== "number" || value < 0 || value > 10) {
      errors.push(`${id}: score ${key} must be 0-10`);
    }
  }

  const content = textOf(review);
  if (content.length < 500 || content.length > 800) {
    errors.push(`${id}: review text length ${content.length}, expected 500-800`);
  }
  const match = content.match(blockedPattern);
  if (match) errors.push(`${id}: contains blocked word "${match[0]}"`);
}

if (reviews.length !== 10) errors.push(`expected 10 pilot reviews, got ${reviews.length}`);

if (errors.length > 0) {
  console.error("[review] Validation failed:");
  for (const error of errors) console.error(" -", error);
  process.exit(1);
}

console.log(`[review] Validation passed: ${reviews.length} reviews.`);
