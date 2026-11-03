// ═══════════════════════════════════════════════════════════════════════════
// LayoutItem2D.ts — Abstract base class for per-item layout components.
//
// Shared between FlexItem and GridItem. Handles:
// - Handler resolution via ItemHandlerRegistry.resolve() on OnStart
// - Parent layout reference and dirty propagation
// - Allocated size tracking
// - measureIntrinsic() / measure() / applyLayout() delegation to handler
//
// Usage patterns:
// 1. **Recognized content** (Element, Shape, Text, Image, mesh, etc.) — drop
//    a FlexItem/GridItem on the SceneObject; the matching handler resolves
//    automatically and provides intrinsic sizing.
// 2. **Naked LayoutItem2D with overrides** — attach a FlexItem/GridItem to a
//    SceneObject that has *no* handler-recognizable content and set
//    `overrideWidth` / `overrideHeight`. Preferred falls back to those
//    overrides; min/max default to user clamps (or 0 / ∞). This is the
//    canonical pattern for shaping containers around content the registry
//    can't introspect.
// 3. **Custom handler** — implement `ItemHandler` and call
//    `ItemHandlerRegistry.register(handler, priority)` to teach the system
//    a new content type. See ItemHandlerRegistry.register's JSDoc.
// ═══════════════════════════════════════════════════════════════════════════

import {ContentMeasurement, ItemHandler, ItemHandlerRegistry, Size} from "./ItemHandlerRegistry"
// UIKit-specific handlers (Element, Shape, LayoutContainer, StandaloneContent,
// CustomFlexContainer) are NOT imported here. They register themselves via
// `Assets/SpectaclesUIKit/Scripts/UIKitBootstrap.ts`, which is imported in
// turn from UIKit's top-level component files (Element, Frame, ScrollWindow,
// ProgressBar, ElementContent). Keeping this layer free of UIKit imports
// lets Layout2D ship standalone — apps that only want native handlers
// (Text / Image / mesh / collider) don't pay for UIKit code they don't use.

/**
 * Abstract base class for per-item layout components (FlexItem, GridItem).
 * Handles handler resolution via {@link ItemHandlerRegistry}, parent layout
 * dirty propagation, allocated size tracking, and measure/apply delegation.
 */
export abstract class LayoutItem2D extends BaseScriptComponent {
  // ─── Internal State ──────────────────────────────────────────────────

  private _handler: ItemHandler | null = null
  private _handlerComponent: any = null
  private _transform: Transform | null = null
  protected _parentLayout: {markDirty(): void} | null = null
  private _initialized: boolean = false

  /** Last allocated size from the layout pass (for debug visualization). */
  private _allocatedWidth: number = -1
  private _allocatedHeight: number = -1

  /** Opt-in measurement caching — avoids repeated handler.measure() calls. */
  private _cacheMeasurement: boolean = false
  private _cachedIntrinsic: ContentMeasurement | null = null

  // ─── Size Override & Constraints (shared fields) ────────────────────
  // Inspector decorators are in subclasses (FlexItem, GridItem) to control
  // visual ordering. The base class holds the fields, getters/setters, and logic.

  protected abstract _overrideWidth: number
  protected abstract _overrideHeight: number
  protected abstract _hasOverrideWidth: boolean
  protected abstract _hasOverrideHeight: boolean
  protected abstract _minWidth: number
  protected abstract _maxWidth: number
  protected abstract _minHeight: number
  protected abstract _maxHeight: number
  protected abstract _aspectRatio: number

  // ─── Public Accessors ─────────────────────────────────────────────────

  /** Whether this item's handler has been resolved (after OnStart). */
  public get initialized(): boolean {
    return this._initialized
  }

  /** The resolved content-type handler, or null if not yet initialized. */
  public get handler(): ItemHandler | null {
    return this._handler
  }

  /**
   * Explicit intrinsic width override in cm.
   *
   * Setting any value (including `0`) via this setter pins the width to that
   * value and ignores the handler's `preferred.width`. To stop overriding,
   * call {@link clearOverrideWidth} instead of setting `0` — `0` is now a
   * legitimate explicit size.
   *
   * Inspector-authored values follow a backward-compatible fallback: a value
   * of `0` in the @input field means "unset" (handler decides), any value
   * `> 0` means override. So existing prefabs continue to work without
   * migration. See {@link hasOverrideWidth} for the resolved flag.
   */
  public get overrideWidth(): number {
    return this._overrideWidth
  }
  public set overrideWidth(value: number) {
    const clamped = Math.max(0, value)
    if (this._overrideWidth === clamped && this._hasOverrideWidth) return
    this._overrideWidth = clamped
    this._hasOverrideWidth = true
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Symmetric to {@link overrideWidth}. */
  public get overrideHeight(): number {
    return this._overrideHeight
  }
  public set overrideHeight(value: number) {
    const clamped = Math.max(0, value)
    if (this._overrideHeight === clamped && this._hasOverrideHeight) return
    this._overrideHeight = clamped
    this._hasOverrideHeight = true
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /**
   * Whether the width override is currently active.
   *
   * `true` if the programmatic setter has been called OR if the inspector
   * @input value is `> 0` (the legacy sentinel — preserved so prefabs that
   * set a size in the inspector continue to behave the same).
   */
  public get hasOverrideWidth(): boolean {
    return this._hasOverrideWidth || this._overrideWidth > 0
  }

  /** Symmetric to {@link hasOverrideWidth}. */
  public get hasOverrideHeight(): boolean {
    return this._hasOverrideHeight || this._overrideHeight > 0
  }

  /**
   * Stops overriding the width. After this call {@link hasOverrideWidth} is
   * `false` and the handler's `preferred.width` is used. Use this instead of
   * `overrideWidth = 0` when you want to unset an override — `= 0` now means
   * "explicitly pin the width to 0."
   */
  public clearOverrideWidth(): void {
    if (!this._hasOverrideWidth && this._overrideWidth === 0) return
    this._hasOverrideWidth = false
    this._overrideWidth = 0
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Symmetric to {@link clearOverrideWidth}. */
  public clearOverrideHeight(): void {
    if (!this._hasOverrideHeight && this._overrideHeight === 0) return
    this._hasOverrideHeight = false
    this._overrideHeight = 0
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /**
   * Intrinsic aspect ratio (`width / height`), mirroring CSS `aspect-ratio`.
   *
   * When the ratio is active and the item's main axis is `auto` (flex-basis
   * auto, with neither grow nor shrink), the Flex engine derives the main-axis
   * size from the resolved cross size to preserve it — clamping bidirectionally,
   * so if the derived size hits a min/max the *other* axis follows instead of
   * distorting the ratio.
   *
   * Tri-state: `> 0` = explicit ratio (wins over any handler ratio); `< 0` =
   * disabled (no ratio, even if the content handler reports one); `0` (default)
   * = inherit the handler's intrinsic ratio (e.g. an Image's texture aspect).
   * An explicit `overrideWidth`/`overrideHeight` also suppresses the handler
   * ratio — the author is sizing that axis manually. Consumed by the Flex
   * engine; Grid currently ignores it.
   */
  public get aspectRatio(): number {
    return this._aspectRatio
  }
  public set aspectRatio(value: number) {
    // > 0 explicit ratio; < 0 disables (no ratio even if a handler reports one);
    // 0 inherits the handler's intrinsic ratio (e.g. an Image's texture).
    const clamped = value > 0 ? value : value < 0 ? -1 : 0
    if (this._aspectRatio === clamped) return
    this._aspectRatio = clamped
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Minimum width constraint in cm. 0 means no minimum. */
  public get minWidth(): number {
    return this._minWidth
  }
  public set minWidth(value: number) {
    if (this._minWidth === value) return
    this._minWidth = Math.max(0, value)
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Maximum width constraint in cm. 0 means no maximum. */
  public get maxWidth(): number {
    return this._maxWidth
  }
  public set maxWidth(value: number) {
    if (this._maxWidth === value) return
    this._maxWidth = Math.max(0, value)
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Minimum height constraint in cm. 0 means no minimum. */
  public get minHeight(): number {
    return this._minHeight
  }
  public set minHeight(value: number) {
    if (this._minHeight === value) return
    this._minHeight = Math.max(0, value)
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /** Maximum height constraint in cm. 0 means no maximum. */
  public get maxHeight(): number {
    return this._maxHeight
  }
  public set maxHeight(value: number) {
    if (this._maxHeight === value) return
    this._maxHeight = Math.max(0, value)
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /**
   * When true, `measure()` / `measureIntrinsic()` cache their result and return
   * the cached value on subsequent calls. The full {min, preferred, max} triple
   * is cached as a single object. The cache is cleared automatically when
   * override sizes or constraints change, or manually via {@link invalidateMeasure}.
   *
   * **Default is off.** Enable per-item when sizes are known to be stable
   * (pooled items, fixed-size tiles, static content).
   */
  public get cacheMeasurement(): boolean {
    return this._cacheMeasurement
  }
  public set cacheMeasurement(value: boolean) {
    this._cacheMeasurement = value
    if (!value) this._cachedIntrinsic = null
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────

  public onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => {
      this._transform = this.sceneObject.getTransform()
      const resolved = ItemHandlerRegistry.resolve(this.sceneObject)
      if (resolved) {
        this._handler = resolved.handler
        this._handlerComponent = resolved.component
      }
      this._initialized = true
      if (this._parentLayout) {
        this._parentLayout.markDirty()
      }
    })
  }

  // ─── Public Methods ─────────────────────────────────────────────────

  /**
   * Associates this item with a parent layout for dirty propagation.
   * Called automatically by the layout container during child discovery.
   * @param layout - The parent layout (must have a `markDirty()` method), or null to detach.
   */
  public setParentLayout(layout: {markDirty(): void} | null): void {
    this._parentLayout = layout
  }

  /**
   * Composite-widget extension point. Subclasses (e.g. a `LabeledSlider`
   * that wants to declare its measure as "slider width + label width" without
   * registering a custom ItemHandler) can override this to provide a
   * {@link ContentMeasurement} directly.
   *
   * Return `null` (the default) to fall through to the registered handler
   * (or to the no-handler `{0, 0}` fallback). User-facing overrides
   * (`overrideWidth`, `minWidth`, `maxWidth`) still apply on top of whatever
   * this returns — they're the user's clamps and pin axes as documented in
   * {@link measureIntrinsic}.
   *
   * Call `invalidateMeasure()` when the underlying composite state changes
   * if measurement caching is on.
   */
  protected measureOverride(): ContentMeasurement | null {
    return null
  }

  /**
   * Measures the content's intrinsic size as a min / preferred / max triple in cm.
   *
   * Merge rules per axis:
   * - **preferred** ← `overrideWidth/Height` if {@link hasOverrideWidth}/{@link hasOverrideHeight},
   *   else `handler.preferred`. An explicit `overrideWidth = 0` pins to 0
   *   (distinct from "unset").
   * - **min** ← `max(user minWidth/Height clamp, handler.min)`. When the override is
   *   set on an axis, the handler's min for that axis is ignored — overrides
   *   pin the size to the user's value, so the user's clamp is the only floor.
   * - **max** ← `min(user maxWidth/Height clamp || ∞, handler.max)`. Same override rule.
   *
   * With no handler resolved, preferred falls back to the override values
   * if set, or `{0, 0}` if not — letting the parent layout decide what an
   * unspecified size means rather than inventing a `1×1` opinion.
   *
   * When {@link cacheMeasurement} is enabled the full {min, preferred, max}
   * triple is cached as a single object and returned on subsequent calls
   * until invalidated.
   */
  public measureIntrinsic(): ContentMeasurement {
    if (this._cacheMeasurement && this._cachedIntrinsic) {
      return this._cachedIntrinsic
    }

    // Drop stale handler if its component was destroyed.
    if (this._handler && this._handlerComponent && isNull(this._handlerComponent)) {
      this._handler = null
      this._handlerComponent = null
    }

    // Subclass override path: composite widgets (Tooltip, Dropdown, custom
    // composites) can implement `measureOverride()` to declare their own
    // intrinsics without going through the registry. The override result
    // *replaces* the handler-derived measurement; user overrides and clamps
    // (overrideWidth, minWidth, maxWidth) still apply on top.
    const subclassMeasurement = this.measureOverride()

    const handlerMeasurement: ContentMeasurement = subclassMeasurement
      ? subclassMeasurement
      : this._handler
        ? this._handler.measure(this.sceneObject, this._handlerComponent, this._transform!)
        : {
            min: {width: 0, height: 0},
            preferred: {width: 0, height: 0},
            max: {width: Infinity, height: Infinity}
          }

    const hasOverrideW = this.hasOverrideWidth
    const hasOverrideH = this.hasOverrideHeight

    const preferredW = hasOverrideW ? this._overrideWidth : handlerMeasurement.preferred.width
    const preferredH = hasOverrideH ? this._overrideHeight : handlerMeasurement.preferred.height

    // Override pins the axis — drop the handler's opinion on min/max for that axis
    // so the layout engine doesn't squash an explicitly-sized item back to its
    // rigid content min/max.
    const handlerMinW = hasOverrideW ? 0 : handlerMeasurement.min.width
    const handlerMinH = hasOverrideH ? 0 : handlerMeasurement.min.height
    const handlerMaxW = hasOverrideW ? Infinity : handlerMeasurement.max.width
    const handlerMaxH = hasOverrideH ? Infinity : handlerMeasurement.max.height

    const userMaxW = this._maxWidth > 0 ? this._maxWidth : Infinity
    const userMaxH = this._maxHeight > 0 ? this._maxHeight : Infinity

    const result: ContentMeasurement = {
      min: {
        width: Math.max(this._minWidth, handlerMinW),
        height: Math.max(this._minHeight, handlerMinH)
      },
      preferred: {width: preferredW, height: preferredH},
      max: {
        width: Math.min(userMaxW, handlerMaxW),
        height: Math.min(userMaxH, handlerMaxH)
      },
      // Tri-state ratio: > 0 explicit author ratio (wins); < 0 disabled; an
      // explicit size override also suppresses the handler ratio (the author is
      // sizing that axis manually, so the transfer must not fight it); otherwise
      // inherit the handler's intrinsic ratio (e.g. an Image's texture aspect).
      aspectRatio:
        this._aspectRatio > 0
          ? this._aspectRatio
          : this._aspectRatio < 0 || hasOverrideW || hasOverrideH
            ? undefined
            : handlerMeasurement.aspectRatio
    }

    if (this._cacheMeasurement) {
      this._cachedIntrinsic = result
    }
    return result
  }

  /**
   * Returns the preferred intrinsic size in cm — a thin wrapper around
   * {@link measureIntrinsic} that drops the min / max components.
   *
   * Existing callers (FlexItem.fillInput, GridItem.fillInput) that only care
   * about the natural size keep using this. Layout engines that want CSS
   * intrinsic sizing should call {@link measureIntrinsic} directly.
   */
  public measure(): Size {
    return this.measureIntrinsic().preferred
  }

  /**
   * Clears the cached measurement, forcing a fresh `measure()` on the next
   * layout pass. Call this when the item's content size changes externally
   * (e.g. text content updated) while {@link cacheMeasurement} is enabled.
   */
  public invalidateMeasure(): void {
    this._cachedIntrinsic = null
    this._parentLayout?.markDirty()
  }

  /**
   * Applies the computed layout position and size to the underlying SceneObject.
   * Called by the parent layout container after running the layout algorithm.
   *
   * Behavior splits on whether a {@link ItemHandler} was resolved for this
   * SceneObject's content:
   *
   * **With handler (recognized content):** delegates to `handler.apply()`,
   * which writes the size into the appropriate native channel — Text
   * `layoutRect`, Image / BaseMeshVisual `Transform.localScale`, Shape
   * `width/height`, etc. — or `ScreenTransform.offsets` when a ScreenTransform
   * is present (it supersedes those channels). Position is written to
   * Transform.localPosition.
   *
   * **No handler ("naked" LayoutItem2D):** there is nothing the layer can
   * resize directly, so:
   * 1. Always writes Transform.localPosition.
   * 2. Writes Transform.localScale *only when* {@link overrideWidth} or
   *    {@link overrideHeight} were set (declaration: "I am N cm at scale 1").
   *    With no override there is no natural-size baseline, so localScale is
   *    left alone — preserves child meshes / text at their authored size.
   *
   * In particular, attaching a FlexItem/GridItem to a SceneObject with no
   * handler-recognizable content **and** no override means the layout pass
   * will treat its intrinsic size as zero (the default ContentMeasurement
   * returns `{0, 0}`), and a `print()` warning is emitted on the first such
   * apply. To suppress the warning, either:
   *   - drop a recognized component on the SceneObject (Element, Shape,
   *     Image, Text, mesh, …) — the handler will pick it up; or
   *   - set `overrideWidth` / `overrideHeight` to declare the intended size
   *     explicitly.
   *
   * @param x - Center X position in parent-local coordinates (cm).
   * @param y - Center Y position in parent-local coordinates (cm).
   * @param width - Allocated width (cm).
   * @param height - Allocated height (cm).
   */
  public applyLayout(x: number, y: number, width: number, height: number): void {
    if (!this.initialized) {
      return
    }
    this._allocatedWidth = width
    this._allocatedHeight = height
    const transform = this._transform ?? this.sceneObject.getTransform()
    if (this._handler && this._handlerComponent && isNull(this._handlerComponent)) {
      this._handler = null
      this._handlerComponent = null
    }
    if (this._handler) {
      this._handler.apply(this.sceneObject, x, y, width, height, this._handlerComponent, transform)
    } else {
      // No-handler fallback: position the object. Scale only when the
      // user explicitly declared a natural size via override — that
      // declaration means "I am N cm at scale 1," so the layout scales
      // to make the allocation match. Without an override the user has
      // no opinion on size, so we leave localScale alone (preserves
      // child meshes / text at their natural rendering size).
      const pos = transform.getLocalPosition()
      pos.x = x
      pos.y = y
      transform.setLocalPosition(pos)

      const wOpinion = this.hasOverrideWidth && this._overrideWidth > 0
      const hOpinion = this.hasOverrideHeight && this._overrideHeight > 0
      if (wOpinion || hOpinion) {
        const declaredW = wOpinion ? this._overrideWidth : 1
        const declaredH = hOpinion ? this._overrideHeight : 1
        const scale = transform.getLocalScale()
        scale.x = width / declaredW
        scale.y = height / declaredH
        transform.setLocalScale(scale)
      } else if (!this._warnedNakedZero) {
        // First time we apply a naked LayoutItem2D with no override and no
        // recognized content: warn so the user knows the layout sees this
        // item as zero-sized. Only printed once per item to avoid log spam.
        this._warnedNakedZero = true
        print(
          `WARNING: ${this.sceneObject.name} has a LayoutItem2D but no recognized ` +
            `content component and no overrideWidth/overrideHeight. The layout will ` +
            `treat its intrinsic size as 0×0. Set overrideWidth/Height, attach a ` +
            `content component (Element / Shape / Text / Image / mesh), or register ` +
            `a custom ItemHandler.`
        )
      }
    }
  }

  /** One-shot guard for the naked-LayoutItem2D warning printed by applyLayout. */
  private _warnedNakedZero: boolean = false

  /**
   * Returns the size allocated by the last layout pass.
   * Falls back to measure() if no layout has run yet.
   */
  public allocatedSize(): {width: number; height: number} {
    if (this._allocatedWidth >= 0 && this._allocatedHeight >= 0) {
      return {width: this._allocatedWidth, height: this._allocatedHeight}
    }
    return this.measure()
  }
}
