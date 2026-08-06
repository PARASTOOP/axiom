// Character-state and dialogue resolution for the four fixed characters.
import { CHARACTERS, DIALOGUE } from './content/characters.js';

export const CharacterService = {
  get(characterId) {
    return CHARACTERS[characterId] || null;
  },
  all() {
    return Object.values(CHARACTERS);
  },
  dialogue(characterId, contextId) {
    const lines = DIALOGUE[characterId];
    return lines ? (lines[contextId] || null) : null;
  }
};
