# 鲸选AGI绿

基于 way.pdf 的开放阅读节奏，章节标题采用横排大编号版式（2026-09 参考「雷一言」公众号重做：编号移到标题左侧并带点，收尾横线只覆盖标题列）；原AGI紫全部转为用户品牌绿。旧ID agi-purple 仅作为兼容输入。

## Tokens

主色 #2ea250，渐变端点 #09fc3c，正文 #4e5969，黑标题 #1d2129，英文标签 #a1a1aa，卡片 #f5faf6，边框 #cfe7d5。来自 tokens.json。

## 组件与骨架

左对齐黑色H1 → 开场段落 → 横排编号章节（左侧斜体绿编号 + 右列标题/英文标签/1px 收尾横线）→ 正文/列表/图片 → 浅绿说明/引用 → 终端框 → 提示词 → 鲸选AI署名。

H2 的横排结构（2026-09 参考「雷一言」公众号版式重做；`components.h2NumberSize` 56px、`h2NumberWidth` 120px、`h2NumberWeight` 700、`h2LabelSize` 13px、`h2SectionTop` 56px、`h2SectionBottom` 32px、`h2RuleGap` 10、`h2RuleOpacity` 0.76）：

- **编号**：左列，斜体 / 700 字重 / 56px / 主色，**数字带点**（`01.`），Inter 系字体，`display:flex` 左右分栏实现（**不用 float**，合规校验禁止 float）。
- **右列**（`flex:1;min-width:0`）：标题在上（20px / 800 / #1d2129），英文标签在标题下方（13px / 500 / #a1a1aa / 斜体），收尾横线最下。
- **收尾横线**：1px 浅灰（`colors.h2Rule` #d7d8d2、`opacity:0.76`、距标题 10px），**只覆盖标题列的宽度，不延伸到编号下方**。`h2RuleWidth` 设为空字符串即可关掉。
- 中文序号（「一、」）保留原样不加点；阿拉伯序号统一补点。
- 章节留白比其余主题更宽（前 56px、后 32px），用来承托大编号；正文段落不受影响。

> 收尾横线是 **AGI绿专属**（仅 `layout:editorial` 生效），另外三套主题不加，避免视觉语言打架。

## 终端框（terminal block）

macOS 终端风引用框，适合步骤清单、提示词原文、命令流程。输入示例：

~~~json
{"type":"terminal","title":"terminal","tag":"TEXT","lines":["复制链接","↓",[{"text":"让 "},{"text":"AI","mark":true},{"text":" 调用"]}]}
~~~

- 标题栏：36px 高、#fafafa 底、红黄绿三个 10px 圆点（#ff5f57/#febc2e/#28c840）+ 左侧 `title`（等宽 11px 灰）+ 右侧 `tag`（10px / 700 / 主题色 62% 透明度，自动大写；空字符串隐藏）。
- 正文：等宽 13px / 行高 21px / #3f3d38，逐行 `white-space:pre-wrap`，空行保留；runs 只支持 `text/strong/mark`——mark 映射主题色 600 字重（替代参考文章里的紫色高亮），strong 黑粗。
- **滑动自动判断（默认）**：`scroll` 字段不写时，渲染器按手机正文宽度估算正文高度（全角 13px / 半角 7.2px × 21px 行高 + 32px padding），**超过 maxHeight 才自动限高滑动**，短内容保持完整展开，不用人肉判断。自动触发时写一条 warning，说明估算高度并提示手机端实测。
- 想强制就显式写：`scroll:true`（一定滑动）/ `scroll:false`（再长也完整展开）。`maxHeight` 可调（默认 280，最小 80），调大后同样的内容可能不再触发滑动。
- 整框：1px #e3e4e8 边 + `0 12px 30px rgba(31,35,44,0.07)` 投影，白底直角（无圆角），与配图的 10px 圆角区分开。
- 渐变图片框不做（用户明确砍掉），配图保持统一圆角+淡投影。

H3黑粗字加2px绿底线；mark渐变字色、没有底线；普通strong保留黑色加粗；`underline` 给短关键词加2px绿底线（黑粗字，可叠加 strong，token `components.underlineWidth`/`underlineOffset`）。
提示词改成浅绿虚线框，不保留紫色色号。不复制WaytoAGI标识、头像、原创声明及分页空白。

## 配方与Markdown映射

适合叙事教程和长文。用自然段承担叙述，只在必要处插入说明卡；不把所有段落卡片化。

- `##` → heading level2；编号按原文或自动延续；原文或作者给出英文栏目名时写入 `label`（如 `TRIPO`、`TASK`），没有就省略整行标签。
- `###` → heading level3。
- `**短关键词**` / 显式重点 → mark；整句加粗或要求保留黑字 → strong；作者要求「标粗 + 下划线」→ strong 打整句、underline 打短关键词；连续 `>` → 单个 quote；围栏 prompt/代码 → prompt/code；用户描述「终端框/引用框/滑窗提示词」→ terminal（长内容配 scroll:true）。

可运行完整样文 assets/examples/agi-green.json（含 TASK / CONSTRAINT / ACCEPTANCE 三处标签示例）。
