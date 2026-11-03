// ═══════════════════════════════════════════════════════════════════════════
// ItemHandlerRegistry.ts — Content-type adapters with runtime registry.
//
// Holds the registry, the ItemHandler / ContentMeasurement contracts, and
// the *native* LensCore handlers: Text/Text3D, Image, BaseMeshVisual,
// ScreenTransform, BoxCollider. No UIKit-specific imports — UIKit-side
// handlers (Element, Shape, LayoutContainer, StandaloneContent,
// CustomFlexContainer) live in UIKitItemHandlers.ts and register on top.
//
// Each handler.measure() returns a CSS-style {min, preferred, max}
// ContentMeasurement so layout engines can resolve intrinsic sizing
// (min-content / max-content) — rigid handlers populate all three the same.
//
// Registry is extensible: call ItemHandlerRegistry.register() to add
// custom handlers at any priority. Higher priority = checked first.
//
// Used by both FlexItem and GridItem via LayoutItem2D.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Handler Interface ───────────────────────────────────────────────────

/** A 2D size in cm. */
export interface Size {
  width: number
  height: number
}

/**
 * The intrinsic size of a content item, expressed as a CSS-style
 * min-content / preferred / max-content triple in cm.
 *
 * - `min` — smallest size the content can take without losing meaning
 *   (e.g. widest unbreakable text run, per CSS Sizing 3 §5.1).
 *   `0` means "no minimum from content".
 * - `preferred` — natural rendered size of the content.
 * - `max` — largest size the content wants. `Infinity` means "unbounded".
 *
 * Rigid handlers (Element, Shape, Image) return `min = preferred = max`.
 * Flexible handlers (Text, Text3D, LayoutContainer) populate the range.
 *
 * Optional extension fields (`baseline`, `aspectRatio`) let handlers declare
 * typography- and image-aware sizing hints. `aspectRatio` IS consumed by the
 * Flex engine (the cross→main transfer); `baseline` is reserved for future
 * baseline-aligned layout. Omitting a field opts that content out of the hint.
 */
export interface ContentMeasurement {
  min: Size
  preferred: Size
  max: Size
  /**
   * Distance in cm from the top of the `preferred` bounding box to the
   * text baseline, if the content has one (Text, Text3D). Layouts can use
   * this to baseline-align mixed text + non-text content. Omit or set to
   * `undefined` when the content has no meaningful baseline.
   */
  baseline?: number
  /**
   * Intrinsic aspect ratio (`width / height`) if the content has one — e.g. an
   * Image's texture dimensions or a video's frame ratio. Need NOT equal
   * `preferred.width / preferred.height` (an Image's `preferred` comes from
   * localScale while its ratio comes from the texture). The Flex engine uses it
   * to derive one axis from the other (CSS `aspect-ratio`). Omit / `undefined`
   * when the content is freely resizable on both axes.
   */
  aspectRatio?: number
}

/**
 * Builds a rigid {@link ContentMeasurement} where `preferred = max` and
 * `min = 0`. Used by handlers whose content has no introspectable
 * intrinsic minimum (e.g. Element, Shape, Image, layout containers).
 *
 * `min = 0` here means "no opinion on content-min from the handler" — this
 * preserves pre-intrinsic-sizing shrink behavior so items can still shrink
 * to 0 when only user `minWidth` / `minHeight` clamps apply. Handlers that
 * *can* compute a real content-min (text widest-word, container shrink-fit,
 * etc.) should construct the {@link ContentMeasurement} literal directly
 * rather than going through this helper.
 */
export function rigidMeasurement(width: number, height: number): ContentMeasurement {
  return {
    min: {width: 0, height: 0},
    preferred: {width, height},
    max: {width, height}
  }
}

/**
 * Content-type adapter that knows how to measure and position a specific
 * kind of SceneObject (e.g. Element, Text, Image, RenderMeshVisual).
 */
export interface ItemHandler {
  /** Human-readable name for debugging. */
  readonly name: string
  /** Returns true if this handler can manage the given SceneObject. */
  canHandle(sceneObject: SceneObject): boolean
  /** Returns the component that canHandle matched, for caching on the layout item. */
  resolveComponent(sceneObject: SceneObject): any
  /**
   * Measures the content's intrinsic size as a min / preferred / max triple in cm.
   * Rigid content returns `min = preferred = max`; flexible content (text, nested
   * layouts) populates the range so the layout engine can resolve `min-content`
   * and `max-content` track sizing.
   */
  measure(sceneObject: SceneObject, component: any, transform: Transform): ContentMeasurement
  /**
   * Positions and sizes the SceneObject according to layout output.
   * @param sceneObject - The scene object to position.
   * @param x - Target X position (center-based, in cm).
   * @param y - Target Y position (center-based, in cm).
   * @param width - Allocated width (in cm).
   * @param height - Allocated height (in cm).
   * @param component - The cached component from resolveComponent().
   * @param transform - The cached Transform reference.
   */
  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void
}

/** Result of resolving a handler for a SceneObject. */
export interface ResolvedHandler {
  handler: ItemHandler
  component: any
}

// ─── Registry ────────────────────────────────────────────────────────────

interface RegisteredHandler {
  handler: ItemHandler
  priority: number
}

/**
 * Priority-sorted registry of {@link ItemHandler} instances.
 * Higher-priority handlers are tested first when resolving a SceneObject.
 */
class HandlerRegistry {
  private handlers: RegisteredHandler[] = []
  private sorted = false

  /**
   * Registers a handler at the given priority. Higher priority = checked first.
   *
   * Built-in priorities to slot custom handlers between:
   *   120 CustomContainer · 110 LayoutContainer · 100 Element ·
   *    95 StandaloneContent · 90 Shape · 70 Text/Text3D · 60 Image ·
   *    50 BaseMeshVisual · 45 ScreenTransform · 40 BoxCollider
   *
   * @example
   * // A custom handler for a "Sprite" component with a half-content min and
   * // an unbounded max. Picked above Image (60) but below Shape (90).
   * import {ItemHandler, ItemHandlerRegistry, setLocalXY} from "./ItemHandlerRegistry"
   *
   * const SpriteHandler: ItemHandler = {
   *   name: "SpriteHandler",
   *   canHandle: (so) => so.getComponent("Component.ScriptComponent")?.isSprite === true,
   *   resolveComponent: (so) => so.getComponent("Component.ScriptComponent"),
   *   measure: (_so, sprite) => ({
   *     min: {width: sprite.width * 0.5, height: sprite.height},
   *     preferred: {width: sprite.width, height: sprite.height},
   *     max: {width: Infinity, height: sprite.height}
   *   }),
   *   apply: (so, x, y, w, h, sprite, t) => {
   *     sprite.width = w; sprite.height = h
   *     setLocalXY(so, x, y, t)
   *   }
   * }
   * ItemHandlerRegistry.register(SpriteHandler, 80)
   *
   * @param handler - The handler to register.
   * @param priority - Numeric priority (e.g. 100 for Element, 50 for BaseMeshVisual).
   */
  public register(handler: ItemHandler, priority: number): void {
    this.handlers.push({handler, priority})
    this.sorted = false
  }

  /**
   * Removes a previously registered handler.
   * @param handler - The handler instance to remove.
   */
  public unregister(handler: ItemHandler): void {
    this.handlers = this.handlers.filter((h) => h.handler !== handler)
  }

  /**
   * Removes a previously registered handler by name. Useful when the caller
   * doesn't hold a reference to the original handler object — for example,
   * to swap out one of the built-in handlers from app-side code:
   *
   *   ItemHandlerRegistry.unregisterByName("ImageHandler")
   *   ItemHandlerRegistry.register(MyImageHandler, 60)
   *
   * Returns the number of handlers removed (0 if no match).
   * @param name - The `ItemHandler.name` to match.
   */
  public unregisterByName(name: string): number {
    const before = this.handlers.length
    this.handlers = this.handlers.filter((h) => h.handler.name !== name)
    return before - this.handlers.length
  }

  /**
   * Returns the names of all currently-registered handlers, in priority order
   * (highest first). Intended for debugging custom-handler setups.
   */
  public listHandlerNames(): string[] {
    if (!this.sorted) {
      this.handlers.sort((a, b) => b.priority - a.priority)
      this.sorted = true
    }
    return this.handlers.map((h) => h.handler.name)
  }

  /**
   * Finds the highest-priority handler that can manage the given SceneObject.
   * Returns both the handler and the resolved component for caching.
   * @param sceneObject - The SceneObject to resolve a handler for.
   * @returns The matching handler + component, or null if none can handle it.
   */
  public resolve(sceneObject: SceneObject): ResolvedHandler | null {
    if (!this.sorted) {
      this.handlers.sort((a, b) => b.priority - a.priority)
      this.sorted = true
    }
    for (const entry of this.handlers) {
      if (entry.handler.canHandle(sceneObject)) {
        return {
          handler: entry.handler,
          component: entry.handler.resolveComponent(sceneObject)
        }
      }
    }
    return null
  }
}

/**
 * Global singleton registry of content-type handlers for the Layout2D system.
 *
 * Pre-populated with:
 * - **Native** (this file): Text/Text3D, Image, BaseMeshVisual,
 *   ScreenTransform, BoxCollider
 * - **UIKit** (UIKitItemHandlers.ts): Element, Shape, LayoutContainer,
 *   StandaloneContent, CustomFlexContainer
 *
 * Register custom handlers via `ItemHandlerRegistry.register(handler, priority)`
 * — see the docstring on `register` for a worked example.
 */
export const ItemHandlerRegistry = new HandlerRegistry()

// ─── Position Helper ─────────────────────────────────────────────────────

/**
 * Writes the SceneObject's local position x/y (z preserved) using a cached
 * Transform reference. Shared by every handler's `apply()`; exported so
 * UIKitItemHandlers (and any custom handler in user code) can reuse it
 * instead of re-implementing the same getLocalPosition / setLocalPosition
 * dance.
 */
export function setLocalXY(sceneObject: SceneObject, x: number, y: number, cachedTransform?: Transform): void {
  const transform = cachedTransform ?? sceneObject.getTransform()
  const pos = transform.getLocalPosition()
  pos.x = x
  pos.y = y
  transform.setLocalPosition(pos)
}

/**
 * Writes size + position through a {@link ScreenTransform}'s `offsets` when
 * one is present. In a screen-space hierarchy `offsets` is the canonical
 * rect channel — it supersedes Text `layoutRect` and `Transform.localScale`,
 * so handlers must write it instead (not in addition) to avoid an ignored or
 * double-applied size. Returns `true` when it wrote, so a handler's `apply()`
 * can early-return and skip its own native write. Shared by the Text, Image,
 * and ScreenTransform handlers.
 */
function applyScreenTransformRect(
  sceneObject: SceneObject,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const st = sceneObject.getComponent("Component.ScreenTransform") as ScreenTransform | null
  if (!st) return false
  st.offsets = Rect.create(x - width * 0.5, x + width * 0.5, y - height * 0.5, y + height * 0.5)
  return true
}

// ─── Native Handlers ─────────────────────────────────────────────────────

// ─── Text rect accessor helpers ─────────────────────────────────────────
//
// Lens Scripting v364 renamed `Text#worldSpaceRect` → `Text#layoutRect`
// (Text3D too) and deprecated the older name. The bundled UIKit `.d.ts` may
// be older, so on reads we fall back to `worldSpaceRect` when `layoutRect`
// is missing. Writes go to `layoutRect` only — writing the deprecated
// property triggers a runtime warning on newer LS versions.

function readTextRect(text: any): Rect {
  return text.layoutRect ?? text.worldSpaceRect
}

function writeTextRect(text: any, rect: Rect): void {
  text.layoutRect = rect
}

// Cached text content sizes (max-content natural extent + min-content widest
// run), keyed by the Text component instance and a best-effort style
// fingerprint. The round-trip (toggle `horizontalOverflow = Overflow` →
// `getBoundingBox` → restore) runs only when the fingerprint changes — once
// per content/style edit, not once per measure pass. Without this cache,
// exposing max/min-content via `measure()` would blow `getBoundingBox`'s
// per-frame rate limit under any nontrivial layout pressure.
//
// The fingerprint folds in the properties most likely to change the rendered
// size (content, font size, font asset, letter/line spacing), each read
// defensively so a missing property is simply absent from the key rather than
// throwing. It is best-effort: an exotic style change that touches none of
// these can serve a stale size until the content changes.
interface TextContentSizes {
  natural: Size // max-content: full unwrapped extent
  minWidth: number // min-content: widest unbreakable run (longest word)
}

const textContentSizeCache = new WeakMap<object, {key: string; sizes: TextContentSizes; minPending: boolean}>()

function textStyleKey(text: any): string {
  const size = typeof text.size === "number" ? text.size : 0
  const font = (text as any).font
  const fontSig = font ? (font.uniqueIdentifier ?? font.name ?? "f") : "0"
  const letter = (text as any).letterSpacing ?? ""
  const line = (text as any).lineSpacing ?? ""
  const content = typeof text.text === "string" ? text.text : ""
  return `${size}|${fontSig}|${letter}|${line}|${content}`
}

// Longest whitespace-delimited run in `s`, as a [start, end) char range.
// Returns `null` for empty / single-run strings (caller uses the natural
// width, since min-content == max-content there). Longest-by-char-count is a
// cheap, close proxy for widest-by-render and keeps this to one extra
// `getBoundingBox` per content change. A string with no whitespace (single
// word, long URL, CJK without spaces) is one unbreakable run → min == max (it
// won't shrink), matching CSS min-content for an unbreakable run; CJK
// soft-break points are not detected.
function longestWordRange(s: string): {start: number; end: number} | null {
  let bestStart = -1
  let bestLen = 0
  let runs = 0
  let runStart = -1
  for (let i = 0; i <= s.length; i++) {
    const isWs = i === s.length || /\s/.test(s.charAt(i))
    if (!isWs) {
      if (runStart < 0) runStart = i
    } else if (runStart >= 0) {
      runs++
      const len = i - runStart
      if (len > bestLen) {
        bestLen = len
        bestStart = runStart
      }
      runStart = -1
    }
  }
  if (bestStart < 0 || runs <= 1) return null
  return {start: bestStart, end: bestStart + bestLen}
}

function getTextContentSizes(text: any): TextContentSizes {
  const content = typeof text.text === "string" ? text.text : ""
  // Empty content trivially has zero extent; skip the round-trip.
  if (content === "") return {natural: {width: 0, height: 0}, minWidth: 0}

  const key = textStyleKey(text)
  const cached = textContentSizeCache.get(text)
  // Fully-resolved hit: natural measured AND min-content settled.
  if (cached && cached.key === key && !cached.minPending) return cached.sizes

  const savedOverflow = text.horizontalOverflow
  const savedText = text.text
  try {
    text.horizontalOverflow = HorizontalOverflow.Overflow

    // Reuse the cached natural on a min-only retry so we make at most ONE
    // getBoundingBox call this pass — it's per-frame rate-limited, and the
    // first measure already spent a call on `natural`.
    let natural: Size
    if (cached && cached.key === key) {
      natural = cached.sizes.natural
    } else {
      const sz = text.getBoundingBox().getSize()
      natural = {width: Math.abs(sz.x), height: Math.abs(sz.y)}
    }

    // min-content width = widest unbreakable run (CSS Sizing 3 §5.1). For a
    // single run min == natural; otherwise measure the longest run in
    // isolation via a temporary `text` swap (reliable across LS versions where
    // `getBoundingBox(start, end)` ranges are not). `minPending` records a word
    // measure that couldn't complete this pass (rate-limited / not ready) so a
    // later call retries it — never pinning min to the natural width forever.
    let minWidth = natural.width
    let minPending = false
    const range = longestWordRange(content)
    if (range && (natural.width > 0 || natural.height > 0)) {
      try {
        text.text = content.substring(range.start, range.end)
        const w = Math.abs(text.getBoundingBox().getSize().x)
        // Never report a min wider than the whole line.
        if (w > 0) minWidth = Math.min(w, natural.width)
        else minPending = true
      } catch {
        minPending = true
      }
    }

    const sizes: TextContentSizes = {natural, minWidth}
    // Cache once we have a real natural. A pending min is cached too (with the
    // natural-width fallback) but flagged, so the next call reuses this natural
    // and re-attempts only the word measure (≤1 getBoundingBox/frame).
    if (natural.width > 0 || natural.height > 0) {
      textContentSizeCache.set(text, {key, sizes, minPending})
    }
    return sizes
  } catch {
    // getBoundingBox can throw if the host call is rate-limited. Prefer the
    // stale cache over a 0×0 fallback that would corrupt downstream sizing.
    return cached?.sizes ?? {natural: {width: 0, height: 0}, minWidth: 0}
  } finally {
    text.text = savedText
    text.horizontalOverflow = savedOverflow
  }
}

// Priority 70: Text components (covers both Component.Text and Component.Text3D).
//
// preferred is rigid — the current `layoutRect`. min/max come from the
// {@link getTextContentSizes} cache (one `getBoundingBox` round-trip per
// content/style change, not per measure pass):
//   - min.width = min-content = widest unbreakable run (longest word), so flex
//     shrink won't crush text below its widest word (CSS Sizing 3 §5.1).
//     min.height stays 0 (text has no horizontal-writing-mode height floor).
//   - max = max-content = natural unconstrained extent. May be smaller than
//     preferred on the cross axis (single-line natural height vs multi-line
//     wrapped height); that's the CSS max-content semantic for text.
// Consumers that want the natural size for auto-sizing
// (ElementContent.updateAutoSize, etc.) read it via
// `computeContentSize({mode: "max"})`.
const TextHandler: ItemHandler = {
  name: "TextHandler",

  canHandle(sceneObject: SceneObject): boolean {
    return sceneObject.getComponent("Component.Text") !== null || sceneObject.getComponent("Component.Text3D") !== null
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Component.Text") ?? sceneObject.getComponent("Component.Text3D")
  },

  measure(_sceneObject: SceneObject, component: any, _transform: Transform): ContentMeasurement {
    const text = component as any
    if (!text) return rigidMeasurement(1, 1)

    const rect = readTextRect(text)
    if (!rect) return rigidMeasurement(1, 1)

    const preferredW = Math.abs(rect.right - rect.left)
    const preferredH = Math.abs(rect.top - rect.bottom)
    // Preferred is the authored `layoutRect`. When the Text also has a
    // ScreenTransform, `apply` writes `offsets` (which supersede `layoutRect`)
    // and never touches `layoutRect` — so this read stays stable (no
    // measure↔apply feedback), though the authored rect may differ from the
    // ST-driven rendered size.
    const content = getTextContentSizes(text)
    return {
      min: {width: content.minWidth, height: 0},
      preferred: {width: preferredW, height: preferredH},
      max: {width: content.natural.width, height: content.natural.height}
    }
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void {
    // A ScreenTransform, when present, supersedes `layoutRect` — write the rect
    // through its offsets and skip the layoutRect write to avoid an ignored or
    // double-applied size.
    if (applyScreenTransformRect(sceneObject, x, y, width, height)) return
    const text = component as any
    if (text) {
      writeTextRect(text, Rect.create(-width * 0.5, width * 0.5, -height * 0.5, height * 0.5))
    }
    setLocalXY(sceneObject, x, y, transform)
  }
}

// Intrinsic aspect ratio (width / height) from an Image's texture, or undefined
// when none applies. The texture is a stable, apply-independent size source
// (localScale is the apply channel), so the ratio doesn't drift with the last
// allocation. Returns undefined for: no material/texture, or a not-yet-loaded /
// degenerate (0-dim) texture — the caller then falls back to localScale.
//
// The ratio is derived from the texture regardless of `stretchMode`: that
// property only affects rendering when a ScreenTransform is attached (and it
// defaults to Stretch), so it's not a reliable "author wants distortion"
// signal. Authors opt out of the transfer with `aspectRatio = -1`; it only
// fires on rigid items anyway, so populating the ratio here is otherwise inert.
//
// Re-read every measure (getWidth/getHeight is cheap, unlike getBoundingBox)
// rather than caching, so a runtime texture swap or a late-loading
// video/RenderTarget is reflected the next time the layout re-measures — note
// that a bare texture swap won't itself dirty the layout pass, so callers that
// swap textures should mark the layout dirty if they need an immediate reflow.
// Honors a UV sub-rect (sprite atlas / crop) when the material exposes
// `baseTexUvMinMax`.
function imageTextureAspect(image: any): number | undefined {
  if (!image) return undefined
  try {
    const pass = image.mainPass
    const tex = pass ? pass.baseTex : null
    if (!tex) return undefined
    let w = tex.getWidth()
    let h = tex.getHeight()
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return undefined
    // Sub-rect (sprite atlas / cropped UVs): scale dims by the UV fractions.
    // Validate all four components (a partially-set vec4 must not leak NaN).
    const uv = pass.baseTexUvMinMax
    if (uv && Number.isFinite(uv.x) && Number.isFinite(uv.y) && Number.isFinite(uv.z) && Number.isFinite(uv.w)) {
      const fw = Math.abs(uv.z - uv.x)
      const fh = Math.abs(uv.w - uv.y)
      if (fw > 0 && fh > 0) {
        w *= fw
        h *= fh
      }
    }
    const ratio = w / h
    return Number.isFinite(ratio) && ratio > 0 ? ratio : undefined
  } catch {
    return undefined
  }
}

// Priority 60: Image components
const ImageHandler: ItemHandler = {
  name: "ImageHandler",

  canHandle(sceneObject: SceneObject): boolean {
    return sceneObject.getComponent("Component.Image") !== null
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Component.Image")
  },

  measure(_sceneObject: SceneObject, component: any, transform: Transform): ContentMeasurement {
    // `preferred` is the authored `localScale` — the absolute-size fallback,
    // since pixels have no cm size so the texture can't supply absolute dims.
    // The intrinsic *ratio* comes from the TEXTURE: stable, per-image, and —
    // unlike localScale — NOT the apply channel, so it doesn't drift with the
    // last allocation. With the ratio set, a rigid Image (flex-basis auto, no
    // grow/shrink) in a definite-cross layout sizes via the aspect transfer
    // (Flexbox2D Step 8.5) rather than from localScale. We do NOT read a
    // ScreenTransform's offsets here (apply writes those → self-referential).
    const scale = transform.getLocalScale()
    const m = rigidMeasurement(Math.abs(scale.x), Math.abs(scale.y))
    const ratio = imageTextureAspect(component)
    if (ratio !== undefined) m.aspectRatio = ratio
    return m
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    _component: any,
    transform: Transform
  ): void {
    // ScreenTransform offsets supersede localScale — write through them and
    // skip the scale write when present.
    if (applyScreenTransformRect(sceneObject, x, y, width, height)) return
    const scale = transform.getLocalScale()
    scale.x = width
    scale.y = height
    transform.setLocalScale(scale)
    setLocalXY(sceneObject, x, y, transform)
  }
}

// Priority 50: BaseMeshVisual components — RenderMeshVisual, MaterialMeshVisual,
// and other mesh-backed visuals. (Text/Text3D also extend BaseMeshVisual but
// are caught by TextHandler at higher priority 70.)
//
// `canHandle` uses a predicate-based gate rather than a denylist of
// problematic subclasses (e.g. ParticlesVisual, MaskingComponent): a
// BaseMeshVisual is "layoutable" if it reports a finite, positive local
// AABB. That naturally excludes particle systems (which report degenerate
// or unbounded bounds) and masks (no rendered geometry) without naming
// them. Subclasses that *should* be layoutable but happen to report
// degenerate bounds at OnStart can opt in via a `__layoutable = true`
// marker property on the instance.
const BaseMeshVisualHandler: ItemHandler = {
  name: "BaseMeshVisualHandler",

  canHandle(sceneObject: SceneObject): boolean {
    const visual = sceneObject.getComponent("Component.BaseMeshVisual") as BaseMeshVisual | null
    if (!visual) return false
    // Explicit opt-in always wins (lets users override the predicate).
    if ((visual as any).__layoutable === true) return true
    if ((visual as any).__layoutable === false) return false
    // Predicate: does this visual report a finite, positive local extent?
    try {
      const aabbMin = visual.localAabbMin()
      const aabbMax = visual.localAabbMax()
      const w = Math.abs(aabbMax.x - aabbMin.x)
      const h = Math.abs(aabbMax.y - aabbMin.y)
      return isFiniteAabbExtent(w) && isFiniteAabbExtent(h) && (w > 0 || h > 0)
    } catch {
      return false
    }
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Component.BaseMeshVisual")
  },

  measure(sceneObject: SceneObject, component: any, _transform: Transform): ContentMeasurement {
    const visual = component as BaseMeshVisual
    if (!visual) return rigidMeasurement(1, 1)

    // localAabbMin/Max live on BaseMeshVisual itself (since LS v156) so this
    // works for RenderMeshVisual, MaterialMeshVisual, and any other subclass
    // without needing to reach into a subclass-specific `.mesh` field. When
    // no mesh is assigned the API returns ±FLT_MAX as a sentinel; we treat
    // that as "no measurable content" and fall back to a 1×1 rigid size.
    //
    // We deliberately do NOT multiply by `localScale` — that would make the
    // intrinsic measurement path-dependent: `apply` writes
    // `localScale = allocation / aabb`, so a subsequent measure would read
    // back `aabb * (allocation / aabb) = allocation`, freezing the cell at
    // whatever the previous layout chose. Use `FlexItem.overrideWidth/Height`
    // if you want a non-unit intrinsic size for a mesh.
    const aabbMin = visual.localAabbMin()
    const aabbMax = visual.localAabbMax()
    const w = Math.abs(aabbMax.x - aabbMin.x)
    const h = Math.abs(aabbMax.y - aabbMin.y)
    if (isFiniteAabbExtent(w) && isFiniteAabbExtent(h) && w > 0 && h > 0) {
      return rigidMeasurement(w, h)
    }
    // No finite AABB (no mesh, or a ±FLT_MAX sentinel). Falling back to 1×1
    // would otherwise be silent; warn once so a mis-sized cell is visible.
    if (!isFiniteAabbExtent(w) || !isFiniteAabbExtent(h)) {
      warnAabbSentinelOnce(sceneObject)
    }
    return rigidMeasurement(1, 1)
  },

  apply(
    _sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void {
    const visual = component as BaseMeshVisual
    if (visual) {
      const aabbMin = visual.localAabbMin()
      const aabbMax = visual.localAabbMax()
      const meshW = Math.abs(aabbMax.x - aabbMin.x)
      const meshH = Math.abs(aabbMax.y - aabbMin.y)
      if (isFiniteAabbExtent(meshW) && isFiniteAabbExtent(meshH) && meshW > 0 && meshH > 0) {
        const scaleX = width / meshW
        const scaleY = height / meshH
        const uniformScale = Math.min(scaleX, scaleY)
        const current = transform.getLocalScale()
        current.x = uniformScale
        current.y = uniformScale
        transform.setLocalScale(current)
      }
    }
    setLocalXY(_sceneObject, x, y, transform)
  }
}

// BaseMeshVisual.localAabbMin/Max return ±FLT_MAX (~3.4e38) when the visual
// has no mesh. Reject anything that big as a sentinel rather than a real
// bound. 1e10 is a generous cm threshold — anything larger is nonsense.
function isFiniteAabbExtent(value: number): boolean {
  return isFinite(value) && value < 1e10
}

// One-shot warning when a BaseMeshVisual reports no finite AABB and we fall
// back to 1×1, so the otherwise-silent mis-size is visible once per object.
const warnedAabbSentinel = new WeakSet<object>()
function warnAabbSentinelOnce(sceneObject: SceneObject): void {
  if (warnedAabbSentinel.has(sceneObject)) return
  warnedAabbSentinel.add(sceneObject)
  print(
    `WARNING: ${sceneObject.name} has a BaseMeshVisual with no finite local AABB ` +
      `(no mesh assigned, or a sentinel bound). The layout is treating it as 1×1 cm — ` +
      `assign a mesh or set FlexItem.overrideWidth/Height.`
  )
}

// Priority 45: ScreenTransform components.
//
// A bare ScreenTransform (no recognized visual content) has no intrinsic
// size — `measure` reports none (see below) and the item must declare its
// size via FlexItem.overrideWidth/Height. `apply` writes the allocation to
// `offsets`, the canonical channel in a screen-space hierarchy. Full
// screen-space layout would need its own dedicated layout path.
const ScreenTransformHandler: ItemHandler = {
  name: "ScreenTransformHandler",

  canHandle(sceneObject: SceneObject): boolean {
    return sceneObject.getComponent("Component.ScreenTransform") !== null
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Component.ScreenTransform")
  },

  measure(_sceneObject: SceneObject, _component: any, _transform: Transform): ContentMeasurement {
    // A bare ScreenTransform has no intrinsic content size: its `offsets` are a
    // layout *output* (written by `apply`), not an authored size, so reading
    // them back as a "preferred" size would be self-referential — each pass
    // would echo the previous pass's allocation. Report no intrinsic; an
    // ST-only object declares its size via FlexItem.overrideWidth/Height (the
    // "naked LayoutItem2D" pattern). With no override the layout sees it as 0×0.
    return {min: {width: 0, height: 0}, preferred: {width: 0, height: 0}, max: {width: Infinity, height: Infinity}}
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    _component: any,
    _transform: Transform
  ): void {
    // `offsets` is the canonical size+position channel in a screen-space
    // hierarchy; writing localPosition in addition would double-position it.
    applyScreenTransformRect(sceneObject, x, y, width, height)
  }
}

// Priority 40 family: Physics collider components — Box / Sphere / Capsule /
// Cylinder. These only matter when the SceneObject has *no* visible content
// component (which would already match a higher-priority handler) — so by
// default a button with a BaseMeshVisual + a Box collider is sized by the
// visual, and the collider is ignored. Colliders only drive layout when they
// are the only content on the SceneObject (invisible hit-zones).
//
// Shapes are duck-typed because the LS shape constructors (BoxShape,
// SphereShape, CapsuleShape, CylinderShape) aren't always exposed as runtime
// globals across versions.
function isBoxShapeLike(shape: any): boolean {
  return (
    shape != null &&
    shape.size != null &&
    typeof shape.size.x === "number" &&
    typeof shape.size.y === "number" &&
    typeof shape.size.z === "number" &&
    // Reject SphereShape (has radius) and CylinderShape (has length+radius).
    shape.radius === undefined
  )
}

function isSphereShapeLike(shape: any): boolean {
  return shape != null && typeof shape.radius === "number" && shape.length === undefined && shape.size === undefined
}

function isCapsuleOrCylinderShapeLike(shape: any): boolean {
  return shape != null && typeof shape.radius === "number" && typeof shape.length === "number"
}

const BoxColliderHandler: ItemHandler = {
  name: "BoxColliderHandler",

  canHandle(sceneObject: SceneObject): boolean {
    const collider = sceneObject.getComponent("Physics.ColliderComponent") as ColliderComponent | null
    return collider !== null && isBoxShapeLike(collider.shape)
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Physics.ColliderComponent")
  },

  measure(_sceneObject: SceneObject, component: any, _transform: Transform): ContentMeasurement {
    const collider = component as ColliderComponent | null
    if (!collider || !isBoxShapeLike(collider.shape)) return rigidMeasurement(1, 1)
    const size = (collider.shape as BoxShape).size
    return rigidMeasurement(Math.abs(size.x), Math.abs(size.y))
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void {
    const collider = component as ColliderComponent | null
    if (collider && isBoxShapeLike(collider.shape)) {
      const box = collider.shape as BoxShape
      const current = box.size
      box.size = new vec3(width, height, current.z)
    }
    setLocalXY(sceneObject, x, y, transform)
  }
}

// Priority 38: Sphere collider — radius drives a square layout rect.
const SphereColliderHandler: ItemHandler = {
  name: "SphereColliderHandler",

  canHandle(sceneObject: SceneObject): boolean {
    const collider = sceneObject.getComponent("Physics.ColliderComponent") as ColliderComponent | null
    return collider !== null && isSphereShapeLike(collider.shape)
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Physics.ColliderComponent")
  },

  measure(_sceneObject: SceneObject, component: any, _transform: Transform): ContentMeasurement {
    const collider = component as ColliderComponent | null
    if (!collider || !isSphereShapeLike(collider.shape)) return rigidMeasurement(1, 1)
    const r = (collider.shape as any).radius as number
    const diameter = Math.abs(r) * 2
    return rigidMeasurement(diameter, diameter)
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void {
    // Sphere is symmetric, so the layout rect is forced square by taking the
    // smaller axis. Otherwise an asymmetric layout cell would silently grow
    // the sphere along the larger axis — sphere can't be non-uniform.
    const collider = component as ColliderComponent | null
    if (collider && isSphereShapeLike(collider.shape)) {
      const fit = Math.min(Math.abs(width), Math.abs(height))
      ;(collider.shape as any).radius = fit * 0.5
    }
    setLocalXY(sceneObject, x, y, transform)
  }
}

// Priority 37: Capsule / Cylinder collider — radius+length, axis-aligned
// along local Y by default. width = diameter, height = total length (capsule
// includes hemispheres in `length`; cylinder is body-only).
const CapsuleCylinderColliderHandler: ItemHandler = {
  name: "CapsuleCylinderColliderHandler",

  canHandle(sceneObject: SceneObject): boolean {
    const collider = sceneObject.getComponent("Physics.ColliderComponent") as ColliderComponent | null
    return collider !== null && isCapsuleOrCylinderShapeLike(collider.shape)
  },

  resolveComponent(sceneObject: SceneObject): any {
    return sceneObject.getComponent("Physics.ColliderComponent")
  },

  measure(_sceneObject: SceneObject, component: any, _transform: Transform): ContentMeasurement {
    const collider = component as ColliderComponent | null
    if (!collider || !isCapsuleOrCylinderShapeLike(collider.shape)) return rigidMeasurement(1, 1)
    const shape: any = collider.shape
    const diameter = Math.abs(shape.radius) * 2
    const length = Math.abs(shape.length)
    return rigidMeasurement(diameter, length)
  },

  apply(
    sceneObject: SceneObject,
    x: number,
    y: number,
    width: number,
    height: number,
    component: any,
    transform: Transform
  ): void {
    const collider = component as ColliderComponent | null
    if (collider && isCapsuleOrCylinderShapeLike(collider.shape)) {
      const shape: any = collider.shape
      shape.radius = Math.abs(width) * 0.5
      shape.length = Math.abs(height)
    }
    setLocalXY(sceneObject, x, y, transform)
  }
}

// ─── Register Native Handlers ────────────────────────────────────────────
// UIKit-specific handlers (priorities 90–120) register from UIKitItemHandlers.ts.

ItemHandlerRegistry.register(TextHandler, 70)
ItemHandlerRegistry.register(ImageHandler, 60)
ItemHandlerRegistry.register(BaseMeshVisualHandler, 50)
ItemHandlerRegistry.register(ScreenTransformHandler, 45)
ItemHandlerRegistry.register(BoxColliderHandler, 40)
ItemHandlerRegistry.register(SphereColliderHandler, 38)
ItemHandlerRegistry.register(CapsuleCylinderColliderHandler, 37)
