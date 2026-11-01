import { buildGoPath } from "@/lib/config";

/**
 * 作品页的主行动按钮 —— 整站唯一真正要用户点的东西。
 *
 * 两件事必须同时成立：
 *   1. 用户一眼看到、知道点了会发生什么；
 *   2. HTML 里不出现主站域名。
 * 第 2 点靠 `/go?to=<id>` 这个同源跳转实现，理由见 app/go/route.ts。
 *
 * 2026-11-01：访客 74% 来自美国 / 香港 / 新加坡 / 日本，内地只占 1%。
 * 按钮改成「下载图标 + Download」为主、「前往下载页」为辅：图标和英文
 * 不依赖中文阅读，非中文用户也能一眼看懂这是下载入口。动效只做 transform /
 * opacity，不占布局、不抖页面；prefers-reduced-motion 下全部关闭。
 */

const LINK_CLASS =
  "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-accent px-4 py-3.5 text-left text-black shadow-[0_12px_36px_rgba(214,169,107,0.28)] transition duration-300 hover:bg-accent-strong hover:shadow-[0_16px_44px_rgba(214,169,107,0.42)] active:scale-[0.995] sm:gap-4 sm:px-5 sm:py-4";

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
    <section className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-accent/35 bg-[linear-gradient(135deg,rgba(214,169,107,0.16),rgba(214,169,107,0.04))] p-5 sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-52 rounded-full bg-accent/[0.16] blur-3xl"
      />

      <div className="relative">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.24em] text-accent/90 uppercase">
          <span aria-hidden="true" className="cta-live-dot inline-block size-1.5 rounded-full bg-accent" />
          Download · 资源下载
        </p>

        <a
          href={buildGoPath(sourceId)}
          target="_blank"
          rel="nofollow noopener noreferrer"
          referrerPolicy="no-referrer"
          // 全站唯一要回答的问题：这个按钮到底有没有人点。
          data-umami-event="guide-deeplink"
          data-umami-event-post-id={sourceId}
          aria-label={`Download — 前往《${title}》的下载页`}
          className={`${LINK_CLASS} mt-3`}
        >
          <span
            aria-hidden="true"
            className="cta-icon-badge relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-black/10 sm:size-14"
          >
            <span className="cta-icon-halo absolute inset-0 rounded-2xl" />
            <DownloadIcon className="relative size-6 sm:size-7" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl leading-none tracking-[0.02em] sm:text-[1.65rem]">
              Download
            </span>
            <span className="mt-1.5 block text-[11px] font-semibold tracking-[0.06em] text-black/70 sm:text-xs">
              前往下载页 · 免费<span className="hidden sm:inline"> · 无需注册</span>
            </span>
          </span>

          <span
            aria-hidden="true"
            className="cta-arrow flex size-9 shrink-0 items-center justify-center rounded-full bg-black/10 text-lg sm:size-10"
          >
            →
          </span>

          <span aria-hidden="true" className="cta-shine" />
        </a>

        <p className="mt-3 text-center text-xs leading-6 text-white/45">
          打开《{title}》的下载页面 · 本站不存游戏文件
        </p>
      </div>
    </section>
  );
}

/** 手机端的常驻底栏。手机上按钮很容易被划出屏幕，钉在底部是唯一稳的做法。 */
export function MobileStickyCta({ sourceId }: { sourceId: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <a
        href={buildGoPath(sourceId)}
        target="_blank"
        rel="nofollow noopener noreferrer"
        referrerPolicy="no-referrer"
        data-umami-event="guide-deeplink-sticky"
        data-umami-event-post-id={sourceId}
        aria-label="Download — 前往下载页"
        className={`${LINK_CLASS} px-3.5 py-3`}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-black/10"
        >
          <DownloadIcon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg leading-none">Download</span>
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.04em] text-black/70">
            前往下载页 · 免费
          </span>
        </span>
        <span
          aria-hidden="true"
          className="cta-arrow flex size-8 shrink-0 items-center justify-center rounded-full bg-black/10 text-base"
        >
          →
        </span>
        <span aria-hidden="true" className="cta-shine" />
      </a>
    </div>
  );
}
