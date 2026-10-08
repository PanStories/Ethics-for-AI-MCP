# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security reports.

- Email: **security@panstories.com** (or open a private security advisory via GitHub → *Security → Report a vulnerability*)
- Include: affected version/commit SHA, reproduction steps, and expected vs. actual behaviour.
- You will receive an acknowledgement within 72 hours. We aim to publish a fix or a mitigation within 30 days for confirmed issues.

## Scope & architecture (what is — and is not — exposed)

This server is deliberately minimal on the attack surface:

- **All 10 tools are read-only** pure functions of a static, versioned curriculum bundled with the server. No writes, no deletions, no state.
- **No external network calls at tool runtime** — output depends only on the curriculum data and the requested date.
- **No secrets required** — the server reads no API keys, tokens, or credentials.
- **No database, no user data** — nothing is stored or logged beyond the host platform's own request logs.
- Errors are returned as structured MCP results (`isError: true` + message); **stack traces and secrets are never returned to the client**.

The server is distributed as an Apify Actor (Standby mode) exposing a Streamable-HTTP MCP endpoint, and as a local stdio server. Both entry points share the same read-only tool surface above.

## Dependency policy

- Dependencies are kept on patched versions; `npm audit --omit=dev` is part of release checks.
- Known accepted residual advisories in the `apify` SDK platform chain (proxy-agent / crawlee tree) are documented as **outside the tool service path** — the tools never invoke them. They are tracked and upgraded when the platform SDK ships fixes.
