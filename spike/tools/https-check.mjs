// Serves the built web bundle over HTTPS with a throwaway self-signed certificate, to see how
// each browser presents the warning (spec §3.4). Open https://<laptop-ip>:8443/?mode=diag
//
//   node https-check.mjs        (needs `openssl` on PATH; Git Bash on Windows has it)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:https';
import { networkInterfaces, tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../host-app/modules/spike-server/android/src/main/assets/web/', import.meta.url));
if (!existsSync(join(root, 'index.html'))) {
  console.error('Build the web client first: cd spike/web && npm run build');
  process.exit(1);
}

const dir = join(tmpdir(), 'triviocity-https-check');
mkdirSync(dir, { recursive: true });
const key = join(dir, 'key.pem');
const cert = join(dir, 'cert.pem');
if (!existsSync(cert)) {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '7', '-subj', '/CN=triviocity-spike', '-keyout', key, '-out', cert], { stdio: 'ignore' });
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'https://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(root, path || 'index.html');
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
}).listen(8443, () => {
  const ips = Object.values(networkInterfaces()).flat().filter((a) => a && a.family === 'IPv4' && !a.internal);
  for (const a of ips) console.log(`https://${a.address}:8443/?mode=diag`);
});
