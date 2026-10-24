#!/usr/bin/env python3
"""Probe a streamable-HTTP MCP server: initialize -> tools/list -> resource/prompt list.

Usage: python probe_mcp.py <base_url> [session_note]
Prints a compact JSON summary. Handles SSE (text/event-stream) responses.
"""
import json
import os
import sys
import urllib.request
import urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://neeenja--ethics-for-ai-mcp.apify.actor/mcp"
NOTE = sys.argv[2] if len(sys.argv) > 2 else ""


def rpc(url, method, params=None, sid=None, notif=False):
    body = {"jsonrpc": "2.0", "method": method}
    if not notif:
        body["id"] = 1
    if params is not None:
        body["params"] = params
    data = json.dumps(body).encode()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    tok = os.environ.get("APIFY_TOKEN")
    if tok:
        headers["Authorization"] = f"Bearer {tok}"
    if sid:
        headers["Mcp-Session-Id"] = sid
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        resp = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.read().decode()[:500]}"}
    except Exception as e:
        return {"error": str(e)[:500]}
    sid = resp.headers.get("Mcp-Session-Id", sid)
    raw = resp.read().decode()
    # parse SSE or plain json
    result = None
    if "text/event-stream" in resp.headers.get("Content-Type", ""):
        for line in raw.splitlines():
            if line.startswith("data:"):
                payload = line[5:].strip()
                try:
                    result = json.loads(payload)
                except Exception:
                    pass
    else:
        try:
            result = json.loads(raw)
        except Exception:
            result = {"raw": raw[:500]}
    return {"sid": sid, "result": result}


def main():
    # initialize
    r = rpc(BASE, "initialize", {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {"name": "nurture-probe", "version": "1.0"},
    })
    sid = r.get("sid")
    out = {"base": BASE, "note": NOTE, "init_sid": sid}
    if "error" in r:
        out["init_error"] = r["error"]
        print(json.dumps(out, indent=2, ensure_ascii=False))
        return
    # send initialized notification
    rpc(BASE, "notifications/initialized", None, sid, notif=True)
    # tools/list
    t = rpc(BASE, "tools/list", {}, sid)
    res = (t.get("result") or {}).get("result") if isinstance(t.get("result"), dict) else None
    tools = []
    if isinstance(res, dict):
        for tool in res.get("tools", []):
            tools.append({
                "name": tool.get("name"),
                "desc": (tool.get("description") or "")[:120],
                "annotations": tool.get("annotations"),
            })
    out["tool_count"] = len(tools)
    out["tools"] = tools
    # resources/list
    rl = rpc(BASE, "resources/list", {}, sid)
    rres = (rl.get("result") or {}).get("result") if isinstance(rl.get("result"), dict) else None
    out["resource_count"] = len(rres.get("resources", [])) if isinstance(rres, dict) else 0
    out["resources"] = [x.get("uri") for x in (rres.get("resources", []) if isinstance(rres, dict) else [])]
    # prompts/list
    pl = rpc(BASE, "prompts/list", {}, sid)
    pres = (pl.get("result") or {}).get("result") if isinstance(pl.get("result"), dict) else None
    out["prompt_count"] = len(pres.get("prompts", [])) if isinstance(pres, dict) else 0
    out["prompts"] = [x.get("name") for x in (pres.get("prompts", []) if isinstance(pres, dict) else [])]
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
