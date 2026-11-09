import Link from "next/link";

import { BookmarkHint } from "@/components/bookmark-hint";
import { buildGoPath, siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="miao-footer">
      <div className="miao-footer-inner">
        <div className="miao-footer-grid">
          <div>
            <h2 className="miao-footer-title">
              旮旯喵评
              <small>GALGAME GUIDE</small>
            </h2>
            <p className="miao-footer-desc">
              一个猫猫编辑部做的 Galgame 与视觉小说站点：资料库里查作品，
              喵评里看结论。只整理资料，不存游戏文件。
            </p>
            <BookmarkHint variant="footer" />
          </div>

          <div>
            <h3 className="miao-footer-heading">快速导航</h3>
            <ul className="miao-footer-list">
              <li><Link href="/">网站首页</Link></li>
              <li><Link href="/archive">资料库 · 全部作品</Link></li>
              <li><Link href="/review">喵评 · 猫猫推荐</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="miao-footer-heading">关于与合规</h3>
            <ul className="miao-footer-list">
              <li><Link href="/about">关于我们</Link></li>
              <li><Link href="/privacy">隐私政策</Link></li>
              <li><Link href="/terms">服务条款</Link></li>
              <li><Link href="/contact">免责声明</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="miao-footer-heading">合作伙伴</h3>
            <p className="miao-footer-desc">
              本站只整理资料，不存游戏文件。下载请到资源站。
            </p>
            <a
              href={buildGoPath("site")}
              target="_blank"
              rel="nofollow noopener noreferrer"
              referrerPolicy="no-referrer"
              className="miao-footer-link"
            >
              KrzACG 社区 ↗
            </a>
            {/* 这两个卫星站长期没有外部入链，Bing 的 AnchorCount 是 0、从未被发现。
                页脚 follow 链接是它们的发现路径：不要加 nofollow，也不要删。 */}
            <ul className="miao-footer-list">
              <li>
                <a
                  href="https://gal.krzvv.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Galgame 备用入口 ↗
                </a>
              </li>
              <li>
                <a
                  href="https://collection.krzvv.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Galgame 合集榜 ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="miao-footer-bottom">
          <p>© {new Date().getFullYear()} 旮旯喵评 · {siteConfig.englishName}</p>
          <p>资料仅供参考 · 不提供游戏文件</p>
        </div>
      </div>
    </footer>
  );
}
