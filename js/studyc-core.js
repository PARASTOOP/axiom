/* AXIOM-7 Study C Research Mode core logic.
 * Transparent participant-modifiable 1-nearest-example classifier.
 * Browser + Node compatible. No external dependencies.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AxiomStudyC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SCHEMA_VERSION = 2;
  const FEATURES = ['pulseCount', 'gapLength', 'beamWidth'];
  const ACTORS = Object.freeze(['YOUNG_PERSON', 'FAMILY_MEMBER', 'TOGETHER', 'UNASSIGNED']);
  const RELEVANCE_MODES = Object.freeze(['AUTHORED', 'BOUNDED_CHOICE', 'SKIPPED']);
  const CHALLENGE_ACTIONS = Object.freeze(['STAY', 'EXTEND', 'RETREAT']);
  const MIN_CHALLENGE_LAYER = 1;
  const MAX_CHALLENGE_LAYER = 3;

  const STATES = Object.freeze({
    ENTRY: 'S0_ENTRY',
    CONTRIBUTION: 'S1_CONTRIBUTION',
    RELEVANCE: 'S1B_RELEVANCE',
    CREATE: 'S2_CREATE',
    PREDICT: 'S3_PREDICT',
    INSPECT: 'S4_INSPECT',
    CHECK: 'S5_CHECK',
    REVISE: 'S6_REVISE',
    RETEST: 'S7_RETEST',
    REFLECT: 'S8_REFLECT',
    RECOVERY: 'RECOVERY'
  });

  const ALLOWED = Object.freeze({
    S0_ENTRY: ['S1_CONTRIBUTION', 'S1B_RELEVANCE', 'S2_CREATE'],
    S1_CONTRIBUTION: ['S1B_RELEVANCE', 'S2_CREATE', 'S0_ENTRY'],
    S1B_RELEVANCE: ['S2_CREATE', 'S1_CONTRIBUTION', 'S0_ENTRY'],
    S2_CREATE: ['S3_PREDICT', 'S1B_RELEVANCE', 'S1_CONTRIBUTION', 'RECOVERY'],
    S3_PREDICT: ['S4_INSPECT', 'S2_CREATE', 'RECOVERY'],
    S4_INSPECT: ['S5_CHECK', 'S6_REVISE'],
    S5_CHECK: ['S6_REVISE', 'S8_REFLECT', 'S4_INSPECT'],
    S6_REVISE: ['S7_RETEST', 'S2_CREATE', 'S3_PREDICT'],
    S7_RETEST: ['S4_INSPECT', 'S6_REVISE', 'S8_REFLECT', 'S2_CREATE', 'RECOVERY'],
    S8_REFLECT: ['S2_CREATE', 'S1B_RELEVANCE', 'S0_ENTRY'],
    RECOVERY: ['S0_ENTRY', 'S1_CONTRIBUTION', 'S1B_RELEVANCE', 'S2_CREATE', 'S3_PREDICT', 'S4_INSPECT', 'S5_CHECK', 'S6_REVISE', 'S7_RETEST', 'S8_REFLECT']
  });

  const DEFAULT_MAPPINGS = {
    A: { shape: 'circle', motion: 'pulse', tempo: 'medium' },
    B: { shape: 'triangle', motion: 'sweep', tempo: 'medium' }
  };

  function randomId(prefix) {
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix || 'id'}_${Date.now().toString(36)}_${rand}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampFeature(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const i = Math.round(n);
    return i >= 1 && i <= 5 ? i : null;
  }

  function normaliseSignal(signal) {
    const out = {};
    for (const feature of FEATURES) {
      const v = clampFeature(signal && signal[feature]);
      if (v === null) return null;
      out[feature] = v;
    }
    return out;
  }

  function blankRelevance() {
    return {
      mode: 'SKIPPED',
      purposeLabel: '',
      beneficiaryLabel: '',
      updatedAtMs: null
    };
  }

  function createSession() {
    const now = Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      sessionId: randomId('session'),
      startedAtMs: now,
      updatedAtMs: now,
      state: STATES.ENTRY,
      previousState: null,
      labels: [
        { id: 'A', name: 'Signal A', mapping: deepClone(DEFAULT_MAPPINGS.A) },
        { id: 'B', name: 'Signal B', mapping: deepClone(DEFAULT_MAPPINGS.B) }
      ],
      examples: [],
      testSignal: { pulseCount: 3, gapLength: 3, beamWidth: 3 },
      attempts: [],
      humanCheck: null,
      relevance: blankRelevance(),
      currentActionActor: 'UNASSIGNED',
      challengeLayer: MIN_CHALLENGE_LAYER,
      challengeHistory: [],
      supportMode: 'AVAILABLE',
      paused: false,
      settings: { largeText: false, reducedMotion: false },
      events: []
    };
  }

  function normaliseActor(actor) {
    return ACTORS.includes(actor) ? actor : null;
  }

  function setActionActor(session, actor) {
    const value = normaliseActor(actor);
    if (!value) return { ok: false, reason: 'Unknown actor.' };
    session.currentActionActor = value;
    touch(session);
    return { ok: true, actor: value };
  }

  function normaliseText(value, maxLength) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
  }

  function setRelevance(session, input) {
    const mode = input && RELEVANCE_MODES.includes(input.mode) ? input.mode : null;
    if (!mode) return { ok: false, reason: 'Choose a valid relevance mode.' };
    const purposeLabel = normaliseText(input.purposeLabel, 90);
    const beneficiaryLabel = normaliseText(input.beneficiaryLabel, 60);
    if (mode !== 'SKIPPED' && !purposeLabel) return { ok: false, reason: 'Add or choose a short purpose, or skip for now.' };
    session.relevance = {
      mode,
      purposeLabel: mode === 'SKIPPED' ? '' : purposeLabel,
      beneficiaryLabel: mode === 'SKIPPED' ? '' : beneficiaryLabel,
      updatedAtMs: Date.now()
    };
    touch(session);
    return { ok: true, relevance: deepClone(session.relevance) };
  }

  function setChallengeLayer(session, action) {
    if (!CHALLENGE_ACTIONS.includes(action)) return { ok: false, reason: 'Unknown challenge action.' };
    const fromLayer = Number(session.challengeLayer) || MIN_CHALLENGE_LAYER;
    let toLayer = fromLayer;
    if (action === 'EXTEND') toLayer = Math.min(MAX_CHALLENGE_LAYER, fromLayer + 1);
    if (action === 'RETREAT') toLayer = Math.max(MIN_CHALLENGE_LAYER, fromLayer - 1);
    session.challengeLayer = toLayer;
    const entry = {
      action,
      fromLayer,
      toLayer,
      actor: normaliseActor(session.currentActionActor) || 'UNASSIGNED',
      elapsedMs: elapsed(session)
    };
    session.challengeHistory.push(entry);
    touch(session);
    return { ok: true, ...entry };
  }

  function labelExists(session, labelId) {
    return Boolean(session && session.labels && session.labels.some(l => l.id === labelId));
  }

  function validateExample(session, example) {
    if (!example || !labelExists(session, example.labelId)) return { ok: false, reason: 'Choose a valid category.' };
    const signal = normaliseSignal(example.features || example);
    if (!signal) return { ok: false, reason: 'Each signal feature must be a whole number from 1 to 5.' };
    return { ok: true, signal };
  }

  function datasetStatus(session) {
    const counts = Object.fromEntries((session.labels || []).map(l => [l.id, 0]));
    for (const example of session.examples || []) {
      if (counts[example.labelId] !== undefined && normaliseSignal(example.features)) counts[example.labelId] += 1;
    }
    const missing = (session.labels || []).filter(l => (counts[l.id] || 0) < 2).map(l => l.id);
    return { ok: missing.length === 0, counts, missing };
  }

  function addExample(session, labelId, features) {
    const check = validateExample(session, { labelId, features });
    if (!check.ok) return { ok: false, reason: check.reason };
    const example = { id: randomId('ex'), labelId, features: check.signal };
    session.examples.push(example);
    touch(session);
    return { ok: true, example: deepClone(example) };
  }

  function editExample(session, exampleId, changes) {
    const idx = session.examples.findIndex(e => e.id === exampleId);
    if (idx < 0) return { ok: false, reason: 'Example not found.' };
    const next = deepClone(session.examples[idx]);
    if (changes.labelId !== undefined) next.labelId = changes.labelId;
    if (changes.features !== undefined) next.features = changes.features;
    const check = validateExample(session, next);
    if (!check.ok) return { ok: false, reason: check.reason };
    next.features = check.signal;
    session.examples[idx] = next;
    touch(session);
    return { ok: true, example: deepClone(next) };
  }

  function deleteExample(session, exampleId) {
    const before = session.examples.length;
    session.examples = session.examples.filter(e => e.id !== exampleId);
    if (session.examples.length === before) return { ok: false, reason: 'Example not found.' };
    touch(session);
    return { ok: true };
  }

  function distance(a, b) {
    const sa = normaliseSignal(a);
    const sb = normaliseSignal(b);
    if (!sa || !sb) throw new Error('distance() requires valid 1–5 feature values.');
    let sum = 0;
    for (const feature of FEATURES) {
      const d = sa[feature] - sb[feature];
      sum += d * d;
    }
    return Math.sqrt(sum);
  }

  function featureDiffs(a, b) {
    const sa = normaliseSignal(a);
    const sb = normaliseSignal(b);
    if (!sa || !sb) throw new Error('featureDiffs() requires valid signals.');
    const diffs = {};
    for (const feature of FEATURES) diffs[feature] = Math.abs(sa[feature] - sb[feature]);
    return diffs;
  }

  function predict(session, testSignal) {
    const status = datasetStatus(session);
    if (!status.ok) return { ok: false, reason: 'Add at least two valid examples to each category before testing.', status };
    const test = normaliseSignal(testSignal || session.testSignal);
    if (!test) return { ok: false, reason: 'The test signal needs three feature values from 1 to 5.' };

    const scored = session.examples.map(example => ({
      example: deepClone(example),
      distance: distance(test, example.features),
      diffs: featureDiffs(test, example.features)
    })).sort((x, y) => x.distance - y.distance || x.example.id.localeCompare(y.example.id));

    const min = scored[0].distance;
    const nearest = scored.filter(item => Math.abs(item.distance - min) < 1e-9);
    const nearestLabels = [...new Set(nearest.map(item => item.example.labelId))];
    const tie = nearestLabels.length > 1;
    const labelId = tie ? null : nearestLabels[0];
    const label = labelId ? session.labels.find(l => l.id === labelId) : null;

    return {
      ok: true,
      test,
      kind: tie ? 'UNSURE_TIE' : 'PREDICTION',
      labelId,
      labelName: label ? label.name : null,
      mapping: label ? deepClone(label.mapping) : null,
      minimumDistance: min,
      nearest,
      scored
    };
  }

  function makeAttempt(session, prediction, kind) {
    if (!prediction || !prediction.ok) throw new Error('Cannot create an attempt from an invalid prediction.');
    const attempt = {
      id: randomId('attempt'),
      kind: kind || (session.attempts.length ? 'RETEST' : 'INITIAL'),
      testSignal: deepClone(prediction.test),
      prediction: {
        kind: prediction.kind,
        labelId: prediction.labelId,
        labelName: prediction.labelName,
        minimumDistance: prediction.minimumDistance,
        nearest: deepClone(prediction.nearest)
      },
      datasetSnapshot: deepClone(session.examples),
      labelsSnapshot: deepClone(session.labels),
      relevanceSnapshot: deepClone(session.relevance),
      challengeLayerSnapshot: session.challengeLayer,
      humanCheck: null,
      createdElapsedMs: elapsed(session)
    };
    session.attempts.push(attempt);
    touch(session);
    return deepClone(attempt);
  }

  function setHumanCheck(session, value) {
    const allowed = ['MATCHES', 'DISAGREE', 'UNSURE', 'CHECK_AGAIN'];
    if (!allowed.includes(value)) return { ok: false, reason: 'Unknown human-check value.' };
    session.humanCheck = value;
    if (session.attempts.length) session.attempts[session.attempts.length - 1].humanCheck = value;
    touch(session);
    return { ok: true };
  }

  function transition(session, nextState) {
    const current = session.state;
    const allowed = ALLOWED[current] || [];
    if (!Object.values(STATES).includes(nextState)) return { ok: false, reason: 'Unknown state.' };
    if (!allowed.includes(nextState)) return { ok: false, reason: `Transition ${current} → ${nextState} is not allowed.` };
    session.previousState = current;
    session.state = nextState;
    touch(session);
    return { ok: true, state: nextState };
  }

  function recoverTo(session, targetState) {
    if (!Object.values(STATES).includes(targetState) || targetState === STATES.RECOVERY) return { ok: false, reason: 'Choose a valid recovery target.' };
    session.previousState = session.state;
    session.state = targetState;
    touch(session);
    return { ok: true, state: targetState };
  }

  function elapsed(session) {
    return Math.max(0, Date.now() - session.startedAtMs);
  }

  function touch(session) {
    session.updatedAtMs = Date.now();
  }

  function logEvent(session, eventType, payload) {
    const forbidden = /(confident|engaged|empowered|learned|equitable|persistent|self[-_ ]?efficacy)/i;
    if (forbidden.test(String(eventType))) throw new Error('Event types must describe interaction, not infer psychological or outcome constructs.');
    session.events.push({
      schemaVersion: SCHEMA_VERSION,
      sessionIdRandom: session.sessionId,
      elapsedMs: elapsed(session),
      state: session.state,
      eventType: String(eventType),
      payload: payload === undefined ? null : deepClone(payload)
    });
    touch(session);
  }

  function serialise(session) {
    return JSON.stringify(session, null, 2);
  }

  function migrateV1(obj) {
    const migrated = deepClone(obj);
    migrated.schemaVersion = SCHEMA_VERSION;
    migrated.relevance = blankRelevance();
    migrated.currentActionActor = 'UNASSIGNED';
    migrated.challengeLayer = MIN_CHALLENGE_LAYER;
    migrated.challengeHistory = [];
    return migrated;
  }

  function restore(textOrObject) {
    let obj = typeof textOrObject === 'string' ? JSON.parse(textOrObject) : deepClone(textOrObject);
    if (!obj || !obj.schemaVersion) throw new Error('Unsupported or missing Study C session schema version.');
    if (obj.schemaVersion === 1) obj = migrateV1(obj);
    if (obj.schemaVersion !== SCHEMA_VERSION) throw new Error('Unsupported Study C session schema version.');
    if (!Object.values(STATES).includes(obj.state)) throw new Error('Session contains an unknown state.');
    if (!Array.isArray(obj.labels) || obj.labels.length !== 2) throw new Error('Session must contain exactly two labels.');
    if (!Array.isArray(obj.examples) || !Array.isArray(obj.attempts) || !Array.isArray(obj.events)) throw new Error('Session data is incomplete.');
    if (!obj.relevance || !RELEVANCE_MODES.includes(obj.relevance.mode)) obj.relevance = blankRelevance();
    if (!normaliseActor(obj.currentActionActor)) obj.currentActionActor = 'UNASSIGNED';
    if (!Number.isInteger(obj.challengeLayer) || obj.challengeLayer < MIN_CHALLENGE_LAYER || obj.challengeLayer > MAX_CHALLENGE_LAYER) obj.challengeLayer = MIN_CHALLENGE_LAYER;
    if (!Array.isArray(obj.challengeHistory)) obj.challengeHistory = [];
    obj.schemaVersion = SCHEMA_VERSION;
    return obj;
  }

  return {
    SCHEMA_VERSION,
    FEATURES,
    ACTORS,
    RELEVANCE_MODES,
    CHALLENGE_ACTIONS,
    MIN_CHALLENGE_LAYER,
    MAX_CHALLENGE_LAYER,
    STATES,
    ALLOWED,
    createSession,
    normaliseSignal,
    normaliseActor,
    setActionActor,
    setRelevance,
    setChallengeLayer,
    datasetStatus,
    addExample,
    editExample,
    deleteExample,
    distance,
    featureDiffs,
    predict,
    makeAttempt,
    setHumanCheck,
    transition,
    recoverTo,
    logEvent,
    serialise,
    restore,
    deepClone
  };
});
