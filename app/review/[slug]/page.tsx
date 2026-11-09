import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { ScoreBars } from "@/components/review/score-bars";
import { siteConfig } from "@/lib/config";
import { getReviewBySlug, getReviewSlugs } from "@/lib/review/reviews";
import { getReviewTier } from "@/lib/review/tier";
import type { ReviewRecord } from "@/lib/review/types";
import { OG_IMAGE } from "@/lib/seo";

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
  const text = `${review.title} 品鉴：${review.verdict}`;
  return [...text].length > 100 ? `${[...text].slice(0, 99).join("")}…` : text;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const title = `${review.title} 品鉴｜${review.reviewTitle}`;
  const description = buildReviewDescription(review);
  const canonical = `${siteConfig.siteUrl}/review/${review.slug}`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      review.title,
      `${review.title} 品鉴`,
      `${review.title} 评测`,
      `${review.title} 评分`,
      ...review.genres,
      "Galgame 品鉴",
      "Galgame 评测",
    ],
    alternates: { canonical },
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
    robots: { index: true, follow: true },
  };
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-2 w-2 rounded-full bg-accent" />
      <h2 className="font-display text-xl tracking-[0.08em] text-ink-strong">
        {children}
      </h2>
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

  const tier = getReviewTier(review.overall);
  const reviewUrl = `${siteConfig.siteUrl}/review/${review.slug}`;
  const gameId = `${reviewUrl}#videogame`;
  const reviewId = `${reviewUrl}#review`;
  const breadcrumbId = `${reviewUrl}#breadcrumb`;
  const faqId = `${reviewUrl}#faq`;
  const gameHref = review.guideSlug
    ? `/${review.guideSlug}`
    : `/archive?q=${encodeURIComponent(review.title)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Review",
        "@id": reviewId,
        name: review.reviewTitle,
        reviewBody: review.verdict,
        author: { "@type": "Organization", name: review.author },
        publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.siteUrl },
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
          { "@type": "ListItem", position: 2, name: "Galgame 品鉴", item: `${siteConfig.siteUrl}/review` },
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
    <main className="shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 pt-8 pb-24 sm:px-8 sm:pb-10 lg:px-12">
        <nav className="flex flex-wrap items-center gap-3 text-sm text-white/55">
          <Link href="/" className="transition hover:text-ink-strong">首页</Link>
          <span>/</span>
          <Link href="/review" className="transition hover:text-ink-strong">Galgame 品鉴</Link>
          <span>/</span>
          <span className="line-clamp-1 text-ink-strong">{review.title}</span>
        </nav>

        <article className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">Galgame 品鉴</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.14em] ${tier.badgeClass}`}>
              {tier.label}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
              {review.author} · {formatDate(review.updatedAt)}
            </span>
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem]">
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-tight text-ink-strong sm:text-5xl">
                {review.title}
              </h1>
              {review.originalTitle && review.originalTitle !== review.title ? (
                <p className="mt-2 text-sm tracking-[0.08em] text-white/35">
                  {review.originalTitle}
                </p>
              ) : null}
              <p className="mt-5 font-display text-2xl leading-snug text-accent">
                {review.reviewTitle}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-accent/30 bg-accent/[0.08] p-5 text-center">
              <p className="text-[11px] font-semibold tracking-[0.22em] text-accent/80 uppercase">
                品鉴评分
              </p>
              <p className="mt-3 font-display text-6xl leading-none text-accent">
                {review.overall.toFixed(1)}
              </p>
              <p className="mt-3 text-xs leading-6 text-white/50">{tier.description}</p>
            </div>
          </div>

          <dl className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-white/35">开发商</dt>
              <dd className="mt-1 text-ink-soft">{review.developer}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-white/35">发行时间</dt>
              <dd className="mt-1 text-ink-soft">{formatDate(review.releaseDate)}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-white/35">平台</dt>
              <dd className="mt-1 text-ink-soft">{review.platforms.join(" / ") || "未提供"}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.18em] text-white/35">类型</dt>
              <dd className="mt-1 text-ink-soft">{review.genres.join(" / ") || "未提供"}</dd>
            </div>
          </dl>

          <blockquote className="mt-8 rounded-[1.5rem] border border-accent/25 bg-accent/[0.06] p-5 text-base leading-8 text-ink-strong sm:p-6">
            {review.verdict}
          </blockquote>

          <section className="mt-10">
            <SectionHeading>评分卡</SectionHeading>
            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-5 sm:p-6">
              <ScoreBars scores={review.scores} />
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading>作品简介</SectionHeading>
            <p className="mt-4 text-base leading-8 text-ink-soft sm:text-lg">
              {review.summary}
            </p>
          </section>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-300/[0.04] p-5 sm:p-6">
              <SectionHeading>亮点</SectionHeading>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
                {review.highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.5rem] border border-rose-300/15 bg-rose-300/[0.035] p-5 sm:p-6">
              <SectionHeading>不足</SectionHeading>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
                {review.issues.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-rose-300/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-10">
            <SectionHeading>适合谁</SectionHeading>
            <p className="mt-4 text-base leading-8 text-ink-soft">{review.audience}</p>
          </section>

          <section className="mt-10">
            <SectionHeading>详细品鉴</SectionHeading>
            <div className="mt-4 space-y-5 text-base leading-8 text-ink-soft sm:text-lg">
              {review.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading>相似作品</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {review.similar.map((similar) => (
                <Link
                  key={similar.title}
                  href={buildSimilarHref(similar)}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink-soft transition hover:border-accent/50 hover:text-accent"
                >
                  {similar.title} →
                </Link>
              ))}
            </div>
          </section>

          {review.faq.length > 0 ? (
            <section className="mt-10">
              <SectionHeading>常见问题</SectionHeading>
              <div className="mt-4 divide-y divide-white/8 rounded-[1.5rem] border border-white/10 bg-black/20">
                {review.faq.map((item) => (
                  <details key={item.question} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none text-sm font-medium text-ink-strong marker:hidden">
                      {item.question}
                      <span className="float-right text-white/35 transition group-open:rotate-45">＋</span>
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-ink-soft">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10 flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-medium text-ink-strong">想看这部作品的站内资料？</p>
              <p className="mt-1 text-xs leading-6 text-white/45">
                这里只写品鉴，不提供下载文件。作品资料与标签在作品库里。
              </p>
            </div>
            <Link
              href={gameHref}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:bg-accent-strong"
            >
              查看作品资料 →
            </Link>
          </div>

          <p className="mt-6 text-xs leading-6 text-white/35">
            评分参考：VNDB 公开评分与投票数（{review.vndbRating?.toFixed(1) ?? "未提供"} /{" "}
            {review.vndbVotes?.toLocaleString("zh-CN") ?? "未提供"} 人），本站品鉴评分独立。
            资料核对与品鉴内容更新于 {formatDate(review.updatedAt)}。
          </p>
        </article>

        <div className="text-center">
          <Link href="/review" className="text-sm text-accent hover:underline">
            ← 返回 Galgame 品鉴
          </Link>
        </div>
      </div>
    </main>
  );
}
