# 决策 → Jev 请求转换器

这是一个最小的离线 demo，把自然语言决策和材料转换成 Jev 请求草稿。支持 Noul、Choice、Score，以及多个独立问题的组合。**没有调用 LLM 来理解句子，也没有调用 Jev 来判断材料。** 自动模式只是词语和分句规则；模糊输入会要求补充。

## 打开试用

直接用浏览器打开 [index.html](index.html)，无需安装依赖。也可以在仓库根目录运行：

```sh
python -m http.server 8075 --bind 127.0.0.1 --directory demo
```

打开 `http://127.0.0.1:8075`。点击“退款判断”“工单分类”“严重程度”或“三个独立决策”载入合成材料，再修改问题、材料、选项或等级，点击“生成请求草稿”。可查看 JSON 和转换依据，复制或下载结果。编辑输入后旧输出失效，避免误用过期请求。

页面的数据处理全部在浏览器本地完成，没有持久化、分析统计或网络调用；来源链接只在你点击时打开。下载的是 Jev 请求，转换器配置与检查提示不会混入请求。

## 转换规则

| 模式 | 输入要求 | 生成结构 |
|---|---|---|
| 二元 Noul | 一个明确的是否问题；可自定义两侧边界 | `type: noul` + true / false criteria |
| 单选 Choice | 2–255 个候选项；每行 `名称 | 定义` | 候选项映射；稳定键 `option_1` 等 |
| 评分 Score | 2–10 个有序等级，按低到高排列 | 有序 criteria 数组，索引从 0 开始 |
| 组合拆分 | 用分号、换行等分开独立决策；可修改或添加问题 | 共享 state，每个原子问题有独立类型 |
| 自动建议 | “是否 / 类别 / 评分”等明确词语 | 建议类型或分句；歧义时停止，请你选择 |

材料统一写入 `state.material`。文本直接保存；JSON 对象或数组保留内部结构。决策描述写入 `instructions.task`，并用 `instructions.evidence` 显式引用材料。候选和等级必须由使用者提供，转换器不会猜测业务分类体系。只有问题数量、边界数量、重复标签、JSON 格式等机械规则能自动检查；是否问题写得正确、分类是否互斥、等级是否单调仍需人审核。

在问题中用反引号显式引用字段时，填写完整路径，例如 `material.message`；不存在的引用会拒绝生成。切换类型只改变请求结构，不自动改写你的任务含义；问题用词与类型不匹配时会提醒检查。

Noul 默认采用“有明确证据支持是才为 true；否或证据不足为 false”的边界。若需要把“未知”作为独立结果，请改成 Choice。组合界面共享分类选项和评分等级；不同任务需要不同标准时可分别生成，或在编程接口每个 atom 上传入 `options` / `levels`。二元任务可在任务描述里写清边界，编程接口也支持 atom 的 `positive` / `negative`。

**同一个请求里的问题不读取其他问题的答案。** 有先后依赖的流程要分两次请求并用代码组合。这里不生成动作阈值：Jev 输出的概率、Choice / Score 的 confidence 和调用方的执行阈值是不同的事。Score 是程度评分，不是置信度。默认型号固定为 `jev-1.13.0`。

规则依据：[State](../patterns/state-design.md)、[Criteria](../patterns/criteria-design.md)、[原子问题](../patterns/atomic-decisions.md)、[不确定性](../patterns/uncertainty.md)、[分类配方](../recipes/02-classification.md)、[模型路由](../recipes/06-model-routing.md)。原始来源及 commit 见这些文档的引用。转换器为本仓库自行实现的模板，并非上游已有的通用自然语言转换算法。

## 程序接口和 CLI

Node.js 20+，无 npm 依赖。`converter.js` 同时支持浏览器全局 `JevConverter` 和 CommonJS：

```js
const { generate } = require('./demo/converter.js');
const { request, warnings } = generate({
  mode: 'noul',
  decision: '判断客户是否提出了退款申请。',
  material: '请退还重复扣除的款项。',
  positive: '客户明确要求退还已支付款项。',
  negative: '没有明确提出退款申请，包括询问政策或查询已有退款进度。'
});
```

CLI 从 UTF-8 文件或 stdin 读取转换器配置，只把请求 JSON 输出到 stdout；提示写入 stderr。参考 [配置示例](sample-input.json)。PowerShell 直接读取文件可避免管道编码影响中文：

```powershell
node demo/convert.cjs demo/sample-input.json
```

macOS / Linux：

```sh
node demo/convert.cjs < demo/sample-input.json
```

下载请求后可使用 [现有 runner](../scripts/run_recipe.py) 离线预览。只有明确加 `--send` 才会调用收费 API；demo 本身没有发送功能。

## 验证

```sh
node --test demo/converter.test.cjs
python demo/check_schema.py
python scripts/validate.py
```

覆盖类型建议、歧义拒绝、候选边界、评分范围、JSON 材料、独立拆分、自定义二元定义和生成请求的现有结构校验。**验证级别：离线检查；没有 API 实测或模型效果评估。** 测试不能证明 Jev 的实际判断正确，也不能证明语法拆分在所有自然语言输入上正确。
