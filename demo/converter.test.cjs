'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { generate, plan } = require('./converter.js');
const sample = require('./sample-input.json');
const binary = { mode: 'noul', decision: '判断客户是否申请退款。', material: '请退还重复扣款。' };
test('keeps evidence in state, task in instructions, and default missing-evidence policy explicit', () => {
  const r = generate(binary);
  assert.deepEqual(r.request.state, { material: binary.material });
  assert.equal(r.request.questions.decision_1.instructions.task, binary.decision);
  assert.match(r.request.questions.decision_1.instructions.evidence, /`material`/);
  assert.match(r.request.questions.decision_1.criteria.false, /足够证据/);
  assert.ok(r.warnings.some(x => x.includes('证据不足')));
});
test('uses explicit binary boundaries without changing them', () => {
  const q = generate({ ...binary, positive: '明确申请退款', negative: '其他情况' }).request.questions.decision_1;
  assert.deepEqual(q.criteria, { true: '明确申请退款', false: '其他情况' });
  assert.throws(() => generate({ ...binary, positive: '是' }), /同时填写/);
});
test('Choice preserves candidate meanings and stable keys, rejects missing/duplicate candidates', () => {
  const spec = { ...binary, mode:'choice', options:'退款 | 申请退还已付款项\n其他 | 无退款申请' };
  assert.deepEqual(generate(spec).request.questions.decision_1.criteria, { option_1:'退款：申请退还已付款项', option_2:'其他：无退款申请' });
  assert.throws(() => generate({ ...spec, options:'' }), /2–255/);
  assert.throws(() => generate({ ...spec, options:'退款\n退款 | 其他定义' }), /不能重复/);
  assert.throws(() => generate({ ...spec, options:' | 空标签\n其他' }), /不能为空/);
  assert.throws(() => generate({ ...spec, options:Array.from({length:256},(_,i)=>String(i)).join('\n') }), /2–255/);
});
test('Score keeps level order and requires a bounded scale', () => {
  const spec = { ...binary, mode:'score', levels:'无影响：正常\n严重：核心业务中断' };
  assert.deepEqual(generate(spec).request.questions.decision_1.criteria, ['无影响：正常','严重：核心业务中断']);
  assert.throws(() => generate({ ...spec, levels:'低' }), /2–10/);
  assert.throws(() => generate({ ...spec, levels:'低\n低' }), /不能重复/);
  assert.throws(() => generate({ ...spec, levels:Array.from({length:11},(_,i)=>String(i)).join('\n') }), /2–10/);
});
test('auto suggests supported types but refuses ambiguous prompts rather than inventing criteria', () => {
  assert.equal(plan(binary.decision,'auto')[0].type,'noul');
  assert.equal(plan('判断工单属于哪个类别','auto')[0].type,'choice');
  assert.equal(plan('给严重程度评分','auto')[0].type,'score');
  assert.throws(() => plan('帮我处理一下','auto'), /无法确定/);
  assert.throws(() => plan('判断是否需要选择类别','auto'), /无法确定/);
  assert.throws(() => generate({ ...binary, mode:'auto', decision:'判断工单类别' }), /候选项/);
});
test('compound preserves shared structured evidence and produces three independent typed questions', () => {
  const r = generate(sample);
  assert.deepEqual(Object.values(r.request.questions).map(q=>q.type),['choice','noul','score']);
  assert.equal(r.request.state.material.context.workaround,'无');
  assert.equal(r.request.state.material.context.reported_fund_loss,'未报告');
  assert.ok(r.warnings.some(x=>x.includes('分两次调用')));
  assert.equal(Object.values(r.request.questions).filter(q=>q.instructions.task.includes('人工升级')).length,1);
  assert.equal(Object.keys(r.request.state).length,1);
  assert.throws(() => plan('这是没有明确决策结构的一句话','compound'), /无法可靠/);
});
test('manual atoms can implement independent multilabel checks with separate boundaries', () => {
  const r = generate({ material:'退款和技术报障', atoms:[{type:'noul',task:'是否包含退款申请',positive:'要求退款',negative:'无退款申请'},{type:'noul',task:'是否包含技术报障',positive:'报告异常',negative:'无异常'}] });
  assert.deepEqual(Object.values(r.request.questions).map(q=>q.criteria.true),['要求退款','报告异常']);
  assert.throws(() => generate({ material:'x', atoms:[] }), /1–20/);
  assert.throws(() => generate({ material:'x', atoms:[{type:'bad',task:'x'}] }), /有效类型/);
  assert.throws(() => generate({ material:'x', atoms:[{type:'noul',task:' '}]}), /非空/);
});
test('invalid material fails and no user text is evaluated or treated as a response', () => {
  assert.throws(() => generate({...binary,material:''}), /待判断的材料/);
  assert.throws(() => generate({...binary,materialFormat:'json',material:'{oops'}), /合法 JSON/);
  assert.throws(() => generate({...binary,materialFormat:'json',material:'null'}), /对象或数组/);
  const text = '<script>alert(1)</script> ${process.env.TYPESAFE_API_KEY}';
  const r = generate({...binary,material:text});
  assert.equal(r.request.state.material,text);
  assert.equal(r.request.answers,undefined);
  assert.deepEqual(generate({...binary,materialFormat:'json',material:'[1,{"text":"x"}]'}).request.state.material,[1,{text:'x'}]);
});
test('explicit material references resolve inside the generated state envelope', () => {
  const spec = { ...binary, materialFormat:'json', material:'{"message":"请退款"}' };
  assert.throws(() => generate({...spec,decision:'判断 `message` 是否申请退款'}), /不存在的字段/);
  assert.equal(generate({...spec,decision:'判断 `material.message` 是否申请退款'}).request.questions.decision_1.type,'noul');
  assert.throws(() => generate({...spec,decision:'判断 `material.constructor` 是否申请退款'}), /不存在的字段/);
});
