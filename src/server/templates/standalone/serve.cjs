// Offline static server. Requires Node.js on the computer hosting this ZIP.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg' };
function createTourServer(root) {
  const base = fs.realpathSync(root);
  return http.createServer((req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
      const name = decodeURIComponent((req.url || '/').split('?')[0]);
      if (name.includes('\\') || name.includes('\0')) { res.writeHead(400).end(); return; }
      const file = fs.realpathSync(path.resolve(base, '.' + (name === '/' ? '/index.html' : name)));
      if (!file.startsWith(base + path.sep) || !types[path.extname(file)]) { res.writeHead(403).end(); return; }
      const stat = fs.statSync(file);
      if (!stat.isFile()) { res.writeHead(404).end(); return; }
      let start = 0, end = stat.size - 1;
      if (req.headers.range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!match) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
        start = Number(match[1]);
        end = match[2] ? Math.min(Number(match[2]), end) : end;
        if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
      }
      res.writeHead(req.headers.range ? 206 : 200, {
        'Content-Type': types[path.extname(file)], 'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store',
        ...(req.headers.range ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}),
      });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    } catch { res.writeHead(404).end(); }
  });
}
module.exports = { createTourServer };
if (require.main === module) {
  const server = createTourServer(__dirname);
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => {
    console.log('Buka http://127.0.0.1:4173 di browser. Tidak memerlukan internet. Ctrl+C untuk berhenti.');
  });
}
