// Narrative Engine (Phase 0). Resolves StoryNode sequences by mission/deck id,
// exposes transcripts for narration, and applies landscapeUpdate to the map
// when a mission concludes.
import { MapService } from './mapService.js';

function node(id, characterId, text, extra = {}) {
  return { id, characterId, text, ...extra };
}

export const NarrativeEngine = {
  // Nodes shown before the family does the physical + digital activity.
  getPreMissionNodes(mission) {
    const s = mission.story;
    return [
      node(`${mission.id}-opening`, 'yara', s.opening),
      node(`${mission.id}-problem`, 'nova', s.specificProblem),
      node(`${mission.id}-why`, 'yara', s.whyItMatters),
      node(`${mission.id}-family-role`, 'nova', s.familyRole),
      node(`${mission.id}-physical`, 'yara', s.physicalConnection),
      node(`${mission.id}-transition-activity`, 'nova', s.transitionToActivity)
    ];
  },

  // Nodes shown after the lab has been run, before reflection.
  getPostMissionNodes(mission) {
    const s = mission.story;
    return [
      node(`${mission.id}-response`, 'byteRover', s.responseToFamilyActions),
      node(`${mission.id}-conclusion`, 'yara', s.conclusion, { conclusionSummary: s.conclusionSummary }),
      node(`${mission.id}-transition-next`, 'yara', s.transitionToNext)
    ];
  },

  getDeckOpeningNode(deck) {
    return node(`${deck.id}-opening`, deck.openingContextCharacter, null, {
      contextId: deck.openingContextId,
      deckTitle: deck.title,
      objective: deck.objective
    });
  },

  // Applies the mission's landscapeUpdate to AdventureMapState. Called once,
  // at the conclusion beat, never before the family has actually completed
  // the activity.
  applyMissionConclusion(mission) {
    MapService.applyLandscapeUpdate(mission.landscapeUpdate);
  },

  getEpilogueNodes() {
    return [
      node('epilogue-yara', 'yara', 'The Grid is whole again — not because a machine finished it, but because your family kept watching, asking, and deciding. That is what keeps it trustworthy.'),
      node('epilogue-nova', 'nova', 'Everything you repaired still depends on people checking in on it. That is not a flaw — that is the point.')
    ];
  }
};
