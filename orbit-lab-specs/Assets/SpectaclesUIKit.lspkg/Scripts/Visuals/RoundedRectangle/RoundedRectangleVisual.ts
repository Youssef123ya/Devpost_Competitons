import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import {withAlpha} from "SpectaclesInteractionKit.lspkg/Utils/color"
import {StateName} from "../../Components/Element"
import {OpacityControllable} from "../../Interfaces/OpacityControllable"
import {colorDistance, colorLerp, isEqual} from "../../Utility/UIKitUtilities"
import {COLORS, INACTIVE_COLOR, Visual, VisualArgs, VisualParameters, VisualState} from "../Visual"
import {BorderType, GradientParameters, RoundedRectangle, RoundedRectBlendMode} from "./RoundedRectangle"

// Border-thickness changes tween on their own (snappier) duration rather than
// the shared state fade, so size pops feel quick without speeding up colors.
const BORDER_SIZE_FADE_DURATION: number = 0.15

const BACKGROUND_GRADIENT_PARAMETERS: {[key: string]: GradientParameters} = {
  default: {
    enabled: true,
    type: "Rectangle",
    stop0: {enabled: true, percent: 0, color: COLORS.darkGray},
    stop1: {enabled: true, percent: 0.5, color: COLORS.darkGray},
    stop2: {enabled: true, percent: 0.95, color: COLORS.darkGray},
    stop3: {enabled: true, percent: 0.99, color: COLORS.darkGray}
  },
  hovered: {
    enabled: true,
    type: "Rectangle",
    stop0: {enabled: true, percent: 0, color: COLORS.darkGray},
    stop1: {enabled: true, percent: 0.5, color: COLORS.darkGray},
    stop2: {enabled: true, percent: 0.95, color: COLORS.darkGray},
    stop3: {enabled: true, percent: 0.99, color: COLORS.darkGray}
  },
  toggled: {
    enabled: true,
    type: "Rectangle",
    stop0: {enabled: true, percent: -1, color: withAlpha(COLORS.brightYellow.uniformScale(0.3), 1)},
    stop1: {enabled: true, percent: -1, color: withAlpha(COLORS.brightYellow.uniformScale(0.3), 1)},
    stop2: {enabled: true, percent: -1, color: withAlpha(COLORS.brightYellow.uniformScale(0.3), 1)},
    stop3: {enabled: true, percent: 3, color: withAlpha(COLORS.brightYellow.uniformScale(0.9), 1)}
  }
}

const BORDER_GRADIENT_PARAMETERS: {[key: string]: GradientParameters} = {
  default: {
    enabled: true,
    start: new vec2(-1, 0),
    end: new vec2(1, 0),
    stop0: {enabled: true, percent: 0, color: COLORS.lightGray},
    stop1: {enabled: true, percent: 0.5, color: withAlpha(COLORS.lightGray.uniformScale(0.66), 1)},
    stop2: {enabled: true, percent: 1, color: COLORS.lightGray}
  },
  hovered: {
    enabled: true,
    start: new vec2(-1, 0),
    end: new vec2(1, 0),
    stop0: {enabled: true, percent: 0, color: withAlpha(COLORS.brightYellow.uniformScale(0.9), 1)},
    stop1: {enabled: true, percent: 0.5, color: withAlpha(COLORS.brightYellow.uniformScale(0.66), 1)},
    stop2: {enabled: true, percent: 1, color: withAlpha(COLORS.brightYellow.uniformScale(0.9), 1)}
  },
  toggled: {
    enabled: true,
    start: new vec2(-1, 0),
    end: new vec2(1, 0),
    stop0: {enabled: true, percent: 0, color: COLORS.brightYellow},
    stop1: {enabled: true, percent: 0.5, color: COLORS.brightYellow},
    stop2: {enabled: true, percent: 1, color: COLORS.brightYellow}
  },
  toggledHovered: {
    enabled: true,
    start: new vec2(-1, 0),
    end: new vec2(1, 0),
    stop0: {enabled: true, percent: 0, color: withAlpha(COLORS.brightYellow.uniformScale(0.9), 1)},
    stop1: {enabled: true, percent: 0.5, color: withAlpha(COLORS.brightYellow.uniformScale(0.66), 1)},
    stop2: {enabled: true, percent: 1, color: withAlpha(COLORS.brightYellow.uniformScale(0.9), 1)}
  }
}

/**
 * Base Types for background
 */
export type BaseType = "Color" | "Gradient" | "Texture"

export type RoundedRectangleVisualState = {
  baseType?: BaseType
  baseGradient?: GradientParameters
  baseTexture?: Texture
  borderColor?: vec4
  borderGradient?: GradientParameters
  borderSize?: number
  borderSoftness?: number
  hasBorder?: boolean
  borderType?: BorderType
} & VisualState

export type RoundedRectangleVisualParameters = {
  default: RoundedRectangleVisualState
  hovered: RoundedRectangleVisualState
  triggered: RoundedRectangleVisualState
  toggledDefault: RoundedRectangleVisualState
  toggledHovered: RoundedRectangleVisualState
  toggledTriggered: RoundedRectangleVisualState
  inactive: RoundedRectangleVisualState
} & VisualParameters

export type RoundedRectangleVisualArgs = {
  transparent?: boolean
} & VisualArgs

/**
 * The `RoundedRectangleVisual` class represents a visual component that renders a rounded rectangle
 * with customizable properties such as border, gradients, and colors. It extends the base `Visual` class
 * and provides additional functionality specific to rounded rectangles.
 *
 * @extends Visual
 */
export class RoundedRectangleVisual extends Visual implements OpacityControllable {
  // Per-state styling grouped into one object (was 56 separate fields) to stay
  // below SnapHermes' 64-own-property dictionary cliff. Pure storage relocation:
  // every accessor below reads/writes through this, render output unchanged.
  // Uniform slot shape keeps the instance monomorphic. Defaults transcribed
  // 1:1 from the previous field initializers.
  private readonly _rrStates: Record<
    "default" | "hovered" | "triggered" | "inactive" | "toggledDefault" | "toggledHovered" | "toggledTriggered",
    {
      baseType: BaseType
      gradient: GradientParameters
      texture: Texture
      hasBorder: boolean
      borderType: BorderType
      borderSize: number
      borderColor: vec4
      borderGradient: GradientParameters
    }
  > = {
    default: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.default,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.lightGray,
      borderGradient: BORDER_GRADIENT_PARAMETERS.default
    },
    hovered: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.default,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.brightYellow,
      borderGradient: BORDER_GRADIENT_PARAMETERS.hovered
    },
    triggered: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.brightYellow,
      borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
    },
    inactive: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.default,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: INACTIVE_COLOR,
      borderGradient: BORDER_GRADIENT_PARAMETERS.default
    },
    toggledDefault: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.default,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.brightYellow,
      borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
    },
    toggledHovered: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.default,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.brightYellow,
      borderGradient: BORDER_GRADIENT_PARAMETERS.toggledHovered
    },
    toggledTriggered: {
      baseType: "Color",
      gradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
      texture: null,
      hasBorder: false,
      borderType: "Gradient",
      borderSize: 0.1,
      borderColor: COLORS.brightYellow,
      borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
    }
  }

  private _gradientChangeCancelSet: CancelSet = new CancelSet()
  private currentGradient: GradientParameters = this.defaultGradient
  private baseTransientGradientOverrideActive: boolean = false
  private baseTransientGradientPositionsCaptured: boolean = false
  private readonly baseTransientGradientStartPosition: vec2 = new vec2(0, 0)
  private readonly baseTransientGradientEndPosition: vec2 = new vec2(0, 0)

  private _hasBorder: boolean = false
  private _borderColorChangeCancelSet: CancelSet = new CancelSet()
  private _borderGradientChangeCancelSet: CancelSet = new CancelSet()
  private _borderSizeChangeCancelSet: CancelSet = new CancelSet()
  private currentBorderGradient: GradientParameters = this.borderDefaultGradient
  private borderTransientGradientOverrideActive: boolean = false
  private borderTransientGradientPositionsCaptured: boolean = false
  private readonly borderTransientGradientStartPosition: vec2 = new vec2(0, 0)
  private readonly borderTransientGradientEndPosition: vec2 = new vec2(0, 0)

  private _roundedRectangleVisualStates: Map<StateName, RoundedRectangleVisualState>
  protected _state: RoundedRectangleVisualState = undefined
  protected prevState: RoundedRectangleVisualState = undefined

  protected get visualStates(): Map<StateName, RoundedRectangleVisualState> {
    return this._roundedRectangleVisualStates
  }

  /**
   * Controls the opacity of this visual.
   */
  public get opacity(): number {
    return this.roundedRectangle.opacity
  }

  /**
   * @param opacity - Opacity value in the range [0, 1].
   * @see opacity
   */
  public set opacity(opacity: number) {
    this.roundedRectangle.opacity = opacity
  }

  public set transparencyEnabled(transparencyEnabled: boolean) {
    this.roundedRectangle.blendMode = transparencyEnabled ? RoundedRectBlendMode.Normal : RoundedRectBlendMode.Disabled
  }

  public get transparencyEnabled(): boolean {
    return this.roundedRectangle.blendMode == RoundedRectBlendMode.Normal
  }

  /**
   * Gets the size of the RoundedRectangleVisual.
   *
   * @returns A `vec3` representing the dimensions of the RoundedRectangleVisual.
   */
  public get size(): vec3 {
    return super.size
  }

  /**
   * Sets the size of the RoundedRectangleVisual.
   * Updates both the internal `_size` property.
   *
   * @param size - A `vec3` object representing the dimensions of the RoundedRectangleVisual.
   */
  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    if (isEqual<vec3>(this.size, size)) {
      return
    }
    super.size = size
    if (this.initialized) {
      this.roundedRectangle.size = new vec2(size.x, size.y)
    }
  }

  /**
   * Gets the `RenderMeshVisual` associated with the rounded rectangle.
   *
   * @returns {RenderMeshVisual} The visual representation of the rounded rectangle's mesh.
   */
  public get renderMeshVisual(): RenderMeshVisual {
    return this.roundedRectangle.renderMeshVisual
  }

  /**
   * Retrieves the base color of the rounded rectangle visual.
   *
   * @returns {vec4} The background color of the rounded rectangle as a `vec4` value.
   */
  public get baseColor(): vec4 {
    return this.roundedRectangle.backgroundColor
  }

  /**
   * Indicates whether the rounded rectangle visual has a border.
   *
   * @returns `true` if the visual has a border; otherwise, `false`.
   */
  public get hasBorder(): boolean {
    return this._hasBorder
  }

  /**
   * Gets the size of the border for the rounded rectangle.
   *
   * @returns The border size as a number.
   */
  public get borderSize(): number {
    return this.roundedRectangle.borderSize
  }

  /**
   * Updates the visual state of the RoundedRectangleVisual component.
   *
   * This method overrides the base `setState` method to apply visual updates
   * specific to the RoundedRectangleVisual, such as gradients and border colors.
   *
   * @param stateName - The new state to apply, represented as a `stateName` object.
   */
  public setState(stateName: StateName) {
    super.setState(stateName)
    if (this.initialized) {
      if (!this.baseTransientGradientOverrideActive && this.shouldColorChange) {
        this.updateBaseType(this._state.baseType)
        this.updateGradient(this._state.baseGradient)
        this.updateBaseTexture(this._state.baseTexture)
      }
      if (!this.borderTransientGradientOverrideActive) {
        this.updateHasBorder(this._state.hasBorder)
        this.updateBorderType(this._state.borderType)
        this.updateBorderColors(this._state.borderColor)
        this.updateBorderGradient(this._state.borderGradient)
        this.updateBorderSize(this._state.borderSize)
      }
    }
  }

  /**
   * Constructs a new instance of the `RoundedRectangleVisual` class.
   *
   * @param sceneObject - The parent `SceneObject` to which this visual will be attached.
   */
  public constructor(args: RoundedRectangleVisualArgs) {
    super(args)
    this._sceneObject = args.sceneObject
    this.roundedRectangle = this._sceneObject.createComponent(RoundedRectangle.getTypeName())
    this.managedComponents.push(this.roundedRectangle)
    this.roundedRectangle.initialize()
    this.roundedRectangle.size = new vec2(this.size.x, this.size.y)
    this._transform = this._sceneObject.getTransform()
    if (args.transparent) {
      this.renderMeshVisual.mainPass.colorMask = new vec4b(true, true, true, true)
      this.transparencyEnabled = true
    } else {
      this.transparencyEnabled = false
    }
    this.initialize()
  }

  public destroy(): void {
    this.clearTransientGradientOverrides()
    super.destroy()
  }

  /**
   * Cancels any in-flight gradient and border color/gradient animations.
   */
  public override cancelAnimations(): void {
    this._gradientChangeCancelSet.cancel()
    this._borderColorChangeCancelSet.cancel()
    this._borderGradientChangeCancelSet.cancel()
    this._borderSizeChangeCancelSet.cancel()
    super.cancelAnimations()
  }

  private clearTransientGradientOverrides(): void {
    this.baseTransientGradientOverrideActive = false
    this.borderTransientGradientOverrideActive = false
    this.baseTransientGradientPositionsCaptured = false
    this.borderTransientGradientPositionsCaptured = false
  }

  private copyVec2(from: vec2, to: vec2): void {
    to.x = from.x
    to.y = from.y
  }

  private cloneVec2(value: vec2): vec2 {
    return new vec2(value.x, value.y)
  }

  private captureBaseTransientGradientPositions(): void {
    const start = this.roundedRectangle.gradientStartPosition
    const end = this.roundedRectangle.gradientEndPosition
    if (start === undefined || end === undefined) {
      this.baseTransientGradientPositionsCaptured = false
      return
    }

    this.copyVec2(start, this.baseTransientGradientStartPosition)
    this.copyVec2(end, this.baseTransientGradientEndPosition)
    this.baseTransientGradientPositionsCaptured = true
  }

  private captureBorderTransientGradientPositions(): void {
    const start = this.roundedRectangle.borderGradientStartPosition
    const end = this.roundedRectangle.borderGradientEndPosition
    if (start === undefined || end === undefined) {
      this.borderTransientGradientPositionsCaptured = false
      return
    }

    this.copyVec2(start, this.borderTransientGradientStartPosition)
    this.copyVec2(end, this.borderTransientGradientEndPosition)
    this.borderTransientGradientPositionsCaptured = true
  }

  private restoreBaseTransientGradientPositions(): void {
    if (!this.baseTransientGradientPositionsCaptured) {
      return
    }

    const start = this.cloneVec2(this.baseTransientGradientStartPosition)
    const end = this.cloneVec2(this.baseTransientGradientEndPosition)
    this.roundedRectangle.setBackgroundGradientPositions(start, end)
    this.currentGradient = {
      ...this.currentGradient,
      start,
      end
    }
    this.baseTransientGradientPositionsCaptured = false
  }

  private restoreBorderTransientGradientPositions(): void {
    if (!this.borderTransientGradientPositionsCaptured) {
      return
    }

    const start = this.cloneVec2(this.borderTransientGradientStartPosition)
    const end = this.cloneVec2(this.borderTransientGradientEndPosition)
    this.roundedRectangle.setBorderGradientPositions(start, end)
    this.currentBorderGradient = {
      ...this.currentBorderGradient,
      start,
      end
    }
    this.borderTransientGradientPositionsCaptured = false
  }

  private restoreTransientGradientPositions(): void {
    this.restoreBaseTransientGradientPositions()
    this.restoreBorderTransientGradientPositions()
  }

  protected set baseColor(value: vec4) {
    this.roundedRectangle.backgroundColor = value
  }

  protected updateColors(meshColor: vec4) {
    if (this.baseType !== "Color") {
      return
    }
    super.updateColors(meshColor)
  }

  /****  Rounded Rectangle explicit  ******************/

  /**
   * Gets the corner radius of the rounded rectangle.
   *
   * @returns The current corner radius of the rounded rectangle in pixels.
   */
  public get cornerRadius(): number {
    return this.roundedRectangle.cornerRadius
  }

  /**
   * Sets the corner radius of the rounded rectangle.
   *
   * @param cornerRadius - The radius of the corners in pixels.
   */
  public set cornerRadius(cornerRadius: number) {
    if (cornerRadius === undefined) {
      return
    }
    this.roundedRectangle.cornerRadius = cornerRadius
  }

  /**
   * Whether the rounded rectangle uses a gradient for its base(background).
   */
  public get baseType(): BaseType {
    if (this.roundedRectangle.useTexture) {
      return "Texture"
    } else if (this.roundedRectangle.gradient) {
      return "Gradient"
    } else {
      return "Color"
    }
  }

  /**
   * Whether the rounded rectangle uses a gradient for its base(background).
   *
   * @param gradient - A boolean indicating whether to use a gradient (`true`) or a solid color (`false`).
   */
  public set baseType(gradient: BaseType) {
    if (gradient === undefined) {
      return
    }
    switch (gradient) {
      case "Color":
        this.roundedRectangle.gradient = false
        this.roundedRectangle.useTexture = false
        break
      case "Gradient":
        this.roundedRectangle.gradient = true
        this.roundedRectangle.useTexture = false
        break
      case "Texture":
        this.roundedRectangle.gradient = false
        this.roundedRectangle.useTexture = true
        break
    }
  }

  /**
   * Gets the default gradient parameters for the visual.
   *
   * @returns The default gradient parameters.
   */
  public get defaultGradient(): GradientParameters {
    return this._rrStates.default.gradient
  }

  /**
   * Sets the default gradient parameters for the visual and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set as the default.
   */
  public set defaultGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.default.gradient, gradient)) {
      return
    }
    this._rrStates.default.gradient = gradient
    if (!this.shouldColorChange && this.baseType === "Gradient") {
      this.roundedRectangle.setBackgroundGradient(gradient)
    } else if (this.shouldColorChange) {
      if (this.initialized) {
        this.needsVisualStateUpdate = true
      }
    }
  }

  /**
   * Gets the hovered gradient parameters for the visual.
   *
   * @returns The hovered gradient parameters.
   */
  public get hoveredGradient(): GradientParameters {
    return this._rrStates.hovered.gradient
  }

  /**
   * Sets the hovered gradient parameters for the visual and initializes the visual states.
   *
   * @param hoveredGradient - The gradient parameters to be set for the hovered state.
   */
  public set hoveredGradient(hoveredGradient: GradientParameters) {
    if (hoveredGradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.hovered.gradient, hoveredGradient)) {
      return
    }
    this._rrStates.hovered.gradient = hoveredGradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered gradient parameters for the visual.
   *
   * @returns The triggered gradient parameters.
   */
  public get triggeredGradient(): GradientParameters {
    return this._rrStates.triggered.gradient
  }

  /**
   * Sets the triggered gradient parameters for the visual and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the triggered state.
   */
  public set triggeredGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.triggered.gradient, gradient)) {
      return
    }
    this._rrStates.triggered.gradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled default gradient parameters for the visual.
   *
   * @returns The toggled default gradient parameters.
   */
  public get toggledDefaultGradient(): GradientParameters {
    return this._rrStates.toggledDefault.gradient
  }

  /**
   * Sets the toggled default gradient parameters for the visual and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the toggled default state.
   */
  public set toggledDefaultGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledDefault.gradient, gradient)) {
      return
    }
    this._rrStates.toggledDefault.gradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered gradient parameters for the visual.
   *
   * @returns The toggled hovered gradient parameters.
   */
  public get toggledHoveredGradient(): GradientParameters {
    return this._rrStates.toggledHovered.gradient
  }

  /**
   * Sets the toggled hovered gradient parameters for the visual and initializes the visual states.
   *
   * @param toggledHoveredGradient - The gradient parameters to be set for the toggled hovered state.
   */
  public set toggledHoveredGradient(toggledHoveredGradient: GradientParameters) {
    if (toggledHoveredGradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledHovered.gradient, toggledHoveredGradient)) {
      return
    }
    this._rrStates.toggledHovered.gradient = toggledHoveredGradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered gradient parameters for the visual.
   *
   * @returns The toggled triggered gradient parameters.
   */
  public get toggledTriggeredGradient(): GradientParameters {
    return this._rrStates.toggledTriggered.gradient
  }

  /**
   * Sets the toggled triggered gradient parameters for the visual and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the toggled triggered state.
   */
  public set toggledTriggeredGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledTriggered.gradient, gradient)) {
      return
    }
    this._rrStates.toggledTriggered.gradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the inactive gradient parameters for the visual.
   *
   * @returns The inactive gradient parameters.
   */
  public get inactiveGradient(): GradientParameters {
    return this._rrStates.inactive.gradient
  }

  /**
   * Sets the inactive gradient parameters for the visual and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the inactive state.
   */
  public set inactiveGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.inactive.gradient, gradient)) {
      return
    }
    this._rrStates.inactive.gradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Sets the gradient start and end positions for the base of the rounded rectangle.
   *
   * @param gradientStartPosition - A 2D vector representing the starting position of the gradient.
   * @param gradientEndPosition - A 2D vector representing the ending position of the gradient.
   */
  public setBaseGradientPositions(gradientStartPosition: vec2, gradientEndPosition: vec2) {
    this.currentGradient = {
      ...this.currentGradient,
      start: gradientStartPosition,
      end: gradientEndPosition
    }
    this.roundedRectangle.setBackgroundGradientPositions(gradientStartPosition, gradientEndPosition)
  }

  /**
   * Applies a background gradient immediately, bypassing state-transition animation.
   * The transient override remains active until refreshRoundedRectangleState() or destroy().
   * Gradient positions are restored to their pre-override values on refresh.
   */
  public applyBaseGradientNow(gradient: GradientParameters): void {
    if (gradient === undefined) {
      return
    }
    if (!this.baseTransientGradientOverrideActive) {
      this.baseTransientGradientOverrideActive = true
      this.captureBaseTransientGradientPositions()
      this._gradientChangeCancelSet.cancel()
    }
    if (this.baseType !== "Gradient") {
      this.baseType = "Gradient"
    }
    this.currentGradient = gradient
    this.roundedRectangle.setBackgroundGradient(gradient)
  }

  /**
   * Gets the default texture for the rounded rectangle.
   *
   * @returns The default texture as a `Texture` value.
   */
  public get defaultTexture(): Texture {
    return this._rrStates.default.texture
  }

  /**
   * Sets the default texture for the rounded rectangle.
   *
   * @param texture - The texture to be set for the default state.
   */
  public set defaultTexture(texture: Texture) {
    if (texture === undefined) {
      return
    }
    if (this._rrStates.default.texture?.isSame(texture)) {
      return
    }
    this._rrStates.default.texture = texture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the hovered texture for the rounded rectangle.
   *
   * @returns The hovered texture as a `Texture` value.
   */
  public get hoveredTexture(): Texture {
    return this._rrStates.hovered.texture
  }

  /**
   * Sets the hovered texture for the rounded rectangle.
   *
   * @param hoveredTexture - The texture to be set for the hovered state.
   */
  public set hoveredTexture(hoveredTexture: Texture) {
    if (hoveredTexture === undefined) {
      return
    }
    if (this._rrStates.hovered.texture?.isSame(hoveredTexture)) {
      return
    }
    this._rrStates.hovered.texture = hoveredTexture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered texture for the rounded rectangle.
   *
   * @returns The triggered texture as a `Texture` value.
   */
  public get triggeredTexture(): Texture {
    return this._rrStates.triggered.texture
  }

  /**
   * Sets the triggered texture for the rounded rectangle.
   *
   * @param texture - The texture to be set for the triggered state.
   */
  public set triggeredTexture(texture: Texture) {
    if (texture === undefined) {
      return
    }
    if (this._rrStates.triggered.texture?.isSame(texture)) {
      return
    }
    this._rrStates.triggered.texture = texture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the inactive texture for the rounded rectangle.
   *
   * @returns The inactive texture as a `Texture` value.
   */
  public get inactiveTexture(): Texture {
    return this._rrStates.inactive.texture
  }

  /**
   * Sets the inactive texture for the rounded rectangle.
   *
   * @param texture - The texture to be set for the inactive state.
   */
  public set inactiveTexture(texture: Texture) {
    if (texture === undefined) {
      return
    }
    if (this._rrStates.inactive.texture?.isSame(texture)) {
      return
    }
    this._rrStates.inactive.texture = texture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled default texture for the rounded rectangle.
   *
   * @returns The toggled default texture as a `Texture` value.
   */
  public get toggledDefaultTexture(): Texture {
    return this._rrStates.toggledDefault.texture
  }

  /**
   * Sets the toggled default texture for the rounded rectangle.
   *
   * @param texture - The texture to be set for the toggled default state.
   */
  public set toggledDefaultTexture(texture: Texture) {
    if (texture === undefined) {
      return
    }
    if (this._rrStates.toggledDefault.texture?.isSame(texture)) {
      return
    }
    this._rrStates.toggledDefault.texture = texture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered texture for the rounded rectangle.
   *
   * @returns The toggled hovered texture as a `Texture` value.
   */
  public get toggledHoveredTexture(): Texture {
    return this._rrStates.toggledHovered.texture
  }

  /**
   * Sets the toggled hovered texture for the rounded rectangle.
   *
   * @param toggledHoveredTexture - The texture to be set for the toggled hovered state.
   */
  public set toggledHoveredTexture(toggledHoveredTexture: Texture) {
    if (toggledHoveredTexture === undefined) {
      return
    }
    if (this._rrStates.toggledHovered.texture?.isSame(toggledHoveredTexture)) {
      return
    }
    this._rrStates.toggledHovered.texture = toggledHoveredTexture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered texture for the rounded rectangle.
   *
   * @returns The toggled triggered texture as a `Texture` value.
   */
  public get toggledTriggeredTexture(): Texture {
    return this._rrStates.toggledTriggered.texture
  }

  /**
   * Sets the toggled triggered texture for the rounded rectangle.
   *
   * @param texture - The texture to be set for the toggled triggered state.
   */
  public set toggledTriggeredTexture(texture: Texture) {
    if (texture === undefined) {
      return
    }
    if (this._rrStates.toggledTriggered.texture?.isSame(texture)) {
      return
    }
    this._rrStates.toggledTriggered.texture = texture
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the type of border for the rounded rectangle.
   *
   * @returns The type of border, which can be either "Color" or "Gradient".
   */
  public get isBorderGradient(): boolean {
    return this.roundedRectangle.borderType === "Gradient"
  }

  /**
   * Sets whether the rounded rectangle uses a gradient for its border.
   *
   * @param gradient - A boolean indicating whether to use a gradient (`true`) or a solid color (`false`) for the border.
   */
  public set isBorderGradient(gradient: boolean) {
    if (gradient === undefined) {
      return
    }
    this.roundedRectangle.borderType = gradient ? "Gradient" : "Color"
  }

  /**
   * Gets the default color for the border of the rounded rectangle.
   *
   * @returns The default border color as a `vec4` value.
   */
  public get borderDefaultColor(): vec4 {
    return this._rrStates.default.borderColor
  }

  /**
   * Sets the default color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param color - The default color to be set for the border.
   */
  public set borderDefaultColor(color: vec4) {
    if (color === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.default.borderColor, color)) {
      return
    }
    this._rrStates.default.borderColor = color
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the hovered color for the border of the rounded rectangle.
   *
   * @returns The hovered border color as a `vec4` value.
   */
  public get borderHoveredColor(): vec4 {
    return this._rrStates.hovered.borderColor
  }

  /**
   * Sets the hovered color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param borderHoveredColor - The hovered color to be set for the border.
   */
  public set borderHoveredColor(borderHoveredColor: vec4) {
    if (borderHoveredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.hovered.borderColor, borderHoveredColor)) {
      return
    }
    this._rrStates.hovered.borderColor = borderHoveredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered color for the border of the rounded rectangle.
   *
   * @returns The triggered border color as a `vec4` value.
   */
  public get borderTriggeredColor(): vec4 {
    return this._rrStates.triggered.borderColor
  }

  /**
   * Sets the triggered color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param color - The triggered color to be set for the border.
   */
  public set borderTriggeredColor(color: vec4) {
    if (color === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.triggered.borderColor, color)) {
      return
    }
    this._rrStates.triggered.borderColor = color
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the toggled default state of the border.
   */
  public get borderToggledDefaultGradient(): GradientParameters {
    return this._rrStates.toggledDefault.borderGradient
  }

  /**
   * Sets the gradient parameters for the toggled default state of the border
   */
  public set borderToggledDefaultGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledDefault.borderGradient, gradient)) {
      return
    }
    this._rrStates.toggledDefault.borderGradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the toggled hovered state of the border.
   */
  public get borderToggledHoveredGradient(): GradientParameters {
    return this._rrStates.toggledHovered.borderGradient
  }

  /**
   * Sets the gradient parameters for the toggled hovered state of the border and initializes the visual states.
   */
  public set borderToggledHoveredGradient(borderToggledHoveredGradient: GradientParameters) {
    if (borderToggledHoveredGradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledHovered.borderGradient, borderToggledHoveredGradient)) {
      return
    }
    this._rrStates.toggledHovered.borderGradient = borderToggledHoveredGradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the toggled triggered state of the border.
   */
  public get borderToggledTriggeredGradient(): GradientParameters {
    return this._rrStates.toggledTriggered.borderGradient
  }

  /**
   * Sets the gradient parameters for the toggled triggered state of the border and initializes the visual states.
   */
  public set borderToggledTriggeredGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.toggledTriggered.borderGradient, gradient)) {
      return
    }
    this._rrStates.toggledTriggered.borderGradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the inactive color for the border of the rounded rectangle.
   *
   * @returns The inactive border color as a `vec4` value.
   */
  public get borderInactiveColor(): vec4 {
    return this._rrStates.inactive.borderColor
  }

  /**
   * Sets the inactive color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param color - The inactive color to be set for the border.
   */
  public set borderInactiveColor(color: vec4) {
    if (color === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.inactive.borderColor, color)) {
      return
    }
    this._rrStates.inactive.borderColor = color
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled default color for the border of the rounded rectangle.
   *
   * @returns The toggled default border color as a `vec4` value.
   */
  public get borderToggledDefaultColor(): vec4 {
    return this._rrStates.toggledDefault.borderColor
  }

  /**
   * Sets the toggled default color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param color - The toggled default color to be set for the border.
   */
  public set borderToggledDefaultColor(color: vec4) {
    if (color === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.toggledDefault.borderColor, color)) {
      return
    }
    this._rrStates.toggledDefault.borderColor = color
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered color for the border of the rounded rectangle.
   *
   * @returns The toggled hovered border color as a `vec4` value.
   */
  public get borderToggledHoveredColor(): vec4 {
    return this._rrStates.toggledHovered.borderColor
  }

  /**
   * Sets the toggled hovered color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param borderToggledHoveredColor - The toggled hovered color to be set for the border.
   */
  public set borderToggledHoveredColor(borderToggledHoveredColor: vec4) {
    if (borderToggledHoveredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.toggledHovered.borderColor, borderToggledHoveredColor)) {
      return
    }
    this._rrStates.toggledHovered.borderColor = borderToggledHoveredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered color for the border of the rounded rectangle.
   *
   * @returns The toggled triggered border color as a `vec4` value.
   */
  public get borderToggledTriggeredColor(): vec4 {
    return this._rrStates.toggledTriggered.borderColor
  }

  /**
   * Sets the toggled triggered color for the border of the rounded rectangle and initializes the visual states.
   *
   * @param color - The toggled triggered color to be set for the border.
   */
  public set borderToggledTriggeredColor(color: vec4) {
    if (color === undefined) {
      return
    }
    if (isEqual<vec4>(this._rrStates.toggledTriggered.borderColor, color)) {
      return
    }
    this._rrStates.toggledTriggered.borderColor = color
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the default gradient parameters for the border of the rounded rectangle.
   *
   * @returns The default border gradient parameters.
   */
  public get borderDefaultGradient(): GradientParameters {
    return this._rrStates.default.borderGradient
  }

  /**
   * Sets the gradient parameters for the default state of the border and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the default state of the border.
   */
  public set borderDefaultGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.default.borderGradient, gradient)) {
      return
    }
    this._rrStates.default.borderGradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the hovered state of the border.
   *
   * @returns The hovered border gradient parameters.
   */
  public get borderHoveredGradient(): GradientParameters {
    return this._rrStates.hovered.borderGradient
  }

  /**
   * Sets the gradient parameters for the hovered state of the border and initializes the visual states.
   *
   * @param borderHoveredGradient - The gradient parameters to be set for the hovered state of the border.
   */
  public set borderHoveredGradient(borderHoveredGradient: GradientParameters) {
    if (borderHoveredGradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.hovered.borderGradient, borderHoveredGradient)) {
      return
    }
    this._rrStates.hovered.borderGradient = borderHoveredGradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the triggered state of the border.
   *
   * @returns The triggered border gradient parameters.
   */
  public get borderTriggeredGradient(): GradientParameters {
    return this._rrStates.triggered.borderGradient
  }

  /**
   * Sets the gradient parameters for the triggered state of the border and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the triggered state of the border.
   */
  public set borderTriggeredGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.triggered.borderGradient, gradient)) {
      return
    }
    this._rrStates.triggered.borderGradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the gradient parameters for the inactive state of the border.
   *
   * @returns The inactive border gradient parameters.
   */
  public get borderInactiveGradient(): GradientParameters {
    return this._rrStates.inactive.borderGradient
  }

  /**
   * Sets the gradient parameters for the inactive state of the border and initializes the visual states.
   *
   * @param gradient - The gradient parameters to be set for the inactive state of the border.
   */
  public set borderInactiveGradient(gradient: GradientParameters) {
    if (gradient === undefined) {
      return
    }
    if (isEqual<GradientParameters>(this._rrStates.inactive.borderGradient, gradient)) {
      return
    }
    this._rrStates.inactive.borderGradient = gradient
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Sets the start and end positions for the border gradient of the rounded rectangle.
   *
   * @param gradientStartPosition - A 2D vector representing the starting position of the border gradient.
   * @param gradientEndPosition - A 2D vector representing the ending position of the border gradient.
   */
  public setBorderGradientPositions(gradientStartPosition: vec2, gradientEndPosition: vec2): void {
    this.currentBorderGradient = {
      ...this.currentBorderGradient,
      start: gradientStartPosition,
      end: gradientEndPosition
    }
    this.roundedRectangle.setBorderGradientPositions(gradientStartPosition, gradientEndPosition)
  }

  /**
   * Applies a border gradient immediately, bypassing state-transition animation.
   * The transient override remains active until refreshRoundedRectangleState() or destroy().
   * Gradient positions are restored to their pre-override values on refresh.
   */
  public applyBorderGradientNow(gradient: GradientParameters): void {
    if (gradient === undefined) {
      return
    }
    if (!this.borderTransientGradientOverrideActive) {
      this.borderTransientGradientOverrideActive = true
      this.captureBorderTransientGradientPositions()
      this._borderGradientChangeCancelSet.cancel()
    }
    if (!this._hasBorder) {
      this.updateHasBorder(true)
    }
    this.currentBorderGradient = gradient
    this.roundedRectangle.setBorderGradient(gradient)
  }

  /**
   * Gets the base type for the default state.
   *
   * @returns The base type for the default state.
   */
  public get defaultBaseType(): BaseType {
    return this._rrStates.default.baseType
  }

  /**
   * Sets the base type for the default state and initializes the visual states.
   *
   * @param baseType - The base type to be set for the default state.
   */
  public set defaultBaseType(baseType: BaseType) {
    if (baseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.default.baseType, baseType)) {
      return
    }
    this._rrStates.default.baseType = baseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the hovered state.
   *
   * @returns The base type for the hovered state.
   */
  public get hoveredBaseType(): BaseType {
    return this._rrStates.hovered.baseType
  }

  /**
   * Sets the base type for the hovered state and initializes the visual states.
   *
   * @param hoveredBaseType - The base type to be set for the hovered state.
   */
  public set hoveredBaseType(hoveredBaseType: BaseType) {
    if (hoveredBaseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.hovered.baseType, hoveredBaseType)) {
      return
    }
    this._rrStates.hovered.baseType = hoveredBaseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the triggered state.
   *
   * @returns The base type for the triggered state.
   */
  public get triggeredBaseType(): BaseType {
    return this._rrStates.triggered.baseType
  }

  /**
   * Sets the base type for the triggered state and initializes the visual states.
   *
   * @param baseType - The base type to be set for the triggered state.
   */
  public set triggeredBaseType(baseType: BaseType) {
    if (baseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.triggered.baseType, baseType)) {
      return
    }
    this._rrStates.triggered.baseType = baseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the inactive state.
   *
   * @returns The base type for the inactive state.
   */
  public get inactiveBaseType(): BaseType {
    return this._rrStates.inactive.baseType
  }

  /**
   * Sets the base type for the inactive state and initializes the visual states.
   *
   * @param baseType - The base type to be set for the inactive state.
   */
  public set inactiveBaseType(baseType: BaseType) {
    if (baseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.inactive.baseType, baseType)) {
      return
    }
    this._rrStates.inactive.baseType = baseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the toggled default state.
   *
   * @returns The base type for the toggled default state.
   */
  public get toggledDefaultBaseType(): BaseType {
    return this._rrStates.toggledDefault.baseType
  }

  /**
   * Sets the base type for the toggled default state and initializes the visual states.
   *
   * @param baseType - The base type to be set for the toggled default state.
   */
  public set toggledDefaultBaseType(baseType: BaseType) {
    if (baseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.toggledDefault.baseType, baseType)) {
      return
    }
    this._rrStates.toggledDefault.baseType = baseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the toggled hovered state.
   *
   * @returns The base type for the toggled hovered state.
   */
  public get toggledHoveredBaseType(): BaseType {
    return this._rrStates.toggledHovered.baseType
  }

  /**
   * Sets the base type for the toggled hovered state and initializes the visual states.
   *
   * @param toggledHoveredBaseType - The base type to be set for the toggled hovered state.
   */
  public set toggledHoveredBaseType(toggledHoveredBaseType: BaseType) {
    if (toggledHoveredBaseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.toggledHovered.baseType, toggledHoveredBaseType)) {
      return
    }
    this._rrStates.toggledHovered.baseType = toggledHoveredBaseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the base type for the toggled triggered state.
   *
   * @returns The base type for the toggled triggered state.
   */
  public get toggledTriggeredBaseType(): BaseType {
    return this._rrStates.toggledTriggered.baseType
  }

  /**
   * Sets the base type for the toggled triggered state and initializes the visual states.
   *
   * @param baseType - The base type to be set for the toggled triggered state.
   */
  public set toggledTriggeredBaseType(baseType: BaseType) {
    if (baseType === undefined) {
      return
    }
    if (isEqual<BaseType>(this._rrStates.toggledTriggered.baseType, baseType)) {
      return
    }
    this._rrStates.toggledTriggered.baseType = baseType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the default state has a border.
   *
   * @returns `true` if the default state has a border; otherwise, `false`.
   */
  public get defaultHasBorder(): boolean {
    return this._rrStates.default.hasBorder
  }

  /**
   * Sets whether the default state has a border and initializes the visual states.
   *
   * @param hasBorder - A boolean indicating whether the default state should have a border.
   */
  public set defaultHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.default.hasBorder, hasBorder)) {
      return
    }
    this._rrStates.default.hasBorder = hasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the hovered state has a border.
   *
   * @returns `true` if the hovered state has a border; otherwise, `false`.
   */
  public get hoveredHasBorder(): boolean {
    return this._rrStates.hovered.hasBorder
  }

  /**
   * Sets whether the hovered state has a border and initializes the visual states.
   *
   * @param hoveredHasBorder - A boolean indicating whether the hovered state should have a border.
   */
  public set hoveredHasBorder(hoveredHasBorder: boolean) {
    if (hoveredHasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.hovered.hasBorder, hoveredHasBorder)) {
      return
    }
    this._rrStates.hovered.hasBorder = hoveredHasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the triggered state has a border.
   *
   * @returns `true` if the triggered state has a border; otherwise, `false`.
   */
  public get triggeredHasBorder(): boolean {
    return this._rrStates.triggered.hasBorder
  }

  /**
   * Sets whether the triggered state has a border and initializes the visual states.
   *
   * @param hasBorder - A boolean indicating whether the triggered state should have a border.
   */
  public set triggeredHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.triggered.hasBorder, hasBorder)) {
      return
    }
    this._rrStates.triggered.hasBorder = hasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the inactive state has a border.
   *
   * @returns `true` if the inactive state has a border; otherwise, `false`.
   */
  public get inactiveHasBorder(): boolean {
    return this._rrStates.inactive.hasBorder
  }

  /**
   * Sets whether the inactive state has a border and initializes the visual states.
   *
   * @param hasBorder - A boolean indicating whether the inactive state should have a border.
   */
  public set inactiveHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.inactive.hasBorder, hasBorder)) {
      return
    }
    this._rrStates.inactive.hasBorder = hasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled default state has a border.
   *
   * @returns `true` if the toggled default state has a border; otherwise, `false`.
   */
  public get toggledDefaultHasBorder(): boolean {
    return this._rrStates.toggledDefault.hasBorder
  }

  /**
   * Sets whether the toggled default state has a border and initializes the visual states.
   *
   * @param hasBorder - A boolean indicating whether the toggled default state should have a border.
   */
  public set toggledDefaultHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.toggledDefault.hasBorder, hasBorder)) {
      return
    }
    this._rrStates.toggledDefault.hasBorder = hasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled hovered state has a border.
   *
   * @returns `true` if the toggled hovered state has a border; otherwise, `false`.
   */
  public get toggledHoveredHasBorder(): boolean {
    return this._rrStates.toggledHovered.hasBorder
  }

  /**
   * Sets whether the toggled hovered state has a border and initializes the visual states.
   *
   * @param toggledHoveredHasBorder - A boolean indicating whether the toggled hovered state should have a border.
   */
  public set toggledHoveredHasBorder(toggledHoveredHasBorder: boolean) {
    if (toggledHoveredHasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.toggledHovered.hasBorder, toggledHoveredHasBorder)) {
      return
    }
    this._rrStates.toggledHovered.hasBorder = toggledHoveredHasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled triggered state has a border.
   *
   * @returns `true` if the toggled triggered state has a border; otherwise, `false`.
   */
  public get toggledTriggeredHasBorder(): boolean {
    return this._rrStates.toggledTriggered.hasBorder
  }

  /**
   * Sets whether the toggled triggered state has a border and initializes the visual states.
   *
   * @param hasBorder - A boolean indicating whether the toggled triggered state should have a border.
   */
  public set toggledTriggeredHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    if (isEqual<boolean>(this._rrStates.toggledTriggered.hasBorder, hasBorder)) {
      return
    }
    this._rrStates.toggledTriggered.hasBorder = hasBorder
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the default state.
   *
   * @returns The border type for the default state.
   */
  public get defaultBorderType(): BorderType {
    return this._rrStates.default.borderType
  }

  /**
   * Sets the border type for the default state and initializes the visual states.
   *
   * @param borderType - The border type to be set for the default state.
   */
  public set defaultBorderType(borderType: BorderType) {
    if (borderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.default.borderType, borderType)) {
      return
    }
    this._rrStates.default.borderType = borderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the hovered state.
   *
   * @returns The border type for the hovered state.
   */
  public get hoveredBorderType(): BorderType {
    return this._rrStates.hovered.borderType
  }

  /**
   * Sets the border type for the hovered state and initializes the visual states.
   *
   * @param hoveredBorderType - The border type to be set for the hovered state.
   */
  public set hoveredBorderType(hoveredBorderType: BorderType) {
    if (hoveredBorderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.hovered.borderType, hoveredBorderType)) {
      return
    }
    this._rrStates.hovered.borderType = hoveredBorderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the triggered state.
   *
   * @returns The border type for the triggered state.
   */
  public get triggeredBorderType(): BorderType {
    return this._rrStates.triggered.borderType
  }

  /**
   * Sets the border type for the triggered state and initializes the visual states.
   *
   * @param borderType - The border type to be set for the triggered state.
   */
  public set triggeredBorderType(borderType: BorderType) {
    if (borderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.triggered.borderType, borderType)) {
      return
    }
    this._rrStates.triggered.borderType = borderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the inactive state.
   *
   * @returns The border type for the inactive state.
   */
  public get inactiveBorderType(): BorderType {
    return this._rrStates.inactive.borderType
  }

  /**
   * Sets the border type for the inactive state and initializes the visual states.
   *
   * @param borderType - The border type to be set for the inactive state.
   */
  public set inactiveBorderType(borderType: BorderType) {
    if (borderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.inactive.borderType, borderType)) {
      return
    }
    this._rrStates.inactive.borderType = borderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the toggled default state.
   *
   * @returns The border type for the toggled default state.
   */
  public get toggledDefaultBorderType(): BorderType {
    return this._rrStates.toggledDefault.borderType
  }

  /**
   * Sets the border type for the toggled default state and initializes the visual states.
   *
   * @param borderType - The border type to be set for the toggled default state.
   */
  public set toggledDefaultBorderType(borderType: BorderType) {
    if (borderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.toggledDefault.borderType, borderType)) {
      return
    }
    this._rrStates.toggledDefault.borderType = borderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the toggled hovered state.
   *
   * @returns The border type for the toggled hovered state.
   */
  public get toggledHoveredBorderType(): BorderType {
    return this._rrStates.toggledHovered.borderType
  }

  /**
   * Sets the border type for the toggled hovered state and initializes the visual states.
   *
   * @param toggledHoveredBorderType - The border type to be set for the toggled hovered state.
   */
  public set toggledHoveredBorderType(toggledHoveredBorderType: BorderType) {
    if (toggledHoveredBorderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.toggledHovered.borderType, toggledHoveredBorderType)) {
      return
    }
    this._rrStates.toggledHovered.borderType = toggledHoveredBorderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border type for the toggled triggered state.
   *
   * @returns The border type for the toggled triggered state.
   */
  public get toggledTriggeredBorderType(): BorderType {
    return this._rrStates.toggledTriggered.borderType
  }

  /**
   * Sets the border type for the toggled triggered state and initializes the visual states.
   *
   * @param borderType - The border type to be set for the toggled triggered state.
   */
  public set toggledTriggeredBorderType(borderType: BorderType) {
    if (borderType === undefined) {
      return
    }
    if (isEqual<BorderType>(this._rrStates.toggledTriggered.borderType, borderType)) {
      return
    }
    this._rrStates.toggledTriggered.borderType = borderType
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the default state.
   *
   * @returns The border size for the default state.
   */
  public get defaultBorderSize(): number {
    return this._rrStates.default.borderSize
  }

  /**
   * Sets the border size for the default state and initializes the visual states.
   *
   * @param borderSize - The border size to be set for the default state.
   */
  public set defaultBorderSize(borderSize: number) {
    if (borderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.default.borderSize, borderSize)) {
      return
    }
    this._rrStates.default.borderSize = borderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the hovered state.
   *
   * @returns The border size for the hovered state.
   */
  public get hoveredBorderSize(): number {
    return this._rrStates.hovered.borderSize
  }

  /**
   * Sets the border size for the hovered state and initializes the visual states.
   *
   * @param hoveredBorderSize - The border size to be set for the hovered state.
   */
  public set hoveredBorderSize(hoveredBorderSize: number) {
    if (hoveredBorderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.hovered.borderSize, hoveredBorderSize)) {
      return
    }
    this._rrStates.hovered.borderSize = hoveredBorderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the triggered state.
   *
   * @returns The border size for the triggered state.
   */
  public get triggeredBorderSize(): number {
    return this._rrStates.triggered.borderSize
  }

  /**
   * Sets the border size for the triggered state and initializes the visual states.
   *
   * @param borderSize - The border size to be set for the triggered state.
   */
  public set triggeredBorderSize(borderSize: number) {
    if (borderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.triggered.borderSize, borderSize)) {
      return
    }
    this._rrStates.triggered.borderSize = borderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the inactive state.
   *
   * @returns The border size for the inactive state.
   */
  public get inactiveBorderSize(): number {
    return this._rrStates.inactive.borderSize
  }

  /**
   * Sets the border size for the inactive state and initializes the visual states.
   *
   * @param borderSize - The border size to be set for the inactive state.
   */
  public set inactiveBorderSize(borderSize: number) {
    if (borderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.inactive.borderSize, borderSize)) {
      return
    }
    this._rrStates.inactive.borderSize = borderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the toggled default state.
   *
   * @returns The border size for the toggled default state.
   */
  public get toggledDefaultBorderSize(): number {
    return this._rrStates.toggledDefault.borderSize
  }

  /**
   * Sets the border size for the toggled default state and initializes the visual states.
   *
   * @param borderSize - The border size to be set for the toggled default state.
   */
  public set toggledDefaultBorderSize(borderSize: number) {
    if (borderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.toggledDefault.borderSize, borderSize)) {
      return
    }
    this._rrStates.toggledDefault.borderSize = borderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the toggled hovered state.
   *
   * @returns The border size for the toggled hovered state.
   */
  public get toggledHoveredBorderSize(): number {
    return this._rrStates.toggledHovered.borderSize
  }

  /**
   * Sets the border size for the toggled hovered state and initializes the visual states.
   *
   * @param toggledHoveredBorderSize - The border size to be set for the toggled hovered state.
   */
  public set toggledHoveredBorderSize(toggledHoveredBorderSize: number) {
    if (toggledHoveredBorderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.toggledHovered.borderSize, toggledHoveredBorderSize)) {
      return
    }
    this._rrStates.toggledHovered.borderSize = toggledHoveredBorderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the border size for the toggled triggered state.
   *
   * @returns The border size for the toggled triggered state.
   */
  public get toggledTriggeredBorderSize(): number {
    return this._rrStates.toggledTriggered.borderSize
  }

  /**
   * Sets the border size for the toggled triggered state and initializes the visual states.
   *
   * @param borderSize - The border size to be set for the toggled triggered state.
   */
  public set toggledTriggeredBorderSize(borderSize: number) {
    if (borderSize === undefined) {
      return
    }
    if (isEqual<number>(this._rrStates.toggledTriggered.borderSize, borderSize)) {
      return
    }
    this._rrStates.toggledTriggered.borderSize = borderSize
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  protected updateGradient(gradient: GradientParameters) {
    if (this.baseTransientGradientOverrideActive || !this.shouldColorChange || this.baseType !== "Gradient") {
      return
    }
    const initalGradient = this.currentGradient
    const remaining = GradientParameters.distance(gradient, initalGradient)
    const full = this.prevState?.baseGradient
      ? GradientParameters.distance(gradient, this.prevState.baseGradient)
      : remaining

    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : 0
    this._gradientChangeCancelSet.cancel()
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._gradientChangeCancelSet,
      update: (t) => {
        this.currentGradient = GradientParameters.lerp(initalGradient, gradient, t)
        this.roundedRectangle.setBackgroundGradient(this.currentGradient)
      },
      ended: () => {
        this.currentGradient = gradient
        this.roundedRectangle.setBackgroundGradient(this.currentGradient)
      }
    })
  }

  private forceRestoreBaseGradient(gradient: GradientParameters): void {
    if (gradient === undefined || this.baseType !== "Gradient") {
      return
    }

    this._gradientChangeCancelSet.cancel()
    this.currentGradient = gradient
    this.roundedRectangle.setBackgroundGradient(this.currentGradient)
  }

  protected updateBaseTexture(texture: Texture) {
    if (this.baseType !== "Texture") {
      return
    }
    this.roundedRectangle.texture = texture
  }

  protected updateBorderColors(borderColor: vec4) {
    if (!this.hasBorder || this.isBorderGradient) {
      return
    }
    const initialBorderColor = this.roundedRectangle.borderColor
    const remaining = colorDistance(borderColor, initialBorderColor)
    const full = this.prevState?.borderColor ? colorDistance(borderColor, this.prevState.borderColor) : remaining
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : 0
    this._borderColorChangeCancelSet.cancel()
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._borderColorChangeCancelSet,
      update: (t) => {
        this.roundedRectangle.borderColor = colorLerp(initialBorderColor, borderColor, t)
      }
    })
  }

  protected updateBorderGradient(gradient: GradientParameters) {
    if (this.borderTransientGradientOverrideActive || !this.hasBorder || !this.isBorderGradient) {
      return
    }
    const initalGradient = this.currentBorderGradient
    const remaining = GradientParameters.distance(gradient, initalGradient)
    const full = this.prevState?.borderGradient
      ? GradientParameters.distance(gradient, this.prevState.borderGradient)
      : remaining

    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : 0
    this._borderGradientChangeCancelSet.cancel()
    animate({
      duration: ratio * this.animateDuration,
      cancelSet: this._borderGradientChangeCancelSet,
      update: (t) => {
        this.currentBorderGradient = GradientParameters.lerp(initalGradient, gradient, t)
        this.roundedRectangle.setBorderGradient(this.currentBorderGradient)
      },
      ended: () => {
        this.currentBorderGradient = gradient
        this.roundedRectangle.setBorderGradient(this.currentBorderGradient)
      }
    })
  }

  private forceRestoreBorderGradient(gradient: GradientParameters): void {
    if (gradient === undefined || !this.hasBorder || !this.isBorderGradient) {
      return
    }

    this._borderGradientChangeCancelSet.cancel()
    this.currentBorderGradient = gradient
    this.roundedRectangle.setBorderGradient(this.currentBorderGradient)
  }

  protected updateBorderSize(borderSize: number) {
    if (!this.hasBorder || borderSize === undefined) {
      return
    }
    const from = this.roundedRectangle.borderSize
    this._borderSizeChangeCancelSet.cancel()
    if (from === borderSize) {
      return
    }
    // Snap on the first state application (no prior state) or when animation is
    // off; otherwise tween so border-thickness changes don't pop.
    if (!this.prevState || this.animateDuration <= 0) {
      this.roundedRectangle.borderSize = borderSize
      return
    }
    animate({
      duration: BORDER_SIZE_FADE_DURATION,
      cancelSet: this._borderSizeChangeCancelSet,
      update: (t) => {
        this.roundedRectangle.borderSize = from + (borderSize - from) * t
      }
    })
  }

  protected updateHasBorder(hasBorder: boolean) {
    if (hasBorder === undefined) {
      return
    }
    this._hasBorder = hasBorder
    if (this.initialized) {
      this.roundedRectangle.border = hasBorder
    }
  }

  protected updateBaseType(isBaseGradient: BaseType) {
    if (isBaseGradient !== undefined) {
      this.baseType = isBaseGradient
    }
  }

  protected updateBorderType(borderType: BorderType) {
    if (borderType !== undefined) {
      this.isBorderGradient = borderType === "Gradient"
    }
  }

  /**
   * Re-applies the current visual state's rounded-rectangle styling.
   * This restores state-owned gradients after transient direct overrides.
   */
  public refreshRoundedRectangleState(): void {
    if (!this._state) {
      return
    }

    const shouldForceRestoreBaseGradient = this.baseTransientGradientOverrideActive
    const shouldForceRestoreBorderGradient = this.borderTransientGradientOverrideActive
    this.baseTransientGradientOverrideActive = false
    this.borderTransientGradientOverrideActive = false
    this.restoreTransientGradientPositions()
    this.updateBaseType(this._state.baseType)
    if (this._state.baseColor !== undefined) {
      this.updateColors(this._state.baseColor)
    }
    if (this._state.baseGradient !== undefined) {
      if (shouldForceRestoreBaseGradient) {
        this.forceRestoreBaseGradient(this._state.baseGradient)
      } else {
        this.updateGradient(this._state.baseGradient)
      }
    }
    if (this._state.baseTexture !== undefined) {
      this.updateBaseTexture(this._state.baseTexture)
    }
    this.updateHasBorder(this._state.hasBorder)
    this.updateBorderType(this._state.borderType)
    if (this._state.borderColor !== undefined) {
      this.updateBorderColors(this._state.borderColor)
    }
    if (this._state.borderGradient !== undefined) {
      if (shouldForceRestoreBorderGradient) {
        this.forceRestoreBorderGradient(this._state.borderGradient)
      } else {
        this.updateBorderGradient(this._state.borderGradient)
      }
    }
    if (this._state.borderSize !== undefined) {
      this.updateBorderSize(this._state.borderSize)
    }
  }

  /**
   * Prints the configuration of the rounded rectangle visual to the console.
   */
  public printConfig(): void {
    this.roundedRectangle.printConfig()
  }

  protected applyStyleParameters(parameters: Partial<RoundedRectangleVisualParameters>) {
    // First call the parent method to handle base VisualState properties
    super.applyStyleParameters(parameters)

    // Then handle RoundedRectangle-specific properties
    // BaseType flags
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, BaseType>(
      parameters,
      "baseType",
      {
        default: (value) => (this.defaultBaseType = value),
        hovered: (value) => (this.hoveredBaseType = value),
        triggered: (value) => (this.triggeredBaseType = value),
        inactive: (value) => (this.inactiveBaseType = value),
        toggledDefault: (value) => (this.toggledDefaultBaseType = value),
        toggledHovered: (value) => (this.toggledHoveredBaseType = value),
        toggledTriggered: (value) => (this.toggledTriggeredBaseType = value)
      }
    )

    // Base gradient parameters
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, GradientParameters>(
      parameters,
      "baseGradient",
      {
        default: (value) => (this.defaultGradient = value),
        hovered: (value) => (this.hoveredGradient = value),
        triggered: (value) => (this.triggeredGradient = value),
        inactive: (value) => (this.inactiveGradient = value),
        toggledDefault: (value) => (this.toggledDefaultGradient = value),
        toggledHovered: (value) => (this.toggledHoveredGradient = value),
        toggledTriggered: (value) => (this.toggledTriggeredGradient = value)
      }
    )

    // Base texture parameters
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, Texture>(
      parameters,
      "baseTexture",
      {
        default: (value) => (this.defaultTexture = value),
        hovered: (value) => (this.hoveredTexture = value),
        triggered: (value) => (this.triggeredTexture = value),
        inactive: (value) => (this.inactiveTexture = value),
        toggledDefault: (value) => (this.toggledDefaultTexture = value),
        toggledHovered: (value) => (this.toggledHoveredTexture = value),
        toggledTriggered: (value) => (this.toggledTriggeredTexture = value)
      }
    )

    // HasBorder flags
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, boolean>(
      parameters,
      "hasBorder",
      {
        default: (value) => (this.defaultHasBorder = value),
        hovered: (value) => (this.hoveredHasBorder = value),
        triggered: (value) => (this.triggeredHasBorder = value),
        inactive: (value) => (this.inactiveHasBorder = value),
        toggledDefault: (value) => (this.toggledDefaultHasBorder = value),
        toggledHovered: (value) => (this.toggledHoveredHasBorder = value),
        toggledTriggered: (value) => (this.toggledTriggeredHasBorder = value)
      }
    )

    // Border types
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, BorderType>(
      parameters,
      "borderType",
      {
        default: (value) => (this.defaultBorderType = value),
        hovered: (value) => (this.hoveredBorderType = value),
        triggered: (value) => (this.triggeredBorderType = value),
        inactive: (value) => (this.inactiveBorderType = value),
        toggledDefault: (value) => (this.toggledDefaultBorderType = value),
        toggledHovered: (value) => (this.toggledHoveredBorderType = value),
        toggledTriggered: (value) => (this.toggledTriggeredBorderType = value)
      }
    )

    // Border sizes
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, number>(
      parameters,
      "borderSize",
      {
        default: (value) => (this.defaultBorderSize = value),
        hovered: (value) => (this.hoveredBorderSize = value),
        triggered: (value) => (this.triggeredBorderSize = value),
        inactive: (value) => (this.inactiveBorderSize = value),
        toggledDefault: (value) => (this.toggledDefaultBorderSize = value),
        toggledHovered: (value) => (this.toggledHoveredBorderSize = value),
        toggledTriggered: (value) => (this.toggledTriggeredBorderSize = value)
      }
    )

    // Border softness — constant across states; read once from the default
    // state and applied directly to the squircle (no-op until the material
    // exposes the borderSoftness uniform).
    const borderSoftness = parameters.default?.borderSoftness
    if (borderSoftness !== undefined) {
      this.roundedRectangle.borderSoftness = borderSoftness
    }

    // Border colors
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, vec4>(
      parameters,
      "borderColor",
      {
        default: (value) => (this.borderDefaultColor = value),
        hovered: (value) => (this.borderHoveredColor = value),
        triggered: (value) => (this.borderTriggeredColor = value),
        inactive: (value) => (this.borderInactiveColor = value),
        toggledDefault: (value) => (this.borderToggledDefaultColor = value),
        toggledHovered: (value) => (this.borderToggledHoveredColor = value),
        toggledTriggered: (value) => (this.borderToggledTriggeredColor = value)
      }
    )

    // Border gradients
    this.applyStyleProperty<Partial<RoundedRectangleVisualParameters>, RoundedRectangleVisualState, GradientParameters>(
      parameters,
      "borderGradient",
      {
        default: (value) => (this.borderDefaultGradient = value),
        hovered: (value) => (this.borderHoveredGradient = value),
        triggered: (value) => (this.borderTriggeredGradient = value),
        inactive: (value) => (this.borderInactiveGradient = value),
        toggledDefault: (value) => (this.borderToggledDefaultGradient = value),
        toggledHovered: (value) => (this.borderToggledHoveredGradient = value),
        toggledTriggered: (value) => (this.borderToggledTriggeredGradient = value)
      }
    )
  }

  protected updateVisualStates(): void {
    this._roundedRectangleVisualStates = new Map([
      [
        StateName.default,
        {
          baseColor: this.baseDefaultColor,
          baseType: this.defaultBaseType,
          hasBorder: this.defaultHasBorder,
          borderSize: this.defaultBorderSize,
          borderType: this.defaultBorderType,
          baseGradient: this.defaultGradient,
          baseTexture: this.defaultTexture,
          borderColor: this.borderDefaultColor,
          borderGradient: this.borderDefaultGradient,
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
          baseType: this.hoveredBaseType,
          baseGradient: this.hoveredGradient,
          baseTexture: this.hoveredTexture,
          hasBorder: this.hoveredHasBorder,
          borderSize: this.hoveredBorderSize,
          borderColor: this.borderHoveredColor,
          borderGradient: this.borderHoveredGradient,
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
          baseType: this.triggeredBaseType,
          baseGradient: this.triggeredGradient,
          baseTexture: this.triggeredTexture,
          hasBorder: this.triggeredHasBorder,
          borderSize: this.triggeredBorderSize,
          borderColor: this.borderTriggeredColor,
          borderGradient: this.borderTriggeredGradient,
          shouldPosition: this.triggeredShouldPosition,
          shouldScale: this.triggeredShouldScale,
          localScale: this.triggeredScale,
          localPosition: this.triggeredPosition
        }
      ],
      [
        StateName.toggledHovered,
        {
          baseColor: this.baseToggledHoveredColor,
          baseType: this.toggledHoveredBaseType,
          baseGradient: this.toggledHoveredGradient,
          baseTexture: this.toggledHoveredTexture,
          hasBorder: this.toggledHoveredHasBorder,
          borderSize: this.toggledHoveredBorderSize,
          borderColor: this.borderToggledHoveredColor,
          borderGradient: this.borderToggledHoveredGradient,
          shouldPosition: this.toggledHoveredShouldPosition,
          shouldScale: this.toggledHoveredShouldScale,
          localScale: this.toggledHoveredScale,
          localPosition: this.toggledHoveredPosition
        }
      ],
      [
        StateName.toggledDefault,
        {
          baseColor: this.baseToggledDefaultColor,
          baseType: this.toggledDefaultBaseType,
          baseGradient: this.toggledDefaultGradient,
          baseTexture: this.toggledDefaultTexture,
          hasBorder: this.toggledDefaultHasBorder,
          borderSize: this.toggledDefaultBorderSize,
          borderColor: this.borderToggledDefaultColor,
          borderGradient: this.borderToggledDefaultGradient,
          shouldPosition: this.toggledDefaultShouldPosition,
          shouldScale: this.toggledDefaultShouldScale,
          localScale: this.toggledScale,
          localPosition: this.toggledPosition
        }
      ],
      [
        StateName.toggledTriggered,
        {
          baseColor: this.baseToggledTriggeredColor,
          baseType: this.toggledTriggeredBaseType,
          baseGradient: this.toggledTriggeredGradient,
          baseTexture: this.toggledTriggeredTexture,
          hasBorder: this.toggledTriggeredHasBorder,
          borderSize: this.toggledTriggeredBorderSize,
          borderColor: this.borderToggledTriggeredColor,
          borderGradient: this.borderToggledTriggeredGradient,
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
          baseType: this.defaultBaseType,
          baseGradient: this.defaultGradient,
          baseTexture: this.defaultTexture,
          hasBorder: this.defaultHasBorder,
          borderSize: this.defaultBorderSize,
          borderColor: this.baseErrorColor,
          borderGradient: this.borderDefaultGradient,
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
          baseType: this.hoveredBaseType,
          baseGradient: this.hoveredGradient,
          baseTexture: this.hoveredTexture,
          hasBorder: this.hoveredHasBorder,
          borderSize: this.hoveredBorderSize,
          borderColor: this.baseErrorColor,
          borderGradient: this.borderHoveredGradient,
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
          baseType: this.inactiveBaseType,
          baseGradient: this.inactiveGradient,
          baseTexture: this.inactiveTexture,
          hasBorder: this.inactiveHasBorder,
          borderSize: this.inactiveBorderSize,
          borderColor: this.borderInactiveColor,
          borderGradient: this.borderInactiveGradient,
          shouldPosition: this.inactiveShouldPosition,
          shouldScale: this.inactiveShouldScale,
          localScale: this.inactiveScale,
          localPosition: this.inactivePosition
        }
      ]
    ])
    super.updateVisualStates()
  }

  private get roundedRectangle(): RoundedRectangle {
    return this._visualComponent as RoundedRectangle
  }

  private set roundedRectangle(value: RoundedRectangle) {
    this._visualComponent = value
  }
}
