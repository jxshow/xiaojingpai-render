import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const assetDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/pro-blue/badges');

export function renderProBadge({ prefix, number, src, image, tag, leaf, theme, components, space, warn }) {
  if (!prefix && src === undefined) return '';
  const builtin = path.join(assetDirectory, number + '.jpg');
  const source = src ?? (fs.existsSync(builtin) ? builtin : null);
  if (source !== null) return image(source, '章节 ' + (prefix.trim() || number), undefined, components.badgeSize);
  warn('Pro蓝第' + number + '节没有原图徽章，暂用普通蓝色数字；请把对应编号的原图放进 assets/pro-blue/badges/，或用 heading.badgeSrc 指定。');
  return tag('p', 'margin:0 0 ' + space.card + 'px;text-align:center', leaf(prefix.trim(), 'font-size:' + components.badgeFont + 'px;font-weight:700;color:' + theme.primary));
}
