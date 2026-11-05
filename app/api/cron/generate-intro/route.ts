import { headers } from "next/headers";

import { runIntroCron } from "@/lib/intro/cron.mjs";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Cloudflare 通道。与主站共用 10,000 neurons/天，日产量默认 100。
 * 00:05 UTC = 北京时间 08:05，紧挨免费额度重置。
 */
export async function GET(request: Request) {
  return runIntroCron({
    provider: "cloudflare",
    request,
    requestHeaders: await headers(),
  });
}
