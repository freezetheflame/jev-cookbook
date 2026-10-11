# 原文证据定位

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

自然语言检索 PDF 或资料中的具体证据，返回原文位置供用户检查。

## 请求

[完整 JSON](../examples/evidence-localization.json) 的 state 共享 query 和 page_text；每问在 structured instructions 中带目标行自身文本。局部目标材料可以放在问题里，避免只引用索引而误用邻行。

## 判断与选项

问目标行是否包含答案证据，背景页只帮助解释表头或续句。false 排除“只是同话题”“只是标题”“只是答案附近”。语义相关不等于回答问题。

同批各行独立问，不用一个 Choice 互相竞争；文档可能有多处答案。

## 结果处理

JevPDF 上游高亮门限为 P(hit) ≥ 0.55；没有命中时可展示最多三条 ≥ 0.3 的近似结果。二者应在界面区分，不能把近似提示当确定答案。

代码保持 span ID 与原文位置映射，缺失输出保留为未评估状态。缓存包含文件 hash、抽取版本、问题版本、query 和模型版本。

## 验证与局限

测精确定位、邻行误报、答案召回与每页请求成本。表格、跨行句子、多栏 OCR 是重要边界；必要时扩大目标到 span，避免要求单行独立表达原本跨行的事实。

## 来源

[JevPDF 目标行与参数](https://github.com/kylemclaren/jevpdf/blob/7f230370961c4a8e2f8b19c1729085b852124448/src/lib/jev-config.ts#L47)、[构造请求](https://github.com/kylemclaren/jevpdf/blob/7f230370961c4a8e2f8b19c1729085b852124448/src/lib/jev.ts#L91)。
