# Phase 0 spike (throwaway)

Goal (spec §11): prove that a phone can reliably serve the game before anything else is built.
Exit criteria: zero dropped sessions over 30 minutes, median join time well under 15 seconds,
automatic reconnect working, and decisions recorded for §3.3 and §3.4. Write results in
[RESULTS.md](RESULTS.md).

| Folder | What |
|---|---|
| `web/` | Preact client: player (default), TV (`?mode=tv`), diagnostics (`?mode=diag`). See `web/COMPONENTS.md`. |
| `host-app/` | Expo dev build. `modules/spike-server` is the native Kotlin server: NanoHTTPD on port 8080 (page, `/config.json`, `/stats.json`, `/log.jsonl`) and Java-WebSocket on port 8081, inside a foreground service with wake and Wi-Fi locks. |
| `tools/` | `loadtest.mjs` (simulated players) and `https-check.mjs` (self-signed HTTPS warning check). |

## Build and install (Windows laptop, S21 over USB)

Needs Node 20+, JDK 17, the Android SDK (`ANDROID_HOME` set), and USB debugging on the S21.

```bash
cd spike/web
```

```bash
npm install
```

```bash
npm run build
```

```bash
cd ../host-app
```

```bash
npm install
```

```bash
npx expo run:android --device
```

The web bundle is compiled into the APK, so rerun `npm run build` in `spike/web` before every
`expo run:android` when the client changes. If `npx expo install` or `prebuild` complains it
can't reach Expo's servers, set `EXPO_OFFLINE=1`.

## Phone setup before testing

- S21: Settings → Apps → Triviocity Spike → Battery → **Unrestricted**. One UI kills background
  work otherwise; the spike measures the server, not the battery walkthrough (that is Phase 2).
- Allow notifications when asked (the foreground-service notification).

## Test script

Run each block on all three networks: **home Wi-Fi**, **regular phone hotspot** (S21 hotspot
on, players join it), and **LocalOnlyHotspot** (tap "Start LocalOnlyHotspot" in the app;
players scan the Wi-Fi QR code, then the game QR code). Record everything in RESULTS.md.

1. **Diagnostics, once per browser.** Open `http://<ip>:8080/?mode=diag` on the Samsung TV and
   each phone browser. Photograph or copy the table into RESULTS.md (Chromium version sets the
   Vite legacy target; the feature rows feed the §3.4 HTTPS-only feature list).
2. **Join time.** For each phone: start a stopwatch when the camera app opens, stop it when the
   Tap button appears. The page also measures page load → seat itself ("Join time" on the
   player screen, `joinMs` in `/stats.json`).
3. **TV.** Type `http://<ip>:8080/?mode=tv` into the TV browser. Counter and scores should update.
4. **Reconnect.** On a phone: (a) refresh the page, (b) close the tab and reopen it from
   history, (c) turn Wi-Fi off for 5 s then on, (d) airplane mode on/off. Each time the player
   should return to the same seat with the same tap count. "Last reconnect" on the player
   screen and `reconnectMs` in `/stats.json` give the times.
5. **Soak, 30+ minutes.** 10 phones and the TV joined, plus simulated players from the laptop
   (on the same network):

   ```bash
   cd spike/tools && npm install && node loadtest.mjs <phone-ip> 30 35
   ```

   Turn the S21 screen **off** and leave it on battery. Don't touch the phones. At the end,
   check the host app and `http://<ip>:8080/stats.json`: `unexpectedCloses` must be 0 and
   `tickLateMs.max` small (it shows whether the server's clock kept time with the screen off).
   Save `http://<ip>:8080/log.jsonl` next to RESULTS.md.
6. **HTTPS warnings.** On the laptop (Git Bash, which has `openssl`):

   ```bash
   cd spike/tools && node https-check.mjs
   ```

   Open the printed `https://<laptop-ip>:8443/?mode=diag` on Android Chrome, iOS Safari, Samsung
   Internet and the Samsung TV. Screenshot each warning and note how many taps it takes to get
   past it (or whether you can at all).

## What counts as a drop

The server logs every socket close. Codes 1000/1001 are clean (tab closed, refresh, navigated
away) and 4000 means another tab took over the seat. Anything else is counted in
`unexpectedCloses` and must be explained by a test step (Wi-Fi off, airplane mode) or it is a
failed run. During the soak there are no test steps, so the count must stay at 0.
