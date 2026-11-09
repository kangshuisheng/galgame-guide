import Link from "next/link";

import type { ReviewRecord } from "@/lib/review/types";
import type { GameRecord } from "@/lib/types/game";

/**
 * 作品卡片（纯文字）。
 *
 * 2026-10-31：封面全部移除。上游封面是主站 CDN 上的成人向图片，
 * 挂在 Bing 索引页上会让整站被判为 NSFW，主站就是这么丢掉 Bing 收录的。
 * 卡片改为「标题 + 简介摘要 + 类型标签」，文字量反而比原来多。
 *
 * 2026-11-09：全站统一为纸页设计系统；有喵评的作品会带一枚
 * 「喵评 9.6」小印章，让资料库和喵评模块互相看得见。
 */
export function GameCard({
  game,
  review,
}: {
  game: GameRecord;
  review?: Pick<ReviewRecord, "slug" | "overall"> | null;
}) {
  return (
    <Link href={`/${game.slug}`} className="miao-game-card">
      <span className="miao-game-card-tape" aria-hidden="true" />
      <div className="miao-game-card-top">
        <span className="miao-game-card-kicker">作品资料</span>
        <span className="miao-game-card-views">{game.views.toLocaleString()} 热度</span>
      </div>

      <h2 className="miao-game-card-title">{game.title}</h2>

      {game.summary ? (
        <p className="miao-game-card-summary">{game.summary}</p>
      ) : null}

      {game.tags.length > 0 && (
        <div className="miao-game-card-tags">
          {game.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="miao-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="miao-game-card-foot">
        <span className="miao-game-card-link">查看资料 →</span>
        {review ? (
          <span className="miao-game-badge">喵评 {review.overall.toFixed(1)}</span>
        ) : null}
      </div>
    </Link>
  );
}
