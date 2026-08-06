// Application shell + Phase 1 user journey (Section 9) + screens for every
// later phase. Single dispatcher over a persisted state machine so the whole
// journey resumes exactly where it left off after a reload/force-quit.
import { store } from './store.js';
import { MapService } from './mapService.js';
import { CharacterService } from './characterService.js';
import { NarrativeEngine } from './narrativeEngine.js';
import { Preferences, focusFirstControl } from './accessibility.js';
import { NarrationPlayer } from './narrationPlayer.js';
import { Journal } from './journal.js';
import { DECKS, getDeck, getMission, getMissionDeck } from './content/index.js';
import { getPromptSet } from './content/reflectionPrompts.js';
import * as Lab from './labEngine.js';
import { renderLabControls, handleLabInteraction } from './labRenderers.js';
import { ML_LAB_TYPES } from './mlEngine.js';
import { STATUS_TOKENS } from './content/world.js';

const APP_VERSION = '1.0.0';
const CONTENT_VERSION = '1.0.0';
const MISSION_STEPS = ['map-view', 'intro', 'physical-materials', 'role-assignment', 'physical-activity', 'concept', 'lab', 'post-story', 'reflection', 'achievement', 'map-update', 'journal', 'next-action'];

const STATUS_SHAPE = {
  [STATUS_TOKENS.LOCKED]: { shape: '🔒', label: 'locked' },
  [STATUS_TOKENS.NEEDS_ATTENTION]: { shape: '⚠', label: 'needs attention' },
  [STATUS_TOKENS.ACTIVE]: { shape: '✔', label: 'active' },
  [STATUS_TOKENS.UNCERTAIN]: { shape: '❓', label: 'human check' },
  [STATUS_TOKENS.BLOCKED]: { shape: '⛔', label: 'blocked' },
  [STATUS_TOKENS.SUPERVISED]: { shape: '◎', label: 'supervised' },
  [STATUS_TOKENS.ACCOUNTABILITY]: { shape: '📋', label: 'accountability' }
};

const narrator = new NarrationPlayer({ getPreferences: () => store.get().preferences });

let app;

export const App = {
  init() {
    app = document.getElementById('app');
    Preferences.init();
    MapService.ensureInitialised();
    app.addEventListener('click', onClick);
    app.addEventListener('change', onChange);
    app.addEventListener('input', onInput);
    app.addEventListener('submit', onSubmit);
    narrator.onStateChange = () => renderNarrationControls();
    render();
  }
};

function s() { return store.get(); }
function mr() { return s().missionRuntime; }

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------------------------------------------------------------
// Rendering entry point
// ---------------------------------------------------------------------
function render() {
  // A loop, not recursion: a screen can require a redirect (e.g. mission-flow
  // with no missionRuntime) by updating state and leaving `html` unset: we
  // just re-switch rather than nesting another render() call mid-render,
  // which would otherwise blank the page (outer call overwrites innerHTML
  // right after the inner call already painted it).
  for (let guard = 0; guard < 5; guard++) {
    const state = s();
    let html;
    switch (state.currentJourneyStep) {
      case 'launch': html = screenLaunch(); break;
      case 'welcome': html = screenWelcome(); break;
      case 'start-or-continue': html = screenStartOrContinue(); break;
      case 'nickname': html = screenNickname(); break;
      case 'home': html = screenHome(); break;
      case 'deck-select': html = screenDeckSelect(); break;
      case 'mission-select':
        if (!getDeck(state.currentSelection.deckId)) { store.update(st => { st.currentJourneyStep = 'deck-select'; }); continue; }
        html = screenMissionSelect(); break;
      case 'mission-flow':
        if (!state.missionRuntime) { store.update(st => { st.currentJourneyStep = 'home'; }); continue; }
        html = screenMissionFlow(); break;
      case 'journal-view': html = screenJournal(); break;
      case 'settings': html = screenSettings(); break;
      case 'epilogue': html = screenEpilogue(); break;
      default: html = screenHome();
    }
    app.innerHTML = html + footerHtml();
    focusFirstControl(app);
    return;
  }
}

function footerHtml() {
  return `<footer class="app-footer">AXIOM-7 · local-first · no account · <button data-action="go-settings" style="min-height:auto;padding:2px 8px;">settings</button></footer>`;
}

// ---------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------
function characterLine(characterId, text, contextTag) {
  const c = CharacterService.get(characterId);
  if (!c || !text) return '';
  return `<div class="character-line animated" role="group" aria-label="${esc(c.name)} says">
    <span class="character-glyph" aria-hidden="true">${c.avatarGlyph}</span>
    <div><div class="character-name">${esc(c.name)}</div><p>${esc(text)}</p></div>
  </div>`;
}

function narrationBar(text) {
  const prefs = s().preferences;
  const disabled = !prefs.narrationEnabled || !narrator.supported;
  return `<div class="row" style="margin:8px 0" aria-live="polite">
    <button data-action="narrate" data-arg="${encodeURIComponent(text)}" ${disabled ? 'disabled' : ''}>▶ play narration</button>
    <button data-action="narrate-pause">pause</button>
    <button data-action="narrate-resume">resume</button>
    <button data-action="narrate-stop">stop</button>
    ${!prefs.narrationEnabled ? '<span class="badge">narration off — transcript only</span>' : ''}
    ${prefs.narrationEnabled && !narrator.supported ? '<span class="badge">narration unsupported in this browser — transcript only</span>' : ''}
  </div>`;
}
function renderNarrationControls() { /* narration state changes are transient; no persistent UI to sync beyond buttons already present */ }

function progressTrack(steps, currentIndex) {
  return `<div class="progress-track" role="img" aria-label="Step ${currentIndex + 1} of ${steps.length}">${steps.map((_, i) =>
    `<div class="progress-dot ${i < currentIndex ? 'done' : ''} ${i === currentIndex ? 'current' : ''}"></div>`).join('')}</div>`;
}

function renderMapPanel(highlightIds = []) {
  const locations = MapService.getLocations();
  const pins = locations.map(loc => {
    const st = STATUS_SHAPE[loc.status] || STATUS_SHAPE[STATUS_TOKENS.LOCKED];
    const isHighlighted = highlightIds.includes(loc.id);
    return `<div class="map-pin ${loc.visible ? 'visible' : ''} animated" style="left:${loc.x}%;top:${loc.y}%;${isHighlighted ? 'outline:2px solid var(--focus);border-radius:8px;' : ''}" title="${esc(loc.name)}: ${st.label}">
      <span class="glyph" aria-hidden="true">${loc.symbol}</span>
      <div>${esc(loc.name)}</div>
      <div class="status-shape">${st.shape} <span class="sr-only">${st.label}</span></div>
    </div>`;
  }).join('');
  return `<div class="map-wrap animated" role="img" aria-label="AXIOM-7 Coastal Grid adventure map">${pins}</div>`;
}

// ---------------------------------------------------------------------
// Phase 1 journey screens: launch -> welcome -> start/continue -> nickname
// ---------------------------------------------------------------------
function screenLaunch() {
  setTimeout(() => go(s().adventureStarted ? 'home' : 'welcome'), 0);
  return `<div class="panel"><h1>AXIOM-7</h1><p>Validating local database and content…</p></div>`;
}

function screenWelcome() {
  return `<div class="panel stack">
    <h1>Welcome to the AXIOM-7 Coastal Grid</h1>
    <p>A fictionalised Welsh coastal world — lighthouses, tidal flats, wildlife, storms and the technology that watches over them, all needing your family's help.</p>
    ${narrationBar('Welcome to the AXIOM-7 Coastal Grid. A fictionalised Welsh coastal world needs your family\'s help to restore it, one careful mission at a time.')}
    <button class="primary" data-action="go-start-or-continue" data-autofocus>Begin</button>
  </div>`;
}

function screenStartOrContinue() {
  const hasProgress = s().adventureStarted;
  return `<div class="panel stack">
    <h2>Start New or Continue Adventure</h2>
    ${hasProgress ? `<button class="primary" data-action="continue-adventure" data-autofocus>Continue Adventure${s().familyNickname ? ` — ${esc(s().familyNickname)}` : ''}</button>` : ''}
    <button data-action="go-nickname" ${!hasProgress ? 'data-autofocus' : ''}>Start New Adventure</button>
    ${hasProgress ? '<p><small>Starting new will ask for confirmation before clearing local progress.</small></p>' : ''}
  </div>`;
}

function screenNickname() {
  return `<div class="panel stack">
    <h2>What should we call your family?</h2>
    <p>This nickname is stored only on this device. No account, no personal data.</p>
    <form data-form="nickname">
      <input type="text" name="nickname" maxlength="40" placeholder="e.g. The Morgans" aria-label="Family nickname" data-autofocus value="${esc(s().familyNickname || '')}" />
      <button class="primary" type="submit">Save and begin</button>
    </form>
  </div>`;
}

function screenHome() {
  const state = s();
  const inProgress = state.missionRuntime;
  const next = inProgress ? getMission(inProgress.missionId) : getNextActionableMission(state);
  const completedCount = state.completedMissions.length;
  return `<div class="stack">
    <div class="panel spread">
      <div><h1>${esc(state.familyNickname || 'Your family')}'s Adventure</h1>
      <p>${completedCount} / 15 missions complete${state.freeExplorationUnlocked ? ' · Free Exploration unlocked' : ''}</p></div>
      <div class="row">
        <button data-action="go-journal">Expedition Journal</button>
        <button data-action="go-deck-select">Browse Decks</button>
      </div>
    </div>
    <div class="panel">${renderMapPanel()}</div>
    <div class="panel stack">
      ${inProgress ? `<h2>Resume: ${esc(next.title)}</h2><p>Step: ${humanStepName(inProgress.step)}</p><button class="primary" data-action="resume-mission" data-autofocus>Resume Mission</button>`
        : next ? `<h2>Next: ${esc(next.title)}</h2><p>${esc(getMissionDeck(next.id).title)}</p><button class="primary" data-action="start-mission" data-arg="${next.id}" data-autofocus>Begin Mission</button>`
        : `<h2>All missions complete!</h2><p>You're free to explore the finished Grid.</p>`}
    </div>
    ${state.epilogueUnlocked ? `<div class="panel"><button data-action="go-epilogue">Revisit the Epilogue</button></div>` : ''}
  </div>`;
}

function getNextActionableMission(state) {
  for (const deck of DECKS) {
    for (const mission of deck.missions) {
      if (!state.completedMissions.includes(mission.id) && state.unlockedMissions.includes(mission.id)) {
        return mission;
      }
    }
  }
  return null;
}

function humanStepName(step) {
  const names = { 'map-view': 'Viewing mission location', intro: 'Story introduction', 'physical-materials': 'Physical materials', 'role-assignment': 'Role assignment', 'physical-activity': 'Physical activity', concept: 'Concept explanation', lab: 'Creative Coding Lab', 'post-story': 'Story response', reflection: 'Family reflection', achievement: 'Achievement', 'map-update': 'Map update', journal: 'Journal entry', 'next-action': 'Next physical action' };
  return names[step] || step;
}

// ---------------------------------------------------------------------
// Deck / mission selection ("select/scan/enter mission")
// ---------------------------------------------------------------------
function screenDeckSelect() {
  const state = s();
  const items = DECKS.map(deck => {
    const unlocked = state.unlockedDecks.includes(deck.id);
    const doneCount = deck.missions.filter(m => state.completedMissions.includes(m.id)).length;
    return `<li class="panel">
      <div class="spread">
        <div><h3>${esc(deck.title)}</h3><p>${esc(deck.objective)}</p><p><small>${doneCount}/${deck.missions.length} missions complete</small></p></div>
        <button ${unlocked ? `data-action="select-deck" data-arg="${deck.id}"` : 'disabled'}>${unlocked ? 'Open' : '🔒 Locked'}</button>
      </div>
    </li>`;
  }).join('');
  return `<div class="stack">
    <button data-action="go-home">← Home</button>
    <h1>Decks</h1>
    <ul class="link-list">${items}</ul>
  </div>`;
}

function screenMissionSelect() {
  const state = s();
  const deck = getDeck(state.currentSelection.deckId);
  const items = deck.missions.map(mission => {
    const unlocked = state.unlockedMissions.includes(mission.id);
    const done = state.completedMissions.includes(mission.id);
    return `<li class="panel">
      <div class="spread">
        <div><h3>${esc(mission.title)} <span class="badge">${mission.id}</span></h3><p>${esc(mission.learning)}</p></div>
        <button ${unlocked ? `data-action="select-mission" data-arg="${mission.id}"` : 'disabled'}>${done ? '✔ Replay' : unlocked ? 'Select' : '🔒 Locked'}</button>
      </div>
    </li>`;
  }).join('');
  return `<div class="stack">
    <button data-action="go-deck-select">← Decks</button>
    <h1>${esc(deck.title)}</h1>
    <ul class="link-list">${items}</ul>
    <div class="panel">
      <label for="mission-code">Or enter a mission code from the board</label>
      <form data-form="mission-code" class="row">
        <input id="mission-code" name="code" placeholder="e.g. 01-02" />
        <button type="submit">Enter Mission</button>
      </form>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Mission flow (Section 9 steps 6 onward)
// ---------------------------------------------------------------------
function screenMissionFlow() {
  const runtime = mr();
  const mission = getMission(runtime.missionId);
  const stepIndex = MISSION_STEPS.indexOf(runtime.step);
  const body = {
    'map-view': stepMapView, intro: stepIntro, 'physical-materials': stepPhysicalMaterials,
    'role-assignment': stepRoleAssignment, 'physical-activity': stepPhysicalActivity, concept: stepConcept,
    lab: stepLab, 'post-story': stepPostStory, reflection: stepReflection, achievement: stepAchievement,
    'map-update': stepMapUpdate, journal: stepJournal, 'next-action': stepNextAction
  }[runtime.step](mission, runtime);
  return `<div class="stack">
    <button data-action="go-home">Pause &amp; save (return home)</button>
    ${progressTrack(MISSION_STEPS, stepIndex)}
    ${body}
  </div>`;
}

function advanceMissionStep(nextStep) {
  store.update(state => { state.missionRuntime.step = nextStep; });
}

function stepMapView(mission) {
  return `<div class="panel stack">
    <h2>${esc(mission.title)}</h2>
    ${renderMapPanel(mission.landscapeUpdate.map(u => u.locationId))}
    <button class="primary" data-action="mission-next" data-arg="intro" data-autofocus>View Introduction</button>
  </div>`;
}

function stepIntro(mission, runtime) {
  const nodes = NarrativeEngine.getPreMissionNodes(mission);
  const i = Math.min(runtime.introIndex || 0, nodes.length - 1);
  const node = nodes[i];
  return `<div class="panel stack">
    ${characterLine(node.characterId, node.text)}
    ${narrationBar(node.text)}
    <div class="row">
      ${i < nodes.length - 1 ? `<button class="primary" data-action="intro-next" data-autofocus>Continue</button>` : `<button class="primary" data-action="mission-next" data-arg="physical-materials" data-autofocus>Continue</button>`}
      <button data-action="mission-next" data-arg="physical-materials">Skip introduction</button>
    </div>
  </div>`;
}

function stepPhysicalMaterials(mission) {
  const items = (mission.physicalMaterials.length ? mission.physicalMaterials : ['No new materials for this mission.']).map(m => `<li>${esc(m)}</li>`).join('');
  return `<div class="panel stack">
    <h2>Physical Materials Needed</h2>
    <ul>${items}</ul>
    <button class="primary" data-action="mission-next" data-arg="role-assignment" data-autofocus>We have what we need</button>
  </div>`;
}

function stepRoleAssignment(mission, runtime) {
  return `<div class="panel stack">
    <h2>Role Assignment (optional)</h2>
    <p>If it helps, decide who reads, who moves pieces, who runs the digital activity.</p>
    <form data-form="roles">
      <input type="text" name="roles" placeholder="e.g. Sam reads, Jordan moves the pieces" value="${esc(runtime.roles || '')}" />
      <div class="row">
        <button class="primary" type="submit" data-autofocus>Save and continue</button>
        <button type="submit" data-arg="skip">Skip</button>
      </div>
    </form>
  </div>`;
}

function stepPhysicalActivity(mission) {
  return `<div class="panel stack">
    <h2>Complete the Physical Activity</h2>
    <p>${esc(mission.story.physicalConnection)}</p>
    <button class="primary" data-action="mission-next" data-arg="concept" data-autofocus>We finished — return to the app</button>
  </div>`;
}

function stepConcept(mission) {
  return `<div class="panel stack">
    <h2>What You're About to Practise</h2>
    <p><strong>${esc(mission.learning)}</strong></p>
    <p>${esc(mission.story.transitionToActivity)}</p>
    <button class="primary" data-action="mission-next" data-arg="lab" data-autofocus>Open ${esc(mission.labTitle)}</button>
  </div>`;
}

function stepLab(mission, runtime) {
  if (!runtime.labState) {
    store.update(state => { state.missionRuntime.labState = Lab.createLabState(mission); });
    Journal.recordResearchEvent('lab-opened', { missionId: mission.id });
    return stepLab(mission, mr());
  }
  const labState = runtime.labState;
  const stageIndex = Lab.STAGES.indexOf(labState.stage);
  const isML = ML_LAB_TYPES.has(labState.labType);
  const modeRow = `<div class="row" role="group" aria-label="Lab mode">
    ${Lab.MODES.map(mode => `<button aria-pressed="${labState.mode === mode}" data-action="lab-set-mode" data-arg="${mode}">${mode}</button>`).join('')}
  </div>`;
  let stageBody = '';
  switch (labState.stage) {
    case 'watch':
      stageBody = `<p>${esc(mission.story.transitionToActivity)}</p>
        <div class="row"><button data-action="lab-reveal-example">See a worked example</button>
        <button class="primary" data-action="lab-stage-next" data-autofocus>I'm ready to try</button></div>`;
      break;
    case 'change':
      stageBody = `<p>Build your own version below.</p>${renderLabControls(labState)}
        <div class="row"><button data-action="lab-undo">Undo</button><button data-action="lab-reset">Reset</button><button data-action="lab-hint">Hint</button>
        <button class="primary" data-action="lab-stage-next">Continue to Predict</button></div>`;
      break;
    case 'predict':
      stageBody = `<p>Before you run it — what do you think will happen?</p>
        <textarea data-field="prediction" rows="2" style="width:100%" aria-label="Your prediction">${esc(runtime.predictionText || '')}</textarea>
        <div class="row"><button class="primary" data-action="lab-run" data-autofocus>Run it</button></div>`;
      break;
    case 'run': {
      const r = labState.lastRunResult;
      stageBody = `<p role="status">${r ? esc(r.detail) : 'Running…'}</p>
        ${r && !r.success ? `<div class="row"><button class="danger" data-action="lab-fixit">Start Fix-it Round</button><button data-action="lab-stage-next">Continue anyway</button></div>` : `<button class="primary" data-action="lab-stage-next" data-autofocus>Continue to Compare</button>`}`;
      break;
    }
    case 'compare': {
      const r = labState.lastRunResult;
      stageBody = `<p><strong>Your prediction:</strong> ${esc(runtime.predictionText || '(none given)')}</p>
        <p><strong>What actually happened:</strong> ${r ? esc(r.detail) : ''}</p>
        <button class="primary" data-action="lab-stage-next" data-autofocus>Continue to Debug</button>`;
      break;
    }
    case 'debug': {
      const r = labState.lastRunResult;
      if (r && r.success) {
        stageBody = `<p>Nothing to fix — it worked! ${esc(r.detail)}</p><button class="primary" data-action="lab-stage-next" data-autofocus>Continue to Create</button>`;
      } else {
        stageBody = `<p>${characterLine('nova', 'Let\'s not guess again. What did we expect, and what actually happened? That gap is where the answer is hiding.')}</p>
          ${renderLabControls(labState)}
          <div class="row"><button data-action="lab-hint">Hint</button><button class="primary" data-action="lab-run" data-autofocus>Run again</button>
          ${r && r.success ? `<button class="primary" data-action="lab-stage-next">Continue to Create</button>` : ''}</div>`;
      }
      break;
    }
    case 'create':
      stageBody = `<p>Creator mode: remix freely within the safe sandbox limits, then save your creation.</p>
        ${renderLabControls(labState)}
        ${isML ? `<p><small>Even in Creator mode, high-stakes actions still require human confirmation.</small></p>` : ''}
        <div class="row"><button data-action="lab-save">Save creation to Journal</button>
        <button class="primary" data-action="lab-stage-next" data-autofocus>Continue to Explain</button></div>`;
      break;
    case 'explain':
      stageBody = `<p>Explain in your own words what you built and why it works:</p>
        <textarea data-field="explanation" rows="3" style="width:100%" aria-label="Your explanation">${esc(runtime.explanationText || '')}</textarea>
        <button class="primary" data-action="lab-finish" data-autofocus>Finish lab</button>`;
      break;
  }
  return `<div class="panel stack">
    <h2>${esc(labState.labTitle)}</h2>
    ${modeRow}
    ${progressTrack(Lab.STAGES, stageIndex)}
    <p><small>Stage: ${labState.stage}</small></p>
    ${stageBody}
  </div>`;
}

function stepPostStory(mission, runtime) {
  const nodes = NarrativeEngine.getPostMissionNodes(mission);
  const i = Math.min(runtime.postIndex || 0, nodes.length - 1);
  const node = nodes[i];
  if (node.conclusionSummary) {
    return `<div class="panel stack">
      ${characterLine(node.characterId, node.text)}
      ${narrationBar(node.text)}
      <div class="panel"><p><strong>Repaired:</strong> ${esc(node.conclusionSummary.repaired)}</p><p><strong>Learned:</strong> ${esc(node.conclusionSummary.learned)}</p></div>
      <button class="primary" data-action="post-story-next" data-autofocus>Continue</button>
    </div>`;
  }
  return `<div class="panel stack">
    ${characterLine(node.characterId, node.text)}
    ${narrationBar(node.text)}
    <button class="primary" data-action="post-story-next" data-autofocus>Continue</button>
  </div>`;
}

function stepReflection(mission, runtime) {
  const prompts = getPromptSet(mission.reflectionPromptSetId);
  const i = Math.min(runtime.reflectionIndex || 0, prompts.length - 1);
  const prompt = prompts[i];
  return `<div class="panel stack">
    <h2>Family Reflection</h2>
    ${characterLine(prompt.speaker, prompt.text)}
    ${narrationBar(prompt.text)}
    <label for="reflection-note">Optional note (stored locally only)</label>
    <input id="reflection-note" type="text" data-field="reflection-note" />
    <button class="primary" data-action="reflection-confirm" data-autofocus>We talked about this</button>
    <p><small>${i + 1} / ${prompts.length}</small></p>
  </div>`;
}

function stepAchievement(mission) {
  return `<div class="panel stack">
    <h2>🏅 Achievement Earned</h2>
    <p><strong>${esc(mission.title)}</strong> — complete.</p>
    <button class="primary" data-action="mission-next" data-arg="map-update" data-autofocus>Continue</button>
  </div>`;
}

function stepMapUpdate(mission, runtime) {
  if (!runtime.mapApplied) {
    NarrativeEngine.applyMissionConclusion(mission);
    store.update(state => { state.missionRuntime.mapApplied = true; });
    return stepMapUpdate(mission, mr());
  }
  return `<div class="panel stack">
    <h2>The Grid Changes</h2>
    ${renderMapPanel(mission.landscapeUpdate.map(u => u.locationId))}
    <button class="primary" data-action="mission-next" data-arg="journal" data-autofocus>Continue</button>
  </div>`;
}

function stepJournal(mission, runtime) {
  if (!runtime.journalAdded) {
    Journal.addEntry({
      missionId: mission.id, title: mission.title,
      locationsRepaired: mission.landscapeUpdate.map(u => u.locationId),
      characters: ['yara', 'nova'], creatures: mission.landscapeUpdate.filter(u => u.reveal).map(u => u.reveal),
      achievement: mission.title
    });
    store.update(state => { state.missionRuntime.journalAdded = true; });
    return stepJournal(mission, mr());
  }
  return `<div class="panel stack">
    <h2>Expedition Journal Updated</h2>
    <p>This mission has been recorded in your local Expedition Journal.</p>
    <button class="primary" data-action="mission-next" data-arg="next-action" data-autofocus>Continue</button>
  </div>`;
}

function stepNextAction(mission) {
  let instruction;
  if (mission.unlocksMissionId) {
    const next = getMission(mission.unlocksMissionId);
    instruction = `Set up the board for "${esc(next.title)}" — you'll need: ${esc(next.physicalMaterials.join(', ') || 'no new materials')}.`;
  } else if (mission.unlocksDeckId) {
    const deck = getDeck(mission.unlocksDeckId);
    instruction = `Move to the next region of the board: ${esc(deck.title)}.`;
  } else if (mission.unlocksEpilogue) {
    instruction = 'The board is fully connected — no further pieces needed. The epilogue awaits.';
  }
  return `<div class="panel stack">
    ${characterLine('yara', mission.story.transitionToNext)}
    ${narrationBar(mission.story.transitionToNext)}
    <div class="panel"><h3>Next physical-board action</h3><p>${instruction}</p></div>
    <button class="primary" data-action="mission-complete" data-autofocus>Save and return home</button>
  </div>`;
}

// ---------------------------------------------------------------------
// Journal / settings / epilogue
// ---------------------------------------------------------------------
function screenJournal() {
  const entries = Journal.getEntries().slice().reverse();
  const achievements = Journal.getAchievements();
  const creations = Journal.getCreations();
  return `<div class="stack">
    <button data-action="go-home">← Home</button>
    <h1>Expedition Journal</h1>
    <div class="panel"><h2>Achievements (${achievements.length})</h2><ul>${achievements.map(a => `<li>🏅 ${esc(a.title)}</li>`).join('') || '<li>None yet.</li>'}</ul></div>
    <div class="panel"><h2>Saved Creations (${creations.length})</h2><ul>${creations.map(c => `<li>${esc(c.title || c.labId)} — ${new Date(c.saveDate).toLocaleDateString()}</li>`).join('') || '<li>None yet.</li>'}</ul></div>
    <div class="panel"><h2>Missions</h2><ul>${entries.map(e => `<li><strong>${esc(e.title)}</strong> — ${new Date(e.date).toLocaleDateString()}${e.creatures.length ? ` — spotted: ${e.creatures.join(', ')}` : ''}</li>`).join('') || '<li>No entries yet.</li>'}</ul></div>
  </div>`;
}

function screenSettings() {
  const p = s().preferences;
  return `<div class="stack">
    <button data-action="go-home">← Home</button>
    <h1>Settings &amp; Accessibility</h1>
    <div class="panel stack">
      <label><input type="checkbox" data-action="pref-narration" ${p.narrationEnabled ? 'checked' : ''}/> Narration enabled</label>
      <label>Narration volume <input type="range" min="0" max="1" step="0.1" value="${p.narrationVolume}" data-action="pref-narration-volume" /></label>
      <label><input type="checkbox" data-action="pref-reduced-motion" ${p.reducedMotion ? 'checked' : ''}/> Reduced motion</label>
      <label><input type="checkbox" data-action="pref-high-contrast" ${p.highContrast ? 'checked' : ''}/> High contrast</label>
      <label>Text size <input type="range" min="100" max="200" step="10" value="${p.textScale}" data-action="pref-text-scale" /> ${p.textScale}%</label>
    </div>
    <div class="panel">
      <button class="danger" data-action="reset-progress">Reset all local progress</button>
    </div>
  </div>`;
}

function screenEpilogue() {
  const nodes = NarrativeEngine.getEpilogueNodes();
  return `<div class="stack">
    <div class="panel stack">
      <h1>Epilogue</h1>
      ${nodes.map(n => characterLine(n.characterId, n.text)).join('')}
      ${narrationBar(nodes.map(n => n.text).join(' '))}
    </div>
    <div class="panel">${renderMapPanel()}</div>
    <div class="panel stack">
      <h2>Standing Guidance</h2>
      <ul>${(s().standingGuidance || []).map(g => `<li>${esc(g)}</li>`).join('') || '<li>None recorded.</li>'}</ul>
    </div>
    <button class="primary" data-action="go-home" data-autofocus>Continue in Free Exploration</button>
  </div>`;
}

// ---------------------------------------------------------------------
// Navigation + actions
// ---------------------------------------------------------------------
function go(step) {
  store.update(state => { state.currentJourneyStep = step; });
  render();
}

function onClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  // Text/number inputs commit their value on "change" (blur), not on the
  // click that focuses them — otherwise the first click re-renders the
  // screen with an empty value and yanks focus away before typing.
  if (btn.tagName === 'INPUT' && (btn.type === 'text' || btn.type === 'number')) return;
  const action = btn.dataset.action;
  const arg = btn.dataset.arg;
  dispatch(action, arg, btn);
}

function onChange(e) {
  const el = e.target.closest('[data-action]');
  if (el) dispatch(el.dataset.action, el.dataset.arg, el);
}

function onInput(e) {
  const el = e.target.closest('[data-action]');
  if (el && el.type === 'range') dispatch(el.dataset.action, el.dataset.arg, el);
  const field = e.target.closest('[data-field]');
  if (field) captureField(field);
}

function captureField(field) {
  const name = field.dataset.field;
  if (name === 'prediction') store.update(state => { state.missionRuntime.predictionText = field.value; });
  if (name === 'explanation') store.update(state => { state.missionRuntime.explanationText = field.value; });
  if (name === 'reflection-note') store.update(state => { state.missionRuntime.reflectionNote = field.value; });
}

function onSubmit(e) {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const type = form.dataset.form;
  if (type === 'nickname') {
    const nickname = form.querySelector('[name="nickname"]').value.trim() || 'Explorer Family';
    store.update(state => { state.familyNickname = nickname; state.adventureStarted = true; });
    go('home');
  } else if (type === 'mission-code') {
    const code = form.querySelector('[name="code"]').value.trim();
    dispatch('select-mission', code);
  } else if (type === 'roles') {
    const roles = form.querySelector('[name="roles"]').value.trim();
    store.update(state => { state.missionRuntime.roles = roles; state.missionRuntime.step = 'physical-activity'; });
    render();
  }
}

function dispatch(action, arg, el) {
  const state = s();
  switch (action) {
    case 'go-start-or-continue': go('start-or-continue'); return;
    case 'go-nickname':
      if (state.adventureStarted) {
        if (!confirm('Start a brand new adventure? This clears all local progress on this device.')) return;
        store.resetAll();
      }
      go('nickname'); return;
    case 'continue-adventure': go(state.missionRuntime ? 'mission-flow' : 'home'); return;
    case 'go-home': go('home'); return;
    case 'go-journal': go('journal-view'); return;
    case 'go-settings': go('settings'); return;
    case 'go-deck-select': go('deck-select'); return;
    case 'go-epilogue': go('epilogue'); return;
    case 'resume-mission': go('mission-flow'); return;
    case 'select-deck':
      store.update(st => { st.currentSelection.deckId = arg; });
      go('mission-select'); return;
    case 'select-mission':
    case 'start-mission':
      startMission(arg); return;

    case 'mission-next': advanceMissionStep(arg); render(); return;
    case 'intro-next':
      store.update(st => { st.missionRuntime.introIndex = (st.missionRuntime.introIndex || 0) + 1; });
      render(); return;
    case 'post-story-next': {
      const mission = getMission(mr().missionId);
      const nodes = NarrativeEngine.getPostMissionNodes(mission);
      const i = (mr().postIndex || 0) + 1;
      if (i < nodes.length) { store.update(st => { st.missionRuntime.postIndex = i; }); render(); }
      else { advanceMissionStep('reflection'); render(); }
      return;
    }
    case 'reflection-confirm': {
      const mission = getMission(mr().missionId);
      const prompts = getPromptSet(mission.reflectionPromptSetId);
      Journal.recordResearchEvent('reflection-confirmed', { missionId: mission.id });
      const i = (mr().reflectionIndex || 0) + 1;
      if (i < prompts.length) { store.update(st => { st.missionRuntime.reflectionIndex = i; }); render(); }
      else {
        Journal.addAchievement(`mission-${mission.id}`, mission.title);
        advanceMissionStep('achievement'); render();
      }
      return;
    }
    case 'mission-complete': completeMission(); return;

    case 'narrate': narrator.play(decodeURIComponent(arg)); render(); return;
    case 'narrate-pause': narrator.pause(); return;
    case 'narrate-resume': narrator.resume(); return;
    case 'narrate-stop': narrator.stop(); return;

    case 'pref-narration': Preferences.set({ narrationEnabled: el.checked }); Journal.recordResearchEvent('narration-toggled', { on: el.checked }); render(); return;
    case 'pref-narration-volume': Preferences.set({ narrationVolume: Number(el.value) }); return;
    case 'pref-reduced-motion': Preferences.set({ reducedMotion: el.checked }); render(); return;
    case 'pref-high-contrast': Preferences.set({ highContrast: el.checked }); render(); return;
    case 'pref-text-scale': Preferences.set({ textScale: Number(el.value) }); render(); return;
    case 'reset-progress':
      if (confirm('This clears ALL local AXIOM-7 progress on this device. Continue?')) { store.resetAll(); go('welcome'); }
      return;

    default:
      if (action.startsWith('lab-')) { dispatchLab(action, arg, el); return; }
  }
}

function startMission(missionId) {
  const mission = getMission(missionId);
  if (!mission) { alert('No mission found with that code.'); return; }
  const state = s();
  if (!state.unlockedMissions.includes(missionId)) { alert('That mission is still locked.'); return; }
  store.update(st => {
    st.currentSelection = { deckId: mission.deckId, missionId };
    st.missionRuntime = { missionId, step: 'map-view', introIndex: 0, postIndex: 0, reflectionIndex: 0 };
    st.currentJourneyStep = 'mission-flow';
  });
  Journal.recordResearchEvent('story-started', { missionId });
  render();
}

function completeMission() {
  const mission = getMission(mr().missionId);
  store.update(state => {
    if (!state.completedMissions.includes(mission.id)) state.completedMissions.push(mission.id);
    if (mission.unlocksMissionId && !state.unlockedMissions.includes(mission.unlocksMissionId)) {
      state.unlockedMissions.push(mission.unlocksMissionId);
    }
    if (mission.unlocksDeckId) {
      if (!state.unlockedDecks.includes(mission.unlocksDeckId)) state.unlockedDecks.push(mission.unlocksDeckId);
      const nextDeck = getDeck(mission.unlocksDeckId);
      const firstId = nextDeck.missions[0].id;
      if (!state.unlockedMissions.includes(firstId)) state.unlockedMissions.push(firstId);
    }
    if (mission.unlocksEpilogue) {
      state.epilogueUnlocked = true;
      state.freeExplorationUnlocked = true;
      const labState = state.missionRuntime && state.missionRuntime.labState;
      if (labState && labState.workingData && labState.workingData.selected) {
        state.standingGuidance = labState.workingData.selected;
      }
    }
    state.missionRuntime = null;
    state.currentJourneyStep = mission.unlocksEpilogue ? 'epilogue' : 'home';
  });
  render();
}

function dispatchLab(action, arg, el) {
  const runtime = mr();
  const labState = runtime.labState;
  if (action === 'lab-set-mode') { store.update(() => Lab.setMode(labState, arg)); render(); return; }
  if (action === 'lab-stage-next') { store.update(() => Lab.nextStage(labState)); render(); return; }
  if (action === 'lab-undo') { store.update(() => Lab.undo(labState)); render(); return; }
  if (action === 'lab-reset') { store.update(() => Lab.reset(labState)); render(); return; }
  if (action === 'lab-hint') { alert(Lab.getHint(labState)); return; }
  if (action === 'lab-reveal-example') { store.update(() => Lab.revealExample(labState)); render(); return; }
  if (action === 'lab-run') {
    const cameFromPredict = labState.stage === 'predict';
    store.update(() => Lab.runLab(labState));
    Journal.recordResearchEvent('code-run', { missionId: runtime.missionId });
    if (cameFromPredict) store.update(() => Lab.goToStage(labState, 'run'));
    render(); return;
  }
  if (action === 'lab-fixit') {
    store.update(() => Lab.useFixIt(labState));
    Journal.recordResearchEvent('fix-it-used', { missionId: runtime.missionId });
    render(); return;
  }
  if (action === 'lab-save') {
    const mission = getMission(runtime.missionId);
    Journal.saveCreation({
      projectId: `${mission.id}-${labState.labId}`, labId: labState.labId, missionId: mission.id,
      title: `${mission.labTitle} — ${mission.title}`, creationData: labState.workingData,
      appVersion: APP_VERSION, contentVersion: CONTENT_VERSION
    });
    Journal.recordResearchEvent('creation-saved', { missionId: mission.id });
    alert('Saved to your Expedition Journal.');
    return;
  }
  if (action === 'lab-finish') { advanceMissionStep('post-story'); render(); return; }
  // Otherwise it's a control-specific interaction handled by labRenderers.
  store.update(() => handleLabInteraction(labState, action, arg, el));
  render();
}
