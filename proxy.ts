import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { slugRedirects } from "@/lib/generated-redirects";

export const config = {
  // 比原来放宽：sitemap.xml / robots.txt / go 也要跟着域名重定向走，
  // 所以只排除 Next 自己的静态产物和 favicon。
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};

const LEGACY_HOST = "galgame-guide.vercel.app";
const CANONICAL_HOST = "galgame.krzvv.com";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname } = request.nextUrl;

  // 旧 vercel.app 域名永久转到新域名，两个原因：
  //   ① *.vercel.app 在国内被 DNS 污染，内地用户根本解析不到这台机器；
  //   ② 两个域名同时在线 = 同一份内容两套 URL，Bing 的信号会被拆开。
  // /api 不转：Vercel Cron 和 webhook 不一定会跟随 301，转了会静默失败。
  if (host === LEGACY_HOST && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Only handle top-level slugs like /some-slug, not nested paths.
  if (pathname.split("/").length > 2) {
    return NextResponse.next();
  }

  const slug = pathname.slice(1);
  if (!slug) return NextResponse.next();

  const target = slugRedirects[slug];
  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${target}`;
  return NextResponse.redirect(url, 301);
}
