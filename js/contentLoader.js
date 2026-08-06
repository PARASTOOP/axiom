// Content loader: validates the bundled content definitions before anything
// else in the app is allowed to use them. Invalid content is rejected rather
// than silently loaded (Phase 0 acceptance criterion).
import { CONTENT_BUNDLE } from './content/index.js';

class ContentValidationError extends Error {
  constructor(problems) {
    super(`Content failed validation:\n${problems.join('\n')}`);
    this.problems = problems;
  }
}

const REQUIRED_MISSION_FIELDS = [
  'id', 'deckId', 'order', 'title', 'learning', 'labId', 'labTitle', 'labType',
  'labConfig', 'physicalMaterials', 'reflectionPromptSetId', 'story', 'landscapeUpdate'
];

const REQUIRED_STORY_FIELDS = [
  'opening', 'specificProblem', 'whyItMatters', 'familyRole', 'physicalConnection',
  'transitionToActivity', 'responseToFamilyActions', 'conclusion', 'conclusionSummary', 'transitionToNext'
];

function validateMission(mission, problems) {
  for (const field of REQUIRED_MISSION_FIELDS) {
    if (mission[field] === undefined || mission[field] === null) {
      problems.push(`Mission ${mission.id || '?'} is missing required field "${field}"`);
    }
  }
  if (mission.story) {
    for (const field of REQUIRED_STORY_FIELDS) {
      if (!mission.story[field]) {
        problems.push(`Mission ${mission.id} story is missing required field "${field}"`);
      }
    }
  }
  if (!mission.unlocksMissionId && !mission.unlocksDeckId && !mission.unlocksEpilogue) {
    problems.push(`Mission ${mission.id} does not declare what it unlocks`);
  }
  if (!Array.isArray(mission.landscapeUpdate) || mission.landscapeUpdate.length === 0) {
    problems.push(`Mission ${mission.id} must declare at least one landscapeUpdate`);
  }
}

function validateDeck(deck, problems) {
  if (!deck.id || !deck.title || !deck.objective) {
    problems.push(`Deck ${deck.id || '?'} missing id/title/objective`);
  }
  if (!Array.isArray(deck.missions) || deck.missions.length === 0) {
    problems.push(`Deck ${deck.id} has no missions`);
    return;
  }
  deck.missions.forEach(m => validateMission(m, problems));
}

export function loadContent() {
  const problems = [];
  const bundle = CONTENT_BUNDLE;

  if (!bundle.contentVersion) problems.push('Missing contentVersion');
  if (!bundle.world || !bundle.world.id) problems.push('Missing world configuration');
  if (!Array.isArray(bundle.locations) || bundle.locations.length === 0) problems.push('Missing map locations');
  if (!Array.isArray(bundle.decks) || bundle.decks.length !== 5) {
    problems.push(`Expected exactly 5 decks, found ${bundle.decks ? bundle.decks.length : 0}`);
  } else {
    bundle.decks.forEach(d => validateDeck(d, problems));
  }

  const locationIds = new Set(bundle.locations.map(l => l.id));
  for (const deck of bundle.decks || []) {
    for (const mission of deck.missions) {
      for (const update of mission.landscapeUpdate || []) {
        if (!locationIds.has(update.locationId)) {
          problems.push(`Mission ${mission.id} references unknown location "${update.locationId}"`);
        }
      }
    }
  }

  if (problems.length > 0) {
    throw new ContentValidationError(problems);
  }
  return bundle;
}

export { ContentValidationError };
