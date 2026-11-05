import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/config";
import { db } from "@/lib/db";
import { submitSlugs } from "@/lib/indexnow.mjs";
import { runIntroGeneration } from "@/lib/intro/engine.mjs";
import { resolveIntroProvider } from "@/lib/intro/providers.mjs";

/** 给 IndexNow / 缓存失效留 30 秒，避免 300s 硬切把已经写库的批次判失败。 */
const STOP_NEW_WORK_AFTER_MS = 270_000;

export function isCronAuthorized(authorization, userAgent) {
  if (siteConfig.cronSecret) {
    return authorization === `Bearer ${siteConfig.cronSecret}`;
  }
  return Boolean(userAgent?.includes("vercel-cron"));
}

export async function runIntroCron({ provider, request, requestHeaders }) {
  const authorization = requestHeaders.get("authorization");
  const userAgent = requestHeaders.get("user-agent");
  if (!siteConfig.cronSecret) {
    console.warn(
      "[Cron] CRON_SECRET is not configured; falling back to User-Agent check. Set CRON_SECRET to enforce bearer auth.",
    );
  }

  if (!isCronAuthorized(authorization, userAgent)) {
    console.error("[Cron] Unauthorized access attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = resolveIntroProvider(provider);
  if ("error" in resolved) {
    console.warn(`[Cron] ${resolved.error}，跳过本次生成。`);
    return NextResponse.json(
      { ok: false, skipped: true, provider, reason: resolved.error },
      { status: 200 },
    );
  }

  const startedAt = Date.now();
  const dryRun = new URL(request.url).searchParams.get("dry_run") === "1";
  const limitParam = Number(new URL(request.url).searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : resolved.limit;

  try {
    const stats = await runIntroGeneration({
      db,
      limit,
      ...resolved.config,
      timeoutMs: Number(
        process.env.INTRO_AI_TIMEOUT_MS ?? resolved.config.timeoutMs,
      ),
      dryRun,
      deadlineAt: startedAt + STOP_NEW_WORK_AFTER_MS,
      log: (message) => console.log(message),
    });

    if (!dryRun && stats.written > 0) {
      revalidatePath("/");
      revalidatePath("/archive");
      for (const slug of stats.writtenSlugs) revalidatePath(`/${slug}`);
      await submitSlugs({
        siteUrl: siteConfig.siteUrl,
        key: siteConfig.indexNowKey,
        slugs: stats.writtenSlugs,
        log: (message) => console.log(message),
      });
    }

    const durationMs = Date.now() - startedAt;
    console.log("[Cron] intro done:", {
      provider: resolved.name,
      model: resolved.config.model,
      ...stats,
      durationMs,
    });
    return NextResponse.json({
      ok: true,
      provider: resolved.name,
      model: resolved.config.model,
      ...stats,
      durationMs,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cron] intro failed:", { provider: resolved.name, message });
    return NextResponse.json(
      {
        ok: false,
        provider: resolved.name,
        message,
        durationMs: Date.now() - startedAt,
      },
      { status: 502 },
    );
  }
}
