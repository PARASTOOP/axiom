// Deck 02 — Coastal Wildlife Monitoring
export const DECK_02 = {
  id: 'deck-02',
  order: 2,
  title: 'Coastal Wildlife Monitoring',
  objective: 'Restore wildlife-monitoring sensors and teach classification, confidence, data balance and human review of AI suggestions.',
  openingContextCharacter: 'yara',
  openingContextId: 'deck-02-open',
  missions: [
    {
      id: '02-01',
      deckId: 'deck-02',
      order: 1,
      title: 'Teaching the Coastal Classifier',
      learning: 'Classification, training from examples, confidence, human review',
      labId: 'wildlife-classifier-trainer',
      labTitle: 'Wildlife Classifier Trainer',
      labType: 'classifier-trainer',
      labConfig: {
        categories: ['seal', 'puffin'],
        trainingCards: [
          { id: 'c1', label: 'seal', desc: 'Grey shape hauled out on rock' },
          { id: 'c2', label: 'seal', desc: 'Whiskered face in shallow water' },
          { id: 'c3', label: 'puffin', desc: 'Black and white bird, orange beak' },
          { id: 'c4', label: 'puffin', desc: 'Bird in flight over cliff' },
          { id: 'c5', label: 'seal', desc: 'Seal silhouette at dusk (tricky)' },
          { id: 'c6', label: 'puffin', desc: 'Puffin partly hidden in burrow (tricky)' }
        ],
        testCards: [
          { id: 't1', label: 'seal', desc: 'Seal pup on pebble beach' },
          { id: 't2', label: 'puffin', desc: 'Puffin standing on cliff edge' },
          { id: 't3', label: 'seal', desc: 'Blurry grey shape, ambiguous (tricky)' }
        ]
      },
      physicalMaterials: ['Photograph cards (seals, puffins, tricky images)'],
      reflectionPromptSetId: 'classifier',
      story: {
        opening: 'The wildlife sensor station is back online but has never been taught what it is looking at.',
        specificProblem: 'The station needs a classifier trained from real examples before it can tell seals from puffins in its photos.',
        whyItMatters: 'An untrained or badly trained classifier could log the wrong animal, or miss one entirely — bad for anyone relying on the record.',
        familyRole: 'Your family sorts labelled example photos to train the classifier, then tests it against new images it hasn\'t seen.',
        physicalConnection: 'Sort the photograph cards, including the deliberately tricky ones, into seal and puffin piles before testing.',
        transitionToActivity: 'Nova: "It only knows what we show it. Let\'s give it good examples — including the hard ones."',
        responseToFamilyActions: 'The classifier scores each test card and shows its guess plus a confidence value the family can compare against the true label.',
        conclusion: 'The trained classifier correctly sorts most test photos and clearly flags the ones it is unsure about instead of guessing silently.',
        conclusionSummary: {
          repaired: 'Basic image classification at the wildlife sensor station.',
          learned: 'A classifier is only as good as the examples it is trained on, and it should say when it is unsure rather than guess.',
          worldChange: 'The sensor station improves and seals become visible in the coastal record.',
          unlocks: 'Mission 02-02.'
        },
        transitionToNext: 'Captain Yara: "It\'s learning. But what happens when it really isn\'t sure? That\'s next."'
      },
      landscapeUpdate: [{ locationId: 'wildlife-sensor-station', status: 'needs-attention' }, { locationId: 'seal-cove', status: 'needs-attention', reveal: 'seals' }],
      unlocksMissionId: '02-02'
    },
    {
      id: '02-02',
      deckId: 'deck-02',
      order: 2,
      title: 'When the Classifier Is Unsure',
      learning: 'Uncertainty, confidence thresholds, false positives/negatives',
      labId: 'confidence-threshold-explorer',
      labTitle: 'Confidence Threshold Explorer',
      labType: 'threshold-explorer',
      labConfig: {
        observations: [
          { id: 'o1', label: 'seal', confidence: 0.92 },
          { id: 'o2', label: 'puffin', confidence: 0.88 },
          { id: 'o3', label: 'seal', confidence: 0.55 },
          { id: 'o4', label: 'puffin', confidence: 0.41 },
          { id: 'o5', label: 'seal', confidence: 0.67 },
          { id: 'o6', label: 'unknown', confidence: 0.30 }
        ],
        defaultThreshold: 0.6
      },
      physicalMaterials: ['Observation cards with confidence levels'],
      reflectionPromptSetId: 'threshold',
      story: {
        opening: 'Some of the classifier\'s recent reports look confident on paper but feel wrong when a person looks closely.',
        specificProblem: 'The station has no rule yet for what to do when its own confidence score is low.',
        whyItMatters: 'Treating a low-confidence guess the same as a certain one risks logging false records that nobody double-checked.',
        familyRole: 'Your family moves a confidence threshold and watches which observations flip from "auto-accept" to "send to a human."',
        physicalConnection: 'Lay out the observation cards by their printed confidence level and sort them against the chosen threshold line.',
        transitionToActivity: 'Nova: "A number by itself doesn\'t tell us what to do. We decide the line where a person needs to look."',
        responseToFamilyActions: 'The lab recolours and re-labels each observation live as the threshold moves, showing false positives and false negatives building up on either side.',
        conclusion: 'The family sets a threshold that sends every genuinely uncertain observation to a human check instead of guessing.',
        conclusionSummary: {
          repaired: 'A confidence-threshold rule for the sensor station.',
          learned: 'Moving the threshold trades off false positives against false negatives — there is no setting that removes uncertainty entirely.',
          worldChange: 'A human-check pathway becomes active on the sensor station.',
          unlocks: 'Mission 02-03.'
        },
        transitionToNext: 'Captain Yara: "Good rule. Now let\'s make sure it was trained fairly in the first place."'
      },
      landscapeUpdate: [{ locationId: 'wildlife-sensor-station', status: 'uncertain-human-check' }],
      unlocksMissionId: '02-03'
    },
    {
      id: '02-03',
      deckId: 'deck-02',
      order: 3,
      title: 'Balanced Data for the Seals and Puffins',
      learning: 'Training-data balance, bias, responsible data choices',
      labId: 'data-balance-workshop',
      labTitle: 'Data Balance Workshop',
      labType: 'data-balance',
      labConfig: {
        startingSet: { seal: 9, puffin: 2 },
        targetRatioMax: 1.5,
        availableToAdd: { seal: 0, puffin: 8 }
      },
      physicalMaterials: ['Unbalanced sets of seal/puffin cards'],
      reflectionPromptSetId: 'data-balance',
      story: {
        opening: 'Looking back at the training set, something is off — there are far more seal photos than puffin photos.',
        specificProblem: 'A classifier trained on lopsided data tends to guess the more common animal even when it is wrong.',
        whyItMatters: 'An unbalanced sensor station would under-report puffins simply because it saw fewer examples of them, not because there are fewer puffins.',
        familyRole: 'Your family adds puffin examples until the training set is fairly balanced, then retrains and compares results.',
        physicalConnection: 'Count out the unbalanced card piles on the board and physically add puffin cards until the piles are closer in number.',
        transitionToActivity: 'Nova: "It\'s not being unfair on purpose. It just saw one animal a lot more than the other. Let\'s even that out."',
        responseToFamilyActions: 'The workshop shows a before/after summary comparing seal-only accuracy against puffin accuracy as the set is rebalanced.',
        conclusion: 'With a balanced training set, the classifier reports both seals and puffins with much closer accuracy.',
        conclusionSummary: {
          repaired: 'Training-data balance for the wildlife classifier.',
          learned: 'A system trained mostly on one kind of example will be biased toward it, even without anyone intending unfairness.',
          worldChange: 'The sensor station\'s classifier is now balanced, and both seals and puffins are clearly visible in the coastal record.',
          unlocks: 'Deck 03 — Storm Prediction and Environmental Patterns.'
        },
        transitionToNext: 'Captain Yara: "Wildlife monitoring is steady again. Now the harbour needs a forecast it can actually trust."'
      },
      landscapeUpdate: [{ locationId: 'wildlife-sensor-station', status: 'repaired-active' }, { locationId: 'puffin-cliff', status: 'repaired-active' }, { locationId: 'seal-cove', status: 'repaired-active' }],
      unlocksDeckId: 'deck-03'
    }
  ]
};
