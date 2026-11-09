import type { ReviewScores } from "@/lib/review/types";

const SCORE_FIELDS: Array<{ key: keyof ReviewScores; label: string }> = [
  { key: "story", label: "剧情" },
  { key: "characters", label: "角色" },
  { key: "music", label: "音乐" },
  { key: "art", label: "美术" },
  { key: "system", label: "系统" },
];

export function ScoreBars({ scores }: { scores: ReviewScores }) {
  return (
    <div className="review-score-bars">
      {SCORE_FIELDS.map((field) => {
        const value = Math.max(0, Math.min(10, scores[field.key]));
        return (
          <div key={field.key} className="review-score-row">
            <span className="review-score-label">{field.label}</span>
            <div
              className="review-score-track"
              role="meter"
              aria-label={`${field.label}评分`}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={value}
            >
              <span className="review-score-fill" style={{ width: `${value * 10}%` }} />
            </div>
            <span className="review-score-value">{value.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
