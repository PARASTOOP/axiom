import { WORLD_CONFIGURATION, STATUS_TOKENS, LOCATIONS, CONNECTIONS } from './world.js';
import { CHARACTERS, DIALOGUE } from './characters.js';
import { DECK_01 } from './decks/deck01.js';
import { DECK_02 } from './decks/deck02.js';
import { DECK_03 } from './decks/deck03.js';
import { DECK_04 } from './decks/deck04.js';
import { DECK_05 } from './decks/deck05.js';
import { REFLECTION_PROMPT_SETS } from './reflectionPrompts.js';

export const DECKS = [DECK_01, DECK_02, DECK_03, DECK_04, DECK_05];

export const CONTENT_BUNDLE = {
  contentVersion: '1.0.0',
  world: WORLD_CONFIGURATION,
  statusTokens: STATUS_TOKENS,
  locations: LOCATIONS,
  connections: CONNECTIONS,
  characters: CHARACTERS,
  dialogue: DIALOGUE,
  decks: DECKS,
  reflectionPromptSets: REFLECTION_PROMPT_SETS
};

export function getDeck(deckId) {
  return DECKS.find(d => d.id === deckId) || null;
}

export function getMission(missionId) {
  for (const deck of DECKS) {
    const m = deck.missions.find(m => m.id === missionId);
    if (m) return m;
  }
  return null;
}

export function getMissionDeck(missionId) {
  for (const deck of DECKS) {
    if (deck.missions.some(m => m.id === missionId)) return deck;
  }
  return null;
}

export function firstMissionOfDeck(deckId) {
  const deck = getDeck(deckId);
  return deck ? deck.missions[0] : null;
}
