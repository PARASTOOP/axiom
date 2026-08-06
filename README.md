# AXIOM-7 — The Coastal Grid

A local-first family learning adventure set in a fictionalised Welsh coastal
world. It teaches computing and AI concepts — binary encoding, sequencing and
debugging, classification, confidence and thresholds, training-data balance,
prediction and model limits, autonomy and human oversight, accountability —
through one continuous narrative that connects physical board play with
digital missions.

This implementation follows `AXIOM7_Complete_Implementation_Specification.docx`
phase-by-phase (0 through 9): a versioned local data model and content
loader, a Narrative Engine, an Adventure Map service, a generic Creative
Coding Lab engine with a real sandbox (Watch → Change → Predict → Run →
Compare → Debug → Create → Explain), six Machine Learning laboratories with
mandatory human-review paths, autonomy/accountability/coordination
laboratories, full accessibility support, an Expedition Journal, and all five
content decks (15 missions) from launch through the epilogue and free
exploration.

## Running it

No build step, no server-side code, no accounts. Serve the folder statically
and open `index.html`, e.g.:

```
python3 -m http.server 8080
# then open http://localhost:8080/
```

Everything is stored in the browser's `localStorage` on the device it runs
on. There is no network calls, no telemetry, and no personal data collection.
Optional narration uses the browser's built-in speech synthesis, so no audio
files are bundled.

## Project layout

- `index.html` — app shell entry point
- `css/styles.css` — theme, layout, accessibility (reduced motion, high
  contrast, text scaling, focus states)
- `js/db.js`, `js/store.js` — versioned local persistence
- `js/content/` — world configuration, characters, the five decks (15
  missions with full narrative continuity arcs), reflection prompts
- `js/contentLoader.js` — validates content before anything else runs
- `js/narrativeEngine.js`, `js/characterService.js` — StoryNode resolution
  and the four fixed characters (Captain Yara, Nova, Byte Rover, Luma Drone)
- `js/mapService.js` — Adventure Map state and landscape updates
- `js/labEngine.js`, `js/labRenderers.js` — the generic, config-driven
  Creative Coding Lab engine and sandbox powering all 15 mission labs
- `js/mlEngine.js` — confidence/threshold/balance presentation rules for the
  six ML laboratories
- `js/journal.js` — Expedition Journal, saved creations, achievements, and
  the gated research-event boundary
- `js/accessibility.js`, `js/narrationPlayer.js` — preferences and narration
  controls
- `js/app.js`, `js/main.js` — the Phase 1 user journey state machine and
  every screen

## Legacy prototype

`axiom7-hybrid` is an earlier, unrelated single-file prototype (a generic
space-themed trivia/puzzle game) that predates this specification. It is
kept for history but is not part of the AXIOM-7 Coastal Grid implementation
described above.
