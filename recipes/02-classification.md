# 单标签与多标签分类

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

把反馈、工单或文本记录归类；一条只能一个类别时用 Choice，可以同时有多个标签时每标签一个 Noul。

## 请求

[完整 JSON](../examples/classification.json) 将退款工单放在 `ticket`，用 Choice 区分资格与状态，用独立 Noul 判断是否表达时间压力。命名字段比整条字符串更容易追踪来源。

## 判断与选项

类别写用途与相邻类别的排除边界。`other` 是已知类别之外，`insufficient_evidence` 是目标不明确。类别 ID 应稳定；只改显示文案时仍记录 criteria 版本。

classifier.dev 的简单单标签实现将名称对应 null，复杂业务边界可参考本例补充描述。多标签 Nouls 的概率各自成立，不受 Choice 的总和为 1 约束。

## 结果处理

先检查 choice 在候选集中，再记录 `probabilities[choice]` 和 `confidence`。证据不足、other 或低确定性进入审阅。阈值应由分类数据确定；不在示例里假定 0.8 总是合适。

类别与 urgency 独立评估；执行代码组合，不把 urgency 当类别问题已经看见的结果。

## 验证与局限

测每类 precision/recall、混淆矩阵、审阅覆盖率与选项顺序稳定性。分类可能正确但后续流程错误，因此同时测队列分流。中文与英文输入分开测。

## 来源

[classifier.dev 问题构造](https://github.com/mrmps/classifier-dev/blob/629df75922526a219154a6f3b5ec6de6f77a3516/src/jev.ts#L282)、[jev-align 多标签](https://github.com/sutro-sh/jev-align/blob/520aec345806722dc204780e3631c639c142474b/src/jev_align/jev.py#L115)、[官方 Choice](https://docs.typesafe.ai/primitives/choice)。
