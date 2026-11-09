"use client";

import { useState } from "react";

/**
 * 「收藏本站」提示。
 *
 * 为什么要有它：这个站的流量几乎全部来自 Bing 搜索结果，一旦搜索引擎调算法
 * 或平台找麻烦，用户下次再搜就搜不到了。所以得趁用户还在页面上的时候把地址
 * 塞给他。
 *
 * 浏览器不允许网页直接加书签，能做的只有三件事：把域名写清楚、给出收藏
 * 快捷键、一键复制地址。这三件都做了，剩下的交给用户。
 *
 * 域名不再写死：2026-11-02 站点从 galgame-guide.vercel.app 迁到自有域名后，
 * 这段仍然印着旧地址，等于把用户的书签全指向一个我们控制不了子域名的域。
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://galgame.krzvv.com"
).replace(/\/+$/, "");
const SITE_HOST = new URL(SITE_URL).host;

export function BookmarkHint({ variant = "inline" }: { variant?: "inline" | "footer" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用（非 https 或用户拒绝）时不报错：域名本来就印在页面上
    }
  };

  const address = (
    <button type="button" onClick={copy} className="miao-address">
      {SITE_HOST}
      <span className="miao-address-hint">{copied ? "已复制" : "复制"}</span>
    </button>
  );

  if (variant === "footer") {
    return (
      <div className="miao-bookmark miao-bookmark--footer">
        <p className="miao-bookmark-title">收藏本站</p>
        <p className="miao-bookmark-desc">
          本站的流量全靠搜索结果，哪天搜不到了就是真的没了。
        </p>
        {address}
      </div>
    );
  }

  return (
    <section className="miao-bookmark">
      <div>
        <h2 className="miao-bookmark-title">怕下次找不到？</h2>
        <p className="miao-bookmark-desc">
          本站的内容全靠搜索结果显示，哪天搜不到了就是真的没了。花两秒存下来：
          按{" "}
          <kbd>Ctrl + D</kbd>{" "}
          收藏（Mac 用{" "}
          <kbd>⌘ + D</kbd>
          ），或者点右边复制地址。
        </p>
      </div>
      {address}
    </section>
  );
}
