# AXIOM-7 Study C Research Mode

## Coastal Signal Studio

This branch implements the controlled R12 Study C build-ready specification as a separate AXIOM-7 research mode. It does **not** replace the historical board/game implementation on `main`.

## What participants do
A zero-background child–adult pair:
1. creates a tiny labelled signal dataset;
2. tests a local transparent 1-nearest-example classifier;
3. inspects which example(s) most influenced the result;
4. makes a human judgement about whether the prediction makes sense;
5. revises participant-authored examples, labels, feature values, test signal or beacon mapping;
6. retests and compares before/after behaviour;
7. reflects on what the model used and what people still decided.

The classifier is one bounded implementation choice. It is **not** a theoretically required part of the PhD contribution.

## Run
Open `studyc.html` directly in a modern browser. Study C mode has no required network or CDN dependency.

Optional shared printable cards: `studyc-print.html`.

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

## Main files
- `studyc.html` — participant-facing research mode
- `css/studyc.css` — responsive/accessibility styling
- `js/studyc-core.js` — state machine and transparent classifier
- `js/studyc-app.js` — UI, local persistence and export
- `studyc-print.html` — printable shared authoring cards
- `tests/studyc-core.test.js` — deterministic core tests
- `.github/workflows/studyc.yml` — automated QA
