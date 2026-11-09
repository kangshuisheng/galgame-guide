import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./review.css";

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/review-cat.svg", type: "image/svg+xml" }],
  },
};

/**
 * 喵评模块的纸页容器。
 *
 * 全站已经统一为旮旯喵评的纸页视觉；这里保留独立容器只是为了
 * 给 review 路由叠一层更浓的手帐纹理，不是另一套主题。
 */
export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <div className="review-world">{children}</div>;
}
