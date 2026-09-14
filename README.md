# 鲸选AI · 公众号排版 Skill

为鲸选AI定制的独立公众号排版 Skill。保留原文内容，以结构化文章输入生成品牌版 HTML、纯色兼容版和可复制预览。

## 模板

| 主题 | ID | 特点 |
| --- | --- | --- |
| 字节渐变绿 | `byte-green` | 品牌渐变 `#2ea250 → #09fc3c`、清晰标题层级 |
| AGI绿 | `agi-green` | 轻量阅读、绿色重点与连续引用；旧 `agi-purple` ID 兼容映射 |
| 鲸选杂志绿 | `magazine-green` | 杂志封面、目录卡片、简化中文章节 |
| 鲸选Pro蓝 | `pro-blue` | 蓝色斜体章节、黑色加粗重点、独立原图数字徽章 |

各主题示例在 [assets/examples](assets/examples)，下载仓库后可直接用浏览器打开 [assets/theme-previews](assets/theme-previews) 中对应的 `preview.html`。

Pro蓝的 [1、2、3徽章](assets/pro-blue/badges) 使用用户提供的原始 JPG，不裁切、不改色、不重画。生成文章时自动复制所需图片到输出目录；第4节起没有对应原图时显示普通蓝色数字并提醒，不循环复用前三张。

## 使用

完整 Skill 入口：[SKILL.md](SKILL.md)。输入规范：[references/input-and-ir.md](references/input-and-ir.md)。

需要 Node.js 18+，HTML 渲染器无第三方依赖。模型先把 Markdown、Word、PDF 或文本整理成符合输入规范的 `article.json`；CLI 不直接解析任意原始文档。

在仓库根目录运行：

```sh
node scripts/render_article.mjs assets/examples/pro-blue.json --out output/pro-blue
node scripts/test.mjs
```

输出目录必须是未生成过的新目录，避免覆盖原稿。主要输出：

- `preview.html`：浏览器预览与复制按钮。
- `article.html`：品牌渐变版。
- `article-compatible.html`：纯色兼容版；原图中的渐变不改变。
- `article.txt`：完整纯文本。
- `report.json`：警告和发布前需要处理的事项。
- `media/`：文章使用的本地图片（如果有）。

## 发布前须知

本地预览成功不等于微信公众号后台已验证通过。图片必须上传并换成有效 HTTPS 地址；Pro蓝章节徽章可通过 `heading.badgeSrc` 指定地址。复制后仍需在公众号后台检查图片、保存结果及手机预览。

本仓库仅包含 Skill、模板样文及必要品牌资产，不包含原始参考 PDF/MHTML、工作备份、网站工程或公众号登录资料；不执行网站部署或公众号发布。

## 来源与许可

基于 [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill) 的工作流定制；保留上游 [LICENSE](LICENSE) 与作者声明，Word 提取脚本沿用上游。定制渲染器、品牌主题与原图徽章整合记录见 [references/sources.md](references/sources.md)。

品牌横幅和数字徽章为用户提供的独立图片资产，不将上游代码许可自动视为这些图片的第三方使用授权。
