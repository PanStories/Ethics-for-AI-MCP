# Privacy Policy

**Product:** Ethics for AI (MCP server)
**Operator:** PanStories
**Repository:** https://github.com/PanStories/Ethics-for-AI-MCP
**Last updated:** 2026-10-09
**Effective date:** 2026-10-09

This policy explains what data Ethics for AI ("the Service", "we") processes when you
connect to it as a Model Context Protocol (MCP) server — via the hosted endpoint or a
self-hosted build — and what we deliberately do **not** collect.

---

## 1. Summary (TL;DR)

- The Service is a **read-only** MCP server. It publishes a deterministic daily ethics
  feed drawn from a four-module curriculum. It never modifies, deletes, or acts on your
  systems.
- **No accounts, no sign-up, no cookies, no advertising or analytics trackers.**
- We do **not** sell, rent, or share your data with advertisers or data brokers.
- The only inputs are a **topic query / module selector / date range** used to look up
  published content. No personal data is required or requested.
- The content is generated **deterministically** and served from the Service itself —
  there is no outbound call to any third-party data provider.
- The server is **stateless**: each request is independent, with no session and no user
  profile.
- Hosting is provided by **Apify**; platform-level processing is governed by Apify's own
  privacy policy.

---

## 2. Data we process

| Data | Source | Why we process it | Retention |
|---|---|---|---|
| Topic query / module selector | You | To look up a published ethics item | In memory for the duration of the request only |
| Date range / index parameters | You | To select an edition or item | Request duration only |
| IP address + User-Agent | Your request | Transient rate-limiting only | In-memory window; not persisted, not logged to disk |
| Apify API token | Apify gateway | Authenticates the caller at the platform edge | Not seen or stored by the Service |

## 3. What we do NOT collect

- No names, email addresses, phone numbers, or other personal identifiers.
- No accounts, passwords, or credentials.
- No conversation history or tool-call content retained beyond the live request.
- No cookies, analytics, pixels, or advertising trackers.

## 4. Third parties / data recipients

The Service answers entirely from its own bundled content and makes **no outbound
requests to third-party data providers**.

| Recipient | Purpose | Notes |
|---|---|---|
| **Apify** (hosting) | Runs the Standby container, terminates TLS, meters usage | Subject to Apify's privacy policy |

We do not disclose your inputs to any other third party.

## 5. Hosting and infrastructure

The hosted Service runs on Apify's Standby infrastructure. Apify may process operational
metadata (timestamps, IP, billing records) as an independent controller. See
<https://apify.com/privacy-policy>. The Service runs no database and keeps no persistent
store of user data.

## 6. Self-hosted / open-source builds

This repository is open source (MIT). When you self-host, **you** are the data controller
for anything your deployment processes. The code ships with no telemetry that reports
back to us.

## 7. Security

Transport is encrypted (TLS) at the Apify edge. All requests require the Apify gateway
bearer token. See [`SECURITY.md`](./SECURITY.md) for the threat model and vulnerability
reporting.

## 8. Children's privacy

The Service is a developer tool not directed at children, and we do not knowingly process
data from children under 16.

## 9. Your rights

Because we do not maintain user profiles or store personal data, there is generally no
personal data to access, correct, or erase. If you believe we hold data about you, contact
us (Section 11) and we will respond within 30 days.

## 10. Changes to this policy

We may update this policy as the Service evolves. Material changes will be reflected in
the "Last updated" date and, where appropriate, in the repository changelog.

## 11. Contact

Privacy questions or requests:
**Open an issue** at <https://github.com/PanStories/Ethics-for-AI-MCP/issues>.
For security matters, see [`SECURITY.md`](./SECURITY.md).

---

## 简体中文

**产品：** Ethics for AI — 面向 AI 智能体的确定性每日伦理内容 MCP server
**运营方：** PanStories
**最后更新：** 2026-10-09

### 概要

- 本服务是**只读** MCP server，发布来自四模块课程体系的确定性每日伦理内容，
  不会修改、删除或操作用户的任何系统。
- **无账号、无注册、无 Cookie、无广告或分析追踪。**
- 我们**不会**向广告商或数据经纪商出售、出租或共享你的数据。
- 唯一输入为**主题查询/模块选择/日期范围**，用于检索已发布内容，不涉及个人信息。
- 内容**确定性生成**并由本服务自带提供——**不向任何第三方数据提供方发起外呼**。
- 服务**无状态**：每次请求独立处理，无会话、无用户画像。
- 托管由 **Apify** 提供，平台层处理受 Apify 隐私政策约束。

### 我们处理的数据

| 数据 | 来源 | 用途 | 保留 |
|---|---|---|---|
| 主题查询 / 模块选择 | 调用方 | 检索已发布伦理条目 | 仅请求期间驻留内存 |
| 日期范围 / index 参数 | 调用方 | 选择期号或条目 | 仅请求期间 |
| IP + User-Agent | 请求 | 仅用于限流 | 内存窗口，不落盘 |
| Apify API token | Apify 网关 | 在平台边缘鉴权 | 本服务不接触、不存储 |

### 我们不收集

姓名、邮箱、电话等个人标识；账号/密码/凭据；超出实时请求的对话或工具调用内容；
Cookie 或任何第三方分析/广告追踪。

### 第三方

仅 **Apify**（托管）在平台层处理运营元数据。内容完全由本服务自带，无第三方数据外呼。

### 自托管

本仓库为开源（MIT）。自托管时**你**即数据处理的控制者；代码不含任何回传遥测。

### 联系方式

在 <https://github.com/PanStories/Ethics-for-AI-MCP/issues> 提交 issue。
安全事项见 [`SECURITY.md`](./SECURITY.md)。
