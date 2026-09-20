import assert from 'node:assert/strict';
import { renderArticle, wrapPreview, gradientText } from './render_article.mjs';

let tests = 0;
const check = (name, fn) => { fn(); tests++; console.log('PASS ' + name); };
const base = (blocks, extra = {}) => ({ signature: false, blocks, ...extra });
const paragraph = { type: 'paragraph', runs: [{ text: '正文内容。' }] };

check('No implicit title or large root padding', () => {
  const result = renderArticle(base([paragraph], { title: '元数据标题' }));
  assert.ok(!result.html.includes('<h1')); assert.ok(result.html.startsWith('<section style="margin:0;padding:0;'));
  assert.ok(!result.text.includes('元数据标题'));
});
check('Title keeps punctuation and groups semantic phrases', () => {
  const title = '从一次尝试，到一套能复用的方法';
  const result = renderArticle(base([paragraph], { title, showTitle: true }));
  assert.ok(result.html.includes('从一次尝试，</span><span'));
  assert.ok(result.html.includes('到一套能复用的方法</span>'));
  assert.ok(result.text.startsWith(title));
});
check('Prompt preserves quotes, spaces, empty lines and escaping', () => {
  const text = '  第一行 "原样" <script>alert(1)</script>\n\n\t第三行 & `code`\n结尾 ';
  const result = renderArticle(base([{ type: 'prompt', text }]));
  assert.equal(result.prompts[0].text, text); assert.ok(result.text.endsWith(text));
  assert.ok(result.html.includes('&lt;script&gt;')); assert.ok(!result.html.includes('<script>'));
  assert.ok(!/max-height|overflow:auto|class=/.test(result.html));
});
check('Multiline quote uses one surrounding box', () => {
  const result = renderArticle(base([{ type: 'quote', paragraphs: ['第一段', '', '第三段'] }]));
  assert.equal(result.report.quotes, 1); assert.equal(result.html.split('border-left:3px').length - 1, 1);
  assert.ok(result.text.includes('第一段\n\n\n\n第三段'));
});
check('AGI numbering does not duplicate existing numbers', () => {
  const result = renderArticle(base([{ type: 'heading', level: 2, text: '02 已有标题' }, { type: 'heading', level: 2, text: '下一段' }], { theme: 'agi-purple' }));
  assert.equal(result.text, '02 已有标题\n\n03 下一段');
});
check('Original Chinese heading numbers are retained', () => {
  const result = renderArticle(base([{ type: 'heading', level: 2, text: '一、准备' }], { theme: 'agi-purple' }));
  assert.equal(result.text, '一、准备');
});
check('AGI green stacks a 48px number over an optional English label and title', () => {
  const result = renderArticle(base([
    { type: 'heading', level: 2, text: '高效出模，AI 3D界顶模 Tripo 到底强在哪？', label: 'TRIPO' },
    { type: 'heading', level: 2, text: '把约束写得具体' },
    { type: 'heading', level: 3, text: '小标题' }
  ], { theme: 'agi-green' }));
  assert.equal(result.html.split('font-size:48px;font-weight:900;color:#2ea250;line-height:1;letter-spacing:-2px').length - 1, 2);
  assert.ok(result.html.includes('font-size:10px;color:#a1a1aa;font-weight:500;letter-spacing:3px'));
  assert.ok(result.html.includes('>TRIPO</span>'));
  assert.ok(result.html.includes('font-weight:800;color:#1d2129;letter-spacing:0.5px'));
  assert.ok(result.text.startsWith('01 高效出模'));
  assert.ok(result.text.includes('TRIPO'));
  assert.ok(result.html.includes('font-size:48px') && result.html.includes('font-weight:900'));
  for (const bad of [
    base([{ type: 'heading', level: 2, text: '章节', label: 'X' }], { theme: 'byte-green' }),
    base([{ type: 'heading', level: 3, text: '小节', label: 'X' }], { theme: 'agi-green' }),
    base([{ type: 'heading', level: 2, text: '章节', label: '' }], { theme: 'agi-green' })
  ]) assert.throws(() => renderArticle(bad));
  const magazine = renderArticle(base([{ type: 'heading', level: 2, text: '章节' }], { theme: 'magazine-green' }));
  assert.ok(magazine.html.includes('margin-right:8px')); assert.ok(!magazine.html.includes('font-size:48px'));
});
check('H3 has actual solid underline and no forced large background', () => {
  const result = renderArticle(base([{ type: 'heading', level: 3, text: 'a、GLM-5.3 flash' }]));
  assert.ok(result.html.includes('border-bottom:2px solid #2ea250')); assert.ok(!result.html.includes('gradient'));
});
check('Image retains natural height and flags local media', () => {
  const result = renderArticle(base([{ type: 'image', src: 'local.png', alt: '示例图' }]), () => 'media/a.png');
  assert.ok(result.html.includes('height:auto')); assert.ok(result.html.includes('line-height:0'));
  assert.equal(result.report.blockers.length, 1); assert.equal(result.report.wechatVerified, false);
});
check('Reject invalid and lossy input', () => {
  for (const blocks of [[{ type: 'raw', html: '<h1>raw</h1>' }], [{ ...paragraph, typo: 'lost' }], [{ type: 'table', headers: ['a'], rows: [['1', '2']] }], [{ type: 'image', src: 'data:image/png;base64,abc', alt: 'x' }], [{ type: 'paragraph', runs: [{ text: 'x', href: 'javascript:alert(1)' }] }]]) assert.throws(() => renderArticle(base(blocks)));
  assert.throws(() => renderArticle(base([paragraph], { theme: '__proto__' })));
  assert.throws(() => renderArticle(base([paragraph], { showTitle: true })));
  assert.throws(() => renderArticle(base([paragraph], { signature: 123 })));
});
check('Signature appears once and only in chosen brand', () => {
  const result = renderArticle({ blocks: [paragraph] });
  assert.equal(result.text.split('鲸选AI').length - 1, 1); assert.ok(!result.text.includes('WaytoAGI'));
});
check('Preview JSON cannot terminate its script', () => {
  const result = renderArticle(base([{ type: 'prompt', text: '</script><script>alert(1)</script>' }]));
  const preview = wrapPreview(result);
  assert.ok(preview.includes('\\u003c/script>')); assert.ok(!preview.includes('</script><script>alert(1)'));
});
check('All four themes route to their own visual structure', () => {
  const blocks = [{ type: 'heading', level: 2, text: '章节' }, paragraph];
  for (const theme of ['byte-green', 'agi-green', 'magazine-green', 'pro-blue']) {
    const result = renderArticle(base(blocks, { theme })); assert.equal(result.report.theme, theme); assert.ok(!/undefined|NaN/.test(result.html));
  }
  assert.equal(renderArticle(base(blocks, { theme: 'agi-purple' })).report.theme, 'agi-green');
});
check('Brand backgrounds use both exact gradient endpoints', () => {
  const result = renderArticle(base([{ type:'heading', level:2, text:'章节' }], { title:'品牌标题', showTitle:true }));
  assert.ok(result.html.includes('linear-gradient(90deg,#2ea250,#09fc3c)')); assert.ok(result.html.includes('linear-gradient(135deg,#2ea250,#09fc3c)'));
});
check('Body emphasis is gradient text, never the H3 underline', () => {
  const result = renderArticle(base([{ type:'paragraph', runs:[{text:'重点文字',mark:true}] }]));
  assert.ok(result.html.includes('color:#2ea250')); assert.ok(result.html.includes('color:#09fc3c')); assert.ok(!/border-bottom|transparent|text-fill/.test(result.html));
  assert.equal(result.text,'重点文字');
});
check('Underline emphasis draws a brand rule and composes with bold', () => {
  const result = renderArticle(base([{ type:'paragraph', runs:[{ text:'关键词', strong:true, underline:true },{ text:'，后面是正文' }] }]));
  const span = result.html.match(/<span[^>]*>关键词<\/span>/)[0];
  assert.ok(span.includes('font-weight:700;color:#1d2129'));
  assert.ok(span.includes('border-bottom:2px solid #2ea250'));
  assert.ok(span.includes('padding-bottom:2px'));
  assert.equal(result.text,'关键词，后面是正文');
  const plain = renderArticle(base([{ type:'paragraph', runs:[{ text:'普通', underline:true }] }]));
  const plainSpan = plain.html.match(/<span[^>]*>普通<\/span>/)[0];
  assert.ok(plainSpan.includes('border-bottom:2px solid #2ea250')); assert.ok(!plainSpan.includes('font-weight'));
  const themed = renderArticle(base([{ type:'paragraph', runs:[{ text:'蓝', underline:true }] }], { theme:'pro-blue' }));
  assert.ok(themed.html.includes('border-bottom:2px solid #0057ff'));
  assert.throws(() => renderArticle(base([{ type:'paragraph', runs:[{ text:'x', underline:'yes' }] }])));
  assert.throws(() => renderArticle(base([{ type:'paragraph', runs:[{ text:'x', underline:true, typo:1 }] }])));
});
check('Grapheme gradient keeps emoji, combining marks, and escaped text intact', () => {
  const text = '鲸👩‍💻é<AI>';
  const html = gradientText(text, '#2ea250', '#09fc3c', 'steps');
  assert.ok(html.includes('👩‍💻</span>')); assert.ok(html.includes('é</span>')); assert.ok(html.includes('&lt;'));
});
check('Compatible export has identical text and no gradient or transparent text', () => {
  const input = base([{type:'cover',title:'封面',accent:'重点',footer:'品牌'},{type:'heading',level:2,text:'章节'},{type:'paragraph',runs:[{text:'渐变',mark:true}]}],{theme:'magazine-green',textGradient:'continuous'});
  const design = renderArticle(input); const safe = renderArticle(input, undefined, 'compatible');
  assert.equal(design.text,safe.text); assert.ok(!/gradient\(|transparent|background-clip/.test(safe.html)); assert.ok(design.report.warnings.length > 0);
});
check('Magazine summary and prompt are different structures', () => {
  const result = renderArticle(base([{type:'summary',text:'一句话'},{type:'prompt',text:'真实提示词'}],{theme:'magazine-green'}));
  assert.equal(result.prompts.length,1); assert.equal(result.html.split('white-space:pre-wrap').length-1,1);
});
check('Pro blue uses supplied badge images and genuine text headings', () => {
  const result = renderArticle(base([{type:'heading',level:2,text:'01 开始'},{type:'heading',level:2,text:'接着'}],{theme:'pro-blue'}));
  assert.equal(result.text,'01 开始\n\n2 接着'); assert.ok(!result.html.includes('radial-gradient')); assert.ok(result.html.includes('font-style:italic')); assert.equal(result.html.match(/<img /g).length,2);
});
check('Pro badge order follows actual numbers without wrapping at four', () => {
  const result = renderArticle(base([1,2,3,4].map((number)=>({type:'heading',level:2,text:number+' 章节'})),{theme:'pro-blue'}));
  const sources = [...result.html.matchAll(/<img src="([^"]+)"/g)].map((match)=>match[1].replaceAll('\\','/'));
  assert.deepEqual(sources.map((source)=>source.split('/').at(-1)),['1.jpg','2.jpg','3.jpg']);
  assert.equal(result.report.blockers.length,1); assert.ok(result.report.warnings.some((warning)=>warning.includes('第4节'))); assert.ok(result.text.endsWith('4 章节'));
  const reverse = renderArticle(base([3,1,2].map((number)=>({type:'heading',level:2,text:number+' 章节'})),{theme:'pro-blue'}));
  assert.deepEqual([...reverse.html.matchAll(/<img src="([^"]+)"/g)].map((match)=>match[1].replaceAll('\\','/').split('/').at(-1)),['3.jpg','1.jpg','2.jpg']);
});
check('Pro uploaded badge sources are supported without claiming publication', () => {
  const result = renderArticle(base([{type:'heading',level:2,text:'开始',badgeSrc:'https://example.com/badge-1.jpg'}],{theme:'pro-blue'}));
  assert.ok(result.html.includes('src="https://example.com/badge-1.jpg"')); assert.equal(result.report.blockers.length,0); assert.equal(result.report.wechatVerified,false); assert.equal(result.report.warnings.length,1);
  const safe = renderArticle(base([{type:'heading',level:2,text:'开始'}],{theme:'pro-blue'}),undefined,'compatible');
  assert.ok(safe.html.includes('<img')); assert.ok(!safe.html.includes('gradient('));
  for (const badgeSrc of ['',null,42,'javascript:alert(1)','data:image/png;base64,abc','http://example.com/badge.jpg']) assert.throws(()=>renderArticle(base([{type:'heading',level:2,text:'开始',badgeSrc}],{theme:'pro-blue'})));
  assert.throws(()=>renderArticle(base([{type:'heading',level:3,text:'小标题',badgeSrc:'local.jpg'}],{theme:'pro-blue'})));
});
check('Reject malformed new components and gradient modes', () => {
  assert.throws(()=>renderArticle(base([paragraph],{textGradient:'fake'})));
  assert.throws(()=>renderArticle(base([{type:'toc',items:[{title:'',summary:'x'}]}])));
  assert.throws(()=>renderArticle(base([{type:'cover',title:'title',html:'<script>'}])));
});
check('Marked emphasis owns weight and color without duplicate declarations', () => {
  for (const textGradient of ['steps', 'continuous', 'solid']) {
    const result = renderArticle(base([{type:'paragraph',runs:[{text:'保留重点与斜体',mark:true,strong:true,em:true}]}],{textGradient}));
    assert.ok(result.html.includes('font-style:italic'));
    for (const match of result.html.matchAll(/style="([^"]*)"/g)) {
      const decodedStyle = match[1].replace(/&#39;|&quot;/g, (entity) => entity === '&#39;' ? "'" : '"');
      const properties = decodedStyle.split(';').filter(Boolean).map((value) => value.split(':')[0]);
      assert.equal(new Set(properties).size, properties.length, match[1]);
    }
  }
});
console.log('ALL ' + tests + ' TESTS PASSED');
