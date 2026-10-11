# 请求改写与阈值评估

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

已有一个判断任务，需要找到更清楚的 state、instructions、criteria，并确认自动动作阈值。

## 请求

[RAG 示例 JSON](../examples/rag-screen.json) 将证据支持、相关程度与嵌入指令拆成三问。它区分“文本讨论攻击”与“文本指令阅读 agent 执行攻击”；仅提到攻击词汇不能决定标签。

## 改写流程

1. 冻结 baseline 请求，在标注集保存 UID 与原始输出。
2. 同时挑模糊样本和随机审计样本，避免只看到低置信度错误。
3. 根据错误改写某一部分，例如相邻类别边界；每次只动一个变量。
4. 在开发/验证集比较，同 UID 配对；随后固定定义和阈值。
5. 最后测留出集，保存实际模型、模板 hash、耗时与错误。

jev-align 使用 GEPA 提议改定义，人工接受/拒绝；其生产调用仍使用同一个 Jev。Tenbin 提供离线 lint 与评估模板。

## 结果处理

阈值决定“保留 / review / 删除”等动作，放在代码中。多维判断的组合或权重也由代码计算。更自信或训练分数更高不等于留出集更好。

## 验证与局限

按照 [评估流程](../evaluation/README.md) 报告自动覆盖率、错误率和实际动作后果。标注集、请求构造与 gold 必须隔离；不能通过把答案送入 state 获得虚假的准确率。

## 来源

[jev-align task 定义](https://github.com/sutro-sh/jev-align/blob/520aec345806722dc204780e3631c639c142474b/src/jev_align/models.py#L18)、[实际请求](https://github.com/sutro-sh/jev-align/blob/520aec345806722dc204780e3631c639c142474b/src/jev_align/jev.py#L100)、[Tenbin](https://github.com/simota/tenbin)。
