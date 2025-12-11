import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);
const pagesDir = path.join(root, 'pages');
const docsDir = path.resolve(root, '..', 'docs');
const catalogFile = path.join(root, 'catalog.json');

function extractTitle(html, fallback) {
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1 && h1[1]) return h1[1].replace(/\s+/g, ' ').trim();
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (title && title[1]) return title[1].replace(/\s+/g, ' ').trim();
  return fallback;
}

function slugify(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = '';
  let inList = false;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line) { if (inList) { html += ''; } continue; }
    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^#{1,6}/)[0].length;
      const text = line.replace(/^#{1,6}\s+/, '');
      html += `<h${level}>${escapeHtml(inline(line.replace(/^#{1,6}\s+/, '')))}</h${level}>`;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${escapeHtml(inline(line.replace(/^[-*]\s+/, '')))}</li>`;
      continue;
    } else if (inList) {
      html += '</ul>'; inList = false;
    }
    html += `<p>${escapeHtml(inline(line))}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

function inline(s) {
  return s
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1<\/a>');
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function convertDocs() {
  if (!fs.existsSync(docsDir)) return [];
  const mdFiles = fs.readdirSync(docsDir).filter(f => f.toLowerCase().endsWith('.md'));
  ensureDir(pagesDir);
  const converted = [];
  for (const f of mdFiles) {
    const mdPath = path.join(docsDir, f);
    const md = fs.readFileSync(mdPath, 'utf8');
    const titleLine = md.split(/\r?\n/).find(l => /^#\s+/.test(l)) || f.replace(/\.[^.]+$/, '');
    const title = titleLine.replace(/^#\s+/, '').trim();
    const html = mdToHtml(md);
    const base = slugify(title) || slugify(f.replace(/\.[^.]+$/, '')) || 'doc';
    const outName = `docs-${base}.html`;
    const outPath = path.join(pagesDir, outName);
    fs.writeFileSync(outPath, `<h1>${escapeHtml(title)}</h1>\n` + html + '\n');
    converted.push({ title, path: `pages/${outName}` });
  }
  return converted;
}

function build() {
  ensureDir(pagesDir);
  const converted = convertDocs();
  const files = fs.readdirSync(pagesDir).filter(f => f.toLowerCase().endsWith('.html')).sort((a, b) => a.localeCompare(b));
  const items = files.map(f => {
    const p = path.join(pagesDir, f);
    const html = fs.readFileSync(p, 'utf8');
    const title = extractTitle(html, f.replace(/\.[^.]+$/, ''));
    return { id: slugify(title), title, path: `pages/${f}` };
  });
  const unique = new Map(items.map(i => [i.path, i]));
  const catalog = { title: 'JoyPick Docs', items: Array.from(unique.values()) };
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`catalog.json updated: ${catalog.items.length} items`);
}

build();
