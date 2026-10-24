# Changelog

All notable changes to **Ethics for AI MCP** are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

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
