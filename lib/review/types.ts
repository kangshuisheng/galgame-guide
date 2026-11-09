export interface ReviewScores {
  story: number;
  characters: number;
  music: number;
  art: number;
  system: number;
}

export interface ReviewSimilar {
  title: string;
  /** 站内已有品鉴的 slug；为空时回落到作品库搜索 */
  slug?: string;
}

export interface ReviewFaq {
  question: string;
  answer: string;
}

export interface ReviewRecord {
  slug: string;
  title: string;
  originalTitle: string | null;
  developer: string;
  releaseDate: string | null;
  platforms: string[];
  genres: string[];
  summary: string;
  guideSlug: string | null;
  vndbId: string | null;
  vndbRating: number | null;
  vndbVotes: number | null;
  reviewTitle: string;
  verdict: string;
  overall: number;
  scores: ReviewScores;
  highlights: string[];
  issues: string[];
  audience: string;
  similar: ReviewSimilar[];
  faq: ReviewFaq[];
  body: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
}
