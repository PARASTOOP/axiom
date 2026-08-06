// Deck 05 — The Grid Working Together
export const DECK_05 = {
  id: 'deck-05',
  order: 5,
  title: 'The Grid Working Together',
  objective: 'Bring all restored systems into coordinated operation and embed lasting responsible-use habits.',
  openingContextCharacter: 'yara',
  openingContextId: 'deck-05-open',
  missions: [
    {
      id: '05-01',
      deckId: 'deck-05',
      order: 1,
      title: 'When Systems Talk to Each Other',
      learning: 'Interconnected systems, cascading effects',
      labId: 'system-connection-explorer',
      labTitle: 'System Connection Explorer',
      labType: 'connection-explorer',
      labConfig: {
        nodes: ['northern-lighthouse', 'wildlife-sensor-station', 'weather-station', 'harbour', 'rover-zone', 'luma-post'],
        candidateLinks: [
          ['weather-station', 'harbour'], ['wildlife-sensor-station', 'weather-station'],
          ['rover-zone', 'luma-post'], ['harbour', 'rover-zone']
        ],
        maxSimultaneousLinks: 3
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'Every station on the Grid now works — but each one still acts alone, and a storm warning at the weather station never reaches the harbour automatically.',
        specificProblem: 'The stations need supervised connections so information can flow between them without any one system acting unchecked.',
        whyItMatters: 'Connecting systems can cause effects to cascade quickly — a good idea still needs limits on how many links run unsupervised at once.',
        familyRole: 'Your family chooses which stations to connect and confirms each link stays within a safe number of simultaneous connections.',
        physicalConnection: 'Use the connection tokens/links from the board to physically trace the links your family approves.',
        transitionToActivity: 'Nova: "Connected is powerful. Connected without limits is risky. Let\'s connect carefully."',
        responseToFamilyActions: 'The explorer shows a live preview of cascading effects as links are added, and warns before exceeding the safe link limit.',
        conclusion: 'A supervised set of inter-station connections goes live, letting information flow without losing human oversight.',
        conclusionSummary: {
          repaired: 'Supervised communication links between key Grid stations.',
          learned: 'Connecting systems multiplies their effects — deliberate limits keep that power supervised.',
          worldChange: 'Supervised inter-station connections become active and visible on the map.',
          unlocks: 'Mission 05-02.'
        },
        transitionToNext: 'Captain Yara: "Connected and still supervised — well done. Rules need upkeep too, though. Let\'s check ours."'
      },
      landscapeUpdate: [{ locationId: 'grid-hub', status: 'supervised-zone' }],
      unlocksMissionId: '05-02'
    },
    {
      id: '05-02',
      deckId: 'deck-05',
      order: 2,
      title: 'Keeping the Grid Healthy Over Time',
      learning: 'Ongoing oversight, reviewing and updating rules',
      labId: 'rule-review-update-workshop',
      labTitle: 'Rule Review & Update Workshop',
      labType: 'rule-review',
      labConfig: {
        existingRules: [
          { id: 'r1', label: 'Warning requires human confirmation', fromMission: '03-03', status: 'active' },
          { id: 'r2', label: 'High uncertainty never continues', fromMission: '04-02', status: 'active' },
          { id: 'r3', label: 'Rover distance limit 40m', fromMission: '04-01', status: 'active' }
        ]
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'Rules set earlier in the adventure have been running for a while now — some may still fit, others might need a second look.',
        specificProblem: 'Nobody has gone back to check whether the earlier rules (warnings, escalation, autonomy limits) still make sense together.',
        whyItMatters: 'Responsible systems are not "set and forget" — rules need periodic review as circumstances and understanding change.',
        familyRole: 'Your family reviews each existing rule, keeps it, tightens it, or updates it, and records the reasoning.',
        physicalConnection: 'Lay out the standing rule cards created earlier and physically mark which ones are kept or changed.',
        transitionToActivity: 'Nova: "A rule that was right when we made it might still need a second look now. Let\'s check them together."',
        responseToFamilyActions: 'The workshop logs every review decision — kept, tightened, or changed — with the family\'s stated reason attached.',
        conclusion: 'Every existing rule is reviewed, confirmed or updated, and the Grid\'s rules-reviewed indicator lights up.',
        conclusionSummary: {
          repaired: 'The currency and fit of the Grid\'s standing rules.',
          learned: 'Responsible oversight is ongoing — rules need to be revisited, not just set once and forgotten.',
          worldChange: 'A rules-reviewed indicator becomes active across the Grid.',
          unlocks: 'Mission 05-03.'
        },
        transitionToNext: 'Captain Yara: "The Grid is healthy and current. One thing is left — deciding what we want it to remember."'
      },
      landscapeUpdate: [{ locationId: 'grid-hub', status: 'repaired-active' }],
      unlocksMissionId: '05-03'
    },
    {
      id: '05-03',
      deckId: 'deck-05',
      order: 3,
      title: 'The Grid Remembers',
      learning: 'Collective achievement, lasting responsibility',
      labId: 'standing-guidance-builder',
      labTitle: 'Standing Guidance Builder',
      labType: 'standing-guidance',
      labConfig: {
        candidatePrinciples: [
          'Always keep a human able to say no.',
          'Check confidence before trusting a suggestion.',
          'Balance the examples a system learns from.',
          'Let real evidence override a prediction.',
          'Stop and ask when uncertainty is high.',
          'Write down who is accountable for each decision.',
          'Review rules regularly instead of leaving them fixed forever.'
        ],
        maxSelected: 5
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'Every part of the Coastal Grid is repaired and connected — but repairs fade if nobody carries the lessons forward.',
        specificProblem: 'The Grid needs standing guidance: a short set of principles the family chooses to keep following, not just this trip but afterward.',
        whyItMatters: 'A restored system stays trustworthy only if the people responsible for it keep watching, questioning, and deciding — that habit has to be chosen deliberately.',
        familyRole: 'Your family selects and refines the principles they most want to carry forward from everything they repaired.',
        physicalConnection: 'Place the principle/standing-guidance cards the family selects onto the board as a lasting record.',
        transitionToActivity: 'Nova: "You fixed a lot today. What do you want to remember from all of it?"',
        responseToFamilyActions: 'The builder lets the family pick, reorder, and lightly edit the wording of their chosen principles before saving them.',
        conclusion: 'The family\'s standing guidance is saved, and the whole Grid lights up, fully connected and glowing.',
        conclusionSummary: {
          repaired: 'The entire AXIOM-7 Coastal Grid.',
          learned: 'A trustworthy system depends on people who keep choosing to watch, question, and take responsibility for it.',
          worldChange: 'The full Grid is complete and glowing; the epilogue becomes available.',
          unlocks: 'Epilogue.'
        },
        transitionToNext: 'Captain Yara and Nova close the adventure together.'
      },
      landscapeUpdate: [{ locationId: 'standing-guidance-marker', status: 'repaired-active' }, { locationId: 'grid-hub', status: 'repaired-active' }],
      unlocksEpilogue: true
    }
  ]
};
