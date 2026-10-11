# 模型与推理深度路由

状态：源码核查 + 离线检查。核查日期：2026-10-11。

## 适用场景

决定当前剩余工作需要的执行模型能力与推理深度，再由代码映射到实际可用模型。

## 请求

[完整 JSON](../examples/model-routing.json) 包含 task、phase、recent_result；两个 Choice 分别选择能力和深度。候选是抽象档位，不绑定不断变化的厂商模型名单。

## 判断与选项

能力按工作性质定义：已知机械操作、边界明确的实现、跨文件调查/设计。深度按未解决因素定义。描述具体条件，不能从用户消息长度推断任务简单。

可再增加租期 Choice，但租期何时失效由代码维护，错误、任务变化、上下文压缩后应重新判断。缓存代价作为足够能力之间的权衡，不能成为硬性能力上限。

## 结果处理

代码将档位映射到当前可用模型与受支持的 effort，检查组合合法；未知或失败走配置的固定回退模型。effort 是执行模型的参数，不能放到 Jev 顶层当生成参数。

需要硬约束的权限、不可执行动作与 mandatory policy 由代码实现，不仅依赖语义判断。各 Choice 独立，不保证输出天然组合一致。

## 验证与局限

测最终任务成功率、错误降级、修正轮数、总成本与缓存重读成本。路由 HTTP 成功并不能说明最终任务质量保持。

## 来源

[四个独立 router 问题](https://github.com/0xNatoshi/jev-codex-router/blob/8701ef788aa8cb0948f299538747fb01029d32b8/server/routing_policy.py#L70)、[浏览器 operation 与目标组合](https://github.com/browser-use/jev-ultrafast/blob/1231850a0bf1a0c0341fe408ef1668dbbfdfac46/jev_ultrafast/model.py#L81)、[官方 API](https://docs.typesafe.ai/api)。
