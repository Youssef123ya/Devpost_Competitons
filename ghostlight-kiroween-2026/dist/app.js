import {DEMO_HTML} from './demo.js';

const $=id=>document.getElementById(id);
const frame=$('preview-frame');
const CSP="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none';";
const LIMIT=500*1024;
let engine=null,currentHTML='',baselineHTML='',baselineIssues=[],issues=[],manualWarnings=[],selectedKey='',filter='all',view='inspect',history=[],repairs=[],documentName='The Midnight Museum',filename='midnight-museum.html',loading=false;
const manualReview={keyboard:false,'screen-reader':false,meaning:false,reflow:false};
const escapeHTML=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function announce(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function sanitize(input){
  if(!window.DOMPurify)throw Error('The local HTML sanitizer could not load. Reload Ghostlight before importing content.');
  const clean=window.DOMPurify.sanitize(input,{WHOLE_DOCUMENT:true,ADD_TAGS:['style','title'],FORBID_TAGS:['script','iframe','frame','frameset','object','embed','meta','link','base'],FORBID_ATTR:['srcset','formaction','action','autofocus'],ALLOW_DATA_ATTR:false});
  const doc=new DOMParser().parseFromString(clean,'text/html');
  const meta=doc.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content=CSP;doc.head.prepend(meta);
  // CSP blocks network use in the preview. Removing remote URLs also keeps the export self-contained.
  for(const el of doc.querySelectorAll('[src],[poster],[background]'))for(const attr of ['src','poster','background'])if(el.hasAttribute(attr)&&!/^data:image\/(?:png|gif|jpeg|webp|svg\+xml)[;,]/i.test(el.getAttribute(attr)))el.removeAttribute(attr);
  for(const el of doc.querySelectorAll('audio,video,source,track'))el.remove();
  return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
function rawDocument(){const copy=frame.contentDocument.cloneNode(true);copy.getElementById('gl-selection-overlay')?.remove();return '<!doctype html>\n'+copy.documentElement.outerHTML;}
function exportDocument(){const copy=frame.contentDocument.cloneNode(true);copy.getElementById('gl-selection-overlay')?.remove();return engine.serializeDocument(copy);}
function lockActions(locked){for(const id of ['export-button','report-button'])$(id).disabled=locked;$('undo-button').disabled=locked||history.length===0;for(const id of ['import-button','reset-button'])$(id).disabled=loading;}
function loadPreview(html){
  loading=true;lockActions(true);
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('The preview did not finish loading. Try importing a smaller static page.')),10000);
    frame.onload=()=>{clearTimeout(timer);try{
      const doc=frame.contentDocument;
      doc.addEventListener('click',event=>{if(event.target.closest('a,button,input[type="submit"]'))event.preventDefault();},true);
      doc.addEventListener('auxclick',event=>event.preventDefault(),true);
      doc.addEventListener('submit',event=>event.preventDefault(),true);
      if(engine){const result=engine.auditDocument(doc);issues=result.issues;manualWarnings=result.manualWarnings??[];$('checks-count').textContent=result.checksRun??8;currentHTML=rawDocument();}
      else currentHTML=html;
      loading=false;lockActions(!engine);resolve();
    }catch(error){loading=false;reject(error);}};
    frame.srcdoc=html;
  });
}
async function newDocument(html,name,isDemo=false){
  const sanitized=sanitize(html);history=[];repairs=[];issues=[];selectedKey='';documentName=name;filename=isDemo?'midnight-museum.html':(name.toLowerCase().replace(/\.html?$/,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'')||'your-page')+'.html';
  filter='all';document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  for(const key in manualReview)manualReview[key]=false;
  document.querySelectorAll('[data-review]').forEach(input=>input.checked=false);
  $('document-name').textContent=name;$('preview-filename').textContent=filename;$('sample-tag').hidden=!isDemo;$('document-detail').textContent=isDemo?'Original demo · 8 focused check categories':'Your document · private in this browser';
  await loadPreview(sanitized);baselineHTML=currentHTML;baselineIssues=issues.map(issue=>({...issue}));selectedKey=(issues.find(issue=>issue.kind==='alt')??issues[0])?.key??'';render();setView('inspect');
  announce(engine?`${issues.length} ${issues.length===1?'barrier':'barriers'} found across 8 focused check categories. Choose a finding to make a repair.`:'Interface ready. The audit engine is being connected; no audit results are claimed yet.');
}
function render(){
  if(!engine){$('issues-count').textContent='—';$('severity-summary').textContent='Engine setup in progress';return;}
  const serious=issues.filter(i=>i.severity==='serious').length;
  $('issues-count').textContent=issues.length;$('list-count').textContent=issues.length;
  $('severity-summary').textContent=issues.length?`${serious} serious · ${issues.length-serious} moderate`:'Continue with human review';
  const currentKeys=new Set(issues.map(issue=>issue.key));
  $('repaired-count').textContent=baselineIssues.filter(issue=>!currentKeys.has(issue.key)).length;
  $('undo-button').disabled=!history.length;
  const shown=issues.filter(issue=>filter==='all'||issue.severity===filter);
  $('issue-list').replaceChildren();
  if(!issues.length){$('issue-list').innerHTML='<div class="clear-state"><span aria-hidden="true">✧</span><h3>A brighter beginning.</h3><p>No findings remain in these focused checks.<br>Your human review is still essential.</p></div>';}
  else if(!shown.length){$('issue-list').innerHTML='<p class="empty-note">No findings match this filter.<br>Try All findings.</p>';}
  for(const issue of shown){
    const button=document.createElement('button');button.type='button';button.className='finding'+(issue.key===selectedKey?' selected':'');button.setAttribute('aria-pressed',String(issue.key===selectedKey));button.dataset.key=issue.key;
    button.innerHTML=`<span class="finding-mark" aria-hidden="true">♧</span><span><strong>${escapeHTML(issue.title)}</strong><small>${escapeHTML(shortCategory(issue.kind))}</small><span class="finding-meta"><span class="severity ${issue.severity==='serious'?'serious':'moderate'}">${escapeHTML(issue.severity)}</span><code>${escapeHTML(issue.snippet?.match(/^<[^\s>]+/)?.[0]??issue.kind)}</code></span></span>`;
    button.addEventListener('click',()=>{selectedKey=issue.key;render();highlightIssue(issue);});$('issue-list').append(button);
  }
  renderRepair();
  $('manual-warnings').replaceChildren();
  for(const warning of manualWarnings.length?manualWarnings:['No document-specific limitations were reported. The general scope limits and human-review checks still apply.']){const li=document.createElement('li');li.textContent=warning;$('manual-warnings').append(li);}
  if(view==='source')$('source-view').textContent=exportDocument();
}
function shortCategory(kind){return {alt:'Images & meaning',lang:'Document language',title:'Page identification',label:'Forms & labels','button-name':'Buttons & actions','link-name':'Links & destinations',heading:'Structure & navigation',contrast:'Text & readability'}[kind]??'Focused check';}
function highlightIssue(issue){
  const doc=frame.contentDocument;if(!doc)return;doc.getElementById('gl-selection-overlay')?.remove();
  if(!issue)return;const target=Array.from(doc.querySelectorAll('[data-gl-id]')).find(el=>el.getAttribute('data-gl-id')===issue.nodeId);if(!target)return;
  const style=doc.createElement('style');style.id='gl-selection-overlay';style.textContent=`[data-gl-id="${CSS.escape(issue.nodeId)}"] {outline:2px dashed #6a8c36!important;outline-offset:5px!important;}`;doc.head.append(style);
  if(!['lang','title'].includes(issue.kind))frame.contentWindow.scrollTo({top:target.getBoundingClientRect().top+frame.contentWindow.scrollY-100,behavior:'instant'});
}
function renderRepair(){
  const panel=$('repair-panel'),issue=issues.find(item=>item.key===selectedKey);
  if(!issue){panel.innerHTML=`<div class="repair-empty"><span aria-hidden="true">✧</span><h3 id="repair-heading">${issues.length?'Choose a finding to begin.':'Keep the door open.'}</h3><p>${issues.length?'Every repair starts by understanding who it helps.':'Review keyboard use, meaning and reflow before calling this page ready.'}</p></div>`;highlightIssue(null);return;}
  const labels={alt:'Describe the image’s purpose',label:'A meaningful label for this field','button-name':'What does this button do?','link-name':'Where does this link lead?',lang:'Page language code',title:'A descriptive page title',heading:'Recommended heading level',contrast:'Recommended text color'};
  const defaults=['heading','contrast','lang'].includes(issue.kind)?(issue.suggestion??''):'';
  panel.innerHTML=`<div class="repair-kicker"><span aria-hidden="true">✦</span> ONE THOUGHTFUL REPAIR <span class="severity ${issue.severity==='serious'?'serious':'moderate'}">${escapeHTML(issue.severity)}</span></div><h3 id="repair-heading">${escapeHTML(issue.title)}</h3><p>${escapeHTML(issue.description)}</p><code>${escapeHTML(issue.snippet)}</code><form id="repair-form"><div class="repair-form-row"><div class="repair-field"><label for="repair-value">${escapeHTML(labels[issue.kind]??'Repair value')}</label><input id="repair-value" type="text" value="${escapeHTML(defaults)}" maxlength="500" autocomplete="off" ${['heading','contrast'].includes(issue.kind)?'readonly':''} placeholder="${escapeHTML(['heading','contrast','lang'].includes(issue.kind)?'':issue.suggestion||'Write a useful description…')}"></div><button class="primary-button" type="submit">Apply repair <span aria-hidden="true">↗</span></button></div>${issue.kind==='alt'?'<label class="decorative-option"><input type="checkbox" id="decorative-image">This image is purely decorative (use an empty alt).</label>':''}<p id="repair-error" class="error" role="alert"></p></form>`;
  if(issue.kind==='alt')$('decorative-image').addEventListener('change',event=>{$('repair-value').disabled=event.target.checked;});
  $('repair-form').addEventListener('submit',async event=>{
    event.preventDefault();if(loading)return;
    const value=issue.kind==='alt'&&$('decorative-image').checked?{decorative:true}:$('repair-value').value.trim();
    try{
      const snapshot={html:rawDocument(),repairs:repairs.slice(),selectedKey};
      engine.repairIssue(frame.contentDocument,issue,value);
      const afterRepair=rawDocument();history.push(snapshot);repairs.push({kind:issue.kind,title:issue.title,nodeId:issue.nodeId,value,time:new Date().toISOString()});
      await loadPreview(afterRepair);selectedKey=issues.find(item=>item.key!==issue.key)?.key??issues[0]?.key??'';render();
      announce(`${issue.title}: repair applied. ${issues.length} automated ${issues.length===1?'finding remains':'findings remain'}.`);
      document.querySelector('.finding.selected')?.focus();
    }catch(error){if($('repair-error'))$('repair-error').textContent=error.message;announce(error.message,true);lockActions(!engine);}
  });
  highlightIssue(issue);
}
function setView(next){
  view=next;document.querySelectorAll('[data-view]').forEach(button=>{const active=button.dataset.view===view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('preview-stage').classList.toggle('compare',view==='compare');$('before-wrap').hidden=view!=='compare';$('after-wrap').hidden=view==='source';$('source-view').hidden=view!=='source';$('after-label').hidden=view!=='compare';
  if(view==='compare'){
    const before=$('before-frame');
    before.onload=()=>{const doc=before.contentDocument;for(const event of ['click','auxclick','submit'])doc.addEventListener(event,e=>e.preventDefault(),true);};
    before.srcdoc=baselineHTML;
  }
  if(view==='source')$('source-view').textContent=engine?exportDocument():currentHTML;
}
function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function showAbout(){if(!$('about-dialog').open)$('about-dialog').showModal();}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});render();}));
document.querySelectorAll('[data-review]').forEach(input=>input.addEventListener('change',()=>{manualReview[input.dataset.review]=input.checked;const done=Object.values(manualReview).filter(Boolean).length;announce(`${done} of 4 human-review checks marked complete. Automated findings are unchanged.`);}));
$('about-button').addEventListener('click',showAbout);$('warnings-button').addEventListener('click',showAbout);
$('import-button').addEventListener('click',()=>{$('import-error').textContent='';$('import-dialog').showModal();});
$('html-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;if(file.size>LIMIT){$('import-error').textContent='Please choose an HTML file smaller than 500 KB.';event.target.value='';return;}$('html-input').value=await file.text();$('file-name').textContent=file.name;$('import-error').textContent='';});
$('load-html-button').addEventListener('click',async()=>{
  const input=$('html-input').value;if(!input.trim()){$('import-error').textContent='Paste some HTML or choose a file to begin.';return;}
  if(new Blob([input]).size>LIMIT){$('import-error').textContent='This page is larger than 500 KB. Try a smaller static HTML file.';return;}
  const button=$('load-html-button');button.disabled=true;
  try{await newDocument(input,$('html-file').files[0]?.name??'Your HTML page');$('import-dialog').close();$('html-file').value='';$('html-input').value='';$('file-name').textContent='Up to 500 KB';$('page-heading').focus();}catch(error){$('import-error').textContent=error.message;}finally{button.disabled=false;}
});
$('reset-button').addEventListener('click',async()=>{try{filter='all';document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter==='all';button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});await newDocument(DEMO_HTML,'The Midnight Museum',true);}catch(error){announce(error.message,true);}});
$('undo-button').addEventListener('click',async()=>{if(!history.length||loading)return;const snapshot=history.pop();repairs=snapshot.repairs;selectedKey=snapshot.selectedKey;try{await loadPreview(snapshot.html);render();announce('Last repair undone. The audit has been rerun.');}catch(error){announce(error.message,true);}});
$('export-button').addEventListener('click',()=>{if(!engine||loading)return;download(exportDocument(),'text/html',filename.replace(/\.html$/,'-repaired.html'));announce('Repaired static HTML exported. Scripts and remote resources remain excluded.');});
$('report-button').addEventListener('click',()=>{if(!engine||loading)return;const report={product:'Ghostlight',version:1,document:documentName,generatedAt:new Date().toISOString(),scope:'Eight focused automated check categories on sanitized static HTML; not a WCAG conformance certification.',privacy:'Document processing happened in the browser. Imported scripts, frames and remote resources were excluded.',baselineFindings:baselineIssues,currentFindings:issues,repairs,manualReview,manualWarnings,limitations:['Not all accessibility barriers can be detected automatically.','A passing name/alt check cannot determine whether the text is meaningful.','Contrast checks cover supported solid-color rendering only.','Keyboard, screen-reader and reflow review require human judgment.']};download(JSON.stringify(report,null,2),'application/json',filename.replace(/\.html$/,'-accessibility-report.json'));announce('Report exported with original findings, current findings, repair history and human-review status.');});

lockActions(true);
try{engine=await import('./audit.js');}catch(error){console.info('Ghostlight audit engine setup is pending.',error.message);}
try{await newDocument(DEMO_HTML,'The Midnight Museum',true);}catch(error){announce(error.message,true);}
