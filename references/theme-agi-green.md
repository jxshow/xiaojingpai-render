# 鲸选AGI绿

基于 way.pdf 的开放阅读节奏，章节标题采用鲸选AI 长期在用的栈式大编号版式；原AGI紫全部转为用户品牌绿。旧ID agi-purple 仅作为兼容输入。

## Tokens

主色 #2ea250，渐变端点 #09fc3c，正文 #4e5969，黑标题 #1d2129，英文标签 #a1a1aa，卡片 #f5faf6，边框 #cfe7d5。来自 tokens.json。

## 组件与骨架

左对齐黑色H1 → 开场段落 → 栈式大编号章节（48px 绿色编号 / 可选英文标签 / 20px 黑粗标题 / 1px 灰色收尾横线）→ 正文/列表/图片 → 浅绿说明/引用 → 提示词 → 鲸选AI署名。

H2 的栈式结构（`components.h2NumberSize` 48px、`h2LabelSize` 10px、`h2SectionTop` 56px、`h2SectionBottom` 32px、`h2LabelGap` 5px、`h2RuleWidth` 1px、`h2RuleGap` 10、`h2RuleOpacity` 0.76）：

- 编号：48px / 900 字重 / 主色 / `line-height:1` / `letter-spacing:-2px` / **斜体**（`h2NumberStyle`），单独一行，两位补零。
- 英文标签：可选，10px / 500 字重 / #a1a1aa / 斜体 / `letter-spacing:1px`（`h2LabelTracking`），在编号与标题之间。原文给出 `label` 才输出，不自动补造。
- 标题：20px / 800 字重 / #1d2129 / `letter-spacing:0.5px` / `line-height:1.4`，紧接标签下方。
- **收尾横线**：标题下方 1px 通栏浅灰（`colors.h2Rule` #d7d8d2、`opacity:0.76`、距标题 `h2RuleGap` 10px），给栈式标题一个视觉收口。`h2RuleWidth` 设为空字符串即可关掉。
- 章节留白比其余主题更宽（前 56px、后 32px），用来承托大编号；正文段落不受影响。

> 收尾横线是 **AGI绿专属**（仅 `layout:editorial` 生效），另外三套主题不加，避免视觉语言打架。

H3黑粗字加2px绿底线；mark渐变字色、没有底线；普通strong保留黑色加粗；`underline` 给短关键词加2px绿底线（黑粗字，可叠加 strong，token `components.underlineWidth`/`underlineOffset`）。
提示词改成浅绿虚线框，不保留紫色色号。不复制WaytoAGI标识、头像、原创声明及分页空白。

## 配方与Markdown映射

适合叙事教程和长文。用自然段承担叙述，只在必要处插入说明卡；不把所有段落卡片化。

- `##` → heading level2；编号按原文或自动延续；原文或作者给出英文栏目名时写入 `label`（如 `TRIPO`、`TASK`），没有就省略整行标签。
- `###` → heading level3。
- `**短关键词**` / 显式重点 → mark；整句加粗或要求保留黑字 → strong；作者要求「标粗 + 下划线」→ strong 打整句、underline 打短关键词；连续 `>` → 单个 quote；围栏 prompt/代码 → prompt/code。

可运行完整样文 assets/examples/agi-green.json（含 TASK / CONSTRAINT / ACCEPTANCE 三处标签示例）。
