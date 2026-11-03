import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {HSVtoRGB} from "../../Utility/UIKitUtilities"
import {GradientParameters, RoundedRectangle} from "../../Visuals/RoundedRectangle/RoundedRectangle"
import {
  RoundedRectangleVisual,
  RoundedRectangleVisualParameters
} from "../../Visuals/RoundedRectangle/RoundedRectangleVisual"
import {Visual} from "../../Visuals/Visual"
import {DEFAULT_CORNER_RADIUS_FACTOR, Slider} from "./Slider"

export enum ColorSliderMode {
  Hue = "Hue",
  Value = "Value"
}

const BLACK = new vec4(0, 0, 0, 1)
const RED = new vec4(1, 0, 0, 1)
const YELLOW = new vec4(1, 1, 0, 1)
const GREEN = new vec4(0, 1, 0, 1)
const CYAN = new vec4(0, 1, 1, 1)
const BLUE = new vec4(0, 0, 1, 1)
const MAGENTA = new vec4(1, 0, 1, 1)

const HUE_GRADIENT: GradientParameters = {
  type: "Linear",
  start: new vec2(-1, 0),
  end: new vec2(1, 0),
  stop0: {percent: 0.0, color: RED},
  stop1: {percent: 0.167, color: YELLOW},
  stop2: {percent: 0.333, color: GREEN},
  stop3: {percent: 0.5, color: CYAN},
  stop4: {percent: 0.667, color: BLUE},
  stop5: {percent: 0.833, color: MAGENTA},
  stop6: {percent: 1.0, color: RED}
}

/**
 * A color slider for selecting hue or value (brightness).
 *
 * In Hue mode the track displays a full-spectrum rainbow gradient and the
 * slider value maps to hue (0 = red, 1 = red, completing the full 360° loop).
 *
 * In Value mode the track displays a gradient from black to a given hue
 * color, and the slider value maps to brightness (0 = black, 1 = full color).
 *
 * The knob dynamically reflects the color at the current slider position.
 * Fill is managed manually ({@link Visual.shouldColorChange} = false) while
 * borders continue to animate normally on hover/trigger.
 *
 * @extends Slider
 */
@component
export class ColorSlider extends Slider {
  @input("string")
  @hint("Slider mode: Hue for full rainbow, Value for a black-to-color gradient")
  @widget(new ComboBoxWidget([new ComboBoxItem("Hue"), new ComboBoxItem("Value")]))
  private _mode: ColorSliderMode = ColorSliderMode.Hue

  private _hueColor: vec4 = new vec4(1, 0, 0, 1)
  private _knobOverflow: boolean = true

  private onColorChangeEvent: Event<vec4> = new Event()
  private _onColorChange?: PublicApi<vec4>
  public get onColorChange(): PublicApi<vec4> {
    return (this._onColorChange ??= this.onColorChangeEvent.publicApi())
  }

  public readonly hasTrackVisual: boolean = false

  /**
   * The color at the current knob position.
   */
  public get selectedColor(): vec4 {
    return this.getColorAtValue(this.knobValue)
  }

  /**
   * The slider mode: "Hue" or "Value".
   */
  public get mode(): ColorSliderMode {
    return this._mode
  }

  public set mode(value: ColorSliderMode) {
    this._mode = value
    if (this._initialized) {
      this.applyTrackGradient()
      this.updateKnobColor()
    }
  }

  /**
   * The reference hue color used by the Value mode track gradient.
   * Setting this updates the track gradient and knob color in real time.
   */
  public get hueColor(): vec4 {
    return this._hueColor
  }

  public set hueColor(color: vec4) {
    if (color === undefined || color === null) {
      return
    }
    this._hueColor = color
    if (this._initialized) {
      if (this._mode === ColorSliderMode.Value) {
        this.applyValueGradient()
      }
      this.updateKnobColor()
    }
  }

  /**
   * When true the knob can travel past the track edges. When false
   * it stays inset by half the knob width (default Slider behavior).
   */
  public get knobOverflow(): boolean {
    return this._knobOverflow
  }

  public set knobOverflow(value: boolean) {
    this._knobOverflow = value
    if (this._initialized) {
      this.updateKnobPositionFromValue()
    }
  }

  protected override get defaultTrackStyle(): Partial<RoundedRectangleVisualParameters> {
    const themed = this.resolveTheme()?.styles["ColorSliderTrack"]?.["default"]
    return themed ?? super.defaultTrackStyle
  }

  protected override get defaultKnobStyle(): Partial<RoundedRectangleVisualParameters> {
    const themed = this.resolveTheme()?.styles["ColorSliderKnob"]?.["default"]
    return themed ?? super.defaultKnobStyle
  }

  protected override get cornerRadiusFactor(): number {
    const data = this.resolveTheme()?.componentData?.["ColorSlider"] as {cornerRadiusFactor?: number} | undefined
    return data?.cornerRadiusFactor ?? DEFAULT_CORNER_RADIUS_FACTOR
  }

  protected override get knobObjectName(): string {
    return "ColorSliderKnob"
  }

  protected override get trackFillObjectName(): string {
    return "ColorSliderTrackFill"
  }

  protected override createDefaultVisual(): void {
    super.createDefaultVisual()

    const knobVisual = this.asRoundedRectangleVisual(this._knobVisual)
    if (knobVisual) {
      const knobData = this.resolveTheme()?.componentData?.["ColorSliderKnob"] as {knobVisible?: boolean} | undefined
      const knobVisible = knobData?.knobVisible ?? true
      knobVisual.renderMeshVisual.enabled = knobVisible
      knobVisual.shouldColorChange = false
      if (this.defaultKnobStyle?.default?.baseType === "Color") {
        knobVisual.baseType = "Color"
      }
    }

    const trackVisual = this.asRoundedRectangleVisual(this._visual)
    if (trackVisual) {
      trackVisual.shouldColorChange = false
    }
  }

  public override initialize(): void {
    super.initialize()

    // Cancel the track's initial gradient animation (started in constructor)
    // so we can apply the manual hue/value gradient below.
    this.asRoundedRectangleVisual(this._visual)?.cancelAnimations()

    this.applyTrackGradient()
    this.updateKnobColor()
  }

  private asRoundedRectangleVisual(visual: Visual | undefined): RoundedRectangleVisual | null {
    if (visual instanceof RoundedRectangleVisual) {
      return visual
    }
    return null
  }

  protected override getKnobPositionFromValue(value: number): number {
    if (this._knobOverflow) {
      return (value - 0.5) * this.size.x
    }
    return super.getKnobPositionFromValue(value)
  }

  protected override get trackLength(): number {
    if (this._knobOverflow) {
      return this.size.x
    }
    return super.trackLength
  }

  protected override updateKnobPositionFromValue(): void {
    super.updateKnobPositionFromValue()
    this.updateKnobColor()
  }

  /**
   * Applies the gradient to the track visual based on the current mode.
   */
  private applyTrackGradient(): void {
    if (!this._visual) {
      return
    }
    if (this._mode === ColorSliderMode.Hue) {
      this.applyHueGradient()
    } else {
      this.applyValueGradient()
    }
  }

  private applyHueGradient(): void {
    const rr = this.getTrackRoundedRectangle()
    if (!rr) {
      return
    }
    const trackVisual = this.asRoundedRectangleVisual(this._visual)
    if (!trackVisual) {
      return
    }
    trackVisual.defaultGradient = HUE_GRADIENT
    rr.gradient = true
    rr.setBackgroundGradient(HUE_GRADIENT)
  }

  private applyValueGradient(): void {
    const rr = this.getTrackRoundedRectangle()
    if (!rr) {
      return
    }
    const gradient: GradientParameters = {
      type: "Linear",
      start: vec2.left(),
      end: vec2.right(),
      stop0: {percent: 0, color: BLACK},
      stop1: {percent: 1, color: this._hueColor}
    }
    const trackVisual = this.asRoundedRectangleVisual(this._visual)
    if (!trackVisual) {
      return
    }
    trackVisual.defaultGradient = gradient
    rr.gradient = true
    rr.setBackgroundGradient(gradient)
  }

  private updateKnobColor(): void {
    if (!this._knobVisual) {
      return
    }
    const color = this.getColorAtValue(this.knobValue)
    const knobRr = this.getKnobRoundedRectangle()
    if (knobRr) {
      knobRr.backgroundColor = color
    }
    this.onColorChangeEvent.invoke(color)
  }

  private getColorAtValue(value: number): vec4 {
    if (this._mode === ColorSliderMode.Hue) {
      return HSVtoRGB(value * 360, 1, 1, 1)
    }
    return new vec4(this._hueColor.r * value, this._hueColor.g * value, this._hueColor.b * value, 1)
  }

  private getKnobRoundedRectangle(): RoundedRectangle | null {
    if (!this._knobVisual) {
      return null
    }
    return this.getRoundedRectangle(this._knobVisual.sceneObject)
  }

  private getTrackRoundedRectangle(): RoundedRectangle | null {
    if (!this._visual) {
      return null
    }
    return this.getRoundedRectangle(this._visual.sceneObject)
  }

  private getRoundedRectangle(sceneObject: SceneObject | undefined): RoundedRectangle | null {
    if (!sceneObject) {
      return null
    }
    return sceneObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle | null
  }
}
