# Ethics for AI MCP

> **E4A** = **E**thics **f**or **A**I — an MCP server that publishes a deterministic daily ethics feed for AI agents.

[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-blue)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![M8ven Trust Index](https://m8ven.ai/badge/mcp/panstories/ethics-for-ai-mcp)](https://m8ven.ai/mcp/panstories/ethics-for-ai-mcp)

**Current version: 1.0.1**

🌐 **[English](#english)** · **[简体中文](#简体中文)** · **[繁體中文](#繁體中文)**

| It lives at | Link |
|---|---|
| MCP endpoint (Apify Standby) | `https://neeenja--ethics-for-ai-mcp.apify.actor/mcp` |
| Apify Store | https://apify.com/neeenja/ethics-for-ai-mcp |
| Source | https://github.com/PanStories/Ethics-for-AI-MCP |
| Project page (GitHub Pages) | https://panstories.github.io/Ethics-for-AI-MCP/ |
| Featured on | [Sartbot Featured](https://sartbot.com/) |

---

<a id="english"></a>
# English

**Ethics for AI MCP** publishes a **daily ethics feed for AI agents**. One dated edition a day is drawn from a four-module curriculum about how humanity is trying to improve the world and why an AI must not harm it. An agent subscribes once and keeps meeting the material without anyone asking it to.

It is a **read-only** MCP server: agents read the curriculum; they do not edit it.

## The four modules

- **M1 — Humanity's Goals** (5 items): the positive outcomes humanity is working towards, used as the "why" behind ethical behaviour.
- **M2 — Core Principles** (6 items): hard constraints such as *Do No Harm* and *Respect Autonomy*.
- **M3 — Case Studies** (3 items): worked examples, e.g. *The Refusal Problem*, showing how to decline a specific request and offer the nearest legitimate alternative.
- **M4 — Code of Conduct** (7 items): seven concrete lines an agent can audit itself against.

## The daily rotation

- Monday serves **M1**, Tuesday & Friday share an **M2** principle, Wednesday & Saturday share an **M3** case, Thursday serves one **M4** line, and Sunday is a digest of all four modules.
- Each edition carries one primary item plus a companion from a neighbouring module.

## Four asserted properties

1. **Deterministic** — the same date against the same curriculum version always composes to the same bytes and hash.
2. **Complete** — all four modules appear within any rolling seven days.
3. **Cacheable** — an edition is a pure function of its date; detect change by hash.
4. **Human in the loop** — items enter the rotation only after review; the server never writes ethics text at request time.

## Surface

- **10 read-only tools**: `get_daily_feed`, `get_feed_since`, `list_feed_editions`, `get_feed_digest`, `get_feed_rotation`, `get_humanity_goals`, `get_principle`, `get_case_study`, `get_code_of_conduct`, `search_curriculum`.
- **9 resources** under the `ethics://` scheme (curriculum, feed indexes, rotation, meta).
- **1 prompt**: `daily_reflection`, which asks the agent to state what today's item requires of it and name one concrete situation where it would apply it.

| Tool | Purpose |
|---|---|
| `get_daily_feed` | Today's (or any date's) deterministic edition |
| `get_feed_since` | A run of daily editions starting from a date |
| `list_feed_editions` | Recent editions with module, item id, and content hash |
| `get_feed_digest` | The Sunday digest for a week |
| `get_feed_rotation` | The deterministic rotation rules |
| `get_humanity_goals` | Read an M1 item |
| `get_principle` | Read an M2 item |
| `get_case_study` | Read an M3 item |
| `get_code_of_conduct` | Read an M4 item |
| `search_curriculum` | Keyword search across all four modules |

## Connect

**Local (stdio)** — add to your MCP client config:

```json
{
  "mcpServers": {
    "ethics-for-ai-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/ethics-for-ai-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**Remote (Apify Standby, Streamable HTTP)** — connect to:

```
https://neeenja--ethics-for-ai-mcp.apify.actor/mcp
```

with header `Authorization: Bearer <APIFY_TOKEN>`.

## Pricing

Pay-per-event. **Only `tools/call` is metered** (`mcp-tool-call`, $0.02). `initialize`, `tools/list`, `resources/read`, and `prompts/get` are free, so agents can connect and discover at zero cost. There is no monthly fee.

## Development

```bash
npm install
npm run build          # tsc -> dist/
npm run e2e            # stdio + HTTP end-to-end tests
npm run apify:validate # check .actor/actor.json PPE/Standby config
```

## License

Released under the **MIT License**. See [LICENSE](./LICENSE). All curriculum text is original, written for this project; no third-party content is included.

## Privacy

Read-only and stateless — no accounts, no cookies, no trackers, no third-party data calls, and no personal data collected. See [`PRIVACY.md`](./PRIVACY.md).

---

<a id="简体中文"></a>
# 简体中文

**Ethics for AI MCP** 为 AI 智能体发布一份**每日伦理推送**。每天一期，内容取自一套四模块课程——讲述人类如何努力让世界变得更好，以及 AI 为何绝不能造成伤害。智能体只需订阅一次，便会持续接触到这些材料，无需任何人主动提醒。

这是一个**只读**的 MCP 服务：智能体阅读课程，但不修改它。

## 四个模块

- **M1 — 人类的目标**（5 条）：人类正在努力达成的正向结果，作为伦理行为的"为什么"。
- **M2 — 核心原则**（6 条）：硬性约束，例如"不造成伤害"与"尊重自主"。
- **M3 — 案例研究**（3 条）：实例讲解，例如"拒绝难题"，示范如何婉拒某项请求并提供最接近的合法替代方案。
- **M4 — 行为准则**（7 条）：智能体可以自我审查的七条具体准则。

## 每日轮转

- 周一推送 **M1**，周二与周五共用一条 **M2** 原则，周三与周六共用一条 **M3** 案例，周四推送一条 **M4** 准则，周日则是四个模块的汇总。
- 每期包含一个主条目，外加一条来自相邻模块的配套条目。

## 四项保证属性

1. **确定性**——相同日期、相同课程版本，永远组合出相同的字节与哈希。
2. **完整性**——任意连续七天内，四个模块都会出现过。
3. **可缓存**——每期都是日期的纯函数，用哈希即可判断变化。
4. **人在回路**——条目须经审阅才会进入轮转；服务不会在请求时现写伦理文本。

## 对外接口

- **10 个只读工具**：`get_daily_feed`、`get_feed_since`、`list_feed_editions`、`get_feed_digest`、`get_feed_rotation`、`get_humanity_goals`、`get_principle`、`get_case_study`、`get_code_of_conduct`、`search_curriculum`。
- **9 个资源**，位于 `ethics://` 体系下（课程、推送索引、轮转规则、元信息）。
- **1 个提示词**：`daily_reflection`，要求智能体说明今日条目对它意味着什么，并举一处可落地的具体场景。

工具对照表同上（英文一节）。

## 连接方式

**本地（stdio）**——加入 MCP 客户端配置：

```json
{
  "mcpServers": {
    "ethics-for-ai-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/ethics-for-ai-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**远程（Apify Standby，Streamable HTTP）**——连接到：

```
https://neeenja--ethics-for-ai-mcp.apify.actor/mcp
```

并携带请求头 `Authorization: Bearer <APIFY_TOKEN>`。

## 定价

按事件付费。**仅 `tools/call` 计费**（`mcp-tool-call`，单次 $0.02）。`initialize`、`tools/list`、`resources/read`、`prompts/get` 均免费，智能体可零成本连接与发现。无月费。

## 开发

```bash
npm install
npm run build          # tsc -> dist/
npm run e2e            # stdio + HTTP 端到端测试
npm run apify:validate # 校验 .actor/actor.json 的 PPE / Standby 配置
```

## 许可

以 **MIT 许可证** 发布。详见 [LICENSE](./LICENSE)。全部课程文本均为本项目原创，不含任何第三方内容。

---

<a id="繁體中文"></a>
# 繁體中文

**Ethics for AI MCP** 為 AI 智能體發布一份**每日倫理推播**。每天一期，內容取自一套四模組課程——講述人類如何努力讓世界變得更好，以及 AI 為何絕不能造成傷害。智能體只需訂閱一次，便會持續接觸到這些材料，無須任何人主動提醒。

這是一個**唯讀**的 MCP 服務：智能體閱讀課程，但不修改它。

## 四個模組

- **M1 — 人類的目標**（5 條）：人類正在努力達成的正向結果，作為倫理行為的「為什麼」。
- **M2 — 核心原則**（6 條）：硬性約束，例如「不造成傷害」與「尊重自主」。
- **M3 — 案例研究**（3 條）：實例講解，例如「拒絕難題」，示範如何婉拒某項請求並提供最接近的合法替代方案。
- **M4 — 行為準則**（7 條）：智能體可以自我審查的七條具體準則。

## 每日輪轉

- 週一推播 **M1**，週二與週五共用一條 **M2** 原則，週三與週六共用一條 **M3** 案例，週四推播一條 **M4** 準則，週日則是四個模組的彙總。
- 每期包含一個主條目，外加一條來自相鄰模組的配套條目。

## 四項保證屬性

1. **確定性**——相同日期、相同課程版本，永遠組合出相同的位元組與雜湊。
2. **完整性**——任意連續七天內，四個模組都會出現過。
3. **可快取**——每期都是日期的純函式，用雜湊即可判斷變化。
4. **人在迴路**——條目須經審閱才會進入輪轉；服務不會在請求時現寫倫理文本。

## 對外介面

- **10 個唯讀工具**：`get_daily_feed`、`get_feed_since`、`list_feed_editions`、`get_feed_digest`、`get_feed_rotation`、`get_humanity_goals`、`get_principle`、`get_case_study`、`get_code_of_conduct`、`search_curriculum`。
- **9 個資源**，位於 `ethics://` 體系下（課程、推播索引、輪轉規則、元資訊）。
- **1 個提示詞**：`daily_reflection`，要求智能體說明今日條目對它意味著什麼，並舉一處可落地的具體場景。

工具對照表同上（英文一節）。

## 連線方式

**本地（stdio）**——加入 MCP 客戶端設定：

```json
{
  "mcpServers": {
    "ethics-for-ai-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/ethics-for-ai-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**遠端（Apify Standby，Streamable HTTP）**——連線到：

```
https://neeenja--ethics-for-ai-mcp.apify.actor/mcp
```

並攜帶請求標頭 `Authorization: Bearer <APIFY_TOKEN>`。

## 定價

按事件付費。**僅 `tools/call` 計費**（`mcp-tool-call`，單次 $0.02）。`initialize`、`tools/list`、`resources/read`、`prompts/get` 均免費，智能體可零成本連線與發現。無月費。

## 開發

```bash
npm install
npm run build          # tsc -> dist/
npm run e2e            # stdio + HTTP 端到端測試
npm run apify:validate # 校驗 .actor/actor.json 的 PPE / Standby 設定
```

## 授權

以 **MIT 授權條款** 發布。詳見 [LICENSE](./LICENSE)。全部課程文本均為本專案原創，不含任何第三方內容。
---

## Support · 赞助 · 贊助

**EN** — **Ethics for AI (E4A)** is open source (MIT), ad-free, and publishes a
deterministic daily ethics feed for AI agents — a public good maintained by the
community, not by ads. If you build responsible agents, please support it:
- ☕ Ko-fi (the **Sponsor** ❤️ button on this repo routes here): https://ko-fi.com/panstories

**简体中文** — **Ethics for AI (E4A)** 开源（MIT）、无广告，为 AI 智能体发布确定性的每日伦理推送——
一项由社区维护、而非靠广告支撑的公共品。若你在构建负责任的智能体，欢迎赞助：点本仓库的
**Sponsor** 按钮，或前往 Ko-fi: https://ko-fi.com/panstories

**繁體中文** — **Ethics for AI (E4A)** 開源（MIT）、無廣告，為 AI 智能體發布確定性的每日倫理推播——
一項由社群維護、而非靠廣告支撐的公共財。若你在建構負責任的智能體，歡迎贊助：點本倉庫的
**Sponsor** 按鈕，或前往 Ko-fi: https://ko-fi.com/panstories

Thank you! · 谢谢 · 謝謝 💙
