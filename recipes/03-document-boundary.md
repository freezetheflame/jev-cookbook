# 文档分类与边界检测

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

混合 PDF 包包含多份文档，需要类别与连续页段。解析/OCR 先在代码或独立服务完成，Jev 接收文本。

## 请求

[完整 JSON](../examples/document-boundary.json) 按页保留页号、文本、空页状态。第 2 页一个类别 Choice，另一个 Noul 判断是否开始新文档。

## 判断与选项

类别看文档用途，边界看编号、标题、分页与连续性。示例两页都应属于 invoice，但编号不同，可能必须拆成两份。类别相同不能代替边界判定。

问题明指第 2 页；问题 ID 本身不参与推理。长包使用保留邻页的窗口，窗口拼接应覆盖每页恰好一次。

## 结果处理

DocJev 上游默认边界概率 ≥ 0.5 切页，靠近阈值 ±0.1 时提示 review；审阅标记和页段预测分开保存。首页确定开始文档，可由代码直接处理。

未知输出或 OCR 不可读应报错或进入 review。不能把错误页静默删除；不得将超限后部分输入标为整份文档分类。

## 验证与局限

测类别准确率、边界 precision/recall、整包精确拆分率与每页覆盖。加入同类别相邻文档、续页没有标题、附件、空页、OCR 错字。

## 来源

[DocJev page state](https://github.com/jerryjliu/docjev/blob/c7abe276a970605feb9cb8b27513365b6c10726e/src/jev_docs/engines/base.py#L23)、[两类问题](https://github.com/jerryjliu/docjev/blob/c7abe276a970605feb9cb8b27513365b6c10726e/src/jev_docs/engines/jev.py#L144)、[review 说明](https://github.com/jerryjliu/docjev#rules-and-results)。
