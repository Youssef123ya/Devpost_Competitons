// @module SnapOS-3.0/Gradients/PrismPalette — DO NOT REMOVE: prevents Lens Studio module collision

/**
 * Per-state palette pushed into the prism shader's `master0..2` and
 * `accent0..3` uniforms. The vertex shader evaluates the master stops as a
 * directional corner-to-corner band (× a far-offset glow) for the face and
 * the accent stops as the rim / bevel / side highlight band, passing both to
 * the fragment as varyings. `master0.a` is repurposed as a per-state
 * "desaturate the flat Z face" amount (1 = grey the face, 0 = leave it
 * coloured); the other alphas are unused. State animation lerps these vec4s.
 */
export type PrismStateColors = {
  master0: vec4
  master1: vec4
  master2: vec4
  accent0: vec4
  accent1: vec4
  accent2: vec4
  accent3: vec4
}

/**
 * Reflection (matcap) intensity multiplier, pushed once in
 * BeveledPrism.configureMesh. The reference FloatingMain runs a hot 2.0
 * here, but its face form comes from fixed UV gradients — the matcap is
 * added only as a thin highlight streak on top. Ours was leaning on the
 * matcap for the entire face look (idle master stops were flat), so it
 * dominated and its per-vertex "swim" read as the whole face sliding
 * around as you moved. Now that the master gradient carries a real dome
 * (see PRISM_IDLE_COLORS), the matcap is demoted to a subtle highlight and
 * the swim stops reading. Tune to taste: raise for more shine, lower for a
 * flatter matte face. Static (not state-driven) — like the reference, the
 * reflection layer is constant across states; the body palette carries the
 * state changes.
 */
export const PRISM_REFLECTION_INTENSITY: number = 0.8

/**
 * Idle palette — only the flat Z FACE desaturates; the side walls and bevel
 * stay colourful (just below hover). The master stops are a muted violet→teal
 * (what the sides want), and master0.a = 1 tells the shader to grey the colour
 * *on the flat face only* — the bevel / side region keeps the full master
 * colour (see BeveledPrismShader). hover/active set master0.a = 0 so their
 * faces stay coloured. Accent (rim / bevel / side stripe highlights) is a
 * muted mint→cyan, the hover family dialled back.
 */
export const PRISM_IDLE_COLORS: PrismStateColors = {
  master0: new vec4(0.3, 0.23, 0.44, 1.0), // bottom-right — muted violet (a=1: grey the flat face)
  master1: new vec4(0.25, 0.33, 0.44, 1.0), // mid — muted blue
  master2: new vec4(0.21, 0.48, 0.46, 1.0), // top-left — muted teal
  accent0: new vec4(0.6, 0.6, 0.6, 1.0), // edges — muted hover mint→cyan
  accent1: new vec4(0.46, 0.85, 0.79, 1.0), // dimmed mint
  accent2: new vec4(0.05, 0.3, 0.44, 1.0), // dimmed cyan
  accent3: new vec4(0.62, 0.82, 0.86, 1.0) // dimmed light-cyan
}

/**
 * Hover palette — multi-colour band running corner-to-corner (violet at the
 * bottom-right corner → teal/mint at the top-left), the "multiple colours
 * corner to corner" hover look from the reference. Brighter than the old
 * compressed values since the matcap is demoted now and the gradient carries
 * the colour itself. master1 is a distinct blue mid for a richer three-colour
 * sweep (mild per-vertex banding at the knee is acceptable at our density).
 */
export const PRISM_HOVER_COLORS: PrismStateColors = {
  master0: new vec4(0.34, 0.22, 0.52, 0.0), // bottom-right — violet (a=0: face stays coloured)
  master1: new vec4(0.26, 0.36, 0.5, 1.0), // mid — blue
  master2: new vec4(0.2, 0.56, 0.52, 1.0), // top-left — teal/mint
  // V12 at authored brightness — 6-stop reduced to c0/c1/c2/c4 (drops c3
  // deep blue and c5 light gray bookend identical to c0). Captures the
  // mint→cyan→light-cyan arc that gives hover its glow at the rim.
  accent0: new vec4(0.7, 0.7, 0.7, 1.0), // V12 c0 (light gray)
  accent1: new vec4(0.493, 1.0, 0.916, 1.0), // V12 c1 (mint)
  accent2: new vec4(0.0, 0.333, 0.5, 1.0), // V12 c2 (cyan)
  accent3: new vec4(0.725, 0.954, 1.0, 1.0) // V12 c4 (light cyan)
}

/**
 * Active (triggered) palette — currently mirrors hover. Triggering a button
 * should NOT recolour it: it rotates the existing colour band around the
 * centre (via the per-state rotation, which also spins the gradient — see
 * BeveledPrismShader), so active reuses the hover colours and only the
 * rotation differs. Kept as its own export so it can diverge later.
 */
export const PRISM_ACTIVE_COLORS: PrismStateColors = PRISM_HOVER_COLORS
