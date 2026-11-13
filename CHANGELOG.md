# Changelog

All notable changes to **Ethics for AI MCP** are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased] — 2026-11-13 (weekly light nurture)

### Fixed
- **GitHub Pages `llms.txt` 404** — Pages serves `docs/` only, but `llms.txt` lived at the repo root. Added a byte-identical `docs/llms.txt` mirror so AI-native discovery works on the project site.
- **`nurture/manifest.json` drift** — the single source of truth still said `1.0.0` while the shipped version is `1.0.1`. Corrected to `1.0.1`, refreshed stale channel-status facts, and recorded the verified Apify actor id.
- **preflight false positive on `.actor/actor.json`** — the surface rule demanded all 10 tool names plus the full endpoint URL inside a PPE manifest that bills per *event*. Replaced with checks on what actually exists (`0.02`, `mcp-tool-call`, `PAY_PER_EVENT`).

### Verified (no code change)
- Standby endpoint back to **200 / 10 tools** after the Free-Plan billing cycle reset on 2026-10-25. The 2026-10-24 `403 actor-disabled` was a per-cycle cap — **not** a reason to upgrade the plan.
- Official MCP Registry listing confirmed; M8ven Grade B / Verified Publisher; `trust_audit` 0 fail; `nurture_preflight` 7/7 green.
- Pricing unchanged (`mcp-tool-call` $0.02) — Iron Law #4 honored.

## [Unreleased] — 2026-10-24 (monthly deep nurture)

### Fixed
- **README install path** — replaced the non-working `/absolute/path/to/...` stdio install
  placeholder with `<REPO_ROOT>/dist/index.js` and added the required
  `git clone` → `npm install` → `npm run build` prerequisites in all three language
  sections (English / 简体中文 / 繁體中文). The old literal path was a copy-paste dead end
  that blocked first-run setup.

### Added
- **`llms.txt`** — an [llmstxt](https://llmstxt.org) index so LLM-powered discovery tools and
  agents can understand the server, its surface, and pricing at a glance.

## [1.0.1] — 2026-09-29
- Public launch on the Apify Store and GitHub (PanStories/Ethics-for-AI-MCP).
- 10 read-only tools, 9 `ethics://` resources, 1 `daily_reflection` prompt.
- Pay-per-event pricing ($0.02 per `tools/call`); free discovery events
  (`initialize`, `tools/list`, `resources/read`, `prompts/get`).
- Three-language README (English / 简体中文 / 繁體中文).
- M8ven **Verified Publisher** badge (tokenized form) live on the README and `main` branch.
- Official MCP Registry manifest (`io.github.PanStories/ethics-for-ai-mcp`).
