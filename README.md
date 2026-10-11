# Jev Cookbook

**Jev 实用方法与请求设计。** 按场景整理 `state`、`questions`、`criteria` 与结果处理，附可复制的 JSON、源码出处和验证记录。

Jev Cookbook collects practical recipes for typed decisions with TypeSafe Jev: request design, state construction, criteria, uncertainty handling, and evaluation. Examples are synthetic and source-informed; model quality has not been measured here yet.

## 从一个配方开始

| 场景 | 配方 | 请求示例 | 借鉴实现 |
|---|---|---|---|
| 工具输出太长，筛选需要保留的块 | [上下文筛选](recipes/01-context-filter.md) | [JSON](examples/context-filter.json) | Winnow |
| 单个类别或多个标签 | [分类与标签](recipes/02-classification.md) | [JSON](examples/classification.json) | classifier.dev / jev-align |
| 混合 PDF 包分类与拆分 | [文档边界](recipes/03-document-boundary.md) | [JSON](examples/document-boundary.json) | DocJev |
| 按含义搜索并定位原文 | [证据定位](recipes/04-evidence-localization.md) | [JSON](examples/evidence-localization.json) | JevPDF |
| 自然语言规则检查代码变更 | [语义规则检查](recipes/05-semantic-lint.md) | [JSON](examples/semantic-lint.json) | softlint |
| 模型能力与推理深度分开选择 | [模型路由](recipes/06-model-routing.md) | [JSON](examples/model-routing.json) | jev-codex-router / Jev Ultrafast |
| 改善定义、评估阈值 | [请求改写与评估](recipes/07-request-evaluation.md) | [JSON](examples/rag-screen.json) | jev-align / Tenbin |

## 快速使用

想从一段决策描述开始？试用 [请求转换器 demo](demo/README.md)：输入问题与材料，生成二元判断、单选分类、有序评分或组合请求。浏览器本地运行，支持可修改的拆分草稿、选项和等级，以及 JSON 复制 / 下载。

```sh
python -m http.server 8075 --bind 127.0.0.1 --directory demo
```

然后打开 `http://127.0.0.1:8075`。转换器使用规则模板，生成的是请求草稿，不调用 Jev、不返回模型答案。

需要 Python 3.10+；脚本只使用标准库。下面两条命令离线运行，不会调用 API：

```sh
python scripts/validate.py
python scripts/run_recipe.py examples/document-boundary.json
```

第二条打印将要发送的请求。要实际调用，先设置 `TYPESAFE_API_KEY`，再显式加 `--send`：

```powershell
# Windows PowerShell
$env:TYPESAFE_API_KEY = "YOUR_KEY"
python scripts/run_recipe.py examples/document-boundary.json --send --output runs/document-boundary.json
```

```sh
# macOS / Linux
export TYPESAFE_API_KEY="YOUR_KEY"
python scripts/run_recipe.py examples/document-boundary.json --send --output runs/document-boundary.json
```

`--send` 会调用收费 API。示例固定 `jev-1.13.0`，响应记录包含实际模型与耗时；输出已有文件时需 `--overwrite`。`runs/`、`.env` 被 Git 忽略，脚本从环境变量取 key，不读取 `.env`。

## 通用设计方法

- [State：证据、关系与预算](patterns/state-design.md)
- [Criteria：覆盖范围、边界与问题类型](patterns/criteria-design.md)
- [原子问题与代码组合](patterns/atomic-decisions.md)
- [概率、confidence 与动作阈值](patterns/uncertainty.md)
- [版本、缓存、失败路径与调用预算](patterns/runtime.md)

裸 HTTP 请求的核心结构为：

```json
{
  "model": "jev-1.13.0",
  "state": {"message": "Please check my refund status."},
  "questions": {
    "asks_refund_status": {
      "type": "noul",
      "instructions": "Does `message` ask about the status of an existing refund request?"
    }
  }
}
```

官方选项字段是 **`criteria`**；Choice 用映射、Score 用有序数组、Noul 可定义 true / false。[官方 API](https://docs.typesafe.ai/api)

## 来源与验证状态

方法整理自官方文档与作者源码，核查日期 **2026-10-11**。每个配方标明它的证据级别：

| 标记 | 含义 |
|---|---|
| 源码核查 | 阅读了具体实现与精确 commit |
| 离线检查 | 示例 JSON、类型、显式引用、文档链接通过仓库检查 |
| API 实测 | 有真实服务返回，需保存运行信息才能标注 |
| 效果评估 | 有留出数据、指标和原始结果才能标注 |

**首版所有配方为“源码核查 + 离线检查”。** 没有把作者的演示数字标成本站实测，也没有调用付费 Jev。本轮 classifier.dev 的匿名合成请求返回 HTTP 403，记录在 [服务探测](research/classifier-dev-smoke.json)。

进一步阅读：[产品调研](research/2026-10-11-products.md)、[源码快照索引](sources/README.md)、[精确来源清单](sources/snapshots.json)、[评估流程](evaluation/README.md)。

## 贡献

按 [配方模板](templates/recipe.md) 添加场景，遵循 [贡献说明](CONTRIBUTING.md)。为原始实现保留来源链接；新的方法与阈值必须标注验证程度。

MIT 许可覆盖本仓库自行编写的文档与示例；引用项目、服务和模型保留其自己的条款。Jev Cookbook 是独立社区项目。
