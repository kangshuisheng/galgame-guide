import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    // 不按 UA 屏蔽任何 AI 爬虫（2026-11-04 站长决定，不再改回去）。
    // 曾经封过 GPTBot / PerplexityBot 等 14 个 UA，理由是早期每个请求都要扫全表、
    // AI 爬虫并发一上来就把函数打满。2026-11-01 加上全表缓存后单请求降到几十毫秒，
    // 这个理由已经不成立；而 OAI-SearchBot / PerplexityBot 会带来真实点击 ——
    // 封它们等于放弃 AI 搜索这条获客渠道，比省下的那点算力值钱得多。
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /go 是出站跳转，爬虫跟过去就会看到主站域名 —— 这正是要避免的关联
        // /archive? 是筛选/排序/搜索参数页，页面本身已经 noindex；
        // 放出来只会让 Bing 把抓取预算花在永远不收录的 URL 上。
        disallow: ["/api/", "/go", "/archive?"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
