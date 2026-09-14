import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderArticle, escapeHtml } from './article-renderer.mjs';
export { renderArticle, tokens, gradientText } from './article-renderer.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function wrapPreview(result) {
  const template = fs.readFileSync(path.join(root, 'assets/preview-template.html'), 'utf8');
  const payload = JSON.stringify(result).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return template.replaceAll('{{TITLE}}', escapeHtml(result.title)).replace('<!--ARTICLE-->', result.html).replace('/*PAYLOAD*/null', payload);
}

export function build(inputPath, outDir) {
  const absoluteInput = path.resolve(inputPath);
  const input = JSON.parse(fs.readFileSync(absoluteInput, 'utf8'));
  const media = [];
  const resolveImage = (src) => {
    const source = path.resolve(path.dirname(absoluteInput), src);
    const existing = media.find((item) => item.source === source); if (existing) return existing.relative;
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) throw new Error('本地图片不存在: ' + source);
    const ext = path.extname(source).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) throw new Error('本地图片仅支持 PNG/JPG/GIF/WebP');
    const relative = 'media/image-' + (media.length + 1) + ext;
    media.push({ source, relative }); return relative;
  };
  const result = renderArticle(input, resolveImage);
  const compatible = renderArticle(input, resolveImage, 'compatible');
  result.compatHtml = compatible.html;
  if (result.text !== compatible.text) throw new Error('兼容转换改变了正文');
  const outputs = ['article.html', 'article-compatible.html', 'preview.html', 'article.txt', 'report.json', ...media.map((item) => item.relative)];
  for (const target of outputs) if (fs.existsSync(path.join(outDir, target))) throw new Error('输出已存在，请选择新目录避免覆盖: ' + path.join(outDir, target));
  fs.mkdirSync(outDir, { recursive: true });
  for (const item of media) { fs.mkdirSync(path.join(outDir, 'media'), { recursive: true }); fs.copyFileSync(item.source, path.join(outDir, item.relative)); }
  fs.writeFileSync(path.join(outDir, 'article.html'), result.html, 'utf8');
  fs.writeFileSync(path.join(outDir, 'article-compatible.html'), result.compatHtml, 'utf8');
  fs.writeFileSync(path.join(outDir, 'preview.html'), wrapPreview(result), 'utf8');
  fs.writeFileSync(path.join(outDir, 'article.txt'), result.text, 'utf8');
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(result.report, null, 2), 'utf8');
  return result.report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 3 || args[1] !== '--out') throw new Error('用法: node render_article.mjs <article.json> --out <新输出目录>');
    console.log(JSON.stringify(build(args[0], path.resolve(args[2])), null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
