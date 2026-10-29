// Simulated players for the soak test. Each one joins like a phone does, pings every 2 s,
// taps at random, and reconnects with its token if the socket drops.
//
//   node loadtest.mjs <host-ip> [clients=40] [minutes=30] [httpPort=8080]

import WebSocket from 'ws';

const [host, clientsArg = '40', minutesArg = '30', httpPortArg = '8080'] = process.argv.slice(2);
if (!host) {
  console.error('usage: node loadtest.mjs <host-ip> [clients] [minutes] [httpPort]');
  process.exit(1);
}
const clients = Number(clientsArg);
const durationMs = Number(minutesArg) * 60_000;

const config = await (await fetch(`http://${host}:${httpPortArg}/config.json`)).json();
const url = `ws://${host}:${config.wsPort}`;

const totals = { drops: 0, reconnects: 0, rtts: [], maxTickGap: 0, joins: [] };

function bot(index) {
  let token = null;
  let lastTick = 0;
  let pingId = 0;
  let lastRtt;
  let downSince = null;
  let stopped = false;
  let ws;

  const open = () => {
    const startedAt = performance.now();
    ws = new WebSocket(url);
    const pinger = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ t: 'ping', id: ++pingId, c: performance.now(), ...(lastRtt === undefined ? {} : { lastRtt }) }));
      if (Math.random() < 0.3) ws.send(JSON.stringify({ t: 'tap' }));
    }, 2000);
    ws.on('open', () => ws.send(JSON.stringify({ t: 'hello', mode: 'player', token, ua: 'loadtest' })));
    ws.on('message', (data) => {
      const msg = JSON.parse(String(data));
      if (msg.t === 'needJoin') ws.send(JSON.stringify({ t: 'join', name: `bot${index}`, emoji: '🤖' }));
      if (msg.t === 'welcome') {
        if (!token) totals.joins.push(Math.round(performance.now() - startedAt));
        token = msg.token;
        if (downSince !== null) {
          const downMs = Math.round(performance.now() - downSince);
          totals.reconnects++;
          ws.send(JSON.stringify({ t: 'metric', kind: 'reconnect', downMs, cause: 'loadtest' }));
          downSince = null;
        }
      }
      if (msg.t === 'pong') {
        lastRtt = Math.round(performance.now() - msg.c);
        totals.rtts.push(lastRtt);
      }
      if (msg.t === 'tick') {
        const now = performance.now();
        if (lastTick) totals.maxTickGap = Math.max(totals.maxTickGap, now - lastTick);
        lastTick = now;
      }
    });
    ws.on('close', (code) => {
      clearInterval(pinger);
      if (stopped) return;
      totals.drops++;
      console.log(`bot${index} dropped (code ${code}), reconnecting`);
      downSince ??= performance.now();
      setTimeout(open, 500);
    });
    ws.on('error', () => {});
  };

  open();
  return () => {
    stopped = true;
    ws.close(1000);
  };
}

const stops = [];
for (let i = 0; i < clients; i++) {
  stops.push(bot(i));
  await new Promise((r) => setTimeout(r, 50));
}

const pct = (values, p) => {
  if (values.length === 0) return '–';
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)];
};
const report = () =>
  console.log(
    `${new Date().toISOString()} clients=${clients} drops=${totals.drops} reconnects=${totals.reconnects} ` +
      `rtt median=${pct(totals.rtts, 0.5)} p95=${pct(totals.rtts, 0.95)} maxTickGap=${Math.round(totals.maxTickGap)}ms`,
  );
const reporter = setInterval(report, 60_000);

setTimeout(() => {
  clearInterval(reporter);
  stops.forEach((stop) => stop());
  report();
  console.log(`join median=${pct(totals.joins, 0.5)}ms; full server stats at http://${host}:${httpPortArg}/stats.json`);
  setTimeout(() => process.exit(totals.drops === 0 ? 0 : 1), 500);
}, durationMs);
