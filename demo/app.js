/* No persistence, telemetry, API keys, or requests to external services. */
'use strict';
const $ = id => document.getElementById(id);
let mode = 'auto', result = null;
const presets = {
  refund: { decision: '判断这条客户消息是否提出了退款申请。', material: '昨天购买的订阅扣了两次款，请把重复扣除的一笔退回原支付账户。', mode: 'noul', positive: '客户明确要求退还已支付款项，包括重复扣款。', negative: '只询问退款政策、追问已有退款进度，或没有明确提出退还款项的要求。' },
  category: { decision: '判断这条客户消息属于哪个类别。', material: '付款后一直没有收到订单确认，账户里也查不到订单，麻烦核实。', mode: 'choice', options: '退款申请 | 明确要求退还已支付款项\n订单查询 | 查询下单、订单状态、确认或履约信息，且没有提出退款申请\n技术故障 | 报告产品功能异常，且不是订单状态查询或退款申请\n其他或证据不足 | 不符合以上定义，或缺少足够的分类依据' },
  severity: { decision: '给这段故障报告的严重程度评分。', material: '支付接口从上午开始全部超时，商家无法收款，没有备用通道。目前没有报告资金被扣除或丢失。', mode: 'score', levels: '无影响：功能正常，仅询问信息\n轻微：局部异常，但有可用替代路径，核心业务可以继续\n严重：核心业务不可用，没有替代路径，尚无持续资金损失的明确证据\n紧急：核心业务不可用，且有持续资金损失的明确证据' },
  compound: { decision: '判断工单属于哪个类别；判断是否需要人工升级处理（核心业务中断且无替代路径时升级，其他情况或证据不足时不升级）；给故障严重程度评分。', material: JSON.stringify({ message: '付款接口已中断两小时，所有商家无法收款。值班团队没有备用通道，请尽快联系工程师。', context: { workaround: '无', reported_fund_loss: '未报告' } }, null, 2), materialFormat: 'json', mode: 'compound', options: '支付故障 | 收款、付款或结算功能异常\n账户问题 | 登录、权限或个人资料的问题，不属于支付故障\n其他或证据不足 | 不属于以上类别，或无法判断', levels: '无影响：核心业务正常\n轻微：局部异常，有可用替代路径\n严重：核心业务中断，没有替代路径，尚无持续资金损失的明确证据\n紧急：核心业务中断，且有持续资金损失的明确证据' }
};
const help = {
  auto: '通过“是否 / 类别 / 评分”等词建议类型；含义不明确时会请你补充。',
  noul: '适合一个可以明确回答“是 / 否”的决策。默认把证据不足归入 false，可修改边界。',
  choice: '适合互斥的单选分类。每行一个候选项，推荐补充边界和“其他 / 证据不足”。',
  score: '适合有顺序的程度判断。等级需要明确锚点，返回的 score 可以是小数。',
  compound: '用分号或换行分开不同决策。拆分只是语法建议，请检查每项含义及独立性。'
};
function invalidate() {
  result = null;
  $('copy').disabled = $('download').disabled = true;
  $('status').textContent = '输入已变更';
  $('output').textContent = '输入已变更，请重新生成请求。';
  $('review').hidden = true;
  $('steps').replaceChildren(); $('question-summary').replaceChildren();
}
function showSettings(types) {
  $('binary-settings').hidden = !types.includes('noul') || types.length > 1 || mode === 'compound';
  $('choice-settings').hidden = !types.includes('choice');
  $('score-settings').hidden = !types.includes('score');
}
function setMode(next) {
  mode = next;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $('mode-help').textContent = help[mode];
  $('atoms-panel').hidden = mode !== 'compound';
  showSettings(mode === 'compound' || mode === 'auto' ? ['noul','choice','score'] : [mode]);
  if (mode === 'auto') $('binary-settings').hidden = false;
  if (mode === 'compound') rebuildAtoms();
  invalidate();
}
function addAtom(atom = { type: 'noul', task: '' }) {
  const row = document.createElement('div'); row.className = 'atom';
  const head = document.createElement('div'); head.className = 'atom-head';
  const select = document.createElement('select'); select.setAttribute('aria-label', '独立问题类型');
  ['noul','choice','score'].forEach(type => { const o = document.createElement('option'); o.value = o.textContent = type; select.append(o); });
  select.value = atom.type;
  const remove = document.createElement('button'); remove.textContent = '移除'; remove.addEventListener('click', () => { row.remove(); invalidate(); });
  const input = document.createElement('textarea'); input.rows = 2; input.value = atom.task; input.setAttribute('aria-label','独立决策描述');
  input.addEventListener('input', invalidate); select.addEventListener('change', invalidate);
  head.append(select, remove); row.append(head,input); $('atoms').append(row);
}
function rebuildAtoms() {
  $('atoms').replaceChildren();
  try { JevConverter.plan($('decision').value, 'compound').forEach(addAtom); $('error').hidden = true; }
  catch (e) { $('error').textContent = e.message; $('error').hidden = false; }
}
function getSpec() {
  const spec = { mode, decision: $('decision').value, material: $('material').value, materialFormat: $('format').value, options: $('options').value, levels: $('levels').value, positive: $('positive').value, negative: $('negative').value };
  if (mode === 'compound') spec.atoms = [...document.querySelectorAll('.atom')].map(row => ({ type: row.querySelector('select').value, task: row.querySelector('textarea').value }));
  return spec;
}
function generate() {
  try {
    result = JevConverter.generate(getSpec());
    if (mode === 'auto') showSettings(result.atoms.map(x => x.type));
    $('output').textContent = JSON.stringify(result.request, null, 2);
    $('status').textContent = result.atoms.length + ' 个独立问题 · 草稿';
    $('copy').disabled = $('download').disabled = false;
    $('error').hidden = true;
    $('warnings').replaceChildren(); result.warnings.forEach(w => { const li = document.createElement('li'); li.textContent = w; $('warnings').append(li); });
    $('steps').replaceChildren(); result.steps.forEach(s => { const li = document.createElement('li'); li.textContent = s; $('steps').append(li); });
    $('question-summary').replaceChildren(); result.atoms.forEach((a,i) => { const p = document.createElement('p'); p.textContent = 'decision_' + (i+1) + ' · ' + a.type.toUpperCase() + ' / ' + a.task; $('question-summary').append(p); });
    $('review').hidden = false;
  } catch (e) { invalidate(); $('status').textContent = '需要补充'; $('error').textContent = e.message; $('error').hidden = false; }
}
function loadPreset(name) {
  const p = presets[name];
  ['decision','material','options','levels','positive','negative'].forEach(id => { $(id).value = p[id] || ''; });
  $('format').value = p.materialFormat || 'text';
  setMode(p.mode); generate();
}
document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => loadPreset(b.dataset.preset)));
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('request-view').hidden = b.dataset.tab !== 'request'; $('guide-view').hidden = b.dataset.tab !== 'guide';
}));
['decision','material','options','levels','positive','negative'].forEach(id => $(id).addEventListener('input', () => { invalidate(); if (id === 'decision' && mode === 'compound') rebuildAtoms(); }));
$('format').addEventListener('change', invalidate);
$('add-atom').addEventListener('click', () => { addAtom(); invalidate(); });
$('generate').addEventListener('click', generate);
$('copy').addEventListener('click', async () => {
  if (!result) return;
  const text = JSON.stringify(result.request,null,2);
  try { await navigator.clipboard.writeText(text); $('copy').textContent = '已复制'; setTimeout(() => { $('copy').textContent = '复制'; },1500); }
  catch (_) { const range = document.createRange(); range.selectNodeContents($('output')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('status').textContent = '已选中 JSON，请按 Ctrl/Cmd+C'; }
});
$('download').addEventListener('click', () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(result.request,null,2)+'\n'],{type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'jev-request.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
});
loadPreset('refund');
