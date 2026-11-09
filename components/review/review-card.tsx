import Link from "next/link";

import { getReviewTier } from "@/lib/review/tier";
import type { ReviewRecord } from "@/lib/review/types";

export function ReviewCard({ review }: { review: ReviewRecord }) {
  const tier = getReviewTier(review.overall);
  const year = review.releaseDate ? review.releaseDate.slice(0, 4) : "年份未知";

  return (
    <Link href={`/review/${review.slug}`} className="review-card">
      <span className="review-card-tape" aria-hidden="true" />
      <div className="review-card-top">
        <span className="review-card-kicker">猫猫喵评</span>
        <span className="review-score-stamp review-score-stamp--small">
          <strong>{review.overall.toFixed(1)}</strong>
          <small>{tier.label}</small>
        </span>
      </div>

      <div className="review-card-title-wrap">
        <h2>{review.title}</h2>
        {review.originalTitle && review.originalTitle !== review.title ? (
          <p className="review-card-original">{review.originalTitle}</p>
        ) : null}
      </div>

      <p className="review-card-verdict">{review.verdict}</p>

      <div className="review-card-bottom">
        <p className="review-card-meta">
          <span>{review.developer}</span>
          <span aria-hidden="true">·</span>
          <span>{year}</span>
          {review.genres.length > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{review.genres.slice(0, 3).join(" / ")}</span>
            </>
          ) : null}
        </p>
        <span className="review-card-link">翻开喵评 <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}
