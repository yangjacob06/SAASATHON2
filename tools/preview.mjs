// Local preview with the same analysis handler used by Vercel.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../MODEL/prototype/build.mjs';
import analysis from '../MODEL/prototype/api/analyze.js';
const project = fileURLToPath(new URL('../MODEL/prototype/', import.meta.url));
try { process.loadEnvFile(path.join(project, '.env.local')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const root = path.join(project, 'dist');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.ttf':'font/ttf', '.csv':'text/csv; charset=utf-8', '.png':'image/png', '.pdf':'application/pdf' };
const port = Number(process.env.MANDATE_PREVIEW_PORT || 4318);
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1:' + port}`);
    if (url.pathname === '/api/analyze') {
      const request = new Request(url, { method:req.method, headers:req.headers, ...(!['GET','HEAD'].includes(req.method) ? {body:req, duplex:'half'} : {}) });
      const response = await analysis.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    const name = decodeURIComponent(url.pathname);
    const target = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(target);
    res.writeHead(200, {'Content-Type':mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Mandate preview: http://127.0.0.1:${port}`));
