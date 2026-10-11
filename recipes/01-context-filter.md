# 上下文筛选

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

编码 agent 的工具输出很长，需要选择哪些块进入执行模型上下文。判断单位是一个输出块，先由代码切块和排除确定无关材料。

## 请求

[完整 JSON](../examples/context-filter.json) 包含 `task`、`tool`、稳定 ID 的 `blocks`。每块一个 Noul，问题明确引用目标；另问整个输出是否报告工具执行错误。示例刻意区分“源代码有缺陷”和“Read 工具本身失败”。

## 判断与选项

true 表示完成任务需要阅读这个块，false 表示可以不读。结构化标准覆盖典型证据、无关内容和容易混淆的同文件背景。不能仅因与任务同文件就判必须保留。

## 结果处理

Winnow 上游默认 P(needed) < 0.1 才隐藏，中间区间也保留；错误概率 ≥ 0.5 时保留整个输出。未知、未评估、超预算和服务失败时保留材料。原文在本地可找回，先 shadow 再启用删除。

这些阈值没有在本仓库测过。动作代码还应要求错误检测问题成功返回，避免缺失结果变成“没有错误”。

## 验证与局限

测误删必要块的比例与文本节省，而不只看模型准确率。任务摘要丢失关键意图、切块切断定义、截断日志，都可能导致错误隐藏。标注应包含模型没有直接引用但确实需要读的背景。

## 来源

[Winnow state](https://github.com/GhalebDweikat/winnow/blob/4547a81b88ac59a902bad7b0006137c7d4147aeb/sidecar/src/winnow/hooks.py#L131)、[标准](https://github.com/GhalebDweikat/winnow/blob/4547a81b88ac59a902bad7b0006137c7d4147aeb/sidecar/src/winnow/questions.py#L43)、[策略](https://github.com/GhalebDweikat/winnow/blob/4547a81b88ac59a902bad7b0006137c7d4147aeb/sidecar/src/winnow/policy.py#L23)。
