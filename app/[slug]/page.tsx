import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BookmarkHint } from "@/components/bookmark-hint";
import { MainSiteCta, MobileStickyCta } from "@/components/main-site-cta";
import { RelatedGames } from "@/components/related-games";
import { CatMascot } from "@/components/review/cat-mascot";
import { buildGoPath } from "@/lib/config";
import { getAllGames, getAllSlugs, getGameBySlug } from "@/lib/games";
import { getRelatedGames } from "@/lib/related-games";
import { getReviewForGame } from "@/lib/review/reviews";
import {
  buildCanonicalPath,
  buildGameDescription,
  buildGameKeywords,
  buildGameStructuredData,
  buildGameTitle,
  OG_IMAGE,
} from "@/lib/seo";

export const revalidate = 86400;

/**
 * 预渲染最近 500 个作品页。
 *
 * 没有 generateStaticParams 时 `[slug]` 是纯动态路由：`revalidate` 完全不生效，
 * 每个请求都重新 SSR，响应头是 `private, no-store`，Vercel CDN 一律不缓存。
 * 给出参数后路由变成 ISR —— 预渲染的走 CDN，其余参数首次访问后同样被缓存。
 *
 * 只预渲染 500 个而不是全部 3,876 个：构建时长和产物体积都可控，长尾页面
 * 第一次被访问时生成并缓存，对爬虫和用户的效果一样。
 */
const PRERENDER_LIMIT = 500;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.slice(0, PRERENDER_LIMIT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  // 必须在这里 notFound：页面进入流式渲染后再调用，响应头已经发出 200，
  // 只能渲染 404 内容（软 404）。metadata 阶段抛 404 才能给出真正的状态码。
  if (!game) notFound();

  const title = buildGameTitle(game);
  const description = buildGameDescription(game);
  const canonical = buildCanonicalPath(game.slug);

  return {
    // absolute 绕开 layout 的 `%s | 旮旯喵评` 模板：作品名长度不可控，
    // 交给 buildGameTitle 自己决定要不要带品牌后缀，才能保证不超过 70 字符。
    title: { absolute: title },
    description,
    keywords: buildGameKeywords(game),
    alternates: { canonical },
    // 2026-10-31 放开收录：这个站点是 Bing 侧唯一的自然搜索入口，
    // 作品页必须可索引才有承接价值。干净化在 lib/content-clean.ts 里做，
    // 页面不再输出任何图片，避免被判定为成人内容站。
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未提供" : date.toLocaleDateString("zh-CN");
}

/**
 * 页内小节标题。爬虫靠 h2 理解「这一页由哪几块内容组成」，
 * 之前整页只有 h1 和「相似条目」一个 h2，中间的信息块对爬虫是不可分的。
 */
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="miao-detail-section-title">
      <span className="miao-detail-section-mark" aria-hidden="true">✦</span>
      <h2>{children}</h2>
    </div>
  );
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [game, allGames] = await Promise.all([
    getGameBySlug(slug),
    getAllGames(),
  ]);

  if (!game) notFound();

  const review = await getReviewForGame(game.slug, game.title);
  const relatedGames = getRelatedGames(game, allGames);
  const jsonLd = buildGameStructuredData(game);

  return (
    <main className="miao-page miao-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="miao-container miao-detail-container">
        <nav className="miao-breadcrumb" aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link href="/archive">资料库</Link>
          <span aria-hidden="true">/</span>
          <span>{game.title}</span>
        </nav>

        <div className="miao-detail-grid">
          <article className="miao-paper miao-article">
            <header>
              <div className="miao-detail-kicker-row">
                <span className="miao-kicker">
                  <span className="miao-kicker-dot" aria-hidden="true" />
                  作品资料
                </span>
                <span className="miao-chip">资料整理自开发商与发行方公开信息</span>
              </div>

              <h1 className="miao-detail-title">{game.title}</h1>
            </header>

            <section className="miao-detail-section">
              <SectionHeading>作品简介</SectionHeading>

              {game.aiIntro || game.summary ? (
                <p className="miao-detail-text">
                  {game.aiIntro ?? game.summary}
                </p>
              ) : null}

              {game.aiPoints.length > 0 && (
                <ul className="miao-detail-points">
                  {game.aiPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </section>

            <MainSiteCta sourceId={game.sourceId} title={game.title} />

            {game.tags.length > 0 && (
              <section className="miao-detail-section">
                <SectionHeading>类型标签</SectionHeading>

                <div className="miao-tag-row miao-detail-tags">
                  {game.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/archive?tag=${encodeURIComponent(tag)}`}
                      className="miao-tag"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="miao-detail-section">
              <SectionHeading>关于这份资料</SectionHeading>
              <p className="miao-detail-note">
                作品名称、简介与版本信息整理自开发商、发行方和商店页面的公开资料。
                发现错漏，欢迎到{" "}
                <a
                  href={buildGoPath("site")}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  KrzACG 社区
                </a>{" "}
                告诉我们。
              </p>
            </section>
          </article>

          <aside className="miao-detail-side" aria-label="喵评与作品信息">
            {review ? (
              <Link href={`/review/${review.slug}`} className="miao-paper miao-review-teaser">
                <span className="miao-review-teaser-kicker">旮旯喵评 · 猫猫评过</span>
                <h2 className="miao-review-teaser-title">{review.reviewTitle}</h2>
                <p className="miao-review-teaser-verdict">{review.verdict}</p>
                <div className="miao-review-teaser-row">
                  <span className="miao-review-stamp">
                    <strong>{review.overall.toFixed(1)}</strong>
                    <small>喵评</small>
                  </span>
                  <span className="miao-review-teaser-link">打开完整喵评 →</span>
                </div>
              </Link>
            ) : (
              <div className="miao-paper miao-review-invite">
                <h2>这部还没写喵评</h2>
                <p>猫猫还在排队玩。先去喵评本看看已经评过的作品吧。</p>
                <Link href="/review">去喵评本翻翻 →</Link>
              </div>
            )}

            <section className="miao-paper miao-facts">
              <h2>收录信息</h2>
              <dl>
                <div>
                  <dt>热度</dt>
                  <dd>{game.views.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>首次收录</dt>
                  <dd>{formatDate(game.createdAt)}</dd>
                </div>
                <div>
                  <dt>资料更新</dt>
                  <dd>{formatDate(game.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <div className="miao-side-note">
              <CatMascot className="miao-side-mascot" />
              <p>资料看清楚了，再决定要不要点下载。</p>
            </div>
          </aside>
        </div>

        <RelatedGames games={relatedGames} />

        <BookmarkHint />
      </div>

      <MobileStickyCta sourceId={game.sourceId} />
    </main>
  );
}
