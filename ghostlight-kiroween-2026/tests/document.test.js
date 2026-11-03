import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {auditDocument,repairIssue,serializeDocument} from '../dist/audit.js';

function page(body,head='') {
  const window=new Window({url:'https://ghostlight.test',settings:{enableJavaScriptEvaluation:false,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  window.document.write(`<!doctype html><html lang="en"><head><title>Fixture</title><style>body{background:#fff;color:#000;font:16px Arial}</style>${head}</head><body>${body}</body></html>`);
  return window.document;
}
const kinds=doc=>auditDocument(doc).issues.map(issue=>issue.kind);

test('preserves valid empty alt, native labels, nested image names and input button values',()=>{
  const doc=page('<h1>Welcome</h1><img alt=""><label for="email">Email</label><input id="email"><button><img alt="Save"></button><a href="#next"><img alt="Next"></a><input type="button" value="Launch">');
  assert.deepEqual(kinds(doc),[]);
});
test('ignores hidden descendants when computing button/link content names',()=>{
  const doc=page('<button><span aria-hidden="true">Fake label</span></button><a href="#"><span style="display:none">Hidden label</span></a>');
  assert.deepEqual(kinds(doc).sort(),['button-name','link-name']);
});
test('allows explicitly referenced hidden text for aria-labelledby',()=>{
  const doc=page('<span id="label" hidden>Actual action</span><button aria-labelledby="label"></button>');
  assert.ok(!kinds(doc).includes('button-name'));
});
test('does not audit display:none, inert, or aria-hidden subtrees',()=>{
  const doc=page('<div style="display:none"><img><button></button></div><div inert><input></div><div aria-hidden="true"><a href="#"></a></div>');
  assert.deepEqual(kinds(doc),[]);
});
test('placeholder is not a label, and image submit inputs require a name',()=>{
  const doc=page('<input placeholder="Email"><input type="image">');
  assert.deepEqual(kinds(doc).sort(),['button-name','label']);
});
test('each repair reruns to remove its finding without creating duplicate labels or node IDs',()=>{
  const doc=page('<h1>One</h1><h3>Two</h3><img><input placeholder="Email"><button></button><a href="#"></a>');
  for(const issue of auditDocument(doc).issues){
    const values={alt:'A useful scene',label:'Email address','button-name':'Open menu','link-name':'View collection',heading:issue.suggestion};
    repairIssue(doc,issue,values[issue.kind]);
    if(issue.kind==='label')repairIssue(doc,issue,'Email address');
  }
  assert.deepEqual(kinds(doc),[]);
  assert.equal(doc.querySelectorAll('label').length,1);
  const ids=Array.from(doc.querySelectorAll('[data-gl-id]'),el=>el.getAttribute('data-gl-id'));
  assert.equal(new Set(ids).size,ids.length);
});
test('blank image text requires an explicit decorative decision; SVG names use ARIA',()=>{
  const doc=page('<img><svg role="img"><path d="M0 0"></path></svg>');
  const findings=auditDocument(doc).issues.filter(i=>i.kind==='alt');
  assert.throws(()=>repairIssue(doc,findings[0],' '),/describe|decorative/i);
  repairIssue(doc,findings[0],{decorative:true});
  repairIssue(doc,findings[1],'Collection mark');
  assert.equal(doc.querySelector('svg').getAttribute('aria-label'),'Collection mark');
  assert.ok(!kinds(doc).includes('alt'));
});
test('repairs preserve wrapping labels and avoid duplicate user IDs',()=>{
  const doc=page('<label><input></label><div id="duplicate"></div><input id="duplicate">');
  for(const issue of auditDocument(doc).issues.filter(i=>i.kind==='label')){repairIssue(doc,issue,'Contact email');repairIssue(doc,issue,'Contact email');}
  assert.equal(doc.querySelectorAll('input').length,2);
  assert.equal(doc.querySelectorAll('label label').length,0);
  assert.ok(!kinds(doc).includes('label'));
  assert.equal(new Set(Array.from(doc.querySelectorAll('[id]'),el=>el.id)).size,doc.querySelectorAll('[id]').length);
});
test('exports one doctype, preserves SVG namespaces, removes internal IDs and keeps safety CSP',()=>{
  const doc=page('<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M0 0"></path></svg><img>', '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'">');
  auditDocument(doc);const html=serializeDocument(doc);
  assert.equal((html.match(/<!doctype/gi)||[]).length,1);
  assert.ok(html.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(!html.includes('data-gl-id'));
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(doc.querySelector('[data-gl-id]'),'export must not mutate live document');
});
test('contrast composites transparent text rather than measuring its uncomposited RGB',()=>{
  const doc=page('<p style="color:rgba(0,0,0,.1)">Hard to read</p>');
  const finding=auditDocument(doc).issues.find(i=>i.kind==='contrast');
  assert.ok(finding);assert.ok(finding.details.ratio<2);
});
test('gradients and ancestor opacity produce manual warnings rather than invented ratios',()=>{
  const doc=page('<div style="background:linear-gradient(#000,#fff)"><p>Gradient text</p></div><div style="opacity:.5"><p>Faded text</p></div>');
  const result=auditDocument(doc);
  assert.equal(result.issues.filter(i=>i.kind==='contrast').length,0);
  assert.ok(result.manualWarnings.some(w=>/gradient or image/i.test(w)));
  assert.ok(result.manualWarnings.some(w=>/opacity/i.test(w)));
});
test('large text uses 3:1 while the same solid colors fail the normal-text threshold',()=>{
  const doc=page('<p style="font-size:24px;color:#888">Large type</p><p style="font-size:16px;color:#888">Normal type</p>');
  const contrast=auditDocument(doc).issues.filter(i=>i.kind==='contrast');
  assert.equal(contrast.length,1);assert.equal(contrast[0].details.threshold,4.5);
});
test('contrast covers direct HTML text in generic containers, not just paragraph tags',()=>{
  const doc=page('<div style="color:#ccc">Generic container text</div>');
  assert.equal(auditDocument(doc).issues.filter(i=>i.kind==='contrast').length,1);
});
test('invalid repair inputs and stale targets throw useful errors',()=>{
  const doc=page('<input>');const issue=auditDocument(doc).issues.find(i=>i.kind==='label');
  assert.throws(()=>repairIssue(doc,issue,''),/non-empty/);
  assert.throws(()=>repairIssue(doc,{kind:'label',nodeId:'does-not-exist'},'Email'),/not found/);
});
