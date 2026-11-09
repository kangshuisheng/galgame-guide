import type { Metadata } from "next";
import Link from "next/link";

import { BookmarkHint } from "@/components/bookmark-hint";
import { GameCard } from "@/components/game-card";
import { CatMascot } from "@/components/review/cat-mascot";
import { siteConfig } from "@/lib/config";
import { getAllGames, getFeaturedGames, getTopTags } from "@/lib/games";
import { getAllReviews } from "@/lib/review/reviews";
import {
  buildCanonicalPath,
  buildHomeDescription,
  buildHomeKeywords,
  buildHomeTitle,
  OG_IMAGE,
} from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: buildHomeTitle(),
  description: buildHomeDescription(),
  keywords: buildHomeKeywords(),
  alternates: {
    canonical: buildCanonicalPath(""),
  },
  openGraph: {
    title: buildHomeTitle(),
    description: buildHomeDescription(),
    type: "website",
    url: "/",
    images: [OG_IMAGE],
  },
};

export default async function HomePage() {
  const [featuredGames, allGames, topTags, reviews] = await Promise.all([
    getFeaturedGames(6),
    getAllGames(),
    getTopTags(10),
    getAllReviews(),
  ]);
  const reviewCount = reviews.length;
  const topReview = [...reviews].sort((left, right) => right.overall - left.overall)[0];
  const reviewByGuide = new Map(
    reviews
      .filter((review) => review.guideSlug)
      .map((review) => [review.guideSlug as string, review]),
  );
  const reviewByTitle = new Map(reviews.map((review) => [review.title, review]));

  // Sort by updatedAt for recent list
  const recentGames = [...allGames]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: buildHomeTitle(),
    description: buildHomeDescription(),
    url: siteConfig.siteUrl,
    about: [
      "Galgame Guide",
      "Galgame 游戏库",
      "视觉小说目录",
      "作品标签",
      "视觉小说",
    ],
    mainEntity: {
      "@type": "ItemList",
      itemListElement: featuredGames.map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteConfig.siteUrl}/${game.slug}`,
        name: game.title,
      })),
    },
  };

  return (
    <main className="miao-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="miao-container">
        <header className="miao-home-hero">
          <div className="miao-home-copy">
            <span className="miao-kicker">
              <span className="miao-kicker-dot" aria-hidden="true" />
              GALGAME GUIDE · 猫猫资料库
            </span>
            <h1 className="miao-home-masthead">旮旯喵评</h1>
            <p className="miao-home-tagline">
              猫猫先替你查清楚，
              <span>再告诉你值不值得玩。</span>
            </p>
            <p className="miao-home-lede">
              收录 {allGames.length} 部 Galgame 与视觉小说。资料库里查简介、类型、平台和版本，
              喵评里看猫猫的结论、亮点、不足和适合谁——一个站，一条线走完。
            </p>

            <form action="/archive" method="get" className="miao-search">
              <label className="sr-only" htmlFor="home-grid-search">搜索作品</label>
              <input
                id="home-grid-search"
                name="q"
                placeholder="搜作品名、题材或平台"
                className="miao-search-input"
              />
              <button className="miao-search-button">搜作品</button>
            </form>

            <div className="miao-tag-row" aria-label="热门标签">
              {topTags.map((item) => (
                <Link
                  key={item.name}
                  href={`/archive?tag=${encodeURIComponent(item.name)}`}
                  className="miao-tag"
                >
                  {item.name} · {item.count}
                </Link>
              ))}
            </div>
          </div>

          <div className="miao-home-art">
            <span className="miao-sticker miao-sticker--sun">猫猫认证</span>
            <span className="miao-sticker miao-sticker--mint">认真查资料</span>
            <CatMascot className="miao-home-mascot" />
            <span className="miao-tape-note">今天也在整理档案</span>
          </div>
        </header>

        <section className="miao-stat-row" aria-label="站点数据">
          <div className="miao-stat">
            <strong>{allGames.length}</strong>
            <span>部作品资料</span>
          </div>
          <div className="miao-stat">
            <strong>{reviewCount}</strong>
            <span>篇猫猫喵评</span>
          </div>
          <div className="miao-stat">
            <strong>每天</strong>
            <span>持续收录更新</span>
          </div>
        </section>

        <section className="miao-module-grid" aria-label="站点模块">
          <Link href="/archive" className="miao-module-card miao-module-card--mint">
            <span className="miao-module-kicker">GALGAME GUIDE · 资料库</span>
            <h2 className="miao-module-title">先把作品查明白</h2>
            <p className="miao-module-copy">
              简介、类型、平台、语言、版本和更新时间，一部作品一页档案。
              找到想玩的，再跳去下载页。
            </p>
            <div className="miao-module-foot">
              <span className="miao-module-count">{allGames.length} 部作品</span>
              <span className="miao-module-link">进入资料库 →</span>
            </div>
          </Link>

          <Link href="/review" className="miao-module-card miao-module-card--coral">
            <span className="miao-module-kicker">GALGAME MEOW REVIEW · 喵评</span>
            <h2 className="miao-module-title">再看猫猫怎么评</h2>
            <p className="miao-module-copy">
              剧情、角色、音乐、美术、系统五维打分。先看结论，再看它适不适合你。
              {topReview ? ` 本期最高分是《${topReview.title}》${topReview.overall.toFixed(1)} 分。` : ""}
            </p>
            <div className="miao-module-foot">
              <span className="miao-module-count">{reviewCount} 篇喵评</span>
              <span className="miao-module-link">翻喵评本 →</span>
            </div>
          </Link>
        </section>

        <section id="hot-list" className="miao-section">
          <div className="miao-section-head">
            <div>
              <span className="miao-kicker">热门 · 资料库</span>
              <h2 className="miao-section-title">大家都在看</h2>
            </div>
            <Link href="/archive" className="miao-section-link">
              看全部作品 →
            </Link>
          </div>

          <div className="miao-game-grid">
            {featuredGames.map((game) => (
              <GameCard key={game.slug} game={game} review={reviewByGuide.get(game.slug) ?? reviewByTitle.get(game.title)} />
            ))}
          </div>
        </section>

        <section className="miao-section">
          <div className="miao-section-head">
            <div>
              <span className="miao-kicker">新收录 · 资料库</span>
              <h2 className="miao-section-title">最近收录</h2>
            </div>
            <p className="miao-section-desc">
              每天同步新作品，刚进来的会排在这里。
            </p>
          </div>

          <div className="miao-game-grid miao-game-grid--4">
            {recentGames.map((game) => (
              <GameCard key={game.slug} game={game} review={reviewByGuide.get(game.slug) ?? reviewByTitle.get(game.title)} />
            ))}
          </div>
        </section>

        <section className="miao-howto miao-paper">
          <div className="miao-howto-copy">
            <span className="miao-kicker">怎么用</span>
            <h2 className="miao-section-title">三步找到想玩的</h2>
            <p className="miao-section-desc">
              这里只放作品资料和下载入口，不放游戏文件。查资料、看类型、去下载，一条线走完。
            </p>
          </div>
          <div className="miao-howto-grid">
            {[
              {
                title: "搜作品名",
                body: "中文名、日文名、英文名都能搜。名字记不全也没关系，打几个字就能翻到。",
              },
              {
                title: "看简介和标签",
                body: "什么类型、哪个平台、什么版本、多久更新过，都写在页面上。有喵评的还能直接看评分。",
              },
              {
                title: "去下载页",
                body: "点页面中间珊瑚色的 Download 按钮，跳到下载页面。本站不存游戏文件。",
              },
            ].map((item, index) => (
              <article key={item.title} className="miao-howto-step">
                <span className="miao-howto-num">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <BookmarkHint />
      </div>
    </main>
  );
}
