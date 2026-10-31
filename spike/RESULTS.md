# Phase 0 results

Fill in during testing (see README.md for the script). Attach `log.jsonl` and `stats.json` from
each soak run next to this file.

## Devices

| Role | Device | OS / browser version |
|---|---|---|
| Host | Samsung Galaxy S21 | |
| TV | Samsung TV (2025) | |
| Players | | |

## Browser diagnostics (`?mode=diag`)

| Browser | Chromium version | Wake Lock over HTTP | Other notes |
|---|---|---|---|
| Samsung TV 2025 | | | |
| Android Chrome | | | |
| Samsung Internet | | | |
| iOS Safari | | | |

## Results per network

| Measurement | Home Wi-Fi | Phone hotspot | LocalOnlyHotspot |
|---|---|---|---|
| Join time, stopwatch (median) | | | |
| Join time, page (`joinMs` median) | | | |
| Round trip (`rttMs` median / p95) | | | |
| Reconnect: refresh | | | |
| Reconnect: tab reopened | | | |
| Reconnect: Wi-Fi off 5 s | | | |
| Reconnect: airplane mode blip | | | |
| Soak duration, players (real + simulated) | | | |
| Screen stayed on without touching (method) | | | |
| Reconnect after power button + unlock | | | |
| Soak `unexpectedCloses` (network drops) | | | |
| Soak `sleepCloses` (screen-sleep drops) | | | |
| Soak `tickLateMs` max | | | |
| TV worked | | | |

## HTTPS warnings (self-signed)

| Browser | What the warning looks like | Taps to get past it |
|---|---|---|
| Android Chrome | | |
| iOS Safari | | |
| Samsung Internet | | |
| Samsung TV | | |

## Keeping player screens on (plain HTTP, so no Wake Lock API)

Pick the video with `?awake=disc` (default, visible 4rem spinning disc) or `?awake=tiny`.

| Phone / browser | Variant | Screen stayed on by itself? |
|---|---|---|
| Galaxy S25 / Chrome | `tiny` (2 px, near-invisible, muted) | **No**: turned off at the normal timeout |
| Galaxy S25 / Chrome | `disc` (visible 4rem spinning disc, muted) | **No**: turned off at the normal timeout |

Conclusion so far: on Chrome for Android, a muted video, visible or not, does not keep the
screen on. Over plain HTTP the game cannot keep a Chrome player's screen awake. Not yet tested:
iOS Safari, Samsung Internet.

## Baseline (desktop JVM, before device testing)

The server core was run on a desktop JVM in the development container against 40 simulated
players for 2 minutes: 0 drops, round trip median 1 ms (p95 2 ms), tick lateness max 1.1 ms,
and a browser refresh resumed the seat in under 100 ms. This only proves the code works; the
device runs above are what count.

## Decisions (update DESIGN_SPEC.md in the same change)

- §3.3 hotspot fallback:
- §3.4 HTTP vs HTTPS, and the list of HTTPS-only features we need:
- §12.3 server implementation (native confirmed, or embedded Node.js needed):
- Vite legacy target (§2.2):
