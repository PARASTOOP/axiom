const assert=require('assert');
const C=require('../js/studyc-core.js');

function ready(){
  const s=C.createSession();
  C.addExample(s,'A',{pulseCount:1,gapLength:1,beamWidth:1});
  C.addExample(s,'A',{pulseCount:2,gapLength:1,beamWidth:1});
  C.addExample(s,'B',{pulseCount:5,gapLength:5,beamWidth:5});
  C.addExample(s,'B',{pulseCount:4,gapLength:5,beamWidth:5});
  return s;
}

(function(){
  assert.strictEqual(C.SCHEMA_VERSION,2,'T00 schema');
  assert.strictEqual(C.distance({pulseCount:2,gapLength:3,beamWidth:4},{pulseCount:2,gapLength:3,beamWidth:4}),0,'T01');
  let s=ready(),p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2});
  assert.ok(p.ok,'T02a'); assert.strictEqual(p.labelId,'A','T02b');
  let b=s.examples.find(e=>e.labelId==='B'); C.editExample(s,b.id,{features:{pulseCount:1,gapLength:1,beamWidth:2}}); p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2}); assert.strictEqual(p.labelId,'B','T03');
  C.addExample(s,'B',{pulseCount:5,gapLength:4,beamWidth:5}); C.editExample(s,b.id,{labelId:'A'}); p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2}); assert.ok(p.ok,'T04a'); assert.strictEqual(p.labelId,'A','T04b');

  s=C.createSession(); C.addExample(s,'A',{pulseCount:1,gapLength:1,beamWidth:1}); C.addExample(s,'A',{pulseCount:1,gapLength:1,beamWidth:2}); C.addExample(s,'B',{pulseCount:1,gapLength:1,beamWidth:1}); C.addExample(s,'B',{pulseCount:5,gapLength:5,beamWidth:5}); p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:1}); assert.strictEqual(p.kind,'UNSURE_TIE','T05'); assert.strictEqual(p.nearest.length,2,'T05b');
  s=C.createSession(); C.addExample(s,'A',{pulseCount:1,gapLength:1,beamWidth:1}); assert.strictEqual(C.predict(s,{pulseCount:1,gapLength:1,beamWidth:1}).ok,false,'T06');

  s=ready(); p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:1}); const a=C.makeAttempt(s,p,'INITIAL'),snap=JSON.stringify(a.datasetSnapshot); C.editExample(s,s.examples[0].id,{features:{pulseCount:3,gapLength:3,beamWidth:3}}); assert.strictEqual(JSON.stringify(a.datasetSnapshot),snap,'T07 snapshot');
  assert.strictEqual(C.transition(s,C.STATES.REFLECT).ok,false,'T08 invalid transition');

  s=ready(); const before=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2});
  let r=C.setRelevance(s,{mode:'AUTHORED',purposeLabel:'Help choose a safe route',beneficiaryLabel:'a crew'}); assert.ok(r.ok,'T09a');
  const after=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2}); assert.deepStrictEqual({kind:before.kind,labelId:before.labelId,minimumDistance:before.minimumDistance},{kind:after.kind,labelId:after.labelId,minimumDistance:after.minimumDistance},'T09b relevance must not alter 1NN');
  const restored=C.restore(C.serialise(s)); assert.strictEqual(restored.relevance.purposeLabel,'Help choose a safe route','T09c relevance restore');
  assert.strictEqual(C.setRelevance(s,{mode:'AUTHORED',purposeLabel:''}).ok,false,'T09d authored relevance needs purpose');

  assert.ok(C.setActionActor(s,'YOUNG_PERSON').ok,'T10a'); assert.strictEqual(s.currentActionActor,'YOUNG_PERSON','T10b'); assert.strictEqual(C.setActionActor(s,'EXPERT').ok,false,'T10c');
  C.logEvent(s,'EXAMPLE_EDIT',{actor:s.currentActionActor,exampleId:'x'}); assert.strictEqual(s.events.at(-1).payload.actor,'YOUNG_PERSON','T10d');
  assert.strictEqual(C.restore(C.serialise(s)).currentActionActor,'YOUNG_PERSON','T10e');

  s=ready(); const originalExamples=JSON.stringify(s.examples); assert.strictEqual(s.challengeLayer,1,'T11a');
  let ch=C.setChallengeLayer(s,'EXTEND'); assert.deepStrictEqual([ch.fromLayer,ch.toLayer],[1,2],'T11b'); ch=C.setChallengeLayer(s,'EXTEND'); assert.strictEqual(ch.toLayer,3,'T11c'); ch=C.setChallengeLayer(s,'EXTEND'); assert.strictEqual(ch.toLayer,3,'T11d max bounded'); ch=C.setChallengeLayer(s,'RETREAT'); assert.strictEqual(ch.toLayer,2,'T11e'); assert.strictEqual(JSON.stringify(s.examples),originalExamples,'T11f challenge preserves examples');
  ch=C.setChallengeLayer(s,'STAY'); assert.strictEqual(ch.toLayer,2,'T11g stay');

  C.setRelevance(s,{mode:'BOUNDED_CHOICE',purposeLabel:'Share a warning'}); p=C.predict(s,{pulseCount:1,gapLength:1,beamWidth:2}); const attempt=C.makeAttempt(s,p,'INITIAL'); assert.strictEqual(attempt.relevanceSnapshot.purposeLabel,'Share a warning','T12a'); assert.strictEqual(attempt.challengeLayerSnapshot,2,'T12b');

  const legacy=ready(); legacy.schemaVersion=1; delete legacy.relevance; delete legacy.currentActionActor; delete legacy.challengeLayer; delete legacy.challengeHistory; const migrated=C.restore(legacy); assert.strictEqual(migrated.schemaVersion,2,'T13a'); assert.strictEqual(migrated.relevance.mode,'SKIPPED','T13b'); assert.strictEqual(migrated.currentActionActor,'UNASSIGNED','T13c'); assert.strictEqual(migrated.challengeLayer,1,'T13d');

  assert.throws(()=>C.logEvent(migrated,'CONFIDENT_USER',{}),'T14a'); C.logEvent(migrated,'RELEVANCE_SET',{actor:'YOUNG_PERSON'}); assert.strictEqual(migrated.events.at(-1).eventType,'RELEVANCE_SET','T14b');

  const serial=C.serialise(C.createSession()); assert.ok(!/leaderboard|score|badge|expertRole/i.test(serial),'T15');

  console.log('Study C core tests: PASS');
})();
