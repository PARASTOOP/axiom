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

  const ACTOR_LABEL = {
    YOUNG_PERSON: 'Young person',
    FAMILY_MEMBER: 'Family member',
    TOGETHER: 'Together',
    UNASSIGNED: 'Not assigned'
  };

  const CHALLENGE_TEXT = {
    1: {title:'Core challenge', text:'Create examples, inspect one prediction and make your own human judgement.'},
    2: {title:'Deeper challenge: ambiguity and comparison', text:'Try to create or inspect a case where more than one interpretation is plausible. Compare what changed before deciding.'},
    3: {title:'Deeper challenge: counterfactual and responsibility', text:'Before retesting, predict how one deliberate change might affect the model result, then inspect whether that expectation was supported.'}
  };

  let s = load() || C.createSession();
  let instruction = '';

  function esc(v){
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function setStatus(text){ status.textContent = text || ''; }
  function save(){ s.updatedAtMs = Date.now(); localStorage.setItem(KEY, C.serialise(s)); sync(); }
  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const restored = C.restore(raw);
      localStorage.setItem(KEY, C.serialise(restored));
      return restored;
    } catch (e) {
      console.warn('Saved Study C session could not be restored:', e);
      return null;
    }
  }
  function emit(type, payload){ try { C.logEvent(s, type, payload); } catch (e) { console.warn(e); } save(); }
  function actor(){ return C.normaliseActor(s.currentActionActor) || 'UNASSIGNED'; }
  function actorPayload(extra){ return {actor: actor(), ...(extra || {})}; }

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
      S1_CONTRIBUTION:['Choose how to begin','Set a purpose'],
      S1B_RELEVANCE:['Set a purpose','Make signal examples'],
      S2_CREATE:['Make signal examples','Make a new test signal'],
      S3_PREDICT:['Make a new test signal','See the model result'],
      S4_INSPECT:['See why the model chose it','Make your own check'],
      S5_CHECK:['Make your own check','Change something'],
      S6_REVISE:['Change something','Test again'],
      S7_RETEST:['Compare before and after','Choose what to try next'],
      S8_REFLECT:['Reflect','Finish'],
      RECOVERY:['Recover','Continue']
    };
    return map[s.state] || ['Continue','Continue'];
  }
  function stepNo(){ return ({S0_ENTRY:0,S1_CONTRIBUTION:1,S1B_RELEVANCE:'1B',S2_CREATE:2,S3_PREDICT:3,S4_INSPECT:4,S5_CHECK:5,S6_REVISE:6,S7_RETEST:7,S8_REFLECT:8,RECOVERY:'!'})[s.state]; }
  function progress(){ const [now,next] = stepInfo(); return `<div class="progress" aria-label="Current activity progress"><span class="active">Now: ${esc(now)}</span><span>Next: ${esc(next)}</span></div>`; }
  function head(title,text){ instruction=text; return `${progress()}<div class="step"><div class="stepno">${stepNo()}</div><div><h2>${title}</h2><p>${text}</p></div></div>`; }

  function featureGuide(){
    return `<div class="feature-guide" aria-label="Signal feature guide"><article><strong>1. Number of flashes</strong><span>How many times the light flashes.</span></article><article><strong>2. Pause</strong><span>How long the dark gap is between flashes.</span></article><article><strong>3. Beam width</strong><span>How narrow or wide the light looks.</span></article></div>`;
  }

  function contributionPrompt(point,question){
    return `<details class="contribution-prompt" data-claim-point="${esc(point)}"><summary>${esc(question)} <span class="optional-label">optional</span></summary><div class="controls"><button type="button" class="claim" data-choice="SELF">One person</button><button type="button" class="claim" data-choice="TOGETHER">Together</button><button type="button" class="claim" data-choice="PASS">Keep going</button></div></details>`;
  }

  function actorPicker(question='Who is leading this next change?'){
    return `<details class="contribution-prompt actor-picker"><summary>${esc(question)} <span class="optional-label">change any time</span></summary><p class="field-help">This records action provenance for the research trace. It is not a score or role.</p><div class="controls">${C.ACTORS.map(a=>`<button type="button" class="actor-choice ${actor()===a?'primary':''}" data-actor="${a}">${esc(ACTOR_LABEL[a])}</button>`).join('')}</div></details>`;
  }

  function relevanceSummary(){
    if (!s.relevance || s.relevance.mode === 'SKIPPED' || !s.relevance.purposeLabel) return `<div class="callout"><strong>Purpose:</strong> not set. You can still explore the model and return to add one later.</div>`;
    const who = s.relevance.beneficiaryLabel ? ` · for ${esc(s.relevance.beneficiaryLabel)}` : '';
    return `<div class="callout"><strong>Your purpose / criterion:</strong> ${esc(s.relevance.purposeLabel)}${who}</div>`;
  }

  function challengeSummary(){
    const c = CHALLENGE_TEXT[s.challengeLayer] || CHALLENGE_TEXT[1];
    return `<div class="concept-card"><strong>${esc(c.title)}</strong><p>${esc(c.text)}</p></div>`;
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
    return `${head('First, understand the signal task','You will make two kinds of light-signal examples, ask a tiny model to compare a new signal with them, inspect why, and make your own decision.')}<div class="journey"><article><strong>1. Set a purpose</strong><span>Decide what you want the signal meanings to help communicate or do.</span></article><article><strong>2. Make and test examples</strong><span>Create two named groups and one new signal.</span></article><article><strong>3. Inspect and decide</strong><span>See which example was closest, then make a human judgement.</span></article></div>${featureGuide()}<div class="callout"><strong>No AI knowledge needed.</strong> This tiny model only compares the new signal with the examples you make. It does not know the “right” meaning on its own.</div><div class="warning"><strong>Research activity:</strong> this is one simple model for exploration, not a real safety system and not a picture of how all AI works.</div><div class="controls"><button id="start" class="primary">I understand — start</button><a href="studyc-print.html" target="_blank" rel="noopener">Printable shared cards</a></div>`;
  }

  function renderContribution(){
    return `${head('How do you want to begin?','Either person can start, you can work together, or you can simply continue. There is no fixed expert role.')}<div class="callout">You can pass, help, swap or re-enter later. Contribution and control can change during the activity.</div><div class="controls"><button id="beginYoung" class="primary">Young person starts</button><button id="beginFamily">Family member starts</button><button id="beginTogether">Start together</button><button id="toRelevance">Just continue</button><button id="backStart">Back</button></div>`;
  }

  function renderRelevance(){
    const current = s.relevance?.purposeLabel || '';
    const beneficiary = s.relevance?.beneficiaryLabel || '';
    return `${head('Set a purpose for your signal meanings','Decide what you want these signals to help communicate or do. This purpose will come back later when you make the human decision.')} ${actorPicker('Who is leading the purpose choice?')}<section class="card"><label><strong>What should the signals help communicate or do?</strong><input id="purposeInput" maxlength="90" value="${esc(current)}" placeholder="e.g. Help a crew choose where to go"></label><label><strong>Optional: who or what is it for?</strong><input id="beneficiaryInput" maxlength="60" value="${esc(beneficiary)}" placeholder="e.g. a boat, a family, a robot"></label><div class="controls"><button class="purposeChoice" data-purpose="Share a warning or important message">Use a starting idea: warning/message</button><button class="purposeChoice" data-purpose="Guide someone or something toward a choice">Use a starting idea: guidance</button><button class="purposeChoice" data-purpose="Create a signal pattern with a meaning we choose">Use a starting idea: our own meaning</button></div></section><details id="familySupport" class="optional-controls"><summary>Optional: want another perspective?</summary><p class="field-help">A family member can help without deciding the final purpose.</p><ul><li>Ask: “What would you like the signal to help with?”</li><li>Notice: “That idea could matter because…”</li><li>Offer: “One possibility is…, but you can keep or change it.”</li></ul></details><div class="controls"><button id="savePurpose" class="primary">Use this purpose</button><button id="skipPurpose">Skip for now</button><button id="backContribution">Back</button></div>`;
  }

  function renderCreate(){
    const ds=C.datasetStatus(s), claim=s.examples.length===0?contributionPrompt('CREATE_FIRST_EXAMPLE','Who wants to make the first example?'):contributionPrompt('CREATE_NEXT_CHANGE','Who wants to make the next change?');
    return `${head('Make examples for two signal meanings','Give each signal meaning at least two examples. The model will later compare a new signal with these examples.')} ${relevanceSummary()}${challengeSummary()}${actorPicker()}<div class="concept-card"><strong>Each example has only three settings.</strong>${featureGuide()}</div>${claim}<div class="grid2">${s.labels.map(l=>`<section class="category"><h3>Signal meaning ${l.id} · ${ds.counts[l.id]||0}/2 examples</h3><label>Give this signal meaning a short name<input class="category-name labelName" data-label="${l.id}" maxlength="24" value="${esc(l.name)}" placeholder="e.g. Safe harbour"></label>${mapControls(l)}<div>${s.examples.filter(e=>e.labelId===l.id).map(exEditor).join('')||'<p class="footer">No examples yet. Add one, then set its three signal features.</p>'}</div><button class="addEx primary" data-label="${l.id}" type="button">Add a signal example</button></section>`).join('')}</div><div class="${ds.ok?'success':'warning'}">${ds.ok?'Your examples are ready. Next, make one new signal for the model to compare.':'Add at least two examples to each signal meaning before testing.'}</div><div class="controls"><button id="toTest" class="primary" ${ds.ok?'':'disabled'}>Next: make a test signal</button><button id="editPurpose">Edit purpose</button><button id="backContrib">Back</button></div>`;
  }

  function renderPredict(){
    return `${head('Make one new test signal','Set its three features, then run the test. The model will only compare this signal with the examples you made.')} ${relevanceSummary()}${challengeSummary()}${actorPicker()}${contributionPrompt('SET_TEST_SIGNAL','Who wants to set the test signal?')}<section class="card"><h3>Your new test signal</h3>${signalRecipe(s.testSignal)}${fields(s.testSignal,'test','testFeature')}</section><div class="controls"><button id="run" class="primary">${s.attempts.length?'Run the test again':'Run the test'}</button><button id="backExamples">Back to examples</button></div>`;
  }

  function differencePhrase(feature,diff){ const name=FEATURE_META[feature].short; if(diff===0)return `same ${name}`; if(diff===1)return `${name} differs by 1 step`; return `${name} differs by ${diff} steps`; }
  function plainWhy(x){ const categoryName=label(x.example.labelId)?.name||x.example.labelId, parts=C.FEATURES.map(f=>differencePhrase(f,x.diffs[f])); return `<article class="card why-card"><strong>Closest example: ${esc(categoryName)}</strong>${signalRecipe(x.example.features)}<p>This example is closest overall across the three signal settings: ${esc(parts.join(', '))}.</p><details class="technical-details"><summary>Show the numbers</summary><p>Overall distance: ${x.distance.toFixed(2)}</p><p>Flash difference: ${x.diffs.pulseCount}; pause difference: ${x.diffs.gapLength}; width difference: ${x.diffs.beamWidth}.</p></details></article>`; }

  function renderInspect(){
    const a=last(); if(!a)return recover('No model result is available.'); const nearest=a.prediction.nearest; const resultText=a.prediction.kind==='UNSURE_TIE'?'The model is not sure because equally close examples point to different meanings.':`The model predicts: ${esc(a.prediction.labelName)}`;
    return `${head('See the model result and why','The model result is not a score or answer key. First inspect the example or examples it found closest.')} ${relevanceSummary()}${challengeSummary()}<div class="result-result"><div class="model-result"><span class="result-label">MODEL RESULT</span>${beacon(a.prediction.labelId)}<div class="callout"><strong>${resultText}</strong></div></div><div><h3>Why did it choose this?</h3><p class="field-help">It chose the closest example overall across flashes, pause and beam width.</p>${nearest.map(plainWhy).join('')}</div></div>${contributionPrompt('INSPECT_RESULT','Anyone want to lead the inspection or challenge what you see?')}<div class="next-decision"><strong>Next, make your own human check.</strong><span>Use the purpose you set as one criterion, if helpful.</span></div><div class="controls"><button id="toCheck" class="primary">Next: make our check</button>${s.attempts.length>1?'<button id="toCompare">Back to comparison</button>':''}<button id="reviseEarly">Change something</button></div>`;
  }

  function renderCheck(){
    const criterion = s.relevance?.purposeLabel ? `Your purpose was: “${esc(s.relevance.purposeLabel)}”. Does the model result make sense for that purpose and the meanings you created?` : 'Does the model result make sense for the meanings you created?';
    return `${head('What do you think about the model result?','Choose your judgement. These buttons record what you think; they do not mark a correct answer.')} ${relevanceSummary()}${actorPicker('Who is leading this human decision?')}<div class="callout"><strong>Human criterion:</strong> ${criterion}</div>${contributionPrompt('HUMAN_CHECK','Who wants to make or explain this check?')}<div class="checkgrid"><button class="check" data-v="MATCHES">It makes sense for our purpose/meaning</button><button class="check" data-v="DISAGREE">We disagree with it</button><button class="check" data-v="UNSURE">We're not sure</button><button class="check" data-v="CHECK_AGAIN">Look at WHY again</button></div>`;
  }

  function renderRevise(){ const a=last(); return `${head('Change one thing and try again','Change an example, category name, signal feature, test signal or purpose. Your previous attempt stays saved so you can compare before and after.')} ${actorPicker()}${relevanceSummary()}<div class="callout"><strong>Latest model result:</strong> ${esc(a?.prediction.labelName||'NOT SURE')}.</div><div class="controls"><button id="editExamples" class="primary">Change the examples</button><button id="editTest">Change the test signal</button><button id="editPurpose2">Change the purpose</button><button id="sameTest" class="primary">Keep this signal and test again</button></div>`; }
  function summary(a,title){ return `<article class="card"><h3>${title}</h3>${a?`<p><strong>Model result: ${esc(a.prediction.labelName||'NOT SURE')}</strong></p>${signalRecipe(a.testSignal)}<p>Your check: ${esc(a.humanCheck||'not recorded')}</p><p>Challenge layer: ${esc(a.challengeLayerSnapshot || 1)}</p>`:'<p>Not available.</p>'}</article>`; }

  function featureDiffs(before,after,prefix){ const rows=[]; for(const f of C.FEATURES){const a=before?.[f],b=after?.[f];if(a!==b)rows.push(`${prefix} ${FEATURE_META[f].short}: ${a} → ${b}`);} return rows; }
  function changeTrace(a,b){
    if(!a||!b)return ['A full before/after trace is not available yet.'];
    const rows=[], aExamples=new Map((a.datasetSnapshot||[]).map(e=>[e.id,e])), bExamples=new Map((b.datasetSnapshot||[]).map(e=>[e.id,e]));
    for(const [id,e] of aExamples){const next=bExamples.get(id);if(!next){rows.push(`Example removed from ${e.labelId}`);continue;}if(e.labelId!==next.labelId)rows.push(`Example category: ${e.labelId} → ${next.labelId}`);rows.push(...featureDiffs(e.features,next.features,'Example'));}
    for(const [id,e] of bExamples)if(!aExamples.has(id))rows.push(`Example added to ${e.labelId}`);
    const aLabels=new Map((a.labelsSnapshot||[]).map(l=>[l.id,l])), bLabels=new Map((b.labelsSnapshot||[]).map(l=>[l.id,l]));
    for(const [id,la] of aLabels){const lb=bLabels.get(id);if(!lb)continue;if(la.name!==lb.name)rows.push(`Category ${id} name: ${la.name} → ${lb.name}`);for(const key of ['shape','motion','tempo'])if(la.mapping?.[key]!==lb.mapping?.[key])rows.push(`Category ${id} ${key}: ${la.mapping?.[key]} → ${lb.mapping?.[key]}`);}
    rows.push(...featureDiffs(a.testSignal,b.testSignal,'Test signal'));
    if ((a.relevanceSnapshot?.purposeLabel||'') !== (b.relevanceSnapshot?.purposeLabel||'')) rows.push(`Purpose: ${a.relevanceSnapshot?.purposeLabel||'not set'} → ${b.relevanceSnapshot?.purposeLabel||'not set'}`);
    const predA=a.prediction?.labelName||'NOT SURE', predB=b.prediction?.labelName||'NOT SURE'; if(predA!==predB||a.prediction?.kind!==b.prediction?.kind)rows.push(`Model result: ${predA} → ${predB}`); if((a.humanCheck||null)!==(b.humanCheck||null))rows.push(`Human check: ${a.humanCheck||'not recorded'} → ${b.humanCheck||'not recorded'}`);
    return rows.length?rows:['No model-relevant or recorded decision change was detected between these attempts.'];
  }

  const PROVENANCE_TYPES = new Set(['RELEVANCE_SET','RELEVANCE_EDIT','EXAMPLE_ADD','EXAMPLE_DELETE','EXAMPLE_EDIT','LABEL_EDIT','OUTPUT_MAPPING_EDIT','TEST_EDIT','HUMAN_CHECK','CHALLENGE_STAY','CHALLENGE_EXTEND','CHALLENGE_RETREAT']);
  function provenanceTrace(){
    const items=(s.events||[]).filter(e=>PROVENANCE_TYPES.has(e.eventType) && e.payload?.actor).slice(-10);
    if(!items.length)return ['No actor-linked consequential action has been recorded yet.'];
    return items.map(e=>`${ACTOR_LABEL[e.payload.actor]||e.payload.actor}: ${e.eventType.replaceAll('_',' ').toLowerCase()}`);
  }

  function challengePanel(){
    const layer=s.challengeLayer, canUp=layer<C.MAX_CHALLENGE_LAYER, canDown=layer>C.MIN_CHALLENGE_LAYER;
    return `<article class="card"><h3>Choose the next challenge depth</h3>${challengeSummary()}<p class="field-help">This is not a score. Stay, extend or step back based on what you want to explore.</p><div class="controls"><button class="challenge" data-action="STAY">Stay at layer ${layer}</button>${canUp?`<button class="challenge primary" data-action="EXTEND">Try layer ${layer+1}</button>`:''}${canDown?`<button class="challenge" data-action="RETREAT">Step back to layer ${layer-1}</button>`:''}</div></article>`;
  }

  function renderRetest(){
    const a=s.attempts.at(-2),b=last(),trace=changeTrace(a,b);
    return `${head('Compare before and after','Look at what changed and what happened to the model result. A changed result is not automatically a better result.')}<div class="compare">${summary(a,'Attempt A — before')}${summary(b,'Attempt B — after')}</div><article class="card"><h3>What changed?</h3><ul>${trace.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article class="card"><h3>Who changed what?</h3><p class="field-help">This is a provenance trace, not a score or ownership ranking.</p><ul>${provenanceTrace().map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>${challengePanel()}<div class="controls"><button id="inspectB" class="primary">See WHY for Attempt B</button><button id="again">Change something again</button><button id="anotherCycle">Try another cycle</button><button id="reflect" class="primary">Reflect and finish</button></div>`;
  }

  function renderReflect(){
    return `${head('Reflect and decide','Talk, point or demonstrate. You can skip any prompt. No answer is shown or scored here.')} ${relevanceSummary()}<div class="cards"><article class="card"><h3>What do you think the model compared?</h3><p class="footer">Describe, point or show what you noticed.</p></article><article class="card"><h3>How did your purpose affect your human decision?</h3><p class="footer">You can say it mattered, did not matter, or was unclear.</p></article><article class="card"><h3>What changed between your attempts?</h3><p class="footer">Use the before/after and provenance traces if helpful.</p></article><article class="card"><h3>What would you change if you tried again?</h3><p class="footer">You may also keep it as it is.</p></article></div><div class="controls"><button id="another">Try another</button><button id="export2">Export session</button><button id="finish" class="primary">Finish</button></div>`;
  }

  function recover(msg){ return `${head('Recover the activity',msg||'Something interrupted the current step. Your previous valid work is still available.')}<div class="warning">Choose where to return. A full reset is not required.</div><div class="controls"><button class="recover primary" data-state="S2_CREATE">Signal examples</button><button class="recover" data-state="S3_PREDICT">Test signal</button><button class="recover" data-state="S1B_RELEVANCE">Purpose</button><button class="recover" data-state="S0_ENTRY">Start</button></div>`; }

  function render(){ setStatus(''); sync(); const renderer={S0_ENTRY:renderEntry,S1_CONTRIBUTION:renderContribution,S1B_RELEVANCE:renderRelevance,S2_CREATE:renderCreate,S3_PREDICT:renderPredict,S4_INSPECT:renderInspect,S5_CHECK:renderCheck,S6_REVISE:renderRevise,S7_RETEST:renderRetest,S8_REFLECT:renderReflect,RECOVERY:recover}[s.state]||recover; app.innerHTML=renderer(); bind(); save(); }

  function addExample(id){ const result=C.addExample(s,id,{pulseCount:3,gapLength:3,beamWidth:3}); if(result.ok)emit('EXAMPLE_ADD',actorPayload({exampleId:result.example.id,labelId:id})); else setStatus(result.reason); render(); }
  function run(){ const prediction=C.predict(s,s.testSignal); if(!prediction.ok){setStatus(prediction.reason);force('RECOVERY');return;} const kind=s.attempts.length?'RETEST':'INITIAL',attempt=C.makeAttempt(s,prediction,kind); emit(kind==='RETEST'?'RETEST_RUN':'PREDICT_RUN',{attemptId:attempt.id,kind:prediction.kind,labelId:prediction.labelId,systemActor:'MODEL'}); if(kind==='RETEST')force('S7_RETEST');else go('S4_INSPECT'); }
  function download(){ emit('SESSION_EXPORT',{attempts:s.attempts.length,examples:s.examples.length}); const blob=new Blob([C.serialise(s)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`axiom7-studyc-${s.sessionId}.json`;a.click();URL.revokeObjectURL(url); }

  function bindClaimButtons(){ [...app.querySelectorAll('.contribution-prompt[data-claim-point]')].forEach(panel=>{panel.querySelectorAll('.claim').forEach(button=>{button.addEventListener('click',()=>{emit('CONTRIBUTION_CHOICE',{point:panel.dataset.claimPoint,choice:button.dataset.choice,actor:actor()});panel.querySelectorAll('button').forEach(b=>b.disabled=true);const note=document.createElement('span');note.className='footer';note.textContent=button.dataset.choice==='TOGETHER'?'Joint action noted. Continue.':button.dataset.choice==='PASS'?'No claim required. Continue.':'Contribution choice noted. Continue.';panel.appendChild(note);});});}); }
  function bindActorPicker(){ app.querySelectorAll('.actor-choice').forEach(b=>b.addEventListener('click',()=>{const r=C.setActionActor(s,b.dataset.actor);if(r.ok){emit('ACTION_ACTOR_SET',{actor:r.actor});render();}else setStatus(r.reason);})); }

  function bind(){
    const $=q=>app.querySelector(q),$$=q=>[...app.querySelectorAll(q)]; bindClaimButtons(); bindActorPicker();
    $('#start')?.addEventListener('click',()=>{emit('SESSION_START',{});go('S1_CONTRIBUTION');});
    $('#beginYoung')?.addEventListener('click',()=>{C.setActionActor(s,'YOUNG_PERSON');emit('CONTRIBUTION_CHOICE',{point:'START',choice:'SELF',actor:'YOUNG_PERSON'});go('S1B_RELEVANCE');});
    $('#beginFamily')?.addEventListener('click',()=>{C.setActionActor(s,'FAMILY_MEMBER');emit('CONTRIBUTION_CHOICE',{point:'START',choice:'SELF',actor:'FAMILY_MEMBER'});go('S1B_RELEVANCE');});
    $('#beginTogether')?.addEventListener('click',()=>{C.setActionActor(s,'TOGETHER');emit('CONTRIBUTION_CHOICE',{point:'START',choice:'TOGETHER',actor:'TOGETHER'});go('S1B_RELEVANCE');});
    $('#toRelevance')?.addEventListener('click',()=>go('S1B_RELEVANCE')); $('#backStart')?.addEventListener('click',()=>force('S0_ENTRY')); $('#backContribution')?.addEventListener('click',()=>force('S1_CONTRIBUTION'));

    $('#familySupport')?.addEventListener('toggle',e=>{if(e.target.open)emit('FAMILY_RELEVANCE_SUPPORT_OPEN',{actor:actor()});});
    $$('.purposeChoice').forEach(b=>b.addEventListener('click',()=>{const input=$('#purposeInput');if(input){input.value=b.dataset.purpose;setStatus('Starting idea added. Change it if you want.');}}));
    $('#savePurpose')?.addEventListener('click',()=>{const purpose=$('#purposeInput')?.value||'',beneficiary=$('#beneficiaryInput')?.value||'';const r=C.setRelevance(s,{mode:'AUTHORED',purposeLabel:purpose,beneficiaryLabel:beneficiary});if(!r.ok){setStatus(r.reason);return;}emit('RELEVANCE_SET',actorPayload({mode:r.relevance.mode,purposeLabel:r.relevance.purposeLabel,beneficiaryLabel:r.relevance.beneficiaryLabel}));go('S2_CREATE');});
    $('#skipPurpose')?.addEventListener('click',()=>{C.setRelevance(s,{mode:'SKIPPED'});emit('RELEVANCE_SKIP',actorPayload({mode:'SKIPPED'}));go('S2_CREATE');});

    $$('.addEx').forEach(b=>b.onclick=()=>addExample(b.dataset.label));
    $$('.delEx').forEach(b=>b.onclick=()=>{const r=C.deleteExample(s,b.dataset.id);if(r.ok)emit('EXAMPLE_DELETE',actorPayload({exampleId:b.dataset.id}));render();});
    $$('.exFeature').forEach(i=>i.onchange=()=>{const e=s.examples.find(x=>x.id===i.dataset.id);if(e){const r=C.editExample(s,e.id,{features:{...e.features,[i.dataset.feature]:Number(i.value)}});if(r.ok)emit('EXAMPLE_EDIT',actorPayload({exampleId:e.id,feature:i.dataset.feature,value:Number(i.value)}));render();}});
    $$('.exFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.querySelector('output').value=i.value;});
    $$('.labelName').forEach(i=>i.onchange=()=>{const l=label(i.dataset.label);l.name=(i.value.trim()||`Signal ${l.id}`).slice(0,24);emit('LABEL_EDIT',actorPayload({labelId:l.id,name:l.name}));render();});
    $$('[data-map]').forEach(x=>x.onchange=()=>{const l=label(x.dataset.label);l.mapping[x.dataset.map]=x.value;emit('OUTPUT_MAPPING_EDIT',actorPayload({labelId:l.id,field:x.dataset.map,value:x.value}));});
    $('#toTest')?.addEventListener('click',()=>go('S3_PREDICT')); $('#backExamples')?.addEventListener('click',()=>force('S2_CREATE')); $('#editPurpose')?.addEventListener('click',()=>force('S1B_RELEVANCE')); $('#backContrib')?.addEventListener('click',()=>force('S1_CONTRIBUTION'));

    $$('.testFeature').forEach(i=>i.oninput=()=>{i.nextElementSibling.querySelector('output').value=i.value;s.testSignal[i.dataset.feature]=Number(i.value);});
    $$('.testFeature').forEach(i=>i.onchange=()=>emit('TEST_EDIT',actorPayload({feature:i.dataset.feature,value:Number(i.value)})));
    $('#run')?.addEventListener('click',run);
    $('#toCheck')?.addEventListener('click',()=>go('S5_CHECK')); $('#toCompare')?.addEventListener('click',()=>force('S7_RETEST')); $('#reviseEarly')?.addEventListener('click',()=>go('S6_REVISE'));
    $$('.check').forEach(b=>b.onclick=()=>{C.setHumanCheck(s,b.dataset.v);emit('HUMAN_CHECK',actorPayload({value:b.dataset.v,relevanceMode:s.relevance?.mode||'SKIPPED',purposeLabel:s.relevance?.purposeLabel||''}));if(b.dataset.v==='CHECK_AGAIN')force('S4_INSPECT');else if(s.attempts.length>1)force('S7_RETEST');else go('S6_REVISE');});
    $('#editExamples')?.addEventListener('click',()=>force('S2_CREATE')); $('#editTest')?.addEventListener('click',()=>force('S3_PREDICT')); $('#editPurpose2')?.addEventListener('click',()=>force('S1B_RELEVANCE')); $('#sameTest')?.addEventListener('click',()=>force('S3_PREDICT')); $('#inspectB')?.addEventListener('click',()=>force('S4_INSPECT')); $('#again')?.addEventListener('click',()=>force('S6_REVISE')); $('#anotherCycle')?.addEventListener('click',()=>force('S2_CREATE')); $('#reflect')?.addEventListener('click',()=>force('S8_REFLECT')); $('#another')?.addEventListener('click',()=>force('S2_CREATE')); $('#export2')?.addEventListener('click',download);
    $$('.challenge').forEach(b=>b.onclick=()=>{const r=C.setChallengeLayer(s,b.dataset.action);if(!r.ok){setStatus(r.reason);return;}emit(`CHALLENGE_${b.dataset.action}`,actorPayload({fromLayer:r.fromLayer,toLayer:r.toLayer,conceptualDemand:CHALLENGE_TEXT[r.toLayer]?.title||'core'}));render();});

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
