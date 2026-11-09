import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CatMascot } from "@/components/review/cat-mascot";
import { ScoreBars } from "@/components/review/score-bars";
import { reviewBrand, siteConfig } from "@/lib/config";
import { getAllGames } from "@/lib/games";
import { getReviewBySlug, getReviewSlugs } from "@/lib/review/reviews";
import { getReviewTier } from "@/lib/review/tier";
import type { ReviewRecord } from "@/lib/review/types";
import { REVIEW_OG_IMAGE } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getReviewSlugs();
  return slugs.map((slug) => ({ slug }));
}

function formatDate(value: string | null) {
  if (!value) return "未提供";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未提供" : date.toLocaleDateString("zh-CN");
}

function buildReviewDescription(review: ReviewRecord) {
  const text = `${review.title} 喵评：${review.verdict}`;
  return [...text].length > 100 ? `${[...text].slice(0, 99).join("")}…` : text;
}

function displayAuthor(author: string) {
  return author === "Galgame 品鉴编辑部" || author === "旮旯喵评编辑部"
    ? reviewBrand.editorialTeam
    : author;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const title = `${review.title} 喵评｜${review.reviewTitle}`;
  const description = buildReviewDescription(review);
  const canonical = `${siteConfig.siteUrl}/review/${review.slug}`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      review.title,
      `${review.title} 喵评`,
      `${review.title} 评测`,
      `${review.title} 评分`,
      ...review.genres,
      reviewBrand.name,
      "Galgame 评测",
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [REVIEW_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [REVIEW_OG_IMAGE],
    },
    robots: { index: true, follow: true },
  };
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="review-section-title">
      <span className="review-section-mark" aria-hidden="true">✦</span>
      <h2>{children}</h2>
    </div>
  );
}

function buildSimilarHref(similar: ReviewRecord["similar"][number]) {
  if (similar.slug) return `/review/${similar.slug}`;
  return `/archive?q=${encodeURIComponent(similar.title)}`;
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const allGames = await getAllGames();
  const matchedGame = review.guideSlug
    ? allGames.find((game) => game.slug === review.guideSlug)
    : allGames.find((game) => game.title === review.title);
  const tier = getReviewTier(review.overall);
  const reviewUrl = `${siteConfig.siteUrl}/review/${review.slug}`;
  const gameId = `${reviewUrl}#videogame`;
  const reviewId = `${reviewUrl}#review`;
  const breadcrumbId = `${reviewUrl}#breadcrumb`;
  const faqId = `${reviewUrl}#faq`;
  const gameHref = matchedGame
    ? `/${matchedGame.slug}`
    : review.guideSlug
      ? `/${review.guideSlug}`
      : `/archive?q=${encodeURIComponent(review.title)}`;
  const author = displayAuthor(review.author);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Review",
        "@id": reviewId,
        name: review.reviewTitle,
        reviewBody: review.verdict,
        author: { "@type": "Organization", name: author },
        publisher: { "@type": "Organization", name: reviewBrand.name, url: `${siteConfig.siteUrl}/review` },
        datePublished: review.publishedAt,
        dateModified: review.updatedAt,
        inLanguage: "zh-CN",
        itemReviewed: { "@id": gameId },
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.overall,
          bestRating: 10,
          worstRating: 1,
        },
      },
      {
        "@type": "VideoGame",
        "@id": gameId,
        name: review.title,
        ...(review.originalTitle ? { alternateName: review.originalTitle } : {}),
        description: review.summary,
        ...(review.releaseDate ? { datePublished: review.releaseDate } : {}),
        gamePlatform: review.platforms,
        applicationCategory: "Game",
        genre: review.genres,
        author: { "@type": "Organization", name: review.developer },
        inLanguage: "zh-CN",
        mainEntityOfPage: { "@id": reviewId },
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteConfig.siteUrl },
          { "@type": "ListItem", position: 2, name: "喵评", item: `${siteConfig.siteUrl}/review` },
          { "@type": "ListItem", position: 3, name: review.title },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        mainEntity: review.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <main className="review-page review-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="review-container">
        <nav className="review-breadcrumb" aria-label="面包屑">
          <Link href="/">首页</Link>
          <span aria-hidden="true">/</span>
          <Link href="/review">喵评</Link>
          <span aria-hidden="true">/</span>
          <span>{review.title}</span>
        </nav>

        <div className="review-detail-grid">
          <article className="review-paper review-article">
            <header className="review-detail-head">
              <div className="review-detail-kicker-row">
                <span className="review-kicker">喵评</span>
                <span className="review-tier-chip">{tier.label}</span>
                <span className="review-inline-score"><strong>{review.overall.toFixed(1)}</strong> / 10</span>
                <span className="review-byline">{author} · 更新于 {formatDate(review.updatedAt)}</span>
              </div>
              <h1>{review.title}</h1>
              {review.originalTitle && review.originalTitle !== review.title ? (
                <p className="review-original-title">{review.originalTitle}</p>
              ) : null}
              <p className="review-review-title">{review.reviewTitle}</p>
              <div className="review-detail-tags">
                {review.genres.map((genre) => (
                  <span key={genre} className="review-tag">{genre}</span>
                ))}
                {review.platforms.map((platform) => (
                  <span key={platform} className="review-tag review-tag--platform">{platform}</span>
                ))}
              </div>
            </header>

            <blockquote className="review-verdict-card">
              <span className="review-quote-mark" aria-hidden="true">“</span>
              <p>{review.verdict}</p>
            </blockquote>

            <section className="review-section">
              <SectionHeading>猫猫评分卡</SectionHeading>
              <div className="review-score-bars-wrap">
                <ScoreBars scores={review.scores} />
              </div>
            </section>

            <section className="review-section">
              <SectionHeading>作品简介</SectionHeading>
              <p className="review-body-text">{review.summary}</p>
            </section>

            <div className="review-note-grid">
              <section className="review-note review-note--good">
                <SectionHeading>猫猫喜欢</SectionHeading>
                <ul>
                  {review.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="review-note review-note--bad">
                <SectionHeading>猫猫嫌弃</SectionHeading>
                <ul>
                  {review.issues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="review-section">
              <SectionHeading>适合谁</SectionHeading>
              <p className="review-body-text">{review.audience}</p>
            </section>

            <section className="review-section">
              <SectionHeading>详细喵评</SectionHeading>
              <div className="review-body-text review-body-copy">
                {review.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section className="review-section">
              <SectionHeading>相似作品</SectionHeading>
              <div className="review-similar-grid">
                {review.similar.map((similar) => (
                  <Link
                    key={similar.title}
                    href={buildSimilarHref(similar)}
                    className="review-similar-link"
                  >
                    {similar.title} <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </section>

            {review.faq.length > 0 ? (
              <section className="review-section">
                <SectionHeading>常见问题</SectionHeading>
                <div className="review-faq">
                  {review.faq.map((item) => (
                    <details key={item.question} className="review-faq-item">
                      <summary>
                        {item.question}
                        <span aria-hidden="true">＋</span>
                      </summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="review-cta">
              <div>
                <p className="review-cta-title">想看这部作品的站内资料？</p>
                <p className="review-cta-copy">这里只写喵评，不提供下载文件。作品资料与标签在作品库里。</p>
              </div>
              <Link href={gameHref} className="review-cta-button">
                查看作品资料 <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="review-footnote">
              评分参考：VNDB 公开评分与投票数（{review.vndbRating?.toFixed(1) ?? "未提供"} /{" "}
              {review.vndbVotes?.toLocaleString("zh-CN") ?? "未提供"} 人），本站喵评评分独立。
              资料核对与喵评内容更新于 {formatDate(review.updatedAt)}。
            </p>
          </article>

          <aside className="review-side" aria-label="评分与作品信息">
            <section className="review-paper review-score-card">
              <span className="review-kicker">猫猫评分</span>
              <div className="review-score-stamp review-score-stamp--large">
                <strong>{review.overall.toFixed(1)}</strong>
                <small>{tier.label}</small>
              </div>
              <p>{tier.description}</p>
              <span className="review-vndb">VNDB {review.vndbRating?.toFixed(1) ?? "—"}</span>
            </section>

            <section className="review-paper review-fact-card">
              <h2>作品小档案</h2>
              <dl>
                <div>
                  <dt>开发商</dt>
                  <dd>{review.developer}</dd>
                </div>
                <div>
                  <dt>发行时间</dt>
                  <dd>{formatDate(review.releaseDate)}</dd>
                </div>
                <div>
                  <dt>平台</dt>
                  <dd>{review.platforms.join(" / ") || "未提供"}</dd>
                </div>
                <div>
                  <dt>类型</dt>
                  <dd>{review.genres.join(" / ") || "未提供"}</dd>
                </div>
              </dl>
            </section>

            <section className="review-side-note">
              <CatMascot className="review-side-mascot" />
              <p>评分是猫猫的主观结论，先看它适不适合你。</p>
            </section>
          </aside>
        </div>

        <div className="review-back">
          <Link href="/review">← 回到喵评本</Link>
        </div>
      </div>
    </main>
  );
}
