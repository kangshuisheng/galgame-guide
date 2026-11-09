import Link from "next/link";

import { CatMascot } from "@/components/review/cat-mascot";

export const metadata = {
  title: "页面未找到",
};

export default function NotFound() {
  return (
    <main className="miao-page">
      <div className="miao-error-page">
        <div className="miao-paper miao-error-card">
          <CatMascot className="miao-error-mascot" />
          <div className="miao-error-code">404</div>
          <h1 className="miao-error-title">这张纸被猫猫叼走了</h1>
          <p className="miao-error-copy">
            这个页面找不到了。可能链接改过，也可能这部作品已经下架。
          </p>
          <div className="miao-error-actions">
            <Link href="/" className="miao-btn miao-btn--primary">
              返回首页
            </Link>
            <Link href="/archive" className="miao-btn miao-btn--secondary">
              去资料库看看
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
