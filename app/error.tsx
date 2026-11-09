"use client";

import Link from "next/link";

import { CatMascot } from "@/components/review/cat-mascot";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="miao-page">
      <div className="miao-error-page">
        <div className="miao-paper miao-error-card">
          <CatMascot className="miao-error-mascot" />
          <span className="miao-kicker">出错了</span>
          <h1 className="miao-error-title">这一页没打开</h1>
          <p className="miao-error-copy">
            可能是网络抖了一下。点下面重试，或者回首页重新搜一次。
          </p>
          <div className="miao-error-actions">
            <button onClick={() => reset()} className="miao-btn miao-btn--primary">
              重试一次
            </button>
            <Link href="/" className="miao-btn miao-btn--secondary">
              回到首页
            </Link>
          </div>
          {error.digest ? (
            <p className="miao-error-note">错误编号：{error.digest}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
