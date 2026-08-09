#!/usr/bin/env python3
# Full-page screenshot that keeps a REAL viewport height.
# ⚠️ Chrome's --screenshot flag captures only the window, so a tall --window-size is the usual
# workaround — but it inflates every 100svh hero to the window height and you end up with a
# screenshot of nothing but the hero. CDP's captureBeyondViewport keeps the viewport at 880
# (so svh stays honest) while capturing the whole scroll height.
import asyncio, base64, json, subprocess, sys, time, urllib.request
import websockets

URL, OUT, W, H = sys.argv[1], sys.argv[2], 1400, 880
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9222

proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                         f"--remote-debugging-port={PORT}", f"--window-size={W},{H}",
                         "--user-data-dir=/tmp/cdp-shot-profile", "about:blank"],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def targets():
    for _ in range(40):
        try:
            return json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
        except Exception:
            time.sleep(.25)
    raise SystemExit("chrome never came up")

async def main():
    ws_url = next(t["webSocketDebuggerUrl"] for t in targets() if t["type"] == "page")
    async with websockets.connect(ws_url, max_size=200_000_000) as ws:
        n = 0
        async def cmd(method, params=None):
            nonlocal n
            n += 1
            await ws.send(json.dumps({"id": n, "method": method, "params": params or {}}))
            while True:
                m = json.loads(await ws.recv())
                if m.get("id") == n:
                    return m.get("result", {})

        await cmd("Page.enable")
        await cmd("Emulation.setDeviceMetricsOverride",
                  {"width": W, "height": H, "deviceScaleFactor": 1, "mobile": False})
        await cmd("Page.navigate", {"url": URL})
        await asyncio.sleep(6)
        # scroll the whole page once so IntersectionObserver reveals fire, then go back to top
        await cmd("Runtime.evaluate", {"expression":
            "(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);"
            "await new Promise(r=>setTimeout(r,40))}scrollTo(0,0)})()", "awaitPromise": True})
        await asyncio.sleep(1.5)
        h = (await cmd("Runtime.evaluate", {"expression": "document.body.scrollHeight"}))["result"]["value"]
        r = await cmd("Page.captureScreenshot",
                      {"format": "png", "captureBeyondViewport": True,
                       "clip": {"x": 0, "y": 0, "width": W, "height": h, "scale": 1}})
        open(OUT, "wb").write(base64.b64decode(r["data"]))
        print(f"{OUT}  {W}x{h}")

asyncio.run(main())
proc.terminate()
