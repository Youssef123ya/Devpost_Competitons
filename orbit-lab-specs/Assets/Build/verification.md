# Orbit Lab verification

Verified 2026-10-30 in Lens Studio 5.23.2.26081320, SPECS 27 Interactive Preview,
Evening Room. Preview evidence only; no physical device was used.

## Integration results

All five scenarios passed serially through LEAF Preview tools. Assertions drive
actual SIK/UIKit controls rather than setting domain state.

| Scenario | Result | Duration | Coverage |
|---|---|---|---|
| orbit-start-wrong-answer | PASS | 1.952 s | Start, wrong answer, no premature progress |
| orbit-slider-solar | PASS | 8.814 s | Slider drag moves Moon; solar success |
| orbit-lunar | PASS | 10.658 s | Solar prerequisite, lunar shadow and progress |
| orbit-tilt-replay-reset | PASS | 16.827 s | Tilt miss, flatten, completion, Replay/Reset |
| orbit-ik-start-reset | PASS | 9.771 s | IK interactor Start/Reset via indirect pinch |

After raising the control panel to Y=-25 cm, orbit-tilt-replay-reset passed again
in **16.907 s**. Authoritative Lens log: PASSED at 20:24:34 editor log time.
The same run logged solar completed=1, lunar completed=2, tilt completed=3,
complete, then welcome completed=0. Fresh/tail runtime error arrays were empty.

## Visual and manual checks

- Reviewed native captures for solar/lunar success, tilted miss and completion.
  Current captures use Tilt orbit / Flatten orbit. Full card and action row fit.
- Sun rotation changed across timestamps. Moon/shadow respond to orbit changes.
  The model is intentionally hidden on welcome.
- Orbiting the preview camera 15 degrees changed the view while model world
  position remained (0,-1,-110). QA/viewpoint.jpg records the view.
- Four WAVs imported and opened for playback. Music: 39.054 s, peak -0.4 dB,
  runtime volume 0.08. SFX LowLatency, music LowPower loop.
- Native recorder produced QA/orbit-lab-preview-raw.mp4: 121.258 s, H.264,
  1526 x 1590, 30 fps, AAC audio. Sampled frames show the full working lesson.
  QA/orbit-lab-demo.mp4 adds captions from QA/demo-captions.srt.

## Reproduce

Open SPECS 27 Interactive Preview and a room environment. Start; Check at 90
for failure; six minus 15 presses reach solar 0; Check, Next. Lunar starts 90:
six plus 15 presses reach 180; Check, Next. Check while tilted for failure;
Flatten orbit; Check, Next. Replay restores welcome, angle 90, tilt OFF and
zero progress. Reset does the same.

Development helper roots are detached from the final scene. To rerun, first
read the scene; apply orbit-qa-attach.json through VirtualScene only if roots
are absent. Open LEAF panel, list scenarios and run serially onDevice=false.
The LEAF plugin creates its MessagingBridge. Refresh after IK before using
inspection tools. Detach helper roots again after QA.

## Compatibility repairs

Sealed SIK/UIKit artifacts failed at startup despite source compilation.
Supported AssetManager.unpack restored source execution with references intact;
no Cache edits. SIK source reports 0.18.0 despite original descriptor 2.0.
Inspect 4 example imports were adapted to SpectaclesUIKit/SpectaclesInteractionKit.
Leaf 2.0.2 and Interact 2.0.1 were installed through Asset Library to match the
project API. Core LEAF/SIK source was not patched for tests.

## Limits

Logic proven in Preview. Real hand tracking, physical reach, prolonged comfort,
additive display appearance, device performance and persistent anchors remain
unproven. IK tested indirect targeting, not direct arm reach. Exaggerated
geometry, 18-degree teaching tilt and 10-degree tolerance form a discrete puzzle,
not an astronomical simulation. Position stability was tested in Preview,
not physical SLAM on glasses.

## Final saved scene

After detaching AiPreviewAgent Handler, OrbitLabQA and LEAF Plugin Bridge,
forced compilation succeeded and a fresh preview returned errors=[] with
model, controls and Main ready. VirtualScene read confirmed all three helper
roots absent. Display name Orbit Lab was saved and verified. Captioned video
duration is 121.198 s, with captions placed above the lesson content.
