# 贡献 Jev 配方

一个配方应回答明确的软件判断问题，并提供：

1. 场景和判断单位；说明哪些输入事实来自代码或用户。
2. 完整 `model / state / questions` JSON，放在 `examples/`。
3. instructions / criteria 的含义、边界，以及为何选择该类型。
4. 结果处理、缺失输出、低确定性和服务失败的行为。
5. 精确源码 commit 或官方文档；标注核查日期。
6. 验证状态、局限、建议测量的指标。

复制 [模板](templates/recipe.md)，将入口加到 [README](README.md)。示例尽量使用合成文本，标准优先用英语以匹配当前已核查的模型说明，中文内容需单独评估。

提交前运行：

```sh
python scripts/validate.py
```

校验包括 JSON 结构、显式 state 引用、文档本地链接与 snapshot commit。它不能证明判断正确、token 预算准确或服务端接受请求。

标注数据应放在 `evaluation/`；真实日志和 API 返回默认放在被忽略的 `runs/`。gold 留在评估侧，不进入 state。公开指标必须附数据划分、问题版本、实际模型版本、阈值与测量范围。

来源代码若需要直接复制，先检查原许可并保留要求的声明；优先自行编写演示请求并链接原实现。
