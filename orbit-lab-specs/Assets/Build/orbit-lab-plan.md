# Orbit Lab build manifest

Tier: interactive. Style: clean scientific illustration. Palette: cream, cyan,
amber, violet. All distances and radii are exaggerated, not astronomical predictions.

## Assets

- MeshBuilder backend (animated/articulated): OrbitLabModelMesh.ts and geometry
  helpers. Sun, marked Earth, orbiting Moon, orbit, sunlight rays, shadow wireframes,
  virtual plinth. Not a replacement for a failed AI mesh job; this backend was
  declared by the authorized design brief for a parametric teaching model.
- Existing imported icons, verified PNG sizes: play_arrow, check, arrow_forward,
  replay. All four are consumed by the controls UI.
- Font: Inter, imported through FontSelector; shared across both UI modules.
- SFX: OrbitLabClick, OrbitLabSuccess, OrbitLabRetry, generated with build-sfx.
- Music: OrbitLabBackgroundMusic, quiet ambient pad/vibraphone progression,
  39.054 seconds, generated with build-music; low-power loop below SFX.
- UIKit UI: OrbitLabInstructionUI (static BackPlate, title/challenge/instruction/
  feedback/scale disclaimer); OrbitLabControlsUI (BackPlate, orbit readout,
  slider, minus/plus step buttons, tilt button, primary action, Reset).

## Spatial layout, centimeters

The initial 65 cm model estimate is reduced to fit the 53 cm wide view at 110 cm.
All semantic anchors are authored, unit scale, under OrbitLab.

| Root | Position | Estimated bounds | Relation |
|---|---|---|---|
| Instruction UI | (0,19,-110) | 46 x 15 | above model, 3 cm gap |
| Model | (0,-1,-110), X rotation 35 degrees | 48 x 23 x 28 | between panels |
| Sun local | (-19,0,0) | diameter 8.4 | far from Earth |
| Earth local | (7,0,0) | diameter 6.4 | orbit center |
| Moon local | derived from angle/tilt, radius 10 | diameter 2.6 | around Earth |
| Plinth local | (0,-5,0) | 48 x 3 x 18 | below model |
| Controls UI | (0,-25,-108) | 46 x 23 | below model |

## UI contract and labels

Instruction UI exposes setView(title, instruction, feedback, progress, success).
Labels: Orbit Lab; Eclipse explorer; 1 / 3 • Solar; 2 / 3 • Lunar; 3 / 3 • Tilt;
Orbit complete; Illustration — not to scale; Virtual tabletop; dynamic lesson copy.
Controls UI exposes setControls(angle, tilted, interactive, orbitLocked, tiltDegrees), setAction(label,icon).
Emits onAction, onReset, onOrbitChange(number), onOrbitStep(number), onTiltToggle().
Labels: Moon orbit 359°; -15°; +15°; Tilted orbit; Start; Check alignment; Next;
Replay; Reset. Buttons are at least 6 cm tall; slider and buttons have standard
UIKit hover and press feedback. The slider is the design's explicit alternative
to grabbing the Moon; step buttons allow precise alignment.

## Scripts

OrbitLabMain coordinates the passive UI, single lesson-state owner, model, audio.
OrbitLabState owns challenge progression, pose, validation, feedback.
OrbitLabGeometry emits CCW vertex-color geometry only.
OrbitLabModelMesh renders poses on authored roots, never scores.
OrbitLabLayoutUI provides shared UIKit layout/text/button composition.
OrbitLabInstructionUI and OrbitLabControlsUI render state and emit user intent.
OrbitLabAudioController plays generated assets, low-latency SFX and looping bed.
Five LEAF scenarios were authored from observed runtime names and values; all passed. See verification.md.
