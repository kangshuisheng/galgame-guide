/**
 * 作品介绍生成的供应商配置。CLI 与 Vercel Cron 共用，避免两处各写一份限流。
 *
 * Cloudflare 与主站共用 10,000 neurons/天，卫星站只拿一小截。
 * ZenMux / Groq 是另一套免费额度，按各自限流在 300s 函数里尽量跑满。
 */

export const INTRO_PROVIDERS = ["cloudflare", "zenmux", "groq"];

export function isIntroProvider(value) {
  return INTRO_PROVIDERS.includes(value);
}

/**
 * @param {string} [name]
 * @returns {{ name: string, label: string, limit: number, config: Record<string, unknown> } | { error: string }}
 */
export function resolveIntroProvider(name) {
  const provider = String(name ?? process.env.INTRO_AI_PROVIDER ?? "cloudflare")
    .trim()
    .toLowerCase();

  if (provider === "zenmux") {
    const apiKey = process.env.ZENMUX_API_KEY ?? "";
    if (!apiKey) return { error: "zenmux 模式缺少 ZENMUX_API_KEY" };
    return {
      name: "zenmux",
      label: "ZenMux GLM-4.7 Flash",
      // 5 rpm / 500 rpd 量级；300s 函数里串行大约几十条，先用 80 让 deadline 收工。
      limit: Number(process.env.CRON_INTRO_ZENMUX_LIMIT ?? 80),
      config: {
        baseUrl:
          process.env.ZENMUX_BASE_URL ??
          "https://zenmux.ai/api/v1/chat/completions",
        apiKey,
        model: process.env.ZENMUX_MODEL ?? "z-ai/glm-4.7-flash-free",
        extraBody: { thinking: { type: "disabled" } },
        concurrency: Number(process.env.CRON_INTRO_ZENMUX_CONCURRENCY ?? 1),
        maxRetries: 1,
        retryDelayMs: 8000,
        timeoutMs: 25000,
      },
    };
  }

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY ?? "";
    if (!apiKey) return { error: "groq 模式缺少 GROQ_API_KEY" };
    return {
      name: "groq",
      label: "Groq gpt-oss-20b",
      // 免费层大约 8,000 TPM；串行 + 6.5s 间隔，300s 里大约 40 条。
      limit: Number(process.env.CRON_INTRO_GROQ_LIMIT ?? 40),
      config: {
        baseUrl:
          process.env.GROQ_BASE_URL ??
          "https://api.groq.com/openai/v1/chat/completions",
        apiKey,
        model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
        extraBody: { reasoning_effort: "low" },
        concurrency: 1,
        requestDelayMs: Number(process.env.CRON_INTRO_GROQ_DELAY_MS ?? 6500),
        maxRetries: 1,
        retryDelayMs: 5000,
        timeoutMs: 20000,
      },
    };
  }

  if (provider !== "cloudflare") {
    return { error: `不支持的 INTRO_AI_PROVIDER=${provider}` };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const apiToken = process.env.CLOUDFLARE_AI_API_TOKEN ?? "";
  if (!accountId || !apiToken) {
    return { error: "cloudflare 模式缺少 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_TOKEN" };
  }
  return {
    name: "cloudflare",
    label: "Cloudflare gpt-oss-20b",
    // 约 2,100 neurons，占账号日额度约 20%，给主站留余量。
    limit: Number(process.env.CRON_INTRO_LIMIT ?? 100),
    config: {
      accountId,
      apiToken,
      model: process.env.CLOUDFLARE_AI_MODEL ?? "@cf/openai/gpt-oss-20b",
      concurrency: Number(process.env.CRON_INTRO_CONCURRENCY ?? 4),
      maxRetries: 0,
      timeoutMs: 30000,
    },
  };
}
