import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);
const pagesDir = path.join(root, 'pages');
const catalogFile = path.join(root, 'catalog.json');
const port = 8020;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8'
};

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function scanDir(abs, rel = '') {
  const entries = fs.readdirSync(abs, { withFileTypes: true }).filter(e => !e.name.startsWith('.'));
  const dirs = entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  const files = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.html')).sort((a, b) => a.name.localeCompare(b.name));
  const nodes = [];
  for (const d of dirs) {
    const childAbs = path.join(abs, d.name);
    const childRel = rel ? path.posix.join(rel.replace(/\\/g, '/'), d.name) : d.name;
    const children = scanDir(childAbs, childRel);
    nodes.push({ id: d.name, title: d.name, children });
  }
  for (const f of files) {
    const base = f.name.replace(/\.[^.]+$/, '');
    const relPath = rel ? path.posix.join('pages', rel, f.name) : path.posix.join('pages', f.name);
    nodes.push({ id: base, title: base, path: relPath });
  }
  return nodes;
}

function buildCatalogFromPages() {
  ensureDir(pagesDir);
  const items = scanDir(pagesDir, '');
  const catalog = { title: 'JoyPick Docs', items };
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log('catalog.json updated');
}

buildCatalogFromPages();

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://localhost`);
  const decodedPath = decodeURIComponent(u.pathname);
  const safe = path.normalize(decodedPath).replace(/^[\\\/]+/, '');
  const file = safe ? path.join(root, safe) : path.join(root, 'index.html');
  let target = file;
  try {
    console.log('resolve', { path: target });
    const st = fs.statSync(target);
    if (st.isDirectory()) target = path.join(target, 'index.html');
    const ext = path.extname(target).toLowerCase();
    const type = types[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    console.log('200', u.pathname);
    fs.createReadStream(target).pipe(res);
  } catch (e) {
    console.log('404', u.pathname);
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`http://localhost:${port}/`);
});
