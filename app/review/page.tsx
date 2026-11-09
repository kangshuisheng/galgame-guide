import type { Metadata } from "next";
import Link from "next/link";

import { ReviewCard } from "@/components/review/review-card";
import { siteConfig } from "@/lib/config";
import { getAllReviews } from "@/lib/review/reviews";
import { REVIEW_TIERS } from "@/lib/review/tier";
import { OG_IMAGE } from "@/lib/seo";

export const revalidate = 3600;

const pageTitle = "Galgame 品鉴｜从夯到拉的 Galgame 评测与评分";
const pageDescription =
  "不写攻略，只给结论。Galgame 品鉴按剧情、角色、音乐、美术、系统五个维度给作品打分，告诉你一部作品值不值得玩、适合谁玩。";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  keywords: [
    "Galgame 品鉴",
    "Galgame 评测",
    "Galgame 评分",
    "Galgame 推荐",
    "视觉小说评测",
    "Galgame 排行",
  ],
  alternates: { canonical: `${siteConfig.siteUrl}/review` },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${siteConfig.siteUrl}/review`,
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default async function ReviewIndexPage() {
  const reviews = await getAllReviews();
  const sortedReviews = [...reviews].sort((left, right) => right.overall - left.overall);
  const topReview = sortedReviews[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageTitle,
    description: pageDescription,
    url: `${siteConfig.siteUrl}/review`,
    inLanguage: "zh-CN",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: sortedReviews.map((review, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.siteUrl}/review/${review.slug}`,
        name: `${review.title} 品鉴`,
      })),
    },
  };

  return (
    <main className="shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-12 sm:px-8 lg:px-12">
        <header className="grid gap-8 rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-7 shadow-[0_40px_120px_rgba(0,0,0,0.38)] lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="space-y-6">
            <span className="eyebrow">Galgame 品鉴</span>
            <div className="space-y-4">
              <h1 className="max-w-4xl font-display text-5xl leading-none text-ink-strong sm:text-6xl">
                不写攻略，
                <span className="block text-accent">只告诉你值不值得玩。</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-ink-soft sm:text-lg">
                每部作品按剧情、角色、音乐、美术、系统五个维度打分。结论在前，
                亮点和不足都写清楚，再告诉你适合谁、不适合谁。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs tracking-[0.12em] text-white/45">
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                已品鉴 {reviews.length} 部
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                五个评分维度
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1.5">
                不收录攻略与剧透
              </span>
            </div>
          </div>

          {topReview ? (
            <Link
              href={`/review/${topReview.slug}`}
              className="group flex flex-col justify-between rounded-[2rem] border border-accent/30 bg-[linear-gradient(145deg,rgba(214,169,107,0.18),rgba(214,169,107,0.035))] p-6 transition hover:border-accent/65 sm:p-7"
            >
              <div>
                <span className="text-[11px] font-semibold tracking-[0.22em] text-accent/80 uppercase">
                  当前最高分
                </span>
                <h2 className="mt-4 font-display text-3xl leading-tight text-ink-strong group-hover:text-accent">
                  {topReview.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-soft">
                  {topReview.verdict}
                </p>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <span className="font-display text-6xl leading-none text-accent">
                  {topReview.overall.toFixed(1)}
                </span>
                <span className="pb-1 text-sm text-white/55">查看完整品鉴 →</span>
              </div>
            </Link>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-7 text-sm leading-7 text-ink-soft">
              品鉴内容正在整理中。先去看看作品库，或者稍后再来。
            </div>
          )}
        </header>

        <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-5 sm:grid-cols-5 sm:p-6">
          {REVIEW_TIERS.map((tier) => (
            <div key={tier.label} className="space-y-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] ${tier.badgeClass}`}
              >
                {tier.label}
              </span>
              <p className="text-xs leading-6 text-white/40">{tier.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span className="eyebrow">品鉴列表</span>
              <h2 className="font-display text-4xl text-ink-strong">从夯到拉</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/50">
              分数是编辑部的品鉴结论，不是销量排行，也不是唯一标准。先看结论，
              再看它适不适合你。
            </p>
          </div>

          {sortedReviews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedReviews.map((review) => (
                <ReviewCard key={review.slug} review={review} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-white/10 bg-black/20 py-20 text-center">
              <p className="text-ink-soft">还没有已发布的品鉴。</p>
              <Link href="/archive" className="mt-4 inline-flex text-sm text-accent hover:underline">
                先看作品库 →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
