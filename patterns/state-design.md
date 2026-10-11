# State：证据、关系与预算

state 是同一请求中所有问题共享的材料。多数任务适合命名 JSON：`query / passage`、`task / tool / blocks`、`pages / number / text`。简单单文本任务用字符串即可。[官方 State](https://docs.typesafe.ai/concepts/state)

## 组织方式

- 给来源、角色与目标材料命名，让问题能够明确引用。
- 保留作判断必需的关系：邻页、当前控件值、diff 的新增/删除标记、近期执行结果。
- 用代码筛掉确定无关的内容，再决定窗口和批次；截断必须记录，不能将部分阅读标成全文阅读。
- rules 放在问题标准中，网页、日志和文档原文作为证据。自然语言说明并不构成防注入证明。
- 问题 ID 不发给模型；`q_page_2` 这个名字不能代替正文明确说明第 2 页。[API](https://docs.typesafe.ai/api)

## 引用错位

先用稳定 ID 指向材料。发现目标与背景混淆时，可在 structured instructions 中直接附目标短文本，state 留共享背景。JevPDF 在行检索中采用这个做法；需要比较额外 token 与定位改善。[JevPDF 源码](https://github.com/kylemclaren/jevpdf/blob/7f230370961c4a8e2f8b19c1729085b852124448/src/lib/jev-config.ts#L47)

## 预算

2026-10-11 核查的官方限制：state 加所有问题不超过 64k tokens；state 加最长单问不超过 32k。字符数换算只是估计，中文、代码和 OCR 需单独测量。[Models](https://docs.typesafe.ai/models)

配方：[上下文筛选](../recipes/01-context-filter.md)、[文档边界](../recipes/03-document-boundary.md)、[证据定位](../recipes/04-evidence-localization.md)。
