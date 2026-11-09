import { CatMascot } from "@/components/review/cat-mascot";

export default function Loading() {
  return (
    <main className="miao-page">
      <div className="miao-loading">
        <CatMascot className="miao-loading-mascot" />
        <p className="miao-loading-text">猫猫正在翻档案…</p>
      </div>
    </main>
  );
}
