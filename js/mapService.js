// Adventure Map service (Phase 2). Owns AdventureMapState: location status,
// visibility, and applying landscapeUpdate objects produced by missions.
// Persists immediately via the shared store.
import { store } from './store.js';
import { LOCATIONS, CONNECTIONS, STATUS_TOKENS } from './content/world.js';

export const MapService = {
  ensureInitialised() {
    const state = store.get();
    let changed = false;
    for (const loc of LOCATIONS) {
      if (!state.adventureMapState[loc.id]) {
        state.adventureMapState[loc.id] = { status: STATUS_TOKENS.LOCKED, visible: false, revealed: [] };
        changed = true;
      }
    }
    if (changed) store.update(() => {});
  },

  getLocations() {
    const state = store.get();
    return LOCATIONS.map(loc => ({
      ...loc,
      ...state.adventureMapState[loc.id]
    }));
  },

  getConnections() {
    return CONNECTIONS;
  },

  // Applies a mission's landscapeUpdate array to AdventureMapState and
  // persists immediately (Phase 2 acceptance criterion).
  applyLandscapeUpdate(landscapeUpdate) {
    store.update(state => {
      for (const update of landscapeUpdate) {
        const existing = state.adventureMapState[update.locationId] || { status: STATUS_TOKENS.LOCKED, visible: false, revealed: [] };
        existing.status = update.status;
        existing.visible = true;
        if (update.reveal && !existing.revealed.includes(update.reveal)) {
          existing.revealed.push(update.reveal);
        }
        state.adventureMapState[update.locationId] = existing;
      }
    });
  },

  isLocationVisible(locationId) {
    const state = store.get();
    return !!(state.adventureMapState[locationId] && state.adventureMapState[locationId].visible);
  }
};
