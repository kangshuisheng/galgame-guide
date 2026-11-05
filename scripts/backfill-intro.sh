#!/usr/bin/env bash
#
# 补跑 AI 作品介绍，直到存量清空或当天配额用完。
#
# 为什么需要它：Cloudflare Workers AI 免费额度是 10,000 neurons/天，
# 每天 UTC 00:00（北京时间 08:00）重置，实测约 20 neurons/条 → 每天最多 500 条。
# Vercel 只跑 Cloudflare（00:05 UTC）。ZenMux / Groq 由本机 DSH 每日任务调用本脚本。
#
# 用法：
#   bash scripts/backfill-intro.sh          # 默认 100 条
#   bash scripts/backfill-intro.sh 300      # 指定条数（确认配额独立后才调大）
#
# ❗ 默认值刻意压到 100：Cloudflare 的 10,000 neurons/天 是**账号级**的，
# 主站生产 AI 用的是同一个账号。这里吃多了，主站的 post SEO / 搜索排序就没额度了。
# 2026-11-01 实测：10-31 主站 4,133.8 + 卫星站 8,112.6 = 12,246 neurons，
# 超过 10,000 后账号被 429 卡住，第二天也没有马上恢复。100 条约 2,100 neurons，
# 给主站留约 8,000，才是安全线。
#
# 幂等：没有待生成条目时引擎会立刻返回；配额已用完时会撞 429 然后中止，
# 两种情况都只花几秒，重复跑没有副作用。
set -euo pipefail

cd "$(dirname "$0")/.."

# 默认 shell 可能是 Node 16，项目要求 >= 20
if [ -d "$HOME/.nvm/versions/node/v25.2.1/bin" ]; then
  export PATH="$HOME/.nvm/versions/node/v25.2.1/bin:$PATH"
fi

# Cloudflare 凭证放在主站 backend/.env 里；也支持外部直接注入环境变量
if [ -z "${CLOUDFLARE_AI_API_TOKEN:-}" ]; then
  MAIN_ENV="${KRZACG_ENV:-../KrzACG/backend/.env}"
  if [ -f "$MAIN_ENV" ]; then
    CLOUDFLARE_ACCOUNT_ID="$(grep '^CLOUDFLARE_ACCOUNT_ID=' "$MAIN_ENV" | cut -d= -f2-)"
    CLOUDFLARE_AI_API_TOKEN="$(grep '^CLOUDFLARE_AI_API_TOKEN=' "$MAIN_ENV" | cut -d= -f2-)"
    export CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_AI_API_TOKEN
  fi
fi

if [ -z "${CLOUDFLARE_AI_API_TOKEN:-}" ]; then
  echo "[backfill] 找不到 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_TOKEN，已中止。" >&2
  exit 1
fi

LIMIT="${1:-100}"
LOG_DIR=".audit"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/intro-backfill-$(date +%Y-%m-%d).log"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') 开始，limit=$LIMIT ===" >> "$LOG"
node scripts/generate-intro.mjs --limit="$LIMIT" >> "$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') 结束 ===" >> "$LOG"

# 终端只看结论行，完整日志留在 .audit/
grep -E "^\[Intro\] 完成" "$LOG" | tail -1
