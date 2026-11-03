import {Billboard} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Billboard/Billboard"
import {
  Interactable,
  TargetingVisual
} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {InteractionPlane} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractionPlane/InteractionPlane"
import {
  CursorMode,
  InteractorCursor
} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractorCursor/InteractorCursor"
import {FieldTargetingMode, HandInteractor} from "SpectaclesInteractionKit.lspkg/Core/HandInteractor/HandInteractor"
import {Interactor, InteractorInputType, TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {CursorControllerProvider} from "SpectaclesInteractionKit.lspkg/Providers/CursorControllerProvider/CursorControllerProvider"
import animate, {CancelSet, easingFunctions} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import Event, {PublicApi, unsubscribe} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {clamp, lerp} from "SpectaclesInteractionKit.lspkg/Utils/mathUtils"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {ThemeService} from "../../Themes/ThemeService"
// Side-effect import — register UIKit Layout2D handlers. Frame doesn't
// extend Element, so it needs its own bootstrap reference.
import "../../UIKitBootstrap"
import {RoundedRectangle} from "../../Visuals/RoundedRectangle/RoundedRectangle"
import {Button} from "../Button/Button"
import {ElementContent} from "../Content/ElementContent"
import {Layoutable} from "../Layout2D/Layoutable"
import {UIKitBrands} from "../Layout2D/UIKitBrands"
import {FrameConstants, FrameConstantsType} from "./FrameConstants"
import {FramePanelVisual} from "./FramePanelVisual"
import {FrameRoundedRectVisual} from "./FrameRoundedRectVisual"
import {FrameVisual} from "./FrameVisual"
import ButtonHandler from "./modules/ButtonHandler"
import HoverBehavior from "./modules/HoverBehavior"
import RightDrawer from "./modules/RightDrawer"
import SmoothFollow from "./modules/SmoothFollow"
import SnappingHandler from "./modules/SnappingHandler"
import TagAlong from "./modules/TagAlong"

const FRAME_FOLLOW_ICON: Texture = requireAsset("../../../Textures/follow-white.png") as Texture

export type InputState = {
  hovered: boolean
  hierarchyHovered: boolean
  pinching: boolean
  position: vec3
  innerInteractableActive: boolean
}

export enum FrameAppearance {
  "Large" = "Large",
  "Small" = "Small"
}

const enum InputMode {
  Auto,
  ScaleTopLeft,
  ScaleBottomRight,
  ScaleTopRight,
  ScaleBottomLeft,
  Translating
}

type HitPosition = {
  localPosition: vec2
  normalizedPosition: vec2
}

const DEBUG_DRAW = false
const marginDebugColor = new vec4(0, 1, 1, 1)
const debugRed = new vec4(1, 0, 0, 1)

// Constants for the frame glow in near field interaction
const MINIMUM_CURSOR_RADIUS_FACTOR = 0.3
const LERP_CURSOR_RADIUS_FACTOR = 1 - MINIMUM_CURSOR_RADIUS_FACTOR

/**
 * @module Frame
 *
 * @description Frame component that provides a customizable UI frame with interaction capabilities.
 * It supports features like resizing, moving, billboarding, snapping, and interaction with buttons.
 * It can also follow the user's view and has options for hover behavior and interaction plane.
 */
@component
export class Frame extends BaseScriptComponent implements Layoutable {
  /**
   * Type brand consumed by the Layout2D `ElementHandler` finder. Frame is
   * `Layoutable` but doesn't extend Element, so the brand is declared
   * directly. See `Components/Layout2D/UIKitBrands.ts`.
   */
  public readonly __uikitBrand = UIKitBrands.Element

  @input
  @label("Theme")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Inherited", "Inherited"),
      new ComboBoxItem("SnapOS2", "SnapOS2"),
      new ComboBoxItem("SnapOS3", "SnapOS3")
    ])
  )
  private _themeOverride: string = "Inherited"

  private resolveTheme() {
    const mgr = ThemeService.getInstance()
    const override = this._themeOverride === "Default" ? "Inherited" : this._themeOverride
    return override !== "Inherited" ? (mgr.getTheme(override) ?? mgr.currentTheme) : mgr.currentTheme
  }

  private _cachedFrameParams: FrameConstantsType | null = null
  private getFrameParams(): FrameConstantsType {
    if (this._cachedFrameParams) return this._cachedFrameParams
    // Shallow-merge theme overrides onto defaults so themes can supply a subset
    // (e.g. only colors) without having to replicate the full FrameConstants shape.
    const themeData = this.resolveTheme().componentData?.["Frame"] as Partial<FrameConstantsType> | undefined
    this._cachedFrameParams = {...FrameConstants, ...(themeData ?? {})}
    return this._cachedFrameParams
  }

  /** Factory — select the visual implementation based on the effective theme. */
  private createFrameVisual(): FrameVisual {
    if (this.resolveTheme().name === "SnapOS3") {
      this.autoShowHide = false // see `autoShowHide` JSDoc for rationale
      return new FramePanelVisual()
    }
    return new FrameRoundedRectVisual(this.getFrameParams())
  }

  /**
   * When enabled, the frame automatically appears when hovered and hides when
   * not being interacted with. Disable to manually control frame visibility.
   *
   * SnapOS3 frames force this to `false` at init — the panel body stays
   * opaque and the drawer pops on hover via the drawer slide instead of
   * the classic full-frame fade. Set `frame.autoShowHide = true` after
   * init to opt into the classic body-fade behavior on a SnapOS3 frame
   * alongside the drawer slide.
   */
  @ui.group_start("Frame Settings")
  @hint("Controls the appearance, size, and interaction behavior of the frame.")
  @input
  @showIf("_themeOverride", "SnapOS2")
  @hint(
    "When enabled, the frame automatically appears when hovered and hides when not being interacted with. Disable \
to manually control frame visibility."
  )
  public autoShowHide: boolean = true

  @input
  @showIf("_themeOverride", "SnapOS2")
  @widget(new ComboBoxWidget([new ComboBoxItem("Large", "Large"), new ComboBoxItem("Small", "Small")]))
  @hint(
    "Preset appearance configurations for the frame. <br><br> <code>Large</code> is useful for <i>far-field</i> interactons. <br><br> While, <code>Small</code> is useful for <i>near-field</i> interactions"
  )
  private _appearance: string = FrameAppearance.Large
  public get appearance(): string {
    // LS may overwrite the field initializer with an empty/missing scene
    // value when the @input is freshly added; guard against an unknown
    // appearance so downstream consumers (drawer settings, button handler)
    // get a valid Record key.
    if (this._appearance === FrameAppearance.Large || this._appearance === FrameAppearance.Small) {
      return this._appearance
    }
    return FrameAppearance.Large
  }
  public set appearance(appearance: FrameAppearance) {
    this._appearance = appearance
    const config = this.getFrameParams().appearances[appearance]
    if (config) {
      this.margin = config.margin
      this._frameVisual.applyAppearance(config)
      // Re-apply any custom corner radius so it survives appearance changes.
      if (this._customCornerRadius !== null) {
        this._frameVisual.setCornerRadius(this._customCornerRadius)
      }
      // Refresh the snap ghost to track the now-current applied radius
      // (covers both the customized and the appearance-default paths).
      this.snappingHandler?.setGhostCornerRadius(this.cornerRadius)
      this._buttonHandler.resize()
      this._rightDrawer.resize()
    }
    this.scaleFrame(true)
  }

  @input("vec2", "{32,32}")
  @hint("Size of the frames's inner content area. In local space centimeters.")
  private _innerSize: vec2 = new vec2(32, 32)
  /**
   * Size of the frames's inner content area.
   */
  public get innerSize(): vec2 {
    return this._innerSize
  }
  /**
   * Sets the inner content area size. If the new size has a different aspect ratio than the current
   * scale baseline, call {@link syncScaleBaseline} afterwards so interactive scaling computes
   * correct uniform scale factors relative to the new size.
   */
  public set innerSize(size: vec2) {
    this._innerSize = size
    this.scaleFrame(true)
  }

  @input("vec2", "{0,0}")
  @hint(
    "Extra padding that maintains a fixed size in centimeters regardless of frame scaling, useful for toolbars and \
fixed-size UI elements. In local space centimeters."
  )
  private _padding: vec2 = new vec2(0, 0)
  /**
   * Extra padding that maintains a fixed size in centimeters regardless of frame scaling, useful for toolbars and
   * fixed-size UI elements
   */
  public get padding(): vec2 {
    return this._padding
  }
  public set padding(padding: vec2) {
    this._padding = padding
    this.scaleFrame(true)
  }
  /**
   * Enables interactive scaling of the frame via corner handles.
   */
  @input
  @hint("Enables interactive scaling of the frame via corner handles.")
  private _allowScaling: boolean = true
  /**
   * Allows the container to scale width and height independently.
   * When enabled, scaling is non-uniform and each axis is clamped
   * to its configured min/max size limits.
   */
  @input
  @hint("Allows independent width/height scaling, clamped to min/max sizes.")
  @showIf("allowScaling")
  public allowNonUniformScaling: boolean = false
  /**
   * Automatically scales child content when the frame is resized to maintain proportions.
   */
  @input
  @hint("Automatically scales child content when the frame is resized to maintain proportions.")
  public autoScaleContent: boolean = true
  /**
   * When enabled, Z-axis scaling of content will match X-axis scaling during frame resizing.
   */
  @input
  @hint("When enabled, Z-axis scaling of content will match X-axis scaling during frame resizing.")
  public relativeZ: boolean = true
  /**
   * When enabled, allows interaction with content inside the frame and hides the frames's glow for visual
   * clarity.
   */
  @input
  @hint("When enabled, only the margin is interactive for controlling the frame.")
  private _onlyInteractOnMargin: boolean = false
  /**
   * Enables moving the frame.
   */
  @input
  @hint("Enables moving the frame.")
  public allowTranslation: boolean = true
  /**
   * When enabled, creates a transparent center in the frame, allowing content behind the frame to be visible.
   */
  @input
  @hint("When enabled, creates a transparent center in the frame, allowing content behind the frame to be visible.")
  private _cutOutCenter: boolean = false
  public get cutOutCenter(): boolean {
    return this._cutOutCenter
  }
  public set cutOutCenter(cutOut: boolean) {
    this._cutOutCenter = cutOut
    this._frameVisual.setCutOutCenter(this._cutOutCenter)
  }
  @ui.group_end
  @ui.label("")
  @ui.group_start("Min/Max Size")
  @hint("Sets the minimum and maximum dimensions that the frame can be resized to.")
  /**
   * Minimum dimensions that the frame can be resized to. In local space centimeters.
   */
  @input("vec2", "{10,10}")
  @hint("Minimum dimensions that the frame can be resized to. In local space centimeters.")
  private _minimumSize: vec2 = new vec2(10, 10)
  /**
   * Maximum dimensions that the frame can be resized to. In local space centimeters.
   */
  @input("vec2", "{150,150}")
  @hint("Maximum dimensions that the frame can be resized to. In local space centimeters.")
  private _maximumSize: vec2 = new vec2(150, 150)
  @ui.group_end
  @ui.label("")
  @ui.group_start("Billboarding")
  @hint("Controls how the frame automatically rotates to face the camera/user.")
  /**
   * Enables the frame to automatically rotate to face the camera/user.
   */
  @input
  @hint("Enables the frame to automatically rotate to face the camera/user.")
  private useBillboarding: boolean = true
  /**
   * When enabled, the frame rotates around the X-axis to face the user, but only during movement/translation
   * unless xAlways is also enabled.
   */
  @input
  @showIf("useBillboarding")
  @hint(
    "When enabled, the frame rotates around the X-axis to face the user, but only during movement/translation \
unless xAlways is also enabled."
  )
  private xOnTranslate: boolean = true
  /**
   * When enabled, the frame continuously rotates around the X-axis to face the user, regardless of movement.
   */
  @input
  @showIf("xOnTranslate")
  @hint("When enabled, the frame continuously rotates around the X-axis to face the user, regardless of movement.")
  private xAlways: boolean = false
  /**
   * A buffered degrees (both positive and negative) on the x-axis before the frame billboards to face the user.
   */
  @input
  @showIf("xAlways")
  @hint("A buffered degrees on the x-axis before the frame billboards to face the user.")
  private xBufferDegrees: number = 0
  /**
   * When enabled, the frame rotates around the Y-axis to face the user, but only during movement/translation
   * unless yAlways is also enabled.
   */
  @input
  @showIf("useBillboarding")
  @hint(
    "When enabled, the frame rotates around the Y-axis to face the user, but only during movement/translation \
unless yAlways is also enabled."
  )
  private yOnTranslate: boolean = true
  /**
   * When enabled, the frame continuously rotates around the Y-axis to face the user, regardless of movement.
   */
  @input
  @showIf("yOnTranslate")
  @hint("When enabled, the frame continuously rotates around the Y-axis to face the user, regardless of movement.")
  private yAlways: boolean = false
  /**
   * A buffered degrees (both positive and negative) on the y-axis before the frame billboards to face the user.
   */
  @input
  @showIf("yAlways")
  @hint("A buffered degrees on the y-axis before the frame billboards to face the user.")
  private yBufferDegrees: number = 0
  @ui.group_end
  @ui.label("")
  @ui.group_start("Snapping")
  @hint("Controls how the frame snaps to other frames or world features when moved.")
  /**
   * Enables frame snapping functionality for automatic alignment to other frames or world features when
   * moved.
   */
  @input
  @hint(
    "Enables frame snapping functionality for automatic alignment to other frames or world features when \
moved."
  )
  private useSnapping: boolean = false
  /**
   * Enables snapping to other frames when moving.
   */
  @input
  @showIf("useSnapping")
  @hint("Enables snapping to other frames when moving.")
  private itemSnapping: boolean = false
  /**
   * Enables snapping to physical surfaces in the real-world environment when moving.
   */
  @input
  @showIf("useSnapping")
  @hint("Enables snapping to physical surfaces in the real-world environment when moving.")
  private worldSnapping: boolean = false
  @ui.group_end
  @ui.label("")
  @ui.group_start("Tag-Along")
  @showIf("_showFollowButton", false)
  @hint("Controls the tag-along behavior of the frame.")

  /**
   * Replaces smooth follow with tag-along: the frame stays still during
   * small head movements and recenters after larger turns.
   */
  @input
  @label("Use Tag-Along Mode")
  @hint(
    "Replaces smooth follow with tag-along: the frame stays still during small head movements \
and recenters after larger turns."
  )
  private _useTagAlong: boolean = false

  /**
   * Whether the tag-along follow mode is active.
   * Can be toggled at runtime — replacing the active follow behavior while
   * keeping the follow button and per-frame update gating consistent.
   */
  public get useTagAlong(): boolean {
    return this._useTagAlong
  }

  public set useTagAlong(enabled: boolean) {
    if (this._useTagAlong === enabled) return
    this._useTagAlong = enabled

    if (!this._initialized) return

    if (enabled) {
      this.setFollowing(true)
      this.createTagAlongBehavior()
    } else {
      this.setFollowBehavior(null)
      if (this.useFollowBehavior) {
        this.setUseFollow(true)
      } else {
        this.setFollowing(false)
      }
    }
  }

  @input
  @showIf("_useTagAlong")
  @label("Follow Distance")
  @hint("Distance (cm) at which the frame repositions in front of the user.")
  @widget(new SliderWidget(20, 200, 1))
  private _tagAlongDistance: number = 110

  /**
   * Distance (cm) at which the tag-along repositions in front of the user.
   * Updates propagate to the active TagAlong instance immediately.
   */
  public get tagAlongDistance(): number {
    return this._tagAlongDistance
  }

  public set tagAlongDistance(distance: number) {
    this._tagAlongDistance = distance
    if (this._tagAlong) {
      this._tagAlong.followDistance = distance
    }
  }

  @ui.group_end
  @ui.label("")
  @ui.group_start("Follow Behavior")
  @showIf("_useTagAlong", false)
  @hint("Controls whether the frame automatically follows the user's view when moving around.")
  @input
  @hint("Shows a button that allows users to toggle whether the frame follows their view as they move.")
  private _showFollowButton: boolean = false
  /**
   * Shows a button that allows users to toggle whether the frame follows their view as they move.
   */
  public get showFollowButton(): boolean {
    return this._showFollowButton
  }
  public set showFollowButton(show: boolean) {
    this._showFollowButton = show
    const followButtonBefore = this.followButton
    if (this.isPanelFrame) {
      // SnapOS3 — follow lives in the right drawer.
      if (show && !this._followButton) {
        this._followButton = this._rightDrawer.addItem({
          icon: FRAME_FOLLOW_ICON,
          isToggle: true,
          name: "FrameFollowButton",
          onTriggerUp: () => {
            this._inputState.pinching = false
          }
        })
      }
      if (this._followButton) {
        // Route through setItemEnabled so the drawer's layout collapses
        // around the remaining enabled items rather than leaving a gap.
        this._rightDrawer.setItemEnabled(this._followButton, show)
      }
    } else {
      // SnapOS2 — follow is a single button managed by ButtonHandler.
      this._buttonHandler.enableFollowButton(show)
    }
    // Wire the toggle handler when the button is newly created. Subsequent
    // setter calls re-use the same Button instance so the listener stays
    // attached. Without this, setting showFollowButton = true at runtime
    // (after initializeHandlers) leaves the button without its toggle.
    if (!followButtonBefore && this.followButton) {
      this.followButton.onTriggerUp.add(() => {
        this.setFollowing(!this.following)
      })
    }
  }

  /**
   * Add a custom button to the right drawer. Returns the created Button so
   * callers can wire their own listeners or toggle state.
   */
  public addRightDrawerButton(config: {
    icon: Texture
    isToggle?: boolean
    onTriggerUp: () => void
    name?: string
  }): Button {
    return this._rightDrawer.addItem(config)
  }

  /**
   * Toggle a drawer button's enabled state. The drawer's layout collapses
   * around the remaining enabled items so there's no dead vertical gap.
   * Prefer this over `button.sceneObject.enabled = ...` directly — the
   * raw SceneObject toggle bypasses the drawer's layout pass.
   * Returns true if the button was found in the drawer.
   */
  public setRightDrawerButtonEnabled(button: Button, enabled: boolean): boolean {
    return this._rightDrawer.setItemEnabled(button, enabled)
  }

  /**
   * Remove a drawer button entirely. The drawer destroys the SceneObject
   * and collapses layout around remaining items; if this was the last
   * item, the drawer subtree disables. Prefer this over destroying the
   * Button's SceneObject directly — the raw destroy leaves a stale item
   * entry in the drawer's internal list.
   */
  public removeRightDrawerButton(button: Button): void {
    this._rightDrawer.removeItem(button)
  }

  /**
   * Local-space x-coordinate of the rightmost extent of the frame's
   * interactive footprint (body + right-side affordances). Use this to
   * anchor adjacent UI without overlapping the SnapOS3 drawer when it's
   * expanded. Falls back to `totalSize.x / 2` when no drawer affordance
   * exists (SnapOS2 frames, or SnapOS3 with no enabled drawer items).
   */
  public get rightOuterEdge(): number {
    if (this.isPanelFrame) {
      const bounds = this._rightDrawer.getBounds()
      if (bounds) return bounds.center.x + bounds.size.x / 2
    }
    return this.totalSize.x * 0.5
  }

  /**
   * Local-space x-coordinate of the leftmost extent of the frame's
   * interactive footprint. Today equals `-totalSize.x / 2` — the close
   * button half-overlaps the body's left edge, so it doesn't extend the
   * interactive footprint outward.
   */
  public get leftOuterEdge(): number {
    return -this.totalSize.x * 0.5
  }

  /**
   * Bounding box of the right drawer in frame-local space. Returns null
   * on SnapOS2 frames or when the drawer has no enabled items. Use this
   * when tooltip/popup placement needs the drawer's vertical extent too,
   * not just the rightmost edge. The bounds reflect the visible-state
   * (slid-out) position, not the current animated frame.
   */
  public getRightDrawerBounds(): {center: vec3; size: vec2} | null {
    if (!this.isPanelFrame) return null
    return this._rightDrawer.getBounds()
  }

  /**
   * When enabled, creates a follow behavior that keeps the frame in front of the user's view.
   */
  @input
  @label("Use Built-In Follow Behavior")
  @showIf("_showFollowButton")
  @hint("When enabled, creates a follow behavior that keeps the frame in front of the user's view.")
  private useFollowBehavior: boolean = false

  /**
   * Enables tilt mode, which switches the follow behavior to gaze-tracking
   * when the user looks up or down beyond the configured thresholds.
   */
  @input
  @showIf("useFollowBehavior")
  @label("Use Tilt Mode")
  @hint(
    "Enables tilt mode, which switches the follow behavior to gaze-tracking \
when the user looks up or down beyond the configured thresholds."
  )
  private _useTiltMode: boolean = false

  /**
   * Camera pitch angle (degrees) looking UP at which gaze-tracking activates.
   */
  @input
  @showIf("_useTiltMode")
  @label("Tilt Up Threshold (degrees)")
  @hint("Camera pitch angle looking up at which gaze-tracking activates.")
  @widget(new SliderWidget(0, 90, 1))
  private _tiltUpThreshold: number = 25

  /**
   * Camera pitch angle (degrees) looking DOWN at which gaze-tracking activates.
   */
  @input
  @showIf("_useTiltMode")
  @label("Tilt Down Threshold (degrees)")
  @hint("Camera pitch angle looking down at which gaze-tracking activates.")
  @widget(new SliderWidget(0, 90, 1))
  private _tiltDownThreshold: number = 35

  /**
   * Controls whether the frame actively follows the user's view. Setting this defines the initial state.
   */
  @input
  @showIf("useFollowBehavior")
  @hint("Turns on the following. If this is set to true, it will begin following the user immediately.")
  private _following: boolean = false
  public get following(): boolean {
    return this._following
  }

  public get useTiltMode(): boolean {
    return this._useTiltMode
  }
  public set useTiltMode(enabled: boolean) {
    this._useTiltMode = enabled
    this.syncSmoothFollowTiltConfig()
  }

  public get tiltUpThreshold(): number {
    return this._tiltUpThreshold
  }
  public set tiltUpThreshold(degrees: number) {
    this._tiltUpThreshold = degrees
    this.syncSmoothFollowTiltConfig()
  }

  public get tiltDownThreshold(): number {
    return this._tiltDownThreshold
  }
  public set tiltDownThreshold(degrees: number) {
    this._tiltDownThreshold = degrees
    this.syncSmoothFollowTiltConfig()
  }

  @ui.group_end
  @ui.label("")
  @ui.group_start("Close Button")
  @hint("Controls whether a close button is displayed in the corner of the frame.")
  @input
  @hint("Shows a button that allows users to close or dismiss the frame.")
  private _showCloseButton: boolean = false
  /**
   * Shows a button that allows users to close or dismiss the frame.
   */
  public get showCloseButton(): boolean {
    return this._showCloseButton
  }
  public set showCloseButton(show: boolean) {
    this._showCloseButton = show
    this._buttonHandler.enableCloseButton(this._showCloseButton)
  }
  @ui.group_end
  @ui.group_start("Interaction Plane")
  @hint("Settings for an interaction plane that extends around the frame.")
  /**
   * Enables an Interaction Plane that creates a near-field targeting zone around the frame that improves
   * precision when interacting with buttons and UI elements using hand tracking.
   */
  @input
  @hint(
    "Enables an Interaction Plane that creates a near-field targeting zone around the frame that improves \
precision when interacting with buttons and UI elements using hand tracking."
  )
  private _enableInteractionPlane: boolean = true

  @input
  @showIf("_enableInteractionPlane")
  @hint("Offset position for the interaction plane relative to the frame center.")
  private _interactionPlaneOffset: vec3 = new vec3(0, 0, 0)

  /**
   * Get the offset position for the interaction plane relative to the frame center.
   */
  public get interactionPlaneOffset(): vec3 {
    return this._interactionPlaneOffset
  }

  /**
   * Set the offset position for the interaction plane relative to the frame center.
   * @param offset - The new offset.
   */
  public set interactionPlaneOffset(offset: vec3) {
    this._interactionPlaneOffset = offset
    this.updateInteractionPlane()
  }

  @input
  @showIf("_enableInteractionPlane")
  @hint("Padding that extends the InteractionPlane size.")
  private _interactionPlanePadding: vec2 = new vec2(0, 0)

  /**
   * Get the size of the padding around the InteractionPlane.
   */
  public get interactionPlanePadding(): vec2 {
    return this._interactionPlanePadding
  }

  /**
   * Set the size of the padding around the InteractionPlane.
   * @param padding - The new padding.
   */
  public set interactionPlanePadding(padding: vec2) {
    this._interactionPlanePadding = padding
    this.updateInteractionPlane()
  }

  /**
   * Sets the preferred targeting visual. (Requires the V2 Cursor to be enabled on InteractorCursors).
   * - 0: None
   * - 1: Cursor (default)
   * - 2: Ray
   */
  @input
  @showIf("_enableInteractionPlane")
  @hint(
    "Sets the preferred targeting visual. (Requires the V2 Cursor to be enabled on InteractorCursors).\n\n\
- 0: None\n\
- 1: Cursor (default)\n\
- 2: Ray"
  )
  @widget(new ComboBoxWidget([new ComboBoxItem("None", 0), new ComboBoxItem("Cursor", 1), new ComboBoxItem("Ray", 2)]))
  private _targetingVisual: number = TargetingVisual.Cursor

  @ui.group_end
  @ui.separator
  public content: SceneObject
  public frameObject: SceneObject

  private _transform: Transform
  /**
   * Transform of top level frame object.
   */
  public get transform(): Transform {
    return this._transform
  }

  private _contentTransform: Transform
  /**
   * Transform of content parent SceneObject.
   */
  public get contentTransform(): Transform {
    return this._contentTransform
  }

  private _inputMode: InputMode = InputMode.Auto
  private _scaling: boolean = false
  private _translating: boolean = false
  private _scalingLastFrame: boolean = false
  private _isInZone: boolean = false
  private _isInZoneLast: boolean = false
  private _allowScalingTopLeft: boolean = true
  private _allowScalingTopRight: boolean = true

  private _interactorCursor: InteractorCursor | null = null
  private _cursorMode: CursorMode = CursorMode.Auto
  private _lastCursorMode: CursorMode = CursorMode.Auto
  private _buttonHandler: ButtonHandler
  private _rightDrawer: RightDrawer
  private _followButton: Button | null = null

  public get closeButton(): Button {
    return this._buttonHandler.closeButton
  }

  public get followButton(): Button {
    return (this._followButton ?? this._buttonHandler.followButton) as Button
  }

  /**
   * Look up the `ElementContent` companion attached to a Frame-owned
   * Button (close lives on ButtonHandler; SnapOS3 follow lives on a
   * RightDrawer item; SnapOS2 follow lives on ButtonHandler). The icon
   * always sits on the same SceneObject as its Button after the SnapOS2
   * unification, so this single lookup works for both themes.
   */
  private iconContentOf(button: Button | null): ElementContent | null {
    if (!button || isNull(button) || isNull(button.sceneObject)) return null
    return button.sceneObject.getComponent(ElementContent.getTypeName()) as ElementContent | null
  }

  /**
   * The texture displayed on the close button's icon slot. Use this to
   * repurpose the close button as a back/home affordance without reaching
   * into theme-specific internals. Returns null if the close button
   * hasn't been created yet — set `showCloseButton = true` first.
   */
  public get closeButtonIcon(): Texture | null {
    return this.iconContentOf(this.closeButton)?.leadingIcon ?? null
  }
  public set closeButtonIcon(texture: Texture) {
    const content = this.iconContentOf(this.closeButton)
    if (content) content.leadingIcon = texture
  }

  /**
   * The texture displayed on the follow button's icon slot. Use this to
   * swap follow → pin / bookmark / other affordances. Returns null if
   * the follow button hasn't been created yet — set
   * `showFollowButton = true` first.
   */
  public get followButtonIcon(): Texture | null {
    return this.iconContentOf(this.followButton)?.leadingIcon ?? null
  }
  public set followButtonIcon(texture: Texture) {
    const content = this.iconContentOf(this.followButton)
    if (content) content.leadingIcon = texture
  }

  private _margin: number = 4
  private _ogMargin: number = this._margin
  /**
   * Width of the grabbable margin around the frame's content. Contributes to totalSize
   * and defines where the frame's edge interaction region begins. Distinct from the
   * visual border rendered by the underlying RoundedRectangle.
   */
  public get margin(): number {
    return this._margin
  }
  public set margin(margin: number) {
    this._margin = margin
    this._frameVisual.setFrameMargin(margin)
    this._ogMargin = margin
    this.scaleFrame()
  }

  /**
   * @deprecated Renamed to `margin`. Will be removed in a future release.
   * The frame's grabbable margin, distinct from the visual border rendered
   * by the underlying RoundedRectangle.
   */
  public get border(): number {
    return this.margin
  }
  public set border(value: number) {
    this.margin = value
  }

  private snappingHandler: SnappingHandler
  private _hoverBehavior: HoverBehavior
  /**
   * Handles hover behavior for the frame.
   */
  public get hoverBehavior(): HoverBehavior {
    return this._hoverBehavior
  }

  private _frameVisual: FrameVisual

  /** Active visual implementation for this frame. */
  public get frameVisual(): FrameVisual {
    return this._frameVisual
  }

  /**
   * True when the frame is rendering with the SnapOS3 panel visual. Used by
   * show/hide and hover gating to fork SnapOS3-specific behavior (drawer
   * slide, body-fade-gated-on-autoShowHide) from the classic alpha tween.
   */
  private get isPanelFrame(): boolean {
    return this._frameVisual instanceof FramePanelVisual
  }

  /**
   * Underlying RoundedRectangle when the current visual is the default
   * FrameRoundedRectVisual; null for other visual types.
   * @deprecated Prefer `frame.cornerRadius` for shape metrics and the
   *             FrameVisual interface for rendering operations.
   */
  public get roundedRectangle(): RoundedRectangle | null {
    return this._frameVisual instanceof FrameRoundedRectVisual ? this._frameVisual.roundedRectangle : null
  }

  private _customCornerRadius: number | null = null

  /**
   * Currently-applied corner radius of the frame body in cm. Returns the
   * value most recently set via `cornerRadius =` if one is active,
   * otherwise the appearance-driven value (which on SnapOS3 is half the
   * appearance config's nominal — see `CORNER_RADIUS_SCALE` in
   * `FramePanelVisual`). Does NOT reflect the drawer's own corner radius
   * (`DRAWER_CORNER_RADIUS` in `RightDrawer.ts`).
   */
  public get cornerRadius(): number {
    return this._customCornerRadius ?? this._frameVisual.cornerRadius
  }

  /**
   * Override the frame body's corner radius in cm. Persists across
   * `appearance` changes until `resetCornerRadius()` is called. The
   * drawer is unaffected — it has its own fixed corner radius. The snap
   * ghost is refreshed to match.
   */
  public set cornerRadius(radius: number) {
    this._customCornerRadius = radius
    this._frameVisual.setCornerRadius(radius)
    this.snappingHandler?.setGhostCornerRadius(radius)
  }

  /**
   * Clear any custom corner radius so the frame resumes the appearance-
   * driven default. Re-applies the current appearance to refresh the
   * visual and the snap ghost.
   */
  public resetCornerRadius(): void {
    this._customCornerRadius = null
    const config = this.getFrameParams().appearances[this.appearance as FrameAppearance]
    if (config) {
      this._frameVisual.applyAppearance(config)
    }
    this.snappingHandler?.setGhostCornerRadius(this._frameVisual.cornerRadius)
  }

  public collider: ColliderComponent
  private colliderShape: BoxShape

  private _interactable: Interactable

  private _manipulate: InteractableManipulation

  private _billboardComponent: Billboard
  /**
   * Billboard component for the frame, used for automatic rotation to face the camera/user.
   */
  public get billboardComponent(): Billboard {
    return this._billboardComponent
  }

  private managedSceneObjects: SceneObject[] = []
  private managedComponents: Component[]

  private _onSnappingCompleteEvent: Event = new Event()
  /**
   * Public api for adding functions to the onSnappingComplete event handler.
   */
  private _onSnappingComplete?: PublicApi<void>
  public get onSnappingComplete(): PublicApi<void> {
    return (this._onSnappingComplete ??= this._onSnappingCompleteEvent.publicApi())
  }

  private _onFollowUpdateEvent: Event = new Event()
  /**
   * Fires every frame while the frame is in follow mode.
   * Follow behaviors subscribe to this to receive per-frame updates.
   */
  private _onFollowUpdate?: PublicApi<void>
  public get onFollowUpdate(): PublicApi<void> {
    return (this._onFollowUpdate ??= this._onFollowUpdateEvent.publicApi())
  }

  /**
   * @deprecated Frame no longer holds a direct SmoothFollow reference. Follow is
   * now event-driven — subscribe to `onFollowUpdate`, `onTranslationStart/End`,
   * `onScalingStart/End`, `onSizeChanged` to implement custom follow behaviors,
   * or call `setUseFollow(true)` for the default behavior. This getter always
   * returns `null`.
   */
  public get smoothFollow(): null {
    return null
  }

  private _followCleanup: (() => void) | null = null
  private _smoothFollow: SmoothFollow | null = null

  private _tagAlong: TagAlong | null = null

  private _onFollowingChangeEvent: Event<boolean> = new Event<boolean>()

  /**
   * Public api for adding functions to the onFollowingChange event handler.
   */
  private _onFollowingChange?: PublicApi<boolean>
  public get onFollowingChange(): PublicApi<boolean> {
    return (this._onFollowingChange ??= this._onFollowingChangeEvent.publicApi())
  }

  /**
   * TotalSize is the total size of the frame including margin and padding in local space centimeters.
   */
  public get totalSize() {
    return new vec2(
      this.innerSize.x + this.margin * 2 + this.padding.x,
      this.innerSize.y + this.margin * 2 + this.padding.y
    )
  }

  /**
   * Event handler for frame scaling update.
   */
  private _onScalingUpdateEvent: Event = new Event()
  /**
   * Public api for adding functions to the onScalingUpdate event handler.
   */
  private _onScalingUpdate?: PublicApi<void>
  public get onScalingUpdate(): PublicApi<void> {
    return (this._onScalingUpdate ??= this._onScalingUpdateEvent.publicApi())
  }
  /**
   * Event handler for frame scaling started.
   */
  private _onScalingStartEvent: Event = new Event()
  /**
   * Public api for adding functions to the onScalingStart event handler.
   */
  private _onScalingStart?: PublicApi<void>
  public get onScalingStart(): PublicApi<void> {
    return (this._onScalingStart ??= this._onScalingStartEvent.publicApi())
  }

  /**
   * Event handler for frame scaling ended.
   */
  private _onScalingEndEvent: Event = new Event()
  /**
   * Public api for adding functions to the onScalingEnd event handler.
   */
  private _onScalingEnd?: PublicApi<void>
  public get onScalingEnd(): PublicApi<void> {
    return (this._onScalingEnd ??= this._onScalingEndEvent.publicApi())
  }

  private _onTranslationStartEvent = new Event()
  /**
   * Public api for adding functions to the onTranslationStartEvent event handler.
   */
  private _onTranslationStart?: PublicApi<void>
  public get onTranslationStart(): PublicApi<void> {
    return (this._onTranslationStart ??= this._onTranslationStartEvent.publicApi())
  }

  private _onTranslationEndEvent = new Event()
  /**
   * Public api for adding functions to the _onTranslationEndEvent event handler.
   */
  private _onTranslationEnd?: PublicApi<void>
  public get onTranslationEnd(): PublicApi<void> {
    return (this._onTranslationEnd ??= this._onTranslationEndEvent.publicApi())
  }

  private _translatingLastFrame: boolean = false

  private _onHoverEnterInnerInteractableEvent = new Event()
  private _onHoverEnterInnerInteractable?: PublicApi<void>
  public get onHoverEnterInnerInteractable(): PublicApi<void> {
    return (this._onHoverEnterInnerInteractable ??= this._onHoverEnterInnerInteractableEvent.publicApi())
  }

  private _onHoverExitInnerInteractableEvent = new Event()
  private _onHoverExitInnerInteractable?: PublicApi<void>
  public get onHoverExitInnerInteractable(): PublicApi<void> {
    return (this._onHoverExitInnerInteractable ??= this._onHoverExitInnerInteractableEvent.publicApi())
  }

  private _hoveringInnerInteractableLast: boolean = false

  private _pinchingLastFrame: boolean = false

  private _dragStart = vec3.zero()

  private _forceTranslate: boolean = false

  public get forceTranslate() {
    return this._forceTranslate
  }

  public set forceTranslate(forceTranslate: boolean) {
    this._forceTranslate = forceTranslate
  }

  private _scalingSizeStart: vec2 = vec2.zero()

  /**
   * Getter for the initial scaling size.
   */
  public get scalingSizeStart(): vec2 {
    return this._scalingSizeStart
  }
  /**
   * Setter for the initial scaling size.
   */
  public set scalingSizeStart(thisSize: vec2) {
    this._scalingSizeStart = thisSize
  }

  private _inputState: InputState = {
    hovered: false,
    hierarchyHovered: false,
    pinching: false,
    position: vec3.zero(),
    innerInteractableActive: false
  }

  /**
   * Current interactor that is interacting with the frame.
   */
  public currentInteractor: Interactor = null

  private _hoveringContentLast: boolean = false

  // Track Far↔Near transition state to reset glow opacity when transition ends
  private _wasInFarNearTransition: boolean = false

  private _opacity: number = 1
  private _opacityCancel: CancelSet = new CancelSet()
  private _cursorHighlightCancel: CancelSet = new CancelSet()

  /**
   * Boolean tracking visibility of frame.
   */
  private _isVisible: boolean = true

  private set isVisible(isVisible: boolean) {
    this._isVisible = isVisible
  }

  public get isVisible() {
    return this._isVisible
  }

  private _initialized: boolean = false

  private _onInitializedEvent: Event = new ReplayEvent()
  /**
   * Public api for adding functions to the onInitializedEvent event handler.
   */
  private _onInitialized?: PublicApi<void>
  public get onInitialized(): PublicApi<void> {
    return (this._onInitialized ??= this._onInitializedEvent.publicApi())
  }

  private _onShowVisualEvent: Event = new Event()
  /**
   * Public api for adding functions to the onShowVisualEvent event handler.
   *
   * onShowVisual is invoked when the frame _starts_ to show its visuals.
   */
  private _onShowVisual?: PublicApi<void>
  public get onShowVisual(): PublicApi<void> {
    return (this._onShowVisual ??= this._onShowVisualEvent.publicApi())
  }

  private _onHideVisualEvent: Event = new Event()
  /**
   * Public api for adding functions to the onHideVisualEvent event handler.
   *
   * onHideVisual is invoked when the frame has _finished_ hiding its visuals.
   */
  private _onHideVisual?: PublicApi<void>
  public get onHideVisual(): PublicApi<void> {
    return (this._onHideVisual ??= this._onHideVisualEvent.publicApi())
  }

  private _onSizeChangedEvent: Event<vec3> = new Event<vec3>()
  /**
   * Public api for adding functions to the onSizeChangedEvent event handler.
   */
  private _onSizeChanged?: PublicApi<vec3>
  public get onSizeChanged(): PublicApi<vec3> {
    return (this._onSizeChanged ??= this._onSizeChangedEvent.publicApi())
  }

  private unsubscribes: unsubscribe[] = []

  private originalInnerSize: vec2 = vec2.zero()

  private _grabZones: vec4[] = []
  private _grabZoneOnly: boolean = false

  private squeezeCancel: CancelSet = new CancelSet()
  private squeezeAmount = this.margin * 0.15

  private _interactionPlane!: InteractionPlane
  private _interactionPlaneTransform: Transform | null = null

  public get interactionPlane() {
    return this._interactionPlane
  }

  private set interactionPlane(interactionPlane: InteractionPlane) {
    this._interactionPlane = interactionPlane
    this._interactionPlaneTransform = interactionPlane.getTransform()
  }

  public onAwake() {
    this.collider = this.sceneObject.createComponent("ColliderComponent")
    this._interactable = this.sceneObject.createComponent(Interactable.getTypeName())
    this._manipulate = this.sceneObject.createComponent(InteractableManipulation.getTypeName())
    this.managedComponents = [this.collider, this._interactable, this._manipulate]
    this.createEvent("OnStartEvent").bind(() => {
      if (this._initialized) return
      this.initializeContent()
      this.initializeVisuals()
      this.content.setParent(this.sceneObject)
      this.initializeCollider()
      this.initializeHandlers()
      this.initializeBillboard()
      this.setFollowing(this.following)
      this.originalInnerSize = this.innerSize.uniformScale(1)
      this.initializeInteractionPlane()
      this.margin = this._margin
      this.innerSize = this._innerSize
      this.padding = this._padding
      this.initializeHoverBehavior()
      if (this.useSnapping) this.createSnappableBehavior()
      if (this._useTagAlong) {
        this.setFollowing(true)
        this.createTagAlongBehavior()
      } else if (this.useFollowBehavior) {
        this.setUseFollow(true)
      }
      this.initializeInteractionEvents()
      if (this.autoShowHide) this.hideVisual()
      this._buttonHandler.renderOrder = this.renderOrder
      this._rightDrawer.renderOrder = this.renderOrder
      this._interactable.targetingMode = TargetingMode.Direct | TargetingMode.Indirect
      this._interactable.allowMultipleInteractors = false
      this._manipulate.setCanScale(false)
      this._manipulate.setCanRotate(false)
      this.appearance = this._appearance as FrameAppearance
      this.initializeLifecycleEvents()
      this._initialized = true
      this._onInitializedEvent.invoke()
    })
  }

  /**
   * Gets the width of the frame layout in local space centimeters.
   * @returns The current width of the frame.
   */
  public get width(): number {
    return this.totalSize.x
  }

  /**
   * Sets the width of the frame.
   * @param value - The new width value.
   */
  public set width(value: number) {
    const newInnerWidth = value - (this.margin * 2 + this.padding.x)
    this.innerSize = new vec2(newInnerWidth, this.innerSize.y)
  }

  /**
   * Gets the height of the frame layout in local space centimeters.
   * @returns The current height of the frame.
   */
  public get height(): number {
    return this.totalSize.y
  }

  /**
   * Sets the height of the frame.
   * @param value - The new height value.
   */
  public set height(value: number) {
    const newInnerHeight = value - (this.margin * 2 + this.padding.y)
    this.innerSize = new vec2(this.innerSize.x, newInnerHeight)
  }

  /**
   * Gets the depth of the frame layout in local space centimeters.
   * @returns The current depth of the frame.
   */
  public get depth(): number {
    return 1
  }

  /**
   * Sets the depth of the frame.
   * This is a no-op as depth is not configurable for 2D components.
   * @param value - The new depth value (ignored).
   */
  public set depth(value: number) {
    // No-op, depth is not configurable for 2D component
  }

  /**
   * Gets the current size of the layout as a vec3 (width, height, depth).
   * @returns The layout size with width, height, and depth.
   */
  public get layoutSize(): vec3 {
    return new vec3(this.width, this.height, this.depth)
  }

  /**
   * Gets whether this frame is initialized.
   * @returns True if the frame is initialized, false otherwise.
   */
  public get initialized(): boolean {
    return this._initialized
  }

  private initializeVisuals() {
    this._frameVisual = this.createFrameVisual()
    this.frameObject = this._frameVisual.initialize(this.sceneObject, this.sceneObject.layer)
    this._frameVisual.setSize(this.innerSize)
    this.cutOutCenter = this._cutOutCenter
  }

  private initializeCollider() {
    this.colliderShape = Shape.createBoxShape()
    this.colliderShape.size = new vec3(this.innerSize.x, this.innerSize.y, 1)
    this.collider.shape = this.colliderShape
    this.collider.fitVisual = false
  }

  private initializeContent() {
    this._transform = this.sceneObject.getTransform()
    this.content = global.scene.createSceneObject("content")
    this.managedSceneObjects.push(this.content)
    this.content.layer = this.sceneObject.layer
    this._contentTransform = this.content.getTransform()
    // Move any existing children of sceneObject into `content` so they're grouped
    // under the frame for unified transform/visibility. Runs BEFORE initializeVisuals
    // so the frame's own SceneObject isn't swept up.
    this.sceneObject.children.forEach((child: SceneObject) => {
      child.setParent(this.content)
    })
  }

  private initializeHandlers() {
    this._buttonHandler = new ButtonHandler({
      frame: this,
      onButtonTriggerUp: () => {
        this._inputState.pinching = false
      }
    })
    this._rightDrawer = new RightDrawer({frame: this, initialVisible: false})
    this.showCloseButton = this._showCloseButton
    // The setter binds setFollowing when the button is freshly created; no
    // separate onTriggerUp wiring needed here.
    this.showFollowButton = this._showFollowButton
    this.onlyInteractOnMargin = this._onlyInteractOnMargin
  }

  private initializeBillboard() {
    this._billboardComponent = this.useBillboarding ? this.sceneObject.createComponent(Billboard.getTypeName()) : null
    if (this.billboardComponent !== null) {
      this.managedComponents.push(this.billboardComponent)
      this.billboardComponent.xAxisEnabled = this.xAlways
      this.billboardComponent.yAxisEnabled = this.yAlways
      this.billboardComponent.axisBufferDegrees = new vec3(this.xBufferDegrees, this.yBufferDegrees, 0)
    }
  }

  private initializeInteractionPlane() {
    this._interactionPlane = this.sceneObject.createComponent(InteractionPlane.getTypeName())
    this.managedComponents.push(this._interactionPlane)
    this._interactionPlane.nearFieldDepth = FrameConstants.nearFieldInteractionZoneDistance
    this._interactionPlane.targetingVisual = this._targetingVisual
    this._interactionPlane.enabled = this._enableInteractionPlane
    this._interactionPlaneTransform = this._interactionPlane.getTransform()
    this.updateInteractionPlane()
  }

  private initializeHoverBehavior() {
    this._hoverBehavior = new HoverBehavior(this._interactable)
    this.hideCursorHighlight()
    this.unsubscribes.push(
      this.hoverBehavior.onHoverStart.add((e: InteractorEvent) => {
        this.setCursorFromInteractor(e.interactor)
        if (this.autoShowHide || this.isPanelFrame) this.showVisual()
        if (!this.grabZoneOnly) this.showCursorHighlight()
        this._frameVisual.setFrameHovered(true)
        this._inputState.hovered = true
        this._inputState.hierarchyHovered = true
      }),
      this.hoverBehavior.onHoverUpdate.add((e: InteractorEvent) => {
        const targetObject = e && !isNull(e.target) ? e.target.sceneObject : undefined
        if (e.interactor.targetHitInfo) this.computeHitPosition(e.interactor)

        const hoveringContent =
          targetObject !== this.sceneObject &&
          targetObject !== this._buttonHandler.closeButton?.sceneObject &&
          targetObject !== this.followButton?.sceneObject
        const isNearField =
          (e.interactor.inputType & InteractorInputType.BothHands) !== 0 &&
          !(e.interactor as HandInteractor).isFarField()

        this.updateCursorRadiusAndGlow(e)
        this.updateGrabZoneHighlight(hoveringContent)
        this.updateContentHover(hoveringContent, isNearField)
        this._inputState.innerInteractableActive = targetObject !== this.sceneObject
      }),
      this.hoverBehavior.onHoverEnd.add(() => {
        if (this.autoShowHide || this.isPanelFrame) this.hideVisual()
        this.hideCursorHighlight()
        this._frameVisual.setFrameHovered(false)
        this._inputState.hovered = false
        this._inputState.hierarchyHovered = false
        this._inputState.innerInteractableActive = false
      })
    )
  }

  private initializeInteractionEvents() {
    this.unsubscribes.push(
      this._interactable.onTriggerStart.add((e: InteractorEvent) => {
        const targetObject = e?.target.sceneObject
        const hitLocal = this.computeHitPosition(e.interactor).localPosition
        this._dragStart = new vec3(hitLocal.x, hitLocal.y, 0)

        if (targetObject === this.sceneObject) {
          this._inputState.pinching = true
          this.currentInteractor = e.interactor
        }

        if (e.interactor.targetHitInfo) {
          const initialHit = e.interactor.targetHitInfo.localHitPosition
          const worldHitPosition = targetObject.getTransform().getWorldTransform().multiplyPoint(initialHit)
          if (this.billboardComponent !== null) {
            this.billboardComponent.setPivot(
              this.billboardComponent.targetTransform.getInvertedWorldTransform().multiplyPoint(worldHitPosition),
              e.interactor
            )
          }
        }
      }),
      this._interactable.onTriggerUpdate.add((event: InteractorEvent) => {
        if (event.interactor.targetHitInfo && this._scaling) {
          const dragPos = this.computeHitPosition(event.interactor).localPosition
          const sizeDelta = new vec2(
            (dragPos.x - this._dragStart.x) * Math.sign(this._dragStart.x) * 2,
            (dragPos.y - this._dragStart.y) * Math.sign(this._dragStart.y) * 2
          )
          if (this.allowNonUniformScaling) {
            const newSizeX = this.scalingSizeStart.x + sizeDelta.x
            const newSizeY = this.scalingSizeStart.y + sizeDelta.y
            this.innerSize = new vec2(
              MathUtils.clamp(newSizeX, this.minimumSize.x, this.maximumSize.x),
              MathUtils.clamp(newSizeY, this.minimumSize.y, this.maximumSize.y)
            )
          } else {
            const dragScale = 1 + Math.max(sizeDelta.x / this.scalingSizeStart.x, sizeDelta.y / this.scalingSizeStart.y)
            const minScale = Math.max(
              this.minimumSize.x / this.scalingSizeStart.x,
              this.minimumSize.y / this.scalingSizeStart.y
            )
            const maxScale = Math.min(
              this.maximumSize.x / this.scalingSizeStart.x,
              this.maximumSize.y / this.scalingSizeStart.y
            )
            this.innerSize = this.scalingSizeStart.uniformScale(MathUtils.clamp(dragScale, minScale, maxScale))
          }
        }
      })
    )

    const resetPinchState = () => {
      this._inputState.pinching = false
      this.currentInteractor = null
    }
    this.unsubscribes.push(
      this._interactable.onTriggerEnd.add(resetPinchState),
      this._interactable.onTriggerEndOutside.add(resetPinchState),
      this._interactable.onTriggerCanceled.add(resetPinchState)
    )
  }

  private initializeLifecycleEvents() {
    this.createEvent("OnEnableEvent").bind(() => {
      this._frameVisual.setEnabled(this._isVisible)
      this.managedComponents.forEach((component) => {
        if (!isNull(component) && component) {
          if (component === this._interactionPlane) {
            component.enabled = this._enableInteractionPlane
          } else {
            component.enabled = true
          }
        }
      })
    })
    this.createEvent("OnDisableEvent").bind(() => {
      this.managedComponents.forEach((component) => {
        if (!isNull(component) && component) {
          component.enabled = false
        }
      })
    })
    this.createEvent("OnDestroyEvent").bind(() => {
      this.unsubscribes.forEach((u) => u())
      this.unsubscribes = []
      this._opacityCancel()
      this._cursorHighlightCancel()
      this.squeezeCancel()
      this.snappingHandler?.destroy()
      this._followCleanup?.()
      this._smoothFollow = null
      this._rightDrawer?.destroy()
      this._frameVisual.destroy()
      if (!isNull(this.content)) {
        // TODO: remove try/catch once LensCore exposes a property to detect
        // a SceneObject that is mid-destruction; reparenting under a dying
        // parent currently throws "Cannot reparent a SceneObject being
        // destroyed". Swallow only that specific case so unrelated failures
        // still surface.
        this.content.children.forEach((child) => {
          try {
            child.setParent(this.sceneObject)
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e)
            if (!message.includes("Cannot reparent a SceneObject being destroyed")) throw e
          }
        })
      }
      this.managedComponents.forEach((c) => {
        if (!isNull(c) && c) c.destroy()
      })
      this.managedComponents = []
      this.managedSceneObjects.forEach((o) => {
        if (!isNull(o) && o) o.destroy()
      })
      this.managedSceneObjects = []
    })
    this.createEvent("UpdateEvent").bind(this.update.bind(this))
    this.createEvent("LateUpdateEvent").bind(this.lateUpdate.bind(this))
  }

  private update() {
    this.updateInput()
    this.updateCursorMode()
    this.updateInnerInteractableHover()

    if (this._translating) this.snappingHandler?.update()
    this.syncSmoothFollowTiltConfig()
    if (this.following) this._onFollowUpdateEvent.invoke()

    this.updateBillboardState(this._translating)
    this.updatePinchVisuals()
    if (DEBUG_DRAW) this.debugDraw()
  }

  private syncSmoothFollowTiltConfig(): void {
    this._smoothFollow?.setTilt(this._useTiltMode, this._tiltUpThreshold, this._tiltDownThreshold)
  }

  private updateInnerInteractableHover() {
    const shouldSlide = this.autoShowHide || this.isPanelFrame
    if (this._inputState.innerInteractableActive && !this._hoveringInnerInteractableLast) {
      if (shouldSlide) this.tweenOpacity(this._opacity, 1)
      this._onHoverEnterInnerInteractableEvent.invoke()
    } else if (!this._inputState.innerInteractableActive && this._hoveringInnerInteractableLast) {
      if (this._inputState.hierarchyHovered && shouldSlide) this.tweenOpacity(this._opacity, 1)
      this._onHoverExitInnerInteractableEvent.invoke()
    }
    this._hoveringInnerInteractableLast = this._inputState.innerInteractableActive
  }

  private updateBillboardState(isTranslating: boolean) {
    if (isTranslating) {
      if (this.billboardComponent !== null) {
        this.billboardComponent.xAxisEnabled =
          (this.xOnTranslate && (this.allowTranslation || this.forceTranslate)) || this.xAlways
        this.billboardComponent.yAxisEnabled =
          (this.yOnTranslate && (this.allowTranslation || this.forceTranslate)) || this.yAlways
        this.billboardComponent.axisBufferDegrees = vec3.zero()
      }
      if (!this._translatingLastFrame) this.tweenMarginSize(this._margin - this.squeezeAmount)
      this._translatingLastFrame = true
    } else {
      if (this.billboardComponent !== null) {
        this.billboardComponent.xAxisEnabled = this.xAlways
        this.billboardComponent.yAxisEnabled = this.yAlways
        this.billboardComponent.axisBufferDegrees = new vec3(this.xBufferDegrees, this.yBufferDegrees, 0)
        if (this._translatingLastFrame) this.billboardComponent.resetPivotPoint()
      }
      if (this._translatingLastFrame) this.tweenMarginSize(this._ogMargin)
      this._translatingLastFrame = false
    }
  }

  // TODO: drive this off pinch start/end events instead of polling once the
  // rest of the event-driven migration lands.
  private updatePinchVisuals() {
    if (this._inputState.pinching === this._pinchingLastFrame) return
    const params = this.getFrameParams()
    this._frameVisual.setActiveState(
      this._inputState.pinching,
      this._inputState.pinching ? params.borderActiveColor : params.borderColor
    )
    this._pinchingLastFrame = this._inputState.pinching
  }

  private debugDraw() {
    global.debugRenderSystem.drawBox(
      this.transform.getWorldPosition().sub(new vec3(0, this.totalSize.y * 0.5 - this.margin * 0.5, 0.1)),
      this.margin,
      this.margin,
      0.1,
      marginDebugColor
    )
    global.debugRenderSystem.drawBox(
      this.transform.getWorldPosition().sub(new vec3(this.totalSize.x * 0.5 - this.margin * 0.5, 0, 0.1)),
      this.margin,
      this.margin,
      0.1,
      marginDebugColor
    )
    for (const grabZone of this.grabZones) {
      const worldPos = this.transform.getWorldPosition()
      const bottomLeft = new vec3(grabZone.x, grabZone.y, 0).add(worldPos)
      const topLeft = new vec3(grabZone.x, grabZone.w, 0).add(worldPos)
      const topRight = new vec3(grabZone.z, grabZone.w, 0).add(worldPos)
      const bottomRight = new vec3(grabZone.z, grabZone.y, 0).add(worldPos)
      global.debugRenderSystem.drawLine(bottomLeft, topLeft, debugRed)
      global.debugRenderSystem.drawLine(topLeft, topRight, debugRed)
      global.debugRenderSystem.drawLine(topRight, bottomRight, debugRed)
      global.debugRenderSystem.drawLine(bottomRight, bottomLeft, debugRed)
    }
  }

  private lateUpdate() {
    this.hoverBehavior.lateUpdate()
  }

  private updateInteractionPlane() {
    if (!this._interactionPlane || !this._interactionPlaneTransform) {
      return
    }

    const paddedSize = this.totalSize.add(this._interactionPlanePadding)
    this._interactionPlane.planeSize = paddedSize

    this._interactionPlane.offset = this._interactionPlaneOffset
    this._interactionPlane.targetingVisual = this._targetingVisual
  }

  private scaleFrame = (isTrueScaleUpdate: boolean = true) => {
    this._frameVisual.setSize(this.totalSize)
    this.updateInteractionPlane()

    this._buttonHandler.resize()
    this._rightDrawer.resize()

    let newZScale = 1
    if (this.autoScaleContent) {
      const factorX = this.innerSize.x / Math.max(this.originalInnerSize.x, 0.001)
      const factorY = this.innerSize.y / Math.max(this.originalInnerSize.y, 0.001)
      newZScale = this.relativeZ ? Math.min(factorX, factorY) : 1
      this.contentTransform.setLocalScale(new vec3(factorX, factorY, newZScale))
    }

    this.colliderShape.size = new vec3(this.totalSize.x, this.totalSize.y, newZScale)
    this.collider.shape = this.colliderShape

    this._frameVisual.setFrustumCullBounds(
      this.colliderShape.size.uniformScale(-0.5),
      this.colliderShape.size.uniformScale(0.5)
    )

    if (isTrueScaleUpdate) {
      this._onScalingUpdateEvent.invoke()
      this._onSizeChangedEvent.invoke(this.layoutSize)
    }
  }

  /**
   * @param useFollow enable or disable the option to turn on the default follow behavior with the follow button
   */
  public setUseFollow = (useFollow: boolean) => {
    this.useFollowBehavior = useFollow
    if (useFollow && !this._followCleanup) {
      const follow = new SmoothFollow({
        transform: this.transform,
        visibleWidth: this.totalSize.x,
        onFollowUpdate: this.onFollowUpdate,
        onDragStart: this.onTranslationStart,
        onDragEnd: this.onTranslationEnd,
        onScalingStart: this.onScalingStart,
        onScalingEnd: this.onScalingEnd,
        onSizeChanged: this.onSizeChanged,
        tiltEnabled: this._useTiltMode,
        tiltUpThreshold: this._tiltUpThreshold,
        tiltDownThreshold: this._tiltDownThreshold
      })
      this.setFollowBehavior(() => follow.destroy())
      this._smoothFollow = follow
    }
  }

  private createTagAlongBehavior(): void {
    const tagAlong = new TagAlong({
      transform: this.transform,
      onFollowUpdate: this.onFollowUpdate,
      onDragStart: this.onTranslationStart,
      onDragEnd: this.onTranslationEnd,
      onScalingStart: this.onScalingStart,
      onScalingEnd: this.onScalingEnd,
      onSizeChanged: this.onSizeChanged,
      followDistance: this._tagAlongDistance
    })
    this.setFollowBehavior(() => tagAlong.destroy())
    this._tagAlong = tagAlong
  }

  /**
   * Registers a follow behavior cleanup function. Called on Frame destroy.
   */
  public setFollowBehavior(cleanup: (() => void) | null) {
    this._smoothFollow = null
    this._tagAlong = null
    this._followCleanup?.()
    this._followCleanup = cleanup
  }

  /**
   * @param isFollowing enable or disable the following button and default behavior ( if it is enabled )
   */
  public setFollowing = (following: boolean): void => {
    this._following = following
    this.followButton?.toggle(following)
    if (this.following && this.billboardComponent !== null) {
      this.billboardComponent.xAxisEnabled = (this.xOnTranslate && this.allowTranslation) || this.xAlways
      this.billboardComponent.yAxisEnabled = (this.yOnTranslate && this.allowTranslation) || this.yAlways
    }
    this._onFollowingChangeEvent.invoke(following)
  }

  /**
   * Sets the buffer degrees for the billboard component. Will only be effective if Frame's billboarding is set to true, and xAlways and/or yAlways is set to true.
   * @param xBufferDegrees the buffer degrees for the x-axis
   * @param yBufferDegrees the buffer degrees for the y-axis
   */
  public setBillboardBufferDegrees(xBufferDegrees: number, yBufferDegrees: number): void {
    if (this.billboardComponent !== null) {
      this.xBufferDegrees = xBufferDegrees
      this.yBufferDegrees = yBufferDegrees
    }
  }

  /**
   * Resets the scale baseline so that the current innerSize is treated as the new 1× reference.
   * Call this after programmatically changing innerSize to a different aspect ratio so that
   * subsequent interactive scaling computes uniform factors relative to the new size.
   */
  public syncScaleBaseline(): void {
    this.originalInnerSize = this.innerSize.uniformScale(1)
  }

  /**
   * @returns whether interactive scaling of the frame via corner handles is enabled
   */
  public get allowScaling(): boolean {
    return this._allowScaling
  }

  /**
   * Sets whether interactive scaling of the frame via corner handles is enabled
   * @param allowScaling - if true, scaling is enabled through the corner handles
   */
  public set allowScaling(allowScaling: boolean) {
    this._allowScaling = allowScaling
  }

  /**
   * @returns current renderOrder for the renderMeshVisual of the frame itself
   */
  public get renderOrder(): number {
    return this._frameVisual.getRenderOrder()
  }

  /**
   * @param renderOrder sets renderOrder for the renderMeshVisual of the frame itself
   */
  public set renderOrder(renderOrder: number) {
    this._frameVisual.setRenderOrder(renderOrder)
    this._buttonHandler.renderOrder = renderOrder
    this._rightDrawer.renderOrder = renderOrder
  }

  /**
   * @returns whether the snapping behavior is currently tweening
   */
  public isSnappingTweening = (): boolean => {
    if (this.snappingHandler) {
      return this.snappingHandler.isTweening
    }
    return false
  }

  /**
   * @returns whether the snapping behavior is checking for snappable elements
   */
  public isSnappingActive = (): boolean => {
    if (this.snappingHandler) {
      return this.snappingHandler.isActive
    }
    return false
  }

  /**
   * @returns the current grab zones of the frame
   */
  public get grabZones(): vec4[] {
    return this._grabZones
  }

  /**
   * Sets the grab zones of the frame, which are used for interaction
   */
  public set grabZones(grabZones: vec4[]) {
    this._grabZones = grabZones
    this._frameVisual.setGrabZones(this.grabZones)
  }

  /**
   * @returns whether the frame only allows interaction in the grab zones
   */
  public get grabZoneOnly(): boolean {
    return this._grabZoneOnly
  }

  /**
   * Sets whether the frame only allows interaction in the grab zones
   * @param only - if true, interaction is limited to the grab zones
   */
  public set grabZoneOnly(only: boolean) {
    this._grabZoneOnly = only
  }

  /**
   * gets the onlyInteractOnMargin setting
   */
  public get onlyInteractOnMargin(): boolean {
    return this._onlyInteractOnMargin
  }

  /**
   * sets the onlyInteractOnMargin setting
   * @param onlyInteractOnMargin - if true, interaction is limited to the frame's margin
   */
  public set onlyInteractOnMargin(onlyInteractOnMargin: boolean) {
    this._onlyInteractOnMargin = onlyInteractOnMargin
    this._frameVisual.setBorderOnly(onlyInteractOnMargin)
  }

  /**
   * @deprecated Renamed to `onlyInteractOnMargin`. Will be removed in a
   * future release. When true, only the frame's margin is interactive.
   */
  public get onlyInteractOnBorder(): boolean {
    return this.onlyInteractOnMargin
  }
  public set onlyInteractOnBorder(value: boolean) {
    this.onlyInteractOnMargin = value
  }

  private createSnappableBehavior = () => {
    this.snappingHandler = new SnappingHandler({
      frame: this,
      interactable: this._interactable,
      worldSnapping: this.worldSnapping,
      itemSnapping: this.itemSnapping,
      onSnappingCompleteEvent: this._onSnappingCompleteEvent,
      onScalingUpdate: this.onScalingUpdate
    })
  }

  private computeHitPosition(interactor: Interactor): HitPosition {
    const position = interactor.planecastPoint
    const invertedWorldTransform = this.transform.getInvertedWorldTransform()
    const objectSpaceHit = invertedWorldTransform.multiplyPoint(position)
    this._inputState.position = objectSpaceHit
    const normalizedPosition = new vec2(
      (objectSpaceHit.x / this.totalSize.x) * 2,
      (objectSpaceHit.y / this.totalSize.y) * 2
    )

    if (!this._translating) {
      this._frameVisual.setCursorPosition(normalizedPosition)
    }

    return {
      localPosition: new vec2(objectSpaceHit.x, objectSpaceHit.y),
      normalizedPosition: normalizedPosition
    }
  }

  private setCursorFromInteractor(interactor: Interactor) {
    const cursor = CursorControllerProvider.getInstance().getCursorByInteractor(interactor)
    if (cursor === undefined) return
    if (this._interactorCursor !== cursor && this._interactorCursor) {
      this.resetCursor()
    }
    this._interactorCursor = cursor
  }

  private resetCursor() {
    if (this._interactorCursor) {
      this._interactorCursor.cursorMode = CursorMode.Auto
    }
    this._lastCursorMode = CursorMode.Auto
    this._cursorMode = CursorMode.Auto
  }

  private updateCursorMode() {
    if (!this._interactorCursor) return
    if (this._cursorMode !== this._lastCursorMode) {
      this._interactorCursor.cursorMode = this._cursorMode
      this._lastCursorMode = this._cursorMode
    }
  }

  private updateInput() {
    this._isInZoneLast = this._isInZone
    if (!this._inputState.pinching) this.getInputMode()
    this.handleInputState()

    if ((this.allowTranslation && this._translating) || this.forceTranslate) {
      this._manipulate.setCanTranslate(true)
    } else if (this._manipulate.canTranslate()) {
      this._manipulate.setCanTranslate(false)
    }

    // Cursor mode from input mode. Safe to always run — _inputMode is frozen
    // during pinching (getInputMode() only runs when !pinching), so the cursor
    // stays correct for the operation in progress.
    if (this._inputMode === InputMode.ScaleBottomLeft || this._inputMode === InputMode.ScaleTopRight) {
      this._cursorMode = CursorMode.ScaleTopRight
    } else if (this._inputMode === InputMode.ScaleBottomRight || this._inputMode === InputMode.ScaleTopLeft) {
      this._cursorMode = CursorMode.ScaleTopLeft
    } else if (this._inputMode === InputMode.Translating && (this.allowTranslation || this.forceTranslate)) {
      this._cursorMode = CursorMode.Translate
    } else {
      this._cursorMode = CursorMode.Auto
    }
  }

  private getInputMode() {
    const position = this._inputState.position
    const xEdge = (this.innerSize.x + this.padding.x) * 0.5
    const yEdge = (this.innerSize.y + this.padding.y) * 0.5

    this._isInZone = this.grabZones.length ? false : true
    if (this.grabZones.length && this.grabZoneOnly) {
      for (let i = 0; i < this.grabZones.length; i++) {
        const zone = this.grabZones[i]
        if (position.x >= zone.x && position.y >= zone.y && position.x <= zone.z && position.y <= zone.w) {
          this._isInZone = true
        }
      }
    } else {
      this._isInZone = true
    }

    if (this._inputState.innerInteractableActive || !this._inputState.hierarchyHovered || !this._isInZone) {
      this._inputMode = InputMode.Auto
    } else if (position.x < -xEdge && position.y < -yEdge && this._allowScaling) {
      this._inputMode = InputMode.ScaleBottomLeft
    } else if (position.x < -xEdge && position.y > yEdge && this._allowScaling) {
      this._inputMode = this._allowScalingTopLeft ? InputMode.ScaleTopLeft : InputMode.Auto
    } else if (position.x > xEdge && position.y < -yEdge && this._allowScaling) {
      this._inputMode = InputMode.ScaleBottomRight
    } else if (position.x > xEdge && position.y > yEdge && this._allowScaling) {
      this._inputMode = this._allowScalingTopRight ? InputMode.ScaleTopRight : InputMode.Auto
    } else if (position.x > xEdge || position.x < -xEdge || position.y < -yEdge || position.y > yEdge) {
      this._inputMode = InputMode.Translating
    } else {
      if (this._onlyInteractOnMargin === false) {
        this._inputMode = InputMode.Translating
      } else if (!this._scaling && !this._translating) {
        this._inputMode = InputMode.Auto
      }
    }
  }

  private handleInputState() {
    this._scalingLastFrame = this._scaling
    if (this._inputState.pinching) {
      if (this._isInZone && !this._scaling && !this._translating) {
        switch (this._inputMode) {
          case InputMode.ScaleBottomLeft:
          case InputMode.ScaleTopLeft:
          case InputMode.ScaleBottomRight:
          case InputMode.ScaleTopRight:
            this._scaling = true
            this.scalingSizeStart = this.innerSize.uniformScale(1)
            this._onScalingStartEvent.invoke()
            break
          case InputMode.Translating:
            this.setInputTranslating(true)
            break
          default:
            if (this._onlyInteractOnMargin === false) {
              this.setInputTranslating(true)
            }
            break
        }
      }
    } else {
      if (this._scaling) this._onScalingEndEvent.invoke()
      // When forceTranslate is on, the block below keeps _translating=true; flipping
      // to false here would cause onTranslationEnd + onTranslationStart to fire every
      // frame as the two blocks fought each other.
      if (!this.forceTranslate) {
        this.setInputTranslating(false)
      }
      this._scaling = false
    }

    if (this.forceTranslate) {
      this._inputMode = InputMode.Translating
      this.setInputTranslating(true)
    }
  }

  private setInputTranslating(isTranslating: boolean) {
    if (isTranslating === this._translating) return
    this._translating = isTranslating
    if (this._translating) {
      this._onTranslationStartEvent.invoke()
    } else {
      this._onTranslationEndEvent.invoke()
    }
  }

  private updateCursorRadiusAndGlow(e: InteractorEvent) {
    if ((e.interactor.inputType & InteractorInputType.BothHands) !== 0) {
      const handInteractor = e.interactor as HandInteractor
      const currentPlane = handInteractor.currentInteractionPlane
      const cachedProjection = handInteractor.cachedIndexProjection

      if (currentPlane === null || cachedProjection === null) {
        this._frameVisual.setCursorRadiusFactor(1)
      } else {
        const outThreshold = currentPlane.nearFieldDepth
        const inThreshold = currentPlane.physicalZoneDepth
        const distance =
          handInteractor.fieldTargetingMode === FieldTargetingMode.Direct ||
          handInteractor.fieldTargetingMode === FieldTargetingMode.BehindNearField
            ? inThreshold
            : cachedProjection.distance

        const pokeLerpValue = clamp((distance - inThreshold) / (outThreshold - inThreshold), 0, 1)
        const pinchLerpValue = 1 - clamp(handInteractor.interactionStrength ?? 0, 0, 0.8) / 0.8
        const minLerpValue = Math.min(pokeLerpValue, pinchLerpValue)

        this._frameVisual.setCursorRadiusFactor(
          MINIMUM_CURSOR_RADIUS_FACTOR + LERP_CURSOR_RADIUS_FACTOR * easingFunctions["ease-out-cubic"](minLerpValue)
        )
      }

      // Glow opacity: Only fade during Far-Near transitions to hide targeting jump
      const transitionInfo = handInteractor.fieldModeTransitionInfo
      const involveFarField =
        transitionInfo.fromMode === FieldTargetingMode.FarField || transitionInfo.toMode === FieldTargetingMode.FarField
      const isInFarNearTransition = transitionInfo.isTransitioning && involveFarField

      if (isInFarNearTransition) {
        this._frameVisual.setGlowOpacityFactor(transitionInfo.blendFactor)
        this._wasInFarNearTransition = true
      } else if (this._wasInFarNearTransition) {
        this._frameVisual.setGlowOpacityFactor(1.0)
        this._wasInFarNearTransition = false
      }
    } else {
      this._frameVisual.setCursorRadiusFactor(1)
    }
  }

  private updateGrabZoneHighlight(hoveringContent: boolean) {
    if (!hoveringContent && this._isInZone && !this._isInZoneLast && this.grabZoneOnly) {
      this.showCursorHighlight()
    }
    if (!hoveringContent && !this._isInZone && !this._isInZoneLast && this.grabZoneOnly) {
      this.hideCursorHighlight()
    }
  }

  private updateContentHover(hoveringContent: boolean, isNearField: boolean) {
    if (hoveringContent && !isNearField) {
      if (!this._hoveringContentLast) {
        this.hideCursorHighlight()
      }
    } else {
      if (this._hoveringContentLast) {
        if (!this.grabZoneOnly || (this.grabZoneOnly && this._isInZone)) {
          this.showCursorHighlight()
        }
      }
    }
    this._hoveringContentLast = hoveringContent
  }

  /**
   * Show the frame's visuals. SnapOS2: opacity tween of the body + buttons.
   * SnapOS3: drawer slides out; if autoShowHide is on, body also fades in.
   * Close button stays at full opacity in all SnapOS3 cases.
   */
  public showVisual = () => {
    this._frameVisual.setEnabled(true)
    this.tweenOpacity(this._opacity, 1)
    this._onShowVisualEvent.invoke()
  }

  /**
   * Hide the frame's visuals. SnapOS2: opacity tween + disable frame mesh.
   * SnapOS3: drawer slides behind the body; if autoShowHide is on, body
   * also fades out and the mesh disables at the end of the fade. With
   * autoShowHide off, the body stays at full opacity and enabled.
   */
  public hideVisual = () => {
    this.tweenOpacity(this._opacity, 0, () => {
      if (!this.isPanelFrame || this.autoShowHide) {
        this._frameVisual.setEnabled(false)
      }
      this._onHideVisualEvent.invoke()
    })
  }

  /**
   * tween from current opacity to target opacity, will cancel existing opacity tweens
   * @param currentOpacity
   * @param targetOpacity
   */
  public tweenOpacity = (currentOpacity: number, targetOpacity: number, endCallback = () => {}) => {
    this._opacityCancel.cancel()
    if (this.isPanelFrame) {
      // Drawer slides on every show/hide regardless of autoShowHide.
      if (targetOpacity > 0) {
        this._rightDrawer.show(this.autoShowHide ? undefined : endCallback)
      } else {
        this._rightDrawer.hide(this.autoShowHide ? undefined : endCallback)
      }
      if (!this.autoShowHide) {
        // Body and close stay visible; drawer slide is the only feedback.
        return
      }
      // Body, close button, and drawer items all fade together. The drawer
      // slide is a parallel motion; its alpha being driven here is harmless
      // (during the slide the drawer is mostly occluded by the body anyway).
      animate({
        duration: FrameConstants.opacityTweenDuration * Math.abs(targetOpacity - currentOpacity),
        update: (t: number) => {
          const a = lerp(currentOpacity, targetOpacity, t)
          this._opacity = a
          this._frameVisual.setOpacity(a)
          this._buttonHandler.opacity = a
          this._rightDrawer.opacity = a
        },
        ended: endCallback,
        cancelSet: this._opacityCancel
      })
      return
    }
    animate({
      duration: FrameConstants.opacityTweenDuration * Math.abs(targetOpacity - currentOpacity),
      update: (t: number) => {
        const a = lerp(currentOpacity, targetOpacity, t)
        this.opacity = a
        this._buttonHandler.opacity = a
        this._rightDrawer.opacity = a
      },
      ended: endCallback,
      cancelSet: this._opacityCancel
    })
  }

  /**
   * @param opacity sets opacity for all frame elements
   * Note this parameter is effected by calls to `showVisual` and `hideVisual`.
   */
  public set opacity(opacity: number) {
    if (opacity > 0) {
      this.isVisible = true
    } else {
      this.isVisible = false
    }

    this._opacity = opacity
    this._frameVisual.setEnabled(opacity > 0)
    this._frameVisual.setOpacity(opacity)
    this._buttonHandler.opacity = opacity
    this._rightDrawer.opacity = opacity
  }

  /**
   * @returns current opacity of frame elements
   */
  public get opacity(): number {
    return this._opacity
  }

  /**
   * @param _minimumSize sets the minimum size for all frame elements
   * Note this parameter controls the lower bound for scaling.
   */
  public set minimumSize(minimumSize: vec2) {
    this._minimumSize = minimumSize
    this.clampInnerSizeToBounds()
  }

  /**
   * @returns current minimum size of frame elements
   */
  public get minimumSize(): vec2 {
    return this._minimumSize
  }

  /**
   * @param _maximumSize sets the maximum size for all frame elements
   * Note this parameter controls the upper bound for scaling.
   */
  public set maximumSize(maximumSize: vec2) {
    this._maximumSize = maximumSize
    this.clampInnerSizeToBounds()
  }

  /**
   * @returns current maximum size of frame elements
   */
  public get maximumSize(): vec2 {
    return this._maximumSize
  }

  private clampInnerSizeToBounds() {
    const clampedX = MathUtils.clamp(this.innerSize.x, this.minimumSize.x, this.maximumSize.x)
    const clampedY = MathUtils.clamp(this.innerSize.y, this.minimumSize.y, this.maximumSize.y)
    if (clampedX !== this.innerSize.x || clampedY !== this.innerSize.y) {
      this.innerSize = new vec2(clampedX, clampedY)
    }
  }

  private _hoverIntensity: number = 0

  private animateCursorHighlight(target: number) {
    this._cursorHighlightCancel()
    const start = this._hoverIntensity
    animate({
      duration: FrameConstants.cursorHighlightAnimationDuration * Math.abs(target - start),
      cancelSet: this._cursorHighlightCancel,
      update: (t) => {
        this._hoverIntensity = lerp(start, target, t)
        this._frameVisual.setHoverIntensity(this._hoverIntensity)
      }
    })
  }

  private showCursorHighlight = () => this.animateCursorHighlight(1)
  private hideCursorHighlight = () => this.animateCursorHighlight(0)

  private tweenMarginSize = (targetMargin: number) => {
    const currentMargin = this._margin
    this.squeezeCancel()
    animate({
      duration: FrameConstants.squeezeTweenDuration * Math.abs(targetMargin - currentMargin),
      easing: "ease-out-back-cubic",
      update: (t: number) => {
        this._margin = lerp(currentMargin, targetMargin, t)
      },
      cancelSet: this.squeezeCancel
    })
  }
}
