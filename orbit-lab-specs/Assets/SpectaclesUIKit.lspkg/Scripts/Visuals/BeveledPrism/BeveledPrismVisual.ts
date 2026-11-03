// @module BeveledPrism/BeveledPrismVisual — DO NOT REMOVE: prevents Lens Studio module collision
import {Interactor} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import {StateName} from "../../Components/Element"
import {
  PrismStateColors as SharedPrismStateColors,
  PRISM_ACTIVE_COLORS,
  PRISM_HOVER_COLORS,
  PRISM_IDLE_COLORS
} from "../../Themes/SnapOS-3.0/Gradients/PrismPalette"
import {colorLerp} from "../../Utility/UIKitUtilities"
import {Visual, VisualArgs, VisualParameters, VisualState} from "../Visual"
import {BeveledPrism} from "./BeveledPrism"

export {PRISM_ACTIVE_COLORS, PRISM_HOVER_COLORS, PRISM_IDLE_COLORS}
export type PrismStateColors = SharedPrismStateColors

/**
 * Prism palette constants live in Themes/SnapOS-3.0/Gradients/PrismPalette
 * so theme data does not import this visual implementation. The re-export
 * above keeps existing BeveledPrismVisual imports source-compatible.
 */
export type BeveledPrismVisualState = {
  prismColors?: PrismStateColors
  // One-shot geometry config — read once from the `default` state at theme
  // application. Not state-driven (no per-state tween). Shader clamps to
  // min(cornerRadius, depth/2), so values beyond that are safe but ignored.
  bevelRadius?: number
  // One-shot corner radius. Button overrides this for Capsule/Round shapes
  // (which need size-derived radii); for Rectangle the theme value wins.
  cornerRadius?: number
  // Forward-only Z displacement (cm). Front face/bevel pop forward; back
  // face is anchored. Tweens between states alongside prismColors.
  // `BeveledPrism._depth` (collider/AABB) does NOT change — only the
  // visual mesh deforms. Undefined treated as 0. Negative clamped to 0.
  extrusion?: number
  // Body presence in [0, 1]. 1 = natural depth. 0 = front face pulled
  // back to the back face (visually flat plane). Composes with
  // `extrusion`: final shader uniform =
  //   -depth * (1 - bodyDepthScale) + extrusion,
  // clamped to [-depth, +inf). PrismGhost uses 0 at idle (flat) and 1
  // on hover (full body). Undefined treated as 1 so existing styles
  // keep natural depth.
  bodyDepthScale?: number
  // Rotation in degrees. Drives BOTH the matcap UV rotation and the colour
  // band axis (see BeveledPrismShader), so animating it spins the gradient
  // colours around the centre. Per-state values are 0 at idle/hover (no
  // spin) and step up on trigger, so a press rotates the colours rather than
  // recolouring them. Tweens alongside prismColors. Undefined treated as 0.
  matcapRotation?: number
  // Per-state body opacity in [0, 1]. Tweens on state change to power
  // the PrismGhost style (fully transparent at idle, fades up on hover).
  // Undefined treated as 1 so styles that don't set it stay opaque.
  opacity?: number
} & VisualState

export type BeveledPrismVisualParameters = {
  default: BeveledPrismVisualState
  hovered: BeveledPrismVisualState
  triggered: BeveledPrismVisualState
  toggledDefault: BeveledPrismVisualState
  toggledHovered: BeveledPrismVisualState
  toggledTriggered: BeveledPrismVisualState
  inactive: BeveledPrismVisualState
} & VisualParameters

// Euclidean RGB-space distance — used below to scale palette-tween
// duration by magnitude of change. Kept local instead of swapping to
// UIKitUtilities.colorDistance: the latter returns normalized hue
// distance ∈ [0, 1] and ignores saturation/value, which is the wrong
// shape for "how much did this 7-stop palette change overall."
function vec4Distance(a: vec4, b: vec4): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  const dw = a.w - b.w
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
}

function lerpPrismColors(a: PrismStateColors, b: PrismStateColors, t: number): PrismStateColors {
  return {
    master0: colorLerp(a.master0, b.master0, t),
    master1: colorLerp(a.master1, b.master1, t),
    master2: colorLerp(a.master2, b.master2, t),
    accent0: colorLerp(a.accent0, b.accent0, t),
    accent1: colorLerp(a.accent1, b.accent1, t),
    accent2: colorLerp(a.accent2, b.accent2, t),
    accent3: colorLerp(a.accent3, b.accent3, t)
  }
}

// Max component-wise vec4 distance across all seven stops. Used to scale
// transition duration so a small palette change tweens quickly and a big
// one takes the full animateDuration — same pattern as Visual.updateColors.
function prismColorsDistance(a: PrismStateColors, b: PrismStateColors): number {
  return Math.max(
    vec4Distance(a.master0, b.master0),
    vec4Distance(a.master1, b.master1),
    vec4Distance(a.master2, b.master2),
    vec4Distance(a.accent0, b.accent0),
    vec4Distance(a.accent1, b.accent1),
    vec4Distance(a.accent2, b.accent2),
    vec4Distance(a.accent3, b.accent3)
  )
}

/**
 * The `BeveledPrismVisual` class renders the iridescent prism button. It owns
 * a `BeveledPrism` Shape and tweens the seven palette uniforms (3 master + 4
 * accent stops) on state changes. Mirrors `RoundedRectangleVisual`'s pattern:
 * per-state stored values, animated lerp on `setState()`, theme-driven
 * defaults via `applyStyleParameters`.
 *
 * The vertex shader evaluates the gradients per vertex from `faceUV`-derived
 * inputs, so this class only needs to push the lerped stops as material
 * uniforms each frame during the transition.
 *
 * @extends Visual
 */
export class BeveledPrismVisual extends Visual {
  private static readonly CONTENT_Z_EPSILON = 0.1
  // Multiplier on animateDuration for opacity HIDE direction only.
  // PrismGhost reads as "fade up fast / fade out slow" with ~1.75× the
  // base duration on the way down.
  private static readonly HIDE_DURATION_SCALE = 1.75

  // Per-state shader/animation config grouped into one object (was 35 separate
  // fields) to stay below SnapHermes' 64-own-property dictionary cliff. Pure
  // storage relocation behind unchanged accessors. Semantics unchanged:
  //  - extrusion (cm): forward pop; setters clamp <0 to 0 and propagate the
  //    worst-case max to the BeveledPrism AABB (see propagateMaxExtrusion).
  //  - bodyDepthScale [0,1]: body presence; composes with extrusion at the
  //    shader push site.
  //  - matcapRotation (deg): animated reflection sweep.
  //  - opacity [0,1]: per-state body opacity (powers PrismGhost fade).
  private readonly _prismStates: Record<
    "default" | "hovered" | "triggered" | "inactive" | "toggledDefault" | "toggledHovered" | "toggledTriggered",
    {prismColors: PrismStateColors; extrusion: number; bodyDepthScale: number; matcapRotation: number; opacity: number}
  > = {
    default: {prismColors: PRISM_IDLE_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    hovered: {prismColors: PRISM_HOVER_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    triggered: {prismColors: PRISM_ACTIVE_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    inactive: {prismColors: PRISM_IDLE_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    toggledDefault: {prismColors: PRISM_ACTIVE_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    toggledHovered: {prismColors: PRISM_HOVER_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1},
    toggledTriggered: {prismColors: PRISM_ACTIVE_COLORS, extrusion: 0, bodyDepthScale: 1, matcapRotation: 0, opacity: 1}
  }

  private _currentPrismColors: PrismStateColors = PRISM_IDLE_COLORS
  private _prismColorsCancelSet: CancelSet = new CancelSet()
  private _currentExtrusion: number = 0
  private _extrusionCancelSet: CancelSet = new CancelSet()
  private _currentBodyDepthScale: number = 1
  private _bodyDepthScaleCancelSet: CancelSet = new CancelSet()
  private _currentMatcapRotation: number = 0
  private _matcapRotationCancelSet: CancelSet = new CancelSet()
  private _currentOpacity: number = 1
  private _opacityCancelSet: CancelSet = new CancelSet()

  // Cursor-tracking matcap UV offset. Driven per-frame while hovered;
  // fades to zero on hover exit. Mirrors the reference shader's "TR X /
  // TR Y" trick — shifting the matcap UV moves the bright spot under
  // the interactor's hit point. ~2 ALU/vertex on the GPU; the heavy
  // lifting (smoothing, clamping, world→local) lives here in TS so the
  // shader stays trivially cheap.
  private static readonly CURSOR_SENSITIVITY = 0.18
  private static readonly CURSOR_FADE_EPSILON_SQ = 1e-6
  // Time-constant of the smoothing lerp, in seconds. ~40 ms gives
  // buttery follow with no perceptible lag; raise for slower follow,
  // lower for snappier-but-jitterier.
  private static readonly CURSOR_SMOOTHING_TC = 0.04
  // Set of all interactors currently hovering. Cursor follows the first
  // one inserted (Set iteration in JS is insertion order); when that one
  // exits, the next one in the set takes over. Empties -> cursor fades to
  // (0,0) and the loop self-disables.
  private _currentInteractors: Set<Interactor> = new Set()
  private _currentCursorOffset: vec2 = new vec2(0, 0)
  private _targetCursorOffset: vec2 = new vec2(0, 0)
  private _cursorUpdateEvent: SceneEvent | null = null

  public override onHoverEnter(event: InteractorEvent): void {
    if (event.propagationPhase !== "Target") {
      return
    }
    this._currentInteractors.add(event.interactor as Interactor)
    if (this._cursorUpdateEvent) {
      this._cursorUpdateEvent.enabled = true
    }
  }

  // Drop the exiting interactor. If others remain (two-hand hover), the
  // cursor loop keeps following the next one in insertion order — we
  // follow whoever entered first until they exit. Once the set empties,
  // the cursor loop lerps offset toward (0,0) and self-disables when it
  // falls below CURSOR_FADE_EPSILON_SQ.
  public override onHoverExit(event: InteractorEvent): void {
    if (event.propagationPhase !== "Target") {
      return
    }
    this._currentInteractors.delete(event.interactor as Interactor)
  }

  private _beveledPrismVisualStates: Map<StateName, BeveledPrismVisualState>
  protected _state: BeveledPrismVisualState = undefined
  protected prevState: BeveledPrismVisualState = undefined

  protected get visualStates(): Map<StateName, BeveledPrismVisualState> {
    return this._beveledPrismVisualStates
  }

  public constructor(args: VisualArgs) {
    super(args)
    this._sceneObject = args.sceneObject
    this.beveledPrism = this._sceneObject.createComponent(BeveledPrism.getTypeName())
    this.managedComponents.push(this.beveledPrism)
    this.beveledPrism.initialize()
    this.beveledPrism.size = new vec2(this.size.x, this.size.y)
    this.beveledPrism.depth = this.size.z
    this._transform = this._sceneObject.getTransform()
    // Push initial palette so the shader has valid uniforms before the first
    // frame renders (otherwise they'd be whatever the .mat has on disk).
    this.pushPrismColors(this._currentPrismColors)
    this.beveledPrism.setFrontExtrusion(this.composedFrontExtrusion)
    this.beveledPrism.setMatcapRotation(this._currentMatcapRotation)
    this.applyEffectiveOpacity()
    // Per-frame cursor-offset loop. Hosted on the owned BeveledPrism (a
    // BaseScriptComponent — Visual itself isn't one) so it gets torn down
    // with the rest of the Visual via managedComponents. Enabled only while
    // hovered; see onHoverEnter / onHoverExit / updateCursorOffset.
    this._cursorUpdateEvent = this.beveledPrism.createEvent("LateUpdateEvent")
    this._cursorUpdateEvent.bind(() => this.updateCursorOffset())
    this._cursorUpdateEvent.enabled = false
    this.initialize()
  }

  public destroy(): void {
    if (this._cursorUpdateEvent) {
      this._cursorUpdateEvent.enabled = false
    }
    this._currentInteractors.clear()
    this._prismColorsCancelSet.cancel()
    this._extrusionCancelSet.cancel()
    this._bodyDepthScaleCancelSet.cancel()
    this._matcapRotationCancelSet.cancel()
    this._opacityCancelSet.cancel()
    super.destroy()
  }

  public get size(): vec3 {
    return super.size
  }

  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    const previousContentZOffset = this.contentZOffset
    super.size = size
    if (this.initialized) {
      this.beveledPrism.size = new vec2(size.x, size.y)
      this.beveledPrism.depth = size.z
    }
    const nextContentZOffset = this.contentZOffset
    if (Math.abs(nextContentZOffset - previousContentZOffset) > 1e-6) {
      this.notifyContentZOffsetChanged(nextContentZOffset)
    }
  }

  public get renderMeshVisual(): RenderMeshVisual {
    return this.beveledPrism.renderMeshVisual
  }

  // Required by the Visual abstract contract. BeveledPrism doesn't have
  // a border feature (the analytical edge mask covers the rim look),
  // so these are constant — false / 0.
  public get hasBorder(): boolean {
    return false
  }

  public get borderSize(): number {
    return 0
  }

  // Stored only to satisfy the Visual.baseColor abstract contract. The prism
  // shader doesn't consume a single base color — body comes from the
  // master*/accent* state palettes evaluated per vertex.
  private _baseColorStorage: vec4 = new vec4(1, 1, 1, 1)

  public get baseColor(): vec4 {
    return this._baseColorStorage
  }

  protected set baseColor(value: vec4) {
    this._baseColorStorage = value
  }

  // External opacity multiplier (Button / Frame fade APIs). Composed with
  // the state-tweened `_currentOpacity` so a PrismGhost button that's
  // mid-fade for autoShowHide still respects its per-state opacity curve.
  private _externalOpacity: number = 1

  public get opacity(): number {
    return this._externalOpacity
  }

  public set opacity(value: number) {
    this._externalOpacity = value
    this.applyEffectiveOpacity()
  }

  private applyEffectiveOpacity(): void {
    this.beveledPrism.opacity = this._currentOpacity * this._externalOpacity
  }

  public get cornerRadius(): number {
    return this.beveledPrism.cornerRadius
  }

  public set cornerRadius(value: number) {
    if (value === undefined) {
      return
    }
    this.beveledPrism.cornerRadius = value
  }

  public get bevelRadius(): number {
    return this.beveledPrism.bevelRadius
  }

  public set bevelRadius(value: number) {
    if (value === undefined) {
      return
    }
    this.beveledPrism.bevelRadius = value
  }

  public get currentPrismColors(): PrismStateColors {
    return this._currentPrismColors
  }

  public get defaultPrismColors(): PrismStateColors {
    return this._prismStates.default.prismColors
  }

  public set defaultPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.default.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get hoveredPrismColors(): PrismStateColors {
    return this._prismStates.hovered.prismColors
  }

  public set hoveredPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.hovered.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get triggeredPrismColors(): PrismStateColors {
    return this._prismStates.triggered.prismColors
  }

  public set triggeredPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.triggered.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get inactivePrismColors(): PrismStateColors {
    return this._prismStates.inactive.prismColors
  }

  public set inactivePrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.inactive.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledDefaultPrismColors(): PrismStateColors {
    return this._prismStates.toggledDefault.prismColors
  }

  public set toggledDefaultPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledDefault.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledHoveredPrismColors(): PrismStateColors {
    return this._prismStates.toggledHovered.prismColors
  }

  public set toggledHoveredPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledHovered.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledTriggeredPrismColors(): PrismStateColors {
    return this._prismStates.toggledTriggered.prismColors
  }

  public set toggledTriggeredPrismColors(value: PrismStateColors) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledTriggered.prismColors = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get currentExtrusion(): number {
    return this._currentExtrusion
  }

  public override get contentZOffset(): number {
    return this.size.z * 0.5 + this.composedFrontExtrusion + BeveledPrismVisual.CONTENT_Z_EPSILON
  }

  // Collider never shrinks below natural depth — PrismGhost's flat-at-idle
  // state still needs a full-size collider so the invisible button can
  // catch hover. Only positive composed extrusion widens it.
  public override get colliderSizeOffset(): vec3 {
    return new vec3(0, 0, Math.max(0, this.composedFrontExtrusion))
  }

  public override get colliderCenterOffset(): vec3 {
    return new vec3(0, 0, Math.max(0, this.composedFrontExtrusion) * 0.5)
  }

  // Single source of truth for the shader uniform: combine the per-state
  // cm-based pop with the per-state body-depth scale, then clamp so the
  // front face can never cross the anchored back face.
  private get composedFrontExtrusion(): number {
    const composed = -this.size.z * (1 - this._currentBodyDepthScale) + this._currentExtrusion
    return Math.max(-this.size.z, composed)
  }

  public get defaultExtrusion(): number {
    return this._prismStates.default.extrusion
  }

  public set defaultExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.default.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get hoveredExtrusion(): number {
    return this._prismStates.hovered.extrusion
  }

  public set hoveredExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.hovered.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get triggeredExtrusion(): number {
    return this._prismStates.triggered.extrusion
  }

  public set triggeredExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.triggered.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get inactiveExtrusion(): number {
    return this._prismStates.inactive.extrusion
  }

  public set inactiveExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.inactive.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledDefaultExtrusion(): number {
    return this._prismStates.toggledDefault.extrusion
  }

  public set toggledDefaultExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledDefault.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledHoveredExtrusion(): number {
    return this._prismStates.toggledHovered.extrusion
  }

  public set toggledHoveredExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledHovered.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledTriggeredExtrusion(): number {
    return this._prismStates.toggledTriggered.extrusion
  }

  public set toggledTriggeredExtrusion(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledTriggered.extrusion = Math.max(0, value)
    this.propagateMaxExtrusion()
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get currentBodyDepthScale(): number {
    return this._currentBodyDepthScale
  }

  public get defaultBodyDepthScale(): number {
    return this._prismStates.default.bodyDepthScale
  }

  public set defaultBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.default.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get hoveredBodyDepthScale(): number {
    return this._prismStates.hovered.bodyDepthScale
  }

  public set hoveredBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.hovered.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get triggeredBodyDepthScale(): number {
    return this._prismStates.triggered.bodyDepthScale
  }

  public set triggeredBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.triggered.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get inactiveBodyDepthScale(): number {
    return this._prismStates.inactive.bodyDepthScale
  }

  public set inactiveBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.inactive.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledDefaultBodyDepthScale(): number {
    return this._prismStates.toggledDefault.bodyDepthScale
  }

  public set toggledDefaultBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledDefault.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledHoveredBodyDepthScale(): number {
    return this._prismStates.toggledHovered.bodyDepthScale
  }

  public set toggledHoveredBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledHovered.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledTriggeredBodyDepthScale(): number {
    return this._prismStates.toggledTriggered.bodyDepthScale
  }

  public set toggledTriggeredBodyDepthScale(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledTriggered.bodyDepthScale = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get currentMatcapRotation(): number {
    return this._currentMatcapRotation
  }

  public get defaultMatcapRotation(): number {
    return this._prismStates.default.matcapRotation
  }

  public set defaultMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.default.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get hoveredMatcapRotation(): number {
    return this._prismStates.hovered.matcapRotation
  }

  public set hoveredMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.hovered.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get triggeredMatcapRotation(): number {
    return this._prismStates.triggered.matcapRotation
  }

  public set triggeredMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.triggered.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get inactiveMatcapRotation(): number {
    return this._prismStates.inactive.matcapRotation
  }

  public set inactiveMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.inactive.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledDefaultMatcapRotation(): number {
    return this._prismStates.toggledDefault.matcapRotation
  }

  public set toggledDefaultMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledDefault.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledHoveredMatcapRotation(): number {
    return this._prismStates.toggledHovered.matcapRotation
  }

  public set toggledHoveredMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledHovered.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledTriggeredMatcapRotation(): number {
    return this._prismStates.toggledTriggered.matcapRotation
  }

  public set toggledTriggeredMatcapRotation(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledTriggered.matcapRotation = value
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get currentOpacity(): number {
    return this._currentOpacity
  }

  public get defaultOpacity(): number {
    return this._prismStates.default.opacity
  }

  public set defaultOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.default.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get hoveredOpacity(): number {
    return this._prismStates.hovered.opacity
  }

  public set hoveredOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.hovered.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get triggeredOpacity(): number {
    return this._prismStates.triggered.opacity
  }

  public set triggeredOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.triggered.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get inactiveOpacity(): number {
    return this._prismStates.inactive.opacity
  }

  public set inactiveOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.inactive.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledDefaultOpacity(): number {
    return this._prismStates.toggledDefault.opacity
  }

  public set toggledDefaultOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledDefault.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledHoveredOpacity(): number {
    return this._prismStates.toggledHovered.opacity
  }

  public set toggledHoveredOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledHovered.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  public get toggledTriggeredOpacity(): number {
    return this._prismStates.toggledTriggered.opacity
  }

  public set toggledTriggeredOpacity(value: number) {
    if (value === undefined) {
      return
    }
    this._prismStates.toggledTriggered.opacity = Math.max(0, Math.min(1, value))
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  // Worst-case forward extrusion across all per-state values, propagated
  // to the owned BeveledPrism so its frustum-cull AABB widens once.
  // Avoids re-sizing the AABB every frame during a tween.
  private propagateMaxExtrusion(): void {
    const max = Math.max(
      this._prismStates.default.extrusion,
      this._prismStates.hovered.extrusion,
      this._prismStates.triggered.extrusion,
      this._prismStates.inactive.extrusion,
      this._prismStates.toggledDefault.extrusion,
      this._prismStates.toggledHovered.extrusion,
      this._prismStates.toggledTriggered.extrusion
    )
    this.beveledPrism.maxFrontExtrusion = max
  }

  public setState(stateName: StateName) {
    super.setState(stateName)
    if (this.initialized) {
      this.updatePrismColors(this._state.prismColors)
      this.updateExtrusion(this._state.extrusion)
      this.updateBodyDepthScale(this._state.bodyDepthScale)
      this.updateMatcapRotation(this._state.matcapRotation)
      this.updateOpacity(this._state.opacity)
    }
  }

  protected updateColors(_targetColor: vec4): void {}

  protected updatePrismColors(targetColors: PrismStateColors) {
    if (!targetColors || !this.shouldColorChange) {
      return
    }
    const initial = this._currentPrismColors
    const remaining = prismColorsDistance(targetColors, initial)
    const full = this.prevState?.prismColors ? prismColorsDistance(targetColors, this.prevState.prismColors) : remaining
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : remaining > 1e-6 ? 1 : 0
    this._prismColorsCancelSet.cancel()
    if (ratio === 0) {
      this._currentPrismColors = targetColors
      this.pushPrismColors(this._currentPrismColors)
      return
    }
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._prismColorsCancelSet,
      update: (t) => {
        this._currentPrismColors = lerpPrismColors(initial, targetColors, t)
        this.pushPrismColors(this._currentPrismColors)
      },
      ended: () => {
        this._currentPrismColors = targetColors
        this.pushPrismColors(this._currentPrismColors)
      }
    })
  }

  private pushPrismColors(c: PrismStateColors) {
    const pass = this.renderMeshVisual.mainPass
    pass.master0 = c.master0
    pass.master1 = c.master1
    pass.master2 = c.master2
    pass.accent0 = c.accent0
    pass.accent1 = c.accent1
    pass.accent2 = c.accent2
    pass.accent3 = c.accent3
  }

  private setCurrentExtrusion(value: number): void {
    const previousExtrusion = this._currentExtrusion
    const previousContentZOffset = this.contentZOffset
    this._currentExtrusion = Math.max(0, value)
    this.beveledPrism.setFrontExtrusion(this.composedFrontExtrusion)
    const nextContentZOffset = this.contentZOffset
    if (Math.abs(nextContentZOffset - previousContentZOffset) > 1e-6) {
      this.notifyContentZOffsetChanged(nextContentZOffset)
    }
    if (Math.abs(this._currentExtrusion - previousExtrusion) > 1e-6) {
      this.notifyColliderBoundsChanged()
    }
  }

  // Mirrors setCurrentExtrusion: bodyDepthScale lives on the same shader
  // uniform via `composedFrontExtrusion`, so a change here recomputes the
  // composed value and pushes it. Content-Z follows the front face too,
  // so we fire the layout event on change. Collider never shrinks below
  // natural depth — bodyDepthScale changes do NOT trigger a collider
  // notify (clamp in colliderSizeOffset keeps it stable).
  private setCurrentBodyDepthScale(value: number): void {
    const previousContentZOffset = this.contentZOffset
    this._currentBodyDepthScale = Math.max(0, Math.min(1, value))
    this.beveledPrism.setFrontExtrusion(this.composedFrontExtrusion)
    const nextContentZOffset = this.contentZOffset
    if (Math.abs(nextContentZOffset - previousContentZOffset) > 1e-6) {
      this.notifyContentZOffsetChanged(nextContentZOffset)
    }
  }

  // Mirrors updatePrismColors: scales transition duration by remaining/full
  // distance so a partial tween that gets re-targeted finishes in proportional
  // time instead of restarting the full animateDuration. Treats undefined as 0.
  protected updateExtrusion(target: number | undefined) {
    const targetValue = Math.max(0, target ?? 0)
    const initial = this._currentExtrusion
    const remaining = Math.abs(targetValue - initial)
    const prevTarget = this.prevState?.extrusion ?? 0
    const full = Math.abs(targetValue - prevTarget)
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : remaining > 1e-6 ? 1 : 0
    this._extrusionCancelSet.cancel()
    if (ratio === 0) {
      this.setCurrentExtrusion(targetValue)
      return
    }
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._extrusionCancelSet,
      update: (t) => {
        this.setCurrentExtrusion(initial + (targetValue - initial) * t)
      },
      ended: () => {
        this.setCurrentExtrusion(targetValue)
      }
    })
  }

  // Mirrors updateExtrusion: tweens the per-state body-depth scale (0..1)
  // and pushes the recomposed shader uniform via setCurrentBodyDepthScale.
  // Undefined target treated as 1 (natural depth) so styles that don't
  // set it keep their full body.
  protected updateBodyDepthScale(target: number | undefined) {
    const targetValue = Math.max(0, Math.min(1, target ?? 1))
    this._bodyDepthScaleCancelSet.cancel()
    // First state application — snap so a freshly-spawned PrismGhost
    // button starts at bodyDepthScale 0 (flat) instead of tweening from
    // the field's initial-value default of 1.
    if (this.prevState === undefined) {
      this.setCurrentBodyDepthScale(targetValue)
      return
    }
    const initial = this._currentBodyDepthScale
    const remaining = Math.abs(targetValue - initial)
    const prevTarget = this.prevState.bodyDepthScale ?? 1
    const full = Math.abs(targetValue - prevTarget)
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : remaining > 1e-6 ? 1 : 0
    if (ratio === 0) {
      this.setCurrentBodyDepthScale(targetValue)
      return
    }
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._bodyDepthScaleCancelSet,
      update: (t) => {
        this.setCurrentBodyDepthScale(initial + (targetValue - initial) * t)
      },
      ended: () => {
        this.setCurrentBodyDepthScale(targetValue)
      }
    })
  }

  // Mirrors updateExtrusion: scales transition duration by remaining/full
  // distance so a partial tween that gets re-targeted finishes in
  // proportional time. Treats undefined as 0.
  //
  // `ease-in-out-sine` mimics a natural spherical/orbital arc — slow at
  // the start and end, smoothest through the middle. Reads as the matcap
  // drifting around the surface rather than stepping into place.
  protected updateMatcapRotation(target: number | undefined) {
    const targetValue = target ?? 0
    const initial = this._currentMatcapRotation
    const remaining = Math.abs(targetValue - initial)
    const prevTarget = this.prevState?.matcapRotation ?? 0
    const full = Math.abs(targetValue - prevTarget)
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : remaining > 1e-6 ? 1 : 0
    this._matcapRotationCancelSet.cancel()
    if (ratio === 0) {
      this._currentMatcapRotation = targetValue
      this.beveledPrism.setMatcapRotation(this._currentMatcapRotation)
      return
    }
    animate({
      duration: ratio * this.animateDuration,
      easing: "ease-in-out-sine",
      cancelSet: this._matcapRotationCancelSet,
      update: (t) => {
        this._currentMatcapRotation = initial + (targetValue - initial) * t
        this.beveledPrism.setMatcapRotation(this._currentMatcapRotation)
      },
      ended: () => {
        this._currentMatcapRotation = targetValue
        this.beveledPrism.setMatcapRotation(this._currentMatcapRotation)
      }
    })
  }

  // Mirrors updateExtrusion: scales transition duration by remaining/full
  // distance so a re-targeted tween finishes in proportional time.
  // Undefined target treated as 1 (fully opaque) so styles that don't
  // set opacity stay opaque.
  //
  // Asymmetric show/hide cadence so PrismGhost feels right:
  //   - Show: snappy fade-in (ease-out-quart) at the base animate
  //     duration — opacity climbs quickly at the start of hover.
  //   - Hide: lingering fade-out (ease-in-quart) at HIDE_DURATION_SCALE×
  //     the base duration — the ghost stays visible a beat after exit.
  // Extrusion keeps its own neutral tween, so geometry and opacity
  // intentionally desync.
  protected updateOpacity(target: number | undefined) {
    const targetValue = Math.max(0, Math.min(1, target ?? 1))
    this._opacityCancelSet.cancel()
    // First state application — snap so a freshly-spawned PrismGhost
    // button starts at opacity 0 instead of tweening from the field's
    // initial-value default of 1.
    if (this.prevState === undefined) {
      this._currentOpacity = targetValue
      this.applyEffectiveOpacity()
      return
    }
    const initial = this._currentOpacity
    const remaining = Math.abs(targetValue - initial)
    const prevTarget = this.prevState.opacity ?? 1
    const full = Math.abs(targetValue - prevTarget)
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : remaining > 1e-6 ? 1 : 0
    if (ratio === 0) {
      this._currentOpacity = targetValue
      this.applyEffectiveOpacity()
      return
    }
    const isShow = targetValue >= initial
    const directionDuration = isShow
      ? this.animateDuration
      : this.animateDuration * BeveledPrismVisual.HIDE_DURATION_SCALE
    animate({
      duration: ratio * directionDuration,
      easing: isShow ? "ease-out-quart" : "ease-in-quart",
      cancelSet: this._opacityCancelSet,
      update: (t) => {
        this._currentOpacity = initial + (targetValue - initial) * t
        this.applyEffectiveOpacity()
      },
      ended: () => {
        this._currentOpacity = targetValue
        this.applyEffectiveOpacity()
      }
    })
  }

  // Per-frame: read the active interactor's hit point, project to the
  // button's local XY, scale by sensitivity, then time-domain lerp toward
  // the target so motion is smooth. When no interactor is hovering, the
  // target collapses to (0,0); once `current` falls inside the fade
  // epsilon, the loop disables itself so idle buttons cost nothing.
  //
  // Frame-rate-aware lerp via `1 - exp(-dt/TC)`: at any framerate, the
  // half-life of the smoothing is constant — no jitter at high fps, no
  // sluggishness at low fps.
  private updateCursorOffset(): void {
    // Set iteration is insertion order, so `.values().next().value` gives
    // us the first interactor that entered and is still hovering — stable
    // first-in/last-out tracking through multi-interactor scenarios.
    const interactor: Interactor | undefined = this._currentInteractors.values().next().value
    if (interactor) {
      const hitWS = interactor.targetHitPosition
      if (hitWS) {
        const local = this._transform.getInvertedWorldTransform().multiplyPoint(hitWS)
        const sx = this.size.x > 1e-5 ? local.x / this.size.x : 0
        const sy = this.size.y > 1e-5 ? local.y / this.size.y : 0
        // Negative sign: the matcap reflection chain (view → reflect →
        // sphere-project) inverts XY relative to the surface — a fragment
        // on the +X side of the button samples a -X-of-center matcap UV.
        // To make the bright spot appear UNDER the cursor, we shift the
        // matcap UV in the OPPOSITE direction of the cursor's local XY.
        const k = -BeveledPrismVisual.CURSOR_SENSITIVITY
        // sx/sy are naturally in [-0.5, 0.5] for a hit on the face;
        // clamp guards against the rare extrapolation past the edge.
        this._targetCursorOffset.x = Math.max(-0.5, Math.min(0.5, sx)) * k
        this._targetCursorOffset.y = Math.max(-0.5, Math.min(0.5, sy)) * k
      }
    } else {
      this._targetCursorOffset.x = 0
      this._targetCursorOffset.y = 0
    }

    const dt = getDeltaTime()
    const t = 1 - Math.exp(-dt / BeveledPrismVisual.CURSOR_SMOOTHING_TC)
    this._currentCursorOffset.x += (this._targetCursorOffset.x - this._currentCursorOffset.x) * t
    this._currentCursorOffset.y += (this._targetCursorOffset.y - this._currentCursorOffset.y) * t

    this.beveledPrism.setCursorOffset(this._currentCursorOffset)

    if (this._currentInteractors.size === 0) {
      const dx = this._currentCursorOffset.x
      const dy = this._currentCursorOffset.y
      if (dx * dx + dy * dy < BeveledPrismVisual.CURSOR_FADE_EPSILON_SQ) {
        this._currentCursorOffset.x = 0
        this._currentCursorOffset.y = 0
        this.beveledPrism.setCursorOffset(this._currentCursorOffset)
        if (this._cursorUpdateEvent) {
          this._cursorUpdateEvent.enabled = false
        }
      }
    }
  }

  protected applyStyleParameters(parameters: Partial<BeveledPrismVisualParameters>) {
    super.applyStyleParameters(parameters)
    this.applyStyleProperty<Partial<BeveledPrismVisualParameters>, BeveledPrismVisualState, PrismStateColors>(
      parameters,
      "prismColors",
      {
        default: (value) => (this.defaultPrismColors = value),
        hovered: (value) => (this.hoveredPrismColors = value),
        triggered: (value) => (this.triggeredPrismColors = value),
        inactive: (value) => (this.inactivePrismColors = value),
        toggledDefault: (value) => (this.toggledDefaultPrismColors = value),
        toggledHovered: (value) => (this.toggledHoveredPrismColors = value),
        toggledTriggered: (value) => (this.toggledTriggeredPrismColors = value)
      }
    )

    this.applyStyleProperty<Partial<BeveledPrismVisualParameters>, BeveledPrismVisualState, number>(
      parameters,
      "extrusion",
      {
        default: (value) => (this.defaultExtrusion = value),
        hovered: (value) => (this.hoveredExtrusion = value),
        triggered: (value) => (this.triggeredExtrusion = value),
        inactive: (value) => (this.inactiveExtrusion = value),
        toggledDefault: (value) => (this.toggledDefaultExtrusion = value),
        toggledHovered: (value) => (this.toggledHoveredExtrusion = value),
        toggledTriggered: (value) => (this.toggledTriggeredExtrusion = value)
      }
    )

    this.applyStyleProperty<Partial<BeveledPrismVisualParameters>, BeveledPrismVisualState, number>(
      parameters,
      "bodyDepthScale",
      {
        default: (value) => (this.defaultBodyDepthScale = value),
        hovered: (value) => (this.hoveredBodyDepthScale = value),
        triggered: (value) => (this.triggeredBodyDepthScale = value),
        inactive: (value) => (this.inactiveBodyDepthScale = value),
        toggledDefault: (value) => (this.toggledDefaultBodyDepthScale = value),
        toggledHovered: (value) => (this.toggledHoveredBodyDepthScale = value),
        toggledTriggered: (value) => (this.toggledTriggeredBodyDepthScale = value)
      }
    )

    this.applyStyleProperty<Partial<BeveledPrismVisualParameters>, BeveledPrismVisualState, number>(
      parameters,
      "matcapRotation",
      {
        default: (value) => (this.defaultMatcapRotation = value),
        hovered: (value) => (this.hoveredMatcapRotation = value),
        triggered: (value) => (this.triggeredMatcapRotation = value),
        inactive: (value) => (this.inactiveMatcapRotation = value),
        toggledDefault: (value) => (this.toggledDefaultMatcapRotation = value),
        toggledHovered: (value) => (this.toggledHoveredMatcapRotation = value),
        toggledTriggered: (value) => (this.toggledTriggeredMatcapRotation = value)
      }
    )

    this.applyStyleProperty<Partial<BeveledPrismVisualParameters>, BeveledPrismVisualState, number>(
      parameters,
      "opacity",
      {
        default: (value) => (this.defaultOpacity = value),
        hovered: (value) => (this.hoveredOpacity = value),
        triggered: (value) => (this.triggeredOpacity = value),
        inactive: (value) => (this.inactiveOpacity = value),
        toggledDefault: (value) => (this.toggledDefaultOpacity = value),
        toggledHovered: (value) => (this.toggledHoveredOpacity = value),
        toggledTriggered: (value) => (this.toggledTriggeredOpacity = value)
      }
    )

    // One-shot geometry: pull bevelRadius / cornerRadius from default. Not
    // state-driven — applied once at theme load and on subsequent style swaps.
    const bevel = parameters.default?.bevelRadius
    if (bevel !== undefined) {
      this.bevelRadius = bevel
    }
    const corner = parameters.default?.cornerRadius
    if (corner !== undefined) {
      this.cornerRadius = corner
    }
  }

  protected updateVisualStates(): void {
    this._beveledPrismVisualStates = new Map([
      [
        StateName.default,
        {
          baseColor: this.baseDefaultColor,
          prismColors: this.defaultPrismColors,
          extrusion: this._prismStates.default.extrusion,
          bodyDepthScale: this._prismStates.default.bodyDepthScale,
          matcapRotation: this._prismStates.default.matcapRotation,
          opacity: this._prismStates.default.opacity,
          shouldPosition: this.defaultShouldPosition,
          shouldScale: this.defaultShouldScale,
          localScale: this.defaultScale,
          localPosition: this.defaultPosition
        }
      ],
      [
        StateName.hovered,
        {
          baseColor: this.baseHoveredColor,
          prismColors: this.hoveredPrismColors,
          extrusion: this._prismStates.hovered.extrusion,
          bodyDepthScale: this._prismStates.hovered.bodyDepthScale,
          matcapRotation: this._prismStates.hovered.matcapRotation,
          opacity: this._prismStates.hovered.opacity,
          shouldPosition: this.hoveredShouldPosition,
          shouldScale: this.hoveredShouldScale,
          localScale: this.hoveredScale,
          localPosition: this.hoveredPosition
        }
      ],
      [
        StateName.triggered,
        {
          baseColor: this.baseTriggeredColor,
          prismColors: this.triggeredPrismColors,
          extrusion: this._prismStates.triggered.extrusion,
          bodyDepthScale: this._prismStates.triggered.bodyDepthScale,
          matcapRotation: this._prismStates.triggered.matcapRotation,
          opacity: this._prismStates.triggered.opacity,
          shouldPosition: this.triggeredShouldPosition,
          shouldScale: this.triggeredShouldScale,
          localScale: this.triggeredScale,
          localPosition: this.triggeredPosition
        }
      ],
      [
        StateName.toggledDefault,
        {
          baseColor: this.baseToggledDefaultColor,
          prismColors: this.toggledDefaultPrismColors,
          extrusion: this._prismStates.toggledDefault.extrusion,
          bodyDepthScale: this._prismStates.toggledDefault.bodyDepthScale,
          matcapRotation: this._prismStates.toggledDefault.matcapRotation,
          opacity: this._prismStates.toggledDefault.opacity,
          shouldPosition: this.toggledDefaultShouldPosition,
          shouldScale: this.toggledDefaultShouldScale,
          localScale: this.toggledScale,
          localPosition: this.toggledPosition
        }
      ],
      [
        StateName.toggledHovered,
        {
          baseColor: this.baseToggledHoveredColor,
          prismColors: this.toggledHoveredPrismColors,
          extrusion: this._prismStates.toggledHovered.extrusion,
          bodyDepthScale: this._prismStates.toggledHovered.bodyDepthScale,
          matcapRotation: this._prismStates.toggledHovered.matcapRotation,
          opacity: this._prismStates.toggledHovered.opacity,
          shouldPosition: this.toggledHoveredShouldPosition,
          shouldScale: this.toggledHoveredShouldScale,
          localScale: this.toggledHoveredScale,
          localPosition: this.toggledHoveredPosition
        }
      ],
      [
        StateName.toggledTriggered,
        {
          baseColor: this.baseToggledTriggeredColor,
          prismColors: this.toggledTriggeredPrismColors,
          extrusion: this._prismStates.toggledTriggered.extrusion,
          bodyDepthScale: this._prismStates.toggledTriggered.bodyDepthScale,
          matcapRotation: this._prismStates.toggledTriggered.matcapRotation,
          opacity: this._prismStates.toggledTriggered.opacity,
          shouldPosition: this.toggledTriggeredShouldPosition,
          shouldScale: this.toggledTriggeredShouldScale,
          localScale: this.toggledTriggeredScale,
          localPosition: this.toggledTriggeredPosition
        }
      ],
      [
        StateName.error,
        {
          baseColor: this.baseErrorColor,
          prismColors: this.defaultPrismColors,
          extrusion: this._prismStates.default.extrusion,
          bodyDepthScale: this._prismStates.default.bodyDepthScale,
          matcapRotation: this._prismStates.default.matcapRotation,
          opacity: this._prismStates.default.opacity,
          shouldPosition: this.defaultShouldPosition,
          shouldScale: this.defaultShouldScale,
          localScale: this.errorScale,
          localPosition: this.errorPosition
        }
      ],
      [
        StateName.errorHovered,
        {
          baseColor: this.baseErrorColor,
          prismColors: this.hoveredPrismColors,
          extrusion: this._prismStates.hovered.extrusion,
          bodyDepthScale: this._prismStates.hovered.bodyDepthScale,
          matcapRotation: this._prismStates.hovered.matcapRotation,
          opacity: this._prismStates.hovered.opacity,
          shouldPosition: this.hoveredShouldPosition,
          shouldScale: this.hoveredShouldScale,
          localScale: this.hoveredScale,
          localPosition: this.errorPosition
        }
      ],
      [
        StateName.inactive,
        {
          baseColor: this.baseInactiveColor,
          prismColors: this.inactivePrismColors,
          extrusion: this._prismStates.inactive.extrusion,
          bodyDepthScale: this._prismStates.inactive.bodyDepthScale,
          matcapRotation: this._prismStates.inactive.matcapRotation,
          opacity: this._prismStates.inactive.opacity,
          shouldPosition: this.inactiveShouldPosition,
          shouldScale: this.inactiveShouldScale,
          localScale: this.inactiveScale,
          localPosition: this.inactivePosition
        }
      ]
    ])
    super.updateVisualStates()
  }

  private get beveledPrism(): BeveledPrism {
    return this._visualComponent as BeveledPrism
  }

  private set beveledPrism(value: BeveledPrism) {
    this._visualComponent = value
  }
}
