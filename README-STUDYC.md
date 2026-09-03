# AXIOM-7 Study C Research Mode

## Coastal Signal Studio

This branch is a bounded Study C implementation asset. Its current scientific basis is the evidence-derived downstream chain recorded in `Downstream_LearningPurpose_Enactment_Modality_AI_Decisions_CURRENT_v1` and `StudyC_Testing_and_CoDesign_Alignment_CURRENT_v2` in the controlled research Drive. Earlier R8–R12 documents are historical/audit sources and no longer determine the scientific design basis.

The branch does **not** replace the historical board/game implementation on `main`.

## What participants do
A zero-background child–adult pair:
1. creates a tiny labelled signal dataset;
2. tests a local transparent 1-nearest-example classifier;
3. inspects which example(s) most influenced the result;
4. makes a human judgement about whether the prediction makes sense;
5. revises participant-authored examples, labels, feature values, test signal or beacon mapping;
6. retests and compares before/after behaviour;
7. reflects on what the model used and what people still decided.

The classifier is one bounded implementation choice for formative investigation. It is **not** a theoretically required part of the PhD contribution and must not be presented as how all AI works.

## Run
Open `studyc.html` directly in a modern browser. Study C mode has no required network or CDN dependency.

Optional shared printable cards: `studyc-print.html`. When used, the physical layer should support shared externalisation/manipulation/contribution rather than being justified merely as a duplicate of the digital layer.

## Core QA
With Node installed:

```bash
node tests/studyc-core.test.js
```

A pull-request workflow also runs deterministic core tests and checks that Study C runtime files contain no remote URLs.

## Research boundaries
- Study C is formative testing/co-design, not outcome evaluation.
- Interaction events are not relabelled as confidence, engagement, learning, empowerment, equity, persistence or sustained engagement.
- Parent/adult technical expertise is not required.
- Contribution actions are optional and transferable.
- No compulsory role rotation or reciprocity is used.
- AI output and human judgement remain separate.
- The coastal/lighthouse story is an orientation shell, not the research mechanism.
- Gender-equity review concerns technical/explanatory opportunity, legitimacy and recognition; equal turns are not treated as evidence of equity.

## Main files
- `studyc.html` — participant-facing research mode
- `css/studyc.css` — responsive/accessibility styling
- `js/studyc-core.js` — state machine and transparent classifier
- `js/studyc-app.js` — UI, local persistence and export
- `studyc-print.html` — printable shared authoring cards
- `tests/studyc-core.test.js` — deterministic core tests
- `.github/workflows/studyc.yml` — automated QA
