# Spike web client: component and token sketch

One Preact bundle, three modes chosen by the URL: player (default), `?mode=tv`, `?mode=diag`.
TV is the player tree with input components not rendered (spec §2.2, §7.3).

## Data flow

```
WebSocket ──> state/transport.ts ──> state/store.ts (Preact Signals) ──> views ──> components
                     ^                                                     │
                     └──────────── state/actions.ts <──────────────────────┘
```

- `transport.ts` is the only module that touches the socket: connect, hello, reconnect with
  backoff, silence detection, ping, and the join/reconnect timing metrics.
- `store.ts` holds every piece of state as signals. Views read signals; nothing else is global.
- `actions.ts` is what views call (`join`, `tap`). Views never import the transport.

## Components (presentational, props only, `components/`)

| Component | Props | Used by |
|---|---|---|
| `Screen` | `title`, `status`, `children` | every view |
| `Card` | `title?`, `children` | every view |
| `Button` | `variant`, `size`, `type`, `disabled`, `onClick` | Join, Player |
| `TextField` | `label`, `value`, `maxLength`, `onInput` | Join |
| `EmojiPicker` | `options`, `value`, `onChange` | Join |
| `Stat` | `label`, `value`, `size` | Player, TV |
| `StatusBadge` | `status` | Screen |
| `ScoreList` | `players`, `highlightId?` | Player, TV |
| `KeyValueList` | `rows` | Player (metrics), Diag (features) |

## Views (containers, read the store, `views/`)

- `App`: picks the view from mode and connection state.
- `JoinView`: nickname (required) and a randomly preselected emoji (spec §7.1).
- `PlayerView`: live counter, the tap button, own taps, scores, latency metrics.
- `TvView`: the same counter and scores at TV scale, the join URL, no input.
- `DiagView`: user agent and feature detection, to record TV engine versions and the
  HTTPS-only feature list (spec §3.4).
- `ConnectingView`: shown until the server answers.

## Tokens (`styles/tokens.css`)

- Color: `bg`, `surface`, `surface-raised`, `text`, `text-muted`, `border`, `primary`,
  `on-primary`, `accent`, `success`, `warning`, `danger`, `focus`. Light and dark variants.
- Type: `font-sans`, `font-mono`, sizes `xs`…`display`, weights, line heights.
- Space: `space-1`…`space-8`. Radius: `sm`, `md`, `lg`, `pill`. Motion: `fast`, `base`, `ease`.
- Sizes: `tap-min`, `tap-huge`, `content-max`, `border-width`, `focus-width`.
- TV scale: `:root[data-mode="tv"]` redefines type and space upward and forces the
  high-contrast dark palette. Components do not know which mode they are in.
