import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractionManager} from "SpectaclesInteractionKit.lspkg/Core/InteractionManager/InteractionManager"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {setTimeout} from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {findAllComponentsInSelfOrChildren} from "SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils"
import {Element} from "../Element"
import {FlexItem} from "../Layout2D/Flex/FlexItem"
import {FlexLayout} from "../Layout2D/Flex/FlexLayout"
import {FlexContentHorizontalAlignment, FlexContentVerticalAlignment, FlexDirection} from "../Layout2D/Flex/FlexTypes"
import {ItemHandlerRegistry} from "../Layout2D/ItemHandlerRegistry"
import {ScrollWindow} from "../ScrollWindow/ScrollWindow"

const TAG = "VirtualizedLayout"
const log = new NativeLogger(TAG)

const SCROLL_IDLE_TIMEOUT_MS = 500
// Per-frame grow cap for the post-scroll-idle deferred-grows drain.
const DRAIN_GROWS_PER_FRAME = 1
// Frames an align correction waits for an async-sized target row before
// accepting the estimate. ~1.5s at 60fps; bounds the per-frame LateUpdate pin.
const ALIGN_CORRECTION_MAX_WAIT_FRAMES = 90
const ALPHA_EPSILON = 0.001
const OFFSET_WRITE_EPSILON = 0.001
// Floor below which `intraItemFraction` snaps to 0 during anchor recompute.
const INTRA_ITEM_EPSILON = 1e-4
// Minimum seconds between successive `tickShrinkGC` passes.
const SHRINK_GC_TICK_INTERVAL_SEC = 1.0
// Max consecutive re-drains of `applyDataChange` when an `adapter.onBindView`
// subscriber synchronously mutates `totalItems`.
const MAX_DATA_CHANGE_REDRAIN = 4
// Tolerance used to detect "at start" / "at end" of scroll in the fade loop.
const FADE_EDGE_EPSILON = 0.001
// Floor for `_fadeZone`. With fadeDistance=0 the per-edge alpha math
// produces 0/0 = NaN and permanently corrupts the slot's color vec4.
const FADE_ZONE_MIN = 1e-3
// Below this scroll delta, the per-slot alpha pass in `updateFade` is a no-op.
const FADE_SCROLL_EPSILON = 0.05

// Fully-qualified component name. `getComponentsInDescendants` is namespace-strict.
const COLLIDER_COMPONENT_NAME = "Physics.ColliderComponent" as const

// Brand for elements that participate in collider clipping.
type ClippableElement = Element

type ClipBand = "hidden" | "fullyVisible" | "partial"

function isClippableElement(sc: ScriptComponent): sc is ClippableElement {
  return sc instanceof Element
}

export enum ScrollDirection {
  Vertical = "vertical",
  Horizontal = "horizontal"
}

/**
 * Sentinel type forwarded to `adapter.onCreateView` when `getItemType` is
 * unset or returns empty. Include in narrowed `TType` unions.
 */
export const VL_DEFAULT_TYPE = "default"

/** Literal type of `VL_DEFAULT_TYPE`. Include in narrowed `TType` unions. */
export type VLDefaultType = typeof VL_DEFAULT_TYPE

export interface VirtualizedScrollOptionsBase {
  align?: "start" | "center" | "end"
  offset?: number
  durationMs?: number
}

export interface VirtualizedScrollOptions extends VirtualizedScrollOptionsBase {
  index: number | "start" | "end"
}

export type DataIndexLookup = {kind: "bound"; index: number} | {kind: "unbound"} | {kind: "notSlot"}

export type InvalidateFields = "content" | "size" | "type" | "structure" | "all"

/**
 * Adapter consumed by `VirtualizedLayout`. The holder returned by
 * `onCreateView` is stored per pool slot and threaded into every subsequent
 * `onBindView` / `onUnbindView`. Include `VL_DEFAULT_TYPE` in narrowed `TType`
 * unions — VL falls back to it when `getItemType` is unset.
 */
export interface VirtualizedAdapter<TViewHolder, TType extends string = string> {
  itemCount(): number
  getItemKey?(dataIndex: number): string | number
  getItemType?(dataIndex: number): TType
  /**
   * Per-item main-axis size in cm. Omit for uniform lists: the static
   * `itemSize` input keeps the O(1) stride path. Defining this OR `getItemType`
   * marks the list heterogeneous, abandoning the stride path for O(N) per-item
   * size/type arrays, so a constant-returning callback (e.g. `() => 3`) is a
   * footgun, not a speed-up.
   */
  getItemSize?(dataIndex: number): number | undefined
  onCreateView(slot: SceneObject, type: TType): TViewHolder
  onBindView(slot: SceneObject, holder: TViewHolder, dataIndex: number): void
  onUnbindView?(slot: SceneObject, holder: TViewHolder, dataIndex: number): void
}

/**
 * Recycler-view-style scrolling list. Maintains a fixed pool of slots and
 * recycles them across data indices as the viewport scrolls. Assign an
 * `adapter`; configure via inspector inputs. Set `itemAlphaHandler` to take
 * over alpha ownership; otherwise the built-in fade pass writes alpha to
 * `Text` / `Image` components on the slot root.
 */
@component
export class VirtualizedLayout<TViewHolder, TType extends string = string> extends BaseScriptComponent {
  // ─── Inspector Inputs ──────────────────────────────────────────────

  @ui.group_start("Layout")
  @input("vec2", "{20, 30}")
  @label("Viewport Size")
  @hint("Visible viewport in cm. Items fill the cross-axis; main axis is the scroll direction.")
  private _viewportSize: vec2 = new vec2(20, 30)

  @input
  @label("Item Size")
  @hint(
    "Default item size in cm along the scroll axis (height for vertical, width for horizontal). `adapter.getItemSize` can override per item."
  )
  private _itemSize: number = 3

  @input
  @label("Buffer Count")
  @hint("Extra slots rendered above and below (or left and right of) the viewport.")
  private _bufferCount: number = 2

  @input
  @label("Gap")
  @hint("Spacing in cm between consecutive items along the scroll axis.")
  private _gap: number = 0

  @input
  @label("Scroll Direction")
  @widget(new ComboBoxWidget([new ComboBoxItem("Vertical", "vertical"), new ComboBoxItem("Horizontal", "horizontal")]))
  @hint("Scroll axis. Vertical stacks items top-to-bottom; horizontal stacks left-to-right.")
  private _scrollDirection: string = ScrollDirection.Vertical

  @input
  @label("Initial Index")
  @hint(
    "Data index the viewport opens at. Clamped to [0, totalItems-1]. Post-init writes scroll the viewport instantly."
  )
  private _initialIndex: number = 0
  @ui.group_end
  @ui.label("")
  @ui.group_start("Pool")
  @input
  @label("Min Slots Per Type")
  @hint(
    "Lower bound on per-type pool size after shrink GC. Setting to 2+ keeps spare slots warm so a single off-screen-back-into-view recycle doesn't fire adapter.onCreateView on the scroll hot path."
  )
  private _minSlotsPerType: number = 1

  @input
  @label("Shrink Delay (ms)")
  @hint(
    "Idle threshold before an unused pool slot is GC'd. 0 disables shrink entirely (pool only grows). Default 30000 = 30 seconds."
  )
  private _shrinkDelayMs: number = 30000

  @input
  @label("Prewarm Budget (ms)")
  @hint(
    "Per-frame budget for long-tail typed-pool prewarm — rare row types whose first occurrence is past the discovery limit. 0 = drain the long-tail synchronously instead of yielding. Visible and buffer types are always allocated synchronously at init regardless of this value."
  )
  private _prewarmBudgetMs: number = 10
  @ui.group_end
  @ui.label("")
  @ui.group_start("Fade")
  @input
  @label("Fade Enabled")
  @hint(
    'Built-in edge fade. Overwrites the color (RGBA) of Text and Image components directly on each pool slot\'s root SceneObject, reconstructing RGB from a baseline snapshotted at bind time — so RGB changes made after onBindView are clobbered on the next fade tick unless re-snapshotted via invalidate(range, "content"). For nested visuals, animated alpha, or zero-alpha placeholders, install a handler via the itemAlphaHandler setter instead (which transfers color ownership entirely to the consumer).'
  )
  private _fadeEnabled: boolean = false

  @input
  @showIf("_fadeEnabled", true)
  @label("Fade Distance")
  @hint("Distance in cm from viewport edge where fade begins.")
  private _fadeDistance: number = 1.0
  @ui.group_end
  @ui.label("")
  @ui.group_start("Callbacks")
  @input
  @label("Edge Reached Threshold")
  @hint(
    "Distance in cm from the start/end of the content at which onStartReached / onEndReached fire. 0 fires exactly at the edge. Fires once per crossing; re-arms after the viewport leaves the band."
  )
  private _edgeReachedThreshold: number = 0
  @ui.group_end

  // ─── Runtime Properties ────────────────────────────────────────────
  private _totalItems: number = 0

  // Once-per-crossing arming for the edge-reached callbacks. False while the
  // viewport sits inside the corresponding threshold band.
  private _endReachedArmed: boolean = true
  private _startReachedArmed: boolean = true

  private _poolSizeOverride: number | null = null

  // ─── Owned Dependencies ────────────────────────────────────────────

  // Null only pre-onAwake and post-cleanup.
  private _scrollWindow: ScrollWindow | null = null
  private _layout: FlexLayout | null = null
  private _layoutTransform: Transform | null = null
  private _scrollWindowTransform: Transform | null = null

  // ─── Private State ─────────────────────────────────────────────────

  // Pool
  private _poolObjects: SceneObject[] = []
  private _poolItems: FlexItem[] = []
  private _dataIndices: number[] = []
  private _slotBySceneObject: Map<SceneObject, number> = new Map()
  private _poolHolders: (TViewHolder | null)[] = []
  // Cached `getItemKey(dataIndex)` per slot at bind time. Lets `applySnapshot`
  // redirect kept-key slots without unbind/bind cycling.
  private _slotKeys: (string | number | null)[] = []
  // Root-level Text/Image components, refreshed every bind.
  private _poolTexts: Text[][] = []
  private _poolImages: Image[][] = []
  // Resolved `.textFill` / `.mainPass` refs parallel to `_poolTexts` /
  // `_poolImages` so the fade tick writes through without re-crossing the bridge.
  private _poolTextFills: TextFill[][] = []
  private _poolImageMainPasses: Pass[][] = []
  // Per-slot subtree caches. Populated at spawn; refreshed only on
  // `invalidate(range, "structure")`.
  private _poolClippables: ClippableElement[][] = []
  private _poolClippableTransforms: Transform[][] = []
  private _poolClippableInteractables: Interactable[][] = []
  private _poolColliders: ColliderComponent[][] = []
  // Baseline RGB packed as [r0,g0,b0,r1,g1,b1,…] so the fade tick avoids
  // reading `.color` / `.baseColor` through the bridge.
  private _poolTextRGB: number[][] = []
  private _poolImageRGB: number[][] = []
  // True iff the slot is in the visible window (not in the buffer).
  private _slotVisible: boolean[] = []
  // Seconds-since-lens-start when each slot last became unused.
  private _lastUsedTime: number[] = []
  private _lastShrinkTick: number = 0
  // Per-clippable band state, keyed by component instance so storage stays
  // private to VL and entries auto-reclaim with the slot SceneObject.
  private _clipBands: WeakMap<ClippableElement, ClipBand> = new WeakMap()

  // Long-tail prewarm queue drained across UpdateEvent frames.
  // _prewarmHead is the FIFO cursor (avoids O(n) Array.shift).
  private _prewarmQueue: string[] = []
  private _prewarmHead: number = 0
  private _prewarmComplete: boolean = true

  // Scratch storage for tickShrinkGC compaction; length-clamped per tick.
  private _shrinkToDestroyScratch: number[] = []
  private _shrinkRemovedItemsScratch: FlexItem[] = []
  private _shrinkIndexMapScratch: number[] = []

  // Types that have triggered a once-per-session grow-on-miss warning.
  private _warnedGrowOnMissTypes: Set<string> | null = null

  // Data indices queued for deferred remeasure on the next LateUpdate.
  // Double-buffered: `drainPendingRemeasure` swaps buffers so a synchronous
  // re-add lands in the next frame without per-drain Set allocation.
  private _pendingRemeasure: Set<number> = new Set()
  private _pendingRemeasureSwap: Set<number> = new Set()

  // Scroll
  private _lastFirstVisibleDataIndex: number = -1
  private _isUpdatingData: boolean = false

  // Axis-neutral derived values in cm.
  private _viewportMain: number = 0
  private _totalContentSize: number = 0
  private _visibleSlots: number = 0
  private _containerCrossSize: number = 0
  // Conservative default stride for pool sizing and unresolved-size fallback.
  // Heterogeneous content positioning reads from _cumulativeSizes.
  private _stride: number = 0
  private _isVertical: boolean = true

  // `-1` marks indices whose `adapter.getItemSize` returned `undefined` —
  // resolved via measure-on-bind through ItemHandlerRegistry.
  private _sizes: number[] = []
  // Prefix-sum of sizes + gaps. Valid ONLY for `i <= _resolvedPrefixEnd`;
  // past-prefix reads must use default-stride extrapolation.
  private _cumulativeSizes: number[] = []
  // Largest `k` such that `_sizes[0..k]` are all resolved. `-1` when item 0 is unresolved.
  private _resolvedPrefixEnd: number = -1
  private _dataTypes: string[] = []
  // True when neither `getItemSize` nor `getItemType` is set — readers
  // short-circuit to stride math and skip O(N) parallel-array materialization.
  private _isHomogeneous: boolean = true
  // Distinct types present in `_dataTypes`. Maintained incrementally by
  // `setTypeAtIndex` so partial `invalidate` doesn't force an O(N) rebuild.
  private _liveDataTypesCache: Set<string> | null = null
  private _typeCounts: Map<string, number> | null = null
  // Lazy `getItemKey(i) → dataIndex` cache. Invalidated on any totalItems/order mutation.
  private _keyToIndex: Map<string | number, number> | null = null
  // True iff `getItemSize` returned undefined for the index — `maybeMeasureSlot`
  // measures on first bind.
  private _needsMeasure: boolean[] = []
  // During the initial-fill loop, `maybeMeasureSlot` writes `_sizes` but skips
  // the per-slot rebuild/apply/setDims ripple. `flushDeferredMeasures` applies
  // them in one pass after.
  private _deferMeasureSideEffects: boolean = false
  // Per-pool-slot type, set at creation; never changes for the slot's lifetime.
  private _slotTypes: string[] = []

  // True between drag start and SCROLL_IDLE_TIMEOUT_MS after the last drag
  // tick. `notifyDataChanged` defers rebuilds via `_poolMetricsDirty` while set.
  private _isUserScrolling: boolean = false
  private _scrollIdleCounter: number = 0
  private _poolMetricsDirty: boolean = false
  // Set in `rebindRange` when per-tick grow cap exhausted; drained by
  // `tickDeferredGrowDrain` on idle.
  private _scrollDeferredGrowsPending: boolean = false
  // True while `tickDeferredGrowDrain` is inside `rebindRange` — selects the
  // `DRAIN_GROWS_PER_FRAME` cap instead of the full ringSize budget.
  private _drainingDeferredGrows: boolean = false
  // Re-entrancy guard for `applySnapshot` / `invalidate`.
  private _inMutation: boolean = false

  // Mutations issued while `_isUserScrolling`; drained in `onScrollIdle`.
  private _pendingSnapshot: boolean = false
  private _pendingInvalidate: {
    start: number
    end: number
    whole: boolean
    fields: InvalidateFields
  } | null = null
  // While true, every slot's descendant colliders are forcibly disabled —
  // independent of `_slotVisible`. Re-armed on scroll idle.
  private _collidersForcedOff: boolean = false
  // Cached main-axis component of scroll position. Lets the LateUpdate clip
  // gate short-circuit without a bridge cross.
  private _lastScrollMain: number = 0
  // Pending `forceFlexLayout` + `updateSlotVisibilities` after a scroll-driven
  // rebindRange. Drained in LateUpdate, capping to one pass per frame.
  private _scrollLayoutDirty: boolean = false

  // Depth (not boolean): a binder may synchronously re-enter `fireBindItem`
  // via `invalidate` / `applySnapshot`.
  private _bindingDepth: number = 0

  // Lowest dataIndex whose `_sizes` cell was updated while
  // `_deferMeasureSideEffects` was true. `flushDeferredMeasures` rebuilds
  // cumulatives from here in one pass.
  private _pendingMeasureMinIdx: number = Number.MAX_SAFE_INTEGER
  // Anchor captured by `rebindRange` BEFORE its bind loop mutates `_sizes`, so
  // `flushDeferredMeasures` restores against pre-mutation geometry (capturing
  // inside flush would read new `_sizes` against old cumulatives).
  private _deferredMeasureAnchor: {idx: number; frac: number} | null = null

  // Fade
  private _lastAlpha: number[] = []
  // Outer guard for `updateFade`: skip when scroll value and content size both
  // match the previous call. Invalidated to NaN on rebinds and fade-input changes.
  private _lastFadeScroll: number = NaN
  private _lastFadeContentSize: number = -1
  // Cached `updateFade` loop-invariants, recomputed by `recomputeFadeInvariants`.
  private _fadeHalfViewport: number = 0
  private _fadeContentHalf: number = 0
  private _fadeZone: number = FADE_ZONE_MIN
  private _fadeMaxScroll: number = 0
  private _fadeLastDataIdx: number = -1
  // Outer guard for `clipVisibleInteractables`. Invalidated wherever
  // `_lastFadeScroll` is.
  private _lastClipScroll: number = NaN
  private _clipDirty: boolean = true

  // `_ringOrder[ringPosition] = pool slot index`. Ring position 0 is the topmost
  // visible slot. Boundary crosses shift positions; only the wrapping slot rebinds.
  private _ringOrder: number[] = []

  // rebindRange scratch buffers, sized via `ensureRebindScratch`.
  private _rebindInWindow: Map<number, number> = new Map()
  private _rebindUnusedByType: Map<string, number[]> = new Map()
  private _rebindNewRingOrder: number[] = []
  private _rebindOrderedItems: FlexItem[] = []
  // FlexItems created mid-loop via grow-on-miss. Added to FlexLayout after the loop.
  private _rebindGrownItems: FlexItem[] = []
  // Slots `rebindRange` bound this pass; reset on each entry. Lets the
  // immediately-following unkeyed `rebindAllSlots` skip a redundant re-bind.
  private _rebindBoundThisPass: Set<number> = new Set()

  // Per-frame scratch buffers. Callers MUST NOT retain — values are
  // overwritten in place on each use.
  private _offsetScratch: vec3 = new vec3(0, 0, 0)
  private _alphaScratch: vec4 = new vec4(0, 0, 0, 0)
  private _scrollPosScratch: vec2 = new vec2(0, 0)
  private _visibleRangeScratch: {first: number; last: number} = {first: 0, last: 0}
  private _scrollBoundsScratch: {scrollSize: number; topEdge: number; bottomEdge: number} = {
    scrollSize: 0,
    topEdge: 0,
    bottomEdge: 0
  }
  private _scrollTargetScratch: vec2 = new vec2(0, 0)
  private _clipSizeScratch: vec3 = new vec3(0, 0, 0)
  private _clipCenterScratch: vec3 = new vec3(0, 0, 0)
  private _unusedListPool: number[][] = []
  // NaN sentinel: first write always goes through.
  private _lastAppliedOffset: number = NaN

  private _disposers: (() => void)[] = []
  // Lazily enabled/disabled when work appears.
  private _lateUpdateEvent: SceneEvent | null = null
  private _updateEvent: SceneEvent | null = null

  private _initialized: boolean = false
  // Terminal state, set in `cleanup`. Distinct from `_initialized` (also false
  // pre-init) so pre-init config writes don't trip `assertNotDestroyed`.
  private _destroyed: boolean = false

  // Pre-init `scrollToIndex` / `scrollToKey` queue. Applied during
  // `onLayoutInitialized`, overriding the `initialIndex` landing.
  private _pendingScroll: VirtualizedScrollOptionsBase | null = null
  private _pendingScrollIndex: number | "start" | "end" | null = null
  private _pendingScrollKey: string | number | null = null

  // Set when a center/end scrollToIndex snapped to an unmeasured row: the
  // alignment used the estimated size, so re-derive it once the real size lands.
  private _pendingAlignTarget: {index: number; align: "center" | "end"; offset: number} | null = null
  // Frames the pending correction has waited for its target to measure.
  private _alignWaitFrames: number = 0

  // ─── Adapter ───────────────────────────────────────────────────────

  private _adapter: VirtualizedAdapter<TViewHolder, TType> | null = null

  /**
   * Data + view-holder adapter. Assign before init. Call `applySnapshot()`
   * after post-init mutations; new-adapter assignment doesn't auto-refresh.
   */
  public get adapter(): VirtualizedAdapter<TViewHolder, TType> | null {
    return this._adapter
  }
  public set adapter(value: VirtualizedAdapter<TViewHolder, TType> | null) {
    this.assertNotDestroyed()
    this._adapter = value
  }

  // ─── Events / Callbacks ────────────────────────────────────────────

  private readonly onInitializedEvent = new ReplayEvent<void>()
  public readonly onInitialized = this.onInitializedEvent.publicApi()

  private _itemAlphaHandler:
    | ((slot: SceneObject, alpha: number, dataIndex: number, holder: TViewHolder | null) => void)
    | null = null

  /**
   * Single-owner alpha override. When set, the built-in fade pass is
   * bypassed and the handler receives `(slot, alpha, dataIndex, holder)`
   * once per visible slot per fade tick. Assign `null` to restore the built-in fade.
   */
  public get itemAlphaHandler():
    | ((slot: SceneObject, alpha: number, dataIndex: number, holder: TViewHolder | null) => void)
    | null {
    return this._itemAlphaHandler
  }
  public set itemAlphaHandler(
    handler: ((slot: SceneObject, alpha: number, dataIndex: number, holder: TViewHolder | null) => void) | null
  ) {
    this.assertNotDestroyed()
    this._itemAlphaHandler = handler
  }

  private readonly onScrollDragStartEvent = new Event<void>()
  /**
   * Fires once when the user begins a drag gesture.
   */
  public readonly onScrollDragStart = this.onScrollDragStartEvent.publicApi()

  private readonly onScrollDragEndEvent = new Event<void>()
  /**
   * Fires once when scroll motion ends (drag released, spring settled, or
   * the SCROLL_IDLE_TIMEOUT_MS fallback elapses without further drag input).
   */
  public readonly onScrollDragEnd = this.onScrollDragEndEvent.publicApi()

  private readonly onEndReachedEvent = new Event<void>()
  /**
   * Fires when the viewport is within `edgeReachedThreshold` cm of the end of
   * the content. Once per crossing; re-arms after leaving the band. Fires once
   * at init if the viewport opens inside the band.
   */
  public readonly onEndReached = this.onEndReachedEvent.publicApi()

  private readonly onStartReachedEvent = new Event<void>()
  /**
   * Fires when the viewport is within `edgeReachedThreshold` cm of the start of
   * the content. Once per crossing; re-arms after leaving the band. Fires once
   * at init if the viewport opens inside the band (e.g. at index 0).
   */
  public readonly onStartReached = this.onStartReachedEvent.publicApi()

  // ─── Public Getters / Setters ──────────────────────────────────────

  /**
   * Current scroll position in cm (both axes). `vec2(0, 0)` pre-init.
   */
  public get scrollPosition(): vec2 {
    if (!this._scrollWindow || isNull(this._scrollWindow)) return new vec2(0, 0)
    return this._scrollWindow.scrollPosition
  }

  /**
   * Total scrollable content size in cm along the main scroll axis. Returns `0`
   * after `destroy()`.
   */
  public get contentSize(): number {
    return this._destroyed ? 0 : this._totalContentSize
  }

  /**
   * First/last visible data index, or `null` when nothing is visible.
   */
  public get visibleRange(): {first: number; last: number} | null {
    if (!this.computeVisibleRangeInto(this._visibleRangeScratch)) return null
    // Fresh object — internal scratch is reused.
    return {first: this._visibleRangeScratch.first, last: this._visibleRangeScratch.last}
  }

  /**
   * Data index the viewport opens at. Honored during the first
   * `onLayoutInitialized` pass. Clamped to `[0, totalItems-1]`. Defaults to 0.
   * Post-init, use `scrollToIndex({index, durationMs: 0})` instead.
   */
  public get initialIndex(): number {
    return this._initialIndex
  }

  public get viewportSize(): vec2 {
    return this._viewportSize
  }
  public set viewportSize(value: vec2) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value.x) || !Number.isFinite(value.y) || value.x <= 0 || value.y <= 0) {
      log.w(`viewportSize must contain positive finite numbers; ignoring write of (${value.x}, ${value.y})`)
      return
    }
    if (this._viewportSize.x === value.x && this._viewportSize.y === value.y) return
    // Defensive copy: ScrollWindow.windowSize also stores by reference.
    const cloned = new vec2(value.x, value.y)
    this._viewportSize = cloned
    if (this._scrollWindow && !isNull(this._scrollWindow)) {
      this._scrollWindow.windowSize = cloned
    }
    if (!this._initialized) return
    if (!this.reapplyAxisConfig()) return
    this.notifyDataChanged()
  }

  public get itemSize(): number {
    return this._itemSize
  }
  public set itemSize(value: number) {
    this.assertNotDestroyed()
    if (value <= 0) {
      log.w(`itemSize must be > 0; ignoring write of ${value}`)
      return
    }
    if (this._itemSize === value) return
    this._itemSize = value
    if (!this._initialized) return
    if (!this.reapplyAxisConfig()) return
    this.notifyDataChanged()
  }

  public get bufferCount(): number {
    return this._bufferCount
  }
  public set bufferCount(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      log.w(`bufferCount must be a non-negative integer; ignoring write of ${value}`)
      return
    }
    if (this._bufferCount === value) return
    this._bufferCount = value
    if (this._initialized) this.notifyDataChanged()
  }

  public get scrollDirection(): ScrollDirection {
    return this._scrollDirection as ScrollDirection
  }
  public set scrollDirection(value: ScrollDirection) {
    this.assertNotDestroyed()
    // Enum is string-valued — TS won't catch arbitrary strings from JS call sites.
    if (!Object.values(ScrollDirection).includes(value)) {
      log.w(`scrollDirection: ignoring invalid value "${value}" (expected "vertical" or "horizontal")`)
      return
    }
    if (this._scrollDirection === value) return
    this._scrollDirection = value
    if (!this._initialized) return
    if (!this.reapplyAxisConfig()) return
    this.notifyDataChanged()
  }

  public get gap(): number {
    return this._gap
  }
  public set gap(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0) {
      log.w(`gap must be a non-negative finite number; ignoring write of ${value}`)
      return
    }
    if (this._gap === value) return
    this._gap = value
    if (!this._initialized) return
    if (!this.reapplyAxisConfig()) return
    this.notifyDataChanged()
  }

  /**
   * Number of data rows VL currently tracks (sourced from `adapter.itemCount()`).
   */
  public get totalItems(): number {
    return this._totalItems
  }

  public get fadeEnabled(): boolean {
    return this._fadeEnabled
  }
  public set fadeEnabled(value: boolean) {
    this.assertNotDestroyed()
    if (this._fadeEnabled === value) return
    this._fadeEnabled = value
    if (!this._initialized) return
    this._lastFadeScroll = NaN
    if (!value && this._itemAlphaHandler === null) {
      for (let i = 0; i < this._poolObjects.length; i++) {
        this.applyBuiltInAlpha(i, 1)
        this._lastAlpha[i] = 1
      }
    } else if (this._scrollWindow) {
      this.updateFade(this._scrollWindow.scrollPosition)
    }
  }

  public get fadeDistance(): number {
    return this._fadeDistance
  }
  public set fadeDistance(value: number) {
    this.assertNotDestroyed()
    // `Math.max(eps, NaN)` is NaN — reject up front so the alpha pass can't be corrupted.
    if (!Number.isFinite(value) || value < 0) {
      log.w(`fadeDistance must be a non-negative finite number; ignoring write of ${value}`)
      return
    }
    if (this._fadeDistance === value) return
    this._fadeDistance = value
    if (this._initialized && this._scrollWindow) {
      this.recomputeFadeInvariants()
      this._lastFadeScroll = NaN
      this.updateFade(this._scrollWindow.scrollPosition)
    }
  }

  /**
   * Distance in cm from the start/end of the content at which `onStartReached`
   * / `onEndReached` fire. `0` fires exactly at the edge.
   */
  public get edgeReachedThreshold(): number {
    return this._edgeReachedThreshold
  }
  public set edgeReachedThreshold(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0) {
      log.w(`edgeReachedThreshold must be a non-negative finite number; ignoring write of ${value}`)
      return
    }
    if (this._edgeReachedThreshold === value) return
    this._edgeReachedThreshold = value
    if (this._initialized) this.requestLateUpdate()
  }

  public get poolSize(): number {
    return this._poolObjects.length
  }

  /**
   * Per-type pool slot counts, keyed by type, as a fresh Map. Recomputed
   * `O(poolSize)` per read. Sizes only; create/recycle counts are not tracked.
   */
  public get poolSizesByType(): Map<string, number> {
    const counts = new Map<string, number>()
    for (let s = 0; s < this._slotTypes.length; s++) {
      const t = this._slotTypes[s] ?? VL_DEFAULT_TYPE
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return counts
  }

  public get isUserScrolling(): boolean {
    return this._isUserScrolling
  }

  /**
   * Lower bound on per-type pool size after shrink-GC. Setting to 2+ keeps
   * spare slots warm so a single off-screen-back-into-view recycle doesn't
   * fire `adapter.onCreateView` on the scroll hot path. Raising post-init
   * triggers a `prewarmTypePools` pass to top up below-floor types; lowering
   * makes more slots eligible for shrink-GC on the next tick.
   */
  public get minSlotsPerType(): number {
    return this._minSlotsPerType
  }
  public set minSlotsPerType(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      log.w(`minSlotsPerType must be a non-negative integer; ignoring write of ${value}`)
      return
    }
    if (this._minSlotsPerType === value) return
    const previous = this._minSlotsPerType
    this._minSlotsPerType = value
    if (this._initialized && value > previous) this.prewarmTypePools()
  }

  /**
   * Per-frame budget for the long-tail typed-pool prewarm queue (rare row
   * types whose first occurrence sits past the discovery limit). `0` drains
   * the long-tail synchronously instead of yielding across frames. Visible
   * and buffer types are always allocated synchronously at init regardless
   * of this value. Post-init writes take effect on the next
   * `tickPrewarmQueue` call; in-flight queues are not re-evaluated.
   */
  public get prewarmBudgetMs(): number {
    return this._prewarmBudgetMs
  }
  public set prewarmBudgetMs(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0) {
      log.w(`prewarmBudgetMs must be a non-negative finite number; ignoring write of ${value}`)
      return
    }
    if (this._prewarmBudgetMs === value) return
    this._prewarmBudgetMs = value
  }

  /**
   * Idle threshold (ms) before an unused pool slot becomes eligible for
   * shrink-GC. `0` disables shrink entirely — the pool only grows. Affects
   * the throttle threshold on the next `tickShrinkGC` call.
   */
  public get shrinkDelayMs(): number {
    return this._shrinkDelayMs
  }
  public set shrinkDelayMs(value: number) {
    this.assertNotDestroyed()
    if (!Number.isFinite(value) || value < 0) {
      log.w(`shrinkDelayMs must be a non-negative finite number; ignoring write of ${value}`)
      return
    }
    if (this._shrinkDelayMs === value) return
    this._shrinkDelayMs = value
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  public onAwake(): void {
    // MUST precede VL's LateUpdate bind: registers ScrollWindow's LateUpdate first
    // so it settles scroll before VL's clip pass; reorder and scroll-idle leaks a hit-test.
    this.constructDependencies()

    if (this._layout) {
      const unsubLayoutInit = this._layout.onInitialized.add(() => this.onLayoutInitialized())
      this._disposers.push(unsubLayoutInit)
    }

    this.createEvent("OnDestroyEvent").bind(() => this.cleanup())

    const update = this.createEvent("UpdateEvent")
    update.bind(() => {
      if (!this._initialized) return
      // Prewarm first — a fresh spare may satisfy the drain's next grow.
      this.tickPrewarmQueue()
      this.tickDeferredGrowDrain()
      this.tickShrinkGC()
    })
    this._updateEvent = update

    // LateUpdate is the safe point to read world transforms — Lens Studio
    // propagates parent → child transforms at LateUpdate.
    const lateUpdate = this.createEvent("LateUpdateEvent")
    lateUpdate.bind(() => {
      if (!this._initialized) return
      // Drain queued scroll layout BEFORE clipVisibleInteractables so the
      // clip pass reads settled world transforms.
      if (this._scrollLayoutDirty && !this._collidersForcedOff) {
        this._scrollLayoutDirty = false
        this.forceFlexLayout()
        this.updateSlotVisibilities()
      }
      this.drainPendingRemeasure()
      this.applyPendingAlignCorrection()
      this.clipVisibleInteractables()
      this.detectEdgeReached()
      if (
        !this._scrollLayoutDirty &&
        this._pendingRemeasure.size === 0 &&
        this._pendingAlignTarget === null &&
        !this._clipDirty &&
        this._lastScrollMain === this._lastClipScroll &&
        this._lateUpdateEvent
      ) {
        this._lateUpdateEvent.enabled = false
      }
    })
    this._lateUpdateEvent = lateUpdate
  }

  private requestLateUpdate(): void {
    if (this._lateUpdateEvent && !this._lateUpdateEvent.enabled) {
      this._lateUpdateEvent.enabled = true
    }
  }

  private markClipDirty(): void {
    this._clipDirty = true
    this.requestLateUpdate()
  }

  private queueRemeasure(dataIndex: number): void {
    this._pendingRemeasure.add(dataIndex)
    this.requestLateUpdate()
  }

  private constructDependencies(): void {
    // Scene tree: VL SO > ScrollWindow SO > Scroller (created by ScrollWindow) > FlexLayout SO.
    const scrollObj = global.scene.createSceneObject("VL_ScrollWindow")
    scrollObj.setParent(this.sceneObject)
    scrollObj.layer = this.sceneObject.layer

    const scrollWindow = scrollObj.createComponent(ScrollWindow.getTypeName()) as ScrollWindow
    scrollWindow.windowSize = this._viewportSize
    // Suppresses only SW's boundary-driven collider enable/disable — VL owns that.
    // SW still fires triggerCanceled on slot interactables at drag-start (intended:
    // a scroll gesture shouldn't also tap a slot).
    scrollWindow.skipColliderManagement = true
    this._scrollWindow = scrollWindow
    this._scrollWindowTransform = scrollObj.getTransform()

    const layoutObj = global.scene.createSceneObject("VL_FlexLayout")
    layoutObj.setParent(scrollObj)
    layoutObj.layer = this.sceneObject.layer

    const layout = layoutObj.createComponent(FlexLayout.getTypeName()) as FlexLayout
    // Must be set BEFORE FlexLayout's OnStartEvent fires, or its start handler
    // replaces our addItems with discovered children.
    layout.autoDiscoverItemsOnStart = false
    this._layout = layout
    this._layoutTransform = layoutObj.getTransform()
  }

  // ─── Public Methods ────────────────────────────────────────────────

  private notifyDataChanged(): void {
    if (!this._initialized || !this._layout || !this._scrollWindow) return

    // Defer if applyDataChange is in flight (binder mutated totalItems) or the user is scrolling.
    if (this._isUpdatingData || this._isUserScrolling) {
      this._poolMetricsDirty = true
      return
    }

    this.applyDataChange()
  }

  /**
   * Scroll the viewport so the target row lands on screen. Pre-init calls
   * queue and apply during `onLayoutInitialized` (overriding `initialIndex`).
   * Throws only after `destroy()`.
   *
   * `index`: numeric row, or `"start"` / `"end"` sentinel.
   * `align`: `"start"` (default), `"center"`, or `"end"` — where the row
   *   sits inside the viewport.
   * `offset`: extra cm shift along the main axis on top of the alignment.
   * `durationMs`: tween duration. `0` jumps instantly. Default `200`.
   */
  public scrollToIndex(opts: VirtualizedScrollOptions): void {
    this.assertNotDestroyed()
    if (!this._initialized) {
      this._pendingScroll = opts
      this._pendingScrollIndex = opts.index
      this._pendingScrollKey = null
      return
    }
    this.doScrollToIndex(opts)
  }

  /**
   * Scroll to the row whose `adapter.getItemKey(i)` matches `key`. No-op if
   * the adapter doesn't define `getItemKey` or the key isn't found. Same
   * pre-init queueing as `scrollToIndex`.
   */
  public scrollToKey(key: string | number, opts?: VirtualizedScrollOptionsBase): void {
    this.assertNotDestroyed()
    if (!this._initialized) {
      this._pendingScroll = opts ?? {}
      this._pendingScrollIndex = null
      this._pendingScrollKey = key
      return
    }
    const resolved = this.resolveKeyToIndex(key)
    if (resolved < 0) return
    this.doScrollToIndex({...(opts ?? {}), index: resolved})
  }

  private resolveKeyToIndex(key: string | number): number {
    const getKey = this.adapter?.getItemKey
    if (!getKey) return -1
    const map = this.ensureKeyToIndex(getKey)
    const idx = map.get(key)
    return idx === undefined ? -1 : idx
  }

  private ensureKeyToIndex(getKey: (i: number) => string | number): Map<string | number, number> {
    if (this._keyToIndex) return this._keyToIndex
    const map = this.buildKeyToIndexMap(getKey, this._totalItems)
    this._keyToIndex = map
    return map
  }

  /**
   * Walk `[0, count)` calling `getKey`, building a `key -> index` map. Throws
   * on the first duplicate key. The map is local and returned only on success,
   * so a throw leaves no half-built state.
   */
  private buildKeyToIndexMap(getKey: (i: number) => string | number, count: number): Map<string | number, number> {
    const map = new Map<string | number, number>()
    for (let i = 0; i < count; i++) {
      const k = getKey(i)
      if (map.has(k)) {
        throw new Error(
          `VirtualizedLayout: duplicate item key "${k}" at data indices ${map.get(k)} and ${i}; adapter.getItemKey must return a unique key per row`
        )
      }
      map.set(k, i)
    }
    return map
  }

  private doScrollToIndex(opts: VirtualizedScrollOptions): void {
    if (this._totalItems === 0) return
    if (this._itemSize <= 0) return
    if (!this._scrollWindow || this._totalContentSize <= 0) return

    // New request supersedes any in-flight alignment correction.
    this._pendingAlignTarget = null

    const resolved = this.resolveScrollIndex(opts.index)
    const align = opts.align ?? "start"
    const offset = opts.offset ?? 0
    const durationMs = opts.durationMs ?? 200

    // alignDelta = distance from item-near-edge to alignment anchor, in cm.
    // 0 = near edge, V-s = far edge. `offset` adds further along the same axis.
    const size = this._sizes[resolved] > 0 ? this._sizes[resolved] : this._itemSize
    const alignDelta =
      align === "center" ? (this._viewportMain - size) / 2 : align === "end" ? this._viewportMain - size : 0

    const {topEdge, bottomEdge} = this.getScrollBounds()
    const top = this.topOfItem(resolved)
    const rawTarget = this._isVertical ? topEdge + top - alignDelta - offset : bottomEdge - top + alignDelta + offset
    const target = Math.max(topEdge, Math.min(rawTarget, bottomEdge))

    // Snap instantly when the target is past the resolved prefix — the
    // extrapolated offset can shift once those rows measure. Homogeneous
    // mode stays at the `-1` prefix sentinel, so guard explicitly.
    const targetUnresolved = !this._isHomogeneous && resolved > this._resolvedPrefixEnd
    if (targetUnresolved || durationMs <= 0) {
      // center/end alignment used the estimated size; re-derive once `resolved`
      // measures (start has alignDelta 0, so it needs no correction).
      if (targetUnresolved && (align === "center" || align === "end")) {
        this._pendingAlignTarget = {index: resolved, align, offset}
        this._alignWaitFrames = 0
        this.requestLateUpdate()
      }
      this.setScrollPosition(target)
      return
    }
    const scratch = this._scrollTargetScratch
    if (this._isVertical) {
      scratch.x = 0
      scratch.y = target
    } else {
      scratch.x = target
      scratch.y = 0
    }
    this._scrollWindow.tweenTo(scratch, durationMs)
  }

  /**
   * Re-apply a center/end alignment once its target row's real size lands.
   * No-op until the row measures; cleared on a new scroll request or user drag.
   */
  private applyPendingAlignCorrection(): void {
    const pending = this._pendingAlignTarget
    if (pending === null || !this._scrollWindow) return
    const idx = pending.index
    if (idx >= this._totalItems) {
      this._pendingAlignTarget = null
      return
    }
    // Wait for the real size; alignDelta depends only on `idx`'s own size.
    // Bound the wait so an async row that never measures can't pin LateUpdate.
    if (!(this._sizes[idx] > 0)) {
      if (++this._alignWaitFrames >= ALIGN_CORRECTION_MAX_WAIT_FRAMES) this._pendingAlignTarget = null
      return
    }
    this._pendingAlignTarget = null

    const size = this._sizes[idx]
    const alignDelta = pending.align === "center" ? (this._viewportMain - size) / 2 : this._viewportMain - size
    const {topEdge, bottomEdge} = this.getScrollBounds()
    const top = this.topOfItem(idx)
    const rawTarget = this._isVertical
      ? topEdge + top - alignDelta - pending.offset
      : bottomEdge - top + alignDelta + pending.offset
    this.setScrollPosition(Math.max(topEdge, Math.min(rawTarget, bottomEdge)))
  }

  private resolveScrollIndex(index: number | "start" | "end"): number {
    if (index === "start") return 0
    if (index === "end") return Math.max(0, this._totalItems - 1)
    if (!Number.isFinite(index)) {
      log.w(`resolveScrollIndex: non-finite index ${index}; clamping to 0`)
      return 0
    }
    return Math.max(0, Math.min(Math.floor(index), this._totalItems - 1))
  }

  /**
   * Distinguishes three states for `sceneObject` lookups:
   *   - `{kind: "bound", index}` — pool slot, currently showing a data row.
   *   - `{kind: "unbound"}` — pool slot, past-end of data (no dataIndex).
   *   - `{kind: "notSlot"}` — `sceneObject` isn't a pool-slot root.
   */
  public dataIndexFor(sceneObject: SceneObject): DataIndexLookup {
    const slot = this._slotBySceneObject.get(sceneObject)
    if (slot === undefined) return {kind: "notSlot"}
    const idx = this._dataIndices[slot]
    return idx >= 0 ? {kind: "bound", index: idx} : {kind: "unbound"}
  }

  /**
   * Returns the currently mounted row root for `dataIndex`, or `null` when that
   * row is outside the active pool/window. The SceneObject remains owned by VL
   * and may be recycled on the next scroll or data mutation; do not retain it as
   * durable row identity.
   */
  public sceneObjectForDataIndex(dataIndex: number): SceneObject | null {
    if (!Number.isInteger(dataIndex) || dataIndex < 0 || dataIndex >= this._totalItems) return null
    for (let s = 0; s < this._dataIndices.length; s++) {
      if (this._dataIndices[s] === dataIndex) {
        const obj = this._poolObjects[s]
        return obj && !isNull(obj) ? obj : null
      }
    }
    return null
  }

  private refreshAfterMutation(): void {
    if (!this._initialized || !this._scrollWindow) return
    this.setScrollDimensions(Math.max(this._totalContentSize, this._viewportMain))
    this.resizePool()
    if (this._poolObjects.length === 0) return
    const scroll = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
    const firstVisible = this.computeFirstVisibleSlot(scroll)
    const startIndex = Math.max(0, firstVisible - this._bufferCount)
    this.rebindRange(startIndex)
    this.updateLayoutOffset(startIndex)
    if (firstVisible !== this._lastFirstVisibleDataIndex) {
      this._lastFirstVisibleDataIndex = firstVisible
    }
    // Drain FlexLayout so post-reorder transforms are settled before
    // updateSlotVisibilities toggles colliders.
    this.forceFlexLayout()
    this.updateSlotVisibilities()
    this._lastFadeScroll = NaN
    this._lastClipScroll = NaN
    this.markClipDirty()
    this.updateFade(this._scrollWindow.scrollPosition)
  }

  /**
   * Re-read `adapter.itemCount()` and diff against the current view. With
   * `getItemKey`, it reconciles identity/order only: a surviving key keeps its
   * slot + holder and is NOT re-bound, so per-row content/size changes to a
   * surviving key must go through `invalidate` (content via `"content"`, size
   * via `"size"`); without `getItemKey`, every bound slot is rebound by index.
   * Use for sort / filter / reshuffle. Throws on a duplicate `getItemKey`.
   * Returns `false` for no-ops (pre-init, no adapter, nested reentry).
   */
  public applySnapshot(): boolean {
    this.assertNotDestroyed()
    if (!this._initialized || !this.adapter) return false
    if (this._inMutation) {
      log.w("VirtualizedLayout.applySnapshot: nested mutation from inside a VL callback is unsupported; ignored")
      return false
    }
    if (this._isUserScrolling) {
      this._pendingSnapshot = true
      return true
    }
    // Reorder/filter changes which row an index points to — drop a stale
    // alignment correction so it can't snap to the wrong row.
    this._pendingAlignTarget = null
    this.rearmEdgeReached()
    this._inMutation = true
    try {
      const newCount = this.adapter.itemCount()
      const getKey = this.adapter.getItemKey
      if (!getKey) {
        this.applySnapshotUnkeyed(newCount)
        return true
      }
      this.applySnapshotKeyed(newCount, getKey)
      return true
    } finally {
      this._inMutation = false
    }
  }

  /**
   * Invalidate cached state for `[range.start, range.end)` (defaults to whole data).
   * `fields`:
   *   - `"content"`: re-fire `adapter.onBindView`.
   *   - `"size"`: re-resolve sizes + types, rebuild cumulatives.
   *   - `"type"`: re-resolve types only.
   *   - `"structure"`: re-walk subtree component caches (binder added/removed components).
   *   - `"all"` (default): size + structure + content.
   */
  public invalidate(range?: {start: number; end: number}, fields: InvalidateFields = "all"): boolean {
    this.assertNotDestroyed()
    if (!this._initialized) return false
    if (this._inMutation) {
      log.w("VirtualizedLayout.invalidate: nested mutation from inside a VL callback is unsupported; ignored")
      return false
    }
    const start = range ? Math.max(0, Math.floor(range.start)) : 0
    const end = range ? Math.min(this._totalItems, Math.floor(range.end)) : this._totalItems
    if (start >= end) {
      // `range.end` is exclusive. Warn on the common inclusive-end foot-gun.
      if (range) {
        log.w(
          `VirtualizedLayout.invalidate: range.end (${range.end}) <= range.start (${range.start}); end is exclusive, no rows refreshed`
        )
      }
      return false
    }

    if (this._isUserScrolling || this._bindingDepth > 0) {
      const p = this._pendingInvalidate
      if (p === null) {
        this._pendingInvalidate = {start, end, whole: !range, fields}
      } else {
        p.whole = p.whole || !range
        p.start = Math.min(p.start, start)
        p.end = Math.max(p.end, end)
        if (p.fields !== fields) p.fields = "all"
      }
      return true
    }

    this._inMutation = true
    try {
      // Pick up post-init adapter shape changes (consumer added/removed
      // `getItemType` / `getItemSize`) so downstream paths see consistent state.
      const shapeChanged = this.reconcileAdapterShape()
      if (fields === "size" || fields === "all") {
        // Homogeneous mode has no per-index arrays to refresh; `shapeChanged`
        // means rebuildSizes already covered the whole range.
        if (!this._isHomogeneous && !shapeChanged) this.invalidateSizes(start, end)
      } else if (fields === "type") {
        // `shapeChanged` already rebuilt + refreshed via reconcileAdapterShape.
        if (!this._isHomogeneous && !shapeChanged) {
          for (let i = start; i < end; i++) {
            this.setTypeAtIndex(i, this.resolveItemType(i))
          }
          // Recycle in-window slots whose type no longer matches their row —
          // rebindRange's type check handles the swap.
          this.refreshAfterMutation()
        }
      }
      if (fields === "structure" || fields === "all") {
        this.invalidateStructure(start, end)
      }
      if (fields === "content" || fields === "all") {
        this.invalidateContent(start, end)
      }
    } finally {
      this._inMutation = false
    }
    if (this._pendingInvalidate !== null && this._bindingDepth === 0 && !this._isUserScrolling) {
      const p = this._pendingInvalidate
      this._pendingInvalidate = null
      this.invalidate(p.whole ? undefined : {start: p.start, end: p.end}, p.fields)
    }
    return true
  }

  /**
   * Invalidate a single row `index`. Thin wrapper over `invalidate` with the
   * half-open range `[index, index + 1)`.
   */
  public invalidateItem(index: number, fields: InvalidateFields = "all"): boolean {
    return this.invalidate({start: index, end: index + 1}, fields)
  }

  /**
   * Invalidate the half-open row range `[start, end)`. Thin wrapper over
   * `invalidate`.
   */
  public invalidateRange(start: number, end: number, fields: InvalidateFields = "all"): boolean {
    return this.invalidate({start, end}, fields)
  }

  /**
   * Re-derive `_isHomogeneous` from the current adapter; if it flipped, run
   * `rebuildSizes` + downstream invariants. Returns `true` when a shape
   * change was detected.
   */
  private reconcileAdapterShape(): boolean {
    const hasGetSize = this.adapter?.getItemSize !== undefined
    const hasGetType = this.adapter?.getItemType !== undefined
    const expectedHomogeneous = !hasGetSize && !hasGetType
    if (expectedHomogeneous === this._isHomogeneous) return false
    // Bracket the content-size flip so the visible row holds position.
    const anchor = this.captureAnchor()
    this.rebuildSizes()
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    this.recomputeFadeInvariants()
    this.restoreAnchor(anchor)
    this.refreshAfterMutation()
    return true
  }

  private rebindAllSlots(): void {
    if (this._poolObjects.length === 0) return
    // Ring rotates after scroll — each slot's actual binding is in _dataIndices.
    // Skip slots the immediately-preceding rebindRange already bound this pass
    // so a recycled slot isn't bound twice.
    for (let i = 0; i < this._poolObjects.length; i++) {
      if (this._rebindBoundThisPass.has(i)) continue
      const dataIndex = this._dataIndices[i]
      if (dataIndex >= 0 && dataIndex < this._totalItems) {
        this.fireBindItem(i, dataIndex)
        this._lastAlpha[i] = -1
      }
    }
    this._lastFadeScroll = NaN
    if (this._scrollWindow) this.updateFade(this._scrollWindow.scrollPosition)
  }

  private applySnapshotUnkeyed(newCount: number): void {
    const anchor = this.captureAnchor()
    this._totalItems = newCount
    this._keyToIndex = null
    this.rebuildSizes()
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    this.recomputeFadeInvariants()
    // Clamp dataIndices to the new range before refresh.
    for (let s = 0; s < this._dataIndices.length; s++) {
      if (this._dataIndices[s] >= newCount) {
        const oldDi = this._dataIndices[s]
        this._dataIndices[s] = -1
        this.fireUnbindItem(s, oldDi)
        this._poolObjects[s].enabled = false
      }
    }
    this.restoreAnchor(anchor)
    this.refreshAfterMutation()
    this.rebindAllSlots()
  }

  private applySnapshotKeyed(newCount: number, getKey: (i: number) => string | number): void {
    const anchor = this.captureAnchor()
    this._totalItems = newCount
    this.rebuildSizes()
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    this.recomputeFadeInvariants()

    // Detect-before-mutate: build the full map first (the only getKey walk) so
    // a duplicate throws before any _dataIndices redirect (no half-reconcile).
    const keyToIndex = this.buildKeyToIndexMap(getKey, newCount)
    this._keyToIndex = keyToIndex

    // Reconcile off the prebuilt map (no getKey calls): matching keys redirect
    // their slot to the new dataIndex; leftover bound slots are unbound.
    const slotKeyToSlot = new Map<string | number, number>()
    for (let s = 0; s < this._poolObjects.length; s++) {
      const oldKey = this._slotKeys[s]
      if (oldKey !== null) slotKeyToSlot.set(oldKey, s)
    }
    const ringSize = this.computeRingSize()
    let startIndex = 0
    if (this._initialized && this._scrollWindow) {
      const scroll = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
      const firstVisible = this.computeFirstVisibleSlot(scroll)
      startIndex = Math.max(0, firstVisible - this._bufferCount)
    }

    for (const [k, i] of keyToIndex) {
      if (slotKeyToSlot.size === 0) break
      const slot = slotKeyToSlot.get(k)
      if (slot !== undefined) {
        const typeMatches = (this._slotTypes[slot] ?? VL_DEFAULT_TYPE) === (this._dataTypes[i] ?? VL_DEFAULT_TYPE)
        const inRing = i >= startIndex && i < startIndex + ringSize
        if (typeMatches && inRing) {
          this._dataIndices[slot] = i
          slotKeyToSlot.delete(k)
        }
      }
    }
    if (slotKeyToSlot.size > 0) {
      for (const slot of slotKeyToSlot.values()) {
        const oldDi = this._dataIndices[slot]
        if (oldDi >= 0) {
          this._dataIndices[slot] = -1
          this.fireUnbindItem(slot, oldDi)
          this._poolObjects[slot].enabled = false
        }
      }
    }

    this.restoreAnchor(anchor)
    this.refreshAfterMutation()
  }

  private invalidateSizes(start: number, end: number): void {
    const anchor = this.captureAnchor()
    for (let i = start; i < end; i++) {
      const raw = this.resolveItemSizeRaw(i)
      this._sizes[i] = this.coerceSize(raw)
      this._needsMeasure[i] = raw === undefined
      this.setTypeAtIndex(i, this.resolveItemType(i))
      // Handlers whose `measure` reads post-reflow transforms get a LateUpdate retry.
      if (this._needsMeasure[i]) this.queueRemeasure(i)
    }
    this.rebuildCumulativesFrom(start)
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    this.recomputeFadeInvariants()
    for (let s = 0; s < this._dataIndices.length; s++) {
      const di = this._dataIndices[s]
      if (di >= start && di < end) {
        const sz = this._sizes[di] < 0 ? this._itemSize : this._sizes[di]
        this.applyItemSizeToSlot(s, sz)
      }
    }
    this.restoreAnchor(anchor)
    this.refreshAfterMutation()
  }

  private invalidateStructure(start: number, end: number): void {
    let touched = false
    for (let s = 0; s < this._dataIndices.length; s++) {
      const di = this._dataIndices[s]
      if (di >= start && di < end) {
        this.refreshSlotSubtreeComponents(s)
        touched = true
      }
    }
    if (touched) this.markClipDirty()
  }

  private invalidateContent(start: number, end: number): void {
    let touched = false
    for (let s = 0; s < this._dataIndices.length; s++) {
      const di = this._dataIndices[s]
      if (di >= start && di < end) {
        this.fireBindItem(s, di)
        this._lastAlpha[s] = -1
        touched = true
      }
    }
    if (touched) {
      this._lastFadeScroll = NaN
      if (this._scrollWindow) this.updateFade(this._scrollWindow.scrollPosition)
    }
  }

  /**
   * Compute the current visible-row range into a caller-owned buffer. Returns
   * `false` when nothing is visible; `true` writes `out.first` / `out.last`.
   */
  private computeVisibleRangeInto(out: {first: number; last: number}): boolean {
    if (this._poolObjects.length === 0 || this._lastFirstVisibleDataIndex < 0) return false
    const first = this._lastFirstVisibleDataIndex
    // Include the intra-item offset so partial-bottom slots aren't excluded
    // when scroll sits mid-item.
    const intraOffset = this.computeIntraItemOffset(first)
    const target = this._viewportMain + intraOffset
    const resolvedLimit = Math.min(this._resolvedPrefixEnd, this._totalItems - 1)
    if (resolvedLimit >= first) {
      let running = 0
      for (let i = first; i <= resolvedLimit; i++) {
        running += this._sizes[i]
        if (running >= target) {
          out.first = first
          out.last = i
          return true
        }
        running += this._gap
      }
      if (resolvedLimit === this._totalItems - 1) {
        out.first = first
        out.last = this._totalItems - 1
        return true
      }
    }
    out.first = first
    // `+1` covers the partial-bottom slot when scroll is mid-item.
    const extra = intraOffset > 0 ? 1 : 0
    out.last = Math.min(first + this._visibleSlots - 1 + extra, this._totalItems - 1)
    return true
  }

  /**
   * Distance from the top of item `first` to the viewport top edge, in cm.
   * Positive when item `first` is partially hidden at the top.
   */
  private computeIntraItemOffset(first: number): number {
    if (!this._scrollWindow) return 0
    const {topEdge, bottomEdge} = this.getScrollBounds()
    const distFromStart = this._isVertical ? this._lastScrollMain - topEdge : bottomEdge - this._lastScrollMain
    return Math.max(0, distFromStart - this.topOfItem(first))
  }

  // Re-arm both edge callbacks. Data mutation can leave the viewport inside a
  // threshold band, where `detectEdgeReached` never re-arms on its own.
  private rearmEdgeReached(): void {
    this._endReachedArmed = true
    this._startReachedArmed = true
  }

  /**
   * Fire `onStartReached` / `onEndReached` once per crossing when the viewport
   * is within `edgeReachedThreshold` cm of the content edge.
   */
  private detectEdgeReached(): void {
    if (this._totalItems === 0 || !this._scrollWindow) return
    if (!this.computeVisibleRangeInto(this._visibleRangeScratch)) return
    const {topEdge, bottomEdge} = this.getScrollBounds()
    const distFromStart = this._isVertical ? this._lastScrollMain - topEdge : bottomEdge - this._lastScrollMain
    const distFromEnd = bottomEdge - topEdge - distFromStart
    const threshold = this._edgeReachedThreshold

    if (distFromStart <= threshold) {
      if (this._startReachedArmed) {
        this._startReachedArmed = false
        this.onStartReachedEvent.invoke()
        if (!this._initialized) return
      }
    } else {
      this._startReachedArmed = true
    }

    if (distFromEnd <= threshold) {
      if (this._endReachedArmed) {
        this._endReachedArmed = false
        this.onEndReachedEvent.invoke()
        if (!this._initialized) return
      }
    } else {
      this._endReachedArmed = true
    }
  }

  // ─── Private: Initialization ───────────────────────────────────────

  private onLayoutInitialized(): void {
    if (this._initialized) return
    if (!this._layout || !this._scrollWindow) return

    if (!this.reapplyAxisConfig()) return

    if (this.adapter) this._totalItems = this.adapter.itemCount()

    this.rebuildSizes()
    this._totalContentSize = this.computeTotalContentSize(this.totalItems)
    this.recomputeFadeInvariants()

    const calculatedPoolSize = this._visibleSlots + 2 * this._bufferCount
    // Clamp to 0 — `new Array(size)` throws on a negative.
    const actualPoolSize = Math.max(
      0,
      this._poolSizeOverride !== null
        ? Math.min(this._poolSizeOverride, this.totalItems)
        : Math.min(calculatedPoolSize, this.totalItems)
    )

    this.setScrollDimensions(this.getScrollBounds().scrollSize)

    if (actualPoolSize > 0) {
      // Compute startIndex BEFORE the pre-create loop so each slot is typed
      // for the dataIndex it will be bound to.
      const initialFirstVisible = this.clampedInitialIndex()
      const initialStartIndex = Math.max(0, initialFirstVisible - this._bufferCount)

      for (let i = 0; i < actualPoolSize; i++) {
        const initialIdxForSlot = initialStartIndex + i
        const t =
          initialIdxForSlot < this._totalItems
            ? (this._dataTypes[initialIdxForSlot] ?? VL_DEFAULT_TYPE)
            : VL_DEFAULT_TYPE
        this.createPoolItem(t)
      }

      this._layout.addItems(this._poolItems)
      this.ensureRebindScratch(actualPoolSize)

      // Initial ring order = identity. Defer measure side effects across the
      // bind loop; `flushDeferredMeasures` applies them in one pass after.
      this._deferMeasureSideEffects = true
      this._ringOrder.length = actualPoolSize
      for (let i = 0; i < actualPoolSize; i++) {
        this._ringOrder[i] = i
        const dataIndex = initialStartIndex + i
        if (dataIndex < this.totalItems) {
          // Write `_dataIndices[i]` before the callback so synchronous
          // re-entries see consistent state.
          this._dataIndices[i] = dataIndex
          this.applyItemSizeToSlot(i, this._sizes[dataIndex] > 0 ? this._sizes[dataIndex] : this._itemSize)
          this.fireBindItem(i, dataIndex)
          // Mid-callback destroy guard: `_initialized` is still false at this
          // point, so sentinel on the owned dependency.
          if (this._scrollWindow === null) return
        } else {
          // Past end of data — hide so the SceneObject doesn't render as a ghost row.
          this._poolObjects[i].enabled = false
        }
      }
      this._deferMeasureSideEffects = false
      this.flushDeferredMeasures()

      // Apply `initialIndex` AFTER measurements so the math reflects the final content size.
      const {topEdge, bottomEdge} = this.getScrollBounds()
      const topOfTarget = this.topOfItem(initialFirstVisible)
      const initialScrollVal = this._isVertical ? topEdge + topOfTarget : bottomEdge - topOfTarget
      this.setScrollPosition(initialScrollVal)

      this.updateLayoutOffset(initialStartIndex)
      this._lastFirstVisibleDataIndex = initialFirstVisible
      // Drain FlexLayout's initial pass so updateSlotVisibilities reads settled transforms.
      this.forceFlexLayout()
      this.updateSlotVisibilities()
      this.updateFade(this._scrollWindow.scrollPosition)

      this.prewarmTypePools()
    }

    const unsubScrollPos = this._scrollWindow.onScrollPositionUpdated.add((position: vec2) => {
      this.onScrollPositionUpdated(position)
    })
    const unsubScrollDrag = this._scrollWindow.onScrollDrag.add(() => {
      this.onScrollDragActivity()
    })
    // Authoritative "fully settled" signal — drops to idle immediately
    // instead of waiting on the SCROLL_IDLE_TIMEOUT_MS fallback.
    const unsubScrollEnd = this._scrollWindow.onScrollEnd.add(() => {
      this.onScrollSettled()
    })
    this._disposers.push(unsubScrollPos, unsubScrollDrag, unsubScrollEnd)

    this._initialized = true

    // Apply pending pre-init `scrollToIndex` / `scrollToKey`, overriding `initialIndex`.
    if (this._pendingScroll) {
      const pending = this._pendingScroll
      const pendingKey = this._pendingScrollKey
      const pendingIndex = this._pendingScrollIndex
      this._pendingScroll = null
      this._pendingScrollKey = null
      this._pendingScrollIndex = null
      if (pendingKey !== null) {
        const resolved = this.resolveKeyToIndex(pendingKey)
        if (resolved >= 0) this.doScrollToIndex({...pending, index: resolved})
      } else if (pendingIndex !== null) {
        this.doScrollToIndex({...pending, index: pendingIndex})
      }
    }

    this.onInitializedEvent.invoke()
  }

  /**
   * Recompute axis-derived state and resync every pool item's overrides. On
   * axis flip, scroll position and axis-bound caches are reset. Returns
   * `false` on invalid stride.
   */
  private reapplyAxisConfig(): boolean {
    if (!this._layout || !this._scrollWindow) return false

    const wasVertical = this._isVertical
    this._isVertical = this._scrollDirection !== ScrollDirection.Horizontal
    const axisFlipped = this._initialized && wasVertical !== this._isVertical

    const crossSize = this._isVertical ? this._viewportSize.x : this._viewportSize.y
    this._viewportMain = this._isVertical ? this._viewportSize.y : this._viewportSize.x

    if (this._isVertical) {
      if (this._layout.direction !== FlexDirection.Column) {
        this._layout.direction = FlexDirection.Column
      }
      if (this._layout.verticalAlignment !== FlexContentVerticalAlignment.Top) {
        this._layout.verticalAlignment = FlexContentVerticalAlignment.Top
      }
      // Cross-axis alignment MUST be reset — stale edge alignment from a
      // prior axis shifts items and half-clips them.
      if (this._layout.horizontalAlignment !== FlexContentHorizontalAlignment.Center) {
        this._layout.horizontalAlignment = FlexContentHorizontalAlignment.Center
      }
      // Main axis grows from content (-1); cross axis is fixed at viewport.
      if (this._layout.width !== crossSize) this._layout.width = crossSize
      if (this._layout.height !== -1) this._layout.height = -1
      this._layout.rowGap = this._gap
    } else {
      if (this._layout.direction !== FlexDirection.Row) {
        this._layout.direction = FlexDirection.Row
      }
      if (this._layout.horizontalAlignment !== FlexContentHorizontalAlignment.Left) {
        this._layout.horizontalAlignment = FlexContentHorizontalAlignment.Left
      }
      if (this._layout.verticalAlignment !== FlexContentVerticalAlignment.Center) {
        this._layout.verticalAlignment = FlexContentVerticalAlignment.Center
      }
      if (this._layout.height !== crossSize) this._layout.height = crossSize
      if (this._layout.width !== -1) this._layout.width = -1
      this._layout.columnGap = this._gap
    }
    this._containerCrossSize = crossSize
    this._fadeHalfViewport = this._viewportMain / 2

    this._scrollWindow.vertical = this._isVertical
    this._scrollWindow.horizontal = !this._isVertical

    this._stride = this._itemSize + this._gap
    if (this._stride <= 0) {
      log.e("itemSize + gap must be positive")
      return false
    }
    this._visibleSlots = Math.ceil(this._viewportMain / this._stride)

    for (let i = 0; i < this._poolItems.length; i++) {
      const di = this._dataIndices[i]
      const size = di >= 0 && di < this._sizes.length && this._sizes[di] > 0 ? this._sizes[di] : this._itemSize
      this.applyItemSizeToSlot(i, size)
    }

    if (axisFlipped) {
      // ScrollWindow rejects writes to disabled axes; enable both for the reset.
      this._scrollWindow.vertical = true
      this._scrollWindow.horizontal = true
      this._scrollWindow.scrollPosition = new vec2(0, 0)
      this._scrollWindow.vertical = this._isVertical
      this._scrollWindow.horizontal = !this._isVertical

      this._lastFirstVisibleDataIndex = -1
      for (let i = 0; i < this._lastAlpha.length; i++) {
        this._lastAlpha[i] = -1
      }
      this._offsetScratch.x = 0
      this._offsetScratch.y = 0
      this._offsetScratch.z = 0
      this._lastAppliedOffset = NaN
      this._lastFadeScroll = NaN
      this._lastClipScroll = NaN
      this.markClipDirty()
      // Drop axis-bound deferred work — measured values are axis-specific.
      this._pendingRemeasure.clear()
      this._pendingRemeasureSwap.clear()
      this._pendingMeasureMinIdx = Number.MAX_SAFE_INTEGER
      this._deferredMeasureAnchor = null
      this._prewarmQueue.length = 0
      this._prewarmHead = 0
      this._prewarmComplete = true
    }

    this.recomputeFadeInvariants()
    return true
  }

  private recomputeFadeInvariants(): void {
    this._fadeHalfViewport = this._viewportMain / 2
    this._fadeContentHalf = this._totalContentSize / 2
    // Clamp to a small positive epsilon — 0 produces 0/0 = NaN at the edge.
    this._fadeZone = Math.max(FADE_ZONE_MIN, this._fadeDistance)
    this._fadeMaxScroll = Math.max(0, (this._totalContentSize - this._viewportMain) / 2)
    this._fadeLastDataIdx = this.totalItems - 1
  }

  private ensureRebindScratch(poolSize: number): void {
    if (this._rebindNewRingOrder.length !== poolSize) {
      this._rebindNewRingOrder.length = poolSize
      this._rebindOrderedItems.length = poolSize
    }
  }

  /** Pop any unused slot regardless of type. Returns `-1` when empty. */
  private takeAnyUnusedSlot(unusedByType: Map<string, number[]>): number {
    for (const list of unusedByType.values()) {
      if (list.length > 0) return list.pop() as number
    }
    return -1
  }

  private fireCreateItem(slot: number, obj: SceneObject, type: string): void {
    if (!this.adapter) return
    this._poolHolders[slot] = this.adapter.onCreateView(obj, type as TType)
  }

  private fireBindItem(slot: number, dataIndex: number): void {
    const slotObj = this._poolObjects[slot]
    try {
      this._bindingDepth++
      const holder = this._poolHolders[slot]
      if (this.adapter && holder !== null) {
        this.adapter.onBindView(slotObj, holder, dataIndex)
      }
      // Mid-callback destroy guard: `cleanup` may have wiped parallel arrays.
      if (!this._initialized) return
      const getKey = this.adapter?.getItemKey
      if (getKey) this._slotKeys[slot] = getKey(dataIndex)
      this.refreshSlotRootComponents(slot)
      this.maybeMeasureSlot(slot, dataIndex)
    } finally {
      this._bindingDepth--
    }
  }

  private fireUnbindItem(slot: number, dataIndex: number): void {
    const slotObj = this._poolObjects[slot]
    const holder = this._poolHolders[slot]
    if (this.adapter?.onUnbindView && holder !== null) {
      this.adapter.onUnbindView(slotObj, holder, dataIndex)
    }
    // Mid-callback destroy guard.
    if (!this._initialized) return
    this._slotKeys[slot] = null
    this._lastUsedTime[slot] = this.getTimeSec()
  }

  /** Seconds since lens start. */
  private getTimeSec(): number {
    return getTime()
  }

  /**
   * Refresh root + subtree caches. Subtree mutations during `onBindView`
   * require `invalidate(range, "structure")`.
   */
  private refreshSlotComponents(slot: number): void {
    this.refreshSlotRootComponents(slot)
    this.refreshSlotSubtreeComponents(slot)
  }

  /**
   * Per-bind refresh of root-only Text/Image caches and their baseline RGB.
   * Picks up components added on the slot root inside `adapter.onBindView`.
   */
  private refreshSlotRootComponents(slot: number): void {
    const obj = this._poolObjects[slot]
    const texts = obj.getComponents("Component.Text")
    const images = obj.getComponents("Component.Image")
    this._poolTexts[slot] = texts
    this._poolImages[slot] = images
    // Reuse existing arrays when length matches to avoid per-rebind allocation.
    let textRGB = this._poolTextRGB[slot]
    if (!textRGB || textRGB.length !== texts.length * 3) {
      textRGB = new Array(texts.length * 3)
      this._poolTextRGB[slot] = textRGB
    }
    let textFills = this._poolTextFills[slot]
    if (!textFills || textFills.length !== texts.length) {
      textFills = new Array(texts.length)
      this._poolTextFills[slot] = textFills
    }
    for (let i = 0; i < texts.length; i++) {
      const fill = texts[i].textFill
      textFills[i] = fill
      const c = fill.color
      textRGB[i * 3] = c.r
      textRGB[i * 3 + 1] = c.g
      textRGB[i * 3 + 2] = c.b
    }
    let imageRGB = this._poolImageRGB[slot]
    if (!imageRGB || imageRGB.length !== images.length * 3) {
      imageRGB = new Array(images.length * 3)
      this._poolImageRGB[slot] = imageRGB
    }
    let imagePasses = this._poolImageMainPasses[slot]
    if (!imagePasses || imagePasses.length !== images.length) {
      imagePasses = new Array(images.length)
      this._poolImageMainPasses[slot] = imagePasses
    }
    for (let i = 0; i < images.length; i++) {
      const pass = images[i].mainPass
      imagePasses[i] = pass
      const c = pass.baseColor
      imageRGB[i * 3] = c.r
      imageRGB[i * 3 + 1] = c.g
      imageRGB[i * 3 + 2] = c.b
    }
  }

  /**
   * Subtree walks for the clippable-element and ColliderComponent caches.
   * `findAllComponentsInSelfOrChildren` calls `getComponentsInDescendants`
   * which is recursive. Walked once per slot at spawn (after `adapter.onCreateView`)
   * and on `invalidate(range, "structure")`; NOT on every bind, since the
   * subtree walk would otherwise dominate the boundary-cross hot path.
   */
  private refreshSlotSubtreeComponents(slot: number): void {
    const obj = this._poolObjects[slot]
    if (!obj || isNull(obj)) return
    const scripts = findAllComponentsInSelfOrChildren(obj, "ScriptComponent")
    const clippables: ClippableElement[] = []
    const transforms: Transform[] = []
    const interactables: Interactable[] = []
    for (let i = 0; i < scripts.length; i++) {
      const sc = scripts[i]
      if (!isClippableElement(sc)) continue
      clippables.push(sc)
      transforms.push(sc.sceneObject.getTransform())
      interactables.push(sc.interactable)
    }
    this._poolClippables[slot] = clippables
    this._poolClippableTransforms[slot] = transforms
    this._poolClippableInteractables[slot] = interactables
    // Fully-qualified name — `getComponentsInDescendants` is namespace-strict.
    this._poolColliders[slot] = findAllComponentsInSelfOrChildren(
      obj,
      COLLIDER_COMPONENT_NAME
    ) as unknown as ColliderComponent[]
    // Newly-walked Elements self-register with IM in their onAwake. Sync to
    // current visibility so off-window slots don't leak into IM's per-frame set.
    this.setSlotIMRegistered(slot, this._slotVisible[slot] ?? false)
  }

  // ─── Private: Scroll Handler ───────────────────────────────────────

  private onScrollPositionUpdated(position: vec2): void {
    if (this._isUpdatingData) return
    if (this._poolObjects.length === 0) return

    const scrollMainAxis = this.getScrollMainAxis(position)
    if (scrollMainAxis !== this._lastScrollMain) this.requestLateUpdate()
    this._lastScrollMain = scrollMainAxis
    const firstVisibleSlot = this.computeFirstVisibleSlot(scrollMainAxis)
    const startIndex = Math.max(0, firstVisibleSlot - this._bufferCount)

    this.updateLayoutOffset(startIndex)

    if (firstVisibleSlot !== this._lastFirstVisibleDataIndex) {
      this.rebindRange(startIndex)
      this._lastFirstVisibleDataIndex = firstVisibleSlot
      // When colliders aren't forced off, batch `forceFlexLayout` +
      // `updateSlotVisibilities` to one LateUpdate pass per frame.
      if (!this._collidersForcedOff) {
        this._scrollLayoutDirty = true
        this.requestLateUpdate()
      }
    }

    this.updateFade(position)
    // Clip pass runs in LateUpdate — `getWorldPosition` here would be stale.
  }

  // ─── Private: Scroll-Drag Deferral ─────────────────────────────────

  private onScrollDragActivity(): void {
    // Edge false→true: first drag tick of a new gesture. Disable child
    // colliders so re-grips during scroll don't pay the SW cancel cascade.
    const dragStart = !this._isUserScrolling
    if (dragStart) {
      this.applyScrollMotionColliderState(true)
      // User took over — drop any queued alignment correction.
      this._pendingAlignTarget = null
    }
    this._isUserScrolling = true
    this._scrollIdleCounter++
    const myCounter = this._scrollIdleCounter
    setTimeout(() => {
      if (myCounter !== this._scrollIdleCounter) return
      this.onScrollIdle()
    }, SCROLL_IDLE_TIMEOUT_MS)
    if (dragStart) this.onScrollDragStartEvent.invoke()
  }

  /** Shared by the timer fallback and the authoritative settle path. */
  private onScrollIdle(): void {
    const wasScrolling = this._isUserScrolling
    this._isUserScrolling = false
    // Refresh the layout deferred during motion so collider state is correct
    // when applyScrollMotionColliderState restores them.
    if (this._collidersForcedOff) {
      this.forceFlexLayout()
      this.updateSlotVisibilities()
      this._scrollLayoutDirty = false
    }
    this.applyScrollMotionColliderState(false)

    // `applyDataChange` owns its own rebindRange — let it absorb the deferral
    // instead of racing `tickDeferredGrowDrain`.
    if (this._poolMetricsDirty) {
      this._poolMetricsDirty = false
      this._scrollDeferredGrowsPending = false
      this.applyDataChange()
    }

    if (this._pendingSnapshot) {
      this._pendingSnapshot = false
      this.applySnapshot()
    }
    if (this._pendingInvalidate) {
      const p = this._pendingInvalidate
      this._pendingInvalidate = null
      this.invalidate(p.whole ? undefined : {start: p.start, end: p.end}, p.fields)
    }

    if (wasScrolling) this.onScrollDragEndEvent.invoke()
  }

  /**
   * Authoritative "drag ended" signal from ScrollWindow. Bypasses the
   * SCROLL_IDLE_TIMEOUT_MS fallback so colliders return immediately.
   */
  private onScrollSettled(): void {
    this._scrollIdleCounter++
    if (this._isUserScrolling) {
      this.onScrollIdle()
    }
  }

  /**
   * Enter or leave "scroll motion" mode for child colliders. While `motion`
   * is true, every slot's descendant colliders are forcibly off — independent
   * of `_slotVisible` — so the interactable graph that ScrollWindow walks on
   * each drag-start has nothing in a non-default state. On exit, restore each
   * slot's collider state to match `_slotVisible` and re-prime the clip pass
   * so the next LateUpdate writes correct band geometry against the now-settled
   * scroll position.
   */
  private applyScrollMotionColliderState(motion: boolean): void {
    if (this._collidersForcedOff === motion) return
    this._collidersForcedOff = motion
    // Hoist the debug-mode lookup — invariant for the loop's duration.
    const debugMode = InteractionManager.getInstance().debugModeEnabled
    for (let s = 0; s < this._poolObjects.length; s++) {
      const desired = motion ? false : this._slotVisible[s]
      this.setSlotCollidersEnabledRaw(s, desired, debugMode)
    }
    if (!motion) {
      this._lastClipScroll = NaN
      this.markClipDirty()
    }
  }

  // ─── Private: Fade ─────────────────────────────────────────────────

  private updateFade(scrollPos: vec2): void {
    const customAlpha = this._itemAlphaHandler !== null
    if (!this._fadeEnabled && !customAlpha) return
    if (this._poolObjects.length === 0) return

    const scrollVal = this.getScrollMainAxis(scrollPos)
    // Magnitude check (not strict equality) so spring-decay sub-pixel deltas
    // don't drag the per-slot loop along.
    if (
      Math.abs(scrollVal - this._lastFadeScroll) < FADE_SCROLL_EPSILON &&
      this._totalContentSize === this._lastFadeContentSize
    ) {
      return
    }
    this._lastFadeScroll = scrollVal
    this._lastFadeContentSize = this._totalContentSize

    const halfViewport = this._fadeHalfViewport
    const contentHalf = this._fadeContentHalf
    const fadeZone = this._fadeZone
    const maxScroll = this._fadeMaxScroll
    const lastDataIdx = this._fadeLastDataIdx
    const isAtStart = scrollVal <= -maxScroll + FADE_EDGE_EPSILON
    const isAtEnd = scrollVal >= maxScroll - FADE_EDGE_EPSILON

    const fadePositiveEdge = halfViewport - fadeZone
    const fadeNegativeEdge = -halfViewport + fadeZone

    for (let i = 0; i < this._poolObjects.length; i++) {
      const dataIdx = this._dataIndices[i]
      if (dataIdx < 0) continue

      const top = this.topOfItem(dataIdx)
      const halfSize = (this._sizes[dataIdx] > 0 ? this._sizes[dataIdx] : this._itemSize) / 2
      const itemCenter = this._isVertical ? contentHalf - top - halfSize : -contentHalf + top + halfSize
      const viewportPos = itemCenter + scrollVal

      let alpha: number
      if ((dataIdx === 0 && isAtStart) || (dataIdx === lastDataIdx && isAtEnd)) {
        alpha = 1.0
      } else if (viewportPos <= fadePositiveEdge && viewportPos >= fadeNegativeEdge) {
        alpha = 1.0
      } else {
        alpha = 1.0
        if (viewportPos > fadePositiveEdge) {
          alpha = Math.min(alpha, (halfViewport - viewportPos) / fadeZone)
        }
        if (viewportPos < fadeNegativeEdge) {
          alpha = Math.min(alpha, (viewportPos + halfViewport) / fadeZone)
        }
        alpha = Math.max(0, Math.min(1, alpha))
      }

      if (Math.abs(alpha - this._lastAlpha[i]) < ALPHA_EPSILON) continue
      this._lastAlpha[i] = alpha

      if (customAlpha && this._itemAlphaHandler !== null) {
        this._itemAlphaHandler(this._poolObjects[i], alpha, dataIdx, this._poolHolders[i])
        // Mid-callback destroy guard.
        if (!this._initialized) return
      } else {
        this.applyBuiltInAlpha(i, alpha)
      }
    }
  }

  private applyBuiltInAlpha(slotIndex: number, alpha: number): void {
    const scratch = this._alphaScratch
    scratch.w = alpha
    const textFills = this._poolTextFills[slotIndex]
    const textRGB = this._poolTextRGB[slotIndex]
    const imagePasses = this._poolImageMainPasses[slotIndex]
    const imageRGB = this._poolImageRGB[slotIndex]
    // Defensive: bail rather than crash if pool-shrink left arrays out of sync.
    if (!textFills || !textRGB || !imagePasses || !imageRGB) return
    for (let i = 0; i < textFills.length; i++) {
      const base = i * 3
      scratch.x = textRGB[base]
      scratch.y = textRGB[base + 1]
      scratch.z = textRGB[base + 2]
      textFills[i].color = scratch
    }
    for (let i = 0; i < imagePasses.length; i++) {
      const base = i * 3
      scratch.x = imageRGB[base]
      scratch.y = imageRGB[base + 1]
      scratch.z = imageRGB[base + 2]
      imagePasses[i].baseColor = scratch
    }
  }

  // ─── Private: Pool Management ──────────────────────────────────────

  private createPoolItem(type: string = VL_DEFAULT_TYPE, prewarm: boolean = false): void {
    if (!this._layout) return

    const obj = global.scene.createSceneObject(`VLItem_${type}_${this._poolObjects.length}`)
    obj.setParent(this._layout.sceneObject)
    obj.layer = this._layout.sceneObject.layer

    const item = obj.createComponent(FlexItem.getTypeName()) as FlexItem
    // Default size at create; rebindRange writes the bound item's real size.
    if (this._isVertical) {
      item.overrideWidth = this._containerCrossSize
      item.overrideHeight = this._itemSize
    } else {
      item.overrideWidth = this._itemSize
      item.overrideHeight = this._containerCrossSize
    }

    // Register the SceneObject in the reverse-lookup map before
    // adapter.onCreateView fires, so dataIndexFor works during the callback.
    this._poolObjects.push(obj)
    this._poolItems.push(item)
    this._dataIndices.push(-1)
    this._lastAlpha.push(-1)
    // Text/Image caches start empty; refreshSlotComponents repopulates them
    // after onCreateView has had a chance to add components.
    this._poolTexts.push([])
    this._poolImages.push([])
    this._poolTextFills.push([])
    this._poolImageMainPasses.push([])
    this._poolTextRGB.push([])
    this._poolImageRGB.push([])
    this._poolClippables.push([])
    this._poolClippableTransforms.push([])
    this._poolClippableInteractables.push([])
    this._poolColliders.push([])
    this._poolHolders.push(null)
    this._slotKeys.push(null)
    this._slotTypes.push(type)
    // Spawn-time timestamp (not `-1`) so never-bound slots become eligible
    // for shrink GC after `shrinkDelayMs`. Prewarmed slots get a one-window
    // grace period so they survive at least one idle period.
    const spawnTime = this.getTimeSec()
    this._lastUsedTime.push(prewarm && this._shrinkDelayMs > 0 ? spawnTime + this._shrinkDelayMs / 1000 : spawnTime)
    this._slotVisible.push(false)
    const newSlotIndex = this._poolObjects.length - 1
    this._slotBySceneObject.set(obj, newSlotIndex)

    this.fireCreateItem(newSlotIndex, obj, type)

    this.refreshSlotComponents(newSlotIndex)
    this.setSlotCollidersEnabled(newSlotIndex, false)
  }

  private resizePool(): void {
    if (!this._layout) return

    const calculatedSize = this._visibleSlots + 2 * this._bufferCount
    // Clamp to 0 — `Array.splice(neg)` removes from the end, not truncates.
    const targetSize = Math.max(
      0,
      this._poolSizeOverride !== null
        ? Math.min(this._poolSizeOverride, this.totalItems)
        : Math.min(calculatedSize, this.totalItems)
    )
    const currentSize = this._poolObjects.length

    if (targetSize > currentSize) {
      const newItems: FlexItem[] = []
      for (let i = currentSize; i < targetSize; i++) {
        this.createPoolItem()
        newItems.push(this._poolItems[i])
      }
      this._layout.addItems(newItems)
      this.ensureRebindScratch(targetSize)
    } else if (targetSize < currentSize) {
      for (let i = targetSize; i < currentSize; i++) {
        const oldIdx = this._dataIndices[i]
        if (oldIdx >= 0) {
          this._dataIndices[i] = -1
          this.fireUnbindItem(i, oldIdx)
        }
      }

      const removedItems = this._poolItems.splice(targetSize)
      const removedObjects = this._poolObjects.splice(targetSize)
      this._dataIndices.splice(targetSize)
      this._lastAlpha.splice(targetSize)
      this._poolTexts.splice(targetSize)
      this._poolImages.splice(targetSize)
      this._poolTextFills.splice(targetSize)
      this._poolImageMainPasses.splice(targetSize)
      this._poolTextRGB.splice(targetSize)
      this._poolImageRGB.splice(targetSize)
      this._poolClippables.splice(targetSize)
      this._poolClippableTransforms.splice(targetSize)
      this._poolClippableInteractables.splice(targetSize)
      this._poolColliders.splice(targetSize)
      this._poolHolders.splice(targetSize)
      this._slotKeys.splice(targetSize)
      this._slotTypes.splice(targetSize)
      this._lastUsedTime.splice(targetSize)
      this._slotVisible.splice(targetSize)
      // In-place compact: drop ring entries referring to removed slots.
      let writeIdx = 0
      for (let readIdx = 0; readIdx < this._ringOrder.length; readIdx++) {
        const s = this._ringOrder[readIdx]
        if (s < targetSize) {
          this._ringOrder[writeIdx++] = s
        }
      }
      this._ringOrder.length = writeIdx

      this._layout.removeItems(removedItems)
      for (const obj of removedObjects) {
        this._slotBySceneObject.delete(obj)
        if (obj && !isNull(obj)) {
          obj.destroy()
        }
      }
      this.ensureRebindScratch(targetSize)
    }
    // Pool changed shape — slot indices the clip pass iterates have shifted.
    this._lastClipScroll = NaN
    this.markClipDirty()
  }

  /**
   * Ring-buffer rebind. Ring position `k` must show `startIndex + k` (or -1
   * past data end). In-window slots stay bound and shift ring position;
   * out-of-window slots recycle. Pool may exceed ring; spares park in
   * `unusedByType`.
   */
  private rebindRange(startIndex: number): void {
    const poolSize = this._poolObjects.length
    if (poolSize === 0) return
    const ringSize = this.computeRingSize()
    if (ringSize === 0) return
    this.ensureRebindScratch(poolSize)

    const inWindow = this._rebindInWindow
    inWindow.clear()
    this._rebindBoundThisPass.clear()
    // Return last call's per-type arrays to the pool. Truncate before reuse
    // since a partial bail could leave entries behind.
    const unusedByType = this._rebindUnusedByType
    const listPool = this._unusedListPool
    if (unusedByType.size > 0) {
      for (const list of unusedByType.values()) {
        list.length = 0
        listPool.push(list)
      }
      unusedByType.clear()
    }
    for (let s = 0; s < poolSize; s++) {
      const di = this._dataIndices[s]
      const t = this._slotTypes[s] ?? VL_DEFAULT_TYPE
      // A type-mismatched slot can't keep its row even if the row is still in
      // window (the holder was built for the old type) — recycle it instead.
      const inRange = di >= 0 && di >= startIndex && di < startIndex + ringSize && di < this.totalItems
      if (inRange && t === (this._dataTypes[di] ?? VL_DEFAULT_TYPE)) {
        inWindow.set(di, s)
      } else {
        let list = unusedByType.get(t)
        if (!list) {
          list = listPool.length > 0 ? (listPool.pop() as number[]) : []
          unusedByType.set(t, list)
        }
        list.push(s)
      }
    }

    // Defer measure-on-bind side-effects across the loop so back-to-back
    // binds don't ripple rebuildCumulativesFrom / setScrollDimensions per slot.
    const newRingOrder = this._rebindNewRingOrder
    const grownItems = this._rebindGrownItems
    grownItems.length = 0
    let anyChanged = false
    const prevDefer = this._deferMeasureSideEffects
    this._deferMeasureSideEffects = true

    // Pool growth caps. Active scroll: 1/call so a fling pays at most one
    // createPoolItem per boundary. Drain: DRAIN_GROWS_PER_FRAME. Other paths
    // (initial fill, applyDataChange): full ringSize.
    const growBudget = this._isUserScrolling ? 1 : this._drainingDeferredGrows ? DRAIN_GROWS_PER_FRAME : ringSize
    let growsUsed = 0
    let growsDeferred = false

    for (let k = 0; k < ringSize; k++) {
      const target = startIndex + k
      const targetValid = target < this.totalItems

      if (targetValid) {
        const existing = inWindow.get(target)
        if (existing !== undefined) {
          newRingOrder[k] = existing
          continue
        }
      }

      // Need to recycle (or, for valid targets, possibly grow on type-miss).
      let slot: number = -1
      let useAsPastEnd = !targetValid
      if (targetValid) {
        const targetType = this._dataTypes[target] ?? VL_DEFAULT_TYPE
        const matching = unusedByType.get(targetType)
        if (matching && matching.length > 0) {
          slot = matching.pop() as number
        } else if (growsUsed < growBudget) {
          // Dynamic grow-on-miss: no unused slot of `targetType`. Create one
          // and let it claim this ring position. The new slot is added to
          // FlexLayout's items array after the loop. Pool grows but the ring
          // stays at `ringSize` — extras live as off-ring spares.
          this.consumePendingPrewarmForType(targetType)
          this.maybeWarnGrowOnMiss(targetType)
          this.createPoolItem(targetType)
          slot = this._poolObjects.length - 1
          grownItems.push(this._poolItems[slot])
          this.ensureRebindScratch(this._poolObjects.length)
          growsUsed++
        } else {
          // Grow budget exhausted — fall through to past-end disable.
          // `_scrollDeferredGrowsPending` re-runs rebindRange on idle.
          useAsPastEnd = true
          growsDeferred = true
        }
      }
      if (slot < 0) {
        slot = this.takeAnyUnusedSlot(unusedByType)
        if (slot < 0) {
          // Pool starved below ringSize: every existing slot is committed to a
          // distinct ring position, so a create is the only valid+unique source.
          const growType = useAsPastEnd ? VL_DEFAULT_TYPE : (this._dataTypes[target] ?? VL_DEFAULT_TYPE)
          this.createPoolItem(growType)
          slot = this._poolObjects.length - 1
          grownItems.push(this._poolItems[slot])
          this.ensureRebindScratch(this._poolObjects.length)
          // Starved creates are mandatory and not budget-capped (a full ring
          // needs `ringSize` unique slots); count them so the type-miss path can't pile on.
          growsUsed++
        }
      }
      newRingOrder[k] = slot
      const oldIdx = this._dataIndices[slot]

      // Write `_dataIndices[slot]` before the callback so synchronous
      // re-entries see consistent state.
      if (!useAsPastEnd) {
        if (oldIdx >= 0) {
          this._dataIndices[slot] = -1
          this.fireUnbindItem(slot, oldIdx)
          if (!this._initialized) return
        }
        this._poolObjects[slot].enabled = true
        this._dataIndices[slot] = target
        this.applyItemSizeToSlot(slot, this._sizes[target] > 0 ? this._sizes[target] : this._itemSize)
        this.fireBindItem(slot, target)
        // Mid-callback destroy guard.
        if (!this._initialized) return
        this._rebindBoundThisPass.add(slot)
        this._lastAlpha[slot] = -1
        anyChanged = true
      } else {
        // Past end of data — disable so a never-bound slot doesn't render.
        // Only flip `anyChanged` when the slot was actually bound.
        this._dataIndices[slot] = -1
        if (oldIdx >= 0) {
          this.fireUnbindItem(slot, oldIdx)
          if (!this._initialized) return
          anyChanged = true
        }
        this._poolObjects[slot].enabled = false
        this._lastAlpha[slot] = -1
      }
    }

    this._deferMeasureSideEffects = prevDefer
    if (!prevDefer) {
      this.flushDeferredMeasures()
    }

    // Slots still in `unusedByType` with a non-negative dataIndex were bound
    // to rows that left the ring window — unbind so fade/clip walks treat
    // them as spares.
    for (const list of unusedByType.values()) {
      for (let i = 0; i < list.length; i++) {
        const s = list[i]
        const oldIdx = this._dataIndices[s]
        if (oldIdx < 0) continue
        this._dataIndices[s] = -1
        this.fireUnbindItem(s, oldIdx)
        if (!this._initialized) return
        this._poolObjects[s].enabled = false
        this._lastAlpha[s] = -1
        anyChanged = true
      }
    }

    if (grownItems.length > 0 && this._layout) {
      this._layout.addItems(grownItems)
    }

    // Reorder FlexLayout: ring slots first in ring order, spares trailing.
    // Spares are SceneObject-disabled so trailing position doesn't render.
    let ringChanged = false
    const orderedItems = this._rebindOrderedItems
    for (let k = 0; k < ringSize; k++) {
      const slot = newRingOrder[k]
      if (this._ringOrder[k] !== slot) ringChanged = true
      orderedItems[k] = this._poolItems[slot]
    }
    // Append spares so `reorderItems` covers FlexLayout's full items list.
    const poolSizeNow = this._poolObjects.length
    if (poolSizeNow > ringSize) {
      let outIdx = ringSize
      for (let s = 0; s < poolSizeNow; s++) {
        let isInRing = false
        for (let k = 0; k < ringSize; k++) {
          if (newRingOrder[k] === s) {
            isInRing = true
            break
          }
        }
        if (!isInRing) {
          orderedItems[outIdx++] = this._poolItems[s]
        }
      }
      orderedItems.length = outIdx
    } else {
      orderedItems.length = ringSize
    }
    if (ringChanged) {
      for (let k = 0; k < ringSize; k++) {
        this._ringOrder[k] = newRingOrder[k]
      }
      this._ringOrder.length = ringSize
      if (this._layout) this._layout.reorderItems(orderedItems)
    }

    if (anyChanged) {
      this._lastFadeScroll = NaN
      this._lastClipScroll = NaN
      this.markClipDirty()
    }
    if (growsDeferred) {
      this._scrollDeferredGrowsPending = true
    }
  }

  // ─── Private: Data Change ──────────────────────────────────────────

  private applyDataChange(): void {
    if (!this._layout || !this._scrollWindow) return

    this._isUpdatingData = true
    // Full rebuild wants the full grow budget — defends against a re-entry
    // inheriting `_drainingDeferredGrows`.
    this._drainingDeferredGrows = false
    this._keyToIndex = null
    // A count/config change shifts what each index means — drop a stale
    // alignment correction.
    this._pendingAlignTarget = null
    this.rearmEdgeReached()

    const oldContentSize = this._totalContentSize

    this.rebuildSizes()
    this._totalContentSize = this.computeTotalContentSize(this.totalItems)
    this.recomputeFadeInvariants()

    const {scrollSize, topEdge, bottomEdge} = this.getScrollBounds()
    this.setScrollDimensions(scrollSize)

    const heightDelta = this._totalContentSize - oldContentSize
    const currentScroll = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
    // Sign inverts between axes: vertical grows toward -y, horizontal toward +x.
    const adjustedScroll = this._isVertical ? currentScroll - heightDelta / 2 : currentScroll + heightDelta / 2
    const clampedScroll = Math.max(topEdge, Math.min(adjustedScroll, bottomEdge))
    if (clampedScroll !== currentScroll) {
      this.setScrollPosition(clampedScroll)
    }

    this.resizePool()

    if (this._poolObjects.length > 0) {
      const scroll = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
      const firstVisibleSlot = this.computeFirstVisibleSlot(scroll)
      this._lastFirstVisibleDataIndex = firstVisibleSlot
      const startIndex = Math.max(0, firstVisibleSlot - this._bufferCount)

      this.rebindRange(startIndex)
      this.updateLayoutOffset(startIndex)
      this.forceFlexLayout()
      this.updateSlotVisibilities()
      this.updateFade(this._scrollWindow.scrollPosition)
    }

    this._isUpdatingData = false

    // Drain re-entries from binders that mutate totalItems. Capped to
    // prevent infinite loops.
    let drainBudget = MAX_DATA_CHANGE_REDRAIN
    while (this._poolMetricsDirty && !this._isUserScrolling && drainBudget-- > 0) {
      this._poolMetricsDirty = false
      this.applyDataChange()
    }
    if (this._poolMetricsDirty && !this._isUserScrolling) {
      log.e("applyDataChange: drain budget exhausted; adapter.onBindView keeps mutating totalItems")
    }

    if (this._pendingInvalidate !== null && this._bindingDepth === 0 && !this._isUserScrolling) {
      const p = this._pendingInvalidate
      this._pendingInvalidate = null
      this.invalidate(p.whole ? undefined : {start: p.start, end: p.end}, p.fields)
    }
  }

  // ─── Private: Helpers ──────────────────────────────────────────────

  private getScrollMainAxis(pos: vec2): number {
    return this._isVertical ? pos.y : pos.x
  }

  private setScrollDimensions(mainAxisSize: number): void {
    if (!this._scrollWindow) return
    // Cross axis pinned to viewport — inactive axis can't scroll.
    if (this._isVertical) {
      this._scrollWindow.scrollDimensions = new vec2(this._viewportSize.x, mainAxisSize)
    } else {
      this._scrollWindow.scrollDimensions = new vec2(mainAxisSize, this._viewportSize.y)
    }
  }

  private setScrollPosition(mainAxisValue: number): void {
    if (!this._scrollWindow) return
    // Scratch reuse relies on ScrollWindow's setter copying components
    // synchronously and not retaining the vec2.
    const scratch = this._scrollPosScratch
    if (this._isVertical) {
      scratch.x = 0
      scratch.y = mainAxisValue
    } else {
      scratch.x = mainAxisValue
      scratch.y = 0
    }
    this._scrollWindow.scrollPosition = scratch
    // Mirror directly — the init's first synthetic write happens BEFORE we
    // subscribe to `onScrollPositionUpdated`.
    if (mainAxisValue !== this._lastScrollMain) this.requestLateUpdate()
    this._lastScrollMain = mainAxisValue
  }

  /**
   * Scroll-content bounds in FlexLayout local space. `scrollSize` is clamped
   * to at least `_viewportMain` so edges stay ordered. Returns an internal
   * scratch — read fields before the next call.
   */
  private getScrollBounds(): {scrollSize: number; topEdge: number; bottomEdge: number} {
    const scrollSize = Math.max(this._totalContentSize, this._viewportMain)
    const half = this._viewportMain / 2
    const bounds = this._scrollBoundsScratch
    bounds.scrollSize = scrollSize
    bounds.topEdge = -scrollSize / 2 + half
    bounds.bottomEdge = scrollSize / 2 - half
    return bounds
  }

  /**
   * Largest item index whose top edge is at or before `scrollMainAxis`. Inside
   * the resolved prefix the lookup is a binary search over `_cumulativeSizes`;
   * past the prefix the unresolved tail uses default-stride extrapolation.
   */
  private computeFirstVisibleSlot(scrollMainAxis: number): number {
    if (this._stride <= 0 || this._totalItems === 0) return 0
    const {topEdge, bottomEdge} = this.getScrollBounds()
    const distFromStart = this._isVertical ? scrollMainAxis - topEdge : bottomEdge - scrollMainAxis

    let raw = 0
    if (distFromStart > 0) {
      const stride = this._itemSize + this._gap
      if (this._isHomogeneous || this._resolvedPrefixEnd < 0) {
        // Homogeneous (or entirely-unresolved) — pure stride math; no array reads.
        raw = Math.floor(distFromStart / stride)
      } else {
        // Top of item (resolvedPrefixEnd + 1) is the boundary between the
        // resolved prefix and the default-stride extrapolation region.
        const prefixTailTop = this._cumulativeSizes[this._resolvedPrefixEnd] + this._gap
        if (distFromStart >= prefixTailTop) {
          const remainder = distFromStart - prefixTailTop
          raw = this._resolvedPrefixEnd + 1 + Math.floor(remainder / stride)
        } else {
          // Binary search inside the resolved prefix.
          let lo = 0
          let hi = this._resolvedPrefixEnd
          while (lo < hi) {
            const mid = (lo + hi + 1) >>> 1
            if (this.topOfItem(mid) <= distFromStart) lo = mid
            else hi = mid - 1
          }
          raw = lo
        }
      }
    }
    return Math.max(0, Math.min(raw, this.computeMaxFirstVisibleIndex()))
  }

  /**
   * Largest valid value for the first-visible data index. Uses
   * `_cumulativeSizes` when the prefix covers the end of the list; falls
   * back to default-stride approximation otherwise.
   */
  private computeMaxFirstVisibleIndex(): number {
    if (this._totalItems === 0) return 0
    if (this._totalContentSize <= this._viewportMain) return 0
    if (this._isHomogeneous) {
      return Math.max(0, this._totalItems - this._visibleSlots)
    }
    if (this._resolvedPrefixEnd >= this._totalItems - 1) {
      // Walk backward summing sizes — linear in visible-window count.
      // Defensive: bound by array length in case a mid-mutation caller hits
      // an entry past the resolved prefix.
      const target = this._totalContentSize - this._viewportMain
      let i = Math.min(this._totalItems - 1, this._cumulativeSizes.length - 1)
      while (i > 0 && this._cumulativeSizes[i - 1] + this._gap > target) {
        i--
      }
      return i
    }
    return Math.max(0, this._totalItems - this._visibleSlots)
  }

  private updateLayoutOffset(startIndex: number): void {
    if (!this._layout) return
    const top = this.topOfItem(startIndex)
    // FlexLayout packs Column+Top toward -y and Row+Left toward +x.
    const offset = this._isVertical ? this._totalContentSize / 2 - top : -this._totalContentSize / 2 + top
    if (Math.abs(this._lastAppliedOffset - offset) < OFFSET_WRITE_EPSILON) return
    this._lastAppliedOffset = offset
    if (this._isVertical) {
      this._offsetScratch.y = offset
    } else {
      this._offsetScratch.x = offset
    }
    if (!this._layoutTransform) return
    this._layoutTransform.setLocalPosition(this._offsetScratch)
  }

  private computeTotalContentSize(totalSlots: number): number {
    if (totalSlots <= 0) return 0
    if (this._isHomogeneous) {
      return totalSlots * this._itemSize + Math.max(0, totalSlots - 1) * this._gap
    }
    if (this._resolvedPrefixEnd >= totalSlots - 1) {
      return this._cumulativeSizes[totalSlots - 1]
    }
    // Resolved prefix + default-stride estimate for the unresolved tail.
    const stride = this._itemSize + this._gap
    if (this._resolvedPrefixEnd < 0) {
      return totalSlots * this._itemSize + Math.max(0, totalSlots - 1) * this._gap
    }
    const base = this._cumulativeSizes[this._resolvedPrefixEnd]
    const unresolvedCount = totalSlots - 1 - this._resolvedPrefixEnd
    return base + unresolvedCount * stride
  }

  /**
   * Resolve a single index's size. Returns a positive number, `undefined`
   * (signals measure-on-bind), or `null` (use `_itemSize` fallback).
   */
  private resolveItemSizeRaw(dataIndex: number): number | undefined | null {
    if (!this.adapter?.getItemSize) return null
    const r = this.adapter.getItemSize(dataIndex)
    if (r === undefined) return undefined
    if (typeof r === "number" && r > 0) return r
    return null
  }

  /** Returns a usable size — treats `undefined`/`null` as `_itemSize`. */
  private resolveItemSize(dataIndex: number): number {
    const r = this.resolveItemSizeRaw(dataIndex)
    return typeof r === "number" ? r : this._itemSize
  }

  /**
   * Map `resolveItemSizeRaw` into the `_sizes` cell: `undefined` → `-1`
   * sentinel, number → number, `null` → `_itemSize`.
   */
  private coerceSize(raw: number | undefined | null): number {
    if (raw === undefined) return -1
    return typeof raw === "number" ? raw : this._itemSize
  }

  /**
   * Capture `(firstVisibleDataIndex, intraItemFraction)` so a subsequent size
   * change can restore the same visible content position via `restoreAnchor`.
   */
  private captureAnchor(): {idx: number; frac: number} | null {
    if (!this._scrollWindow) return null
    if (this._poolObjects.length === 0 || this._totalItems === 0) return null
    // Use the live scroll position — `_lastFirstVisibleDataIndex` only
    // refreshes on boundary crossings.
    const scrollVal = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
    const {topEdge, bottomEdge} = this.getScrollBounds()
    const distFromStart = this._isVertical ? scrollVal - topEdge : bottomEdge - scrollVal
    const firstVisible = this.computeFirstVisibleSlot(scrollVal)
    const idx = Math.max(0, Math.min(firstVisible, this._totalItems - 1))
    const topOf = this.topOfItem(idx)
    const sizeRaw = this._sizes[idx]
    const size = sizeRaw > 0 ? sizeRaw : this._itemSize
    let frac = (distFromStart - topOf) / size
    if (frac < INTRA_ITEM_EPSILON) frac = 0
    if (frac > 1 - INTRA_ITEM_EPSILON) frac = 1
    frac = Math.max(0, Math.min(1, frac))
    return {idx, frac}
  }

  /**
   * Write a scrollPosition that places the anchor at the same viewport
   * offset against the mutated content. Cancels any in-flight tween.
   */
  private restoreAnchor(anchor: {idx: number; frac: number} | null): void {
    if (!anchor || !this._scrollWindow) return
    const idx = Math.max(0, Math.min(anchor.idx, Math.max(0, this._totalItems - 1)))
    const sizeRaw = this._sizes[idx]
    const size = sizeRaw > 0 ? sizeRaw : this._itemSize
    const targetDist = this.topOfItem(idx) + anchor.frac * size
    const {topEdge, bottomEdge} = this.getScrollBounds()
    let newScrollVal = this._isVertical ? topEdge + targetDist : bottomEdge - targetDist
    newScrollVal = Math.max(topEdge, Math.min(newScrollVal, bottomEdge))
    this.setScrollPosition(newScrollVal)
  }

  private clampedInitialIndex(): number {
    if (this._totalItems <= 0) return 0
    return Math.max(0, Math.min(this._initialIndex, this._totalItems - 1))
  }

  /**
   * Number of data positions the ring covers (visible window + buffer,
   * clamped to `totalItems`). Pool may exceed this via grow-on-miss spares.
   */
  private computeRingSize(): number {
    const calculated = this._visibleSlots + 2 * this._bufferCount
    const cap =
      this._poolSizeOverride !== null
        ? Math.min(this._poolSizeOverride, this._totalItems)
        : Math.min(calculated, this._totalItems)
    return Math.max(0, cap)
  }

  private resolveItemType(dataIndex: number): string {
    if (this.adapter?.getItemType) {
      const t = this.adapter.getItemType(dataIndex)
      if (typeof t === "string" && t.length > 0) return t
    }
    return VL_DEFAULT_TYPE
  }

  /**
   * Rebuild `_sizes` and `_cumulativeSizes` for the full data range.
   * Homogeneous adapters skip the parallel arrays — readers short-circuit
   * via `_isHomogeneous`.
   */
  private rebuildSizes(): void {
    const n = this._totalItems
    const hasGetSize = this.adapter?.getItemSize !== undefined
    const hasGetType = this.adapter?.getItemType !== undefined
    this._isHomogeneous = !hasGetSize && !hasGetType
    // Reset live-type structures; partial mutators maintain them incrementally.
    this._liveDataTypesCache = null
    this._typeCounts = null

    if (this._isHomogeneous) {
      this._sizes.length = 0
      this._cumulativeSizes.length = 0
      this._dataTypes.length = 0
      this._needsMeasure.length = 0
      this._resolvedPrefixEnd = -1
      return
    }

    this._sizes.length = n
    this._cumulativeSizes.length = n
    this._dataTypes.length = n
    this._needsMeasure.length = n
    this._resolvedPrefixEnd = -1
    if (n === 0) {
      this._typeCounts = new Map<string, number>()
      this._liveDataTypesCache = new Set<string>()
      return
    }

    const typeCounts = new Map<string, number>()
    const liveTypes = new Set<string>()
    let cum = 0
    let prefixIntact = true
    for (let i = 0; i < n; i++) {
      const raw = this.resolveItemSizeRaw(i)
      const t = this.resolveItemType(i)
      this._dataTypes[i] = t
      const c = (typeCounts.get(t) ?? 0) + 1
      typeCounts.set(t, c)
      if (c === 1) liveTypes.add(t)
      if (raw === undefined) {
        // Defer to measure-on-bind. Sentinel breaks the prefix.
        this._sizes[i] = -1
        this._needsMeasure[i] = true
        prefixIntact = false
      } else {
        const size = typeof raw === "number" ? raw : this._itemSize
        this._sizes[i] = size
        this._needsMeasure[i] = false
        if (prefixIntact) {
          if (i > 0) cum += this._gap
          cum += size
          this._cumulativeSizes[i] = cum
          this._resolvedPrefixEnd = i
        }
      }
    }
    this._typeCounts = typeCounts
    this._liveDataTypesCache = liveTypes
  }

  /**
   * Single-index type write with reference-counted maintenance of
   * `_typeCounts` / `_liveDataTypesCache`. Use everywhere a partial
   * mutator writes `_dataTypes[i]` so the live-type set stays accurate
   * without paying for an O(_totalItems) rebuild from a coarse nuke.
   * No-op when the maps haven't been initialized (pre-`rebuildSizes`).
   */
  private setTypeAtIndex(i: number, newType: string): void {
    const oldType = this._dataTypes[i]
    this._dataTypes[i] = newType
    if (oldType === newType) return
    const counts = this._typeCounts
    const live = this._liveDataTypesCache
    if (counts === null || live === null) return
    if (oldType !== undefined) {
      const c = (counts.get(oldType) ?? 0) - 1
      if (c <= 0) {
        counts.delete(oldType)
        live.delete(oldType)
      } else {
        counts.set(oldType, c)
      }
    }
    const c = (counts.get(newType) ?? 0) + 1
    counts.set(newType, c)
    if (c === 1) live.add(newType)
  }

  /**
   * Partial rebuild of `_cumulativeSizes` from `fromIndex`. Extends through
   * contiguous resolved sizes; stops at the first `-1` sentinel. No-op when
   * there's an unresolved gap before `fromIndex`.
   */
  private rebuildCumulativesFrom(fromIndex: number): void {
    const n = this._totalItems
    if (fromIndex < 0) fromIndex = 0
    if (fromIndex >= n) return
    if (fromIndex > 0 && fromIndex - 1 > this._resolvedPrefixEnd) {
      // Gap before us — wait for earlier items to resolve.
      return
    }
    if (this._resolvedPrefixEnd >= fromIndex) {
      this._resolvedPrefixEnd = fromIndex - 1
    }
    let cum = fromIndex === 0 ? 0 : this._cumulativeSizes[fromIndex - 1]
    for (let i = fromIndex; i < n; i++) {
      if (this._sizes[i] < 0) break
      if (i > 0) cum += this._gap
      cum += this._sizes[i]
      this._cumulativeSizes[i] = cum
      this._resolvedPrefixEnd = i
    }
  }

  /**
   * Top-edge offset for the given data index. Inside the resolved prefix:
   * `_cumulativeSizes[i-1] + gap`. Past the prefix: default-stride extrapolation.
   */
  private topOfItem(dataIndex: number): number {
    if (dataIndex <= 0) return 0
    if (this._isHomogeneous) {
      return dataIndex * (this._itemSize + this._gap)
    }
    if (dataIndex - 1 <= this._resolvedPrefixEnd) {
      return this._cumulativeSizes[dataIndex - 1] + this._gap
    }
    const stride = this._itemSize + this._gap
    if (this._resolvedPrefixEnd < 0) {
      return dataIndex * stride
    }
    const baseCum = this._cumulativeSizes[this._resolvedPrefixEnd]
    const unresolvedCount = dataIndex - 1 - this._resolvedPrefixEnd
    return baseCum + this._gap + unresolvedCount * stride
  }

  /**
   * LateUpdate drain. Runs `forceFlexLayout` once so queued slots read
   * post-reflow transforms, then re-measures each.
   */
  private drainPendingRemeasure(): void {
    if (!this._initialized || this._pendingRemeasure.size === 0) return
    this.forceFlexLayout()
    // Swap so re-adds during measurement settle into the next frame's queue.
    const pending = this._pendingRemeasure
    this._pendingRemeasure = this._pendingRemeasureSwap
    this._pendingRemeasureSwap = pending
    for (let s = 0; s < this._dataIndices.length; s++) {
      const di = this._dataIndices[s]
      if (di < 0 || di >= this._totalItems) continue
      if (pending.has(di)) {
        this.maybeMeasureSlot(s, di)
      }
    }
    pending.clear()
  }

  /**
   * Priority-ordered prewarm: bucket types by first-occurrence — visible,
   * buffer, long-tail. Visible+buffer drain synchronously; long-tail yields
   * across frames when `prewarmBudgetMs > 0`.
   */
  private prewarmTypePools(): void {
    if (this._minSlotsPerType <= 0 || this._totalItems === 0 || !this._layout) {
      this._prewarmComplete = true
      return
    }

    if (this.adapter?.getItemType === undefined) {
      this._prewarmComplete = true
      return
    }

    // Cap discovery at the first `visibleSlots * 4` rows; long-tail types
    // past this point are discovered lazily via grow-on-miss.
    const firstOccurrence = new Map<string, number>()
    const discoveryLimit = Math.min(this._totalItems, Math.max(this._visibleSlots * 4, this._visibleSlots + 1))
    for (let i = 0; i < discoveryLimit; i++) {
      const t = this._dataTypes[i] ?? VL_DEFAULT_TYPE
      if (!firstOccurrence.has(t)) firstOccurrence.set(t, i)
    }

    const typeCounts = new Map<string, number>()
    for (let s = 0; s < this._slotTypes.length; s++) {
      const t = this._slotTypes[s] ?? VL_DEFAULT_TYPE
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
    }

    const firstVisible = this._lastFirstVisibleDataIndex >= 0 ? this._lastFirstVisibleDataIndex : 0
    const lastVisible = Math.min(firstVisible + this._visibleSlots - 1, this._totalItems - 1)
    const bufStart = Math.max(0, firstVisible - this._bufferCount)
    const bufEnd = Math.min(this._totalItems - 1, lastVisible + this._bufferCount)

    const visibleBucket: string[] = []
    const bufferBucket: string[] = []
    const longTailBucket: string[] = []
    for (const [t, idx] of firstOccurrence) {
      const need = this._minSlotsPerType - (typeCounts.get(t) ?? 0)
      if (need <= 0) continue
      const bucket =
        idx >= firstVisible && idx <= lastVisible
          ? visibleBucket
          : idx >= bufStart && idx <= bufEnd
            ? bufferBucket
            : longTailBucket
      for (let n = 0; n < need; n++) bucket.push(t)
    }

    const syncQueue = visibleBucket.concat(bufferBucket)
    this.drainPrewarmTypes(syncQueue)

    if (longTailBucket.length === 0 || this._prewarmBudgetMs <= 0) {
      this.drainPrewarmTypes(longTailBucket)
      this._prewarmComplete = true
      this._prewarmQueue.length = 0
      this._prewarmHead = 0
    } else {
      this._prewarmQueue = longTailBucket
      this._prewarmHead = 0
      this._prewarmComplete = false
    }
  }

  /** Allocate pool slots for each type, register with FlexLayout, resize scratch. */
  private drainPrewarmTypes(types: string[]): void {
    if (types.length === 0 || !this._layout) return
    const newItems: FlexItem[] = []
    for (const t of types) {
      this.createPoolItem(t, true)
      const slot = this._poolObjects.length - 1
      newItems.push(this._poolItems[slot])
      // Off-ring spare — disable until the recycle path picks it up.
      this._poolObjects[slot].enabled = false
    }
    this._layout.addItems(newItems)
    this.ensureRebindScratch(this._poolObjects.length)
  }

  /**
   * UpdateEvent tick: drain `_prewarmQueue` for up to `_prewarmBudgetMs`
   * per frame. Marks `_prewarmComplete` when empty.
   */
  private tickPrewarmQueue(): void {
    if (this._prewarmComplete || this._prewarmHead >= this._prewarmQueue.length || !this._layout) return
    // Hold off during active scroll — `createPoolItem` is heavy and steals
    // time from the input thread.
    if (this._isUserScrolling) return
    const budgetSec = this._prewarmBudgetMs / 1000
    const start = this.getTimeSec()
    const newItems: FlexItem[] = []
    // Sample the timer every N iterations so the budget probe doesn't
    // dominate at small budgets.
    const BUDGET_CHECK_STRIDE = 4
    let sinceBudgetCheck = 0
    while (this._prewarmHead < this._prewarmQueue.length) {
      const t = this._prewarmQueue[this._prewarmHead++]
      this.createPoolItem(t, true)
      const slot = this._poolObjects.length - 1
      // Off-ring spare — disable until rebindRange recycles it (matches drainPrewarmTypes).
      this._poolObjects[slot].enabled = false
      newItems.push(this._poolItems[slot])
      if (++sinceBudgetCheck >= BUDGET_CHECK_STRIDE) {
        sinceBudgetCheck = 0
        if (this.getTimeSec() - start >= budgetSec) break
      }
    }
    if (newItems.length > 0) {
      this._layout.addItems(newItems)
      this.ensureRebindScratch(this._poolObjects.length)
    }
    if (this._prewarmHead >= this._prewarmQueue.length) {
      this._prewarmComplete = true
      this._prewarmQueue.length = 0
      this._prewarmHead = 0
    }
  }

  /**
   * Drain `_scrollDeferredGrowsPending` at `DRAIN_GROWS_PER_FRAME` per tick.
   * Paused during scroll and during `applyDataChange`.
   */
  private tickDeferredGrowDrain(): void {
    if (!this._scrollDeferredGrowsPending) return
    if (this._isUserScrolling) return
    if (this._isUpdatingData) return
    if (this._lastFirstVisibleDataIndex < 0) {
      this._scrollDeferredGrowsPending = false
      return
    }
    this._scrollDeferredGrowsPending = false
    this._drainingDeferredGrows = true
    try {
      const startIndex = Math.max(0, this._lastFirstVisibleDataIndex - this._bufferCount)
      this.rebindRange(startIndex)
    } finally {
      // Reset even when `rebindRange` early-returned via `!_initialized`.
      this._drainingDeferredGrows = false
    }
  }

  /**
   * Drop one pending prewarm entry for `type` so a synchronous grow-on-miss
   * doesn't race into double-allocating. Operates on the un-drained tail.
   */
  private consumePendingPrewarmForType(type: string): void {
    if (this._prewarmComplete) return
    for (let i = this._prewarmHead; i < this._prewarmQueue.length; i++) {
      if (this._prewarmQueue[i] === type) {
        this._prewarmQueue.splice(i, 1)
        if (this._prewarmHead >= this._prewarmQueue.length) {
          this._prewarmComplete = true
          this._prewarmQueue.length = 0
          this._prewarmHead = 0
        }
        return
      }
    }
  }

  /**
   * One-time warning (per type, per session) when `rebindRange` synthesizes
   * a pool slot mid-scroll. Actionable on the consumer side via wider
   * prewarm coverage.
   */
  private maybeWarnGrowOnMiss(type: string): void {
    if (!this._isUserScrolling) return
    if (this._warnedGrowOnMissTypes === null) this._warnedGrowOnMissTypes = new Set<string>()
    if (this._warnedGrowOnMissTypes.has(type)) return
    this._warnedGrowOnMissTypes.add(type)
    log.w(
      `VirtualizedLayout: synchronous grow-on-miss for type "${type}" during active scroll — ` +
        "expect a one-frame hitch. Widen prewarm coverage by ensuring this type appears within " +
        "the first visibleSlots*4 rows during discovery, or pre-touch via scrollToIndex before fling."
    )
  }

  /**
   * Destroy pool slots idle longer than `shrinkDelayMs`, subject to the
   * `minSlotsPerType` floor. Visible-type slots are preserved regardless of
   * idle time; types absent from current data bypass the floor entirely.
   */
  private tickShrinkGC(): void {
    if (this._shrinkDelayMs <= 0) return
    if (this._poolObjects.length === 0) return
    const now = this.getTimeSec()
    if (now - this._lastShrinkTick < SHRINK_GC_TICK_INTERVAL_SEC) return
    this._lastShrinkTick = now
    const shrinkDelaySec = this._shrinkDelayMs / 1000

    // Cheap pre-scan — fully-bound pools exit here with no heap touches.
    let anyEligible = false
    for (let s = 0; s < this._poolObjects.length; s++) {
      if (this._dataIndices[s] >= 0) continue
      const lastUsed = this._lastUsedTime[s]
      if (lastUsed >= 0 && now - lastUsed >= shrinkDelaySec) {
        anyEligible = true
        break
      }
    }
    if (!anyEligible) return

    // Slots occupying a ring position must survive regardless of `_dataIndices`:
    // a past-end ring slot carries `di = -1` but destroying it drops the pool
    // below ringSize, leaving stale entries in `rebindRange`'s newRingOrder.
    const ringSlots = new Set<number>(this._ringOrder)

    const typeCounts = new Map<string, number>()
    for (let s = 0; s < this._slotTypes.length; s++) {
      const t = this._slotTypes[s] ?? VL_DEFAULT_TYPE
      typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1)
    }

    // Types currently visible — protect from shrink.
    const visibleTypes = new Set<string>()
    if (this.computeVisibleRangeInto(this._visibleRangeScratch)) {
      const vr = this._visibleRangeScratch
      for (let i = vr.first; i <= vr.last && i < this._totalItems; i++) {
        visibleTypes.add(this._dataTypes[i] ?? VL_DEFAULT_TYPE)
      }
    }

    // Types absent from this set are dead — destroy all of them, bypassing the floor.
    let liveDataTypes: Set<string>
    if (this._isHomogeneous) {
      liveDataTypes = this._totalItems > 0 ? new Set<string>([VL_DEFAULT_TYPE]) : new Set<string>()
    } else {
      liveDataTypes = this._liveDataTypesCache ?? new Set<string>()
    }

    // Identify candidates; compact in a single pass below. Indexed by
    // `destroyCount`, not `.length`, so length-clamping is fine.
    const toDestroy = this._shrinkToDestroyScratch
    let destroyCount = 0
    for (let s = 0; s < this._poolObjects.length; s++) {
      if (this._dataIndices[s] >= 0) continue
      // Off-ring spares only — never reclaim a slot that holds a ring position.
      if (ringSlots.has(s)) continue
      const lastUsed = this._lastUsedTime[s]
      // `< 0` is a belt-and-braces opt-out for any future seeding path.
      if (lastUsed < 0 || now - lastUsed < shrinkDelaySec) continue
      const t = this._slotTypes[s] ?? VL_DEFAULT_TYPE
      if (visibleTypes.has(t)) continue
      const count = typeCounts.get(t) ?? 0
      // Floor only applies to live types.
      if (liveDataTypes.has(t) && count <= this._minSlotsPerType) continue
      toDestroy[destroyCount++] = s
      typeCounts.set(t, count - 1)
    }
    if (destroyCount === 0) return

    // In-place compact: `keptCount` trails `readIdx` so overwrites never
    // clobber a slot we still need to read.
    const oldPoolSize = this._poolObjects.length
    const removedItems = this._shrinkRemovedItemsScratch
    removedItems.length = 0
    // Old → new slot index map for the ring-order remap.
    const indexMap = this._shrinkIndexMapScratch
    if (indexMap.length < oldPoolSize) indexMap.length = oldPoolSize
    // `toDestroy` is populated in ascending `readIdx` order, so a single forward cursor works.
    let destroyCursor = 0
    let keptCount = 0
    for (let readIdx = 0; readIdx < oldPoolSize; readIdx++) {
      if (destroyCursor < destroyCount && toDestroy[destroyCursor] === readIdx) {
        destroyCursor++
        indexMap[readIdx] = -1
        const item = this._poolItems[readIdx]
        if (item) removedItems.push(item)
        const obj = this._poolObjects[readIdx]
        if (obj && !isNull(obj)) obj.destroy()
        continue
      }
      indexMap[readIdx] = keptCount
      if (keptCount !== readIdx) {
        this._poolObjects[keptCount] = this._poolObjects[readIdx]
        this._poolItems[keptCount] = this._poolItems[readIdx]
        this._dataIndices[keptCount] = this._dataIndices[readIdx]
        this._lastAlpha[keptCount] = this._lastAlpha[readIdx]
        this._poolTexts[keptCount] = this._poolTexts[readIdx]
        this._poolImages[keptCount] = this._poolImages[readIdx]
        this._poolTextFills[keptCount] = this._poolTextFills[readIdx]
        this._poolImageMainPasses[keptCount] = this._poolImageMainPasses[readIdx]
        this._poolTextRGB[keptCount] = this._poolTextRGB[readIdx]
        this._poolImageRGB[keptCount] = this._poolImageRGB[readIdx]
        this._poolClippables[keptCount] = this._poolClippables[readIdx]
        this._poolClippableTransforms[keptCount] = this._poolClippableTransforms[readIdx]
        this._poolClippableInteractables[keptCount] = this._poolClippableInteractables[readIdx]
        this._poolColliders[keptCount] = this._poolColliders[readIdx]
        this._poolHolders[keptCount] = this._poolHolders[readIdx]
        this._slotKeys[keptCount] = this._slotKeys[readIdx]
        this._slotTypes[keptCount] = this._slotTypes[readIdx]
        this._lastUsedTime[keptCount] = this._lastUsedTime[readIdx]
        this._slotVisible[keptCount] = this._slotVisible[readIdx]
      }
      keptCount++
    }
    this._poolObjects.length = keptCount
    this._poolItems.length = keptCount
    this._dataIndices.length = keptCount
    this._lastAlpha.length = keptCount
    this._poolTexts.length = keptCount
    this._poolImages.length = keptCount
    this._poolTextFills.length = keptCount
    this._poolImageMainPasses.length = keptCount
    this._poolTextRGB.length = keptCount
    this._poolImageRGB.length = keptCount
    this._poolClippables.length = keptCount
    this._poolClippableTransforms.length = keptCount
    this._poolClippableInteractables.length = keptCount
    this._poolColliders.length = keptCount
    this._poolHolders.length = keptCount
    this._slotKeys.length = keptCount
    this._slotTypes.length = keptCount
    this._lastUsedTime.length = keptCount
    this._slotVisible.length = keptCount

    // In-place ring remap using the same trailing-write-pointer pattern.
    let ringKeptCount = 0
    for (let readIdx = 0; readIdx < this._ringOrder.length; readIdx++) {
      const mapped = indexMap[this._ringOrder[readIdx]]
      if (mapped >= 0) this._ringOrder[ringKeptCount++] = mapped
    }
    this._ringOrder.length = ringKeptCount

    // Compacting reshuffled every remaining slot's index; the SceneObject→slot
    // map needs a full rebuild rather than incremental updates.
    this._slotBySceneObject.clear()
    for (let i = 0; i < this._poolObjects.length; i++) {
      this._slotBySceneObject.set(this._poolObjects[i], i)
    }
    if (this._layout && removedItems.length > 0) {
      this._layout.removeItems(removedItems)
    }
    this.ensureRebindScratch(this._poolObjects.length)
    // Pool indices shifted under the clip pass — next LateUpdate must re-run.
    this._lastClipScroll = NaN
    this.markClipDirty()
  }

  /**
   * Measure-on-bind: if `_needsMeasure[dataIndex]` is set (adapter.getItemSize
   * returned undefined for this index), measure the slot's content via
   * ItemHandlerRegistry and update `_sizes` if the measurement differs.
   * Called from fireBindItem after adapter.onBindView has set up the content.
   *
   * Off-screen-shift caveat: measuring a buffer-zone item shifts items below
   * it; sub-pixel for measurements close to the default stride.
   */
  private maybeMeasureSlot(slot: number, dataIndex: number): void {
    if (dataIndex < 0 || dataIndex >= this._needsMeasure.length) return
    if (!this._needsMeasure[dataIndex]) return
    const obj = this._poolObjects[slot]
    if (!obj || isNull(obj)) return
    const resolved = ItemHandlerRegistry.resolve(obj)
    if (!resolved) return
    const transform = obj.getTransform()
    const dims = resolved.handler.measure(obj, resolved.component, transform)
    const measured = this._isVertical ? dims.preferred.height : dims.preferred.width
    if (!(measured > 0)) return
    this._needsMeasure[dataIndex] = false
    if (measured === this._sizes[dataIndex]) return
    if (this._deferMeasureSideEffects) {
      // Capture the anchor on the first deferred measure of this window —
      // BEFORE mutating `_sizes` — so flushDeferredMeasures restores against
      // pre-mutation geometry.
      if (this._pendingMeasureMinIdx === Number.MAX_SAFE_INTEGER) {
        this._deferredMeasureAnchor = this.captureAnchor()
      }
      this._sizes[dataIndex] = measured
      // Track the lowest changed dataIndex so flushDeferredMeasures rebuilds
      // cumulatives from there in one pass.
      if (dataIndex < this._pendingMeasureMinIdx) {
        this._pendingMeasureMinIdx = dataIndex
      }
      return
    }
    this._sizes[dataIndex] = measured
    this.rebuildCumulativesFrom(dataIndex)
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    this.applyItemSizeToSlot(slot, measured)
    if (this._scrollWindow) {
      this.setScrollDimensions(Math.max(this._totalContentSize, this._viewportMain))
    }
    this.recomputeFadeInvariants()
    this._lastFadeScroll = NaN
    this._lastClipScroll = NaN
    this.markClipDirty()
  }

  /**
   * Batched apply after the initial-fill measure window: rebuild cumulatives
   * from the lowest measured index and push content size + fade invariants
   * in one pass.
   */
  private flushDeferredMeasures(): void {
    const minIndex = this._pendingMeasureMinIdx
    this._pendingMeasureMinIdx = Number.MAX_SAFE_INTEGER
    // Anchor was captured in maybeMeasureSlot on the first deferred measure,
    // before `_sizes` was mutated, so it reflects pre-mutation geometry;
    // restoring against it keeps the visible row from jumping when measured
    // sizes differ from the estimate.
    const anchor = this._deferredMeasureAnchor
    this._deferredMeasureAnchor = null
    if (minIndex === Number.MAX_SAFE_INTEGER) return
    for (let s = 0; s < this._dataIndices.length; s++) {
      const di = this._dataIndices[s]
      if (di < 0) continue
      // The -1 sentinel must not propagate into FlexItem overrides.
      const sz = this._sizes[di] > 0 ? this._sizes[di] : this._itemSize
      this.applyItemSizeToSlot(s, sz)
    }
    this.rebuildCumulativesFrom(minIndex)
    this._totalContentSize = this.computeTotalContentSize(this._totalItems)
    if (this._scrollWindow) {
      this.setScrollDimensions(Math.max(this._totalContentSize, this._viewportMain))
    }
    this.recomputeFadeInvariants()
    // restoreAnchor's setScrollPosition fires onScrollPositionUpdated synchronously;
    // this runs inside rebindRange, so suppress the re-entrant rebind that would
    // clobber its shared scratch, then resync the layout offset by hand.
    if (anchor !== null && this._scrollWindow) {
      const prevUpdating = this._isUpdatingData
      this._isUpdatingData = true
      this.restoreAnchor(anchor)
      this._isUpdatingData = prevUpdating
      const scroll = this.getScrollMainAxis(this._scrollWindow.scrollPosition)
      this.updateLayoutOffset(Math.max(0, this.computeFirstVisibleSlot(scroll) - this._bufferCount))
    }
    this._lastFadeScroll = NaN
    this._lastClipScroll = NaN
    this.markClipDirty()
  }

  /**
   * Enable/disable a slot's descendant colliders. Gated by `_collidersForcedOff`:
   * enable requests are no-ops during scroll motion. `applyScrollMotionColliderState`
   * is the only path that bypasses the gate.
   */
  private setSlotCollidersEnabled(s: number, enabled: boolean): void {
    if (this._collidersForcedOff && enabled) return
    this.setSlotCollidersEnabledRaw(s, enabled)
  }

  /** Batched variant — pre-resolved `debugMode` skips the per-slot IM lookup. */
  private setSlotCollidersEnabledBatched(s: number, enabled: boolean, debugMode: boolean): void {
    if (this._collidersForcedOff && enabled) return
    this.setSlotCollidersEnabledRaw(s, enabled, debugMode)
  }

  /**
   * Direct collider write (no `_collidersForcedOff` gating). Subtree
   * mutations require `invalidate(range, "structure")` to refresh the cache.
   */
  private setSlotCollidersEnabledRaw(s: number, enabled: boolean, debugMode?: boolean): void {
    const obj = this._poolObjects[s]
    if (!obj || isNull(obj)) return
    const colliders = this._poolColliders[s]
    if (!colliders) return
    const dbg = debugMode ?? InteractionManager.getInstance().debugModeEnabled
    const debugDraw = enabled && dbg
    for (let i = 0; i < colliders.length; i++) {
      const collider = colliders[i]
      collider.enabled = enabled
      collider.debugDrawEnabled = debugDraw
    }
  }

  /**
   * Mirror `_slotVisible[s]` into IM's interactables set so updateInteractors
   * cost scales with visible window, not pool size. Idempotent.
   */
  private setSlotIMRegistered(s: number, registered: boolean): void {
    const clippables = this._poolClippables[s]
    if (!clippables || clippables.length === 0) return
    const im = InteractionManager.getInstance()
    for (let i = 0; i < clippables.length; i++) {
      const interactable = clippables[i].interactable
      if (!interactable || isNull(interactable)) continue
      if (registered) {
        im.registerInteractable(interactable)
      } else {
        im.deregisterInteractable(interactable)
      }
    }
  }

  /**
   * Force every slot's colliders to match `_slotVisible`. Call after
   * `rebindRange` + `forceFlexLayout`. Always writes — Element's
   * OnEnableEvent can re-enable managed colliders, so we can't short-circuit.
   */
  private updateSlotVisibilities(): void {
    if (this._poolObjects.length === 0) return
    const hasRange = this.computeVisibleRangeInto(this._visibleRangeScratch)
    const first = hasRange ? this._visibleRangeScratch.first : 0
    const last = hasRange ? this._visibleRangeScratch.last : -1
    let anyFlipped = false
    const debugMode = InteractionManager.getInstance().debugModeEnabled
    for (let s = 0; s < this._poolObjects.length; s++) {
      const di = this._dataIndices[s]
      const visible = di >= 0 && di >= first && di <= last
      if (this._slotVisible[s] !== visible) {
        anyFlipped = true
        this.setSlotIMRegistered(s, visible)
      }
      this._slotVisible[s] = visible
      this.setSlotCollidersEnabledBatched(s, visible, debugMode)
    }
    if (anyFlipped) {
      this._lastClipScroll = NaN
      this.markClipDirty()
    }
  }

  /** Run FlexLayout synchronously so slot transforms are settled before we return. */
  private forceFlexLayout(): void {
    if (!this._layout) return
    this._layout.forceLayout()
  }

  /**
   * Shrink each visible slot's clippable interactables to the portion inside
   * viewport bounds (in ScrollWindow-local space). Three bands: `"hidden"`,
   * `"fullyVisible"`, `"partial"`. Writes colliders only on band transitions.
   */
  private clipVisibleInteractables(): void {
    if (!this._scrollWindow || this._poolObjects.length === 0) return
    if (this._collidersForcedOff) return
    const scrollMain = this._lastScrollMain
    if (!this._clipDirty && scrollMain === this._lastClipScroll) return
    const swTransform = this._scrollWindowTransform
    if (!swTransform || isNull(swTransform)) return
    // Viewport bounds are centered on the ScrollWindow origin in its local
    // space; comparing there keeps local-space sizes consistent under world scale.
    const half = this._viewportMain * 0.5
    const mainPositive = half
    const mainNegative = -half
    const swInverted = swTransform.getInvertedWorldTransform()

    for (let s = 0; s < this._poolObjects.length; s++) {
      if (!this._slotVisible[s]) continue
      const clippables = this._poolClippables[s]
      const transforms = this._poolClippableTransforms[s]
      const interactables = this._poolClippableInteractables[s]
      for (let i = 0; i < clippables.length; i++) {
        this.applyClipBand(clippables[i], transforms[i], interactables[i], swInverted, mainPositive, mainNegative)
      }
    }
    this._lastClipScroll = scrollMain
    this._clipDirty = false
  }

  /**
   * Compute the band for a single clippable element and write its collider
   * state. `transform` / `interactable` are pre-resolved refs.
   */
  private applyClipBand(
    el: ClippableElement,
    transform: Transform,
    interactable: Interactable,
    swInverted: mat4,
    mainPositive: number,
    mainNegative: number
  ): void {
    const lastBand = this._clipBands.get(el)
    // No scroll-delta hysteresis: rebindRange moves slot world position without a
    // proportional scroll delta, so a stale fullyVisible cache would leak colliders.
    if (!transform || isNull(transform)) return
    const localPos = swInverted.multiplyPoint(transform.getWorldPosition())
    const elSize = el.size
    const elHalf = (this._isVertical ? elSize.y : elSize.x) * 0.5
    const elMain = this._isVertical ? localPos.y : localPos.x
    const elPositive = elMain + elHalf
    const elNegative = elMain - elHalf

    let band: ClipBand
    if (elNegative >= mainPositive || elPositive <= mainNegative) {
      band = "hidden"
    } else if (elPositive <= mainPositive && elNegative >= mainNegative) {
      band = "fullyVisible"
    } else {
      band = "partial"
    }

    if (band === "hidden") {
      // Clamp every tick, NOT just on transition. `updateSlotVisibilities`
      // and `applyScrollMotionColliderState` re-write `collider.enabled = true`
      // whenever `_slotVisible[s]` is true, and `_slotVisible` is computed
      // from the data-index range — not actual world position. A slot whose
      // data sits in [first..last] but whose physical position is past the
      // viewport edge gets its collider re-enabled by VL each tick, defeating
      // a one-shot transition disable. SIK's raycast resolves the collider
      // via `colliderToInteractableMap` and fires Interactable events
      // regardless of `interactable.enabled`, so a re-enabled collider is
      // fully hit-testable from a consumer's `onTriggerUp` handler.
      interactable.enabled = false
      const cols = interactable.colliders
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i]
        if (c && !isNull(c)) c.enabled = false
      }
      if (lastBand !== "hidden") this._clipBands.set(el, "hidden")
      return
    }

    if (lastBand === "hidden" || lastBand === undefined) {
      interactable.enabled = true
      const cols = interactable.colliders
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i]
        if (c && !isNull(c)) c.enabled = true
      }
    }

    if (band === "fullyVisible") {
      if (lastBand !== "fullyVisible") {
        el.colliderFitElement = true
        this._clipBands.set(el, "fullyVisible")
      }
      return
    }

    // Partial: visible band size depends on live scroll.
    const visiblePositive = Math.min(elPositive, mainPositive)
    const visibleNegative = Math.max(elNegative, mainNegative)
    const visibleSize = visiblePositive - visibleNegative
    const centerOffset = (visiblePositive + visibleNegative) * 0.5 - elMain

    el.colliderFitElement = false
    const sizeScratch = this._clipSizeScratch
    const centerScratch = this._clipCenterScratch
    if (this._isVertical) {
      sizeScratch.x = elSize.x
      sizeScratch.y = visibleSize
      sizeScratch.z = elSize.z
      centerScratch.x = 0
      centerScratch.y = centerOffset
      centerScratch.z = 0
    } else {
      sizeScratch.x = visibleSize
      sizeScratch.y = elSize.y
      sizeScratch.z = elSize.z
      centerScratch.x = centerOffset
      centerScratch.y = 0
      centerScratch.z = 0
    }
    el.colliderSize = sizeScratch
    el.colliderCenter = centerScratch
    this._clipBands.set(el, "partial")
  }

  /** Write `size` into slot's main-axis override; cross axis stays pinned. */
  private applyItemSizeToSlot(s: number, size: number): void {
    const item = this._poolItems[s]
    if (!item) return
    if (this._isVertical) {
      item.overrideWidth = this._containerCrossSize
      item.overrideHeight = size
    } else {
      item.overrideWidth = size
      item.overrideHeight = this._containerCrossSize
    }
  }

  /**
   * Imperative teardown for consumers that pool/reuse hosts or need
   * deterministic release. Fires `onUnbindView` for bound slots, cascade-
   * destroys owned SceneObjects, and clears pools. Idempotent: a second
   * `destroy()` (or the `OnDestroyEvent`) no-ops. After `destroy()`, mutating
   * methods/setters throw; reads return empty/zero values.
   */
  public destroy(): void {
    this.cleanup()
  }

  private assertNotDestroyed(): void {
    if (this._destroyed) {
      throw new Error("VirtualizedLayout: method called after destroy()")
    }
  }

  private cleanup(): void {
    // Flip first so re-entries from synchronous adapter callbacks bail on
    // their initialized-guard.
    this._initialized = false
    this._destroyed = true
    // Invalidate any pending onScrollIdle setTimeout via its captured counter.
    this._scrollIdleCounter++

    if (this._updateEvent) this._updateEvent.enabled = false
    if (this._lateUpdateEvent) this._lateUpdateEvent.enabled = false

    for (const dispose of this._disposers) {
      dispose()
    }
    this._disposers = []

    // Fire adapter.onUnbindView while SceneObjects are still alive so
    // consumers can release per-slot resources before cascade-destroy.
    for (let i = 0; i < this._poolObjects.length; i++) {
      const dataIndex = this._dataIndices[i]
      const obj = this._poolObjects[i]
      const holder = this._poolHolders[i]
      if (dataIndex >= 0 && obj && !isNull(obj) && this.adapter?.onUnbindView && holder !== null) {
        this.adapter.onUnbindView(obj, holder, dataIndex)
      }
    }
    // Drop consumer-supplied references so a dangling consumer can't outlive VL.
    // Write the backing field directly; the `adapter` setter guards on
    // `_destroyed`, which is already true here.
    this._adapter = null
    this._itemAlphaHandler = null
    this._pendingScroll = null
    this._pendingScrollIndex = null
    this._pendingScrollKey = null
    this._pendingAlignTarget = null

    // Cascade destroy: destroying the owned ScrollWindow SO takes the whole subtree.
    if (this._scrollWindow && !isNull(this._scrollWindow)) {
      const swObj = this._scrollWindow.sceneObject
      if (swObj && !isNull(swObj)) {
        swObj.destroy()
      }
    }
    this._scrollWindow = null
    this._layout = null
    this._layoutTransform = null
    this._scrollWindowTransform = null
    this._lateUpdateEvent = null
    this._updateEvent = null

    this._poolObjects = []
    this._poolItems = []
    this._dataIndices = []
    this._lastAlpha = []
    this._poolTexts = []
    this._poolImages = []
    this._poolTextFills = []
    this._poolImageMainPasses = []
    this._poolTextRGB = []
    this._poolImageRGB = []
    this._poolClippables = []
    this._poolClippableTransforms = []
    this._poolClippableInteractables = []
    this._poolColliders = []
    this._poolHolders = []
    this._slotKeys = []
    this._slotTypes = []
    this._lastUsedTime = []
    this._slotVisible = []
    this._slotBySceneObject.clear()
    this._ringOrder = []
    this._sizes = []
    this._cumulativeSizes = []
    this._dataTypes = []
    this._needsMeasure = []
    this._keyToIndex = null
    this._liveDataTypesCache = null
    this._typeCounts = null
    // Reset so the `totalItems` getter (unguarded) doesn't report a stale count.
    this._totalItems = 0
    this._pendingRemeasure.clear()
    this._pendingRemeasureSwap.clear()
    this._prewarmQueue.length = 0
    this._prewarmHead = 0
    this._prewarmComplete = true
    this._warnedGrowOnMissTypes = null
    this._scrollLayoutDirty = false
  }
}
