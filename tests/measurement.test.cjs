const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(require('node:path').join(__dirname, '../measurement.js'), 'utf8');

function run(url, {initial={}, brokenStorage=false, twice=false}={}) {
  const location = new URL(url), saved = new Map(Object.entries(initial)), scripts=[], calls=[];
  const window = {beTracker:{t:value=>calls.push(value)}};
  const context = vm.createContext({location,URLSearchParams,Set,window,
    localStorage:{getItem:k=>{if(brokenStorage)throw Error('blocked');return saved.get(k)||null;},
      setItem:(k,v)=>{if(brokenStorage)throw Error('blocked');saved.set(k,v);},
      removeItem:k=>saved.delete(k)},
    document:{createElement:()=>({}),head:{appendChild:el=>scripts.push(el)}}});
  vm.runInContext(code,context);
  if(twice)vm.runInContext(code,context);
  scripts.forEach(s=>s.onload());
  return {saved,scripts,calls};
}

test('normal product landing loads one tracker, even if included twice',()=>{
  const r=run('https://laceleatherarcane.com/mapmaker-sheets.html?utm_source=pinterest',{twice:true});
  assert.equal(r.scripts.length,1);assert.equal(r.calls.length,1);
});
test('internal browsing remains excluded across pages and can be restored',()=>{
  const first=run('https://laceleatherarcane.com/?ll_internal=1');
  assert.equal(first.scripts.length,0);
  const initial=Object.fromEntries(first.saved);
  assert.equal(run('https://laceleatherarcane.com/buttons.html',{initial}).scripts.length,0);
  assert.equal(run('https://laceleatherarcane.com/?ll_internal=0',{initial}).scripts.length,1);
});
test('checkout, sandbox and confirmation never send payment URLs',()=>{
  for(const path of ['pay.html','pay-sandbox.html','payment-success.html']) {
    assert.equal(run('https://laceleatherarcane.com/'+path).scripts.length,0);
  }
  assert.equal(run('https://laceleatherarcane.com/?session_id=private').scripts.length,0);
  assert.equal(run('https://laceleatherarcane.com/?email=private').scripts.length,0);
});
test('analytics fails open when storage is unavailable',()=>{
  assert.equal(run('https://laceleatherarcane.com/',{brokenStorage:true}).scripts.length,1);
  assert.equal(run('https://laceleatherarcane.com/?ll_internal=1',{brokenStorage:true}).scripts.length,0);
});
test('local development and unrelated hosts never inflate production totals',()=>{
  assert.equal(run('http://localhost:8000/').scripts.length,0);
  assert.equal(run('https://laceleatherarcane.com.evil.example/').scripts.length,0);
});
