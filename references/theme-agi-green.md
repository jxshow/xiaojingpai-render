# 鲸选AGI绿

基于 way.pdf 的开放阅读节奏，将原AGI紫全部转为用户品牌绿。旧ID agi-purple 仅作为兼容输入。

## Tokens

主色 #2ea250，渐变端点 #09fc3c，正文 #4e5969，黑标题 #1d2129，卡片 #f5faf6，边框 #cfe7d5。来自 tokens.json。

## 组件与骨架

左对齐黑色H1 → 开场段落 → 同一行“01 标题” → 正文/列表/图片 → 浅绿说明/引用 → 提示词 → 鲸选AI署名。
H3黑粗字加2px绿底线；mark渐变字色、没有底线；普通strong保留黑色加粗。
提示词改成浅绿虚线框，不保留紫色色号。不复制WaytoAGI标识、头像、原创声明及分页空白。

## 配方与Markdown映射

适合叙事教程和长文。用自然段承担叙述，只在必要处插入说明卡；不把所有段落卡片化。
## → heading level2，编号按原文或自动延续；### → heading level3；**短关键词** / 显式重点 → mark；整句加粗或要求保留黑字 → strong；连续> → 单个quote；围栏prompt/代码 → prompt/code。
可运行完整样文 assets/examples/agi-green.json。
