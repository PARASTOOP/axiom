// CharacterState + Dialogue definitions for the four fixed AXIOM-7 characters.
// R2/R1: exactly these four, no new characters.
export const CHARACTERS = {
  yara: {
    id: 'yara',
    name: 'Captain Yara',
    role: 'Expedition leader',
    tone: 'Calm, clear, encouraging without empty praise.',
    speaks: ['opening', 'conclusion', 'responsibility-framing'],
    avatarGlyph: '⛵',
    color: '#2f6f6b'
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    role: 'Curious investigator',
    tone: 'Notices patterns, asks questions, encourages explanation over guessing.',
    speaks: ['problem-statement', 'fix-it-guidance', 'reflection-prompt'],
    avatarGlyph: '🔍',
    color: '#c97b3d'
  },
  byteRover: {
    id: 'byteRover',
    name: 'Byte Rover',
    role: 'Physical and digital ground rover',
    tone: 'Limited friendly status messages. Never a moral agent.',
    speaks: ['route-status', 'debug-status'],
    avatarGlyph: '🤖',
    color: '#4a5a6a'
  },
  luma: {
    id: 'luma',
    name: 'Luma Drone',
    role: 'Aerial exploration tool',
    tone: 'Reports observations. Always able to stop and ask a human.',
    speaks: ['observation-status', 'escalation-status'],
    avatarGlyph: '🛸',
    color: '#7a5ba6'
  }
};

// Dialogue contexts referenced by StoryNodes via characterId + contextId.
export const DIALOGUE = {
  yara: {
    'deck-01-open': 'The northern light chain has gone dark. Families like ours are the only ones who can walk the coast, read the signs, and bring it back — carefully, together.',
    'deck-02-open': 'The wildlife-monitoring sensors are guessing more than they should. That is not a machine problem alone — it is a "who checks the machine" problem.',
    'deck-03-open': 'The forecast network is unreliable, and the harbour is trusting it blindly. We fix that by keeping a person in charge of every warning.',
    'deck-04-open': 'Byte Rover and Luma can do more on their own now. The question is not "can they" — it is "how far should we let them, and who answers for it."',
    'deck-05-open': 'Every part of the Grid you repaired now needs to work together, and keep working well after we leave. That is the last and most important repair.',
    'epilogue': 'The Grid is whole again — not because a machine finished it, but because your family kept watching, asking, and deciding. That is what keeps it trustworthy.'
  },
  nova: {
    'fix-it': 'Let\'s not guess again. What did we expect to happen, and what actually happened? That gap is where the answer is hiding.',
    'reflection-lead-in': 'Before we move on, let\'s talk it through as a family.'
  }
};
