// Local-first persistence layer. Everything AXIOM-7 stores lives in localStorage
// under a single namespaced, versioned root object. No network calls, no accounts.
const DB_KEY = 'axiom7.db.v1';
const SCHEMA_VERSION = 1;

function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    worldConfigurationId: 'axiom7-coastal-grid',
    familyNickname: null,
    adventureStarted: false,
    currentJourneyStep: 'launch',
    currentSelection: { deckId: null, missionId: null },
    adventureMapState: {}, // locationId -> { status, visible }
    unlockedDecks: ['deck-01'],
    unlockedMissions: ['01-01'],
    completedMissions: [],
    missionRuntime: null, // in-progress mission flow state (for resume), or null
    codingProjects: [], // SavedCreation[]
    journalEntries: [], // ExpeditionJournalEntry[]
    achievements: [],
    standingGuidance: [],
    accountabilityMarkers: [],
    autonomyLimits: {},
    escalationPathways: {},
    ruleReviewLog: [],
    epilogueUnlocked: false,
    freeExplorationUnlocked: false,
    preferences: {
      narrationEnabled: true,
      reducedMotion: false,
      highContrast: false,
      textScale: 100, // percent, 100-200
      narrationVolume: 0.8,
      sfxVolume: 0.6
    },
    researchStudy: {
      approved: false, // must be explicitly set true by an approved study flag
      events: []
    }
  };
}

function migrate(state) {
  // Placeholder for future schema migrations. Unknown/missing fields are
  // backfilled from defaults so older saves keep working.
  const merged = { ...defaultState(), ...state };
  merged.preferences = { ...defaultState().preferences, ...(state.preferences || {}) };
  merged.currentSelection = { ...defaultState().currentSelection, ...(state.currentSelection || {}) };
  merged.researchStudy = { ...defaultState().researchStudy, ...(state.researchStudy || {}) };
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}

export const DB = {
  load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return migrate(parsed);
    } catch (err) {
      console.error('AXIOM-7: local save was unreadable, starting fresh.', err);
      return defaultState();
    }
  },
  save(state) {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  },
  reset() {
    localStorage.removeItem(DB_KEY);
    return defaultState();
  }
};
