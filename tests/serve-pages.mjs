import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const dist = resolve('dist')
const prefix = '/longtan-street/'
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' }
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname
  if (!path.startsWith(prefix)) { res.writeHead(404).end(); return }
  const file = resolve(dist, path.slice(prefix.length) || 'index.html')
  if (!file.startsWith(dist + sep)) { res.writeHead(404).end(); return }
  try {
    const data = await readFile(file)
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream' }).end(data)
  } catch {
    res.writeHead(404).end()
  }
}).listen(4175, '127.0.0.1')
