// Deck 01 — Northern Light Chain
export const DECK_01 = {
  id: 'deck-01',
  order: 1,
  title: 'Northern Light Chain',
  objective: 'Restore reliable communication and safe movement along the northern light chain (lighthouses, tidal flat, island beacon).',
  openingContextCharacter: 'yara',
  openingContextId: 'deck-01-open',
  missions: [
    {
      id: '01-01',
      deckId: 'deck-01',
      order: 1,
      title: 'The Silent Lighthouse',
      learning: 'Binary representation and encoding',
      labId: 'lighthouse-signal-designer',
      labTitle: 'Lighthouse Signal Designer',
      labType: 'toggle-signal',
      labConfig: { rows: 2, cols: 8, targetPatternName: 'Safe Passage', targetPattern: [1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,1] },
      physicalMaterials: ['Lighthouse token', 'Island beacon token', 'Binary tiles', 'Command cards'],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'The northern lighthouse has gone dark. No light means no safe path for anyone reading the coast at night.',
        specificProblem: 'The lighthouse\'s signal lamp has lost its pattern — it can still flash, but nobody remembers which sequence means "safe" anymore.',
        whyItMatters: 'Without a known signal, boats and walkers along the tidal flat have no way to tell a safe night from a dangerous one.',
        familyRole: 'Your family must rebuild the signal from binary tiles — on and off, one lamp position at a time — until the pattern is exact.',
        physicalConnection: 'Place the lighthouse and island beacon tokens on the board and lay out the binary tiles in the order you plan to test.',
        transitionToActivity: 'Nova: "Every light is just an on or an off. Let\'s find the pattern that means safe passage."',
        responseToFamilyActions: 'Byte Rover confirms each tested pattern against the archived safe-passage code and reports a match or a mismatch line by line.',
        conclusion: 'The lamp locks onto the correct binary pattern and the beam sweeps out across the water in a steady, readable rhythm.',
        conclusionSummary: {
          repaired: 'The northern lighthouse signal lamp.',
          learned: 'Binary values represent real information — a light that is only ever on or off can still carry an exact message.',
          worldChange: 'The lighthouse relights and the signal path along the coast becomes visible on the map.',
          unlocks: 'Mission 01-02.'
        },
        transitionToNext: 'Captain Yara: "The light is back. Now Byte Rover needs a safe way across the tidal flat below it."'
      },
      landscapeUpdate: [
        { locationId: 'northern-lighthouse', status: 'repaired-active' },
        { locationId: 'tidal-flat', status: 'needs-attention', reveal: 'signal-path' }
      ],
      unlocksMissionId: '01-02'
    },
    {
      id: '01-02',
      deckId: 'deck-01',
      order: 2,
      title: "Byte Rover's Path Across the Tidal Flat",
      learning: 'Sequences, algorithms, debugging',
      labId: 'byte-rover-route-builder',
      labTitle: 'Byte Rover Route Builder',
      labType: 'sequence-route',
      labConfig: {
        gridWidth: 8, gridHeight: 5,
        start: { x: 0, y: 2 }, goal: { x: 7, y: 2 },
        hazards: [{ x: 3, y: 2 }, { x: 5, y: 1 }],
        softSand: [{ x: 2, y: 3 }, { x: 6, y: 3 }],
        maxBlocks: 20
      },
      physicalMaterials: ['Rover token', 'Path tiles', 'Soft-sand markers', 'Command cards'],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'With the lighthouse relit, the tidal flat below it is visible again — but the old crossing path is buried and unsafe.',
        specificProblem: 'Byte Rover needs a step-by-step route across the flat that avoids soft sand and the exposed hazard pools between tides.',
        whyItMatters: 'A single wrong move strands Byte Rover in soft sand, or worse, in a hazard pool, cutting the light chain off from the island.',
        familyRole: 'Your family programmes Byte Rover\'s crossing one command at a time, tests it, and debugs any step that goes wrong.',
        physicalConnection: 'Lay the path tiles and soft-sand markers on the board to match the digital map before testing each attempt.',
        transitionToActivity: 'Nova: "Don\'t guess the whole path at once. Build it a step at a time, and watch where it actually goes."',
        responseToFamilyActions: 'Byte Rover narrates each move as it executes the sequence and stops immediately at the first step that fails.',
        conclusion: 'Byte Rover completes a clean, repeatable crossing from the mainland side to the island beacon without touching a hazard.',
        conclusionSummary: {
          repaired: 'The tidal flat crossing route.',
          learned: 'Breaking a big problem into an exact ordered sequence — and testing it — finds mistakes that guessing never would.',
          worldChange: 'The tidal route reopens on the map and Byte Rover can now travel it safely.',
          unlocks: 'Mission 01-03.'
        },
        transitionToNext: 'Captain Yara: "Byte Rover made it across. Now Luma needs to watch over the island beacon — carefully, not on its own."'
      },
      landscapeUpdate: [
        { locationId: 'tidal-flat', status: 'repaired-active' },
        { locationId: 'island-beacon', status: 'needs-attention' }
      ],
      unlocksMissionId: '01-03'
    },
    {
      id: '01-03',
      deckId: 'deck-01',
      order: 3,
      title: "Luma's Watch Over the Island Beacon",
      learning: 'Pattern recognition, responsible monitoring, human-in-the-loop',
      labId: 'luma-observation-pattern',
      labTitle: 'Luma Observation Pattern',
      labType: 'observation-pattern',
      labConfig: {
        searchCards: ['fog bank', 'clear signal', 'unknown shape', 'flock of puffins', 'debris'],
        requiresHumanDecisionBlock: true
      },
      physicalMaterials: ['Island token', 'Observation cards'],
      reflectionPromptSetId: 'luma-observation',
      story: {
        opening: 'The island beacon flickers weakly — something out there keeps interrupting it, but nobody has watched closely enough to know what.',
        specificProblem: 'Luma can fly a search pattern over the island and report what it sees, but it must never decide alone what to do about it.',
        whyItMatters: 'Autonomous "noticing" without a human decision at the end risks the beacon reacting to the wrong thing, or nothing at all.',
        familyRole: 'Your family designs Luma\'s search-and-report pattern so it always ends by asking a person what to do next.',
        physicalConnection: 'Place the island token on the board and lay out observation cards in the order Luma will encounter them.',
        transitionToActivity: 'Nova: "Luma is good at noticing. It\'s not the one who decides. Build the pattern so it always comes back to us."',
        responseToFamilyActions: 'Luma flies the designed pattern, reports each observation card as it is revealed, and pauses for a family decision at the end.',
        conclusion: 'With the search-and-report pattern in place and a human decision confirmed, the beacon relocks onto a clean signal.',
        conclusionSummary: {
          repaired: 'The island beacon\'s stability, via a supervised observation pattern.',
          learned: 'A system can be excellent at noticing patterns while still requiring a person to decide what the pattern means.',
          worldChange: 'The full northern light chain is active and puffins are now visible nesting near the island beacon.',
          unlocks: 'Deck 02 — Coastal Wildlife Monitoring.'
        },
        transitionToNext: 'Captain Yara: "The northern light chain is whole again — and the puffins are proof it\'s working. Now the wildlife sensors need our help too."'
      },
      landscapeUpdate: [
        { locationId: 'island-beacon', status: 'repaired-active' },
        { locationId: 'puffin-cliff', status: 'needs-attention', reveal: 'puffins' }
      ],
      unlocksDeckId: 'deck-02'
    }
  ]
};
