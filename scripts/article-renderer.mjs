import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProBadge } from './pro-badges.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const tokens = JSON.parse(fs.readFileSync(path.join(root, 'assets/tokens.json'), 'utf8'));
const { colors: c, space: s, size: z, components: k } = tokens;
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const style = (values) => Object.entries(values).map(([key, value]) => key + ':' + value).join(';');
const tag = (name, styles, html, attrs = '') => '<' + name + (styles ? ' style="' + escapeHtml(styles) + '"' : '') + attrs + '>' + html + '</' + name + '>';
const leaf = (text, styles = '', breaks = true) => tag('span', styles, breaks ? escapeHtml(text).replace(/\r\n|\n|\r/g, '<br>') : escapeHtml(text), ' leaf=""');
const requiredText = (value, label, allowEmpty = false) => {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) throw new Error(label + ' 必须是' + (allowEmpty ? '字符串' : '非空字符串'));
  return value;
};
const fields = (value, allowed, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' 必须是对象');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(label + ' 含未知字段: ' + key);
};
const boolean = (value, label, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new Error(label + ' 必须是布尔值');
  return value;
};
const webUrl = (value, label, httpsOnly = false) => {
  requiredText(value, label);
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(label + ' 不是有效网址'); }
  if (!(httpsOnly ? ['https:'] : ['http:', 'https:']).includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(label + ' 仅支持' + (httpsOnly ? ' HTTPS' : ' HTTP/HTTPS') + '，且不得含账号密码');
  return value;
};

export function gradientText(text, start, end, mode, extraStyle = '') {
  if (mode === 'solid') return leaf(text, extraStyle + ';color:' + start);
  if (mode === 'continuous') return leaf(text, extraStyle + ';color:' + start + ';background-color:' + start + ';background-image:linear-gradient(90deg,' + start + ',' + end + ');background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent');
  const parts = [...new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text)].map((part) => part.segment);
  const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const a = rgb(start); const b = rgb(end);
  return tag('span', extraStyle, parts.map((part, index) => {
    const t = parts.length > 1 ? index / (parts.length - 1) : 0;
    const color = '#' + a.map((value, channel) => Math.round(value + (b[channel] - value) * t).toString(16).padStart(2, '0')).join('');
    return leaf(part, 'color:' + color);
  }).join(''));
}

export function renderArticle(input, resolveImage = (src) => src, profile = 'design') {
  fields(input, ['theme', 'title', 'showTitle', 'signature', 'blocks', 'textGradient'], 'article');
  const themeId = input.theme === 'agi-purple' ? 'agi-green' : (input.theme ?? 'byte-green');
  if (typeof themeId !== 'string' || !Object.hasOwn(tokens.themes, themeId)) throw new Error('未知主题: ' + themeId);
  const theme = tokens.themes[themeId];
  const byte = theme.layout === 'byte';
  const pro = theme.layout === 'pro';
  const safe = profile === 'compatible';
  const requestedGradient = input.textGradient ?? 'steps';
  if (!['steps', 'continuous', 'solid'].includes(requestedGradient)) throw new Error('textGradient 仅支持 steps/continuous/solid');
  const gradientMode = safe || pro ? 'solid' : requestedGradient;
  const gradient = (angle = '90deg') => 'linear-gradient(' + angle + ',' + theme.primary + ',' + theme.end + ')';
  const gradientBackground = (angle = '90deg') => 'background-color:' + theme.primary + (safe ? '' : ';background-image:' + gradient(angle));
  const emphasis = (text, extra = '') => gradientText(text, theme.primary, theme.end, gradientMode, 'font-weight:700;' + extra);
  const title = input.title === undefined ? '' : requiredText(input.title, 'title', true);
  const showTitle = boolean(input.showTitle, 'showTitle', false);
  if (showTitle && !title.trim()) throw new Error('showTitle:true 需要非空 title');
  if (!Array.isArray(input.blocks) || !input.blocks.length) throw new Error('blocks 不能为空');
  const base = style({ 'font-size': z.body + 'px', color: theme.text, 'line-height': theme.lineHeight });
  const paraStyle = 'margin:' + s.paragraph + 'px 0;' + base;
  const plain = [];
  const prompts = [];
  const warnings = [];
  if (gradientMode === 'continuous') warnings.push('连续文字渐变使用背景裁剪和透明填色；公众号若只保留部分CSS，可能变成色块或不可见，请测试或使用纯色稳妥版。');
  const blockers = [];
  let sectionNumber = 0;
  let quoteCount = 0;
  const rich = (runs) => {
    if (typeof runs === 'string') return { html: leaf(runs), text: runs };
    if (!Array.isArray(runs) || !runs.length) throw new Error('runs 必须是非空数组');
    let text = '';
    const html = runs.map((run) => {
      fields(run, ['text', 'strong', 'em', 'mark', 'href'], 'run');
      requiredText(run.text, 'run.text', true);
      text += run.text;
      const styles = {};
      const strong = boolean(run.strong, 'strong', false);
      const mark = boolean(run.mark, 'mark', false);
      if (strong && !mark) { styles['font-weight'] = '700'; styles.color = c.heading; }
      if (boolean(run.em, 'em', false)) styles['font-style'] = 'italic';
      let result = mark ? emphasis(run.text, style(styles)) : leaf(run.text, style(styles));
      if (run.href !== undefined) result = tag('a', 'color:' + theme.primary + ';text-decoration:underline', result, ' href="' + escapeHtml(webUrl(run.href, 'href')) + '"');
      return result;
    }).join('');
    return { html, text };
  };
  const paragraphs = (items) => {
    if (!Array.isArray(items) || !items.length) throw new Error('paragraphs 必须为非空数组');
    const parts = items.map(rich);
    return { html: parts.map((part, index) => tag('p', 'margin:' + (index ? s.sm : 0) + 'px 0 0;' + base, part.html || '<br>')).join(''), text: parts.map((part) => part.text).join('\n\n') };
  };
  const imageBlock = (src, alt, caption, badgeWidth = 0) => {
    requiredText(src, 'image.src'); requiredText(alt, 'image.alt');
    if (caption !== undefined) requiredText(caption, 'image.caption', true);
    let resolved;
    if (/^https:\/\//i.test(src)) {
      webUrl(src, 'image.src', true); resolved = src;
      warnings.push('远程图片需要在公众号粘贴、保存后确认可用: ' + src);
    } else {
      if (/^[a-z][a-z0-9+.-]*:/i.test(src) && !/^[a-z]:[\\/]/i.test(src)) throw new Error('图片不支持 data/blob/file/HTTP 协议: ' + src);
      resolved = resolveImage(src);
      blockers.push(badgeWidth ? 'Pro蓝章节徽章为本地资产，发布前请上传并用 heading.badgeSrc 替换为 HTTPS 图片地址。' : '本地图片仅供预览，发布前请上传并替换 HTTPS 地址: ' + src);
    }
    const image = '<img src="' + escapeHtml(resolved) + '" alt="' + escapeHtml(alt) + '" style="display:block;' + (badgeWidth ? 'width:' + badgeWidth + 'px;' : '') + 'max-width:100%;height:auto;margin:0 auto;border:0">';
    const note = caption ? tag('p', 'margin:' + s.sm + 'px 0 0;color:' + c.muted + ';font-size:' + z.caption + 'px;line-height:1.65;text-align:center', leaf(caption)) : '';
    return tag('section', badgeWidth ? 'margin:0 0 ' + s.card + 'px;line-height:0' : 'margin:' + s.card + 'px 0;padding:' + (pro ? s.sm : 0) + 'px;line-height:0' + (pro ? ';background-color:' + c.figureBg : ''), image + note);
  };
  const renderBlock = (block) => {
    if (!block || typeof block !== 'object') throw new Error('block 必须为对象');
    switch (block.type) {
      case 'paragraph': {
        fields(block, ['type', 'runs'], 'paragraph');
        const part = rich(block.runs); if (!part.text.trim()) throw new Error('正文空段请移除，原始空行用 prompt/code/quote 表达');
        plain.push(part.text); return tag('p', paraStyle, part.html);
      }
      case 'heading': {
        fields(block, ['type', 'level', 'text', 'badgeSrc'], 'heading'); requiredText(block.text, 'heading.text');
        if (block.badgeSrc !== undefined) { requiredText(block.badgeSrc, 'heading.badgeSrc'); if (!(pro && block.level === 2)) throw new Error('badgeSrc 仅用于Pro蓝二级标题'); }
        if (![2, 3].includes(block.level)) throw new Error('heading.level 仅支持 2 或 3');
        const h2 = block.level === 2;
        let prefix = ''; let headingText = block.text; let plainHeading = block.text;
        if (h2) {
          const numbered = block.text.match(/^\s*(\d{1,3})(?:[.、．:：)）\s]|(?=[\u3400-\u9fff]))/);
          const existing = numbered || /^\s*(?:[一二三四五六七八九十百]+[、.．]|第[一二三四五六七八九十百\d]+[章节部分])/.test(block.text);
          sectionNumber = numbered ? Number(numbered[1]) : sectionNumber + 1;
          if (!byte && !existing) { prefix = pro ? String(sectionNumber) : String(sectionNumber).padStart(2, '0'); plainHeading = prefix + ' ' + block.text; }
          if (!byte && numbered) { prefix = numbered[0]; headingText = block.text.slice(numbered[0].length); }
        }
        plain.push(plainHeading);
        const headingStyle = style({ margin: (h2 ? s.section : s.block) + 'px 0 ' + (h2 ? s.paragraph : s.sm) + 'px', 'font-size': (h2 ? z.h2 : z.h3) + 'px', 'line-height': 1.6, 'font-weight': 700, color: c.heading, 'text-align': (byte && h2) || pro ? 'center' : 'left' });
        let content = leaf(headingText);
        if (byte && h2) content = leaf(block.text, 'display:inline-block;max-width:100%;box-sizing:border-box;padding:' + s.xs + 'px ' + s.card + 'px;' + gradientBackground('135deg') + ';color:' + c.white + ';border-radius:6px');
        if (!pro && !h2) content = leaf(block.text, 'border-bottom:2px solid ' + theme.primary + ';padding-bottom:4px');
        if (pro) {
          const badge = renderProBadge({ prefix, number: sectionNumber, src: block.badgeSrc, image: imageBlock, tag, leaf, theme, components: k, space: s, warn: (message) => warnings.push(message) });
          return tag('section', 'margin:' + s.section + 'px 0 ' + s.card + 'px', badge + tag('h' + block.level, headingStyle + ';margin:0;color:' + theme.primary + ';font-style:italic', leaf(headingText)));
        }
        if (prefix) content = leaf(prefix, 'color:' + theme.primary + ';margin-right:8px') + content;
        return tag('h' + block.level, headingStyle, content);
      }
      case 'cover': {
        fields(block, ['type', 'kicker', 'date', 'title', 'accent', 'subtitle', 'footer'], 'cover');
        for (const key of ['title']) requiredText(block[key], 'cover.' + key);
        for (const key of ['kicker', 'date', 'accent', 'subtitle', 'footer']) if (block[key] !== undefined) requiredText(block[key], 'cover.' + key);
        const meta = [block.kicker, block.date].filter(Boolean).join(' · ');
        const top = meta ? tag('p', 'margin:0 0 24px;color:' + theme.primary + ';font-size:12px;line-height:1.65;font-weight:700;letter-spacing:1px', leaf(meta)) : '';
        const titleHtml = tag('p', 'margin:0;color:' + c.heading + ';font-size:24px;line-height:1.5;font-weight:700;text-wrap:balance', leaf(block.title));
        const accent = block.accent ? tag('p', 'margin:4px 0 0;font-size:24px;line-height:1.5;text-wrap:balance', emphasis(block.accent)) : '';
        const subtitle = block.subtitle ? tag('p', 'margin:16px 0 0;color:' + c.muted + ';font-size:14px;line-height:1.7', leaf(block.subtitle)) : '';
        const footer = block.footer ? tag('p', 'margin:0;padding:12px 24px;border-radius:0 0 ' + k.coverRadius + 'px ' + k.coverRadius + 'px;' + gradientBackground('135deg') + ';color:' + c.heading + ';font-size:13px;line-height:1.65;font-weight:700', leaf(block.footer)) : '';
        plain.push([meta, block.title, block.accent, block.subtitle, block.footer].filter(Boolean).join('\n'));
        return tag('section', 'margin:0 0 28px;border:1px solid ' + theme.border + ';border-radius:' + k.coverRadius + 'px;background-color:' + c.white, tag('section', 'padding:' + k.coverPadding + 'px', top + titleHtml + accent + subtitle) + footer);
      }
      case 'toc': {
        fields(block, ['type', 'title', 'items'], 'toc');
        if (!Array.isArray(block.items) || !block.items.length) throw new Error('toc.items 不能为空');
        if (block.title !== undefined) requiredText(block.title, 'toc.title');
        const entries = block.items.map((item, index) => {
          fields(item, ['title', 'summary'], 'toc.item'); requiredText(item.title, 'toc.item.title');
          if (item.summary !== undefined) requiredText(item.summary, 'toc.item.summary');
          const number = String(index + 1).padStart(2, '0');
          const background = index ? 'background-color:' + c.white : gradientBackground('135deg');
          return tag('section', 'display:inline-block;vertical-align:top;box-sizing:border-box;width:' + k.tocWidth + 'px;max-width:100%;margin:0 8px 8px 0;padding:12px;border:1px solid ' + theme.border + ';border-radius:10px;' + background,
            tag('p', 'margin:0 0 4px;font-size:12px;line-height:1.65;color:' + c.heading, leaf(number)) + tag('p', 'margin:0;font-size:14px;line-height:1.65;color:' + c.heading + ';font-weight:700', leaf(item.title)) + (item.summary ? tag('p', 'margin:4px 0 0;font-size:12px;line-height:1.65;color:' + (index ? c.muted : c.heading), leaf(item.summary)) : ''));
        }).join('');
        plain.push([block.title, ...block.items.map((item, index) => String(index + 1).padStart(2, '0') + ' ' + item.title + (item.summary ? '：' + item.summary : ''))].filter(Boolean).join('\n'));
        return tag('section', 'margin:20px 0 28px', (block.title ? tag('p', 'margin:0 0 12px;color:' + c.muted + ';font-size:12px;line-height:1.65', leaf(block.title)) : '') + entries);
      }
      case 'summary': {
        fields(block, ['type', 'eyebrow', 'text'], 'summary'); requiredText(block.text, 'summary.text');
        if (block.eyebrow !== undefined) requiredText(block.eyebrow, 'summary.eyebrow');
        plain.push([block.eyebrow, block.text].filter(Boolean).join('\n'));
        return tag('section', 'margin:24px 0;padding:16px;border:1px dashed ' + theme.border + ';border-radius:8px;text-align:center;background-color:' + theme.tint,
          (block.eyebrow ? tag('p', 'margin:0 0 8px;color:' + c.muted + ';font-size:12px;line-height:1.65', leaf(block.eyebrow)) : '') + tag('p', 'margin:0;font-size:16px;line-height:1.85', emphasis(block.text)));
      }
      case 'quote': case 'callout': {
        fields(block, ['type', 'paragraphs', ...(block.type === 'callout' ? ['title'] : [])], block.type);
        const part = paragraphs(block.paragraphs);
        if (!part.text.trim()) throw new Error('引用或说明卡不能全空');
        const isQuote = block.type === 'quote'; if (isQuote) quoteCount++;
        let lead = '';
        if (block.title !== undefined) { requiredText(block.title, 'callout.title'); lead = tag('p', 'margin:0 0 8px;font-weight:700;color:' + c.heading, leaf(block.title)); }
        plain.push((block.title ? block.title + '\n' : '') + part.text);
        const border = byte && isQuote ? 'border-left:3px solid ' + theme.primary : 'border:1px solid ' + theme.border;
        return tag('section', 'margin:' + s.card + 'px 0;padding:' + s.card + 'px;background-color:' + theme.tint + ';border-radius:' + (byte ? 4 : 10) + 'px;' + border + ';' + base, lead + part.html);
      }
      case 'prompt': case 'code': {
        fields(block, ['type', 'text', ...(block.type === 'prompt' ? ['title'] : ['language'])], block.type);
        requiredText(block.text, block.type + '.text');
        const isPrompt = block.type === 'prompt';
        const label = isPrompt ? (block.title ?? '完整提示词') : (block.language ?? '代码');
        requiredText(label, 'prompt/code 标题');
        const head = tag('p', 'margin:0;padding:' + s.paragraph + 'px ' + s.card + 'px;border-bottom:1px ' + (isPrompt ? 'dashed ' + theme.border : 'solid ' + c.line) + ';color:' + theme.promptHeading + ';font-size:' + z.small + 'px;line-height:1.65;font-weight:700', leaf(label));
        const body = tag('p', 'margin:0;padding:' + s.card + 'px;font-family:' + tokens.mono + ';font-size:' + (isPrompt ? z.small : z.code) + 'px;line-height:' + (isPrompt ? 1.9 : 1.7) + ';color:' + c.text + ';white-space:pre-wrap;overflow-wrap:anywhere;tab-size:4', leaf(block.text, '', false));
        if (isPrompt) prompts.push({ title: label, text: block.text });
        plain.push(label + '\n' + block.text);
        return tag('section', 'margin:' + s.block + 'px 0;border:1px ' + (isPrompt ? 'dashed ' + theme.border : 'solid ' + c.line) + ';border-radius:' + (isPrompt ? k.promptRadius : 4) + 'px;background-color:' + (isPrompt ? theme.promptBg : c.codeBg), head + body);
      }
      case 'list': {
        fields(block, ['type', 'ordered', 'items'], 'list');
        const ordered = boolean(block.ordered, 'list.ordered', false);
        if (!Array.isArray(block.items) || !block.items.length) throw new Error('list.items 不能为空');
        const parts = block.items.map(rich);
        if (parts.some((part) => !part.text.trim())) throw new Error('列表项不能为空');
        plain.push(parts.map((part, i) => (ordered ? (i + 1) + '. ' : '• ') + part.text).join('\n'));
        return tag(ordered ? 'ol' : 'ul', 'margin:' + s.paragraph + 'px 0;padding-left:24px;' + base, parts.map((part) => tag('li', 'margin:8px 0;padding-left:4px', part.html)).join(''));
      }
      case 'image': {
        fields(block, ['type', 'src', 'alt', 'caption'], 'image');
        const html = imageBlock(block.src, block.alt, block.caption);
        plain.push('[图片：' + block.alt + ']' + (block.caption ? '\n' + block.caption : '')); return html;
      }
      case 'table': {
        fields(block, ['type', 'headers', 'rows'], 'table');
        if (!Array.isArray(block.headers) || !block.headers.length || !Array.isArray(block.rows) || !block.rows.length) throw new Error('table 需要非空 headers 和 rows');
        block.headers.forEach((cell) => requiredText(cell, 'table.header'));
        block.rows.forEach((row) => { if (!Array.isArray(row) || row.length !== block.headers.length) throw new Error('表格列数不一致'); row.forEach((cell) => requiredText(cell, 'table.cell', true)); });
        if (block.headers.length > 3) warnings.push('宽表格请在手机复核，建议转为逐项说明');
        const rowHtml = (row, header) => tag('tr', '', row.map((cell) => tag(header ? 'th' : 'td', 'padding:8px;border:1px solid ' + c.line + ';text-align:left;vertical-align:top;font-size:14px;line-height:1.7;' + (header ? 'background-color:' + theme.tint : ''), leaf(cell))).join(''));
        plain.push([block.headers, ...block.rows].map((row) => row.join(' | ')).join('\n'));
        return tag('table', 'border-collapse:collapse;table-layout:fixed;width:100%;margin:16px 0;overflow-wrap:anywhere', tag('thead', '', rowHtml(block.headers, true)) + tag('tbody', '', block.rows.map((row) => rowHtml(row, false)).join('')));
      }
      case 'divider': fields(block, ['type'], 'divider'); return '<hr style="border:0;border-top:1px solid ' + c.line + ';margin:28px 0">';
      default: throw new Error('未知 block.type: ' + block.type);
    }
  };
  let article = '';
  if (showTitle) {
    const titleBand = !byte ? '' : safe ? 'border-bottom:4px solid ' + theme.primary + ';padding-bottom:4px' : 'background-image:' + gradient() + ';background-size:100% 32%;background-position:left 94%;background-repeat:no-repeat';
    const heading = title.split(/(?<=[，,：:。！？!?；;])/u).map((phrase) => leaf(phrase, 'display:inline-block;max-width:100%;vertical-align:top;' + titleBand)).join('');
    article += tag('h1', 'margin:0 0 20px;color:' + c.heading + ';font-size:' + z.h1 + 'px;font-weight:700;line-height:1.5;text-wrap:balance;text-align:' + (byte ? 'center' : 'left'), heading);
    plain.push(title);
  }
  for (const block of input.blocks) article += renderBlock(block);
  const signature = input.signature ?? true;
  if (signature !== false) {
    if (typeof signature === 'string') {
      webUrl(signature, 'signature', true);
      article += imageBlock(signature, '鲸选AI：挖掘 PMF & TIP，每个人的 AI 顾问');
    } else if (signature === true) {
      article += tag('section', 'margin:' + s.footer + 'px 0 0;padding:20px 0 0;border-top:1px solid ' + c.line, tag('p', 'margin:0;color:' + theme.primary + ';font-size:17px;font-weight:700;line-height:1.6', leaf('鲸选AI')) + tag('p', 'margin:4px 0 0;color:' + c.muted + ';font-size:12px;line-height:1.65', leaf('挖掘 PMF & TIP · 每个人的 AI 顾问')));
    } else throw new Error('signature 仅支持 boolean 或 HTTPS 图片地址');
    plain.push('鲸选AI\n挖掘 PMF & TIP · 每个人的 AI 顾问');
  }
  const html = tag('section', 'margin:0;padding:0;max-width:100%;background-color:' + c.white + ';font-family:' + tokens.font + ';font-size:16px;line-height:' + theme.lineHeight + ';color:' + theme.text + ';overflow-wrap:anywhere', article);
  return { html, text: plain.join('\n\n'), prompts, theme: theme.name, title: title || '鲸选AI · 排版预览', report: { theme: themeId, profile, textGradient: gradientMode, blocks: input.blocks.length, quotes: quoteCount, prompts: prompts.length, localExportChecksPassed: true, wechatVerified: false, blockers: [...new Set(blockers)], warnings: [...new Set(warnings)], note: '结构校验与浏览器预览不能替代公众号粘贴、保存和手机预览实测。' } };
}
