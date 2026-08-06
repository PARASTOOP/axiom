// Responsible-AI reflection prompts, delivered after the Create stage of a lab.
// Spoken by Nova or Captain Yara, fully captioned, no scoring attached.
export const UNIVERSAL_PROMPTS = [
  { speaker: 'nova', text: 'The system made a suggestion. Who should make the final decision — the system or us? Why?' },
  { speaker: 'nova', text: 'What is one thing the system is good at noticing? What is one thing it might still miss?' },
  { speaker: 'yara', text: 'If the system is only half-sure, what should we do?' },
  { speaker: 'nova', text: 'How does it feel when the system asks us instead of deciding on its own?' },
  { speaker: 'yara', text: 'What would happen on the coast if we always trusted the system without checking?' }
];

export const REFLECTION_PROMPT_SETS = {
  universal: UNIVERSAL_PROMPTS,
  classifier: [
    ...UNIVERSAL_PROMPTS,
    { speaker: 'nova', text: 'The classifier learned from the examples we gave it. What might it never have seen?' },
    { speaker: 'nova', text: 'Why did the tricky photos give the classifier more trouble than the clear ones?' }
  ],
  threshold: [
    ...UNIVERSAL_PROMPTS,
    { speaker: 'yara', text: 'If we set the threshold very high, what do we risk missing? If very low, what do we risk trusting?' },
    { speaker: 'nova', text: 'Is there one "correct" threshold, or does it depend on what happens if we get it wrong?' }
  ],
  'data-balance': [
    ...UNIVERSAL_PROMPTS,
    { speaker: 'nova', text: 'Before we balanced the data, was the system being deliberately unfair, or just under-informed?' },
    { speaker: 'yara', text: 'Where else might a system see mostly one kind of example without anyone noticing?' }
  ],
  'luma-observation': [
    ...UNIVERSAL_PROMPTS,
    { speaker: 'nova', text: 'Luma is good at spotting patterns from the air. What can it not tell us about what it sees?' },
    { speaker: 'yara', text: 'Why does Luma\'s pattern always end by asking a person, even when it seems obvious?' }
  ],
  autonomy: [
    ...UNIVERSAL_PROMPTS,
    { speaker: 'yara', text: 'Why might a tool with no limits at all be more risky than one with fewer capabilities but clear limits?' },
    { speaker: 'nova', text: 'Who should be allowed to change these limits later — and how would we know if they had?' }
  ]
};

export function getPromptSet(id) {
  return REFLECTION_PROMPT_SETS[id] || UNIVERSAL_PROMPTS;
}
