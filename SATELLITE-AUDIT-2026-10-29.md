# galgame-guide 卫星站审计报告

> 审计对象：`/Volumes/Transcend/Projects/galgame-guide` + 线上 `https://galgame-guide.vercel.app`
> 审计时间：2026-10-29（Asia/Shanghai）
> 参照体系：KrzACG 母站规范（`ECOSYSTEM.md` / `PUBLIC_API.md` / `GLOSSARY.md` / `ACTIVE_RULES.md` / `ADR-148`）、`krz-registry/sites.json`、`KrzACG/.workbuddy/memory/PORTFOLIO-NOTES.md`
> 方法：只读。线上 curl + `git show` 历史比对 + Turso 只读 SQL + 代码静态审计。未部署、未改线上、未写库。
> 原始分报告：[`.audit/live.md`](.audit/live.md)（运行态）、[`.audit/code.md`](.audit/code.md)（代码）、[`.audit/contract.md`](.audit/contract.md)（契约）

---

## 一页结论

**三句话：**

1. **作用没有发挥出来，接近 0。** 主站 0 链接导出、卫星站自己 0 埋点、数据停更 93 天、唯一转化按钮（"前往主站"）因 CSS bug 实际不可见 —— 它既没带来流量，也没法证明自己带来了流量。
2. **不合格。** 按母站规范推导的 7 条硬性标准，**2 条未达标（数据契约、外链合规）、5 条部分达标、0 条完全达标**。而且线上跑的不是仓库 HEAD，而是 2026-08-01 的旧版：**3820 条 `index,follow` 的模板攻略页 + ExoClick popunder + 隐藏跳转**，正好是母站策略明令禁止的形态。
3. **有优化空间，但第一位不是技术，是决策。** 修复代码（HEAD `0075f3e`）**早已写好，只是从未推送、从未部署**。所以现在最讽刺的状态是：**整改方案躺在本地，风险留在线上。**

**如果只做一件事：** 先止血 —— 修掉隐形 CTA 后部署 HEAD，或直接下线。理由：它当前对主站是**负资产**（站点声誉连坐风险），而收益无法度量。

---

## 二、判定标准：什么才算"合格卫星站"

这不是主观题，母站文档里写得很清楚：

| 来源 | 原文/含义 |
|---|---|
| `GLOSSARY.md:144` | **卫星站** = 以主站数据为事实源的关联站点；服务端（ISR/SSR）拉**公开 API** 渲染，与主站共享真实数据；**不持有任何主站私有凭证** |
| `PUBLIC_API.md` | 卫星站只允许消费 `/api/public/v1/*`（site-stats / categories / friendship-links）；服务端调用、失败必须回落、**不许伪造 UA/Referer** |
| `PORTFOLIO-NOTES.md` §D/E | L2 数据契约必须统一（生成类型，不手写）；L4 部署与运行时必须独立（不能合并故障域）；卫星站**工具化 + 少 index**，**不许做成 SEO 站群**（Google 站点声誉滥用会连坐主站） |
| `PORTFOLIO-NOTES.md` §B.5 | 主站几乎不向卫星站导出流量；卫星站价值是"逃生通道 + 用户动线"，不是链接权重 |
| `ACTIVE_RULES.md` RULE-013 | `/galgame` 整树 301 → `/category/hentai/game`；**不再扩卫星站 / 寄生子域** |
| `krz-registry/sites.json` | `role=satellite`、`line=tools`、`ownDomain=false`、`indexPolicy=homepage`、`status=paused`、`priority=p2` |

由此得到判定清单（详见 `.audit/contract.md` §1）：

- **H1 数据契约**：只消费公开 API，不碰内部端点/私有凭证
- **H2 索引策略**：工具化、少 index，档案页不得作为独立内容提交索引
- **H3 内容边界**：不批量生成模板攻略，不把聚合字段包装成攻略
- **H4 外链合规**：无弹窗广告、无隐藏跳转、UTM 可归因
- **H5 注册表归属**：进 SSOT、仓库归属一致、状态与事实一致
- **H6 故障域隔离**：运行时独立，主站挂了它还能开
- **H7 品牌命名**：对外名字一致，不制造第六个叫法

---

## 三、证据：五处断裂

### 断裂 1｜决策断裂：线上跑的不是仓库最新代码

线上部署的是 **`2c32aa1`（origin/main tip，2026-08-01）**，仓库 HEAD **`0075f3e`（2026-08-02）从未推送、从未部署**，落后 **87.6 天**。

四条独立证据交叉锁定：

| 证据 | 线上实测 | 代码侧 |
|---|---|---|
| 品牌 | `<title>次元绅士指南｜绅游推荐与 Galgame 全结局攻略索引` | HEAD 已改 `Galgame Guide`（`lib/config.ts:11`） |
| sitemap | 3905 条，含 `/{slug}` | 只有 `2c32aa1` 的 `sitemap.ts` 有 `getAllSlugs`；HEAD 只输出 6 条 |
| 组件 | RSC payload 含 `ExoClickHandler` + `EmergencyBanner`，`/go/[slug]` 可用 | 三者在 HEAD 全部删除 |
| 构建时间 | 全站 lastmod 定格 `2026-08-01T16:01:41Z` | 比 `2c32aa1` 提交晚 20 分钟 = 那次 push 的构建 |

**含义**：HEAD 里已经做完的四件事 —— 删 popunder、删防失联横幅、删 `/go/` 改直链、加 UTM —— **线上全部还是旧状态**。团队做对了判断，但执行没闭环。

### 断裂 2｜供给断裂：数据源已被母站删除，且没人发现

- 同步脚本唯一数据源：`https://service.krzacg.com/api/posts/hot-feed`（`scripts/sync-content.mjs:12`）
- **该端点在 2026-10-14 被母站删除**（KrzACG commit `1fce7991`，提交信息：*remove ... hot feed endpoints*）
- 今日实测：`GET /api/posts/hot-feed` → **`400 Validation failed (invalid ObjectId)`**（路径被 `/api/posts/:id` 接住）
- 替代端点存在：`GET /api/posts/latest` → 200（total 2000），但它**不在公开契约内**
- 母站公开 API `/api/public/v1/*` 里**没有 posts 端点** —— 也就是说，卫星站"照规范接"也拿不到作品目录

**数据现状（Turso 只读）**：

| 指标 | 实测 |
|---|---|
| `games` 行数 | **7,616** |
| distinct `source_id` | **3,820** |
| 重复 `source_id` | **1,664 组 / 5,460 行**，单组最多 **25 行** |
| `MAX(published_at/updated_at)` | **2026-07-28 20:14:58** → **停更 93 天** |
| `guides` 行数 | 7,614，其中 **7,591（99.70%）是 `rich-template` 模板**，真人原创仅 20 篇 |
| `slug_redirects` | 5,519 条，其中 3,392 条链式，递归深度 ≥20；1,696 条 old_slug 对应的页面其实还活着 |
| 页面文案 | 首页写"保持每日同步更新"、archive 写"每日更新" —— **与事实相反** |

**含义**：这类站的生死不取决于代码，取决于内容供给（`PORTFOLIO-NOTES.md` §C2 早就总结过）。现在供给链三层全断：GH Actions schedule 被注释、Vercel cron 只 redeploy 不同步、`build` 不含 `content:sync`。

### 断裂 3｜契约断裂：数据靠内部端点 + 伪造身份，母站侧也不认它

- 仓库内 `/api/public/v1` 命中 **0 次**
- `sync-content.mjs:240-245`：伪造 Chrome UA、伪造 `Referer: krzacg.com`、伪造 `Origin`、可选 `X-Sync-Key` —— 直接违反 `PUBLIC_API.md:126`（"不要伪造 User-Agent"）
- `ECOSYSTEM.md:3` 的 Scope 只有 `KrzACG` + `tg-auto-downloader`，**卫星站不在跨仓契约里**
- 母站 `TODO.md` / `DECISIONS.md` 对 `galgame-guide` **0 提及**（只有 `GLOSSARY.md:94` 的词条和 `web/lib/umami.ts:61` 的归因别名）
- 注册表 `sites.json` 里 `repo` 归属 `kangshuisheng`，实际 remote 是 `Magical-developer`；仓库内没有 `lib/registry` 消费副本、没有 sync 脚本、CI 不校验

**含义**：它从来没被纳入契约治理。母站删一个内部端点，卫星站没有任何保护、也没有任何告警 —— 事实也是这样发生的。

### 断裂 4｜动线断裂：没有入口、没有归因、按钮还看不见

| 环节 | 实测 | 判断 |
|---|---|---|
| 主站 → 卫星站 | 主站首页 0 处、友链 API 8 条无此站 | **零导出** |
| 兄弟站 → 卫星站 | navi / search / kktv 友链页有链接 | 有，但都是低流量站 |
| 卫星站 → 主站 | 线上 0 处 `utm_*`；`/go/{slug}` 302 到 `?from=guide&slug=…` | **可归因，但 campaign 丢失、落点是首页** |
| 深链 | 卫星站手里就有 `sourceId`，却没链到 `/post/{sourceId}`（实测 200） | 用户多一跳 |
| 自身度量 | 全仓 0 处 analytics（privacy 页却写了 Google Analytics） | **无法度量自身价值** |
| 转化按钮 | `bg-[--accent]` 在 Tailwind v4 下生成非法 CSS `background-color:--accent` → **透明底 + 黑字，深色页面上不可见**。首页 9 处、作品页 8 处，**包括唯一的转化按钮「前往主站查看资源」** | **主 CTA 隐形** |

**归因口径修正**：`.audit/live.md` 最初判断"归因完全失效"不准确。母站 `web/lib/umami.ts:113-120` 接受 `from` 参数、归一为 `guide`，`providers.tsx:21-26` 会触发 `GUIDE_REFERRAL_LANDING` 事件。**通道是通的，坏在落点与 campaign，以及卫星站自己没有数据。**

### 断裂 5｜治理断裂：注册表说"暂停"，线上却在全速跑

- `sites.json`：`status: "paused"`、`priority: "p2"`、`indexPolicy: "homepage"`
- 线上实际：**全站 `index, follow`，sitemap 3905 条，3820 条作品页可索引**
- 名字三套：仓库 `Galgame Guide` / 注册表 `次元绅士指南` / 线上 `次元绅士指南…攻略索引`
- 文档漂移：`AGENTS.md` 写"Vercel build command = `content:sync && build`"，实际 `package.json` 的 build **不含** content:sync；`vercel.json` 也**没有** buildCommand
- `.github/copilot-instructions.md` 整篇仍在教 AI 助手重建**已被删除的 AI 攻略链路**
- 0 测试、0 CI（lint/tsc/build 都不守门）—— 本次最严重的 Tailwind bug，恰好 lint 和 tsc 都抓不到

**含义**：没有任何机制在管这个站。它既不在母站规划里，也不在注册表状态里，更没有监控。

---

## 四、评分卡

| 标准 | 判定 | 一句话依据 |
|---|---|---|
| H1 数据契约 | ❌ 未达标 | 0 处 public API；源是已删除的内部端点；伪造 UA/Referer |
| H2 索引策略 | ⚠️ 部分 | HEAD 代码对（档案页 noindex、sitemap 6 条）；**线上全站 index + 3905 条** |
| H3 内容边界 | ⚠️ 部分 | HEAD 已删 AI 链路；`importLocalData` 仍灌 AI markdown 进 guides；**线上 99.7% 模板页** |
| H4 外链合规 | ❌ 未达标 | 线上 popunder + `/go` 中转 + 0 UTM；HEAD 干净 |
| H5 注册表归属 | ⚠️ 部分 | 条目完整、schema 通过；无消费副本、GitHub owner 分裂 |
| H6 故障域隔离 | ✅ 运行时 / ⚠️ 构建期 | 运行时只读 Turso 不碰主站；构建耦合主站 API 且被 403 |
| H7 品牌命名 | ⚠️ 部分 | 三方名字不一致 |
| S1 UTM 归因 | ✅ 有瑕疵 | `from=guide` 通；落点错、campaign 丢 |
| S2 用户动线 | ⚠️ 部分 | 有回流入口；站点停更 → 价值≈0 |
| S3 母站不扩外链 | ✅ | 主站 0 处 |
| S4 状态标注 | ✅ | paused 与最后提交时间一致 |
| S5 文案不堆词 | ❌ 线上 | 3820 页同款 title 后缀 |

**结论：不合格。** 且"不合格"里最严重的一项不是功能缺失，而是**线上形态与母站策略相反**。

---

## 五、它现在到底是什么

抛开"卫星站"这个自我定位，用外部视角描述当前实体：

> 一个 **2026-08-01 构建、停更 93 天、3820 条可索引模板页、挂 popunder 广告、通过 `from=guide` 向成人主站导流** 的 Vercel 站点；同时，本地仓库里躺着一份 2026-08-02 写好的、正确的整改版本，从未上线。

这个描述里，**没有一条是卫星站应有的属性**。它现在更接近：

- 对用户：一个内容陈旧、按钮点不到的索引站
- 对搜索引擎：一个 scaled content / doorway 特征的站点
- 对主站：一个用 `from=guide` 绑定的声誉风险敞口
- 对团队：一个没人负责、没人监控、没人知道的僵尸资产

**它连"逃生通道"这个保底价值都不成立**：域名是 `vercel.app`（非自持，`ownDomain=false`），内容只有主站快照，没有资源，主站真出事时用户来了也拿不到东西。

---

## 六、优化空间：先决策，再工程

### 6.1 三条路线

| | A. 复活成真·工具站 | B. 降级为单页工具（推荐先做） | C. 退役收敛 |
|---|---|---|---|
| 形态 | 作品档案 + 标签发现 + 相似推荐，作品维度聚合 | 一个干净的检索/筛选页，数据快照 | Vercel 下线，或 301 到主站对应分类 |
| 索引 | 首页 + 索引页 index，档案页 noindex | 全站 noindex（或仅首页） | — |
| 前置条件 | 母站补 `posts` 公开端点（或正式登记进 ECOSYSTEM）；持续供给 | 无（现有数据够） | 无 |
| 成本 | 3–5 人日 + 长期维护 | ~1 人日 | 0.5 人日 |
| 收益 | 差异化（主站是帖子维度，没有作品维度） | 保留逃生入口 + 品牌触点，风险清零 | 风险清零，释放维护负担 |
| 风险 | 供给跟不上就再次腐烂 | 价值有限 | 少一个入口 |

**我的建议**：**先止血 → 再做 B → 用真实数据决定要不要 A**。

理由：
- 当前最优先的是**消除对主站的声誉风险**，而不是给卫星站加功能。
- B 用现有数据就能做完（1 人日），能立刻把"3820 条模板页"变成"1 个干净工具"，风险归零。
- A 的唯一真差异化是**作品维度聚合**（同一作品的多版本/汉化/补丁散落在多篇文章里）。有意思的是：当前代码把重复 `source_id` 当脏数据**丢弃**（1,664 组），恰好丢掉了这个唯一的差异化机会。要做 A，应该反过来**利用**这些重复做聚合。
- 如果没有 2 周以上的持续投入意愿，直接选 C —— 一个 p2 的僵尸站，退役比养着更理性。

### 6.2 止血清单（今天，≤ 2 小时）

| # | 动作 | 说明 |
|---|---|---|
| 1 | 修 Tailwind v4 变量语法 | `app/globals.css` 的 `@theme inline` 注册 `--color-ink-strong/--color-ink-soft/--color-accent/--color-accent-strong`，118 处 `[--var]` 改命名 utility。**不修就别部署**，否则 CTA 继续隐形 |
| 2 | 部署 HEAD `0075f3e` | 一次部署清零：删 popunder、删横幅、删 `/go`、作品页 noindex、sitemap 3905→6 |
| 3 | 或直接下线 | Vercel 项目 pause / 删 deployment；注册表 `status` 改 `frozen` |
| 4 | 改文案 | 删掉"每日同步更新""每日更新"（与事实不符） |

> 注意：部署 HEAD 会让 sitemap 从 3905 掉到 6 条。这是**主动收敛**，与 noindex 策略一致；但如果 SEO 侧还指望这些页带量，需要先对齐预期 —— 按母站策略，这些页本来就不该被索引。

### 6.3 工程清单（P0/P1/P2）

**P0（本周）**

| 问题 | 位置 | 修复 |
|---|---|---|
| 同步非幂等，同一作品每天 +1 行 | `sync-content.mjs:331-391` | 加 `UNIQUE(source_id)`；`SELECT` 加 `ORDER BY`；冲突键从 slug 改 source_id；清 5,460 行重复 |
| cron 鉴权可绕过 | `app/api/cron/sync-content/route.ts:13` | 删 UA 兜底，强制 `CRON_SECRET`，为空则 503 |
| 构建缺 env 断言，产物可全 localhost | `lib/config.ts:15` | `NEXT_PUBLIC_SITE_URL` 缺失直接 throw；CI 断言产物无 `localhost:3000` |
| 数据源失效 | `CONTENT_SOURCE_API_URL` | 短期指 `/api/posts/latest`；长期等母站补公开 posts 端点 |

**P1（两周）**

| 问题 | 修复 |
|---|---|
| `/archive` 动态、全表 SCAN、3.2–4.2s、无缓存 | SQL 分页（LIMIT/OFFSET + 索引），第 1 页静态化，筛选改客户端或独立搜索页 |
| `cache()` 被当成跨请求缓存 | 明确用 ISR/`unstable_cache`；修正 AGENTS.md 描述 |
| `safeQuery` 吞异常 | DB 失败时抛给 error boundary，不缓存空首页/假 404 |
| redirect 链 3,392 条、深度 ≥20 | 重建为单跳；删掉 old_slug 仍存活的 1,696 条 |
| 0 埋点 | 接 Umami（主站已有 `umami.krzacg.com`，site id `guide`），埋 outbound click；主站出口改深链 `/post/{sourceId}` + 完整 UTM |
| 残留 AI 资产 | 删 `importLocalData` 灌 guides 的路径、关 IndexNow、删 `.github/copilot-instructions.md`、清 `.env` 的 `AI_*` 并轮换 key |
| 文档漂移 | 修正 AGENTS.md 的 build command/cron 描述；README 与代码对齐 |
| 无测试/CI | 加最小 CI：lint + tsc + build + CSS 断言（`grep ':\s*--[a-z-]'` 必须无命中） |

**P2（一个月）**

- 数据层：只查需要的列（现在全表 3.79MB 文本）、首页/相关推荐下推 SQL、图片 `minimumCacheTTL`
- 结构：JSON-LD 转义 `<`（存储型 XSS 面）；`canonical: "/"` 不再被静态页继承；`?page=abc` 纳入 noindex 判断
- 产品（仅路线 A）：作品维度聚合、标签百科、相似推荐；用重复 `source_id` 做版本聚合而不是丢弃
- 治理：接入 `krz-registry` 消费副本 + sync 脚本；GitHub 归属收口；`status` 与线上事实对齐

### 6.4 母站侧该做的三件事

这三件不是卫星站能自己解决的：

1. **补契约**：`/api/public/v1/posts`（或明确"卫星站不得镜像作品目录"）。现状是规范说"只接公开 API"，但公开 API 没有作品端点 —— 这是卫星站当年走上内部端点的结构性原因。
2. **纳入治理**：把卫星站写进 `ECOSYSTEM.md` 的 Scope，或明确"卫星站不在跨仓契约内"。现在是两不靠：不在契约里，却依赖内部端点。
3. **归属与注册表收口**：`sites.json` 的 `repo` 归属与实际 remote 不一致；仓库内没有注册表消费副本，状态靠人肉维护。

---

## 七、不做什么的后果

如果什么都不做，当前状态会继续：

- 3820 条模板页继续以 `index,follow` 挂在网上，与主站通过 `from=guide` 绑定；
- popunder 广告继续在成人向内容上弹出；
- 数据继续停在 2026-07-28，页面继续写"每日更新"；
- 主站的声誉风险敞口继续存在，而收益恒为 0（无法度量）。

按母站自己的判断（`PORTFOLIO-NOTES.md` §E）：这类站群特征是 Google 站点声誉滥用的典型判据，**连坐的是主站**。主站是现金流引擎，这个风险不对称 —— **期望损失远大于卫星站可能带来的任何收益**。

---

## 附录 A：关键证据命令

```bash
# 线上版本定位
curl -s https://galgame-guide.vercel.app/ | grep -o '<title>[^<]*'
git log --oneline -3
git show 2c32aa1:lib/config.ts | grep -n 'name:'
git show 0075f3e:app/sitemap.ts | head -30

# 可索引面
curl -s https://galgame-guide.vercel.app/sitemap.xml | grep -c '<loc>'        # 3905
curl -s https://galgame-guide.vercel.app/SLG-PC-150M-ec5524-23 | grep -o '<meta name="robots"[^>]*>'
curl -sD - -o /dev/null https://galgame-guide.vercel.app/go/SLG-PC-150M-ec5524-23 | grep -i location

# 数据新鲜度（只读）
node -e '...' # 见 .audit/live.md §1.6

# 数据源已删除
curl -s -w '%{http_code}' https://service.krzacg.com/api/posts/hot-feed      # 400
curl -s -w '%{http_code}' https://service.krzacg.com/api/posts/latest        # 200
git -C /Volumes/Transcend/Projects/KrzACG log -S 'hot-feed' --oneline -- backend/src/posts/

# Tailwind 产物
curl -s https://galgame-guide.vercel.app/_next/static/chunks/0iac8oywj..fj.css | grep -o 'color:--[a-z-]*'
```

## 附录 B：分报告

| 文件 | 内容 |
|---|---|
| [`.audit/live.md`](.audit/live.md) | 线上运行态：版本定位、可索引面、广告、UTM、数据、自动化、性能（251 行） |
| [`.audit/code.md`](.audit/code.md) | 代码与管线：4 个 P0 / 16 个 P1 / 23 个 P2，含文件行号与修复建议（417 行） |
| [`.audit/contract.md`](.audit/contract.md) | 契约合规：7 条硬性 + 5 条软性逐条判定、母站侧集成实测（283 行） |

> 三份分报告与本报告均为本次审计产出，未提交 git（`.audit/` 为未跟踪目录）。仓库源码未做任何修改。

---

## 八、实施记录（2026-10-29 当天完成）

### 8.1 已改代码

| # | 改动 | 文件 | 验证 |
|---|---|---|---|
| 1 | Tailwind v4 变量语法迁移：注册 `--color-ink-strong/ink-soft/accent/accent-strong`，118 处 `[--var]` 改命名 utility；关闭自动内容探测，只扫 `app/` 与 `components/` | `app/globals.css` + 13 个组件/页面 | 产物 CSS 非法声明 **0**；CTA 变回金色底黑字 |
| 2 | 同步幂等化：按 `source_id` 原地 UPDATE，slug 保持稳定；冲突键不再用 slug | `scripts/sync-content.mjs` | 干跑 0 异常；逻辑上不再产生新行 |
| 3 | 数据源切换：`hot-feed`（已删除）→ `posts/latest`；移除不存在的 `category_slugs` 参数；改用真实 UA，不再伪造 Referer/Origin | 同上 + `lib/config.ts` | 干跑拉取 **7,811** 条，API 200 |
| 4 | 拉取/写入改内存索引：一次读 `source_id→行` 与 `slug` 集合，循环内零远程查询 | 同上 | 单页耗时 20s → **0.4s**，全量干跑 3m25s |
| 5 | 新增 `pnpm dedupe:games`（默认 dry-run）并**已执行** | `scripts/dedupe-games.mjs` | `games` **7,616 → 3,820**；重复组 **1,664 → 0**；重定向 **5,519 → 5,507**，链深 **≥20 → 1**，悬挂 0；已建 `UNIQUE INDEX idx_games_source_id` |
| 6 | 修复软 404：根 `loading.tsx` 的 Suspense 边界让 `notFound()` 发出 200；改为 `[slug]` 在 `generateMetadata` 里 404，`loading` 下沉到 `/archive` | `app/[slug]/page.tsx`、`app/loading.tsx`、`app/archive/loading.tsx` | 未知 slug **404**（之前 200 + 404 内容） |
| 7 | cron 鉴权：配置了 `CRON_SECRET` 就只认 Bearer，不再接受可伪造的 `vercel-cron` UA | `app/api/cron/sync-content/route.ts` | 匿名 401 |
| 8 | `siteUrl` 兜底：缺 `NEXT_PUBLIC_SITE_URL` 时用 Vercel 域名，本地才回落 localhost | `lib/config.ts` | 本地构建仍 localhost（预期）；Vercel 上不再可能产出 localhost canonical |
| 9 | 新增全局错误边界 | `app/error.tsx` | 构建通过 |
| 10 | 清理死配置/死脚本/过期文档：删 `audit:pages`/`delete:pages`、`syncPageSize`/`syncMaxPages`/`headline`/`sourceAssetBaseUrl`；重写 `copilot-instructions.md`（原文还在教 AI 重建已删除的攻略链路）；修正 `AGENTS.md` 的 build/cron 描述；重写 `.env.example` | 多文件 | lint/tsc/build 全过 |

### 8.2 数据变更与回滚

- 清理前快照：`.audit/backup-games-2026-10-29T04-22-45-085Z.json`（7,616 行，11MB）、`.audit/backup-slug_redirects-2026-10-29T04-22-45-085Z.json`（5,519 行）。
- 保留行与 `lib/games.ts` 的 canonical 规则一致（ASCII 优先、再比 `updated_at`），因此**线上 sitemap 里的 3,820 个作品 URL 全部仍然有效**。
- 被删的 3,796 个重复 slug 中，3,368 条重定向已改指 canonical（1 跳 301），其余为历史重复页。

### 8.3 同步预演结果（未写库）

`node scripts/sync-content.mjs --dry-run`：拉取 **7,811** 条，其中 **6,723 条新增、1,088 条内容有更新**。

→ 若执行全量同步，`games` 会从 3,820 涨到约 **10,500**。当前读层是「全表 SELECT + JS 过滤」，涨到 1 万行后 `/archive` 会更慢（现在已 3–4s）。**建议先做 SQL 分页再执行同步**（见 6.3 P1 第一条）。

### 8.4 尚未做（需要授权或决策）

1. **部署**：仓库 HEAD 仍未推送，线上仍是 `2c32aa1`。步骤见 `DEPLOY-CHECKLIST.md`。
2. **全量数据同步**：见 8.3，建议先修读层。
3. **母站侧**：`/api/public/v1/posts` 契约缺口、卫星站纳入 `ECOSYSTEM.md`、注册表归属收口 —— 均在母站仓库，本次未动。

### 8.5 自动同步（同日追加，替换掉"只能本地手动"的设计）

**为什么原来是手动的**：2026-08-01 源 API 会 403 GitHub Actions 的 IP，于是定时任务被注释、cron 改成"只 redeploy"。之后端点换过（10-14 删 `hot-feed`）、拦截也没了，但没人回头改 —— 临时妥协变成了永久设计。

**实测复核**：源站对云厂商 IP 不再拦截 —— Jina 云出口、自己的 86 VPS 均返回 200；本地 200。

**新架构（已实现并实测）**：

| 项 | 内容 |
|---|---|
| 入口 | `vercel.json` cron 每天 **03:00 东八区（UTC 19:00）** → `/api/cron/sync-content` |
| 行为 | 拉主站最新 **2 页（约 100 条）** → 过滤分类 → 按 `source_id` 幂等 upsert → `revalidatePath("/")`、`/archive` |
| 共享实现 | `lib/sync/engine.mjs`（CLI 与 cron 共用，避免两份逻辑漂移） |
| 手动命令 | `pnpm content:sync`（增量）/ `--full`（200 页回填）/ `--dry-run` |
| 鉴权 | 配了 `CRON_SECRET` 只认 Bearer；未配才退回 Vercel Cron 的 UA（UA 可伪造，生产必须配） |
| 验证 | 本地实测：匿名 401、伪造 `vercel-cron` UA 401、正确 Bearer 200；真实写入 **56 条 / 2.5s**，`games` 3,820 → 3,876，重复组 0 |
| 线上验证 | `curl -H "Authorization: Bearer $CRON_SECRET" "$BASE/api/cron/sync-content?dry_run=1"` |

**副作用与边界**：
- 每天只抓 2 页，主站日均 20–40 篇，足够覆盖；漏掉的靠次日继续补（幂等）。
- 全量回填（预演 +6,723 新）仍建议先做 SQL 分页再跑，否则 `/archive` 会更慢。
- 备用通道：`.github/workflows/daily-sync.yml` 改为手动 `workflow_dispatch`（incremental/full/dry-run 三选一），不再触发 redeploy。
- 已删除 `VERCEL_TOKEN` / `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID` 依赖：cron 不再调用 Vercel API。
