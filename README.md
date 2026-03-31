The file `axiom7-hybrid` is a web-based front-end interface for managing a family board game experience named "AXIOM-7." Here's a breakdown of its key components and functionality:

---

### General Summary:
This HTML/JavaScript file creates a visual interface and manages game logic for the "AXIOM-7 Mission Control Terminal." The game involves families or groups collaborating around a physical printed board, with this web application acting as the central hub for challenges, player roles, scoring, and event tracking.

**Key Features:**
- Themed interface using amber, teal, and coral colors with specific fonts (`Cinzel` and `Courier Prime`).
- Predefined roles such as Captain, Navigator, Engineer, Scientist, and Storyteller.
- Support for a cooperative multi-player game format.
- Game features include trivia, creative challenges, puzzles, timers, and scoring.

---

### HTML + CSS Structure:
1. **Basic Meta Tags and Styles**:
   - Includes responsive settings (`meta charset="UTF-8"` and `meta viewport`).
   - Styled to fit minimalistic design (`body` aligns content centrally with dark amber-themed background).

2. **Custom Input and Game Styling**:
   - Input boxes (`mct-input`) are implemented for player names, with a hover and focus effect for user interaction.
   - Canvas is centrally displayed for visual animations and game components.

---

### JavaScript Gameplay Logic:
The JavaScript code (relevant logic in tags within `<script>`) defines all game elements, mechanics, and rendering functions via libraries like P5.js.

#### 1. **Global Constants**
- **Screen Dimensions and Fonts**: `const W=820`, `H=700`, and fonts `FD='Cinzel', FB='Courier Prime'`.
- **Roles & Tokens**:
  - Each role (e.g., Captain 🚀, Navigator 🗺️) has unique colors and icons.
  - Tokens (e.g., Red, Green, Gold) represent players' physical game pieces.

---

#### 2. **Game Objects**
- **Adventure Locations**:
  The game has 20 predefined locations, categorized into types like trivia, creativity, and puzzles. Each location is displayed with associated icons, labels, and mini-event text (`Earth HQ`, `NOVA Station`, `The Void Canvas`, etc.).

- **Game Levels**:
  Multiple levels (Explorer, Pathfinder, Pioneer, Vanguard) control difficulty points and aesthetic settings.

- **Challenges**:
  A `question bank` is available for trivia, puzzles, and creative tasks. For example:
    - Trivia: "What does AI stand for?"
    - Puzzles: Ordering steps or solving basic logic/code problems.
    - Create: Drawing animations or shapes programmatically using `p5.js`.

---

#### 3. **Game State**
Manages:
- Players and their `roles`, `names`, `chosen tokens`, and scores.
- Current turn and selected challenges.
- Logs for challenges or mission events.

---

#### 4. **Game Logic**
- Dice rolls to advance players across the 20-step board.
- Challenges based on location types (e.g., trivia, create).
- Role-based points awarding system:
  - Example: Navigator reads trivia aloud; Captain awards the score.

---

### Goal of the Program:
This file provides an interactive interface that groups or families can use to manage the game session for AXIOM-7 collaboratively. It requires players to follow prompts and client-side computation to maintain player states, score transitions, and interactions with the physical board elements.

For deeper functionality or questions, feel free to specify!
