import json, urllib.request, datetime, os, sys

HOME = os.path.expanduser("~")
AUTH = os.path.join(HOME, ".apify", "auth.json")
with open(AUTH) as f:
    tok = json.load(f).get("token")
if not tok:
    print("NO TOKEN"); sys.exit(1)

ACTOR = os.environ.get("ACTOR", "neeenja~ethics-for-ai-mcp")
BASE = f"https://api.apify.com/v2/acts/{ACTOR}"
PRICE = {"mcp-tool-call": 0.02, "mcp-initialize": 0.0, "mcp-list-tools": 0.0}


def get(path, params=""):
    url = f"{BASE}{path}?token={tok}{('&'+params) if params else ''}"
    req = urllib.request.Request(url, headers={"User-Agent": "nurture-probe"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


print("=== ACTOR META ===")
try:
    data = get("").get("data", {})
    print("title:", data.get("title"))
    print("version:", data.get("versionNumber"))
    print("isPublic:", data.get("isPublic"), "| isDeprecated:", data.get("isDeprecated"))
    print("pricingInfos:", json.dumps(data.get("pricingInfos"), ensure_ascii=False)[:800])
    print("stats:", json.dumps(data.get("stats"), ensure_ascii=False)[:400])
except Exception as e:
    print("meta ERR", e)

for days in (7, 30):
    since = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"\n=== RUNS (last {days}d) ===")
    try:
        items = get("/runs", f"limit=200&desc=true&minStartedAt={since}").get("data", {}).get("items", [])
    except Exception as e:
        print("runs ERR", e); continue
    print("total runs:", len(items))
    statuses, events = {}, {}
    for it in items:
        s = it.get("status")
        statuses[s] = statuses.get(s, 0) + 1
        for k, v in (it.get("chargedEventCounts") or {}).items():
            events[k] = events.get(k, 0) + v
    print("statuses:", statuses)
    print("charged events:", events)
    rev = sum(PRICE.get(k, 0) * v for k, v in events.items())
    billable = sum(v for k, v in events.items() if PRICE.get(k, 0) > 0)
    print(f"billable tool calls: {billable} | est revenue: ${rev:.2f}")
    for it in items[:15]:
        ce = it.get("chargedEventCounts") or {}
        print("  ", it.get("startedAt"), it.get("status"), it.get("buildId", "")[:8],
              "events=", ce, "|", (it.get("statusMessage") or "")[:60])
