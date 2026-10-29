import * as store from './store';
import { loadToken, saveToken } from './storage';
import type { ServerMessage } from './types';

// The only module that touches the WebSocket.

const BACKOFF_MS = [250, 500, 1000, 2000];
const PING_EVERY_MS = 2000;
/** The server ticks every second, so this much silence means the connection is dead. */
const SILENCE_LIMIT_MS = 4000;
const CLOSE_REPLACED = 4000;

let socket: WebSocket | null = null;
let wsUrl: string | null = null;
let attempts = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let lastMessageAt = 0;
let lastTickAt = 0;
let pingId = 0;
let lastRtt: number | null = null;
/** When the connection was lost and why; null while connected. */
let down: { since: number; cause: string } | null = null;
let firstWelcome = true;
const joinTiming = { wsOpen: 0, formShown: 0, submitted: 0 };

export function start(): void {
  connect();
  setInterval(watchdog, 1000);
  setInterval(ping, PING_EVERY_MS);
  window.addEventListener('online', () => reconnectNow('online'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reconnectNow('visible');
  });
  // Close cleanly on refresh or tab close, so the server can tell these apart from real drops.
  window.addEventListener('pagehide', () => socket?.close(1000, 'pagehide'));
}

export function send(message: object): void {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

export function markJoinSubmitted(): void {
  joinTiming.submitted = performance.now();
}

async function resolveUrl(): Promise<string> {
  if (wsUrl) return wsUrl;
  const response = await fetch('/config.json', { cache: 'no-store' });
  const config: { wsPort: number } = await response.json();
  wsUrl = `ws://${location.hostname}:${config.wsPort}`;
  return wsUrl;
}

async function connect(): Promise<void> {
  clearTimeout(retryTimer);
  let url: string;
  try {
    url = await resolveUrl();
  } catch {
    lost('config fetch failed');
    return;
  }
  const ws = new WebSocket(url);
  socket = ws;
  ws.onopen = () => {
    lastMessageAt = performance.now();
    if (!joinTiming.wsOpen) joinTiming.wsOpen = lastMessageAt;
    ws.send(JSON.stringify({ t: 'hello', mode: store.mode.value, token: loadToken(), ua: navigator.userAgent }));
  };
  ws.onmessage = (event) => {
    lastMessageAt = performance.now();
    handle(JSON.parse(event.data as string) as ServerMessage);
  };
  ws.onclose = (event) => {
    if (socket !== ws) return;
    if (event.code === CLOSE_REPLACED) {
      socket = null;
      store.connection.value = 'replaced';
      return;
    }
    lost(`close ${event.code}`);
  };
}

/** Forgets the current socket so nothing it does later reaches the store. */
function detach(): void {
  const ws = socket;
  socket = null;
  if (!ws) return;
  ws.onopen = ws.onmessage = ws.onclose = null;
  try {
    ws.close();
  } catch {
    // Already closing.
  }
}

/** Drops the current socket (if any) and schedules the next attempt with backoff. */
function lost(cause: string): void {
  detach();
  if (!down) down = { since: performance.now(), cause };
  store.connection.value = 'reconnecting';
  const delay = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
  attempts++;
  clearTimeout(retryTimer);
  retryTimer = setTimeout(connect, delay);
}

function reconnectNow(cause: string): void {
  if (store.connection.value === 'replaced') return;
  const silent = performance.now() - lastMessageAt > SILENCE_LIMIT_MS / 2;
  if (socket && socket.readyState === WebSocket.OPEN && !silent) return;
  if (socket && socket.readyState === WebSocket.CONNECTING) return;
  detach();
  if (!down) down = { since: performance.now(), cause };
  attempts = 0;
  connect();
}

function watchdog(): void {
  if (socket && socket.readyState === WebSocket.OPEN && performance.now() - lastMessageAt > SILENCE_LIMIT_MS) {
    lost('silent');
  }
}

function ping(): void {
  send({ t: 'ping', id: ++pingId, c: performance.now(), ...(lastRtt === null ? {} : { lastRtt }) });
}

function handle(message: ServerMessage): void {
  switch (message.t) {
    case 'welcome':
      store.connection.value = 'open';
      store.joining.value = false;
      if (message.role === 'player') {
        saveToken(message.token);
        store.myId.value = message.player.id;
        store.needsJoin.value = false;
      }
      reportConnected(message.role === 'player' && !message.resumed);
      return;
    case 'needJoin':
      store.connection.value = 'open';
      store.needsJoin.value = true;
      if (!joinTiming.formShown) joinTiming.formShown = performance.now();
      reportConnected(false);
      return;
    case 'error':
      store.errorMessage.value = message.message;
      store.joining.value = false;
      return;
    case 'tick': {
      const now = performance.now();
      if (lastTickAt) store.maxTickGapMs.value = Math.max(store.maxTickGapMs.value, Math.round(now - lastTickAt));
      lastTickAt = now;
      store.counter.value = message.n;
      return;
    }
    case 'state':
      store.players.value = message.players;
      store.totalTaps.value = message.total;
      store.viewers.value = message.viewers;
      return;
    case 'pong':
      lastRtt = Math.round(performance.now() - message.c);
      store.rttMs.value = lastRtt;
      return;
  }
}

/**
 * Reports how long getting (back) into the game took. A fresh join measures from navigation
 * start to the seat; a reconnect measures from losing the socket (or from page load after a
 * refresh) to being reseated.
 */
function reportConnected(freshJoin: boolean): void {
  const now = performance.now();
  attempts = 0;
  if (freshJoin) {
    const totalMs = Math.round(now);
    store.joinMs.value = totalMs;
    send({
      t: 'metric', kind: 'join', totalMs,
      wsOpenMs: Math.round(joinTiming.wsOpen),
      formShownMs: Math.round(joinTiming.formShown),
      typingMs: Math.round(joinTiming.submitted - joinTiming.formShown),
      submitToSeatMs: Math.round(now - joinTiming.submitted),
    });
  } else if (down) {
    const downMs = Math.round(now - down.since);
    store.reconnects.value++;
    store.lastReconnectMs.value = downMs;
    send({ t: 'metric', kind: 'reconnect', downMs, cause: down.cause });
  } else if (firstWelcome && store.myId.value !== null) {
    // Seat resumed on page load: a refresh or a reopened tab.
    const downMs = Math.round(now);
    store.reconnects.value++;
    store.lastReconnectMs.value = downMs;
    send({ t: 'metric', kind: 'reconnect', downMs, cause: 'page load' });
  }
  down = null;
  firstWelcome = false;
}
