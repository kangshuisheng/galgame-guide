import type { Metadata } from "next";
import Link from "next/link";

import { OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "关于我们",
  description: "旮旯喵评收录什么、怎么用，以及本站不提供什么。",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "关于我们",
    description: "旮旯喵评收录什么、怎么用，以及本站不提供什么。",
    url: "/about",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function AboutPage() {
  return (
    <main className="miao-page">
      <div className="miao-container miao-narrow">
        <header className="miao-page-head">
          <span className="miao-kicker">
            <span className="miao-kicker-dot" aria-hidden="true" />
            关于
          </span>
          <h1>关于旮旯喵评</h1>
          <p>
            旮旯喵评（Galgame Guide）是一个 Galgame 与视觉小说站点，
            下面分「资料库」和「喵评」两个模块。
          </p>
        </header>

        <article className="miao-paper miao-legal">
          <p>
            资料库帮你查作品：想找哪部游戏，先在这儿看清楚它是什么、什么类型、
            什么版本、哪个平台，再去下载。喵评帮你看结论：猫猫替你玩过之后，
            按剧情、角色、音乐、美术、系统五个维度打分，告诉你值不值得玩、适合谁玩。
          </p>

          <h2>这里有什么</h2>
          <ul>
            <li><strong>作品资料</strong>：简介、类型标签、平台、语言、版本和更新时间。</li>
            <li><strong>查找</strong>：按作品名、题材或平台搜，也能按热度或更新时间排序。</li>
            <li><strong>下载入口</strong>：每部作品页都有珊瑚色的 Download 下载按钮，点进去就是下载页面。</li>
            <li><strong>喵评</strong>：五个评分维度、结论、亮点、不足和适合谁，一次讲清楚。</li>
          </ul>

          <h2>这里没有什么</h2>
          <ul>
            <li><strong>不存游戏文件</strong>：本站不托管、不上传、不提供任何游戏本体。</li>
            <li><strong>不编攻略</strong>：没有可靠来源的路线、存档、兼容信息，我们不写。</li>
          </ul>

          <h2>内容声明</h2>
          <p>
            作品名称、简介等资料来自公开数据源，版权归原始开发商或发行方所有。
            本站不存储、不分发任何游戏文件，页面上的外部链接指向第三方站点。
          </p>

          <p>
            想先逛资料库？<Link href="/archive" className="miao-section-link">去资料库看看 →</Link>
            {" "}想看猫猫的结论？<Link href="/review" className="miao-section-link">翻喵评本 →</Link>
          </p>
        </article>
      </div>
    </main>
  );
}
