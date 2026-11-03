---
status: build-authorized
---

# Design brief: Orbit Lab

Design decisions below were selected by the coding assistant at the participant's explicit request to choose and build a competition project. They are proposed defaults, not statements invented about the participant's interests or learning. Build authorized; final entry and personal survey answers still require review.

## The one spatial moment
A learner stands at a small solar-system model, moves the Moon around Earth, and watches the shadow land. They solve solar- and lunar-eclipse challenges, then tilt the Moon's orbit to discover why eclipses do not happen every month. All design choices and numbers below are defaults.

## Why it belongs on glasses
- Draws in the world and leaves the learner free to move their viewpoint around a 3D alignment.
- A shadow and its source can be inspected together from different angles, at tabletop scale. The lesson is embodied in the model instead of a flat diagram.

## Product or overlay
- Product: a self-contained educational spatial puzzle for curious learners.
- Nothing in the real world needs recognition. No live AI, camera vision, voice, account, network, or external data is required by the Lens.
- Preview stand-in: a virtual tabletop/plinth, not a scan of real furniture.

## Where things live
- World-anchored after startup, about 110 cm ahead and 20–30 cm below eye level; comfortable view contains model and current controls (default; validate visually).
- Model spans about 65 cm horizontally (default), with Sun on the left and Earth to its right. Moon follows a constrained orbit around Earth.
- Bright orbit ring, sunlight/ray cues, Earth and Moon shadow cones, and simple globe markings make the science legible.
- Compact instruction and control module sits immediately beneath the model, with one main action per stage.
- Use bright cream/cyan/amber on additive display, not black backing. Keep text readable and controls large.
- Sizes, distances, shadow lengths, and eclipse tolerances are deliberately exaggerated; display “Illustration — not to scale.” Avoid claiming precision or real-time astronomical prediction.

## Hands and input
- Pinch Start to begin; standard SIK/UI Kit controls only.
- Grab/drag the Moon along its orbit (or use a UIKit orbit slider as an explicit accessible fallback); demonstrate the implemented standard input in preview.
- Tilt control changes the orbit inclination between 0° and an exaggerated educational tilt.
- Check alignment evaluates the current challenge; feedback identifies the spatial cause of failure.
- Next advances after success; Reset restores the entire lesson.
- Targets highlight on hover. No custom gesture or voice dependency.

## When things show
- Welcome introduces one concrete task. Exploration presents orbit and tilt controls and responsive eclipse feedback.
- Solar challenge asks for Moon between Sun and Earth with aligned orbital plane.
- Lunar challenge asks for Earth between Sun and Moon with aligned orbital plane.
- Tilt challenge holds the approximate new-moon angle while showing that a tilted Moon passes above/below alignment; learner restores alignment to finish.
- Success gives a concise explanation tied to the actual model; progress shows 1/3 through 3/3.
- A final takeaway and Replay complete the experience; no content behind the user is required.

## Done criteria
Each criterion must be observable in Lens Studio preview and covered by LEAF if supported.
1. Start replaces welcome with the model and first challenge; model remains world-positioned when viewpoint moves.
2. Orbit control visibly moves the Moon; a wrong alignment returns useful feedback without advancing.
3. Correct solar alignment produces the solar shadow cue, explanation, and enabled Next.
4. Correct lunar alignment produces the lunar shadow cue and advances the second challenge.
5. Increasing tilt breaks alignment; restoring it completes the final challenge, and Replay returns every control, score, and stage to its starting state.

## Out of scope
- Scientific ephemerides, real eclipse prediction, realistic scale ratios, live vision, persistent anchors, cloud services, multiplayer, bespoke hand gestures.

## Risks and open questions
- Comfort and real hand-tracking feel remain unproven without glasses.
- Preview QA must verify that the model and text fit the narrow display and are not occluded by UI.
- Authored default scene may contain package artifacts from 5.24.1; verify compatibility with Lens Studio 5.23.2 before building upon it.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources

## Implemented decisions and evidence (2026-10-30)

The final model is about 48 cm wide at 110 cm, with instruction card above and
controls below. UIKit slider and plus/minus 15-degree buttons implement constrained
Moon movement. Tilt uses a standard UIKit button (Tilt orbit / Flatten orbit);
18 degrees is explicitly exaggerated. Five LEAF scenarios passed, and a full
flow rerun passed after final layout. World position held while the preview
viewpoint moved. See Assets/Build/verification.md for proof and device limits.
