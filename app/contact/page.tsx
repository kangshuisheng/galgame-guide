import type { Metadata } from "next";

import { OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "免责声明",
  description: "旮旯喵评的免责声明与内容使用说明。",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "免责声明",
    description: "旮旯喵评的免责声明与内容使用说明。",
    url: "/contact",
    type: "website",
    images: [OG_IMAGE],
  },
};

export default function ContactPage() {
  return (
    <main className="miao-page">
      <div className="miao-container miao-narrow">
        <header className="miao-page-head">
          <span className="miao-kicker">
            <span className="miao-kicker-dot" aria-hidden="true" />
            法律合规
          </span>
          <h1>免责声明</h1>
        </header>

        <article className="miao-paper miao-legal">
          <h2>免责声明 (Disclaimer)</h2>
          <p>
            1. <strong>内容性质</strong>：旮旯喵评（以下简称“本站”）提供游戏作品的资料与索引，
            不对具体版本、兼容性或可玩性作出承诺。
          </p>
          <p>
            2. <strong>资源链接</strong>：本站不存储、不上传任何游戏文件。页面上的外部链接
            （网盘、下载页等）指向互联网公开内容，其内容与可用性不受本站控制。
          </p>
          <p>
            3. <strong>版权归属</strong>：所有游戏作品的版权归原始开发商或发行方所有。
            若权利方认为本站收录的内容侵犯了其权益，请通过下方邮箱告知，核实后 24 小时内移除。
          </p>
          <p>
            4. <strong>使用风险</strong>：访问外部链接时，请自行核对来源、版本与安全性。
            本站对第三方内容不作保证。
          </p>
        </article>
      </div>
    </main>
  );
}
