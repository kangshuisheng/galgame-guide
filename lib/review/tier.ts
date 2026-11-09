export interface ReviewTier {
  label: string;
  description: string;
  badgeClass: string;
}

export const REVIEW_TIERS: Array<ReviewTier & { min: number }> = [
  {
    min: 9.0,
    label: "夯",
    description: "9.0 以上：同类型里很难被替代",
    badgeClass: "border-amber-300/40 bg-amber-300/12 text-amber-100",
  },
  {
    min: 8.0,
    label: "顶级",
    description: "8.0–8.9：完成度很高，值得专门留时间",
    badgeClass: "border-orange-300/35 bg-orange-300/10 text-orange-100",
  },
  {
    min: 7.0,
    label: "人上人",
    description: "7.0–7.9：有明确长板，也有明显短板",
    badgeClass: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  },
  {
    min: 6.0,
    label: "NPC",
    description: "6.0–6.9：挑人，适合对题材特别有兴趣的读者",
    badgeClass: "border-white/15 bg-white/5 text-white/70",
  },
  {
    min: 0,
    label: "拉完了",
    description: "6.0 以下：不推荐作为入坑首选",
    badgeClass: "border-rose-300/25 bg-rose-300/8 text-rose-100/80",
  },
];

export function getReviewTier(score: number): ReviewTier {
  const tier = REVIEW_TIERS.find((item) => score >= item.min) ?? REVIEW_TIERS[REVIEW_TIERS.length - 1];
  return { label: tier.label, description: tier.description, badgeClass: tier.badgeClass };
}
