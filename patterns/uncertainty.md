# 概率、confidence 与动作阈值

Noul 返回 P(yes)，没有独立 confidence。Choice 的选中项概率与 confidence 是不同量；confidence 描述分布形状，不等于任务上的正确率。[Noul](https://docs.typesafe.ai/primitives/noul)、[Confidence](https://docs.typesafe.ai/confidence)

## 明确方向

先定义 yes 表示什么，再写条件。P(needed) 很低时隐藏，与 P(violation) 很高时标记，方向相反。缺失或非法输出不能默认成负例。

## 上游配置作为起点

| 实现 | 上游设定 | 动作 |
|---|---|---|
| Winnow | P(needed) < 0.1 | 隐藏块；中间区间保留 |
| JevPDF | P(hit) ≥ 0.55 | 显示高亮 |
| softlint | P(violation) ≥ 0.8 | 进入定位步骤 |
| DocJev | P(new document) ≥ 0.5；默认 ±0.1 review | 切页与审阅提示分开 |

这些是作者配置，不是本仓库测得的通用最佳值。源码链接见各配方。

## 阈值评估

在开发/验证样本上比较错误率和自动化覆盖率，确定阈值后固定，再测留出集。考虑实际错误代价，例如误删上下文、漏跑测试、错误降级模型，而不是只看准确率。

随机审计一部分高置信度结果，避免只标模糊样本而漏掉“很自信但错”的案例。[评估流程](../evaluation/README.md)
