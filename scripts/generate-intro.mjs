#!/usr/bin/env node
/**
 * 手动补跑「中性作品介绍」生成。
 *
 * 日常增量由三条 Vercel Cron 完成（Cloudflare / ZenMux / Groq 各一条，
 * 见 lib/intro/engine.mjs）。这里只负责本地补历史与预演。
 *
 *   pnpm intro:gen                 # Cloudflare，默认 20 条
 *   pnpm intro:gen --limit=50      # 指定条数
 *   pnpm intro:gen --dry-run       # 只调模型、不写库
 *   pnpm intro:gen:zenmux --limit=5
 *   pnpm intro:gen:groq --limit=5
 */

import nextEnv from "@next/env";
import { createClient } from "@libsql/client";

import { runIntroGeneration } from "../lib/intro/engine.mjs";
import { resolveIntroProvider } from "../lib/intro/providers.mjs";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const dryRun = args.includes("--dry-run");

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;
if (!dbUrl) {
  console.error("[Intro] TURSO_DATABASE_URL is not set. Aborted.");
  process.exit(1);
}

const resolved = resolveIntroProvider(process.env.INTRO_AI_PROVIDER);
if ("error" in resolved) {
  console.error(`[Intro] ${resolved.error}。Aborted.`);
  process.exit(1);
}

const limit = limitArg
  ? Number(limitArg.split("=")[1])
  : Number(process.env.INTRO_AI_LIMIT ?? 20);
if (!Number.isFinite(limit) || limit < 1) {
  console.error("[Intro] --limit 必须是正整数。Aborted.");
  process.exit(1);
}

const db = createClient({ url: dbUrl, authToken: dbToken });

const startedAt = Date.now();
console.log(`[Intro] provider=${resolved.name} model=${resolved.config.model}`);
const stats = await runIntroGeneration({
  db,
  limit,
  ...resolved.config,
  timeoutMs: Number(
    process.env.INTRO_AI_TIMEOUT_MS ?? resolved.config.timeoutMs,
  ),
  dryRun,
  log: (message) => console.log(message),
});

console.log(
  `[Intro] ${dryRun ? "预演" : "完成"}：候选 ${stats.picked}，写入 ${stats.written}，` +
    `拒绝 ${stats.rejected}，失败 ${stats.failed}，用时 ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
);
