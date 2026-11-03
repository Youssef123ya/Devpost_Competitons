> Submitted to Learn AR with SPECS on 2026-10-30 after explicit confirmation,
> verified live: https://devpost.com/software/orbit-lab-3m8d6z
> The solar-alignment image is the project thumbnail. This file retains the
> prepared packet; the published page is the current entry.

# Title

Orbit Lab

## One-line Summary

Move the Moon, follow its shadow, and discover why eclipses need both the right
order and the right orbital plane in a hands-on spatial lesson for SPECS.

## Problem

Solar and lunar eclipse diagrams are easy to memorize without understanding
what lines up. They can also leave a misleading question unanswered: if the
Moon circles Earth every month, why are eclipses uncommon? Curious learners
need to see the three-dimensional relationship between light, shadow and tilt.

## Solution

Orbit Lab puts an illustrated Sun, Earth and Moon in a small world-space lab.
Learners move the Moon with an orbit slider or precise step buttons, inspect
its shadow and check their arrangement. Three short challenges cover solar
eclipses, lunar eclipses and orbital tilt. Feedback explains the actual pose;
completion ties order and plane together, then Replay invites another attempt.

## What the Build Demonstrated

A successful compile is not proof that an AR experience starts or behaves correctly. Package compatibility, fresh runtime logs, preview captures and tests through real controls each caught different issues. World-space layout also needs viewpoint and framing checks.

## Why This Matters

Spatial learning lets a learner change viewpoint while keeping the same model
in the room. The light source, bodies and shadow remain visible together.
The goal is a specific causal insight rather than a floating textbook page.
The intended audience is curious beginning astronomy learners.

## How We Used AI

AI was used to plan and author the experience, procedural graphics, interface,
audio generation code and integration tests. The MeshBuilder backend was chosen
for a constrained, animated teaching model. WAV assets were generated locally
through CLAD sound/music workflows. The running lesson uses no AI model,
network service, camera recognition, voice or personal data.

## How We Used Codex

Codex developed the authorized design brief, authored TypeScript through the
CLAD workflow, and constructed the scene through Lens Studio MCP VirtualScene.
It installed assets, repaired package compatibility via supported unpack and
Asset Library operations, inspected runtime state and logs, exercised real
SIK/UIKit controls, wrote and ran five LEAF scenarios, adjusted the layout from
preview captures, and recorded the actual preview using Lens Studio's recorder.
The participant handled native permission prompts. Planning documents remain
in devpost/ alongside the project.

## Key Features

- Animated Sun, marked Earth, orbiting Moon and visible shadow/ray cues.
- Orbit slider plus precision buttons; standard UIKit Tilt/Flatten control.
- Three challenges with pose-dependent feedback and progress.
- Replay and Reset restore the complete initial state.
- Generated sound effects and a quiet ambient loop.
- World-space placement and an explicit illustration/not-to-scale disclaimer.

## Architecture

OrbitLabState is the sole lesson-state owner. OrbitLabMain coordinates passive
instruction/control UI modules, procedural model rendering and audio. Geometry
is generated with MeshBuilder on authored semantic anchors. UIKit/SIK supply
interaction and layout. LEAF scenarios drive the same controls and inspect
observable results; QA helper scene roots are detached from the saved lesson.
No cloud backend or persistent user data is needed.

## Testing Instructions

Open SpecsLens.esproj in Lens Studio 5.23.2 or a compatible newer version.
Select SPECS 27 Interactive Preview and a room environment; pinch/click Start.
Check at the starting 90-degree pose for helpful failure feedback. Use six
minus 15-degree presses to reach solar 0; Check, Next. Lunar starts 90: use six
plus 15-degree presses to reach 180; Check, Next. In the final challenge,
Check while tilted, Flatten orbit, Check, Next. Replay returns to welcome,
90 degrees, tilt OFF and zero progress. Reset also restores the starting state.
Use the slider to explore continuously and move the preview viewpoint around
the model. See Assets/Build/verification.md for LEAF reattachment and results.

Five scenarios passed: Start/wrong answer, slider/solar, lunar, tilt/Replay/Reset,
and indirect IK pinch Start/Reset. Full flow passed again after final layout
adjustment in 16.907 s. Final shipping-scene compile succeeded and fresh runtime
error arrays were empty after detaching QA helpers.

## Public Demo Link

https://www.youtube.com/watch?v=7s5lA8JthsY

Public on YouTube. No web deployment is required for this Lens.
Local fallback: Assets/Build/QA/orbit-lab-demo.mp4 (121.198 seconds).

## Public Repository Link

https://github.com/Youssef123ya/orbit-lab-specs

Public repository contains the Lens project and planning documents. An anonymous
clone verified all 1,112 files against the prepared source, with no private
files included. Binaries are stored directly in Git. Publication details are
in devpost/publication-kit.md.

## Demo Video

Local captioned video: Assets/Build/QA/orbit-lab-demo.mp4, 2 minutes 1 second,
1526 x 1590 H.264/AAC. Actual Lens Studio Preview footage with simulated pinch
input throughout; no synthetic stand-in animation. Covers welcome, wrong check,
solar alignment, lunar alignment, tilt miss, restoration, completion and Replay.
The captioned version explains the user problem, interactions, build process and
limits. Raw recording and editable SRT captions are retained locally.

Public video: https://www.youtube.com/watch?v=7s5lA8JthsY

YouTube reports no copyright-check issues. The watch page shows the correct
title and 2:01 duration.

## Screenshot Shot List

| File under Assets/Build/QA | Evidence |
|---|---|
| solar.jpg | Moon between Sun and Earth; success feedback |
| lunar.jpg | Earth between Sun and Moon; success feedback |
| tilted.jpg | Exaggerated tilted plane and shadow miss |
| complete.jpg | All three challenges complete; Replay |
| viewpoint.jpg | Different preview viewpoint of world-space model |

The first four show the final controls. Viewpoint capture predates the final
2 cm control-panel nudge. Screenshots are proof of preview behavior, not device use.

## Submission Readiness Notes

Local implementation, screenshots, test evidence, video and draft exist. Official
requirements were retrieved through Devpost MCP on 2026-10-30: new SPECS Lens,
Devpost Learn planning docs, build through an AI coding agent using CLAD/MCP,
working Preview, public repository, public YouTube video under 3 minutes and short
description. Public links now exist. Repository transfer and anonymous-clone verification passed. The participant explicitly approved the assistant-selected reflection ratings.
The entry was sent after explicit confirmation and verified live. Recheck requirements before any later material edit.

## Known Limitations

Illustrated proportions, shadow lengths, 18-degree tilt and 10-degree tolerance
are deliberately exaggerated. This discrete puzzle does not predict eclipses.
Real-device hand tracking, physical reach, comfort, additive display appearance,
performance and persistent anchors remain untested. Preview IK covered indirect
pinch routing, not physical direct reach. There is no save or multiplayer feature.

## TODO Official Form Fields

The form below was accepted with the entry after explicit confirmation. Existing personal
answers stay only in ignored local state and must not be copied into a public repo.
Already saved:29102(submitter type),29103(country),29106/29107/29108(eligibility),
29100(prior Lens Studio experience),29095(AI cost effect). Reuse these privately;
do not ask the participant for them again unless official data changes.

The factual technology explanation for 29092 is also saved locally for later
form entry. The participant delegated drafting the remaining reflections. Answers and their provenance are saved privately; assistant-selected personal-rating assumptions were approved during the final review.

- 29091: add the public repository URL.
- 29092 technology requirement explanation draft: Orbit Lab was planned in the
 Devpost Learn workflow with devpost/design-brief.md; built by Codex using CLAD
 skills and Lens Studio MCP, with TypeScript, MeshBuilder and SIK/UIKit; and
 verified in SPECS 27 Interactive Preview with five passing LEAF scenarios.
- 29093: participant's assessment of how closely CLAD built the brief.
- 29094: participant's choice of which step took the most time.
- 29096: factual troubleshooting record; does not claim the participant nearly quit.
- 29097: assistant recommendation on compatibility checks, per delegated drafting.
- 29098: participant's likelihood of using Lens Studio again.
- 29101: participant's assessment of skills learned.
- 29099: participant's view of how their AR thinking changed.
- 29104 organization name and 29105 social post: optional if applicable.

Reflection drafts were selected by the assistant at the participant's request and need final review. Suggested factual
prompts: package compatibility debugging, preview versus device evidence, and
how orbital-plane manipulation differs from a flat diagram. These are prompts,
not claims about what the participant felt or learned.
