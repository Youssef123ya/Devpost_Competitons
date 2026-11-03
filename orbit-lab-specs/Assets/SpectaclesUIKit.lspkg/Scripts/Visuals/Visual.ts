import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import {HSLToRGB, withAlpha} from "SpectaclesInteractionKit.lspkg/Utils/color"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {StateName} from "../Components/Element"
import {DepthSettingsControllable} from "../Interfaces/DepthSettingsControllable"
import {ThemeService} from "../Themes/ThemeService"
import {colorDistance, colorLerp, isEqual} from "../Utility/UIKitUtilities"

export const COLORS: {[key: string]: vec4} = {
  gray: withAlpha(HSLToRGB(new vec3(0, 0, 0.4)), 1),
  darkGray: withAlpha(HSLToRGB(new vec3(0, 0, 0.24)), 1),
  lightGray: withAlpha(HSLToRGB(new vec3(0, 0, 0.56)), 1),
  brightYellow: withAlpha(HSLToRGB(new vec3(47.7, 0.8, 0.55)), 1),
  brighterYellow: withAlpha(HSLToRGB(new vec3(41.7, 0.847, 0.9253)), 1)
}

// mesh
export const ERROR_COLOR = new vec4(0.8, 0.2, 0.2, 1)
export const INACTIVE_COLOR = new vec4(0.2, 0.2, 0.2, 0.2)

const log = new NativeLogger("Visual")

const DEFAULT_FADE_DURATION: number = 0.2

export type VisualState = {
  baseColor?: vec4
  shouldPosition?: boolean
  shouldScale?: boolean
  localScale?: vec3
  localPosition?: vec3
}

export type VisualParameters = {
  default: VisualState
  hovered: VisualState
  triggered: VisualState
  toggledDefault: VisualState
  toggledHovered: VisualState
  inactive: VisualState
}

export type VisualStyleKey = {
  visualElementType: string
  style: string
  themeName?: string
}

export interface VisualDepthSettings {
  depthWrite: boolean
  depthTest: boolean
}

export type VisualArgs = {
  sceneObject: SceneObject
  style?: VisualStyleKey | Partial<VisualParameters>
  depthSettings?: VisualDepthSettings
}

type ScaleChangeArgs = {
  from: vec3
  current: vec3
}

type ColliderBoundsChangeArgs = {
  sizeOffset: vec3
  centerOffset: vec3
}

/**
 * The `Visual` abstract class serves as a base class for creating visual components
 * with customizable states, animations, and interactions. It provides a framework
 * for managing visual properties such as color, scale, and position states.
 *
 * @abstract
 */
export abstract class Visual implements DepthSettingsControllable {
  protected _sceneObject: SceneObject
  protected _transform: Transform
  protected _visualComponent: ScriptComponent

  private _size: vec3 = new vec3(1, 1, 1)

  private _currentPosition: vec3 = vec3.zero()
  private _currentScale: vec3 = vec3.one()

  // Per-state storage grouped into one object to keep instance own-property
  // count below SnapHermes' 64-property dictionary cliff (was 38 separate
  // fields). Pure storage relocation — every public/protected accessor below
  // reads/writes through this, behavior unchanged. Uniform slot shape across
  // all states keeps the instance shape monomorphic. `error` carries
  // shouldPosition/shouldScale for shape uniformity; they are unused (the
  // error state borrows default's should-flags in the visualStates builders).
  protected readonly _states = {
    default: {
      color: COLORS.darkGray,
      scale: vec3.one(),
      position: vec3.zero(),
      shouldPosition: false,
      shouldScale: false
    },
    hovered: {
      color: COLORS.brightYellow,
      scale: vec3.one(),
      position: vec3.zero(),
      shouldPosition: false,
      shouldScale: false
    },
    triggered: {
      color: COLORS.brightYellow.uniformScale(0.3),
      scale: new vec3(0.9, 0.9, 0.9),
      position: new vec3(0, 0, 0.5),
      shouldPosition: false,
      shouldScale: false
    },
    toggledDefault: {
      color: COLORS.brightYellow.uniformScale(0.3),
      scale: new vec3(1.05, 1.05, 1.05),
      position: vec3.forward(),
      shouldPosition: false,
      shouldScale: false
    },
    toggledHovered: {
      color: COLORS.brightYellow.uniformScale(0.3),
      scale: new vec3(1.05, 1.05, 1.05),
      position: vec3.forward(),
      shouldPosition: false,
      shouldScale: false
    },
    toggledTriggered: {
      color: COLORS.brightYellow.uniformScale(0.3),
      scale: new vec3(1, 1, 1),
      position: new vec3(0, 0, 0.5),
      shouldPosition: false,
      shouldScale: false
    },
    inactive: {
      color: INACTIVE_COLOR,
      scale: vec3.one(),
      position: vec3.zero(),
      shouldPosition: false,
      shouldScale: false
    },
    error: {
      color: ERROR_COLOR,
      scale: vec3.one(),
      position: vec3.zero(),
      shouldPosition: false,
      shouldScale: false
    }
  }

  private _shouldColorChange: boolean = true
  private _shouldScale: boolean = false
  private _shouldTranslate: boolean = false

  protected prevState: VisualState = undefined
  protected _state: VisualState = undefined
  private stateName: StateName = StateName.default

  protected visualArgs: VisualArgs

  protected initialized = false

  // Amount of time it takes to animate 1 unit of distance
  private _animateDuration: number = DEFAULT_FADE_DURATION

  private _colorChangeCancelSet: CancelSet = new CancelSet()
  private _updateScaleCancelSet: CancelSet = new CancelSet()
  private _updatePositionCancelSet: CancelSet = new CancelSet()

  private onInitializedEvent: Event<void> = new Event<void>()
  private _onInitialized?: PublicApi<void>
  public get onInitialized(): PublicApi<void> {
    return (this._onInitialized ??= this.onInitializedEvent.publicApi())
  }
  private onDestroyedEvent: Event<void> = new Event<void>()
  private _onDestroyed?: PublicApi<void>
  public get onDestroyed(): PublicApi<void> {
    return (this._onDestroyed ??= this.onDestroyedEvent.publicApi())
  }

  private onScaleChangedEvent: Event<ScaleChangeArgs> = new Event<ScaleChangeArgs>()
  private _onScaleChanged?: PublicApi<ScaleChangeArgs>
  public get onScaleChanged(): PublicApi<ScaleChangeArgs> {
    return (this._onScaleChanged ??= this.onScaleChangedEvent.publicApi())
  }
  private onPositionChangedEvent: Event<ScaleChangeArgs> = new Event<ScaleChangeArgs>()
  private _onPositionChanged?: PublicApi<ScaleChangeArgs>
  public get onPositionChanged(): PublicApi<ScaleChangeArgs> {
    return (this._onPositionChanged ??= this.onPositionChangedEvent.publicApi())
  }
  private readonly onContentZOffsetChangedEvent: Event<number> = new Event<number>()
  private _onContentZOffsetChanged?: PublicApi<number>
  public get onContentZOffsetChanged(): PublicApi<number> {
    return (this._onContentZOffsetChanged ??= this.onContentZOffsetChangedEvent.publicApi())
  }
  private readonly onColliderBoundsChangedEvent: Event<ColliderBoundsChangeArgs> = new Event<ColliderBoundsChangeArgs>()
  private _onColliderBoundsChanged?: PublicApi<ColliderBoundsChangeArgs>
  public get onColliderBoundsChanged(): PublicApi<ColliderBoundsChangeArgs> {
    return (this._onColliderBoundsChanged ??= this.onColliderBoundsChangedEvent.publicApi())
  }

  public abstract get renderMeshVisual(): RenderMeshVisual
  public abstract get hasBorder(): boolean
  public abstract get borderSize(): number
  public abstract get baseColor(): vec4
  protected abstract set baseColor(value: vec4)
  protected abstract get visualStates(): Map<StateName, VisualState>
  private _needsVisualStateUpdate: boolean = true
  private _visualStateUpdateEvent?: SceneEvent
  /**
   * Schedules a one-shot visual-state rebuild on the next LateUpdate. Setting
   * this `true` enables the (otherwise-disabled) update event; the handler runs
   * once and disables it again — so an idle Visual costs no per-frame trampoline.
   * All `= true` writers (this class + subclasses) route through this setter.
   */
  protected get needsVisualStateUpdate(): boolean {
    return this._needsVisualStateUpdate
  }
  protected set needsVisualStateUpdate(value: boolean) {
    this._needsVisualStateUpdate = value
    if (value && this._visualStateUpdateEvent !== undefined) {
      this._visualStateUpdateEvent.enabled = true
    }
  }

  protected managedComponents: Component[] = []

  /**
   * Gets the associated `SceneObject` instance.
   *
   * @returns {SceneObject} The `SceneObject` associated with this visual.
   */
  public get sceneObject(): SceneObject {
    return this._sceneObject
  }

  /**
   * Controls whether this visual participates in depth testing.
   */
  public get depthTest(): boolean {
    return this.renderMeshVisual.mainPass.depthTest
  }

  /**
   * Controls whether this visual participates in depth testing.
   *
   * @param depthTest - Whether depth testing is enabled for this visual.
   * @see depthTest
   */
  public set depthTest(depthTest: boolean) {
    this.renderMeshVisual.mainPass.depthTest = depthTest
  }

  /**
   * Controls whether this visual writes to the depth buffer.
   */
  public get depthWrite(): boolean {
    return this.renderMeshVisual.mainPass.depthWrite
  }

  /**
   * Controls whether this visual writes to the depth buffer.
   *
   * @param depthWrite - Whether depth writing is enabled for this visual.
   * @see depthWrite
   */
  public set depthWrite(depthWrite: boolean) {
    this.renderMeshVisual.mainPass.depthWrite = depthWrite
  }

  /**
   * Additional local +Z offset companion content should apply to render in
   * front of this visual. Most visuals are flat and need no extra offset.
   */
  public get contentZOffset(): number {
    return 0
  }

  protected notifyContentZOffsetChanged(contentZOffset: number): void {
    this.onContentZOffsetChangedEvent.invoke(contentZOffset)
  }

  /**
   * Additional size to add to the owning element's fitted collider.
   */
  public get colliderSizeOffset(): vec3 {
    return vec3.zero()
  }

  /**
   * Additional local position to add to the owning element's fitted collider.
   */
  public get colliderCenterOffset(): vec3 {
    return vec3.zero()
  }

  protected notifyColliderBoundsChanged(): void {
    this.onColliderBoundsChangedEvent.invoke({
      sizeOffset: this.colliderSizeOffset,
      centerOffset: this.colliderCenterOffset
    })
  }

  /**
   * Gets the transform associated with this visual.
   *
   * @returns {Transform} The current transform of the visual.
   */
  public get transform(): Transform {
    return this._transform
  }

  /**
   * Gets the size of the visual element.
   *
   * @returns A `vec3` representing the dimensions of the visual element.
   */
  public get size(): vec3 {
    return this._size
  }

  /**
   * Sets the size of the visual element.
   * Updates both the internal `_size` property.
   *
   * @param size - A `vec3` object representing the dimensions of the visual element.
   */
  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    if (isEqual<vec3>(this._size, size)) {
      return
    }
    this._size.copyFrom(size)
  }

  /**
   * Determines whether the color should change when transition to a new state.
   *
   * @returns {boolean} A boolean value indicating if the color change is enabled.
   */
  public get shouldColorChange(): boolean {
    return this._shouldColorChange
  }

  /**
   * Sets whether to enable the color changing behavior for the visual.
   *
   * @param shouldColorChange - A boolean indicating whether the color change is enabled (`true`) or disabled (`false`).
   */
  public set shouldColorChange(shouldColorChange: boolean) {
    if (shouldColorChange === undefined) {
      return
    }
    if (isEqual<boolean>(this._shouldColorChange, shouldColorChange)) {
      return
    }
    const wasColorChanging = this._shouldColorChange
    this._shouldColorChange = shouldColorChange
    if (wasColorChanging && !this._shouldColorChange) {
      this._colorChangeCancelSet.cancel()
    }
  }

  /**
   * Gets the default base color for the visual element.
   *
   * @returns A `vec4` representing the current base default color.
   */
  public get baseDefaultColor(): vec4 {
    return this._states.default.color
  }

  /**
   * Sets the default base color for the visual element.
   *
   * @param baseDefaultColor - A `vec4` representing the RGBA color to be used as the default.
   */
  public set baseDefaultColor(baseDefaultColor: vec4) {
    if (baseDefaultColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.default.color, baseDefaultColor)) {
      return
    }
    this._states.default.color = baseDefaultColor
    if (!this._shouldColorChange) {
      this.baseColor = baseDefaultColor
    }
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the hovered color for the visual element.
   *
   * @returns A `vec4` representing the current hovered color.
   */
  public get baseHoveredColor(): vec4 {
    return this._states.hovered.color
  }

  /**
   *  Sets the hovered color for the visual element.
   *
   * @returns A `vec4` representing the current base hovered color.
   */
  public set baseHoveredColor(baseHoveredColor: vec4) {
    if (baseHoveredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.hovered.color, baseHoveredColor)) {
      return
    }
    this._states.hovered.color = baseHoveredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered color for the visual element.
   *
   * @returns A `vec4` representing the current triggered color.
   */
  public get baseTriggeredColor(): vec4 {
    return this._states.triggered.color
  }

  /**
   * Gets the triggered color for the visual element.
   *
   * @returns A `vec4` representing the current triggered color.
   */
  public set baseTriggeredColor(baseTriggeredColor: vec4) {
    if (baseTriggeredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.triggered.color, baseTriggeredColor)) {
      return
    }
    this._states.triggered.color = baseTriggeredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled default color for the visual element.
   *
   * @returns A `vec4` representing the current toggled default color.
   */
  public get baseToggledDefaultColor(): vec4 {
    return this._states.toggledDefault.color
  }

  /**
   * Sets the toggled default color for the visual element.
   *
   * @param baseToggledDefaultColor - A `vec4` representing the RGBA color to be used as the toggled default color.
   */
  public set baseToggledDefaultColor(baseToggledDefaultColor: vec4) {
    if (baseToggledDefaultColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.toggledDefault.color, baseToggledDefaultColor)) {
      return
    }
    this._states.toggledDefault.color = baseToggledDefaultColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered color for the visual element.
   *
   * @returns A `vec4` representing the current toggled hovered color.
   */
  public get baseToggledHoveredColor(): vec4 {
    return this._states.toggledHovered.color
  }

  /**
   * Sets the toggled hovered color for the visual element.
   *
   * @param baseToggledHoveredColor - A `vec4` representing the RGBA color to be used as the toggled hovered color.
   */
  public set baseToggledHoveredColor(baseToggledHoveredColor: vec4) {
    if (baseToggledHoveredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.toggledHovered.color, baseToggledHoveredColor)) {
      return
    }
    this._states.toggledHovered.color = baseToggledHoveredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered color for the visual element.
   *
   * @returns A `vec4` representing the current toggled triggered color.
   */
  public get baseToggledTriggeredColor(): vec4 {
    return this._states.toggledTriggered.color
  }

  /**
   * Sets the toggled triggered color for the visual element.
   *
   * @param baseToggledTriggeredColor - A `vec4` representing the RGBA color to be used as the toggled triggered color.
   */
  public set baseToggledTriggeredColor(baseToggledTriggeredColor: vec4) {
    if (baseToggledTriggeredColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.toggledTriggered.color, baseToggledTriggeredColor)) {
      return
    }
    this._states.toggledTriggered.color = baseToggledTriggeredColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the inactive color for the visual element.
   *
   * @returns A `vec4` representing the current inactive color.
   */
  public get baseInactiveColor(): vec4 {
    return this._states.inactive.color
  }

  /**
   * Sets the inactive color for the visual element.
   *
   * @param baseInactiveColor - A `vec4` representing the RGBA color to be used as the inactive color.
   */
  public set baseInactiveColor(baseInactiveColor: vec4) {
    if (baseInactiveColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.inactive.color, baseInactiveColor)) {
      return
    }
    this._states.inactive.color = baseInactiveColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the error color for the visual element.
   *
   * @returns A `vec4` representing the current error color.
   */
  public get baseErrorColor(): vec4 {
    return this._states.error.color
  }

  /**
   * Sets the error color for the visual element.
   *
   * @param baseErrorColor - A `vec4` representing the RGBA color to be used as the error color.
   */
  public set baseErrorColor(baseErrorColor: vec4) {
    if (baseErrorColor === undefined) {
      return
    }
    if (isEqual<vec4>(this._states.error.color, baseErrorColor)) {
      return
    }
    this._states.error.color = baseErrorColor
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Determines whether the visual element should scale when transitioning to a new state
   *
   * @returns {boolean} `true` if the visual element should scale, otherwise `false`.
   */
  public get shouldScale(): boolean {
    return this._shouldScale
  }

  /**
   * Gets the default scale of the visual element.
   *
   * @returns A `vec3` representing the current default scale.
   */
  public get defaultScale(): vec3 {
    return this._states.default.scale
  }

  /**
   * Sets the default scale of the visual and initializes its visual states.
   *
   * @param scale - A `vec3` object representing the default scale to be applied.
   */
  public set defaultScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.default.scale, scale)) {
      return
    }
    this._states.default.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the hovered scale of the visual element.
   *
   * @returns A `vec3` representing the current hovered scale.
   */
  public get hoveredScale(): vec3 {
    return this._states.hovered.scale
  }

  /**
   * Sets the hovered scale for the visual element and initializes its visual states.
   *
   * @param hoveredScale - A `vec3` object representing the hovered scale to be applied.
   */
  public set hoveredScale(hoveredScale: vec3) {
    if (hoveredScale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.hovered.scale, hoveredScale)) {
      return
    }
    this._states.hovered.scale = hoveredScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered scale of the visual element.
   *
   * @returns A `vec3` representing the current triggered scale.
   */
  public get triggeredScale(): vec3 {
    return this._states.triggered.scale
  }

  /**
   * Sets the triggered scale of the visual and initializes its visual states.
   *
   * @param scale - A `vec3` representing the scale to be applied to the visual.
   */
  public set triggeredScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.triggered.scale, scale)) {
      return
    }
    this._states.triggered.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled scale of the visual element.
   *
   * @returns A `vec3` representing the current toggled scale.
   */
  public get toggledScale(): vec3 {
    return this._states.toggledDefault.scale
  }

  /**
   * Sets the scale to be applied when the visual is toggled and initializes its visual states.
   *
   * @param scale - A `vec3` representing the new scale to apply when toggled.
   */
  public set toggledScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledDefault.scale, scale)) {
      return
    }
    this._states.toggledDefault.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered scale of the visual element.
   *
   * @returns A `vec3` representing the current toggled hovered scale.
   */
  public get toggledHoveredScale(): vec3 {
    return this._states.toggledHovered.scale
  }

  /**
   * Sets the scale to be applied when the visual is toggled and hovered.
   *
   * @param toggledHoveredScale - A `vec3` representing the new scale to apply when toggled and hovered.
   */
  public set toggledHoveredScale(toggledHoveredScale: vec3) {
    if (toggledHoveredScale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledHovered.scale, toggledHoveredScale)) {
      return
    }
    this._states.toggledHovered.scale = toggledHoveredScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered scale of the visual element.
   *
   * @returns A `vec3` representing the current toggled triggered scale.
   */
  public get toggledTriggeredScale(): vec3 {
    return this._states.toggledTriggered.scale
  }

  /**
   * Sets the toggled triggered scale of the visual element.
   *
   * @param scale - A `vec3` object representing the new toggled triggered scale.
   */
  public set toggledTriggeredScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledTriggered.scale, scale)) {
      return
    }
    this._states.toggledTriggered.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the scale applied when the visual is in a inactive state.
   *
   * @returns A `vec3` representing the current inactive scale.
   */
  public get inactiveScale(): vec3 {
    return this._states.inactive.scale
  }

  /**
   * Sets the scale to be applied when the visual is in a inactive state and initializes its visual states.
   *
   * @param scale - A `vec3` object representing the scale to apply in the inactive state.
   */
  public set inactiveScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.inactive.scale, scale)) {
      return
    }
    this._states.inactive.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the scale applied when the visual is in an error state.
   *
   * @returns A `vec3` representing the current error scale.
   */
  public get errorScale(): vec3 {
    return this._states.error.scale
  }

  /**
   * Sets the scale for the error visualization and initializes its visual states.
   *
   * @param scale - A `vec3` object representing the scale to be applied to the error visualization.
   */
  public set errorScale(scale: vec3) {
    if (scale === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.error.scale, scale)) {
      return
    }
    this._states.error.scale = scale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Indicates whether the visual element should be translated when transitioning to a new state.
   *
   * @returns {boolean} `true` if the visual element should be translated; otherwise, `false`.
   */
  public get shouldTranslate(): boolean {
    return this._shouldTranslate
  }

  /**
   * Gets the default position of the visual element.
   *
   * @returns A `vec3` representing the current default position.
   */
  public get defaultPosition(): vec3 {
    return this._states.default.position
  }

  /**
   * Sets the default position of the visual element.
   *
   * @param position - A `vec3` object representing the new default position.
   */
  public set defaultPosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.default.position, position)) {
      return
    }
    this._states.default.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
      if (!this._shouldTranslate) {
        this._transform.setLocalPosition(position)
      }
    }
  }

  /**
   * Gets the hovered position of the visual element.
   *
   * @returns A `vec3` representing the current hovered position.
   */
  public get hoveredPosition(): vec3 {
    return this._states.hovered.position
  }

  /**
   * Gets the hovered position of the visual element.
   *
   * @returns A `vec3` representing the new hovered position.
   */
  public set hoveredPosition(hoveredPosition: vec3) {
    if (hoveredPosition === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.hovered.position, hoveredPosition)) {
      return
    }
    this._states.hovered.position = hoveredPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the triggered position of the visual element.
   *
   * @returns A `vec3` representing the current triggered position.
   */
  public get triggeredPosition(): vec3 {
    return this._states.triggered.position
  }

  /**
   * Sets the triggered position of the visual element.
   *
   * @param position - A `vec3` object representing the new triggered position.
   */
  public set triggeredPosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.triggered.position, position)) {
      return
    }
    this._states.triggered.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled position of the visual element.
   *
   * @returns A `vec3` representing the current toggled position.
   */
  public get toggledPosition(): vec3 {
    return this._states.toggledDefault.position
  }

  /**
   * Sets the toggled position of the visual element.
   *
   * @param position - A `vec3` object representing the new toggled position.
   */
  public set toggledPosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledDefault.position, position)) {
      return
    }
    this._states.toggledDefault.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled hovered position for the visual element.
   *
   * @returns A `vec3` representing the current toggled hovered position.
   */
  public get toggledHoveredPosition(): vec3 {
    return this._states.toggledHovered.position
  }

  /**
   * Sets the toggled hovered position for the visual element.
   *
   * @param toggledHoveredPosition - A `vec3` object representing the new toggled hovered position.
   */
  public set toggledHoveredPosition(toggledHoveredPosition: vec3) {
    if (toggledHoveredPosition === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledHovered.position, toggledHoveredPosition)) {
      return
    }
    this._states.toggledHovered.position = toggledHoveredPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the toggled triggered position of the visual element.
   *
   * @returns A `vec3` representing the current toggled triggered position.
   */
  public get toggledTriggeredPosition(): vec3 {
    return this._states.toggledTriggered.position
  }

  /**
   * Sets the toggled triggered position of the visual element.
   *
   * @param position - A `vec3` object representing the new toggled triggered position.
   */
  public set toggledTriggeredPosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.toggledTriggered.position, position)) {
      return
    }
    this._states.toggledTriggered.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the position of the visual element when it is in a inactive state.
   *
   * @returns A `vec3` representing the current inactive position.
   */
  public get inactivePosition(): vec3 {
    return this._states.inactive.position
  }

  /**
   * Sets the position of the visual element when it is in a inactive state.
   *
   * @param position - A `vec3` object representing the new position for the inactive state.
   */
  public set inactivePosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.inactive.position, position)) {
      return
    }
    this._states.inactive.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the position of the visual element when it is in an error state.
   *
   * @returns A `vec3` representing the current error position.
   */
  public get errorPosition(): vec3 {
    return this._states.error.position
  }

  /**
   * Sets the position of the visual element when it is in an error state.
   *
   * @param position - A `vec3` object representing the new position for the error state.
   */
  public set errorPosition(position: vec3) {
    if (position === undefined) {
      return
    }
    if (isEqual<vec3>(this._states.error.position, position)) {
      return
    }
    this._states.error.position = position
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the default state should apply position changes.
   *
   * @returns `true` if the default state should apply position changes; otherwise, `false`.
   */
  public get defaultShouldPosition(): boolean {
    return this._states.default.shouldPosition
  }

  /**
   * Sets whether the default state should apply position changes and initializes the visual states.
   *
   * @param shouldPosition - A boolean indicating whether the default state should apply position changes.
   */
  public set defaultShouldPosition(shouldPosition: boolean) {
    if (shouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.default.shouldPosition, shouldPosition)) {
      return
    }
    this._states.default.shouldPosition = shouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the hover state should apply position changes.
   *
   * @returns `true` if the hovered state should apply position changes; otherwise, `false`.
   */
  public get hoveredShouldPosition(): boolean {
    return this._states.hovered.shouldPosition
  }

  /**
   * Sets whether the hovered state should apply position changes and initializes the visual states.
   *
   * @param hoveredShouldPosition - A boolean indicating whether the hovered state should apply position changes.
   */
  public set hoveredShouldPosition(hoveredShouldPosition: boolean) {
    if (hoveredShouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.hovered.shouldPosition, hoveredShouldPosition)) {
      return
    }
    this._states.hovered.shouldPosition = hoveredShouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the triggered state should apply position changes.
   *
   * @returns `true` if the triggered state should apply position changes; otherwise, `false`.
   */
  public get triggeredShouldPosition(): boolean {
    return this._states.triggered.shouldPosition
  }

  /**
   * Sets whether the triggered state should apply position changes and initializes the visual states.
   *
   * @param shouldPosition - A boolean indicating whether the triggered state should apply position changes.
   */
  public set triggeredShouldPosition(shouldPosition: boolean) {
    if (shouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.triggered.shouldPosition, shouldPosition)) {
      return
    }
    this._states.triggered.shouldPosition = shouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the inactive state should apply position changes.
   *
   * @returns `true` if the inactive state should apply position changes; otherwise, `false`.
   */
  public get inactiveShouldPosition(): boolean {
    return this._states.inactive.shouldPosition
  }

  /**
   * Sets whether the inactive state should apply position changes and initializes the visual states.
   *
   * @param shouldPosition - A boolean indicating whether the inactive state should apply position changes.
   */
  public set inactiveShouldPosition(shouldPosition: boolean) {
    if (shouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.inactive.shouldPosition, shouldPosition)) {
      return
    }
    this._states.inactive.shouldPosition = shouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled default state should apply position changes.
   *
   * @returns `true` if the toggled default state should apply position changes; otherwise, `false`.
   */
  public get toggledDefaultShouldPosition(): boolean {
    return this._states.toggledDefault.shouldPosition
  }

  /**
   * Sets whether the toggled default state should apply position changes and initializes the visual states.
   *
   * @param shouldPosition - A boolean indicating whether the toggled default state should apply position changes.
   */
  public set toggledDefaultShouldPosition(shouldPosition: boolean) {
    if (shouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledDefault.shouldPosition, shouldPosition)) {
      return
    }
    this._states.toggledDefault.shouldPosition = shouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled hovered state should apply position changes.
   *
   * @returns `true` if the toggled hovered state should apply position changes; otherwise, `false`.
   */
  public get toggledHoveredShouldPosition(): boolean {
    return this._states.toggledHovered.shouldPosition
  }

  /**
   * Sets whether the toggled hovered state should apply position changes and initializes the visual states.
   *
   * @param toggledHoveredShouldPosition - A boolean indicating whether the toggled hovered state should apply position changes.
   */
  public set toggledHoveredShouldPosition(toggledHoveredShouldPosition: boolean) {
    if (toggledHoveredShouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledHovered.shouldPosition, toggledHoveredShouldPosition)) {
      return
    }
    this._states.toggledHovered.shouldPosition = toggledHoveredShouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled triggered state should apply position changes.
   *
   * @returns `true` if the toggled triggered state should apply position changes; otherwise, `false`.
   */
  public get toggledTriggeredShouldPosition(): boolean {
    return this._states.toggledTriggered.shouldPosition
  }

  /**
   * Sets whether the toggled triggered state should apply position changes and initializes the visual states.
   *
   * @param shouldPosition - A boolean indicating whether the toggled triggered state should apply position changes.
   */
  public set toggledTriggeredShouldPosition(shouldPosition: boolean) {
    if (shouldPosition === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledTriggered.shouldPosition, shouldPosition)) {
      return
    }
    this._states.toggledTriggered.shouldPosition = shouldPosition
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the default state should apply scale changes.
   *
   * @returns `true` if the default state should apply scale changes; otherwise, `false`.
   */
  public get defaultShouldScale(): boolean {
    return this._states.default.shouldScale
  }

  /**
   * Sets whether the default state should apply scale changes and initializes the visual states.
   *
   * @param shouldScale - A boolean indicating whether the default state should apply scale changes.
   */
  public set defaultShouldScale(shouldScale: boolean) {
    if (shouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.default.shouldScale, shouldScale)) {
      return
    }
    this._states.default.shouldScale = shouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the hovered state should apply scale changes.
   *
   * @returns `true` if the hovered state should apply scale changes; otherwise, `false`.
   */
  public get hoveredShouldScale(): boolean {
    return this._states.hovered.shouldScale
  }

  /**
   * Sets whether the hovered state should apply scale changes and initializes the visual states.
   *
   * @param hoveredShouldScale - A boolean indicating whether the hovered state should apply scale changes.
   */
  public set hoveredShouldScale(hoveredShouldScale: boolean) {
    if (hoveredShouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.hovered.shouldScale, hoveredShouldScale)) {
      return
    }
    this._states.hovered.shouldScale = hoveredShouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the triggered state should apply scale changes.
   *
   * @returns `true` if the triggered state should apply scale changes; otherwise, `false`.
   */
  public get triggeredShouldScale(): boolean {
    return this._states.triggered.shouldScale
  }

  /**
   * Sets whether the triggered state should apply scale changes and initializes the visual states.
   *
   * @param shouldScale - A boolean indicating whether the triggered state should apply scale changes.
   */
  public set triggeredShouldScale(shouldScale: boolean) {
    if (shouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.triggered.shouldScale, shouldScale)) {
      return
    }
    this._states.triggered.shouldScale = shouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the inactive state should apply scale changes.
   *
   * @returns `true` if the inactive state should apply scale changes; otherwise, `false`.
   */
  public get inactiveShouldScale(): boolean {
    return this._states.inactive.shouldScale
  }

  /**
   * Sets whether the inactive state should apply scale changes and initializes the visual states.
   *
   * @param shouldScale - A boolean indicating whether the inactive state should apply scale changes.
   */
  public set inactiveShouldScale(shouldScale: boolean) {
    if (shouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.inactive.shouldScale, shouldScale)) {
      return
    }
    this._states.inactive.shouldScale = shouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled default state should apply scale changes.
   *
   * @returns `true` if the toggled default state should apply scale changes; otherwise, `false`.
   */
  public get toggledDefaultShouldScale(): boolean {
    return this._states.toggledDefault.shouldScale
  }

  /**
   * Sets whether the toggled default state should apply scale changes and initializes the visual states.
   *
   * @param shouldScale - A boolean indicating whether the toggled default state should apply scale changes.
   */
  public set toggledDefaultShouldScale(shouldScale: boolean) {
    if (shouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledDefault.shouldScale, shouldScale)) {
      return
    }
    this._states.toggledDefault.shouldScale = shouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled hovered state should apply scale changes.
   *
   * @returns `true` if the toggled hovered state should apply scale changes; otherwise, `false`.
   */
  public get toggledHoveredShouldScale(): boolean {
    return this._states.toggledHovered.shouldScale
  }

  /**
   * Sets whether the toggled hovered state should apply scale changes and initializes the visual states.
   *
   * @param toggledHoveredShouldScale - A boolean indicating whether the toggled hovered state should apply scale changes.
   */
  public set toggledHoveredShouldScale(toggledHoveredShouldScale: boolean) {
    if (toggledHoveredShouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledHovered.shouldScale, toggledHoveredShouldScale)) {
      return
    }
    this._states.toggledHovered.shouldScale = toggledHoveredShouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets whether the toggled triggered state should apply scale changes.
   *
   * @returns `true` if the toggled triggered state should apply scale changes; otherwise, `false`.
   */
  public get toggledTriggeredShouldScale(): boolean {
    return this._states.toggledTriggered.shouldScale
  }

  /**
   * Sets whether the toggled triggered state should apply scale changes and initializes the visual states.
   *
   * @param shouldScale - A boolean indicating whether the toggled triggered state should apply scale changes.
   */
  public set toggledTriggeredShouldScale(shouldScale: boolean) {
    if (shouldScale === undefined) {
      return
    }
    if (isEqual<boolean>(this._states.toggledTriggered.shouldScale, shouldScale)) {
      return
    }
    this._states.toggledTriggered.shouldScale = shouldScale
    if (this.initialized) {
      this.needsVisualStateUpdate = true
    }
  }

  /**
   * Gets the duration of the animation.
   *
   * @returns The duration of the animation in milliseconds.
   */
  public get animateDuration(): number {
    return this._animateDuration
  }

  /**
   * Sets the duration of the animation.
   *
   * @param animateDuration - The duration of the animation in milliseconds.
   */
  public set animateDuration(animateDuration: number) {
    if (animateDuration === undefined) {
      return
    }
    this._animateDuration = animateDuration
  }

  /**
   * Initializes the visual component by setting up its initial scale and position,
   * and preparing its visual states. This method is typically called during the
   * setup phase to ensure the visual component is ready for use.
   */
  public initialize() {
    if (this.initialized) return
    if (this.visualArgs.style) {
      if (this.isVisualStyleKey(this.visualArgs.style)) {
        const mgr = ThemeService.getInstance()
        const styleKey = this.visualArgs.style
        const requestedThemeName = styleKey.themeName
        const resolvedTheme = requestedThemeName ? mgr.getTheme(requestedThemeName) : undefined
        if (requestedThemeName && !resolvedTheme) {
          log.d(
            `[Visual] Unknown theme '${requestedThemeName}' for ${styleKey.visualElementType}; falling back to ${mgr.currentTheme.name}`
          )
        }
        const theme = resolvedTheme ?? mgr.currentTheme
        const componentStyles = theme.styles[styleKey.visualElementType]
        let style = componentStyles?.[styleKey.style] ?? componentStyles?.[theme.defaultStyleName]

        if (!style) {
          log.d(
            `[Visual] Missing style '${styleKey.style}' for ${styleKey.visualElementType} in theme '${theme.name}'. Falling back to SnapOS2.`
          )
          const fallbackTheme = mgr.getTheme("SnapOS2")
          if (fallbackTheme) {
            const fallbackComponentStyles = fallbackTheme.styles[styleKey.visualElementType]
            style =
              fallbackComponentStyles?.[styleKey.style] ?? fallbackComponentStyles?.[fallbackTheme.defaultStyleName]
          }
        }

        if (style) {
          this.applyStyleParameters(style)
        } else {
          log.d(
            `[Visual] Failed to find any fallback style for ${styleKey.visualElementType}. Visual will be unstyled.`
          )
        }
      } else {
        this.applyStyleParameters(this.visualArgs.style)
      }
    }
    if (this.visualArgs.depthSettings) {
      this.depthTest = this.visualArgs.depthSettings.depthTest
      this.depthWrite = this.visualArgs.depthSettings.depthWrite
    }
    this.updateVisualStates()

    this._currentPosition = this.defaultPosition
    this._currentScale = this.defaultScale

    this.initialized = true
    this.onInitializedEvent.invoke()

    this.setState(this.stateName)

    const visualStateEvent = this._visualComponent?.createEvent("LateUpdateEvent")
    if (visualStateEvent !== undefined) {
      this._visualStateUpdateEvent = visualStateEvent
      visualStateEvent.bind(() => {
        if (this._needsVisualStateUpdate) {
          this._needsVisualStateUpdate = false
          this.updateVisualStates()
        }
        // Self-disable unless a setter re-dirtied us during updateVisualStates().
        visualStateEvent.enabled = this._needsVisualStateUpdate
      })
      // Start enabled only if already dirty (the initial state needs one apply).
      visualStateEvent.enabled = this._needsVisualStateUpdate
    }
  }

  /**
   * Hover hooks. VisualElement bridges its own Element-level
   * `onHoverEnter` / `onHoverExit` into these so subclasses (e.g.
   * BeveledPrismVisual's cursor-following highlight) can react without
   * holding a reference to the owning Element. Default no-op.
   */
  public onHoverEnter(_event: InteractorEvent): void {}
  public onHoverExit(_event: InteractorEvent): void {}

  /**
   * Updates the visual state of the object based on the provided state type.
   *
   * @param stateName - The type of state to set, which determines the visual properties
   * such as color, scale, and position.
   */
  public setState(stateName: StateName) {
    const newState = this.visualStates.get(stateName)
    if (this._state === newState) {
      // skip redundant calls
      return
    }
    this.stateName = stateName
    this.prevState = this._state
    this._state = newState
    if (this.initialized) {
      this.updateColors(this._state.baseColor)
      this.updateScale(this._state.localScale)
      this.updatePosition(this._state.localPosition)
      this.updateShouldPosition(this._state.shouldPosition)
      this.updateShouldScale(this._state.shouldScale)
    }
  }

  /**
   * Creates an instance of the Visual class.
   *
   * @param sceneObject - The parent SceneObject associated with this visual.
   */
  public constructor(args: VisualArgs) {
    this.visualArgs = args
  }

  public enable() {
    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.enabled = true
      }
    })
  }

  public disable() {
    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.enabled = false
      }
    })
  }

  /**
   * Cancels in-flight state transition animations (color, scale, position).
   * Subclasses with additional animated properties should override and call `super`.
   */
  public cancelAnimations(): void {
    this._colorChangeCancelSet.cancel()
    this._updateScaleCancelSet.cancel()
    this._updatePositionCancelSet.cancel()
  }

  /**
   * Destroys the current instance.
   *
   */
  public destroy() {
    this.cancelAnimations()
    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.destroy()
      }
    })
    this.managedComponents = []
    this.onDestroyedEvent.invoke()
  }

  protected updateColors(targetColor: vec4) {
    if (!this._shouldColorChange) {
      return
    }
    const initialColor = this.baseColor
    const remaining = colorDistance(targetColor, initialColor)
    const full = this.prevState?.baseColor ? colorDistance(targetColor, this.prevState.baseColor) : remaining
    const ratio = full > 1e-6 ? Math.min(Math.max(remaining / full, 0), 1) : 0
    this._colorChangeCancelSet.cancel()
    animate({
      duration: ratio * this._animateDuration,
      cancelSet: this._colorChangeCancelSet,
      update: (t) => {
        this.baseColor = colorLerp(initialColor, targetColor, t)
      }
    })
  }

  private updateScale(scale: vec3) {
    if (!this._shouldScale) {
      return
    }
    const from = this._currentScale
    const to = scale
    const difference = to.distance(from)
    const duration = difference * this._animateDuration
    this._updateScaleCancelSet.cancel()
    animate({
      duration: duration,
      cancelSet: this._updateScaleCancelSet,
      update: (t) => {
        const newScale = vec3.lerp(from, to, t)
        const delta = newScale.div(this._currentScale)
        this.transform.setLocalScale(this.transform.getLocalScale().mult(delta))
        this._currentScale = newScale
        this.onScaleChangedEvent.invoke({from: from, current: this._currentScale})
      }
    })
  }

  private updatePosition(pos: vec3) {
    if (!this._shouldTranslate) {
      return
    }
    const from = this._currentPosition
    const to = pos
    // if both zero, return early
    if (to.equal(from) && to.equal(vec3.zero())) return
    const difference = to.distance(from)
    const duration = difference * this._animateDuration
    this._updatePositionCancelSet.cancel()
    animate({
      duration: duration,
      cancelSet: this._updatePositionCancelSet,
      update: (t) => {
        const previousPosition = this._currentPosition
        this._currentPosition = vec3.lerp(from, to, t)
        const delta = this._currentPosition.sub(previousPosition)
        this.transform.setLocalPosition(this.transform.getLocalPosition().add(delta))
        this.onPositionChangedEvent.invoke({from: from, current: this._currentPosition})
      }
    })
  }

  private updateShouldPosition(shouldPosition: boolean) {
    // This would be used by the parent Visual class to determine
    // whether to apply position changes for the current state
    // The actual position updates are handled by the base Visual class
    const wasTranslating = this._shouldTranslate
    this._shouldTranslate = shouldPosition
    if (wasTranslating && !this._shouldTranslate) {
      this._updatePositionCancelSet.cancel()
    }
  }

  private updateShouldScale(shouldScale: boolean) {
    // This would be used by the parent Visual class to determine
    // whether to apply scale changes for the current state
    // The actual scale updates are handled by the base Visual class
    const wasScaling = this._shouldScale
    this._shouldScale = shouldScale
    if (wasScaling && !this._shouldScale) {
      this._updateScaleCancelSet.cancel()
    }
  }

  protected applyStyleProperty<TParams extends Partial<VisualParameters>, TState extends VisualState, T>(
    parameters: TParams,
    parameterName: keyof TState,
    setters: {[key: string]: (value: T) => void}
  ): void {
    const defaultParams = parameters.default
    const defaultValue = defaultParams?.[parameterName as keyof VisualState] as T
    const hasDefault = defaultValue !== undefined

    for (const stateName in setters) {
      const stateParams = parameters[stateName as keyof TParams] as TState
      const stateValue = stateParams?.[parameterName] as T

      const valueToSet = stateValue !== undefined ? stateValue : hasDefault ? defaultValue : undefined

      if (valueToSet !== undefined) {
        setters[stateName](valueToSet)
      }
    }
  }

  protected applyStyleParameters(parameters: Partial<VisualParameters>) {
    this.applyStyleProperty<Partial<VisualParameters>, VisualState, vec4>(parameters, "baseColor", {
      default: (value) => (this.baseDefaultColor = value),
      hovered: (value) => (this.baseHoveredColor = value),
      triggered: (value) => (this.baseTriggeredColor = value),
      inactive: (value) => (this.baseInactiveColor = value),
      toggledDefault: (value) => (this.baseToggledDefaultColor = value),
      toggledHovered: (value) => (this.baseToggledHoveredColor = value),
      toggledTriggered: (value) => (this.baseToggledTriggeredColor = value)
    })

    // shouldPosition
    this.applyStyleProperty<Partial<VisualParameters>, VisualState, boolean>(parameters, "shouldPosition", {
      default: (value) => (this.defaultShouldPosition = value),
      hovered: (value) => (this.hoveredShouldPosition = value),
      triggered: (value) => (this.triggeredShouldPosition = value),
      inactive: (value) => (this.inactiveShouldPosition = value),
      toggledDefault: (value) => (this.toggledDefaultShouldPosition = value),
      toggledHovered: (value) => (this.toggledHoveredShouldPosition = value),
      toggledTriggered: (value) => (this.toggledTriggeredShouldPosition = value)
    })

    // shouldScale
    this.applyStyleProperty<Partial<VisualParameters>, VisualState, boolean>(parameters, "shouldScale", {
      default: (value) => (this.defaultShouldScale = value),
      hovered: (value) => (this.hoveredShouldScale = value),
      triggered: (value) => (this.triggeredShouldScale = value),
      inactive: (value) => (this.inactiveShouldScale = value),
      toggledDefault: (value) => (this.toggledDefaultShouldScale = value),
      toggledHovered: (value) => (this.toggledHoveredShouldScale = value),
      toggledTriggered: (value) => (this.toggledTriggeredShouldScale = value)
    })

    // localPosition
    this.applyStyleProperty<Partial<VisualParameters>, VisualState, vec3>(parameters, "localPosition", {
      default: (value) => (this.defaultPosition = value),
      hovered: (value) => (this.hoveredPosition = value),
      triggered: (value) => (this.triggeredPosition = value),
      inactive: (value) => (this.inactivePosition = value),
      toggledDefault: (value) => (this.toggledPosition = value),
      toggledHovered: (value) => (this.toggledHoveredPosition = value),
      toggledTriggered: (value) => (this.toggledTriggeredPosition = value)
    })

    // localScale
    this.applyStyleProperty<Partial<VisualParameters>, VisualState, vec3>(parameters, "localScale", {
      default: (value) => (this.defaultScale = value),
      hovered: (value) => (this.hoveredScale = value),
      triggered: (value) => (this.triggeredScale = value),
      inactive: (value) => (this.inactiveScale = value),
      toggledDefault: (value) => (this.toggledScale = value),
      toggledHovered: (value) => (this.toggledHoveredScale = value),
      toggledTriggered: (value) => (this.toggledTriggeredScale = value)
    })
  }

  protected updateVisualStates(): void {
    this.verifyStates()
    this.setState(this.stateName)
  }

  private verifyStates(): void {
    for (const stateName of Object.values(StateName)) {
      if (!this.visualStates.has(stateName)) {
        log.d(`WARNING, missing state: ${stateName}, replaced with default state`)
        const isToggleState = stateName === StateName.toggledDefault || stateName === StateName.toggledHovered
        this.visualStates.set(
          stateName,
          isToggleState ? this.visualStates.get(StateName.hovered) : this.visualStates.get(StateName.default)
        )
      }
    }
  }

  /**
   * This function checks if the input is an object with both `visualElementType` and `style` properties,
   * and that both properties are strings. Returns `true` if the input matches the `VisualStyleKey`,
   * otherwise returns `false`.
   *
   * @param style - The value to check, which may be a `VisualStyleKey`, a partial `VisualParameters`, or `undefined`.
   * @returns `true` if `style` is a `VisualStyleKey`, otherwise `false`.
   */
  private isVisualStyleKey(style: VisualStyleKey | Partial<VisualParameters> | undefined): style is VisualStyleKey {
    return (
      style !== undefined &&
      typeof style === "object" &&
      "visualElementType" in style &&
      "style" in style &&
      typeof style.visualElementType === "string" &&
      typeof style.style === "string"
    )
  }
}
