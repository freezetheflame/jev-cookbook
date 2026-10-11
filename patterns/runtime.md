# 版本、缓存、失败路径与调用预算

## 版本与缓存

示例固定 `jev-1.13.0`；试用可改 `jev-latest`。记录响应实际 model，已校准阈值的系统升级后重新评估。缓存键包含 state、问题定义版本和实际模型版本；模板变化不能复用旧缓存。[Models](https://docs.typesafe.ai/models)

## 调用选项

HTTP schema 核心是 `model / state / questions`。官方文档未列出 temperature、top_p、max_tokens、reasoning_effort 等生成参数；模型路由中的 effort 是下游执行模型配置。[API](https://docs.typesafe.ai/api)

在客户端设置 timeout、重试、批次预算与并发。429/暂时性错误适合有上限的退避，校验错误需修请求。示例 runner 单次调用，不自动重试；可在具体产品中按总时限设计重试。

## 失败路径

按照动作后果选择明确行为：筛选失败保留文本，测试选择失败运行更多测试，模型路由失败走配置的固定模型。不能把 HTTP 200、合法类型或服务 fallback 当质量证明。

响应应校验问题集合、类型、类别 membership 与概率范围；派生决策不能消费缺失答案。

## 并发

限额会动态改变；控制请求数之外还要控制 token 速率。不要把旧项目的源码注释当作今日服务限额。批量问题共享 state，但所有问题仍消耗预算。

来源：[模型与限流说明](https://docs.typesafe.ai/models)、[Winnow policy](https://github.com/GhalebDweikat/winnow/blob/4547a81b88ac59a902bad7b0006137c7d4147aeb/sidecar/src/winnow/policy.py#L23)。
