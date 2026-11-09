import Link from "next/link";

import { getAllReviews } from "@/lib/review/reviews";
import type { GameRecord } from "@/lib/types/game";

export async function RelatedGames({ games }: { games: GameRecord[] }) {
  if (games.length === 0) {
    return null;
  }

  const reviews = await getAllReviews();
  const reviewByGuide = new Map(
    reviews
      .filter((review) => review.guideSlug)
      .map((review) => [review.guideSlug as string, review]),
  );
  const reviewByTitle = new Map(reviews.map((review) => [review.title, review]));

  return (
    <section className="miao-related miao-paper">
      <div className="miao-detail-section-title">
        <span className="miao-detail-section-mark" aria-hidden="true">✦</span>
        <h2>相似条目</h2>
      </div>

      <div className="miao-related-list">
        {games.map((game) => {
          const review = reviewByGuide.get(game.slug) ?? reviewByTitle.get(game.title);
          return (
            <Link key={game.slug} href={`/${game.slug}`} className="miao-related-link">
              <div>
                <h3>{game.title}</h3>
                <p>{game.summary}</p>
              </div>
              <span className="miao-related-meta">
                {review ? `喵评 ${review.overall.toFixed(1)}` : "查看资料"} ↗
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
