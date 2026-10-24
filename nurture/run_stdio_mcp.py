#!/usr/bin/env python3
"""Run a stdio MCP server via npx and probe initialize + tools/list.

Usage: python run_stdio_mcp.py <npx_pkg> [args...]
Sends initialize, then notifications/initialized, then tools/list, and prints
compact JSON. Uses a short timeout so it doesn't hang forever.
"""
import json
import subprocess
import sys
import threading

PKG = sys.argv[1] if len(sys.argv) > 1 else "@creedspace/mcp-server"
ARGS = sys.argv[2:]

INIT = {"jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                   "clientInfo": {"name": "nurture-probe", "version": "1.0"}}}
NOTIF = {"jsonrpc": "2.0", "method": "notifications/initialized"}
TL = {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}


def run():
    try:
        if sys.platform.startswith("win"):
            proc = subprocess.Popen(
                f"npx -y {PKG} {' '.join(ARGS)}",
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                text=True, bufsize=1, shell=True,
            )
        else:
            proc = subprocess.Popen(
                ["npx", "-y", PKG, *ARGS],
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                text=True, bufsize=1,
            )
    except Exception as e:
        return {"error": f"spawn failed: {e}"}

    out = {"pkg": PKG}

    def send(obj):
        try:
            proc.stdin.write(json.dumps(obj) + "\n")
            proc.stdin.flush()
        except Exception as e:
            out["send_error"] = str(e)

    # give npx time to download + start
    import time
    time.sleep(18)
    send(INIT)
    time.sleep(3)
    send(NOTIF)
    time.sleep(2)
    send(TL)

    # read with timeout
    lines = []
    def reader():
        for line in proc.stdout:
            lines.append(line)
            if len(lines) >= 6:
                break
    t = threading.Thread(target=reader, daemon=True)
    t.start()
    t.join(timeout=15)
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()

    parsed = []
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        try:
            parsed.append(json.loads(ln))
        except Exception:
            parsed.append({"raw": ln[:200]})
    tools = []
    for m in parsed:
        if isinstance(m, dict) and m.get("id") == 2 and "result" in m:
            for tdef in m["result"].get("tools", []):
                tools.append({"name": tdef.get("name"),
                              "desc": (tdef.get("description") or "")[:100]})
    out["message_count"] = len(parsed)
    out["tool_count"] = len(tools)
    out["tools"] = tools
    out["sample_messages"] = parsed[:3]
    return out


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, ensure_ascii=False))
