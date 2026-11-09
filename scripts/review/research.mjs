import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const args = process.argv.slice(2);
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? args[titleIndex + 1]?.trim() : "";
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : "";

if (!title) {
  console.error('Usage: node scripts/review/research.mjs --title "作品名" [--out data/review-drafts/slug.json]');
  process.exit(1);
}

const VNDB_ENDPOINT = "https://api.vndb.org/kana/vn";

async function searchVndb(query) {
  const response = await fetch(VNDB_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "galgame-guide-review-research/0.1",
    },
    body: JSON.stringify({
      filters: ["search", "=", query],
      fields: "id,title,alttitle,released,developers.name,platforms,tags.name,rating,votecount",
      sort: "searchrank",
      results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`VNDB HTTP ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

const data = await searchVndb(title);
const candidates = Array.isArray(data.results) ? data.results : [];

if (candidates.length === 0) {
  console.error(`No VNDB candidates for: ${title}`);
  process.exit(2);
}

console.log(`VNDB candidates for "${title}":`);
for (const [index, candidate] of candidates.entries()) {
  const developers = (candidate.developers ?? []).map((item) => item.name).join(" / ");
  console.log(
    `${index + 1}. ${candidate.title} (${candidate.id})`,
    `| ${candidate.released ?? "release TBD"}`,
    `| ${candidate.rating?.toFixed?.(1) ?? "no rating"}`,
    `| ${candidate.votecount ?? 0} votes`,
    `| ${developers || "developer unknown"}`,
  );
}

if (outPath) {
  const first = candidates[0];
  const draft = {
    generatedAt: new Date().toISOString(),
    status: "draft",
    reviews: [
      {
        slug: first.id,
        title: first.title,
        originalTitle: first.alttitle ?? null,
        developer: (first.developers ?? []).map((item) => item.name).join(" / "),
        releaseDate: first.released ?? null,
        platforms: first.platforms ?? [],
        genres: (first.tags ?? []).slice(0, 6).map((tag) => tag.name),
        summary: "",
        guideSlug: null,
        vndbId: first.id,
        vndbRating: first.rating ?? null,
        vndbVotes: first.votecount ?? null,
        reviewTitle: "",
        verdict: "",
        overall: 0,
        scores: { story: 0, characters: 0, music: 0, art: 0, system: 0 },
        highlights: [],
        issues: [],
        audience: "",
        similar: [],
        faq: [],
        body: [],
        author: "Galgame 品鉴编辑部",
        publishedAt: null,
        updatedAt: null,
      },
    ],
  };

  const absolute = join(process.cwd(), outPath);
  await mkdir(join(absolute, ".."), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  console.log(`\nDraft written: ${outPath}`);
  console.log("Next: fill reviewTitle / verdict / scores / highlights / issues / audience / similar / faq / body, then review manually.");
}
