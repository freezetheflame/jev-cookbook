# Criteria：覆盖范围、边界与问题类型

| 判断 | 类型 | criteria 结构 |
|---|---|---|
| 恰好一个类别 | Choice | 类别 ID → 描述的映射 |
| 可以多个标签成立 | 每个标签一个 Noul | 可选的 true / false 描述 |
| 有序程度 | Score | 2–10 个从低到高的描述 |

Choice 最多 255 项。名称足以表达含义时可以用 null；有具体混淆时增加描述。[Choice](https://docs.typesafe.ai/primitives/choice)

## 写清类别边界

描述可使用自定义 `what / not_for / examples` 对象，分别说明覆盖、排除和案例。先定位错误再增加标准；盲目加长文本可能引入矛盾。固定分类集应覆盖输入范围，动态操作集则由代码先去掉当前不可执行的动作。

`other` 表示超出分类范围，证据不足表示不能判定；业务需要时分成两项，或另问证据充分性。二者不应默认合并。

## Score 的等级

等级应对应可观察的情况，保持同一维度。不要仅使用“低 / 中 / 高”。Score 返回从 0 到 `levels - 1` 的概率加权位置；归一化后也不是正确概率。[Score](https://docs.typesafe.ai/primitives/score)

## 稳定性

保持 key 与含义不变，重排 Choice 项、加入语义邻近类别、改写描述，观察答案与动作是否变化。[官方已知局限](https://docs.typesafe.ai/model-jaggedness/jev-1.13)

配方：[分类与标签](../recipes/02-classification.md)、[请求改写与评估](../recipes/07-request-evaluation.md)。
