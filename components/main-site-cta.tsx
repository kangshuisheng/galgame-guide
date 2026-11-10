/**
 * 作品页的主行动按钮 —— 整站唯一真正要用户点的东西。
 *
 * 两件事必须同时成立：
 *   1. 用户一眼看到、知道点了会发生什么；
 *   2. HTML 里不出现主站域名。
 * 第 2 点靠 `/go?to=<id>` 这个同源跳转实现，理由见 app/go/route.ts。
 *
 * 2026-11-10：`/go` 不再写成 `<a href>`，改成同源 GET 表单。
 * Bing 后台每天有 1,400+ 个 /go 请求被 robots.txt 拦掉（BlockedByRobotsTxt），
 * 链接虽然带 nofollow，爬虫仍会抓；表单 action 不会进入爬虫链接队列，
 * 用户点击目标不变，同时把抓取预算留给作品页。
 *
 * 2026-11-01：访客 74% 来自美国 / 香港 / 新加坡 / 日本，内地只占 1%。
 * 按钮以「下载图标 + Download」为主、「前往下载页」为辅：图标和英文
 * 不依赖中文阅读，非中文用户也能一眼看懂这是下载入口。动效只做 transform /
 * opacity，不占布局、不抖页面；prefers-reduced-motion 下全部关闭。
 */
function DownloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        className="cta-icon-arrow"
        d="M12 3.5v10"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        className="cta-icon-arrow"
        d="m7.25 9.25 4.75 4.75 4.75-4.75"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 16.5v1.25A2.25 2.25 0 0 0 6.5 20h11a2.25 2.25 0 0 0 2.25-2.25V16.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MainSiteCta({ sourceId, title }: { sourceId: string; title: string }) {
  return (
    <section className="miao-download">
      <p className="miao-download-label">
        <span className="cta-live-dot" aria-hidden="true" />
        Download · 资源下载
      </p>

      <form className="miao-download-form" action="/go" method="get" target="_blank">
        <input type="hidden" name="to" value={sourceId} />
        <button
          type="submit"
          // 全站唯一要回答的问题：这个按钮到底有没有人点。
          data-umami-event="guide-deeplink"
          data-umami-event-post-id={sourceId}
          className="miao-download-button"
        >
        <span className="miao-download-icon">
          <span className="cta-icon-halo absolute inset-0 rounded-2xl" />
          <DownloadIcon className="relative size-6" />
        </span>

        <span className="miao-download-copy">
          <span className="miao-download-title">Download</span>
          <span className="miao-download-sub">前往下载页 · 免费 · 无需注册</span>
        </span>

        <span className="miao-download-arrow cta-arrow" aria-hidden="true">→</span>
        <span className="cta-shine" aria-hidden="true" />
        </button>
      </form>

      <p className="miao-download-note">
        打开《{title}》的下载页面 · 本站不存游戏文件
      </p>
    </section>
  );
}

/** 手机端的常驻底栏。手机上按钮很容易被划出屏幕，钉在底部是唯一稳的做法。 */
export function MobileStickyCta({ sourceId }: { sourceId: string }) {
  return (
    <div className="miao-mobile-cta">
      <form className="miao-download-form" action="/go" method="get" target="_blank">
        <input type="hidden" name="to" value={sourceId} />
        <button
          type="submit"
          data-umami-event="guide-deeplink-sticky"
          data-umami-event-post-id={sourceId}
          className="miao-download-button"
        >
        <span className="miao-download-icon">
          <DownloadIcon className="size-5" />
        </span>
        <span className="miao-download-copy">
          <span className="miao-download-title miao-download-title--sm">Download</span>
          <span className="miao-download-sub">前往下载页 · 免费</span>
        </span>
        <span className="miao-download-arrow cta-arrow" aria-hidden="true">→</span>
        <span className="cta-shine" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
