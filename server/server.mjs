import { createServer } from 'http'
import { request as httpRequest } from 'http'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const JSON_SERVER_PORT = 3001
const PROXY_PORT = 3000
const PREFIX = '/api/v1'

// Start json-server on internal port 3001
const jsonServerBin = join(process.cwd(), 'node_modules/.bin/json-server')
const dbFile = join(__dirname, 'db.json')
const child = spawn(jsonServerBin, [dbFile, '--port', String(JSON_SERVER_PORT)], {
  stdio: 'pipe',
  shell: true,
})
child.stdout.pipe(process.stdout)
child.stderr.pipe(process.stderr)

// Give json-server time to start, then launch the proxy
setTimeout(() => {
  const proxy = createServer((req, res) => {
    const url = req.url ?? '/'

    // Strip /api/v1 prefix
    const target = url.startsWith(PREFIX) ? url.slice(PREFIX.length) || '/' : url

    const options = {
      hostname: 'localhost',
      port: JSON_SERVER_PORT,
      path: target,
      method: req.method,
      headers: { ...req.headers, host: `localhost:${JSON_SERVER_PORT}` },
    }

    const proxyReq = httpRequest(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, {
        ...proxyRes.headers,
        'access-control-allow-origin': '*',
      })
      proxyRes.pipe(res)
    })

    proxyReq.on('error', (err) => {
      res.writeHead(502)
      res.end(`Proxy error: ${err.message}`)
    })

    req.pipe(proxyReq)
  })

  proxy.listen(PROXY_PORT, () => {
    console.log(`\nProxy running — requests to http://localhost:${PROXY_PORT}/api/v1/* forwarded to json-server\n`)
  })
}, 2000)

process.on('exit', () => child.kill())
process.on('SIGINT', () => { child.kill(); process.exit() })
