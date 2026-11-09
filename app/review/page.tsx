import type { Metadata } from "next";
import Link from "next/link";

import { CatMascot } from "@/components/review/cat-mascot";
import { ReviewCard } from "@/components/review/review-card";
import { reviewBrand, siteConfig } from "@/lib/config";
import { getAllReviews } from "@/lib/review/reviews";
import { REVIEW_TIERS } from "@/lib/review/tier";
import { REVIEW_OG_IMAGE } from "@/lib/seo";

export const revalidate = 3600;

const pageTitle = "旮旯喵评｜Galgame 推荐与评测";
const pageDescription =
  "旮旯喵评是猫猫编辑部的 Galgame 推荐与评测栏目：不写攻略，只给结论。按剧情、角色、音乐、美术、系统五个维度打分，告诉你一部作品值不值得玩、适合谁玩。";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  keywords: [
    "旮旯喵评",
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
    images: [REVIEW_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [REVIEW_OG_IMAGE],
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
        name: `${review.title} 喵评`,
      })),
    },
  };

  return (
    <main className="review-page review-index-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="review-container">
        <header className="review-hero">
          <div className="review-hero-copy">
            <div className="review-kicker">
              <span className="review-kicker-dot" aria-hidden="true" />
              {reviewBrand.english} · 猫猫编辑部
            </div>
            <h1 className="review-masthead">{reviewBrand.name}</h1>
            <p className="review-tagline">
              猫猫先替你玩一遍，
              <span>再告诉你值不值得。</span>
            </p>
            <p className="review-lede">
              不写攻略，只给结论。每部作品按剧情、角色、音乐、美术、系统五个维度打分，
              结论、亮点、不足和适合谁，一次讲清楚。
            </p>
            <div className="review-chips">
              <span className="review-chip">已品鉴 {reviews.length} 部</span>
              <span className="review-chip">五个评分维度</span>
              <span className="review-chip">不剧透 · 不写攻略</span>
            </div>
          </div>

          <div className="review-hero-art">
            <span className="review-sticker review-sticker--sun">猫猫认证</span>
            <span className="review-sticker review-sticker--mint">认真打分</span>
            <CatMascot className="review-mascot" />
            <span className="review-tape-note">今天也在认真打分</span>
          </div>
        </header>

        {topReview ? (
          <section className="review-top-pick" aria-labelledby="review-top-pick-title">
            <div className="review-top-pick-head">
              <span className="review-kicker">本期猫选</span>
              <span className="review-top-pick-rank">TOP 1</span>
            </div>
            <Link href={`/review/${topReview.slug}`} className="review-top-pick-link">
              <div className="review-top-pick-copy">
                <h2 id="review-top-pick-title">{topReview.title}</h2>
                <p className="review-top-pick-review-title">{topReview.reviewTitle}</p>
                <p className="review-top-pick-verdict">{topReview.verdict}</p>
                <span className="review-card-link">打开完整喵评 <span aria-hidden="true">→</span></span>
              </div>
              <div className="review-score-stamp review-score-stamp--hero">
                <strong>{topReview.overall.toFixed(1)}</strong>
                <small>本期最高分</small>
              </div>
            </Link>
          </section>
        ) : (
          <section className="review-empty review-paper">
            <p>猫猫还在整理第一批评测，先去作品库逛逛吧。</p>
            <Link href="/archive" className="review-inline-link">查看全部作品 →</Link>
          </section>
        )}

        <section className="review-tiers" aria-labelledby="review-tiers-title">
          <div className="review-section-head">
            <div>
              <span className="review-kicker">猫猫分级</span>
              <h2 id="review-tiers-title">从夯到拉</h2>
            </div>
            <p>分数是猫猫编辑部的结论，不是销量排行，也不是唯一标准。</p>
          </div>
          <div className="review-tier-row">
            {REVIEW_TIERS.map((tier) => (
              <div className="review-tier-card" key={tier.label}>
                <span className="review-tier-label">{tier.label}</span>
                <p>{tier.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="review-list" aria-labelledby="review-list-title">
          <div className="review-section-head">
            <div>
              <span className="review-kicker">全部收藏</span>
              <h2 id="review-list-title">猫猫的喵评本</h2>
            </div>
            <p>先看结论，再看它适不适合你。分数从高到低排。</p>
          </div>

          {sortedReviews.length > 0 ? (
            <div className="review-grid">
              {sortedReviews.map((review) => (
                <ReviewCard key={review.slug} review={review} />
              ))}
            </div>
          ) : (
            <div className="review-empty review-paper">
              <p>还没有已发布的喵评。</p>
              <Link href="/archive" className="review-inline-link">先看作品库 →</Link>
            </div>
          )}
        </section>

        <div className="review-cta">
          <div>
            <p className="review-cta-title">想先查作品资料？</p>
            <p className="review-cta-copy">
              喵评只写结论；作品简介、类型标签、平台和下载入口都在资料库。
            </p>
          </div>
          <Link href="/archive" className="review-cta-button">
            去资料库看看 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
