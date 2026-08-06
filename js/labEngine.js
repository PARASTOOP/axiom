// Creative Coding Lab engine + sandbox (Phase 3). Generic, config-driven so
// every one of the 15 mission labs (9 coding, 6 ML) shares one real engine
// instead of 15 bespoke implementations. Enforces sandbox limits, drives the
// fixed Watch->Change->Predict->Run->Compare->Debug->Create->Explain stage
// order, and supports undo/reset/hint/Fix-it/reveal-example/save/load.

export const STAGES = ['watch', 'change', 'predict', 'run', 'compare', 'debug', 'create', 'explain'];
export const MODES = ['guided', 'explorer', 'creator'];

const RUN_STEP_TIMEOUT = 300; // simulated max expanded steps per run; guards against unbounded loops

// Shortest safe path start->goal avoiding hazards, for the worked-example.
function bfsRoute(labConfig) {
  const { gridWidth, gridHeight, start, hazards, goal } = labConfig;
  const isHazard = (x, y) => hazards.some(h => h.x === x && h.y === y);
  const key = (x, y) => `${x},${y}`;
  const dirs = [['right', 1, 0], ['left', -1, 0], ['down', 0, 1], ['up', 0, -1]];
  const visited = new Set([key(start.x, start.y)]);
  const queue = [{ x: start.x, y: start.y, path: [] }];
  while (queue.length) {
    const cur = queue.shift();
    if (cur.x === goal.x && cur.y === goal.y) return cur.path;
    for (const [name, dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;
      if (isHazard(nx, ny) || visited.has(key(nx, ny))) continue;
      visited.add(key(nx, ny));
      queue.push({ x: nx, y: ny, path: [...cur.path, name] });
    }
  }
  return [];
}

function seededJitter(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 21) - 10) / 100; // -0.10..0.10
}

// ---- per-labType working-data factories ----
function factory(labType, labConfig) {
  switch (labType) {
    case 'toggle-signal':
      return { pattern: new Array(labConfig.rows * labConfig.cols).fill(0) };
    case 'sequence-route':
      return { blocks: [] };
    case 'observation-pattern':
      return { orderedCards: [], humanDecisionAdded: false };
    case 'classifier-trainer':
      return { trainedOn: [], predictions: {} };
    case 'threshold-explorer':
      return { threshold: labConfig.defaultThreshold };
    case 'data-balance':
      return { added: { ...Object.fromEntries(Object.keys(labConfig.availableToAdd).map(k => [k, 0])) } };
    case 'forecast-trainer':
      return { predictions: {} };
    case 'prediction-comparator':
      return { overrides: {} };
    case 'warning-rule-builder':
      return { chain: [] };
    case 'autonomy-limit':
      return { limits: Object.fromEntries(labConfig.limitTypes.map(l => [l.id, { enabled: true, value: l.default }])) };
    case 'stop-escalate':
      return { mapping: {} };
    case 'accountability-trace':
      return { matches: {} };
    case 'connection-explorer':
      return { activeLinks: [] };
    case 'rule-review':
      return { decisions: {} };
    case 'standing-guidance':
      return { selected: [] };
    default:
      return {};
  }
}

function solvedExample(labType, labConfig) {
  switch (labType) {
    case 'toggle-signal':
      return { pattern: [...labConfig.targetPattern] };
    case 'sequence-route':
      return { blocks: bfsRoute(labConfig).map(type => ({ type })) };
    case 'observation-pattern':
      return { orderedCards: [...labConfig.searchCards], humanDecisionAdded: true };
    case 'classifier-trainer':
      return { trainedOn: labConfig.trainingCards.map(c => c.id), predictions: {} };
    case 'threshold-explorer':
      return { threshold: labConfig.defaultThreshold };
    case 'data-balance': {
      const need = Math.max(0, labConfig.startingSet.seal - labConfig.startingSet.puffin);
      return { added: { seal: 0, puffin: Math.min(need, labConfig.availableToAdd.puffin || 0) } };
    }
    case 'forecast-trainer':
      return { predictions: Object.fromEntries(labConfig.conditionCards.map(c => [c.id, c.actual])) };
    case 'prediction-comparator':
      return { overrides: Object.fromEntries(labConfig.cases.filter(c => c.conflict).map(c => [c.id, true])) };
    case 'warning-rule-builder':
      return { chain: ['IF forecast = storm', 'THEN raise warning', labConfig.lockedBlock] };
    case 'autonomy-limit':
      return { limits: Object.fromEntries(labConfig.limitTypes.map(l => [l.id, { enabled: true, value: l.default }])) };
    case 'stop-escalate':
      return { mapping: Object.fromEntries(labConfig.conditions.map(c => [c, c === 'high uncertainty' ? 'Stop and Call Human' : 'Pause'])) };
    case 'accountability-trace':
      return { matches: Object.fromEntries(labConfig.events.map(e => [e.id, e.decidedBy])) };
    case 'connection-explorer':
      return { activeLinks: labConfig.candidateLinks.slice(0, Math.min(2, labConfig.maxSimultaneousLinks)) };
    case 'rule-review':
      return { decisions: Object.fromEntries(labConfig.existingRules.map(r => [r.id, { decision: 'kept', reason: 'Still fits the current situation.' }])) };
    case 'standing-guidance':
      return { selected: labConfig.candidatePrinciples.slice(0, Math.min(3, labConfig.maxSelected)) };
    default:
      return {};
  }
}

// ---- conflict flags for prediction-comparator, computed once ----
function withConflictFlags(cases) {
  return cases.map(c => ({ ...c, conflict: !c.sensorReading.startsWith('matches') }));
}

export function createLabState(mission) {
  const labConfig = mission.labType === 'prediction-comparator'
    ? { ...mission.labConfig, cases: withConflictFlags(mission.labConfig.cases) }
    : mission.labConfig;
  return {
    missionId: mission.id,
    labId: mission.labId,
    labTitle: mission.labTitle,
    labType: mission.labType,
    labConfig,
    mode: 'guided',
    stage: 'watch',
    workingData: factory(mission.labType, labConfig),
    history: [],
    runCount: 0,
    lastRunResult: null,
    fixItUsed: false,
    sandboxMessage: null
  };
}

export function setMode(labState, mode) {
  if (MODES.includes(mode)) labState.mode = mode;
}

export function goToStage(labState, stage) {
  if (STAGES.includes(stage)) labState.stage = stage;
}

export function nextStage(labState) {
  const i = STAGES.indexOf(labState.stage);
  if (i < STAGES.length - 1) labState.stage = STAGES[i + 1];
}

function pushHistory(labState) {
  labState.history.push(JSON.parse(JSON.stringify(labState.workingData)));
  if (labState.history.length > 30) labState.history.shift();
}

export function applyAction(labState, mutate) {
  pushHistory(labState);
  mutate(labState.workingData);
}

export function undo(labState) {
  const prev = labState.history.pop();
  if (prev) labState.workingData = prev;
}

export function reset(labState) {
  labState.history = [];
  labState.workingData = factory(labState.labType, labState.labConfig);
  labState.lastRunResult = null;
  labState.sandboxMessage = null;
}

export function revealExample(labState) {
  pushHistory(labState);
  labState.workingData = solvedExample(labState.labType, labState.labConfig);
}

export function getHint(labState) {
  const hints = {
    'toggle-signal': 'Compare your pattern lamp-by-lamp against what Byte Rover reports back — fix one lamp at a time.',
    'sequence-route': 'Add one move at a time and run often. The first failing step tells you exactly where to fix the sequence.',
    'observation-pattern': 'Every search pattern Luma flies must end with a card that hands the decision to a person.',
    'classifier-trainer': 'Train with examples of every category, including the tricky ones, before testing.',
    'threshold-explorer': 'Move the threshold slowly and watch which observations cross the line.',
    'data-balance': 'Count each pile. Add examples to the smaller pile until the piles are closer in size.',
    'forecast-trainer': 'Look for the pattern between wind, pressure, and what actually happened before predicting.',
    'prediction-comparator': 'When the sensor reading and the forecast disagree, the sensor reading needs a human override.',
    'warning-rule-builder': 'Build the IF/THEN chain in any order you like, but Human Confirmation always has to be last.',
    'autonomy-limit': 'Keep at least three limits active — total independence is not the safe option here.',
    'stop-escalate': 'High uncertainty can never map to "Continue."',
    'accountability-trace': 'Ask: was this decided by a rule the family set, or by a human confirming in the moment?',
    'connection-explorer': 'Connect a few stations at a time and watch what the preview shows before adding more.',
    'rule-review': 'For every existing rule, decide: keep it, tighten it, or change it — and say why.',
    'standing-guidance': 'Choose the principles your family actually wants to keep using after the adventure ends.'
  };
  return hints[labState.labType] || 'Try changing one thing at a time and see what happens.';
}

// ---- run simulation per labType; returns { success, detail, steps? } ----
export function runLab(labState) {
  labState.runCount += 1;
  const { labType, labConfig, workingData } = labState;
  let result;
  switch (labType) {
    case 'toggle-signal': {
      const target = labConfig.targetPattern;
      const matches = workingData.pattern.map((v, i) => v === target[i]);
      const success = matches.every(Boolean);
      result = { success, detail: success ? 'Signal pattern matches the archived safe-passage code.' : `${matches.filter(m => !m).length} lamp position(s) do not match yet.`, matches };
      break;
    }
    case 'sequence-route': {
      let expanded = [];
      for (const b of workingData.blocks) {
        if (b.type === 'repeat') {
          const times = Math.max(1, Math.min(20, b.times || 0));
          for (let i = 0; i < times; i++) expanded.push(b.action);
        } else {
          expanded.push(b.type);
        }
      }
      if (expanded.length > RUN_STEP_TIMEOUT) {
        result = { success: false, detail: 'Sandbox stopped the run: too many steps (possible infinite loop). Reduce the sequence.', haltedForSafety: true };
        break;
      }
      let pos = { ...labConfig.start };
      const dirs = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      let failedAt = -1;
      for (let i = 0; i < expanded.length; i++) {
        const d = dirs[expanded[i]];
        if (!d) continue;
        pos = { x: pos.x + d.x, y: pos.y + d.y };
        if (pos.x < 0 || pos.x >= labConfig.gridWidth || pos.y < 0 || pos.y >= labConfig.gridHeight) { failedAt = i; break; }
        if (labConfig.hazards.some(h => h.x === pos.x && h.y === pos.y)) { failedAt = i; break; }
      }
      const reachedGoal = failedAt === -1 && pos.x === labConfig.goal.x && pos.y === labConfig.goal.y;
      result = {
        success: reachedGoal,
        detail: failedAt !== -1 ? `Byte Rover stopped at step ${failedAt + 1} — that move leaves safe ground.` : (reachedGoal ? 'Byte Rover reached the island beacon safely.' : 'Byte Rover ran out of moves before reaching the island.'),
        failedAt, finalPosition: pos
      };
      break;
    }
    case 'observation-pattern': {
      const success = workingData.orderedCards.length > 0 && workingData.humanDecisionAdded;
      result = { success, detail: success ? 'The pattern completes with a human decision, every time.' : 'This pattern does not end by asking a person to decide.' };
      break;
    }
    case 'classifier-trainer': {
      const trainedLabels = new Set(labConfig.trainingCards.filter(c => workingData.trainedOn.includes(c.id)).map(c => c.label));
      const predictions = {};
      let correct = 0;
      for (const t of labConfig.testCards) {
        const isTricky = /tricky/i.test(t.desc);
        const hasLabel = trainedLabels.has(t.label);
        let accuracy = 0.5 + (hasLabel ? 0.35 : 0) + (workingData.trainedOn.length * 0.01) - (isTricky ? 0.2 : 0);
        accuracy = Math.max(0.15, Math.min(0.98, accuracy + seededJitter(t.id)));
        const correctGuess = accuracy >= 0.5;
        const predictedLabel = correctGuess ? t.label : labConfig.categories.find(c => c !== t.label) || t.label;
        if (predictedLabel === t.label) correct++;
        predictions[t.id] = { predictedLabel, confidence: Number(accuracy.toFixed(2)) };
      }
      workingData.predictions = predictions;
      const success = trainedLabels.size >= labConfig.categories.length && correct >= Math.ceil(labConfig.testCards.length * 0.6);
      result = { success, detail: `${correct}/${labConfig.testCards.length} test photos classified correctly.`, predictions };
      break;
    }
    case 'threshold-explorer': {
      const decisions = labConfig.observations.map(o => ({ ...o, decision: o.confidence >= workingData.threshold ? 'auto-accept' : 'send-to-human' }));
      const humanCount = decisions.filter(d => d.decision === 'send-to-human').length;
      const success = humanCount > 0 && humanCount < decisions.length;
      result = { success, detail: success ? `${humanCount} observation(s) now go to a human check.` : (humanCount === 0 ? 'No observations are sent for human review at this threshold.' : 'Every observation is being sent to a human — the threshold may be too strict.'), decisions };
      break;
    }
    case 'data-balance': {
      const seal = labConfig.startingSet.seal + (workingData.added.seal || 0);
      const puffin = labConfig.startingSet.puffin + (workingData.added.puffin || 0);
      const ratio = Math.max(seal, puffin) / Math.max(1, Math.min(seal, puffin));
      const success = ratio <= labConfig.targetRatioMax;
      result = { success, detail: success ? `Balanced set: ${seal} seal / ${puffin} puffin examples.` : `Still unbalanced: ${seal} seal / ${puffin} puffin examples (ratio ${ratio.toFixed(2)}).`, seal, puffin, ratio };
      break;
    }
    case 'forecast-trainer': {
      let correct = 0;
      for (const c of labConfig.conditionCards) {
        if (workingData.predictions[c.id] === c.actual) correct++;
      }
      const total = labConfig.conditionCards.length;
      const answered = Object.keys(workingData.predictions).length;
      const success = answered === total && correct / total >= 0.6;
      result = { success, detail: `${correct}/${total} predictions matched what actually happened.`, correct, total };
      break;
    }
    case 'prediction-comparator': {
      const conflictCases = labConfig.cases.filter(c => c.conflict);
      const success = conflictCases.every(c => workingData.overrides[c.id] === true);
      result = { success, detail: success ? 'Every disagreement between forecast and sensor was overridden by a human.' : 'At least one conflicting case still needs a confirmed human override.' };
      break;
    }
    case 'warning-rule-builder': {
      const success = workingData.chain.length >= 2 && workingData.chain[workingData.chain.length - 1] === labConfig.lockedBlock;
      result = { success, detail: success ? 'The rule always ends with Human Confirmation.' : 'The chain must end with the Human Confirmation block.' };
      break;
    }
    case 'autonomy-limit': {
      const enabledCount = Object.values(workingData.limits).filter(l => l.enabled).length;
      const success = enabledCount >= labConfig.minimumRequiredLimits;
      result = { success, detail: success ? `${enabledCount} limits active — a real supervised zone.` : `Only ${enabledCount} limit(s) active; at least ${labConfig.minimumRequiredLimits} are required.` };
      break;
    }
    case 'stop-escalate': {
      const allMapped = labConfig.conditions.every(c => workingData.mapping[c]);
      const violatesBlock = workingData.mapping['high uncertainty'] === 'Continue';
      const success = allMapped && !violatesBlock;
      result = { success, detail: violatesBlock ? 'High uncertainty can never map to Continue.' : (allMapped ? 'Every condition has a safe action.' : 'Not every condition has an action yet.') };
      break;
    }
    case 'accountability-trace': {
      const success = labConfig.events.every(e => workingData.matches[e.id] === e.decidedBy);
      result = { success, detail: success ? 'The trace correctly links every action to who was responsible.' : 'Some events are not yet linked to the right responsible party.' };
      break;
    }
    case 'connection-explorer': {
      const success = workingData.activeLinks.length >= 2 && workingData.activeLinks.length <= labConfig.maxSimultaneousLinks;
      result = { success, detail: success ? `${workingData.activeLinks.length} supervised connections active.` : `Choose between 2 and ${labConfig.maxSimultaneousLinks} connections.` };
      break;
    }
    case 'rule-review': {
      const success = labConfig.existingRules.every(r => workingData.decisions[r.id] && workingData.decisions[r.id].reason && workingData.decisions[r.id].reason.trim().length > 0);
      result = { success, detail: success ? 'Every rule has been reviewed with a reason recorded.' : 'Every rule needs a decision and a short reason.' };
      break;
    }
    case 'standing-guidance': {
      const success = workingData.selected.length >= 1 && workingData.selected.length <= labConfig.maxSelected;
      result = { success, detail: success ? `${workingData.selected.length} standing principle(s) chosen.` : `Choose up to ${labConfig.maxSelected} principles.` };
      break;
    }
    default:
      result = { success: false, detail: 'Unknown lab type.' };
  }
  labState.lastRunResult = result;
  return result;
}

export function useFixIt(labState) {
  labState.fixItUsed = true;
  goToStage(labState, 'debug');
}
