import Link from "next/link";

import { getReviewTier } from "@/lib/review/tier";
import type { ReviewRecord } from "@/lib/review/types";

export function ReviewCard({ review }: { review: ReviewRecord }) {
  const tier = getReviewTier(review.overall);
  const year = review.releaseDate ? review.releaseDate.slice(0, 4) : "年份未知";

  return (
    <Link
      href={`/review/${review.slug}`}
      className="group flex flex-col rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-6 shadow-[0_35px_80px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-accent/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="eyebrow">Galgame 品鉴</span>
          <h2 className="mt-4 line-clamp-2 font-display text-2xl leading-tight text-ink-strong group-hover:text-accent">
            {review.title}
          </h2>
          {review.originalTitle && review.originalTitle !== review.title ? (
            <p className="mt-1 line-clamp-1 text-xs tracking-[0.08em] text-white/35">
              {review.originalTitle}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <div className="font-display text-4xl leading-none text-accent">
            {review.overall.toFixed(1)}
          </div>
          <span
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] ${tier.badgeClass}`}
          >
            {tier.label}
          </span>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-7 text-ink-soft">
        {review.verdict}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-5 text-[11px] tracking-[0.08em] text-white/40">
        <span>{review.developer}</span>
        <span aria-hidden="true">·</span>
        <span>{year}</span>
        {review.genres.length > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="line-clamp-1">{review.genres.slice(0, 3).join(" / ")}</span>
          </>
        ) : null}
      </div>
    </Link>
  );
}
