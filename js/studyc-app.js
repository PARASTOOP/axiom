(function(){
  'use strict';

  const C = window.AxiomStudyC;
  if (!C) throw new Error('Study C core failed to load.');

  const KEY = 'axiom7_studyc_v1';
  const app = document.getElementById('app');
  const status = document.getElementById('status');
  const settings = document.getElementById('settingsDialog');
  const pause = document.getElementById('pauseDialog');

  const FEATURE_META = {
    pulseCount: {title:'Number of flashes',short:'flashes',help:'How many times the light flashes in this signal.',low:'1 flash',high:'5 flashes'},
    gapLength: {title:'Pause between flashes',short:'pause',help:'How long the dark pause is between flashes.',low:'short pause',high:'long pause'},
    beamWidth: {title:'Beam width',short:'width',help:'How narrow or wide the light beam is.',low:'narrow',high:'wide'}
  };

  let s = load() || C.createSession();
  let instruction = '';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function setStatus(text){ status.textContent = text || ''; }
  function save(){ s.updatedAtMs = Date.now(); localStorage.setItem(KEY, C.serialise(s)); sync(); }
  function load(){ try { const raw = localStorage.getItem(KEY); return raw ? C.restore(raw) : null; } catch (e) { localStorage.removeItem(KEY); return null; } }
  function emit(type, payload){ try { C.logEvent(s, type, payload); } catch (e) { console.warn(e); } save(); }

  function sync(){
    document.documentElement.classList.toggle('large-text', !!s.settings.largeText);
    document.body.classList.toggle('reduced-motion', !!s.settings.reducedMotion);
    const lt = document.getElementById('largeTextToggle'), rm = document.getElementById('reducedMotionToggle');
    if (lt) lt.checked = !!s.settings.largeText;
    if (rm) rm.checked = !!s.settings.reducedMotion;
  }

  function go(next){ const result = C.transition(s, next); if (!result.ok) { setStatus(result.reason); return; } emit('STATE_ENTER', {state: next}); render(); }
  function force(next){ s.previousState = s.state; s.state = next; emit('STATE_ENTER', {state: next, controlledOverride: true}); render(); }
  function label(id){ return s.labels.find(x => x.id === id); }
  function last(){ return s.attempts[s.attempts.length - 1] || null; }

  function stepInfo(){
    const map = {
      S0_ENTRY:['Understand the activity','Choose how to begin'],
      S1_CONTRIBUTION:['Choose how to begin','Make signal examples'],
      S2_CREATE:['Make signal examples','Make a new test signal'],
      S3_PREDICT:['Make a new test signal','See the model result'],
      S4_INSPECT:['See why the model chose it','Make your own check'],
      S5_CHECK:['Make your own check','Change something'],
      S6_REVISE:['Change something','Test again'],
      S7_RETEST:['Compare before and after','Reflect'],
      S8_REFLECT:['Reflect','Finish'],
      RECOVERY:['Recover','Continue']
    };
    return map[s.state] || ['Continue','Continue'];
  }

  function stepNo(){ return ({S0_ENTRY:0,S1_CONTRIBUTION:1,S2_CREATE:2,S3_PREDICT:3,S4_INSPECT:4,S5_CHECK:5,S6_REVISE:6,S7_RETEST:7,S8_REFLECT:8,RECOVERY:'!'})[s.state]; }
  function progress(){ const [now,next] = stepInfo(); return `<div class="progress" aria-label="Current activity progress"><span class="active">Now: ${esc(now)}</span><span>Next: ${esc(next)}</span></div>`; }
  function head(title,text){ instruction=text; return `${progress()}<div class="step"><div class="stepno">${stepNo()}</div><div><h2>${title}</h2><p>${text}</p></div></div>`; }

  function featureGuide(){
    return `<div class="feature-guide" aria-label="Signal feature guide"><article><strong>1. Number of flashes</strong><span>How many times the light flashes.</span></article><article><strong>2. Pause</strong><span>How long the dark gap is between flashes.</span></article><article><strong>3. Beam width</strong><span>How narrow or wide the light looks.</span></article></div>`;
  }

  function contributionPrompt(point,question){
    return `<details class="contribution-prompt" data-claim-point="${esc(point)}"><summary>${esc(question)} <span class="optional-label">optional</span></summary><div class="controls"><button type="button" class="claim" data-choice="SELF">I'll do this part</button><button type="button" class="claim" data-choice="TOGETHER">Together</button><button type="button" class="claim" data-choice="PASS">Keep going</button></div></details>`;
  }

  function fields(sig,prefix,cls,id=''){
    return C.FEATURES.map(f=>{ const m=FEATURE_META[f]; return `<div class="field"><label for="${prefix}-${f}"><strong>${m.title}</strong><span class="field-help">${m.help}</span></label><input id="${prefix}-${f}" class="${cls}" data-feature="${f}" ${id?`data-id="${id}"`:''} type="range" min="1" max="5" step="1" value="${sig[f]}" aria-label="${m.title}"><div class="range-readout"><output>${sig[f]}</output><span class="range-ends"><span>${m.low}</span><span>${m.high}</span></span></div></div>`; }).join('');
  }

  function signalRecipe(sig){ return `<div class="signal-recipe" aria-label="Current signal settings"><span>${sig.pulseCount} flash${sig.pulseCount===1?'':'es'}</span><span>pause ${sig.gapLength}/5</span><span>width ${sig.beamWidth}/5</span></div>`; }

  function mapControls(l){
    const m=l.mapping, option=(selected,x)=>`<option value="${x}" ${selected===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`;
    return `<details class="optional-controls"><summary>Optional: change how this category looks</summary><p class="field-help">These choices change the displayed light only. They do not train the classifier.</p><div class="mapgrid"><label>Output shape<select data-map="shape" data-label="${l.id}">${['circle','triangle','beam'].map(x=>option(m.shape,x)).join('')}</select></label><label>Output motion<select data-map="motion" data-label="${l.id}">${['pulse','sweep','flash'].map(x=>option(m.motion,x)).join('')}</select></label><label>Output speed<select data-map="tempo" data-label="${l.id}">${['slow','medium','fast'].map(x=>option(m.tempo,x)).join('')}</select></label></div></details>`;
  }

  function exEditor(e){ return `<div class="example"><div class="example-head"><strong>Signal example</strong><button class="delEx danger" data-id="${e.id}" type="button">Delete</button></div>${signalRecipe(e.features)}${fields(e.features,'ex-'+e.id,'exFeature',e.id)}</div>`; }
  function beacon(labelId){ if(!labelId)return `<div class="beacon"><div class="signal shape-beam">NOT SURE</div></div>`; const l=label(labelId),m=l.mapping; return `<div class="beacon"><div class="signal shape-${m.shape} motion-${m.motion} tempo-${m.tempo}">${esc(l.name)}</div></div>`; }

  function renderEntry(){
    return `${head('First, understand the signal task','You will make two kinds of light-signal examples. Then you will make one new signal and ask a tiny model which kind it is most similar to.')}<div class="journey"><article><strong>1. Make examples</strong><span>Create two named groups of signals.</span></article><article><strong>2. Test a new signal</strong><span>Choose its flashes, pause and beam width.</span></article><article><strong>3. Look at why</strong><span>See which example was closest, then decide what you think.</span></article></div>${featureGuide()}<div class="callout"><strong>No AI knowledge needed.</strong> This tiny model only compares the new signal with the examples you make. It does not know the “right” meaning on its own.</div><div class="warning"><strong>Research activity:</strong> this is one simple model for exploration, not a real safety system and not a picture of how all AI works.</div><div class="controls"><button id="start" class="primary">I understand — start</button><a href="studyc-print.html" target="_blank" rel="noopener">Printable shared cards</a></div>`;
  }

  function renderContribution(){
    return `${head('How do you want to begin?','If two people are using the activity, either person can start or you can work together. If you are testing alone, choose “Just continue”.')}<div class="callout">There is no fixed expert role. You can pass, help, swap or re-enter later.</div><div class="controls"><button id="beginSelf" class="primary">I'll start</button><button id="beginTogether">Start together</button><button id="toCreate">Just continue</button><button id="backStart">Back</button></div>`;
  }

  function renderCreate(){
    const ds=C.datasetStatus(s), claim=s.examples.length===0?contributionPrompt('CREATE_FIRST_EXAMPLE','Who wants to make the first example?'):contributionPrompt('CREATE_NEXT_CHANGE','Who wants to make the next change?');
    return `${head('Make examples for two signal meanings','A category is simply a name/meaning you want the tiny model to recognise. Give each category at least two examples. Later the model will compare a new signal with these examples.')}<div class="concept-card"><strong>Each example has only three settings.</strong>${featureGuide()}</div>${claim}<div class="grid2">${s.labels.map(l=>`<section class="category"><h3>Signal meaning ${l.id} · ${ds.counts[l.id]||0}/2 examples</h3><label>Give this signal meaning a short name<input class="category-name labelName" data-label="${l.id}" maxlength="24" value="${esc(l.name)}" placeholder="e.g. Safe harbour"></label>${mapControls(l)}<div>${s.examples.filter(e=>e.labelId===l.id).map(exEditor).join('')||'<p class="footer">No examples yet. Add one, then set its three signal features.</p>'}</div><button class="addEx primary" data-label="${l.id}" type="button">Add a signal example</button></section>`).join('')}</div><div class="${ds.ok?'success':'warning'}">${ds.ok?'Your examples are ready. Next, make one new signal for the model to compare.':'Add at least two examples to each signal meaning before testing.'}</div><div class="controls"><button id="toTest" class="primary" ${ds.ok?'':'disabled'}>Next: make a test signal</button><button id="backContrib">Back</button></div>`;
  }

  function renderPredict(){
    return `${head('Make one new test signal','This is the signal you want the model to compare with your examples. Set its three features, then run the test.')}<div class="concept-card"><strong>What happens when you press Run test?</strong><p>The model compares these three settings with the examples you made and finds the closest example overall. If equally close examples disagree, it can say “Not sure”.</p></div>${contributionPrompt('SET_TEST_SIGNAL','Who wants to set the test signal?')}<section class="card"><h3>Your new test signal</h3>${signalRecipe(s.testSignal)}${fields(s.testSignal,'test','testFeature')}</section><div class="controls"><button id="run" class="primary">${s.attempts.length?'Run the test again':'Run the test'}</button><button id="backExamples">Back to examples</button></div>`;
  }

  function differencePhrase(feature,diff){ const name=FEATURE_META[feature].short; if(diff===0)return `same ${name}`; if(diff===1)return `${name} differs by 1 step`; return `${name} differs by ${diff} steps`; }
  function plainWhy(x){ const categoryName=label(x.example.labelId)?.name||x.example.labelId, parts=C.FEATURES.map(f=>differencePhrase(f,x.diffs[f])); return `<article class="card why-card"><strong>Closest example: ${esc(categoryName)}</strong>${signalRecipe(x.example.features)}<p>This example is closest overall across the three signal settings: ${esc(parts.join(', '))}.</p><details class="technical-details"><summary>Show the numbers</summary><p>Overall distance: ${x.distance.toFixed(2)}</p><p>Flash difference: ${x.diffs.pulseCount}; pause difference: ${x.diffs.gapLength}; width difference: ${x.diffs.beamWidth}.</p></details></article>`; }

  function renderInspect(){
    const a=last(); if(!a)return recover('No model result is available.'); const nearest=a.prediction.nearest; const resultText=a.prediction.kind==='UNSURE_TIE'?'The model is not sure because equally close examples point to different meanings.':`The model predicts: ${esc(a.prediction.labelName)}`;
    return `${head('See the model result and why','The model result is not a score or answer key. First look at the example(s) it found closest.')}<div class="result-result"><div class="model-result"><span class="result-label">MODEL RESULT</span>${beacon(a.prediction.labelId)}<div class="callout"><strong>${resultText}</strong></div></div><div><h3>Why did it choose this?</h3><p class="field-help">It chose the closest example overall across flashes, pause and beam width.</p>${nearest.map(plainWhy).join('')}</div></div>${contributionPrompt('INSPECT_RESULT','Anyone want to lead the inspection or challenge what you see?')}<div class="next-decision"><strong>Next, make your own check.</strong><span>You can agree, disagree, stay unsure or inspect again.</span></div><div class="controls"><button id="toCheck" class="primary">Next: make our check</button>${s.attempts.length>1?'<button id="toCompare">Back to comparison</button>':''}<button id="reviseEarly">Change something</button></div>`;
  }

  function renderCheck(){ return `${head('What do you think about the model result?','Choose your judgement. These buttons record what you think; they do not mark a correct answer.')} ${contributionPrompt('HUMAN_CHECK','Who wants to make or explain this check?')}<div class="checkgrid"><button class="check" data-v="MATCHES">It matches our meaning</button><button class="check" data-v="DISAGREE">We disagree with it</button><button class="check" data-v="UNSURE">We're not sure</button><button class="check" data-v="CHECK_AGAIN">Look at WHY again</button></div>`; }
  function renderRevise(){ const a=last(); return `${head('Change one thing and try again','You can change an example, a category name, a signal feature or the test signal. Your previous attempt stays saved so you can compare before and after.')} ${contributionPrompt('REVISE','Who wants to make the next change?')}<div class="callout"><strong>Latest model result:</strong> ${esc(a?.prediction.labelName||'NOT SURE')}.</div><div class="controls"><button id="editExamples" class="primary">Change the examples</button><button id="editTest">Change the test signal</button><button id="sameTest" class="primary">Keep this signal and test again</button></div>`; }
  function summary(a,title){ return `<article class="card"><h3>${title}</h3>${a?`<p><strong>Model result: ${esc(a.prediction.labelName||'NOT SURE')}</strong></p>${signalRecipe(a.testSignal)}<p>Your check: ${esc(a.humanCheck||'not recorded')}</p>`:'<p>Not available.</p>'}</article>`; }

  function featureDiffs(before,after,prefix){ const rows=[]; for(const f of C.FEATURES){const a=before?.[f],b=after?.[f];if(a!==b)rows.push(`${prefix} ${FEATURE_META[f].short}: ${a} → ${b}`);} return rows; }
  function changeTrace(a,b){
    if(!a||!b)return ['A full before/after trace is not available yet.']; const rows=[], aExamples=new Map((a.datasetSnapshot||[]).map(e=>[e.id,e])), bExamples=new Map((b.datasetSnapshot||[]).map(e=>[e.id,e]));
    for(const [id,exA] of aExamples){const exB=bExamples.get(id),short=id.slice(-5);if(!exB){rows.push(`Example ${short}: removed`);continue;}if(exA.labelId!==exB.labelId)rows.push(`Example ${short} category: ${exA.labelId} → ${exB.labelId}`);rows.push(...featureDiffs(exA.features,exB.features,`Example ${short}`));}
    for(const [id] of bExamples)if(!aExamples.has(id))rows.push(`Example ${id.slice(-5)}: added`);
    const aLabels=new Map((a.labelsSnapshot||[]).map(l=>[l.id,l])), bLabels=new Map((b.labelsSnapshot||[]).map(l=>[l.id,l]));
    for(const [id,la] of aLabels){const lb=bLabels.get(id);if(!lb)continue;if(la.name!==lb.name)rows.push(`Category ${id} name: ${la.name} → ${lb.name}`);for(const key of ['shape','motion','tempo'])if(la.mapping?.[key]!==lb.mapping?.[key])rows.push(`Category ${id} ${key}: ${la.mapping?.[key]} → ${lb.mapping?.[key]}`);}
    rows.push(...featureDiffs(a.testSignal,b.testSignal,'Test signal')); const predA=a.prediction?.labelName||'NOT SURE', predB=b.prediction?.labelName||'NOT SURE'; if(predA!==predB||a.prediction?.kind!==b.prediction?.kind)rows.push(`Model result: ${predA} → ${predB}`); if((a.humanCheck||null)!==(b.humanCheck||null))rows.push(`Your check: ${a.humanCheck||'not recorded'} → ${b.humanCheck||'not recorded'}`); return rows.length?rows:['No model-relevant or recorded decision change was detected between these attempts.'];
  }

  function renderRetest(){ const a=s.attempts.at(-2),b=last(),trace=changeTrace(a,b); return `${head('Compare before and after','Look at what you changed and what happened to the model result. A changed result is not automatically a better result.')}<div class="compare">${summary(a,'Attempt A — before')}${summary(b,'Attempt B — after')}</div><article class="card"><h3>What changed?</h3><ul>${trace.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><div class="controls"><button id="inspectB" class="primary">See WHY for Attempt B</button><button id="again">Change something again</button><button id="reflect" class="primary">Reflect and finish</button></div>`; }
  function renderReflect(){ return `${head('Reflect and decide','Talk, point or demonstrate. You can skip any prompt. No answer is shown or scored here.')}<div class="cards"><article class="card"><h3>What do you think the model compared?</h3><p class="footer">Describe, point or show what you noticed.</p></article><article class="card"><h3>What changed between your two attempts?</h3><p class="footer">Use the before/after comparison if helpful.</p></article><article class="card"><h3>What did you decide after seeing the model result?</h3><p class="footer">Agreement, disagreement and uncertainty are all recordable.</p></article><article class="card"><h3>What would you change if you tried again?</h3><p class="footer">You may also keep it as it is.</p></article></div><div class="controls"><button id="another">Try another</button><button id="export2">Export session</button><button id="finish" class="primary">Finish</button></div>`; }
  function recover(msg){ return `${head('Recover the activity',msg||'Something interrupted the current step. Your previous valid work is still available.')}<div class="warning">Choose where to return. A full reset is not required.</div><div class="controls"><button class="recover primary" data-state="S2_CREATE">Signal examples</button><button class="recover" data-state="S3_PREDICT">Test signal</button><button class="recover" data-state="S0_ENTRY">Start</button></div>`; }

  function render(){ setStatus(''); sync(); const renderer={S0_ENTRY:renderEntry,S1_CONTRIBUTION:renderContribution,S2_CREATE:renderCreate,S3_PREDICT:renderPredict,S4_INSPECT:renderInspect,S5_CHECK:renderCheck,S6_REVISE:renderRevise,S7_RETEST:renderRetest,S8_REFLECT:renderReflect,RECOVERY:recover}[s.state]||recover; app.innerHTML=renderer(); bind(); save(); }
  function addExample(id){ const result=C.addExample(s,id,{pulseCount:3,gapLength:3,beamWidth:3}); if(result.ok)emit('EXAMPLE_ADD',{exampleId:result.example.id,labelId:id}); else setStatus(result.reason); render(); }
  function run(){ const prediction=C.predict(s,s.testSignal); if(!prediction.ok){setStatus(prediction.reason);force('RECOVERY');return;} const kind=s.attempts.length?'RETEST':'INITIAL',attempt=C.makeAttempt(s,prediction,kind); emit(kind==='RETEST'?'RETEST_RUN':'PREDICT_RUN',{attemptId:attempt.id,kind:prediction.kind,labelId:prediction.labelId}); if(kind==='RETEST')force('S7_RETEST');else go('S4_INSPECT'); }
  function download(){ emit('SESSION_EXPORT',{attempts:s.attempts.length,examples:s.examples.length}); const blob=new Blob([C.serialise(s)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`axiom7-studyc-${s.sessionId}.json`;a.click();URL.revokeObjectURL(url); }

  function bindClaimButtons(){ [...app.querySelectorAll('.contribution-prompt')].forEach(panel=>{panel.querySelectorAll('.claim').forEach(button=>{button.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:panel.dataset.claimPoint,choice:button.dataset.choice});panel.querySelectorAll('button').forEach(b=>b.disabled=true);const note=document.createElement('span');note.className='footer';note.textContent=button.dataset.choice==='SELF'?'Choice noted. Continue with the action.':button.dataset.choice==='TOGETHER'?'Joint start noted. Continue with the action.':'No claim required. Continue.';panel.appendChild(note);});});}); }

  function bind(){
    const $=q=>app.querySelector(q),$$=q=>[...app.querySelectorAll(q)]; bindClaimButtons();
    $('#start')?.addEventListener('click',()=>{emit('SESSION_START',{});go('S1_CONTRIBUTION');});
    $('#beginSelf')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'SELF'});go('S2_CREATE');});
    $('#beginTogether')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'TOGETHER'});go('S2_CREATE');});
    $('#toCreate')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'PASS'});go('S2_CREATE');});
    $('#backStart')?.addEventListener('click',()=>force('S0_ENTRY')); $('#backContrib')?.addEventListener('click',()=>force('S1_CONTRIBUTION'));
    $$('.addEx').forEach(b=>b.onclick=()=>addExample(b.dataset.label));
    $$('.delEx').forEach(b=>b.onclick=()=>{const r=C.deleteExample(s,b.dataset.id);if(r.ok)emit('EXAMPLE_DELETE',{exampleId:b.dataset.id});render();});
    $$('.exFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.querySelector('output').value=i.value;const e=s.examples.find(x=>x.id===i.dataset.id);if(e){C.editExample(s,e.id,{features:{...e.features,[i.dataset.feature]:Number(i.value)}});emit('EXAMPLE_EDIT',{exampleId:e.id,feature:i.dataset.feature,value:Number(i.value)});}});
    $$('.labelName').forEach(i=>i.onchange=()=>{const l=label(i.dataset.label);l.name=(i.value.trim()||`Signal ${l.id}`).slice(0,24);emit('LABEL_EDIT',{labelId:l.id});render();});
    $$('[data-map]').forEach(x=>x.onchange=()=>{const l=label(x.dataset.label);l.mapping[x.dataset.map]=x.value;emit('OUTPUT_MAPPING_EDIT',{labelId:l.id,field:x.dataset.map,value:x.value});});
    $('#toTest')?.addEventListener('click',()=>go('S3_PREDICT')); $('#backExamples')?.addEventListener('click',()=>force('S2_CREATE'));
    $$('.testFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.querySelector('output').value=i.value;s.testSignal[i.dataset.feature]=Number(i.value);emit('TEST_EDIT',{feature:i.dataset.feature,value:Number(i.value)});}); $('#run')?.addEventListener('click',run);
    $('#toCheck')?.addEventListener('click',()=>go('S5_CHECK')); $('#toCompare')?.addEventListener('click',()=>force('S7_RETEST')); $('#reviseEarly')?.addEventListener('click',()=>go('S6_REVISE'));
    $$('.check').forEach(b=>b.onclick=()=>{C.setHumanCheck(s,b.dataset.v);emit('HUMAN_CHECK',{value:b.dataset.v});if(b.dataset.v==='CHECK_AGAIN')force('S4_INSPECT');else if(s.attempts.length>1)force('S7_RETEST');else go('S6_REVISE');});
    $('#editExamples')?.addEventListener('click',()=>force('S2_CREATE')); $('#editTest')?.addEventListener('click',()=>force('S3_PREDICT')); $('#sameTest')?.addEventListener('click',()=>force('S3_PREDICT')); $('#inspectB')?.addEventListener('click',()=>force('S4_INSPECT')); $('#again')?.addEventListener('click',()=>force('S6_REVISE')); $('#reflect')?.addEventListener('click',()=>force('S8_REFLECT')); $('#another')?.addEventListener('click',()=>force('S2_CREATE')); $('#export2')?.addEventListener('click',download);
    $('#finish')?.addEventListener('click',()=>{emit('SESSION_FINISH',{attempts:s.attempts.length});app.innerHTML='<div class="success"><h2>Session finished</h2><p>Your local session remains saved unless you start a new session.</p></div>';});
    $$('.recover').forEach(b=>b.onclick=()=>{C.recoverTo(s,b.dataset.state);emit('RECOVERY',{target:b.dataset.state});render();});
  }

  function openDialog(dialog){ if(dialog&&typeof dialog.showModal==='function')dialog.showModal(); }
  document.getElementById('settingsBtn')?.addEventListener('click',()=>openDialog(settings));
  document.getElementById('pauseBtn')?.addEventListener('click',()=>{s.paused=true;emit('PAUSE_OPEN',{});openDialog(pause);});
  document.getElementById('exportBtn')?.addEventListener('click',download);
  document.getElementById('largeTextToggle')?.addEventListener('change',e=>{s.settings.largeText=!!e.target.checked;emit('ACCESSIBILITY_CHANGE',{setting:'largeText',value:s.settings.largeText});render();});
  document.getElementById('reducedMotionToggle')?.addEventListener('change',e=>{s.settings.reducedMotion=!!e.target.checked;emit('ACCESSIBILITY_CHANGE',{setting:'reducedMotion',value:s.settings.reducedMotion});render();});
  document.getElementById('readAloudBtn')?.addEventListener('click',()=>{if(!('speechSynthesis'in window)||!window.SpeechSynthesisUtterance){setStatus('Read aloud is not available in this browser.');return;}window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(instruction||''));emit('READ_ALOUD',{state:s.state});});
  document.getElementById('restoreBtn')?.addEventListener('click',()=>{const restored=load();if(!restored){setStatus('No saved session is available on this device.');return;}s=restored;emit('SESSION_RESTORE',{});if(settings?.open)settings.close();render();});
  document.getElementById('newSessionBtn')?.addEventListener('click',()=>{localStorage.removeItem(KEY);s=C.createSession();emit('NEW_SESSION',{});if(settings?.open)settings.close();render();});
  document.getElementById('finishNowBtn')?.addEventListener('click',()=>{emit('SESSION_FINISH',{attempts:s.attempts.length,early:true});if(pause?.open)pause.close();app.innerHTML='<div class="success"><h2>Session finished</h2><p>Your local session remains saved unless you start a new session.</p></div>';});
  pause?.addEventListener('close',()=>{s.paused=false;emit('PAUSE_CLOSE',{returnValue:pause.returnValue||null});});

  sync(); render();
})();