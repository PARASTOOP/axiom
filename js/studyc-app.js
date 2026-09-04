(function(){
  'use strict';

  const C = window.AxiomStudyC;
  if (!C) throw new Error('Study C core failed to load.');

  const KEY = 'axiom7_studyc_v1';
  const app = document.getElementById('app');
  const status = document.getElementById('status');
  const settings = document.getElementById('settingsDialog');
  const pause = document.getElementById('pauseDialog');

  let s = load() || C.createSession();
  let instruction = '';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'
    })[c]);
  }

  function setStatus(text){ status.textContent = text || ''; }

  function save(){
    s.updatedAtMs = Date.now();
    localStorage.setItem(KEY, C.serialise(s));
    sync();
  }

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? C.restore(raw) : null;
    } catch (e) {
      localStorage.removeItem(KEY);
      return null;
    }
  }

  function emit(type, payload){
    try { C.logEvent(s, type, payload); }
    catch (e) { console.warn(e); }
    save();
  }

  function sync(){
    document.documentElement.classList.toggle('large-text', !!s.settings.largeText);
    document.body.classList.toggle('reduced-motion', !!s.settings.reducedMotion);
    const lt = document.getElementById('largeTextToggle');
    const rm = document.getElementById('reducedMotionToggle');
    if (lt) lt.checked = !!s.settings.largeText;
    if (rm) rm.checked = !!s.settings.reducedMotion;
  }

  function go(next){
    const result = C.transition(s, next);
    if (!result.ok) { setStatus(result.reason); return; }
    emit('STATE_ENTER', {state: next});
    render();
  }

  function force(next){
    s.previousState = s.state;
    s.state = next;
    emit('STATE_ENTER', {state: next, controlledOverride: true});
    render();
  }

  function label(id){ return s.labels.find(x => x.id === id); }
  function last(){ return s.attempts[s.attempts.length - 1] || null; }

  function stepInfo(){
    const map = {
      S0_ENTRY: ['Start', 'Make examples'],
      S1_CONTRIBUTION: ['Choose how to begin', 'Make examples'],
      S2_CREATE: ['Make examples', 'Test a signal'],
      S3_PREDICT: ['Test a signal', 'Inspect the result'],
      S4_INSPECT: ['Inspect the result', 'Make a human check'],
      S5_CHECK: ['Make a human check', 'Change something'],
      S6_REVISE: ['Change something', 'Retest'],
      S7_RETEST: ['Compare attempts', 'Reflect'],
      S8_REFLECT: ['Reflect', 'Finish'],
      RECOVERY: ['Recover', 'Continue']
    };
    return map[s.state] || ['Continue', 'Continue'];
  }

  function stepNo(){
    return ({S0_ENTRY:0,S1_CONTRIBUTION:1,S2_CREATE:2,S3_PREDICT:3,S4_INSPECT:4,S5_CHECK:5,S6_REVISE:6,S7_RETEST:7,S8_REFLECT:8,RECOVERY:'!'})[s.state];
  }

  function progress(){
    const [now, next] = stepInfo();
    return `<div class="progress" aria-label="Current activity progress"><span class="active">Now: ${esc(now)}</span><span>Next: ${esc(next)}</span></div>`;
  }

  function head(title, text){
    instruction = text;
    return `${progress()}<div class="step"><div class="stepno">${stepNo()}</div><div><h2>${title}</h2><p>${text}</p></div></div>`;
  }

  function contributionPrompt(point, question){
    return `<div class="callout contribution-prompt" data-claim-point="${esc(point)}"><strong>${esc(question)}</strong><div class="controls"><button type="button" class="claim" data-choice="SELF">I'll do this part</button><button type="button" class="claim" data-choice="TOGETHER">Together</button><button type="button" class="claim" data-choice="PASS">Keep going</button></div></div>`;
  }

  function fields(sig, prefix, cls, id=''){
    const names = {pulseCount:'Pulse count', gapLength:'Gap length', beamWidth:'Beam width'};
    return C.FEATURES.map(f => `<div class="field"><label for="${prefix}-${f}">${names[f]}</label><input id="${prefix}-${f}" class="${cls}" data-feature="${f}" ${id ? `data-id="${id}"` : ''} type="range" min="1" max="5" step="1" value="${sig[f]}"><output>${sig[f]}</output></div>`).join('');
  }

  function mapControls(l){
    const m = l.mapping;
    const option = (selected, x) => `<option value="${x}" ${selected===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`;
    return `<div class="mapgrid"><label>Shape<select data-map="shape" data-label="${l.id}">${['circle','triangle','beam'].map(x=>option(m.shape,x)).join('')}</select></label><label>Motion<select data-map="motion" data-label="${l.id}">${['pulse','sweep','flash'].map(x=>option(m.motion,x)).join('')}</select></label><label>Tempo<select data-map="tempo" data-label="${l.id}">${['slow','medium','fast'].map(x=>option(m.tempo,x)).join('')}</select></label></div>`;
  }

  function exEditor(e){
    return `<div class="example"><div class="example-head"><strong>Example ${esc(e.id.slice(-5))}</strong><button class="delEx danger" data-id="${e.id}" type="button">Delete</button></div>${fields(e.features,'ex-'+e.id,'exFeature',e.id)}</div>`;
  }

  function beacon(labelId){
    if (!labelId) return `<div class="beacon"><div class="signal shape-beam">NOT SURE</div></div>`;
    const l = label(labelId), m = l.mapping;
    return `<div class="beacon"><div class="signal shape-${m.shape} motion-${m.motion} tempo-${m.tempo}">${esc(l.name)}</div></div>`;
  }

  function renderEntry(){
    return `${head('Explore a tiny signal AI','Make some signal examples, try a small model, inspect what happened, change something, and try again.')}<div class="card"><h3>Your activity</h3><p>You can make examples, set a test signal, inspect a result, and revise your work. There is no score and no single required way to work together.</p></div><div class="warning"><strong>Research activity:</strong> this tiny model is for exploration, not a real safety system.</div><div class="controls"><button id="start" class="primary">Start</button><a href="studyc-print.html" target="_blank" rel="noopener">Printable shared cards</a></div>`;
  }

  function renderContribution(){
    return `${head('How do you want to begin?','Either person can start, you can work together, or you can ignore this choice and simply continue. You can change how you work at any time.')}<div class="callout">No fixed expert role is assigned. Passing, helping, swapping and re-entering are all allowed.</div><div class="controls"><button id="beginSelf" class="primary">I'll start</button><button id="beginTogether">Start together</button><button id="toCreate">Just continue</button><button id="backStart">Back</button></div>`;
  }

  function renderCreate(){
    const ds = C.datasetStatus(s);
    const claim = s.examples.length === 0 ? contributionPrompt('CREATE_FIRST_EXAMPLE','Who wants to make the first example?') : contributionPrompt('CREATE_NEXT_CHANGE','Who wants to make the next dataset change?');
    return `${head('Build the training set','Create examples for two signal meanings. You can edit them later.')} ${claim}<div class="grid2">${s.labels.map(l=>`<section class="category"><h3>Category ${l.id} · ${ds.counts[l.id]||0}/2 minimum</h3><label>Category name<input class="category-name labelName" data-label="${l.id}" maxlength="24" value="${esc(l.name)}"></label>${mapControls(l)}<div>${s.examples.filter(e=>e.labelId===l.id).map(exEditor).join('')||'<p class="footer">No examples yet.</p>'}</div><button class="addEx primary" data-label="${l.id}" type="button">Add example</button></section>`).join('')}</div><div class="${ds.ok?'success':'warning'}">${ds.ok?'Training set ready.':'Add at least two examples to each category before testing.'}</div><div class="controls"><button id="toTest" class="primary" ${ds.ok?'':'disabled'}>Choose a test signal</button><button id="backContrib">Back</button></div>`;
  }

  function renderPredict(){
    return `${head('Choose a test signal','Set three visible features, then ask the model to produce a prediction from your examples.')} ${contributionPrompt('SET_TEST_SIGNAL','Who wants to set the test signal?')}<section class="card"><h3>Test signal</h3>${fields(s.testSignal,'test','testFeature')}</section><div class="controls"><button id="run" class="primary">${s.attempts.length?'Retest':'Run test'}</button><button id="backExamples">Back to examples</button></div>`;
  }

  function renderInspect(){
    const a = last();
    if (!a) return recover('No prediction is available.');
    const nearest = a.prediction.nearest;
    const resultText = a.prediction.kind === 'UNSURE_TIE' ? 'The model is not sure: closest examples disagree.' : `The model predicts: ${esc(a.prediction.labelName)}`;
    return `${head('Prediction and WHY','Inspect the closest example or examples before making your own check of the result.')} ${contributionPrompt('INSPECT_RESULT','Anyone want to lead the inspection or challenge what you see?')}<div class="result">${beacon(a.prediction.labelId)}<div><div class="callout"><strong>${resultText}</strong></div><h3>Closest example${nearest.length>1?'s':''}</h3>${nearest.map(x=>`<article class="card"><strong>${esc(x.example.id.slice(-5))} · ${esc(label(x.example.labelId)?.name||x.example.labelId)}</strong><p>Distance ${x.distance.toFixed(2)}</p><p>Pulse difference ${x.diffs.pulseCount}; gap difference ${x.diffs.gapLength}; width difference ${x.diffs.beamWidth}.</p></article>`).join('')}<p class="footer">These are the closest example(s) on the three visible features.</p></div></div><div class="controls"><button id="toCheck" class="primary">Make our check</button>${s.attempts.length>1?'<button id="toCompare">Compare attempts</button>':''}<button id="reviseEarly">Change something</button></div>`;
  }

  function renderCheck(){
    return `${head('Human check','Choose what you think about the prediction. The buttons record your judgement; they do not mark a correct answer.')} ${contributionPrompt('HUMAN_CHECK','Who wants to make or explain the human check?')}<div class="checkgrid"><button class="check" data-v="MATCHES">Matches our meaning</button><button class="check" data-v="DISAGREE">We disagree</button><button class="check" data-v="UNSURE">Not sure</button><button class="check" data-v="CHECK_AGAIN">Check the WHY again</button></div>`;
  }

  function renderRevise(){
    const a = last();
    return `${head('Change something','Edit examples, labels, feature values, the test signal or the beacon mapping. Your previous attempt stays saved.')} ${contributionPrompt('REVISE','Who wants to make the next change?')}<div class="callout"><strong>Latest attempt:</strong> ${esc(a?.prediction.labelName||'NOT SURE')}.</div><div class="controls"><button id="editExamples" class="primary">Edit training examples</button><button id="editTest">Change test signal</button><button id="sameTest" class="primary">Retest same signal</button></div>`;
  }

  function summary(a, title){
    return `<article class="card"><h3>${title}</h3>${a?`<p><strong>${esc(a.prediction.labelName||'NOT SURE')}</strong></p><p>Test: pulse ${a.testSignal.pulseCount}, gap ${a.testSignal.gapLength}, width ${a.testSignal.beamWidth}</p><p>Human check: ${esc(a.humanCheck||'not recorded')}</p>`:'<p>Not available.</p>'}</article>`;
  }

  function featureDiffs(before, after, prefix){
    const rows = [];
    for (const f of C.FEATURES) {
      const a = before?.[f], b = after?.[f];
      if (a !== b) rows.push(`${prefix} ${f}: ${a} → ${b}`);
    }
    return rows;
  }

  function changeTrace(a, b){
    if (!a || !b) return ['A full before/after trace is not available yet.'];
    const rows = [];

    const aExamples = new Map((a.datasetSnapshot||[]).map(e=>[e.id,e]));
    const bExamples = new Map((b.datasetSnapshot||[]).map(e=>[e.id,e]));
    for (const [id, exA] of aExamples) {
      const exB = bExamples.get(id);
      const short = id.slice(-5);
      if (!exB) { rows.push(`Example ${short}: removed`); continue; }
      if (exA.labelId !== exB.labelId) rows.push(`Example ${short} category: ${exA.labelId} → ${exB.labelId}`);
      rows.push(...featureDiffs(exA.features, exB.features, `Example ${short}`));
    }
    for (const [id] of bExamples) {
      if (!aExamples.has(id)) rows.push(`Example ${id.slice(-5)}: added`);
    }

    const aLabels = new Map((a.labelsSnapshot||[]).map(l=>[l.id,l]));
    const bLabels = new Map((b.labelsSnapshot||[]).map(l=>[l.id,l]));
    for (const [id, la] of aLabels) {
      const lb = bLabels.get(id);
      if (!lb) continue;
      if (la.name !== lb.name) rows.push(`Category ${id} name: ${la.name} → ${lb.name}`);
      for (const key of ['shape','motion','tempo']) {
        if (la.mapping?.[key] !== lb.mapping?.[key]) rows.push(`Category ${id} ${key}: ${la.mapping?.[key]} → ${lb.mapping?.[key]}`);
      }
    }

    rows.push(...featureDiffs(a.testSignal, b.testSignal, 'Test signal'));

    const predA = a.prediction?.labelName || 'NOT SURE';
    const predB = b.prediction?.labelName || 'NOT SURE';
    if (predA !== predB || a.prediction?.kind !== b.prediction?.kind) rows.push(`Prediction: ${predA} → ${predB}`);
    if ((a.humanCheck||null) !== (b.humanCheck||null)) rows.push(`Human check: ${a.humanCheck||'not recorded'} → ${b.humanCheck||'not recorded'}`);

    return rows.length ? rows : ['No model-relevant or recorded decision change was detected between these attempts.'];
  }

  function renderRetest(){
    const a = s.attempts.at(-2), b = last();
    const trace = changeTrace(a,b);
    return `${head('Compare before and after','Compare what changed with what the model did. A changed result is not automatically a better result.')}<div class="compare">${summary(a,'Attempt A')}${summary(b,'Attempt B')}</div><article class="card"><h3>What changed between attempts</h3><ul>${trace.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><div class="controls"><button id="inspectB" class="primary">Inspect Attempt B WHY</button><button id="again">Change again</button><button id="reflect" class="primary">Reflect and finish</button></div>`;
  }

  function renderReflect(){
    return `${head('Reflect and decide','Talk, point or demonstrate. You can skip any prompt. No answer is shown or scored here.')}<div class="cards"><article class="card"><h3>What do you think the model used?</h3><p class="footer">Describe, point or show what you noticed.</p></article><article class="card"><h3>What changed between your attempts?</h3><p class="footer">You can use the comparison above if helpful.</p></article><article class="card"><h3>What did you decide after seeing the prediction?</h3><p class="footer">Agreement, disagreement and uncertainty are all recordable.</p></article><article class="card"><h3>What would you change if you tried again?</h3><p class="footer">You may also say that you would keep it as it is.</p></article></div><div class="controls"><button id="another">Try another</button><button id="export2">Export session</button><button id="finish" class="primary">Finish</button></div>`;
  }

  function recover(msg){
    return `${head('Recover the activity',msg||'Something interrupted the current step. Your previous valid work is still available.')}<div class="warning">Choose where to return. A full reset is not required.</div><div class="controls"><button class="recover primary" data-state="S2_CREATE">Training examples</button><button class="recover" data-state="S3_PREDICT">Test signal</button><button class="recover" data-state="S0_ENTRY">Start</button></div>`;
  }

  function render(){
    setStatus('');
    sync();
    const renderer = {
      S0_ENTRY:renderEntry,
      S1_CONTRIBUTION:renderContribution,
      S2_CREATE:renderCreate,
      S3_PREDICT:renderPredict,
      S4_INSPECT:renderInspect,
      S5_CHECK:renderCheck,
      S6_REVISE:renderRevise,
      S7_RETEST:renderRetest,
      S8_REFLECT:renderReflect,
      RECOVERY:recover
    }[s.state] || recover;
    app.innerHTML = renderer();
    bind();
    save();
  }

  function addExample(id){
    const result = C.addExample(s,id,{pulseCount:3,gapLength:3,beamWidth:3});
    if (result.ok) emit('EXAMPLE_ADD',{exampleId:result.example.id,labelId:id});
    else setStatus(result.reason);
    render();
  }

  function run(){
    const prediction = C.predict(s,s.testSignal);
    if (!prediction.ok){ setStatus(prediction.reason); force('RECOVERY'); return; }
    const kind = s.attempts.length ? 'RETEST' : 'INITIAL';
    const attempt = C.makeAttempt(s,prediction,kind);
    emit(kind==='RETEST'?'RETEST_RUN':'PREDICT_RUN',{attemptId:attempt.id,kind:prediction.kind,labelId:prediction.labelId});
    if (kind==='RETEST') force('S7_RETEST'); else go('S4_INSPECT');
  }

  function download(){
    emit('SESSION_EXPORT',{attempts:s.attempts.length,examples:s.examples.length});
    const blob = new Blob([C.serialise(s)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom7-studyc-${s.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function bindClaimButtons(){
    [...app.querySelectorAll('.contribution-prompt')].forEach(panel => {
      panel.querySelectorAll('.claim').forEach(button => {
        button.addEventListener('click', () => {
          emit('CONTRIBUTION_CHOICE',{point:panel.dataset.claimPoint,choice:button.dataset.choice});
          panel.querySelectorAll('button').forEach(b=>b.disabled=true);
          const note = document.createElement('span');
          note.className = 'footer';
          note.textContent = button.dataset.choice==='SELF' ? 'Choice noted. Continue with the action.' : button.dataset.choice==='TOGETHER' ? 'Joint start noted. Continue with the action.' : 'No claim required. Continue.';
          panel.appendChild(note);
        });
      });
    });
  }

  function bind(){
    const $ = q => app.querySelector(q), $$ = q => [...app.querySelectorAll(q)];
    bindClaimButtons();

    $('#start')?.addEventListener('click',()=>{emit('SESSION_START',{});go('S1_CONTRIBUTION');});
    $('#beginSelf')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'SELF'});go('S2_CREATE');});
    $('#beginTogether')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'TOGETHER'});go('S2_CREATE');});
    $('#toCreate')?.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:'START',choice:'PASS'});go('S2_CREATE');});
    $('#backStart')?.addEventListener('click',()=>force('S0_ENTRY'));
    $('#backContrib')?.addEventListener('click',()=>force('S1_CONTRIBUTION'));

    $$('.addEx').forEach(b=>b.onclick=()=>addExample(b.dataset.label));
    $$('.delEx').forEach(b=>b.onclick=()=>{const r=C.deleteExample(s,b.dataset.id);if(r.ok)emit('EXAMPLE_DELETE',{exampleId:b.dataset.id});render();});
    $$('.exFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.value=i.value;const e=s.examples.find(x=>x.id===i.dataset.id);if(e){C.editExample(s,e.id,{features:{...e.features,[i.dataset.feature]:Number(i.value)}});emit('EXAMPLE_EDIT',{exampleId:e.id,feature:i.dataset.feature,value:Number(i.value)});}});
    $$('.labelName').forEach(i=>i.onchange=()=>{const l=label(i.dataset.label);l.name=(i.value.trim()||`Signal ${l.id}`).slice(0,24);emit('LABEL_EDIT',{labelId:l.id});render();});
    $$('[data-map]').forEach(x=>x.onchange=()=>{const l=label(x.dataset.label);l.mapping[x.dataset.map]=x.value;emit('OUTPUT_MAPPING_EDIT',{labelId:l.id,field:x.dataset.map,value:x.value});});

    $('#toTest')?.addEventListener('click',()=>go('S3_PREDICT'));
    $('#backExamples')?.addEventListener('click',()=>force('S2_CREATE'));
    $$('.testFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.value=i.value;s.testSignal[i.dataset.feature]=Number(i.value);emit('TEST_EDIT',{feature:i.dataset.feature,value:Number(i.value)});});
    $('#run')?.addEventListener('click',run);

    $('#toCheck')?.addEventListener('click',()=>go('S5_CHECK'));
    $('#toCompare')?.addEventListener('click',()=>force('S7_RETEST'));
    $('#reviseEarly')?.addEventListener('click',()=>go('S6_REVISE'));
    $$('.check').forEach(b=>b.onclick=()=>{
      C.setHumanCheck(s,b.dataset.v);
      emit('HUMAN_CHECK',{value:b.dataset.v});
      if (b.dataset.v==='CHECK_AGAIN') force('S4_INSPECT');
      else if (s.attempts.length>1) force('S7_RETEST');
      else go('S6_REVISE');
    });

    $('#editExamples')?.addEventListener('click',()=>force('S2_CREATE'));
    $('#editTest')?.addEventListener('click',()=>force('S3_PREDICT'));
    $('#sameTest')?.addEventListener('click',()=>force('S3_PREDICT'));
    $('#inspectB')?.addEventListener('click',()=>force('S4_INSPECT'));
    $('#again')?.addEventListener('click',()=>force('S6_REVISE'));
    $('#reflect')?.addEventListener('click',()=>force('S8_REFLECT'));
    $('#another')?.addEventListener('click',()=>force('S2_CREATE'));
    $('#export2')?.addEventListener('click',download);
    $('#finish')?.addEventListener('click',()=>{emit('SESSION_FINISH',{attempts:s.attempts.length});app.innerHTML='<div class="success"><h2>Session finished</h2><p>Your local session remains saved unless you start a new session.</p></div>';});
    $$('.recover').forEach(b=>b.onclick=()=>{C.recoverTo(s,b.dataset.state);emit('RECOVERY',{target:b.dataset.state});render();});
  }

  function openDialog(dialog){
    if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
  }

  document.getElementById('settingsBtn')?.addEventListener('click',()=>openDialog(settings));
  document.getElementById('pauseBtn')?.addEventListener('click',()=>{s.paused=true;emit('PAUSE_OPEN',{});openDialog(pause);});
  document.getElementById('exportBtn')?.addEventListener('click',download);

  document.getElementById('largeTextToggle')?.addEventListener('change',e=>{s.settings.largeText=!!e.target.checked;emit('ACCESSIBILITY_CHANGE',{setting:'largeText',value:s.settings.largeText});render();});
  document.getElementById('reducedMotionToggle')?.addEventListener('change',e=>{s.settings.reducedMotion=!!e.target.checked;emit('ACCESSIBILITY_CHANGE',{setting:'reducedMotion',value:s.settings.reducedMotion});render();});

  document.getElementById('readAloudBtn')?.addEventListener('click',()=>{
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance){ setStatus('Read aloud is not available in this browser.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(instruction || '');
    window.speechSynthesis.speak(utterance);
    emit('READ_ALOUD',{state:s.state});
  });

  document.getElementById('restoreBtn')?.addEventListener('click',()=>{
    const restored = load();
    if (!restored){ setStatus('No saved session is available on this device.'); return; }
    s = restored;
    emit('SESSION_RESTORE',{});
    if (settings?.open) settings.close();
    render();
  });

  document.getElementById('newSessionBtn')?.addEventListener('click',()=>{
    localStorage.removeItem(KEY);
    s = C.createSession();
    emit('NEW_SESSION',{});
    if (settings?.open) settings.close();
    render();
  });

  document.getElementById('finishNowBtn')?.addEventListener('click',()=>{
    emit('SESSION_FINISH',{attempts:s.attempts.length,early:true});
    if (pause?.open) pause.close();
    app.innerHTML='<div class="success"><h2>Session finished</h2><p>Your local session remains saved unless you start a new session.</p></div>';
  });

  pause?.addEventListener('close',()=>{s.paused=false;emit('PAUSE_CLOSE',{returnValue:pause.returnValue||null});});

  sync();
  render();
})();