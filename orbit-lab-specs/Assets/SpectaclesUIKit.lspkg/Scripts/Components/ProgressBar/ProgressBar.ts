import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {clamp, lerp} from "SpectaclesInteractionKit.lspkg/Utils/mathUtils"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {SpringAnimate} from "SpectaclesInteractionKit.lspkg/Utils/springAnimate"
import {ProgressBarFillGreen, ProgressBarTrackGray} from "../../Themes/SnapOS-3.0/Colors"
import {Theme} from "../../Themes/Theme"
import {ThemeService} from "../../Themes/ThemeService"
import {Callback, createCallbacks} from "../../Utility/SceneUtilities"
import {
  RoundedRectangleVisual,
  RoundedRectangleVisualParameters
} from "../../Visuals/RoundedRectangle/RoundedRectangleVisual"
import {Layoutable} from "../Layout2D/Layoutable"
import {UIKitBrands} from "../Layout2D/UIKitBrands"
// Side-effect import — register UIKit Layout2D handlers. ProgressBar
// doesn't extend Element, so it needs its own bootstrap reference.
import "../../UIKitBootstrap"

const SPRING_EPSILON: number = 0.001
const FILL_Z_OFFSET: number = 0.01

const DEFAULT_TRACK_STYLE: Partial<RoundedRectangleVisualParameters> = {
  default: {
    baseType: "Color",
    baseColor: ProgressBarTrackGray,
    hasBorder: false
  }
}

const DEFAULT_FILL_STYLE: Partial<RoundedRectangleVisualParameters> = {
  default: {
    baseType: "Color",
    baseColor: ProgressBarFillGreen,
    hasBorder: false
  }
}

@component
export class ProgressBar extends BaseScriptComponent implements Layoutable {
  /**
   * Type brand consumed by the Layout2D `ElementHandler` finder. ProgressBar
   * is `Layoutable` but doesn't extend Element. See
   * `Components/Layout2D/UIKitBrands.ts`.
   */
  public readonly __uikitBrand = UIKitBrands.Element

  @input
  @hint("Size of the progress bar in centimeters")
  private _size: vec3 = new vec3(6, 1.0, 1.0)

  @input
  @hint("The default value of the progress bar, between 0 and 1")
  @widget(new SliderWidget(0, 1, 0.01))
  private _defaultValue: number = 0

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

  @input
  @hint("Enable this to add functions from another script to this component's callbacks")
  private addCallbacks: boolean = false
  @input
  @showIf("addCallbacks")
  @label("On Value Changed Callbacks")
  private onValueChangeCallbacks: Callback[] = []
  @input
  @showIf("addCallbacks")
  @label("On Progress Finished Callbacks")
  private onProgressFinishedCallbacks: Callback[] = []

  private _trackVisual: RoundedRectangleVisual | null = null
  private _fillVisual: RoundedRectangleVisual | null = null

  private trackObject: SceneObject | null = null
  private fillObject: SceneObject | null = null

  private _currentValue: number = this._defaultValue
  private _displayValue: number = this._defaultValue
  private _isAnimating: boolean = false
  private _initialized: boolean = false

  private _springAnimate = SpringAnimate.smooth()
  private _springCurrent = new vec3(0, 0, 0)
  private _springTarget = new vec3(0, 0, 0)
  private _springResult = new vec3(0, 0, 0)
  private _fillLocalPos = new vec3(0, 0, FILL_Z_OFFSET)

  private _progressFinishedFired: boolean = false

  private onSizeChangedEvent: Event<vec3> = new Event<vec3>()
  private onInitializedEvent: ReplayEvent<void> = new ReplayEvent<void>()

  /**
   * Invoked when the progress bar value has changed.
   */
  private onValueChangedEvent: Event<number> = new Event()
  private _onValueChanged?: PublicApi<number>
  public get onValueChanged(): PublicApi<number> {
    return (this._onValueChanged ??= this.onValueChangedEvent.publicApi())
  }

  /**
   * Invoked when the progress bar has finished progress.
   */
  private onProgressFinishedEvent: Event<void> = new Event()
  private _onProgressFinished?: PublicApi<void>
  public get onProgressFinished(): PublicApi<void> {
    return (this._onProgressFinished ??= this.onProgressFinishedEvent.publicApi())
  }

  /**
   * Fired when the size of the progress bar changes.
   * Used by Layout2D (ElementHandler) and legacy LayoutItem to detect size changes.
   */
  private _onSizeChanged?: PublicApi<vec3>
  public get onSizeChanged(): PublicApi<vec3> {
    return (this._onSizeChanged ??= this.onSizeChangedEvent.publicApi())
  }

  /**
   * Fired once when the progress bar has finished initialization.
   * Used by legacy LayoutItem to defer size sync until ready.
   */
  private _onInitialized?: PublicApi<void>
  public get onInitialized(): PublicApi<void> {
    return (this._onInitialized ??= this.onInitializedEvent.publicApi())
  }

  public get initialized(): boolean {
    return this._initialized
  }

  public get currentValue(): number {
    return this._currentValue
  }

  public set currentValue(value: number) {
    if (value === undefined) {
      return
    }
    this.updateValue(value, false)
  }

  public get width(): number {
    return this._size.x
  }

  public set width(value: number) {
    this.size = new vec3(value, this._size.y, this._size.z)
  }

  public get height(): number {
    return this._size.y
  }

  public set height(value: number) {
    this.size = new vec3(this._size.x, value, this._size.z)
  }

  public get depth(): number {
    return this._size.z
  }

  public set depth(value: number) {
    this.size = new vec3(this._size.x, this._size.y, value)
  }

  public get layoutSize(): vec3 {
    return this._size
  }

  public get size(): vec3 {
    return this._size
  }

  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    if (this._size.x === size.x && this._size.y === size.y && this._size.z === size.z) {
      return
    }
    this._size = size
    if (this._initialized && this._trackVisual) {
      this._trackVisual.size = this._size
      this._trackVisual.cornerRadius = this._size.y * this.cornerRadiusFactor
      this.updateFillSize()
      this.onSizeChangedEvent.invoke(this._size)
    }
  }

  public updateValue(value: number, shouldAnimate: boolean = false): void {
    value = clamp(value, 0, 1)

    const valueChanged = value !== this._currentValue
    const needsCancelAnimation = !shouldAnimate && this._isAnimating
    if (!valueChanged && !needsCancelAnimation) {
      return
    }

    this._currentValue = value

    if (this._initialized) {
      if (shouldAnimate) {
        this._springAnimate.reset()
        this._isAnimating = true
      } else {
        this._displayValue = value
        this._isAnimating = false
        this.updateFillSize()
      }
    } else {
      this._displayValue = value
    }

    if (valueChanged) {
      this.onValueChangedEvent.invoke(this._currentValue)

      if (this._currentValue >= 1 && !this._progressFinishedFired) {
        this._progressFinishedFired = true
        this.onProgressFinishedEvent.invoke()
      } else if (this._currentValue < 1) {
        this._progressFinishedFired = false
      }
    }
  }

  public onAwake(): void {
    this.createEvent("OnStartEvent").bind(this.onStart)
    this.createEvent("UpdateEvent").bind(this.onUpdateEvent)
    this.createEvent("OnDestroyEvent").bind(this.onDestroy)
    this.createEvent("OnEnableEvent").bind(this.onEnabled)
    this.createEvent("OnDisableEvent").bind(this.onDisabled)
  }

  private onStart = () => {
    if (!this._initialized) {
      this.initialize()
    }
  }

  private onUpdateEvent = () => {
    if (this._initialized) {
      this.onUpdate()
    }
  }

  private onDestroy = () => {
    this.release()
  }

  private onEnabled = () => {
    this.enableVisuals()
  }

  private onDisabled = () => {
    this.disableVisuals()
  }

  private resolveTheme(): Theme {
    const mgr = ThemeService.getInstance()
    const override = this._themeOverride === "Default" ? "Inherited" : this._themeOverride
    if (override !== "Inherited") {
      return mgr.getTheme(override) ?? mgr.currentTheme
    }
    return mgr.currentTheme
  }

  private get cornerRadiusFactor(): number {
    const data = this.resolveTheme()?.componentData?.["ProgressBar"] as {cornerRadiusFactor?: number} | undefined
    return data?.cornerRadiusFactor ?? 0.5
  }

  private get trackStyle(): Partial<RoundedRectangleVisualParameters> {
    const themed = this.resolveTheme()?.styles["ProgressBarTrack"]?.["default"]
    return themed ?? DEFAULT_TRACK_STYLE
  }

  private get fillStyle(): Partial<RoundedRectangleVisualParameters> {
    const themed = this.resolveTheme()?.styles["ProgressBarFill"]?.["default"]
    return themed ?? DEFAULT_FILL_STYLE
  }

  private initialize(): void {
    if (this._initialized) {
      return
    }

    this.trackObject = global.scene.createSceneObject("ProgressBarTrack")
    this.trackObject.setParent(this.sceneObject)
    this._trackVisual = new RoundedRectangleVisual({
      sceneObject: this.trackObject,
      style: this.trackStyle
    })
    this._trackVisual.initialize()
    this._trackVisual.size = this._size
    this._trackVisual.cornerRadius = this._size.y * this.cornerRadiusFactor

    this.fillObject = global.scene.createSceneObject("ProgressBarFill")
    this.fillObject.setParent(this.sceneObject)
    this._fillVisual = new RoundedRectangleVisual({
      sceneObject: this.fillObject,
      style: this.fillStyle
    })
    this._fillVisual.initialize()
    this._fillVisual.renderMeshVisual.renderOrder = 1

    this._initialized = true
    this.updateFillSize()

    if (this.addCallbacks) {
      this.onValueChanged.add(createCallbacks(this.onValueChangeCallbacks))
      this.onProgressFinished.add(createCallbacks(this.onProgressFinishedCallbacks))
    }

    this.onInitializedEvent.invoke()

    if (this._currentValue > 0) {
      this.onValueChangedEvent.invoke(this._currentValue)
      if (this._currentValue >= 1) {
        this._progressFinishedFired = true
        this.onProgressFinishedEvent.invoke()
      }
    }
  }

  private updateFillSize(): void {
    if (!this._fillVisual || !this._trackVisual) {
      return
    }

    const value = this._displayValue

    if (value <= 0) {
      this._fillVisual.renderMeshVisual.enabled = false
      return
    }

    this._fillVisual.renderMeshVisual.enabled = true

    const borderSize = this._trackVisual.borderSize
    const maxFillWidth = this._size.x - borderSize * 2
    const maxFillHeight = this._size.y - borderSize * 2
    const cornerDiameter = maxFillHeight
    const radiusFactor = this.cornerRadiusFactor

    const fillWidth = lerp(cornerDiameter, maxFillWidth, value)
    const fillX = lerp(maxFillWidth * -0.5 + cornerDiameter * 0.5, 0, value)

    this._fillLocalPos.x = fillX
    this._fillVisual.transform.setLocalPosition(this._fillLocalPos)

    const fillSize = new vec3(fillWidth, maxFillHeight, this._size.z)
    this._fillVisual.size = fillSize
    this._fillVisual.cornerRadius = maxFillHeight * radiusFactor
  }

  private onUpdate(): void {
    if (!this._isAnimating || !this._initialized) {
      return
    }

    const min = Math.min(this._currentValue, this._displayValue)
    const max = Math.max(this._currentValue, this._displayValue)

    this._springCurrent.x = this._displayValue
    this._springTarget.x = this._currentValue
    this._springResult.x = this._displayValue

    this._springAnimate.evaluate(this._springCurrent, this._springTarget, this._springResult)

    this._displayValue = clamp(this._springResult.x, min, max)

    if (Math.abs(this._displayValue - this._currentValue) <= SPRING_EPSILON) {
      this._displayValue = this._currentValue
      this._isAnimating = false
    }

    this.updateFillSize()
  }

  private enableVisuals(): void {
    if (!this._initialized) {
      return
    }
    if (this._trackVisual && !isNull(this._trackVisual)) {
      this._trackVisual.enable()
    }
    if (this._fillVisual && !isNull(this._fillVisual)) {
      this._fillVisual.enable()
    }
  }

  private disableVisuals(): void {
    if (!this._initialized) {
      return
    }
    if (this._trackVisual && !isNull(this._trackVisual)) {
      this._trackVisual.disable()
    }
    if (this._fillVisual && !isNull(this._fillVisual)) {
      this._fillVisual.disable()
    }
  }

  private release(): void {
    if (this._fillVisual && !isNull(this._fillVisual)) {
      this._fillVisual.destroy()
    }
    this._fillVisual = null
    if (this._trackVisual && !isNull(this._trackVisual)) {
      this._trackVisual.destroy()
    }
    this._trackVisual = null
    if (this.fillObject && !isNull(this.fillObject)) {
      this.fillObject.destroy()
    }
    this.fillObject = null
    if (this.trackObject && !isNull(this.trackObject)) {
      this.trackObject.destroy()
    }
    this.trackObject = null
  }
}
