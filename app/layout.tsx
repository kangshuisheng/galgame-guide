import type { Metadata } from "next";
import Script from "next/script";

import "@/app/globals.css";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { analytics, reviewBrand, siteConfig } from "@/lib/config";
import { OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "旮旯喵评",
    "Galgame Guide",
    "Galgame 索引",
    reviewBrand.name,
    "Galgame 品鉴",
    "Galgame 评测",
    "Galgame 评分",
    "视觉小说目录",
    "作品标签",
    "游戏版本情报",
    "视觉小说",
  ],
  icons: {
    icon: [{ url: "/review-cat.svg", type: "image/svg+xml" }],
  },
  // canonical 不在这里写：layout 的值会被所有没覆盖的子页继承，
  // 2026-11-05 审计实测 /about /contact /privacy /terms 四页因此全部指向首页，
  // 等于让搜索引擎把它们当成首页副本。canonical 一律由各页自己声明。
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
    locale: "zh_CN",
    url: "/",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [OG_IMAGE],
  },
  verification: {
    google: "1Xgn-if-N3BE_rT0R4tVMRVNQH8ouKq1y7suby_9vjM",
    // 两个 token 都要留：ca96… 对应 galgame-guide.vercel.app，f8ce… 对应 galgame.krzvv.com。
    // 只写一个会让另一个域名掉验证。
    yandex: ["ca96ec0d870b3e63", "f8ceb2f80d1d2d6d"],
    other: {
      "6a97888e-site-verification": "bd9f36257c1bd922ea53f45d0aaac602",
      // Bing Webmaster。为什么不用 DNS 验证：Cloudflare 把 galgame.krzvv.com 同时配了
      // CNAME（指向 Vercel）和 TXT，而 DNS 规范不允许 CNAME 与其它记录同名共存，
      // Yandex 的解析器会跟 CNAME 走、丢掉 TXT，实测报 DNS_RECORD_NOT_FOUND。
      "msvalidate.01": "78516164C70B811236A3C3A8822B0A61",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="site-body flex min-h-screen flex-col">
        <Navbar />
        {children}
        <SiteFooter />
        {/* 用 afterInteractive 而不是 lazyOnload：这个站的价值就是回答
            「Bing 来的流量到底有没有点下载」，脚本在 lazyOnload 下会等到
            所有资源加载完才跑，用户看完就走的话根本不上报 —— 2026-10-31
            实测 Bing 后台约 540 点击/天，Umami 只记到 44 访客，差了一个数量级。
            页面已经走 CDN + ISR，多一个 defer 脚本对 LCP 没有影响。 */}
        <Script
          strategy="afterInteractive"
          src={analytics.scriptSrc}
          data-website-id={analytics.websiteId}
        />
      </body>
    </html>
  );
}
