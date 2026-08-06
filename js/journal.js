// Expedition Journal, SavedCreation storage, achievements, and the research
// event boundary (Phase 7 / Section 10). Everything here is device-local.
// Research events are only ever recorded when researchStudy.approved is true,
// are limited to the allowed list, and are never auto-interpreted.
import { store } from './store.js';

const ALLOWED_RESEARCH_EVENTS = new Set([
  'story-started', 'story-skipped', 'narration-toggled', 'lab-opened',
  'example-modified', 'prediction-submitted', 'code-run', 'fix-it-used',
  'creation-saved', 'reflection-confirmed'
]);

export const Journal = {
  addEntry({ missionId, title, locationsRepaired, characters, creatures, achievement, note }) {
    store.update(state => {
      state.journalEntries.push({
        id: `journal-${missionId}-${Date.now()}`,
        missionId,
        title,
        locationsRepaired: locationsRepaired || [],
        characters: characters || [],
        creatures: creatures || [],
        achievement: achievement || null,
        note: note || '',
        date: new Date().toISOString()
      });
    });
  },

  addNote(entryId, note) {
    store.update(state => {
      const entry = state.journalEntries.find(e => e.id === entryId);
      if (entry) entry.note = note;
    });
  },

  getEntries() {
    return store.get().journalEntries;
  },

  saveCreation({ projectId, labId, missionId, title, creationData, previewImage, appVersion, contentVersion }) {
    store.update(state => {
      const existingIndex = state.codingProjects.findIndex(p => p.projectId === projectId);
      const record = {
        projectId, labId, missionId, title,
        // Snapshot, not a live reference — the lab keeps mutating
        // workingData after a save (Create stage stays editable).
        creationData: JSON.parse(JSON.stringify(creationData)),
        previewImage: previewImage || null,
        saveDate: new Date().toISOString(),
        appVersion, contentVersion
      };
      if (existingIndex >= 0) state.codingProjects[existingIndex] = record;
      else state.codingProjects.push(record);
    });
  },

  getCreations() {
    return store.get().codingProjects;
  },

  addAchievement(id, title) {
    store.update(state => {
      if (!state.achievements.some(a => a.id === id)) {
        state.achievements.push({ id, title, date: new Date().toISOString() });
      }
    });
  },

  getAchievements() {
    return store.get().achievements;
  },

  // Research boundary: no-op unless an approved study flag is explicitly set.
  recordResearchEvent(eventType, payload = {}) {
    const state = store.get();
    if (!state.researchStudy.approved) return;
    if (!ALLOWED_RESEARCH_EVENTS.has(eventType)) return;
    store.update(s => {
      s.researchStudy.events.push({ type: eventType, at: new Date().toISOString(), payload });
    });
  }
};
