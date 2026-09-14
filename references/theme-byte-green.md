# 鲸选字节绿

## Tokens

来源为小鲸排本地源码 byte-green：主色 #2ea250、荧光端点 #09fc3c、正文 #4e5969、标题 #1d2129。数值从 assets/tokens.json 读取。
正文改用白底；保留原核心图形，避免把编辑器 #f8faf9 大底色和 padding 复制进微信。

## 可复用组件

title → 居中黑字，下半幅32%高的 #2ea250→#09fc3c 原生CSS渐变；纯色稳妥版换4px绿边。
H2 → 居中渐变绿签，白字，6px圆角；有实色背景作为渐变丢失时的兜底；自动编号关闭（用户原编号不删除）。
H3 → 黑字 + 随文字长度的 2px 实色绿底线；不是整行宽条，也不使用渐变背景模拟唯一边框。
mark → 深绿到鲜绿的重点字色，无底线；默认逐字着色，continuous为显式可选。普通 strong 只加粗。H3底线不与mark混用。
quote → 浅绿底 + 3px 左边框，一个 quote 的所有段落在一个 section 内。
callout → 浅绿圆角说明卡。prompt → 浅绿虚线卡。保持正文开放留白，不把整篇包进绿色卡片。

## 完整骨架

根 section（白底、padding:0、16px） → 可选 title → paragraph → H2 → 多个正文/图片 → quote → H3 → list/prompt/code → signature。
无 title 就从首个真实正文块开始，不生成空标题或顶部空白。

## 配方

工具清单以 H2 绿签分组，条目用 H3；教程 H2 标阶段，步骤用真实有序列表；prompt 卡只装可复制提示词，不装说明性全文。

## Markdown 映射

# → title（是否显示由 showTitle 控制）；##/### → heading level2/3；段落 → paragraph；**短关键词** / ==重点== → mark；整句加粗或要求保留黑字 → strong；连续 > → 一个 quote.paragraphs；```prompt → prompt；其他围栏 → code；图片 → image。
可运行的组件样文：assets/examples/byte-green.json。渲染器组件函数比另抄几十份 HTML 模板更优先，避免样式漂移。
