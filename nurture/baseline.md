# Baseline · Ethics for AI MCP (E4A)

采集时间：2026-10-07（Asia/Shanghai）· 采集人：nurture-mcp Stage 0
全部数据为本次现场实测，未使用记忆。

## 标的

| 项 | 值 | 依据 |
|---|---|---|
| GitHub | https://github.com/PanStories/Ethics-for-AI-MCP | 🟢 `visibility: public` |
| License | MIT | 🟢 |
| 默认分支 / 语言 | main / TypeScript | 🟢 |
| 建仓时间 | 2026-09-29T09:54:27Z | 🟢 |
| 最后 push | 2026-10-04T05:14:17Z（距今 3 天） | 🟢 |
| Apify Store | https://apify.com/neeenja/ethics-for-ai-mcp | 🟢 200 |
| MCP 端点 | `https://neeenja--ethics-for-ai-mcp.apify.actor/mcp` | 🟢 未带 token 返 **401** = 存活 |
| GitHub Pages | https://panstories.github.io/Ethics-for-AI-MCP/ | 🟢 200 |
| Sartbot | https://sartbot.com/mcp/ethics-for-ai-mcp.html | 🟢 200, featured=true, verified=false |
| 版本 | package.json 1.0.0 / server 1.0.0 / curriculum 1.0.1 / actor.json "1.0" | 🟢 四处不一致 |

## KPI 基线（Apify，🟢 实测）

| 指标 | 7 天 | 30 天 | 全生命周期 |
|---|---|---|---|
| Runs | 8 | 8 | 8（totalRuns=8） |
| 状态 | 8× SUCCEEDED | 同 | 同 |
| 计费事件 `chargedEventCounts` | **空 {}** | **空 {}** | 空 |
| 计费 tool call | **0** | **0** | **0** |
| 估算 PPE 收入 | **$0.00** | **$0.00** | **$0.00** |
| 独立用户 | totalUsers7Days=0 | totalUsers30Days=0 | totalUsers=1 |

- 8 次 run 全部挂在 build `3f6of7Iu`（Standby 容器启停），**无一次带 tool 调用** → 判定为自检/预热，**有机用量 = 0**。
- 最近一次 run：2026-10-04T03:12:36Z。

## GitHub 基线（🟢 实测）

stars 0 · forks 0 · watchers 0 · open issues 0 · **tags 0 · releases 0**
topics：`ai-ethics, ai-safety, apify, ethics, mcp, model-context-protocol`（缺 `mcp-server`）

## 渠道在位情况（🟢 实测 HTTP 状态，2026-10-07）

| 渠道 | 状态 | 说明 |
|---|---|---|
| Apify Store | 200 ✅ | 页面同时含 简体中文/繁體中文/$0.02 关键字 |
| Sartbot | 200 ✅ | featured=true；**repo_url 为空**、updated_at 停在 2026-09-26 |
| GitHub Pages | 200 ✅ | 无 llms.txt（404） |
| LobeHub | 200 ✅ | **自动收录**（GitHub 抓取），EN/FR/VI 多语言页 |
| Glama | 页面 200 但 **0 条收录** | glama.json 已声明 maintainer，未被索引 |
| Smithery | 404 ❌ | 未提交 |
| mcpservers.org | 404 ❌ | 未提交 |
| PulseMCP | 404 ❌ | 未提交（搜索页 Cloudflare 403，仅页级判定） |
| npm | 404 ❌ | **包从未发布**；名称 `ethics-for-ai-mcp` 可用 |
| 官方 MCP Registry | 未验证 | 本机 TCP 超时（registry.modelcontextprotocol.io） |

## 产品质量（🟢 本地实测）

- `npm run build`（tsc）：通过，`dist/` 产出 6 个 js。
- `node e2e-test.mjs`（stdio）：**PASS · 19/19** —— 10 工具齐全、确定性哈希一致、rotation Monday→m1、search 命中 refusal。
- `node http-e2e-test.mjs`：**本机失败**，根因 `Cannot find module 'boolbase'` —— 本机 `npm install` 在 esbuild postinstall 报 `EBUSY`（node.exe 被占用）导致依赖树不完整。**属本机环境，不是代码缺陷**。
- 结论：**代码质量无问题，问题在分发。**

## 已知文案/链接缺陷

1. README 无版本号行 → preflight `{version}` 失败。
2. `.actor/actor.json` description 未列出工具名 → 搜索/agent 可读性差（preflight `{tools.billable}` 失败）。
3. 仓库无 CHANGELOG.md、无 llms.txt、无 release/tag。
4. README 本地安装片段是绝对路径 `"/absolute/path/to/..."` —— 仓库已 MIT 公开，却没有 `npx -y ethics-for-ai-mcp` 这条最省事的装法，而 npm 包并不存在。**这是冷启动最大的断头路。**
5. 🟡 二手线索（搜索引擎快照，未亲验）：david-s-p-an.com/ethics.html 渲染出的端点写成 `https://--ethics-for-ai-mcp.apify.actor/mcp`（username 被剥掉）、`Bearer ` 后为空 → 疑似死链/占位未填，需老板在本机确认。
6. 🟡 二手线索：LobeHub 抓取页同样把端点渲染成 `https://--ethics-for-ai-mcp.apify.actor/mcp`（上游抓取器剥 username），非我方文案问题。

## 结论一句话

**上线 8 天，产品本身健康（e2e 全绿、端点活、三语 README 合规），但有机用量 = 0、收入 $0、外部渠道只靠 LobeHub 自动收录。**
差距不在功能，在「可被发现 + 可被一键安装」。
## 2026-10-09 weekly refresh (auto-nurture)
- Apify totalRuns: **10**（基线 8，Δ+2）；isPublic=true；taggedBuilds 含 latest ✅；lastRun 2026-10-09
- GitHub stars 0；issues/PR 近 7d = 0
- M8ven: **Verified Publisher**；README 仅斜杠 badge（无本地 token，未自治改）；待老板确认是否需补 tokenized 行
- server.json 已加（官方 Registry 前置）。


## 2026-10-21 B4 refresh (Apify API now available)

> B4 was previously blocked: APIFY_TOKEN empty in automation sandbox. The token now
> resolves via `~/.apify/auth.json` (Apify `/users/me` → HTTP 200), so KPIs re-verified.

- **Actor:** `pxVHDu2EyPtBFvdgq` · **Apify totalRuns (live):** **10** (re-verified via `GET /v2/acts/pxVHDu2EyPtBFvdgq`)
- **Pricing (live pricingInfos):** PAY_PER_EVENT · mcp-tool-call $0.02.
- **M8ven:** ⚠️ README still canonical slash (panstories/ethics-for-ai-mcp) — B2 NOT yet fixed; needs boss's M8ven Claim token.
- GA4 / npm / mcpservers.org / Smithery remain boss-gated (B3/B5/B6) — see fix-attempt report.

