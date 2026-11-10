import type { Metadata } from "next";
import Link from "next/link";

import { GameCard } from "@/components/game-card";
import { getAllReviews } from "@/lib/review/reviews";
import { findGames, getTopTags, type CatalogSort } from "@/lib/games";
import { buildCanonicalPath, OG_IMAGE } from "@/lib/seo";

export const revalidate = 3600;

type ArchiveSearchParams = {
  page?: string;
  q?: string;
  tag?: string;
  sort?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ArchiveSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = Boolean(params.q || params.tag || params.sort || Number(params.page) > 1);
  return {
    title: "Galgame 游戏大全｜全部作品",
    description:
      "浏览旮旯喵评资料库收录的全部 Galgame 与视觉小说，可按作品名、题材或平台查找，也能按热度和更新时间排序。",
    alternates: {
      canonical: buildCanonicalPath("archive"),
    },
    openGraph: {
      title: "全部作品",
      description:
        "浏览旮旯喵评资料库收录的全部 Galgame 与视觉小说，可按作品名、题材或平台查找，也能按热度和更新时间排序。",
      url: buildCanonicalPath("archive"),
      type: "website",
      images: [OG_IMAGE],
    },
    robots: isFiltered ? { index: false, follow: true } : undefined,
  };
}

function buildArchiveHref(
  current: { q: string; tag: string; sort: CatalogSort },
  overrides: Partial<{ q: string; tag: string; sort: CatalogSort; page: number }>,
) {
  const params = new URLSearchParams();
  const next = { ...current, ...overrides };
  if (next.q) params.set("q", next.q);
  if (next.tag) params.set("tag", next.tag);
  if (next.sort !== "latest") params.set("sort", next.sort);
  if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));
  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<ArchiveSearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const sort: CatalogSort = ["latest", "popular", "title"].includes(params.sort ?? "")
    ? (params.sort as CatalogSort)
    : "latest";
  const pageSize = 48;

  const [{ games, total }, topTags, reviews] = await Promise.all([
    findGames({ query: q, tag, sort, page, pageSize }),
    getTopTags(14),
    getAllReviews(),
  ]);
  const reviewByGuide = new Map(
    reviews
      .filter((review) => review.guideSlug)
      .map((review) => [review.guideSlug as string, review]),
  );
  const reviewByTitle = new Map(reviews.map((review) => [review.title, review]));

  const totalPages = Math.ceil(total / pageSize);

  const pageNumbers = (() => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);
    if (page <= 3) {
      start = 2;
      end = Math.min(totalPages - 1, maxVisible);
    }
    if (page >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisible + 1);
      end = totalPages - 1;
    }
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  })();

  return (
    <main className="miao-page">
      <div className="miao-container">
        <header className="miao-page-head">
          <span className="miao-kicker">
            <span className="miao-kicker-dot" aria-hidden="true" />
            GALGAME GUIDE · 资料库
          </span>
          <h1>全部作品</h1>
          <p>
            按作品名、题材或平台查找，也能按热度或更新时间排序。当前共 {total} 部，
            其中带「喵评」印章的作品，点进去就能看猫猫的评分和结论。
          </p>
        </header>

        <section className="miao-filter-panel miao-paper">
          <form method="get" action="/archive" className="miao-filter-form">
            <label className="miao-field">
              <span className="miao-field-label">搜作品</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="作品名、题材或平台"
                className="miao-input"
              />
            </label>
            <label className="miao-field">
              <span className="miao-field-label">排序</span>
              <select name="sort" defaultValue={sort} className="miao-select">
                <option value="latest">最近更新</option>
                <option value="popular">热度优先</option>
                <option value="title">标题顺序</option>
              </select>
            </label>
            {tag ? <input type="hidden" name="tag" value={tag} /> : null}
            <button className="miao-btn miao-btn--primary">筛选</button>
          </form>

          <div className="miao-tag-row miao-filter-tags">
            <Link
              href={buildArchiveHref({ q, tag, sort }, { tag: "", page: 1 })}
              className={`miao-tag${!tag ? " is-active" : ""}`}
            >
              全部标签
            </Link>
            {topTags.map((item) => (
              <Link
                key={item.name}
                href={buildArchiveHref({ q, tag, sort }, { tag: item.name, page: 1 })}
                className={`miao-tag${tag === item.name ? " is-active" : ""}`}
              >
                {item.name} · {item.count}
              </Link>
            ))}
          </div>
        </section>

        <div className="miao-game-grid">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} review={reviewByGuide.get(game.slug) ?? reviewByTitle.get(game.title)} />
          ))}
        </div>

        {games.length === 0 && (
          <div className="miao-empty">
            <p>没有匹配条目。请减少关键词，或清除标签后重试。</p>
            <Link href="/archive" className="miao-section-link">清除筛选</Link>
          </div>
        )}

        {totalPages > 1 && (
          <nav className="miao-pagination" aria-label="分页">
            {page > 1 && (
              <Link
                href={buildArchiveHref({ q, tag, sort }, { page: page - 1 })}
                className="miao-page-link"
              >
                ← 上一页
              </Link>
            )}
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="miao-page-ellipsis">...</span>
              ) : (
                <Link
                  key={p}
                  href={buildArchiveHref({ q, tag, sort }, { page: Number(p) })}
                  className={`miao-page-link${p === page ? " is-active" : ""}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Link>
              )
            )}
            {page < totalPages && (
              <Link
                href={buildArchiveHref({ q, tag, sort }, { page: page + 1 })}
                className="miao-page-link"
              >
                下一页 →
              </Link>
            )}
          </nav>
        )}

        <footer className="miao-archive-footer">
          <Link href="/" className="miao-btn miao-btn--secondary">
            返回首页
          </Link>
        </footer>
      </div>
    </main>
  );
}
