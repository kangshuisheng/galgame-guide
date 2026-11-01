#!/usr/bin/env node
/**
 * 手动补跑「中性作品介绍」生成。
 *
 * 日常增量由 Vercel Cron 调用 /api/cron/generate-intro 完成（同一个引擎，
 * 见 lib/intro/engine.mjs）。这里只负责本地补历史与预演。
 *
 *   pnpm intro:gen                 # 增量：20 条
 *   pnpm intro:gen --limit=50      # 指定条数
 *   pnpm intro:gen --dry-run       # 只调模型、不写库
 *
 * 默认用 Cloudflare（需要 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_TOKEN）。
 * 也可用 ZenMux 免费模型做小批量补充：
 *   INTRO_AI_PROVIDER=zenmux ZENMUX_API_KEY=... pnpm intro:gen --limit=5
 */

import nextEnv from "@next/env";
import { createClient } from "@libsql/client";

import { runIntroGeneration } from "../lib/intro/engine.mjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 20;
const dryRun = args.includes("--dry-run");

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;
if (!dbUrl) {
  console.error("[Intro] TURSO_DATABASE_URL is not set. Aborted.");
  process.exit(1);
}

const provider = (process.env.INTRO_AI_PROVIDER ?? "cloudflare").toLowerCase();
const isZenMux = provider === "zenmux";
if (!["cloudflare", "zenmux"].includes(provider)) {
  console.error(`[Intro] 不支持的 INTRO_AI_PROVIDER=${provider}。Aborted.`);
  process.exit(1);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN;
const zenMuxKey = process.env.ZENMUX_API_KEY;
if (isZenMux && !zenMuxKey) {
  console.error("[Intro] zenmux 模式缺少 ZENMUX_API_KEY。Aborted.");
  process.exit(1);
}
if (!isZenMux && (!accountId || !apiToken)) {
  console.error(
    "[Intro] 缺少 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_TOKEN。Aborted.",
  );
  process.exit(1);
}

const db = createClient({ url: dbUrl, authToken: dbToken });

const startedAt = Date.now();
console.log(`[Intro] provider=${provider}`);
const stats = await runIntroGeneration({
  db,
  limit,
  accountId: isZenMux ? undefined : accountId,
  apiToken: isZenMux ? undefined : apiToken,
  baseUrl: isZenMux
    ? process.env.ZENMUX_BASE_URL ?? "https://zenmux.ai/api/v1/chat/completions"
    : undefined,
  apiKey: isZenMux ? zenMuxKey : undefined,
  model: isZenMux
    ? process.env.ZENMUX_MODEL ?? "z-ai/glm-4.7-flash-free"
    : process.env.CLOUDFLARE_AI_MODEL ?? "@cf/openai/gpt-oss-20b",
  // GLM-4.7 Flash 默认强制思考，会把 max_tokens 全烧在 reasoning 上并返回空 content。
  // ZenMux 的免费模型必须显式关闭 thinking，才能稳定拿到 JSON 正文。
  extraBody: isZenMux ? { thinking: { type: "disabled" } } : undefined,
  // ZenMux 免费模型并发很低，并发跑会直接 429；本地串行反而成功率更高。
  concurrency: isZenMux ? 1 : 4,
  timeoutMs: Number(
    process.env.INTRO_AI_TIMEOUT_MS ?? (isZenMux ? 120000 : 30000),
  ),
  dryRun,
  log: (message) => console.log(message),
});

console.log(
  `[Intro] ${dryRun ? "预演" : "完成"}：候选 ${stats.picked}，写入 ${stats.written}，` +
    `拒绝 ${stats.rejected}，失败 ${stats.failed}，用时 ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
);
