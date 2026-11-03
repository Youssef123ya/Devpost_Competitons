import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {OpacityControllable} from "../../Interfaces/OpacityControllable"
import {BeveledPrismVisual} from "../../Visuals/BeveledPrism/BeveledPrismVisual"
import {RoundedRectangleVisual} from "../../Visuals/RoundedRectangle/RoundedRectangleVisual"
import {BaseButton} from "./BaseButton"

// Default corner radius (cm) for a Rectangle-shape button. Exported so
// containers (e.g. ElementGroup) can derive a concentric outer radius from it
// instead of duplicating the literal.
export const DEFAULT_BUTTON_CORNER_RADIUS: number = 0.35

const log = new NativeLogger("Button")

// Inspector combobox values per theme. setVariant validates against these
// to catch typos at the call site instead of silently falling back at
// resolve time.
const VALID_SHAPES: Record<string, ReadonlyArray<string>> = {
  SnapOS2: ["Rectangle", "Capsule", "Round"],
  SnapOS3: ["Rectangle", "Capsule", "Round"]
}

// TODO(uikit-visual-factory): Visual selection here uses hardcoded (theme,
// style) checks + per-type instanceof helpers, which won't scale beyond the
// current two Visual subclasses. Follow-up should replace with a
// (theme, style) → VisualFactory registry where each Visual self-registers.
// Specifically:
//   - usesPrismVisual + the parallel branches in createDefaultVisual
//     → factory lookup (one construction path)
//   - getVisualAsRoundedRectVisual / getVisualAsBeveledPrismVisual
//     → a SizableVisual interface (size, cornerRadius) — drops instanceof
//   - shouldOverrideCornerRadius's Prism+Rectangle special-case
//     → Visual.autoCornerRadiusForShape(shape) getter (decision lives on
//       the Visual, not Button)
//   - setTheme's per-theme style-field switch (writes _styleSnapOS2 vs
//     _styleSnapOS3): if other components grow multi-style choices, lift
//     to a polymorphic `setStyleField(style)` hook on VisualElement. For
//     now Button is the only multi-style component so the switch is here.
// Tracking ticket: TBD.

/**
 * Main Button component for UIKit
 * Select Theme, Shape and Style
 */
@component
export class Button extends BaseButton implements OpacityControllable {
  @input
  @showIf("_themeOverride", "SnapOS2")
  @label("Shape")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Rectangle", "Rectangle"),
      new ComboBoxItem("Capsule", "Capsule"),
      new ComboBoxItem("Round", "Round")
    ])
  )
  protected _shapeSnapOS2: string = "Rectangle"

  @input
  @showIf("_themeOverride", "SnapOS3")
  @label("Shape")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Rectangle", "Rectangle"),
      new ComboBoxItem("Capsule", "Capsule"),
      new ComboBoxItem("Round", "Round")
    ])
  )
  protected _shapeSnapOS3: string = "Rectangle"

  @input
  @showIf("_themeOverride", "SnapOS2")
  @label("Style")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("PrimaryNeutral", "PrimaryNeutral"),
      new ComboBoxItem("Primary", "Primary"),
      new ComboBoxItem("Secondary", "Secondary"),
      new ComboBoxItem("Special", "Special"),
      new ComboBoxItem("Ghost", "Ghost")
    ])
  )
  protected _styleSnapOS2: string = "PrimaryNeutral"

  @input
  @showIf("_themeOverride", "SnapOS3")
  @label("Style")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Prism", "Prism"),
      new ComboBoxItem("PrismGhost", "PrismGhost"),
      new ComboBoxItem("Primary", "Primary"),
      new ComboBoxItem("Secondary", "Secondary"),
      new ComboBoxItem("Ghost", "Ghost")
    ])
  )
  protected _styleSnapOS3: string = "Primary"

  protected get effectiveStyle(): string {
    switch (this.normalizedThemeOverride) {
      case "SnapOS2":
        return this._styleSnapOS2
      case "SnapOS3":
        return this._styleSnapOS3
      default:
        return this.resolveTheme().defaultStyleName
    }
  }

  protected get effectiveShape(): string {
    switch (this.normalizedThemeOverride) {
      case "SnapOS2":
        return this._shapeSnapOS2
      case "SnapOS3":
        return this._shapeSnapOS3
      default:
        return this.resolveTheme().defaultShapeName ?? "Rectangle"
    }
  }

  @input
  @widget(new SliderWidget(0, 1))
  protected _opacity: number = 1.0

  public get opacity(): number {
    const roundedRectVisual = this.getVisualAsRoundedRectVisual()
    if (roundedRectVisual) {
      return roundedRectVisual.opacity
    }
    const prismVisual = this.getVisualAsBeveledPrismVisual()
    return prismVisual ? prismVisual.opacity : this._opacity
  }

  public set opacity(opacity: number) {
    this._opacity = opacity
    const roundedRectVisual = this.getVisualAsRoundedRectVisual()
    if (roundedRectVisual) {
      if (!this.isAlwaysTransparent) {
        roundedRectVisual.transparencyEnabled = opacity < 1.0
      }
      roundedRectVisual.opacity = opacity
      return
    }
    const prismVisual = this.getVisualAsBeveledPrismVisual()
    if (prismVisual) {
      prismVisual.opacity = opacity
    }
  }

  public get size(): vec3 {
    return this._size
  }

  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    const shape = this.effectiveShape
    if (shape === "Round") {
      size = new vec3(size.x, size.x, size.z)
    }
    super.size = size
    if (this._initialized) {
      const rrVisual = this.getVisualAsRoundedRectVisual()
      if (rrVisual) {
        rrVisual.size = size
        rrVisual.cornerRadius = this.getCornerRadius()
      } else {
        const prismVisual = this.getVisualAsBeveledPrismVisual()
        if (prismVisual) {
          prismVisual.size = size
          if (this.shouldOverrideCornerRadius) {
            prismVisual.cornerRadius = this.getCornerRadius()
          }
        }
      }
    }
  }

  /**
   * Programmatically set the theme override and style before initialize().
   * Must be called before initialize() — createDefaultVisual() reads both
   * fields at init time to pick the Visual subclass. Replaces direct field
   * assignment from runtime callers (tests, dynamic UI factories) that
   * can't drag values in the LS Inspector.
   *
   * Theme half delegates to `VisualElement.setThemeOverride` (reusable by
   * any themeable component); the style switch is Button-specific by
   * current convention — each themeable component declares its own
   * `_styleSnapOS{N}` fields. If style becomes polymorphic, lift to a
   * `setStyleField` hook on VisualElement (see Visual factory TODO above).
   *
   * @param theme  "SnapOS2", "SnapOS3", or "Inherited"
   * @param style  style name valid for the chosen theme (e.g. "Prism",
   *               "Primary", "Secondary", "Ghost"). Invalid styles fall
   *               back to the theme's default at resolve time.
   */
  public setTheme(theme: string, style: string): void {
    this.setVariant({theme, style})
  }

  /**
   * Type-safe pre-initialize configuration. Sets theme override, shape,
   * and style in one call so runtime factories don't have to reach into
   * private fields via `as any` casts. Must be called before initialize().
   *
   * Shape and style are written to the theme-specific private fields
   * (`_shapeSnapOS{2,3}`, `_styleSnapOS{2,3}`), so they require a concrete
   * theme to be set — either passed in this call as `opts.theme`, or set
   * earlier via `setThemeOverride`. If the effective theme is "Inherited"
   * or anything else, shape/style writes are dropped with a warning.
   *
   * Unknown shape/style values for the chosen theme also warn but still
   * write (matching the framework's "invalid value falls back to theme
   * default at resolve time" semantics).
   *
   * @param opts.theme  "SnapOS2" | "SnapOS3" | "Inherited" (theme override).
   * @param opts.shape  Shape name valid for the chosen theme — e.g.
   *                    "Rectangle" | "Round" | "Capsule". Requires a
   *                    concrete (non-Inherited) theme to be set.
   * @param opts.style  Style name valid for the chosen theme — e.g.
   *                    "Prism" | "Primary" | "Secondary" | "Ghost" for
   *                    SnapOS3; "PrimaryNeutral" | "Primary" | "Secondary"
   *                    | "Special" | "Ghost" for SnapOS2. Requires a
   *                    concrete theme to be set.
   */
  public setVariant(opts: {theme?: string; shape?: string; style?: string}): void {
    if (opts.theme !== undefined) {
      this.setThemeOverride(opts.theme)
    }
    const theme = this.normalizedThemeOverride
    const themeIsResolvable = theme === "SnapOS2" || theme === "SnapOS3"
    const where = this.sceneObject.name

    if (opts.shape !== undefined) {
      if (!themeIsResolvable) {
        log.w(
          `setVariant on ${where}: dropping shape "${opts.shape}" — theme override is "${theme}". ` +
            `Set theme to SnapOS2 or SnapOS3 first.`
        )
      } else {
        const validShapes = VALID_SHAPES[theme]
        if (!validShapes.includes(opts.shape)) {
          log.w(
            `setVariant on ${where}: shape "${opts.shape}" is not a known ${theme} shape. ` +
              `Valid: ${validShapes.join(", ")}.`
          )
        }
        if (theme === "SnapOS2") {
          this._shapeSnapOS2 = opts.shape
        } else {
          this._shapeSnapOS3 = opts.shape
        }
      }
    }

    if (opts.style !== undefined) {
      if (!themeIsResolvable) {
        log.w(
          `setVariant on ${where}: dropping style "${opts.style}" — theme override is "${theme}". ` +
            `Set theme to SnapOS2 or SnapOS3 first.`
        )
      } else {
        const buttonStyles = this.resolveTheme().styles?.Button
        if (buttonStyles && !(opts.style in buttonStyles)) {
          log.w(
            `setVariant on ${where}: style "${opts.style}" is not defined for theme "${theme}". ` +
              `Valid: ${Object.keys(buttonStyles).join(", ")}. ` +
              `Invalid styles fall back to the theme default at resolve time.`
          )
        }
        if (theme === "SnapOS2") {
          this._styleSnapOS2 = opts.style
        } else {
          this._styleSnapOS3 = opts.style
        }
      }
    }
  }

  protected createDefaultVisual(): void {
    if (this._visual) {
      return
    }

    const shape = this.effectiveShape
    if (shape === "Round") {
      this._size = new vec3(this._size.x, this._size.x, 1)
    }

    const styleKey = {
      visualElementType: "Button",
      style: this.effectiveStyle,
      themeName: this.normalizedThemeOverride !== "Inherited" ? this.normalizedThemeOverride : undefined
    }

    if (this.usesPrismVisual) {
      const prismVisual = new BeveledPrismVisual({
        sceneObject: this.sceneObject,
        style: styleKey
      })
      if (this.shouldOverrideCornerRadius) {
        prismVisual.cornerRadius = this.getCornerRadius()
      }
      prismVisual.opacity = this._opacity
      this._visual = prismVisual
      return
    }

    const alwaysTransparent = this.isAlwaysTransparent
    const defaultVisual: RoundedRectangleVisual = new RoundedRectangleVisual({
      sceneObject: this.sceneObject,
      style: styleKey,
      transparent: alwaysTransparent || this._opacity < 1.0
    })
    defaultVisual.cornerRadius = this.getCornerRadius()
    defaultVisual.opacity = this._opacity
    this._visual = defaultVisual
  }

  protected get isAlwaysTransparent(): boolean {
    const style = this.effectiveStyle
    // Ghost and Secondary are outline styles with a transparent fill, so they
    // need alpha blending (PremultipliedAlphaAuto) even at full opacity.
    // Otherwise the default Disabled (opaque) blend mode ignores the fill's
    // alpha and the transparent background renders as solid.
    return style === "Ghost" || style === "Secondary"
  }

  // Prism style uses the beveled prism shader stack instead of the flat
  // rounded rectangle. Only valid under SnapOS3 — earlier themes don't
  // ship the prism material.
  protected get usesPrismVisual(): boolean {
    if (this.normalizedThemeOverride !== "SnapOS3") {
      return false
    }
    const style = this.effectiveStyle
    return style === "Prism" || style === "PrismGhost"
  }

  // Capsule and Round shapes need cornerRadius derived from size to be
  // geometrically correct, so Button always overrides those. Rectangle
  // Prism leaves the corner up to the theme so designers can tune it.
  protected get shouldOverrideCornerRadius(): boolean {
    if (this.usesPrismVisual && this.effectiveShape === "Rectangle") {
      return false
    }
    return true
  }

  private getCornerRadius(): number {
    const shape = this.effectiveShape
    switch (shape) {
      case "Capsule":
        return Math.min(this._size.x, this._size.y) * 0.5
      case "Round":
        return this._size.x * 0.5
      default:
        return DEFAULT_BUTTON_CORNER_RADIUS
    }
  }

  private getVisualAsRoundedRectVisual(): RoundedRectangleVisual | undefined {
    if (!this._visual) {
      return undefined
    }
    if (!(this._visual instanceof RoundedRectangleVisual)) {
      return undefined
    }
    return this._visual as RoundedRectangleVisual
  }

  private getVisualAsBeveledPrismVisual(): BeveledPrismVisual | undefined {
    if (!this._visual) {
      return undefined
    }
    if (!(this._visual instanceof BeveledPrismVisual)) {
      return undefined
    }
    return this._visual as BeveledPrismVisual
  }
}
