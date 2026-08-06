// Deck 04 — Autonomous Systems and Accountability
export const DECK_04 = {
  id: 'deck-04',
  order: 4,
  title: 'Autonomous Systems and Accountability',
  objective: 'Explore levels of autonomy, stopping conditions, escalation and accountability so autonomous tools help while people remain responsible.',
  openingContextCharacter: 'yara',
  openingContextId: 'deck-04-open',
  missions: [
    {
      id: '04-01',
      deckId: 'deck-04',
      order: 1,
      title: 'How Independent Should Byte Rover Be?',
      learning: 'Levels of autonomy, safe operating limits',
      labId: 'autonomy-limit-designer',
      labTitle: 'Autonomy Limit Designer',
      labType: 'autonomy-limit',
      labConfig: {
        limitTypes: [
          { id: 'distance', label: 'Max distance without check-in', min: 5, max: 100, unit: 'm', default: 40 },
          { id: 'time', label: 'Max time without check-in', min: 1, max: 30, unit: 'min', default: 10 },
          { id: 'hazard', label: 'Hazard proximity stop distance', min: 1, max: 20, unit: 'm', default: 5 },
          { id: 'checkin', label: 'Required check-ins per route', min: 0, max: 10, unit: '', default: 2 }
        ],
        minimumRequiredLimits: 3
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'autonomy',
      story: {
        opening: 'Byte Rover has learned to cross tricky ground on its own, and it is tempting to just let it roam and repair what it finds.',
        specificProblem: 'Nobody has set limits on how far, how long, or how close to hazards Byte Rover may go before it must check in.',
        whyItMatters: 'Total independence sounds efficient, but a rover with no limits can wander into danger long before anyone notices.',
        familyRole: 'Your family sets concrete limits — distance, time, hazard proximity, check-ins — that define Byte Rover\'s supervised zone.',
        physicalConnection: 'No new physical materials this mission — use the existing Rover token and board to mark the boundary of the new zone once set.',
        transitionToActivity: 'Nova: "More independent isn\'t automatically better. Let\'s decide exactly how far is far enough."',
        responseToFamilyActions: 'The designer shows the resulting supervised zone on a preview map as limits are adjusted, and blocks removing all limits at once.',
        conclusion: 'Byte Rover\'s supervised autonomous zone is defined, active, and visible on the map.',
        conclusionSummary: {
          repaired: 'Clear operating limits for Byte Rover\'s autonomy.',
          learned: 'Autonomy exists in degrees, and useful independence still needs explicit, non-removable limits.',
          worldChange: 'A supervised autonomous zone becomes active around Byte Rover\'s working area.',
          unlocks: 'Mission 04-02.'
        },
        transitionToNext: 'Captain Yara: "Rover has its limits now. Luma needs the same kind of thinking — for when to stop completely."'
      },
      landscapeUpdate: [{ locationId: 'rover-zone', status: 'supervised-zone' }],
      unlocksMissionId: '04-02'
    },
    {
      id: '04-02',
      deckId: 'deck-04',
      order: 2,
      title: 'When the System Must Stop',
      learning: 'Stopping conditions, escalation, human authority',
      labId: 'stop-and-escalate-rule-builder',
      labTitle: 'Stop-and-Escalate Rule Builder',
      labType: 'stop-escalate',
      labConfig: {
        conditions: ['low battery', 'high uncertainty', 'unexpected obstacle', 'weather warning active', 'communication lost'],
        actions: ['Continue', 'Pause', 'Stop and Call Human'],
        blockedCombination: { condition: 'high uncertainty', disallowedAction: 'Continue' }
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'autonomy',
      story: {
        opening: 'Luma keeps flying through conditions where it really should be asking someone first.',
        specificProblem: 'Luma has no clear rule for which situations mean Continue, which mean Pause, and which mean Stop and Call a Human.',
        whyItMatters: 'Flying on through high uncertainty is exactly the kind of moment where an autonomous tool should escalate, not push forward.',
        familyRole: 'Your family assigns each stopping condition an action, and the lab will not allow "Continue" under high uncertainty.',
        physicalConnection: 'No new physical materials this mission — reuse the escalation cards from the board\'s reusable set if walking through the rule aloud.',
        transitionToActivity: 'Nova: "Some situations are fine to push through. Others should always stop and call us. Let\'s sort which is which."',
        responseToFamilyActions: 'The builder rejects any attempt to pair high uncertainty with Continue and explains why in plain language.',
        conclusion: 'Luma now escalates correctly to a human whenever uncertainty is high, and the escalation pathway is confirmed active.',
        conclusionSummary: {
          repaired: 'Luma\'s stop-and-escalate logic.',
          learned: 'Some conditions should never be allowed to resolve to "keep going" — escalation to a human is the safe default.',
          worldChange: 'Luma\'s escalation pathway becomes active at the watch post.',
          unlocks: 'Mission 04-03.'
        },
        transitionToNext: 'Captain Yara: "Good stopping rules. Now — when something does go wrong, who\'s accountable for what happened?"'
      },
      landscapeUpdate: [{ locationId: 'luma-post', status: 'supervised-zone' }],
      unlocksMissionId: '04-03'
    },
    {
      id: '04-03',
      deckId: 'deck-04',
      order: 3,
      title: 'Who Is Accountable?',
      learning: 'Accountability, transparency, responsibility after autonomous action',
      labId: 'decision-trace-accountability-recorder',
      labTitle: 'Decision Trace & Accountability Recorder',
      labType: 'accountability-trace',
      labConfig: {
        events: [
          { id: 'e1', actor: 'Byte Rover', action: 'chose route around hazard', decidedBy: 'rule set by family' },
          { id: 'e2', actor: 'Luma', action: 'escalated to human', decidedBy: 'human confirmed stop' },
          { id: 'e3', actor: 'family', action: 'approved autonomy limits', decidedBy: 'family' }
        ]
      },
      physicalMaterials: [],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'A path near the rover zone was blocked by debris, and Byte Rover handled it — but nobody wrote down how or why.',
        specificProblem: 'Without a record of who set each rule and who confirmed each decision, nobody can explain what happened afterward.',
        whyItMatters: 'Accountability means being able to trace every autonomous action back to a human decision, rule, or limit that allowed it.',
        familyRole: 'Your family builds a decision trace that links each event to who was responsible for it — a tool, a rule, or a person.',
        physicalConnection: 'No new physical materials this mission — use accountability cards from the reusable set if recreating the trace on the board.',
        transitionToActivity: 'Nova: "The Rover didn\'t decide this on its own — a rule we set did. Let\'s make sure the record shows that clearly."',
        responseToFamilyActions: 'The recorder builds a visible trace showing each event linked to the human rule or confirmation behind it.',
        conclusion: 'The path is cleared, and the recorder shows a clear, honest trace of who was accountable for each step.',
        conclusionSummary: {
          repaired: 'The blocked path near the rover zone, and the missing accountability record.',
          learned: 'Transparency means every autonomous action should trace back to a human-set rule or a human confirmation.',
          worldChange: 'The path clears and an accountability marker is added to the map.',
          unlocks: 'Deck 05 — The Grid Working Together.'
        },
        transitionToNext: 'Captain Yara: "Every part of the Grid is repaired now. Let\'s bring it all together, safely."'
      },
      landscapeUpdate: [{ locationId: 'rover-zone', status: 'repaired-active' }, { locationId: 'accountability-point', status: 'accountability' }],
      unlocksDeckId: 'deck-05'
    }
  ]
};
