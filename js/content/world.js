// WorldConfiguration + AdventureMapState location definitions.
// Location ids/positions must match the physical Adventure Board exactly (R per Section 8/Phase 2).
export const WORLD_CONFIGURATION = {
  id: 'axiom7-coastal-grid',
  title: 'The AXIOM-7 Coastal Grid',
  settingNote: 'A fictionalised Welsh coastal world. No real protected place or creature is depicted as factual.'
};

// Status tokens, exactly as listed in Section 8.
export const STATUS_TOKENS = {
  LOCKED: 'locked',
  NEEDS_ATTENTION: 'needs-attention',
  ACTIVE: 'repaired-active',
  UNCERTAIN: 'uncertain-human-check',
  BLOCKED: 'blocked',
  SUPERVISED: 'supervised-zone',
  ACCOUNTABILITY: 'accountability'
};

// x/y are percentage coordinates on the map canvas (0-100), laid out to mirror
// the physical board's five regional chapters left-to-right.
export const LOCATIONS = [
  { id: 'northern-lighthouse', name: 'Northern Lighthouse', deckId: 'deck-01', symbol: '🗼', x: 11, y: 16 },
  { id: 'tidal-flat', name: 'Tidal Flat Crossing', deckId: 'deck-01', symbol: '〰️', x: 11, y: 40 },
  { id: 'island-beacon', name: 'Island Beacon', deckId: 'deck-01', symbol: '🏝️', x: 24, y: 12 },

  { id: 'wildlife-sensor-station', name: 'Wildlife Sensor Station', deckId: 'deck-02', symbol: '📡', x: 30, y: 38 },
  { id: 'seal-cove', name: 'Seal Cove', deckId: 'deck-02', symbol: '🦭', x: 24, y: 62 },
  { id: 'puffin-cliff', name: 'Puffin Cliff', deckId: 'deck-02', symbol: '🐦', x: 38, y: 20 },

  { id: 'weather-station', name: 'Weather Station', deckId: 'deck-03', symbol: '🌦️', x: 48, y: 12 },
  { id: 'harbour', name: 'Harbour', deckId: 'deck-03', symbol: '⚓', x: 50, y: 40 },

  { id: 'rover-zone', name: 'Supervised Rover Zone', deckId: 'deck-04', symbol: '🚙', x: 64, y: 22 },
  { id: 'luma-post', name: "Luma's Watch Post", deckId: 'deck-04', symbol: '📶', x: 72, y: 12 },
  { id: 'accountability-point', name: 'Accountability Marker', deckId: 'deck-04', symbol: '📋', x: 66, y: 46 },

  { id: 'grid-hub', name: 'Grid Coordination Hub', deckId: 'deck-05', symbol: '🕸️', x: 86, y: 24 },
  { id: 'standing-guidance-marker', name: 'Standing Guidance Marker', deckId: 'deck-05', symbol: '📜', x: 86, y: 58 }
];

export const CONNECTIONS = [
  ['northern-lighthouse', 'tidal-flat'], ['tidal-flat', 'island-beacon'],
  ['island-beacon', 'wildlife-sensor-station'],
  ['wildlife-sensor-station', 'seal-cove'], ['wildlife-sensor-station', 'puffin-cliff'],
  ['wildlife-sensor-station', 'weather-station'],
  ['weather-station', 'harbour'],
  ['harbour', 'rover-zone'],
  ['rover-zone', 'luma-post'], ['rover-zone', 'accountability-point'],
  ['accountability-point', 'grid-hub'], ['luma-post', 'grid-hub'],
  ['grid-hub', 'standing-guidance-marker']
];
