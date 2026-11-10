# 部署前检查清单（2026-10-29）

> 本次已完成的代码/数据改动见 `SATELLITE-AUDIT-2026-10-29.md` 第八节。
> 线上当前是 `2c32aa1`，仓库 HEAD 从未推送 —— **部署的前提是先 push**。

## 0. 部署前必须确认（缺一项就别部署）

| # | 检查项 | 怎么查 | 期望 |
|---|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` 已在 Vercel 配置 | Vercel → Settings → Environment Variables | `https://galgame.krzvv.com`（或自有域名） |
| 2 | `NEXT_PUBLIC_MAIN_SITE_URL` 已配置 | 同上 | `https://www.krzacg.com` |
| 3 | `CRON_SECRET` 已配置 | 同上 | 任意长随机串；不配则 cron 退回 UA 识别（可伪造，生产必须配） |
| 4 | `CRON_SYNC_MAX_PAGES`（可选） | 同上 | 默认 2（约 100 条/天），不配也行 |
| 5 | `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` 已配置 | 同上 | 指向 `d-b-kangshuisheng` 库 |
| 6 | Vercel 项目构建命令 | Settings → Build & Development | 必须是 `pnpm build`（**不要**再写 `content:sync && build`） |
| 7 | 本地构建产物没有 localhost | `grep -r "localhost:3000" .next/server/app/sitemap.xml.body .next/server/app/index.html` | 0 命中（本地构建若未设 env 会命中，属正常；Vercel 上必须 0） |
| 8 | 本地 CSS 没有非法声明 | `grep -E '(color\|background-color\|border-color):--' .next/static/chunks/*.css` | 0 命中 |
| 9 | lint / 类型 / 构建 | `pnpm lint && npx tsc --noEmit && pnpm build` | 全部通过 |
| 10 | 数据库备份存在 | `.audit/backup-games-*.json`、`.audit/backup-slug_redirects-*.json` | 存在（清理前快照） |

> 不再需要 `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID`：cron 路由现在直接同步数据，不再调用 Vercel API 触发 redeploy。

## 1. 部署

```bash
# HEAD 比 origin/main 领先 1 个 commit，且本次改动尚未提交
git add -A
git commit -m "fix: tailwind v4 color utilities, sync idempotency, dedupe, hard 404"
git push origin main
```

- Vercel 会按 push 自动构建；构建命令应为 `pnpm build`（含 `build-redirects`）。
- 若 Vercel 项目没接 GitHub，改用 `vercel --prod`，但注意先把 `lib/generated-redirects.ts` 生成好（`pnpm build:redirects`）。

## 2. 部署后逐项验证（每条都要实测，不要只看代码）

```bash
BASE=https://galgame.krzvv.com

# 品牌已切换
curl -s $BASE/ | grep -o '<title>[^<]*'                 # 期望：Galgame Guide｜...

# 旧跳转路由已消失
curl -s -o /dev/null -w '%{http_code}\n' $BASE/go/AI-1.7G-9296aa-23   # 期望 404

# 作品页 noindex
curl -s $BASE/AI-1.7G-9296aa-23 | grep -o '<meta name="robots"[^>]*>'  # 期望 noindex, follow

# 未知 slug 硬 404（不是 200 + 404 内容）
curl -s -o /dev/null -w '%{http_code}\n' $BASE/definitely-missing-zzz   # 期望 404

# 旧 slug 一跳 301
curl -s -o /dev/null -D - $BASE/ai-1-7g-029296aa-9296aa | grep -i '^HTTP\|^location'
# 期望 301 -> /AI-1.7G-9296aa-23

# sitemap 收敛到 6 条
curl -s $BASE/sitemap.xml | grep -c '<loc>'              # 期望 6

# 广告脚本已无
curl -s $BASE/AI-1.7G-9296aa-23 | grep -c 'exoclick'     # 期望 0

# CTA 可见（金色底）
curl -s $BASE/AI-1.7G-9296aa-23 | grep -o 'class="[^"]*bg-accent[^"]*text-black[^"]*"' | head -1

# 外链带 UTM
curl -s $BASE/ | grep -o 'href="https://www.krzacg.com[^"]*"' | head -3
# 期望 utm_source=guide&utm_medium=referral&utm_campaign=friend_link

# cron 匿名不可触发
curl -s -o /dev/null -w '%{http_code}\n' $BASE/api/cron/sync-content   # 期望 401

# 自动同步是否真的能拉到数据（只统计不写库）
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "$BASE/api/cron/sync-content?dry_run=1"
# 期望 {"ok":true,"fetched":>0,...}；若返回 502，说明 Vercel 出口被源站拦了，
# 需要改走备用方案（见第 6 节）
```

## 2.1 自动同步怎么跑（部署后确认一次）

- `vercel.json` 的 cron 每天 **03:00（东八区，UTC 19:00）** 请求 `/api/cron/sync-content`。
- 路由拉取主站最新 **2 页（约 100 条）**，过滤分类后写 Turso，然后 `revalidatePath` 首页和 `/archive`。
- 主站日均新增约 20–40 篇，2 页足够覆盖；漏了也能靠次日继续补（按 `source_id` 幂等）。
- 本地实测：56 条新增耗时 **2.5s**，无重复行。
- 全量回填（约 +6,700 条）仍建议先做 SQL 分页再手动跑 `pnpm content:sync --full`，否则 `/archive` 会更慢。

## 3. 预期变化（提前和 SEO 侧对齐）

- **sitemap 3905 → 6 条**：这是主动收敛，作品档案页改为 `noindex, follow`。若还指望这些页带量，需要先决定是否保留索引；按母站策略本来就不该索引。
- **旧版 3820 个作品 URL**：slug 未变（清理时保留了 canonical 行），页面继续 200，只是不再进 sitemap。
- **被合并的 3,796 个重复 slug**：其中 3,368 条已在 `slug_redirects` 里改指 canonical，1 跳 301；其余是历史重复页，直接 404。
- **`/archive` 仍是动态页**（未改）：仍会 3–4s。下一步优化项，不影响本次上线。

## 4. 回滚

| 场景 | 操作 |
|---|---|
| 页面/构建出问题 | Vercel → Deployments → 上一个 READY 版本 → Promote |
| 数据问题 | 用 `.audit/backup-games-*.json` + `.audit/backup-slug_redirects-*.json` 回灌（`games` 需先删后插，注意 UNIQUE 索引） |
| 只想撤 sitemap 变化 | 改 `app/sitemap.ts` 后重新部署 |

## 5. 本次未做、但上线后应排期

1. `/archive` 改 SQL 分页 + 首屏静态化（当前每次全表扫描 3.8MB 文本）。
2. `safeQuery` 吞异常 → DB 失败会缓存空首页 1h；应改为抛给 `error.tsx`（已新增）。
3. redirect 表 5,507 条进 proxy（192KB）；可改为 `next.config` redirects 或只保留必要项。
4. 全量回填：等第 1 项做完再跑 `pnpm content:sync --full`（预演 +6,723 新 / 1,088 更新）。
5. 埋点：接 Umami（`umami.krzacg.com`，site id `guide`）+ outbound click 事件，否则卫星站价值永远无法度量。

## 6. 备用方案（如果 Vercel 出口被源站拦）

实测源站对云厂商/VPS IP 已不再拦截（Jina 云出口、86 服务器均 200），所以大概率不需要。
万一部署后 `?dry_run=1` 返回 502：

1. **在自己的 86 服务器上加一条 cron**（Node v22 已就绪）：
   ```bash
   ssh -p 2222 root@86.48.5.98
   mkdir -p /opt/galgame-guide && cd /opt/galgame-guide
   git clone git@github.com:Magical-developer/galgame-guide.git .
   npm i -g pnpm && pnpm install
   # .env 里放 TURSO_* 与 CONTENT_SOURCE_API_URL
   crontab -e   # 0 3 * * * cd /opt/galgame-guide && /usr/local/bin/pnpm content:sync >> /var/log/gg-sync.log 2>&1
   ```
2. 或把 GitHub Actions 的 `schedule` 取消注释（当前被注释，源站当年 403 过 Actions 的 IP）。
