import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import {lerp} from "SpectaclesInteractionKit.lspkg/Utils/mathUtils"
import {ProgressBarFillGreen, RadioFillGray} from "../../Themes/SnapOS-3.0/Colors"
import {RoundedRectangle} from "../../Visuals/RoundedRectangle/RoundedRectangle"
import {FrameAppearanceConfig, FrameVisual} from "./FrameVisual"

const PANEL_BODY_COLOR = RadioFillGray
const PANEL_HOVER_BORDER_COLOR = ProgressBarFillGreen
const HOVER_FADE_DURATION_S = 0.3
// Panel uses a tighter corner radius than the classic frame — the simpler
// solid body reads better at small radii.
const CORNER_RADIUS_SCALE = 0.5
// Buttons sit below the top edge of the frame rather than flush with it
// (per the SnapOS 3.0 design mocks).
const BUTTON_TOP_OFFSET = 1.5
// Prism close-button depth. ButtonHandler creates and resizes the button
// using this, and getButtonAnchor("close", …) returns half of this plus a
// small nudge on z so the back face sits just forward of the frame body's
// front plane (avoids z-fighting on Spectacles).
export const PANEL_CLOSE_BUTTON_DEPTH = 0.8
const CLOSE_BUTTON_Z_NUDGE = 0.1
// Local z for the right drawer, behind the frame body so the body occludes
// the drawer when it's parked at its hidden anchor.
const DRAWER_LOCAL_Z = -0.5

/**
 * The SnapOS 3.0 Frame visual: a solid-color rounded body backed by the
 * default CollapsedSquircle material. Colors come directly from the
 * SnapOS-3.0 FrameParameters — this visual is not theme-switchable.
 *
 * No cursor highlight, no grab-zone shader, no dots pattern. A subtle border
 * fades in on hover, driven by the 0..1 hover-intensity scalar Frame already
 * animates. Buttons are anchored OUTSIDE the frame body — Close on the left,
 * Follow on the right.
 *
 * Owns its SceneObject + RoundedRectangle component lifecycle.
 */
export class FramePanelVisual implements FrameVisual {
  private _sceneObject: SceneObject | null = null
  private _rr: RoundedRectangle | null = null
  private _hoverIntensity: number = 0
  private _hoverFadeCancel: CancelSet = new CancelSet()

  // ─── Lifecycle ──────────────────────────────────────────────────────

  public initialize(parent: SceneObject, layer?: LayerSet): SceneObject {
    this._sceneObject = global.scene.createSceneObject("FramePanelObject")
    if (layer !== undefined) {
      this._sceneObject.layer = layer
    }
    this._sceneObject.setParent(parent)

    this._rr = this._sceneObject.createComponent(RoundedRectangle.getTypeName())
    this._rr.initialize()
    this._rr.cornerRadius = 2.25
    this._rr.backgroundColor = PANEL_BODY_COLOR
    // Enable border once (sets _border=true and borderSize without tripping
    // the `enabled=false` side effect that clobbers borderSize). After this
    // we toggle render on/off via mainPass.border directly so borderSize
    // survives hover exits.
    this._rr.border = true
    this._rr.borderSize = 0.25
    this._rr.borderColor = PANEL_BODY_COLOR
    this._rr.renderMeshVisual.mainPass.border = 0
    this._rr.renderMeshVisual.mainPass.blendMode = BlendMode.PremultipliedAlphaAuto
    this._rr.renderMeshVisual.mainPass.twoSided = true

    return this._sceneObject
  }

  public destroy(): void {
    this._hoverFadeCancel.cancel()
    if (!isNull(this._sceneObject) && this._sceneObject) {
      this._sceneObject.destroy()
    }
    this._rr = null
    this._sceneObject = null
  }

  // ─── Geometry ───────────────────────────────────────────────────────

  public setSize(size: vec2): void {
    if (this._rr) this._rr.size = size
  }

  public get cornerRadius(): number {
    return this._rr?.cornerRadius ?? 0
  }

  // ─── Appearance ─────────────────────────────────────────────────────

  public applyAppearance(config: FrameAppearanceConfig): void {
    if (!this._rr) return
    this._rr.cornerRadius = config.cornerRadius * CORNER_RADIUS_SCALE
    this._rr.borderSize = config.borderSize
  }

  public setCornerRadius(radius: number): void {
    if (this._rr) this._rr.cornerRadius = radius
  }

  // ─── Visibility / Opacity ───────────────────────────────────────────

  public setEnabled(enabled: boolean): void {
    if (this._rr) this._rr.renderMeshVisual.enabled = enabled
  }

  public setOpacity(opacity: number): void {
    // Frame.ts decides whether to actually drive this — for SnapOS3 the body
    // fades only when autoShowHide is on. When autoShowHide is off the
    // setter is simply never called from the show/hide tween, so the body
    // stays at full opacity.
    if (this._rr) this._rr.opacity = opacity
  }

  // ─── Render Order ───────────────────────────────────────────────────

  public getRenderOrder(): number {
    return this._rr?.renderMeshVisual.getRenderOrder() ?? 0
  }

  public setRenderOrder(order: number): void {
    if (this._rr) this._rr.renderMeshVisual.setRenderOrder(order)
  }

  // ─── Frustum Culling ────────────────────────────────────────────────

  public setFrustumCullBounds(min: vec3, max: vec3): void {
    if (!this._rr) return
    const pass = this._rr.renderMeshVisual.mainMaterial.mainPass
    pass.frustumCullMin = min
    pass.frustumCullMax = max
  }

  // ─── Interaction Feedback ───────────────────────────────────────────

  public setHoverIntensity(_value: number): void {
    // no-op: Panel uses setFrameHovered for its border fade, not the
    // margin-specific cursor proximity scalar.
  }

  public setFrameHovered(hovered: boolean): void {
    if (!this._rr) return
    this._hoverFadeCancel.cancel()
    const target = hovered ? 1 : 0
    const start = this._hoverIntensity
    const pass = this._rr.renderMeshVisual.mainPass
    if (hovered) pass.border = 1
    animate({
      duration: HOVER_FADE_DURATION_S,
      cancelSet: this._hoverFadeCancel,
      update: (t: number) => {
        this._hoverIntensity = lerp(start, target, t)
        if (this._rr) {
          this._rr.borderColor = vec4.lerp(PANEL_BODY_COLOR, PANEL_HOVER_BORDER_COLOR, this._hoverIntensity)
        }
      },
      ended: () => {
        if (!hovered && this._rr) {
          this._rr.renderMeshVisual.mainPass.border = 0
        }
      }
    })
  }

  public setActiveState(_isActive: boolean, _borderColor: vec4): void {
    // Hook point for SnapOS 3.0 active/pinch feedback. Intentionally empty —
    // the hover fade alone carries interaction feedback for now.
  }

  public setCursorPosition(_position: vec2): void {
    // no-op: Panel has no cursor highlight
  }

  public setCursorRadiusFactor(_factor: number): void {
    // no-op: Panel has no cursor highlight
  }

  public setGlowOpacityFactor(_factor: number): void {
    // no-op: Panel has no glow
  }

  // ─── Margin / Interaction Regions ──────────────────────────────────

  public setFrameMargin(_margin: number): void {
    // no-op: margin is interaction-only on Panel; no shader uniform to drive
  }

  public setBorderOnly(_borderOnly: boolean): void {
    // no-op: Panel has no border-only render mode
  }

  public setCutOutCenter(cutOut: boolean): void {
    // TODO(follow-up PR): wire transparent-center support for SnapOS3.
    // The classic visual has a `cutOutCenter` shader uniform; the panel
    // body uses a plain RoundedRectangle material that lacks one. Adding
    // it requires either a new shader pass or extending RoundedRectangle's
    // shader to support a hole.
    //
    // Until then, consumers that need a transparent frame center (e.g.
    // WebView-backed frames in SnappyWeb) should explicitly set the
    // theme to SnapOS2. Warn loudly so the gap isn't a silent regression
    // when migrating to SnapOS3.
    if (cutOut) {
      print(
        "[FramePanelVisual] cutOutCenter is not supported on SnapOS3 frames; the body stays solid. " +
          'Set _themeOverride to "SnapOS2" if the frame needs a transparent center.'
      )
    }
  }

  // ─── Grab Zones ─────────────────────────────────────────────────────

  public setGrabZones(_zones: vec4[]): void {
    // no-op: Panel does not highlight grab zones
  }

  // ─── Button Layout ──────────────────────────────────────────────────

  public getButtonAnchor(type: "close" | "follow", totalSize: vec2, buttonSize: number, _offset: number): vec3 {
    // Center each button on the frame's vertical edge so it half-overlaps
    // the frame body (SnapOS 3.0 look). Classic visual stays inset. z is
    // half the Prism depth plus CLOSE_BUTTON_Z_NUDGE so the back face sits
    // just in front of the frame body's front plane (z=0) rather than
    // coplanar with it — coplanar faces z-fight on Spectacles.
    const topY = totalSize.y * 0.5 - buttonSize * 0.5 - BUTTON_TOP_OFFSET
    const x = type === "close" ? -totalSize.x * 0.5 : totalSize.x * 0.5
    return new vec3(x, topY, PANEL_CLOSE_BUTTON_DEPTH * 0.5 + CLOSE_BUTTON_Z_NUDGE)
  }

  public getRightDrawerAnchor(totalSize: vec2, drawerWidth: number, _offset: number): vec3 {
    // Drawer left edge sits flush with the frame's right edge (no overlap).
    // Top edge aligns with where today's follow button top sat.
    const drawerTopY = totalSize.y * 0.5 - BUTTON_TOP_OFFSET
    return new vec3(totalSize.x * 0.5 + drawerWidth * 0.5, drawerTopY, DRAWER_LOCAL_Z)
  }
}
