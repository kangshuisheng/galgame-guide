import type { Metadata } from "next";

import { OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "服务条款",
  description: "旮旯喵评的服务说明、使用限制、版权声明与免责条款。",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "服务条款",
    description: "旮旯喵评的服务说明、使用限制、版权声明与免责条款。",
    url: "/terms",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function TermsPage() {
  return (
    <main className="miao-page">
      <div className="miao-container miao-narrow">
        <header className="miao-page-head">
          <span className="miao-kicker">
            <span className="miao-kicker-dot" aria-hidden="true" />
            法律条款
          </span>
          <h1>服务条款</h1>
          <p className="miao-legal-meta">最后更新日期：2026 年 8 月 2 日</p>
        </header>

        <article className="miao-paper miao-legal">
          <p>
            欢迎使用旮旯喵评（Galgame Guide，以下简称&quot;本站&quot;）。访问和使用本网站，
            即表示您同意遵守以下服务条款。如果您不同意这些条款，请停止使用本站。
          </p>

          <h2>1. 服务说明</h2>
          <p>
            旮旯喵评是一个 Galgame 与视觉小说站点，提供作品搜索、类型筛选、作品资料浏览和喵评内容。
            本站只整理资料和下载入口，不存游戏文件。
          </p>

          <h2>2. 使用限制</h2>
          <ul>
            <li>用户必须年满 18 周岁才能访问本站内容。</li>
            <li>禁止利用本站内容进行任何形式的非法活动。</li>
            <li>禁止对本站进行自动化抓取、爬虫攻击或 DDoS 攻击。</li>
            <li>禁止恶意篡改、复制或盗用本站原创内容。</li>
          </ul>

          <h2>3. 知识产权</h2>
          <p>
            本站原创界面与编辑说明的版权归旮旯喵评所有。涉及的游戏作品、角色形象及相关素材版权
            归其原始开发商或发行方所有。本站不存储或分发受版权保护的游戏本体。
          </p>

          <h2>4. 免责声明</h2>
          <p>
            本站内容仅供参考，不对因使用本站信息而导致的任何直接或间接损失承担责任。
            外部链接指向的内容由第三方平台控制，本站不对其真实性、合法性负责。
          </p>

          <h2>5. 第三方服务</h2>
          <p>
            本站可能包含普通合作伙伴链接。这些第三方站点受其自身条款和隐私政策约束，
            外链不代表本站对其全部内容作出背书。
          </p>

          <h2>6. 条款变更</h2>
          <p>
            我们保留随时修改本服务条款的权利。任何更改将在本页面发布后立即生效。
            继续使用本站即表示您接受修订后的条款。
          </p>
        </article>
      </div>
    </main>
  );
}
