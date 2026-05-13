import { createServer } from 'http';
import { request as httpRequest } from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_SERVER_PORT = 3001;
const PROXY_PORT = 3000;
const PREFIX = '/api/v1';

// Start json-server on internal port 3001
const jsonServerBin = join(process.cwd(), 'node_modules/.bin/json-server');
const dbFile = join(__dirname, 'db.json');
const child = spawn(jsonServerBin, [dbFile, '--port', String(JSON_SERVER_PORT)], {
  stdio: 'pipe',
  shell: true,
});
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

/** Generates a short random alphanumeric ID (avoids conflicts with json-server v1 mixed-type IDs). */
function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

/** CORS headers added to every proxy response so the Angular dev server (port 4200) can access the API (port 3000). */
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization, Accept',
  'access-control-max-age': '86400',
};

// Give json-server time to start, then launch the proxy
setTimeout(() => {
  const proxy = createServer((req, res) => {
    const url = req.url ?? '/';

    // ── OPTIONS preflight ─────────────────────────────────────────────────────
    // POST with Content-Type: application/json triggers a preflight.
    // Return 204 with full CORS headers so the browser proceeds with the actual request.
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    // Strip /api/v1 prefix
    const target = url.startsWith(PREFIX) ? url.slice(PREFIX.length) || '/' : url;

    // ── POST /users ───────────────────────────────────────────────────────────
    // json-server v1.0.0-beta has issues with POST when the collection contains
    // mixed-type IDs (numeric strings + alphanumeric strings). Handle it directly
    // by reading/writing db.json so the register flow always works.
    if (req.method === 'POST' && target === '/users') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const userData = JSON.parse(body);
          const db = JSON.parse(readFileSync(dbFile, 'utf-8'));
          userData.id = generateId();
          db.users.push(userData);
          writeFileSync(dbFile, JSON.stringify(db, null, 2));
          res.writeHead(201, { ...CORS_HEADERS, 'content-type': 'application/json' });
          res.end(JSON.stringify(userData));
        } catch (e) {
          res.writeHead(400, { ...CORS_HEADERS, 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
        }
      });
      return;
    }

    // ── Forward all other requests to json-server ─────────────────────────────
    const options = {
      hostname: 'localhost',
      port: JSON_SERVER_PORT,
      path: target,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${JSON_SERVER_PORT}` },
    };

    const proxyReq = httpRequest(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, {
        ...proxyRes.headers,
        ...CORS_HEADERS,
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { ...CORS_HEADERS, 'content-type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
    });

    req.pipe(proxyReq);
  });

  proxy.listen(PROXY_PORT, () => {
    console.log(
      `\nProxy running — requests to http://localhost:${PROXY_PORT}/api/v1/* forwarded to json-server\n`,
    );
  });
}, 2000);

process.on('exit', () => child.kill());
process.on('SIGINT', () => {
  child.kill();
  process.exit();
});
