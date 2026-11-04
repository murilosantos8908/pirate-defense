// Servidor estático mínimo (sem dependências) para rodar o jogo localmente.
const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end('Acesso negado');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Arquivo não encontrado');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      if (nextPort <= 8095) {
        console.warn(`Porta ${port} em uso. Tentando ${nextPort}...`);
        startServer(nextPort);
        return;
      }
    }
    throw err;
  });

  server.listen(port, () => {
    console.log(`PIRATE DEFENSE rodando em http://localhost:${port}`);
  });
}

startServer(DEFAULT_PORT);
