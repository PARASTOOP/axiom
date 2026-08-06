// Deck 03 — Storm Prediction and Environmental Patterns
export const DECK_03 = {
  id: 'deck-03',
  order: 3,
  title: 'Storm Prediction and Environmental Patterns',
  objective: 'Restore the weather/forecast network and teach prediction, model limits, override and responsible warning rules.',
  openingContextCharacter: 'yara',
  openingContextId: 'deck-03-open',
  missions: [
    {
      id: '03-01',
      deckId: 'deck-03',
      order: 1,
      title: "The Weather Station's Forecast",
      learning: 'Prediction, training a simple model, comparing forecast with reality',
      labId: 'simple-forecast-trainer',
      labTitle: 'Simple Forecast Trainer',
      labType: 'forecast-trainer',
      labConfig: {
        conditionCards: [
          { id: 'f1', wind: 'high', pressure: 'falling', actual: 'storm' },
          { id: 'f2', wind: 'low', pressure: 'steady', actual: 'clear' },
          { id: 'f3', wind: 'medium', pressure: 'falling', actual: 'rain' },
          { id: 'f4', wind: 'low', pressure: 'rising', actual: 'clear' },
          { id: 'f5', wind: 'high', pressure: 'steady', actual: 'rain' }
        ]
      },
      physicalMaterials: ['Condition cards', 'Face-down actual-outcome cards'],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'The weather station\'s dial spins but produces nothing anyone can use — it has no trained sense of what conditions lead to what weather.',
        specificProblem: 'The station needs a simple model trained on past condition cards paired with what actually happened.',
        whyItMatters: 'Without training against real outcomes, any forecast the station produces is just a guess dressed up as a number.',
        familyRole: 'Your family pairs condition cards with their face-down actual-outcome cards, trains the model, then checks its predictions.',
        physicalConnection: 'Lay condition cards face up and actual-outcome cards face down, only revealing them after a prediction is made.',
        transitionToActivity: 'Nova: "First we teach it what usually happens. Then we\'ll see how well it learned."',
        responseToFamilyActions: 'The trainer predicts an outcome for each condition card, then reveals the actual outcome so the family can compare.',
        conclusion: 'The station begins producing forecasts that line up with past patterns, though not every one is correct.',
        conclusionSummary: {
          repaired: 'Basic forecasting at the weather station.',
          learned: 'A predictive model is trained from patterns in past data — it does not "know" the future, it estimates from precedent.',
          worldChange: 'The weather station begins producing forecasts on the map.',
          unlocks: 'Mission 03-02.'
        },
        transitionToNext: 'Captain Yara: "It\'s forecasting now. But forecasts can be wrong — let\'s see what happens when they are."'
      },
      landscapeUpdate: [{ locationId: 'weather-station', status: 'needs-attention' }],
      unlocksMissionId: '03-02'
    },
    {
      id: '03-02',
      deckId: 'deck-03',
      order: 2,
      title: 'When Predictions Disagree with the Coast',
      learning: 'Model limitations, false confidence, human override',
      labId: 'prediction-vs-reality-comparator',
      labTitle: 'Prediction vs Reality Comparator',
      labType: 'prediction-comparator',
      labConfig: {
        cases: [
          { id: 'p1', forecast: 'clear', forecastConfidence: 0.8, sensorReading: 'storm building' },
          { id: 'p2', forecast: 'rain', forecastConfidence: 0.6, sensorReading: 'matches rain' },
          { id: 'p3', forecast: 'clear', forecastConfidence: 0.9, sensorReading: 'matches clear' },
          { id: 'p4', forecast: 'storm', forecastConfidence: 0.55, sensorReading: 'calm, no wind rising' }
        ]
      },
      physicalMaterials: ['Forecast card vs real sensor cards'],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'A forecast card said "clear," confidently, while the harbour\'s own sensors were showing a storm building.',
        specificProblem: 'The station trusted its own forecast even when live sensor readings disagreed with it.',
        whyItMatters: 'A confident forecast is not the same as a correct one — sensor evidence has to be allowed to override the prediction.',
        familyRole: 'Your family compares forecast cards against real sensor cards and decides, case by case, when the forecast should be overridden.',
        physicalConnection: 'Place each forecast card next to its matching sensor card and mark whether they agree or conflict.',
        transitionToActivity: 'Nova: "A model can sound sure and still be wrong. When the coast disagrees with the forecast, who wins?"',
        responseToFamilyActions: 'The comparator highlights disagreements between forecast and sensor reading and asks the family to confirm an override for each one.',
        conclusion: 'The harbour receives a caution through a human-confirmed override, even though the forecast alone said "clear."',
        conclusionSummary: {
          repaired: 'A human-override pathway between the forecast model and live sensor readings.',
          learned: 'High confidence is not proof of correctness, and real evidence should be able to override a model\'s prediction.',
          worldChange: 'The harbour receives its caution and shows an updated, more cautious status.',
          unlocks: 'Mission 03-03.'
        },
        transitionToNext: 'Captain Yara: "Good call trusting the sensors. Now let\'s make that override a permanent, careful rule."'
      },
      landscapeUpdate: [{ locationId: 'harbour', status: 'uncertain-human-check' }],
      unlocksMissionId: '03-03'
    },
    {
      id: '03-03',
      deckId: 'deck-03',
      order: 3,
      title: 'Building a Careful Warning Pattern',
      learning: 'Combining prediction with rules, mandatory human confirmation',
      labId: 'responsible-warning-rule-builder',
      labTitle: 'Responsible Warning Rule Builder',
      labType: 'warning-rule-builder',
      labConfig: {
        availableBlocks: ['IF forecast = storm', 'IF confidence < 0.5', 'IF sensor disagrees', 'THEN raise caution', 'THEN raise warning', 'HUMAN CONFIRMATION'],
        lockedBlock: 'HUMAN CONFIRMATION'
      },
      physicalMaterials: ['Rule cards'],
      reflectionPromptSetId: 'universal',
      story: {
        opening: 'The harbour needs a standing rule for turning forecasts and sensor data into an actual warning — not a one-off decision.',
        specificProblem: 'Any warning rule the family builds must never be able to fire without a human confirming it first.',
        whyItMatters: 'An automatic, unconfirmed warning system could either cry wolf constantly or, worse, stay silent when it shouldn\'t.',
        familyRole: 'Your family arranges rule cards into an IF/THEN warning pattern that always ends at a Human Confirmation step.',
        physicalConnection: 'Arrange the rule cards on the board in the order the warning logic should run, ending on the confirmation card.',
        transitionToActivity: 'Nova: "Build the rule however makes sense — but the last card is never optional."',
        responseToFamilyActions: 'The builder blocks any attempt to remove or bypass the locked Human Confirmation block in Guided and Explorer modes.',
        conclusion: 'The finished rule pattern raises a caution or warning only after a person actively confirms it.',
        conclusionSummary: {
          repaired: 'The harbour\'s warning pathway, now under standing human authority.',
          learned: 'A safety rule is only as strong as the step nobody is allowed to skip — here, a required human confirmation.',
          worldChange: 'The harbour\'s warning pathway is fully restored and marked as under human authority.',
          unlocks: 'Deck 04 — Autonomous Systems and Accountability.'
        },
        transitionToNext: 'Captain Yara: "The harbour is safe under our rules now. Next: how much should Byte Rover and Luma be allowed to do on their own?"'
      },
      landscapeUpdate: [{ locationId: 'harbour', status: 'repaired-active' }, { locationId: 'weather-station', status: 'repaired-active' }],
      unlocksDeckId: 'deck-04'
    }
  ]
};
