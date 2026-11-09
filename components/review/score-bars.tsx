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
    <div className="space-y-4">
      {SCORE_FIELDS.map((field) => {
        const value = Math.max(0, Math.min(10, scores[field.key]));
        return (
          <div key={field.key} className="grid grid-cols-[4rem_minmax(0,1fr)_2.5rem] items-center gap-3">
            <span className="text-xs tracking-[0.16em] text-white/50">{field.label}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]"
                style={{ width: `${value * 10}%` }}
              />
            </div>
            <span className="text-right font-display text-lg text-ink-strong">
              {value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
