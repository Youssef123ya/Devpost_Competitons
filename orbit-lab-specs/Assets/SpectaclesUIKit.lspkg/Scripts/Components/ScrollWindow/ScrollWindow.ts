import {
  Interactable,
  InteractableEventArgs
} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {Interactor} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {findAllComponentsInSelfOrChildren} from "SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils"
import {SpringAnimate} from "SpectaclesInteractionKit.lspkg/Utils/springAnimate"
import {UNIT_PLANE_MESH_ASSET} from "../../Utility/Assets"
import {Frustum} from "../../Utility/Frustum"
import {getElement} from "../../Utility/UIKitUtilities"
import {Element} from "../Element"
import {Layoutable} from "../Layout2D/Layoutable"
import {UIKitBrands} from "../Layout2D/UIKitBrands"
// Side-effect import — register UIKit Layout2D handlers. ScrollWindow
// doesn't extend Element, so it needs its own bootstrap reference.
import "../../UIKitBootstrap"

const log = new NativeLogger("ScrollWindow")

const EPSILON = 0.0025
const GESTURE_ACCUMULATION_TIME_MS = 300
const SIGNIFICANT_VELOCITY_THRESHOLD = 0.1
const VELOCITY_DECAY_FACTOR = 0.7
const FLING_MULTIPLIER = 1
const FRICTION_FACTOR = 0.95
const MAX_OVERSHOOT_FACTOR = 0.45
const MINIMUM_SCROLLING_VELOCITY = 0.15
// 0-1, lower = smoother but more lag
const VELOCITY_SMOOTHING = 0.3
const VELOCITY_HISTORY_SIZE = 5
// Most-recent-first weights; sum to 1.0.
const VELOCITY_HISTORY_WEIGHTS = [0.35, 0.25, 0.2, 0.12, 0.08]

const EDGE_BOUNCE_STRENGTH = 1.0

type ScrollEventArg = {
  startPosition: vec2
  dragAmount: vec2
}

export type VisibleWindow = {
  bottomLeft: vec2
  topRight: vec2
}

/**
 * A low-level scrolling interaction solution for Spectacles.
 *
 * Children of this Component's SceneObject will be masked into windowSize and scrollable by scrollDimensions
 */
@component
export class ScrollWindow extends BaseScriptComponent implements Layoutable {
  /**
   * Type brand consumed by the Layout2D `ElementHandler` finder. ScrollWindow
   * is `Layoutable` but doesn't extend Element, so the brand is declared
   * explicitly here. See `Components/Layout2D/UIKitBrands.ts`.
   */
  public readonly __uikitBrand = UIKitBrands.Element

  @input
  @hint("Enable Vertical Scrolling")
  private _vertical: boolean = true
  @input
  @hint("Enable Horizontal Scrolling")
  private _horizontal: boolean = false

  @input("vec2", "{32,32}")
  @hint(
    "Size of masked window viewport in local space. <br><br>Note: to set dynamically, use <code>setWindowSize</code>"
  )
  private _windowSize: vec2 = new vec2(32, 32)
  @input("vec2", "{32,100}")
  @hint("Size of total scrollable area. <br><br>Note: to set dynamically, use <code>setScrollDimensions</code>")
  private _scrollDimensions: vec2 = new vec2(32, 100)

  @input
  @label("Scroll Position")
  @hint("Scroll Position in pixels in local space")
  private _scrollPosition: vec2 = vec2.zero()

  @input
  private _scrollSnapping: boolean = false

  @input
  @showIf("_scrollSnapping")
  private _snapRegion: vec2 = new vec2(8, 8)

  @input
  @showIf("_scrollSnapping")
  @hint(
    "Limit snapping to at most one page per fling. Recommended for paged content where long flings should not skip multiple pages."
  )
  private _maxSnapOne: boolean = false

  @input
  @hint("Add black fade to edges <code>(rendering trick for transparency)</code>")
  private _edgeFade: boolean = false

  private _initialized: boolean = false

  private _scrollingPaused: boolean = false

  /**
   * Whether scrolling is currently paused
   * @returns true if scrolling is paused, false otherwise
   */
  public get scrollingPaused(): boolean {
    return this._scrollingPaused
  }

  /**
   * Pause or resume scrolling
   * @param scrollingPaused - true to pause scrolling, false to resume
   */
  public set scrollingPaused(scrollingPaused: boolean) {
    if (this._initialized && scrollingPaused) {
      this.cancelCurrentInteractor()
      this.accumulatedVelocity = vec3.zero()
      this.lastGestureEndTime = 0
      this.committedSnapTarget.x = null
      this.committedSnapTarget.y = null
      this.startingPageIndex.x = 0
      this.startingPageIndex.y = 0
      this.syncScrollEndState()
    }
    this._scrollingPaused = scrollingPaused
  }

  private camera: WorldCameraFinderProvider = WorldCameraFinderProvider.getInstance()
  private cameraComponent = this.camera.getComponent()

  private transform: Transform
  private screenTransform: ScreenTransform
  private collider: ColliderComponent
  private _interactable: Interactable
  private maskingComponent: MaskingComponent
  private rmv: RenderMeshVisual

  private _maskingEnabledDesired: boolean = true
  private _interactableEnabledDesired: boolean = true
  private mesh: RenderMesh = UNIT_PLANE_MESH_ASSET
  private material: Material = requireAsset("../../../Materials/ScrollWindowFadeMask.mat") as Material

  private managedSceneObjects: SceneObject[] = []
  private managedComponents: Component[] = []

  private scroller: SceneObject

  private scrollerTransform: Transform

  /**
   * Frustum that handles helper viewport logic.
   * Use this to test if your content is visible within the scroll window.
   */
  public readonly frustum: Frustum = new Frustum()

  private startPosition: vec3 = vec3.zero()
  private interactorOffset: vec3 = vec3.zero()
  private interactorUpdated: boolean = false
  private activeInteractor: Interactor | null = null
  private isDragging: boolean = false
  private _isControlledExternally: boolean = false

  private velocity: vec3 = vec3.zero()
  private accumulatedVelocity: vec3 = vec3.zero()
  private lastPosition: vec3 = this.startPosition
  private lastGestureEndTime: number = 0
  // Ring buffer, newest-first by `velocityHistoryHead`.
  private velocityHistoryX: Float32Array = new Float32Array(VELOCITY_HISTORY_SIZE)
  private velocityHistoryY: Float32Array = new Float32Array(VELOCITY_HISTORY_SIZE)
  private velocityHistoryHead: number = 0
  private velocityHistoryLen: number = 0
  // Cumulative weight sums indexed by (sample count - 1) for partial-population averaging.
  private static readonly VELOCITY_HISTORY_WEIGHT_SUMS: Float32Array = (() => {
    const sums = new Float32Array(VELOCITY_HISTORY_SIZE)
    let s = 0
    for (let i = 0; i < VELOCITY_HISTORY_SIZE; i++) {
      s += VELOCITY_HISTORY_WEIGHTS[i] || 0
      sums[i] = s
    }
    return sums
  })()
  private dragAmount: vec2 = vec2.zero()
  // Per-frame scratch buffers — subscribers MUST NOT retain across ticks.
  private _frictionPositionScratch: vec3 = new vec3(0, 0, 0)
  private _snapPositionScratch: vec3 = new vec3(0, 0, 0)
  private _snapTargetScratch: vec3 = new vec3(0, 0, 0)
  private _weightedVelocityScratch: vec3 = new vec3(0, 0, 0)
  private _tweenLerpScratch: vec3 = new vec3(0, 0, 0)
  private _springVelocityScratch: vec3 = new vec3(0, 0, 0)
  private _scrollPosUpdatedScratch: vec2 = new vec2(0, 0)
  private _clampedBoundsScratch: vec3 = new vec3(0, 0, 0)
  private _overscrollResistScratch: vec3 = new vec3(0, 0, 0)
  private _frustumNearPlaneScratch: vec2 = new vec2(0, 0)
  private _dragEventStartScratch: vec2 = new vec2(0, 0)
  private _dragEventArgScratch: ScrollEventArg = {
    startPosition: this._dragEventStartScratch,
    dragAmount: this.dragAmount
  }
  private readonly onInitializedEvent: ReplayEvent<void> = new ReplayEvent()
  private readonly scrollDragEvent: Event<ScrollEventArg> = new Event()
  private readonly onScrollDimensionsUpdatedEvent: Event<vec2> = new Event()
  private readonly onScrollPositionUpdatedEvent: Event<vec2> = new Event()
  private readonly onScrollEndEvent: Event<void> = new Event()
  private readonly onSizeChangedEvent: Event<vec3> = new Event()

  private scrollTweenCancel = new CancelSet()
  private isTweeningScroll = false
  private wasScrollSettled = true

  /**
   * Event that fires when the ScrollWindow has been initialized
   */
  private _onInitialized?: PublicApi<void>
  public get onInitialized(): PublicApi<void> {
    return (this._onInitialized ??= this.onInitializedEvent.publicApi())
  }

  /**
   * Event that fires during scroll drag interactions.
   * Use this event to execute logic when the user drags to scroll.
   * The event payload's `vec2` fields are mutable references owned by
   * ScrollWindow and may be reused on later events; copy `x` / `y` values if
   * retaining them beyond the callback.
   */
  private _onScrollDrag?: PublicApi<ScrollEventArg>
  public get onScrollDrag(): PublicApi<ScrollEventArg> {
    return (this._onScrollDrag ??= this.scrollDragEvent.publicApi())
  }

  /**
   * Event that fires when scroll dimensions are updated.
   * Use this event to execute logic when the scrollable area size changes.
   * The emitted `vec2` is mutable ScrollWindow-owned state; copy `x` / `y`
   * values if retaining them beyond the callback.
   */
  private _onScrollDimensionsUpdated?: PublicApi<vec2>
  public get onScrollDimensionsUpdated(): PublicApi<vec2> {
    return (this._onScrollDimensionsUpdated ??= this.onScrollDimensionsUpdatedEvent.publicApi())
  }

  /**
   * Event that fires when scroll position is updated.
   * Use this event to execute logic when the scroll position changes.
   * The position is in local space.
   * The emitted `vec2` is a mutable scratch reference reused by ScrollWindow;
   * copy `x` / `y` values if retaining them beyond the callback.
   */
  private _onScrollPositionUpdated?: PublicApi<vec2>
  public get onScrollPositionUpdated(): PublicApi<vec2> {
    return (this._onScrollPositionUpdated ??= this.onScrollPositionUpdatedEvent.publicApi())
  }

  /**
   * Event that fires when scroll motion finishes (drag ended, spring settled, content in bounds).
   * May fire multiple times per gesture if the spring bounces and re-settles.
   */
  private _onScrollEnd?: PublicApi<void>
  public get onScrollEnd(): PublicApi<void> {
    return (this._onScrollEnd ??= this.onScrollEndEvent.publicApi())
  }

  /**
   * Event that fires when the layout size of the scroll window changes.
   */
  private _onSizeChanged?: PublicApi<vec3>
  public get onSizeChanged(): PublicApi<vec3> {
    return (this._onSizeChanged ??= this.onSizeChangedEvent.publicApi())
  }

  private _hardStopAtEnds: boolean = false

  private _enableChildCollidersBoundary: Rect = Rect.create(-1, 1, -1, 1)

  private debugRender: boolean = false

  private colliderShape = Shape.createBoxShape()

  private spring = new SpringAnimate(150, 21, 1)

  private isSubscribedToEvents = false
  private eventUnsubscribes = []

  private colliderToElementMap: Map<ColliderComponent, Element> = new Map<ColliderComponent, Element>()

  private _skipColliderManagement: boolean = false
  // Descendant-collider snapshot; invalidated on scrollDimensions change or disable.
  private _childCollidersCache: ColliderComponent[] | null = null
  private _lastChildCollidersEnabled: boolean | null = null

  // Snap target per axis; committed once chosen and held until the snap completes.
  private committedSnapTarget: {x: number | null; y: number | null} = {x: null, y: null}

  // Page index at drag-start, used to compute the deadzone.
  private startingPageIndex: {x: number; y: number} = {x: 0, y: 0}

  /**
   * Gets whether this scroll window is initialized.
   * @returns True if the scroll window is initialized, false otherwise.
   */
  public get initialized(): boolean {
    return this._initialized
  }

  /**
   * Gets the width of the scroll window layout in local space centimeters.
   * @returns The current width of the scroll window.
   */
  public get width(): number {
    return this._windowSize.x
  }

  /**
   * Sets the width of the scroll window.
   * @param value - The new width value.
   */
  public set width(value: number) {
    this.windowSize = new vec2(value, this._windowSize.y)
  }

  /**
   * Gets the height of the scroll window layout in local space centimeters.
   * @returns The current height of the scroll window.
   */
  public get height(): number {
    return this._windowSize.y
  }

  /**
   * Sets the height of the scroll window.
   * @param value - The new height value.
   */
  public set height(value: number) {
    this.windowSize = new vec2(this._windowSize.x, value)
  }

  /**
   * Gets the depth of the scroll window layout in local space centimeters.
   * @returns The current depth of the scroll window.
   */
  public get depth(): number {
    return 1
  }

  /**
   * Sets the depth of the scroll window.
   * This is a no-op as depth is not configurable for 2D components.
   * @param value - The new depth value (ignored).
   */
  public set depth(value: number) {}

  /**
   * Gets the current size of the layout as a vec3 (width, height, depth).
   * @returns The layout size with width, height, and depth.
   */
  public get layoutSize(): vec3 {
    return new vec3(this.width, this.height, this.depth)
  }

  /**
   * get the number of children in the content of scroll window
   */
  public get children(): SceneObject[] {
    if (!this._initialized) {
      return []
    }
    return this.scroller.children
  }

  /**
   * The Interactable component of this scroll window
   * @returns Interactable component
   */
  public get interactable(): Interactable {
    return this._interactable
  }

  /** Enables the internal MaskingComponent. Persists across SceneObject enable cycles. */
  public get maskingEnabled(): boolean {
    return this._maskingEnabledDesired
  }

  public set maskingEnabled(enabled: boolean) {
    this._maskingEnabledDesired = enabled
    if (this.maskingComponent) {
      this.maskingComponent.enabled = enabled
    }
  }

  /** Enables the internal Interactable. Persists across SceneObject enable cycles. */
  public get interactableEnabled(): boolean {
    return this._interactableEnabledDesired
  }

  public set interactableEnabled(enabled: boolean) {
    this._interactableEnabledDesired = enabled
    if (this._interactable) {
      this._interactable.enabled = enabled
    }
  }

  /**
   * Whether vertical scrolling is enabled
   * @returns true if vertical scrolling is enabled, false otherwise
   */
  public get vertical(): boolean {
    return this._vertical
  }

  /**
   * Whether vertical scrolling is enabled
   * @param value - true to enable vertical scrolling, false to disable
   */
  public set vertical(value: boolean) {
    if (value === undefined) {
      return
    }
    this._vertical = value
  }

  /**
   * Whether horizontal scrolling is enabled
   * @returns true if horizontal scrolling is enabled, false otherwise
   */
  public get horizontal(): boolean {
    return this._horizontal
  }

  /**
   * Whether horizontal scrolling is enabled
   * @param value - true to enable horizontal scrolling, false to disable
   */
  public set horizontal(value: boolean) {
    if (value === undefined) {
      return
    }
    this._horizontal = value
  }

  /**
   * Whether this scroll window is controlled externally
   * @returns true if controlled externally, false otherwise
   */
  public get isControlledExternally(): boolean {
    return this._isControlledExternally
  }

  /**
   * Whether this scroll window is controlled externally
   * @param value - true to control externally, false to control internally
   */
  public set isControlledExternally(value: boolean) {
    if (value === undefined) {
      return
    }
    if (this._isControlledExternally && !value) {
      this.applyAccumulatedVelocity()
    } else if (!this._isControlledExternally && value) {
      this.resetDragState()
    }
    this._isControlledExternally = value
  }

  /**
   * Whether this scroll window is using snap scrolling
   * @returns true if snap scrolling is enabled, false otherwise
   */
  public get scrollSnapping(): boolean {
    return this._scrollSnapping
  }

  /**
   * Whether this scroll window is using snap scrolling
   * @param value - true to enable snap scrolling, false to disable
   */
  public set scrollSnapping(scrollSnapping: boolean) {
    if (scrollSnapping === undefined) {
      return
    }
    this._scrollSnapping = scrollSnapping
  }

  /**
   * The size of each snap segment in the scroll window
   * @returns vec2 of the size of each snap segment in local space.
   */
  public get snapRegion(): vec2 {
    return this._snapRegion
  }

  /**
   * The size of each snap segment in the scroll window
   * @param snapRegion - The size of each snap segment in local space.
   */
  public set snapRegion(snapRegion: vec2) {
    if (snapRegion === undefined) {
      return
    }
    this._snapRegion = snapRegion
  }

  /**
   * Whether snap scrolling is limited to one page per fling.
   * Useful for paged UIs where long flicks should not skip over intermediate pages.
   * @returns true if snap movement is clamped to +/-1 page, false otherwise.
   */
  public get maxSnapOne(): boolean {
    return this._maxSnapOne
  }

  /**
   * Controls whether snap scrolling is limited to one page per fling.
   * Set to true for strict page-by-page navigation, false to allow multi-page flings.
   * @param maxSnapOne - true to clamp each fling to a single page hop.
   */
  public set maxSnapOne(maxSnapOne: boolean) {
    if (maxSnapOne === undefined) {
      return
    }
    this._maxSnapOne = maxSnapOne
  }

  /**
   * The scroll position in local space
   */
  public get scrollPosition(): vec2 {
    return this._scrollPosition
  }

  /**
   * The scroll position in local space
   */
  public set scrollPosition(position: vec2) {
    if (position === undefined) {
      return
    }
    if (this._initialized) {
      this.scrollTweenCancel()
      const scrollerLocalPosition = this.scrollerTransform.getLocalPosition()
      let newPosition = new vec3(position.x, position.y, scrollerLocalPosition.z)

      newPosition = this.applyOverscrollIfNeeded(newPosition)

      this.updateScrollerPosition(newPosition)

      if (this.scrollSnapping) {
        this.updateVelocityFromPosition(newPosition)
      }
    } else {
      this._scrollPosition = position
    }
  }

  /**
   * The scroll position in normalized space
   * -1, 1 on the x (left to right) if scrollDimensions.x is not -1, otherwise the scroll position.x in pixels
   * -1, 1 on the y (bottom to top) if scrollDimensions.y is not -1, otherwise the scroll position.y in pixels
   */
  public get scrollPositionNormalized(): vec2 {
    const normalizedScrollPosition = vec2.zero()
    // Guard divides: content-fits-exactly collapses the edge to 0, which would yield NaN/Infinity.
    if (this._scrollDimensions.x !== -1) {
      const edge = this.rightEdge
      normalizedScrollPosition.x = Math.abs(edge) > EPSILON ? this._scrollPosition.x / edge : 0
    } else {
      normalizedScrollPosition.x = this._scrollPosition.x
    }
    if (this._scrollDimensions.y !== -1) {
      const edge = this.topEdge
      normalizedScrollPosition.y = Math.abs(edge) > EPSILON ? this._scrollPosition.y / edge : 0
    } else {
      normalizedScrollPosition.y = this._scrollPosition.y
    }
    return normalizedScrollPosition
  }

  /**
   * The scroll position in normalized space
   * -1, 1 on the x (left to right)
   * -1, 1 on the y (bottom to top)
   */
  public set scrollPositionNormalized(normalizedPosition: vec2) {
    if (normalizedPosition === undefined) {
      return
    }
    if (this._initialized) {
      this.scrollTweenCancel()

      const scrollerLocalPosition = this.scrollerTransform.getLocalPosition()
      let newPosition = new vec3(
        this._scrollDimensions.x !== -1 ? normalizedPosition.x * this.rightEdge : normalizedPosition.x,
        this._scrollDimensions.y !== -1 ? normalizedPosition.y * this.topEdge : normalizedPosition.y,
        scrollerLocalPosition.z
      )

      newPosition = this.applyOverscrollIfNeeded(newPosition)

      this.updateScrollerPosition(newPosition)

      if (this.scrollSnapping) {
        this.updateVelocityFromPosition(newPosition)
      }
    } else {
      this._scrollPosition.x =
        this._scrollDimensions.x !== -1 ? normalizedPosition.x * this.rightEdge : normalizedPosition.x
      this._scrollPosition.y =
        this._scrollDimensions.y !== -1 ? normalizedPosition.y * this.topEdge : normalizedPosition.y
    }
  }

  /**
   * The size of the masked window viewport in local space
   * @returns vec2 of the current window size
   */
  public get windowSize(): vec2 {
    return this._windowSize
  }

  /**
   * The size of the masked window viewport in local space
   * @param size - The window size in local space. Negative or non-finite components are rejected.
   */
  public set windowSize(size: vec2) {
    if (size === undefined) {
      return
    }
    if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || size.x < 0 || size.y < 0) {
      log.w(`ignoring windowSize write with non-finite or negative component (${size.x}, ${size.y}).`)
      return
    }
    if (this._initialized) {
      this.setWindowSize(size)
    } else {
      this._windowSize = size
    }
  }

  /**
   * The size of the total scrollable area
   * @returns vec2 of the current scroll dimensions
   */
  public get scrollDimensions(): vec2 {
    return this._scrollDimensions
  }

  /**
   * The size of the total scrollable area
   * @param size - The scroll dimensions in local space. Use `-1` on either axis to mean "no scroll on this axis".
   */
  public set scrollDimensions(size: vec2) {
    if (size === undefined) {
      return
    }
    const xOk = Number.isFinite(size.x) && (size.x >= 0 || size.x === -1)
    const yOk = Number.isFinite(size.y) && (size.y >= 0 || size.y === -1)
    if (!xOk || !yOk) {
      return
    }
    if (this._initialized) {
      this.setScrollDimensions(size)
    } else {
      this._scrollDimensions = size
    }
  }

  /**
   * Whether edge fade is enabled
   * @returns true if edge fade is enabled, false otherwise
   */
  public get edgeFade(): boolean {
    return this._edgeFade
  }

  /**
   * Whether edge fade is enabled
   * @param value - true to enable edge fade, false to disable
   */
  public set edgeFade(value: boolean) {
    if (value === undefined) {
      return
    }
    if (this._initialized) {
      this.enableEdgeFade(value)
    } else {
      this._edgeFade = value
    }
  }

  /**
   * Whether hard stop at ends is enabled
   * When true, disables the bounce-back effect at the edges of the scroll area.
   * When false (default), the scroll window will use a spring animation to bounce back when scrolled beyond bounds.
   * @returns true if hard stop at ends is enabled, false otherwise
   */
  public get hardStopAtEnds(): boolean {
    return this._hardStopAtEnds
  }

  /**
   * Whether hard stop at ends is enabled
   * @param value - true to enable hard stop at ends, false to disable
   */
  public set hardStopAtEnds(value: boolean) {
    if (value === undefined) {
      return
    }
    this._hardStopAtEnds = value
  }

  /**
   * The boundary within which child colliders will be enabled when an interactor hovers over the ScrollWindow.
   * Uses normalized positions from -1 to 1 on both axes.
   * For example, if we provide a Rect with Rect.create(-1, 1, -0.8, 1),
   * hovering the bottom 10% of the ScrollWindow will not enable the child ColliderComponents.
   * @returns The current enable child colliders boundary
   */
  public get enableChildCollidersBoundary(): Rect {
    return this._enableChildCollidersBoundary
  }

  /**
   * The boundary within which child colliders will be enabled when an interactor hovers over the ScrollWindow.
   * @param value - The boundary rect using normalized positions from -1 to 1
   */
  public set enableChildCollidersBoundary(value: Rect) {
    if (value === undefined) {
      return
    }
    this._enableChildCollidersBoundary = value
  }

  /**
   * When true, disables the default child collider management.
   * Useful for virtualized scroll windows that manage colliders themselves.
   *
   * Set before any colliders are added; flipping after `enableChildColliders`
   * has run will not undo prior toggles.
   */
  public get skipColliderManagement(): boolean {
    return this._skipColliderManagement
  }

  public set skipColliderManagement(value: boolean) {
    this._skipColliderManagement = value
  }

  public onAwake() {
    this.createEvent("OnEnableEvent").bind(() => {
      if (this._initialized) {
        this.subscribeToEvents(true)
        this.managedComponents.forEach((component) => {
          if (!isNull(component) && component) {
            if (component === this.rmv) {
              component.enabled = this._edgeFade
            } else if (component === this.maskingComponent) {
              component.enabled = this._maskingEnabledDesired
            } else if (component === this._interactable) {
              component.enabled = this._interactableEnabledDesired
            } else {
              component.enabled = true
            }
          }
        })
        this.cancelCurrentInteractor()
      }
    })
    this.createEvent("OnDisableEvent").bind(() => {
      if (this._initialized) {
        this.subscribeToEvents(false)
        this.managedComponents.forEach((component) => {
          if (!isNull(component) && component) {
            component.enabled = false
          }
        })
        this.enableChildColliders(true)
      }
    })
    this.createEvent("OnDestroyEvent").bind(() => {
      this.scrollTweenCancel()
      // Skip reparenting when an owner manages child lifecycle — would risk double-destroy.
      if (!this._skipColliderManagement && this.scroller && !isNull(this.scroller) && !isNull(this.sceneObject)) {
        try {
          this.scroller.children.forEach((child) => {
            if (!isNull(child)) child.setParent(this.sceneObject)
          })
        } catch {
          // Parent mid-destruction; children will be destroyed with the tree.
        }
      }
      this.managedComponents.forEach((component) => {
        if (component && !isNull(component)) {
          component.destroy()
        }
      })
      this.managedComponents = []
      this.managedSceneObjects.forEach((sceneObject) => {
        if (sceneObject && !isNull(sceneObject)) {
          sceneObject.destroy()
        }
      })
      this.managedSceneObjects = []
    })
    this.createEvent("OnStartEvent").bind(this.initialize.bind(this))
    this.createEvent("LateUpdateEvent").bind(this.update)
  }

  /**
   * Adds a SceneObject to this scroll window's scrollable content area.
   * The object's parent will be set to the internal scroller object.
   *
   * @param object - The SceneObject to add to the scroll window
   */
  public addObject(object: SceneObject): void {
    object.setParent(this.scroller ?? this.sceneObject)
  }

  /**
   * Initializes the ScrollWindow component.
   * This method runs once on creation and sets up all necessary components and event handlers.
   */
  public initialize = () => {
    if (this._initialized) return

    this.transform = this.sceneObject.getTransform()
    this.screenTransform =
      this.sceneObject.getComponent("ScreenTransform") || this.sceneObject.createComponent("ScreenTransform")
    this.screenTransform.position = this.transform.getLocalPosition()
    this.collider =
      this.sceneObject.getComponent("ColliderComponent") || this.sceneObject.createComponent("ColliderComponent")
    this.managedComponents.push(this.collider)
    this.maskingComponent =
      this.sceneObject.getComponent("MaskingComponent") || this.sceneObject.createComponent("MaskingComponent")
    this.managedComponents.push(this.maskingComponent)
    this._interactable =
      this.sceneObject.getComponent(Interactable.getTypeName()) ||
      this.sceneObject.createComponent(Interactable.getTypeName())
    this.managedComponents.push(this._interactable)
    this._interactable.isScrollable = true

    if (this._edgeFade) {
      this.createEdgeFade()
    }

    this.setWindowSize(this._windowSize)

    this.collider.shape = this.colliderShape
    this.collider.fitVisual = false
    this.collider.debugDrawEnabled = this.debugRender

    this._interactable.enableInstantDrag = true

    const currentChildren = [...this.sceneObject.children]

    this.scroller = global.scene.createSceneObject("Scroller")
    this.managedSceneObjects.push(this.scroller)
    this.scroller.layer = this.sceneObject.layer
    this.scroller.setParent(this.sceneObject)
    this.scrollerTransform = this.scroller.getTransform()

    for (let i = 0; i < currentChildren.length; i++) {
      const thisChild = currentChildren[i]
      thisChild.setParent(this.scroller)
    }

    this.subscribeToEvents(this.enabled)

    const initialPosition = new vec3(this.scrollPosition.x, this.scrollPosition.y, 0)
    if (this._scrollSnapping) {
      if (
        this._horizontal &&
        this.snapRegion.x > 0 &&
        (this._scrollDimensions.x === -1 || this._scrollDimensions.x > this._windowSize.x)
      ) {
        const pageIndex = this.getPageIndexFromPosition("x", this._scrollPosition.x)
        if (this._scrollDimensions.x !== -1) {
          initialPosition.x = this.rightEdge + pageIndex * this.snapRegion.x
          initialPosition.x = MathUtils.clamp(initialPosition.x, this.rightEdge, this.leftEdge)
        } else {
          initialPosition.x = pageIndex * this.snapRegion.x
        }
      }

      if (
        this._vertical &&
        this.snapRegion.y > 0 &&
        (this._scrollDimensions.y === -1 || this._scrollDimensions.y > this._windowSize.y)
      ) {
        const pageIndex = this.getPageIndexFromPosition("y", this._scrollPosition.y)
        if (this._scrollDimensions.y !== -1) {
          initialPosition.y = this.topEdge + pageIndex * this.snapRegion.y
          initialPosition.y = MathUtils.clamp(initialPosition.y, this.topEdge, this.bottomEdge)
        } else {
          initialPosition.y = pageIndex * this.snapRegion.y
        }
      }
    }

    if (initialPosition.x !== 0 || initialPosition.y !== 0) {
      this.updateScrollerPosition(initialPosition)
    }

    this._initialized = true
    this.onInitializedEvent.invoke()
  }

  private onInteractableHoverEnter = (event: InteractorEvent): void => {
    if (this.scrollingPaused) return
    const intersection = event.interactor.raycastPlaneIntersection(this._interactable)
    if (intersection) {
      const localIntersection = this.screenTransform.worldPointToLocalPoint(intersection)
      if (
        localIntersection.x < this._enableChildCollidersBoundary.left ||
        localIntersection.x > this._enableChildCollidersBoundary.right ||
        localIntersection.y < this._enableChildCollidersBoundary.bottom ||
        localIntersection.y > this._enableChildCollidersBoundary.top
      ) {
        event.stopPropagation()
      } else {
        this.enableChildColliders(true)
      }
    } else {
      this.enableChildColliders(false)
    }
  }

  private onInteractableHoverUpdate = (event: InteractorEvent): void => {
    if (this.scrollingPaused) return
    const intersection = event.interactor.raycastPlaneIntersection(this._interactable)
    if (intersection) {
      const localIntersection = this.screenTransform.worldPointToLocalPoint(intersection)
      if (
        localIntersection.x < this._enableChildCollidersBoundary.left ||
        localIntersection.x > this._enableChildCollidersBoundary.right ||
        localIntersection.y < this._enableChildCollidersBoundary.bottom ||
        localIntersection.y > this._enableChildCollidersBoundary.top
      ) {
        event.stopPropagation()
      } else {
        this.enableChildColliders(true)
      }
    } else {
      this.enableChildColliders(false)
    }
  }

  private onInteractableHoverExit = (): void => {
    this.enableChildColliders(false)
  }

  private onInteractableTriggerStart = (event: InteractorEvent): void => {
    if (this.scrollingPaused) return
    if (this.activeInteractor && this.activeInteractor !== event.interactor) {
      this.cancelCurrentInteractor()
    }
    this.activeInteractor = event.interactor
    this.resetDragState()
  }

  private onInteractableTriggerCanceled = (event: InteractorEvent): void => {
    if (this.activeInteractor !== event.interactor) return
    this.cancelCurrentInteractor()
    if (this.accumulatedVelocity.length > 0) {
      const fling = this.accumulatedVelocity.uniformScale(FLING_MULTIPLIER)
      fling.z = 0
      this.spring.velocity = fling
    } else {
      this.spring.velocity = vec3.zero()
    }
  }

  private onInteractableDragUpdate = (event: InteractorEvent): void => {
    if (this.scrollingPaused) return
    if (this.activeInteractor?.inputType !== event.interactor.inputType) return
    if (!event.interactor) return

    const interactedElement = getElement(event.interactor.currentInteractable.sceneObject)
    if (interactedElement && interactedElement.isDraggable && !interactedElement.inactive) {
      return
    }

    const intersection = event.interactor.raycastPlaneIntersection(this._interactable)
    if (!intersection) return

    this.scrollTweenCancel()
    const interactorPos = this.transform.getInvertedWorldTransform().multiplyPoint(intersection)
    if (!this.interactorUpdated) {
      this.startPosition = this.scrollerTransform.getLocalPosition()
      this.lastPosition = this.startPosition
      this.interactorOffset = interactorPos
      this.interactorUpdated = true
      this.isDragging = true
      this.committedSnapTarget.x = null
      this.committedSnapTarget.y = null
      this.cancelChildInteraction(event)
    }
    this.dragAmount.x = interactorPos.x - this.interactorOffset.x
    this.dragAmount.y = interactorPos.y - this.interactorOffset.y
    let newPosition = this.startPosition.add(interactorPos.sub(this.interactorOffset))
    newPosition.z = 0
    newPosition = this.applyOverscrollIfNeeded(newPosition)
    this.updateScrollerPosition(newPosition)
    this._dragEventStartScratch.x = this.startPosition.x
    this._dragEventStartScratch.y = this.startPosition.y
    this.scrollDragEvent.invoke(this._dragEventArgScratch)
    if (event.target.sceneObject === this.sceneObject || event.propagationPhase === "BubbleUp") {
      this.updateVelocityFromPosition(newPosition)
    }
  }

  private onInteractableDragEnd = (event: InteractorEvent): void => {
    if (this.activeInteractor !== event.interactor) return
    this.activeInteractor = null
    this.isDragging = false
    if (event.target.sceneObject !== this.sceneObject) {
      const interactedElement = getElement(event.target.sceneObject)
      if (!interactedElement?.isDraggable) {
        event.stopPropagation()
      }
    }
    this.applyAccumulatedVelocity()
  }

  private subscribeToEvents = (subscribe: boolean) => {
    if (this.isSubscribedToEvents === subscribe) return
    this.isSubscribedToEvents = subscribe
    if (subscribe) {
      this.eventUnsubscribes = [
        this._interactable.onHoverEnter.add(this.onInteractableHoverEnter),
        this._interactable.onHoverUpdate.add(this.onInteractableHoverUpdate),
        this._interactable.onHoverExit.add(this.onInteractableHoverExit),
        this._interactable.onInteractorTriggerStart.add(this.onInteractableTriggerStart),
        this._interactable.onTriggerCanceled.add(this.onInteractableTriggerCanceled),
        this._interactable.onDragUpdate.add(this.onInteractableDragUpdate),
        this._interactable.onDragEnd.add(this.onInteractableDragEnd)
      ]
    } else {
      this.eventUnsubscribes.forEach((unsubscribe) => unsubscribe())
      this.eventUnsubscribes = []
    }
  }

  /**
   * Helper function to tween scroll
   * @param position - final position
   * @param time - duration of tweened scroll in milliseconds
   */
  public tweenTo = (position: vec2, time: number) => {
    this.scrollTweenCancel()
    this.spring.velocity = vec3.zero()
    const scrollerLocalPosition = this.scrollerTransform.getLocalPosition()
    const startX = scrollerLocalPosition.x
    const startY = scrollerLocalPosition.y
    const startZ = scrollerLocalPosition.z
    const endX = position.x
    const endY = position.y

    this.isTweeningScroll = true
    animate({
      duration: time * 0.001,
      update: (t) => {
        const lerp = this._tweenLerpScratch
        lerp.x = startX + (endX - startX) * t
        lerp.y = startY + (endY - startY) * t
        lerp.z = startZ
        this.updateScrollerPosition(lerp)
      },
      ended: () => {
        this.isTweeningScroll = false
        this.syncScrollEndState()
      },
      cancelled: () => {
        this.isTweeningScroll = false
      },
      cancelSet: this.scrollTweenCancel,
      easing: "ease-in-out-quad"
    })
  }

  /**
   * Gets the viewable window of local space at zero depth.
   * The window ranges from -windowSize.x/2 to windowSize.x/2 on the x-axis (left to right)
   * and -windowSize.y/2 to windowSize.y/2 on the y-axis (bottom to top).
   *
   * @returns VisibleWindow object containing bottomLeft and topRight corners in local space
   */
  public getVisibleWindow(): VisibleWindow {
    const visibleWindow: VisibleWindow = {
      bottomLeft: vec2.zero(),
      topRight: vec2.zero()
    }
    visibleWindow.bottomLeft.x = -this._scrollPosition.x - this._windowSize.x * 0.5
    visibleWindow.bottomLeft.y = -this._scrollPosition.y - this._windowSize.y * 0.5
    visibleWindow.topRight.x = -this._scrollPosition.x + this._windowSize.x * 0.5
    visibleWindow.topRight.y = -this._scrollPosition.y + this._windowSize.y * 0.5
    return visibleWindow
  }

  /**
   * Writes the viewable window into a caller-owned buffer to avoid allocations.
   * @param out - The buffer to write the visible window bounds into.
   */
  public getVisibleWindowInto(out: VisibleWindow): void {
    out.bottomLeft.x = -this._scrollPosition.x - this._windowSize.x * 0.5
    out.bottomLeft.y = -this._scrollPosition.y - this._windowSize.y * 0.5
    out.topRight.x = -this._scrollPosition.x + this._windowSize.x * 0.5
    out.topRight.y = -this._scrollPosition.y + this._windowSize.y * 0.5
  }

  /**
   * Gets the viewable window in normalized space at zero depth.
   * The window ranges from -1 to 1 on the x-axis (left to right)
   * and -1 to 1 on the y-axis (bottom to top).
   *
   * @returns VisibleWindow object containing bottomLeft and topRight corners in normalized space
   */
  public getVisibleWindowNormalized(): VisibleWindow {
    const visibleWindow: VisibleWindow = this.getVisibleWindow()
    // Guard divides: scrollDimensions of 0 or sentinel -1 would leak NaN/Infinity.
    const halfX = this._scrollDimensions.x * 0.5
    const halfY = this._scrollDimensions.y * 0.5
    if (Math.abs(halfX) > EPSILON && this._scrollDimensions.x !== -1) {
      visibleWindow.bottomLeft.x /= halfX
      visibleWindow.topRight.x /= halfX
    } else {
      visibleWindow.bottomLeft.x = 0
      visibleWindow.topRight.x = 0
    }
    if (Math.abs(halfY) > EPSILON && this._scrollDimensions.y !== -1) {
      visibleWindow.bottomLeft.y /= halfY
      visibleWindow.topRight.y /= halfY
    } else {
      visibleWindow.bottomLeft.y = 0
      visibleWindow.topRight.y = 0
    }
    return visibleWindow
  }

  private get topEdge(): number {
    return this._scrollDimensions.y * -0.5 + this._windowSize.y * 0.5
  }

  private get bottomEdge(): number {
    return this._scrollDimensions.y * 0.5 - this._windowSize.y * 0.5
  }

  private get leftEdge(): number {
    return this._scrollDimensions.x * 0.5 - this._windowSize.x * 0.5
  }

  private get rightEdge(): number {
    return this._scrollDimensions.x * -0.5 + this._windowSize.x * 0.5
  }

  private setWindowSize = (size: vec2) => {
    this._windowSize = size
    this.screenTransform.anchors.left = this._windowSize.x * -0.5
    this.screenTransform.anchors.right = this._windowSize.x * 0.5
    this.screenTransform.anchors.bottom = this._windowSize.y * -0.5
    this.screenTransform.anchors.top = this._windowSize.y * 0.5
    if (this._edgeFade) {
      this.material.mainPass.windowSize = size
      this.material.mainPass.radius = this.maskingComponent.cornerRadius
    }
    this.colliderShape.size = new vec3(this._windowSize.x, this._windowSize.y, 1)
    this.collider.shape = this.colliderShape
    this.onSizeChangedEvent.invoke(this.layoutSize)
  }

  private setScrollDimensions = (size: vec2) => {
    this._scrollDimensions = size
    // Content size changed; invalidate child-collider cache.
    if (!this._skipColliderManagement) {
      this._childCollidersCache = null
      this._lastChildCollidersEnabled = null
    }
    this.onScrollDimensionsUpdatedEvent.invoke(this._scrollDimensions)
  }

  private enableEdgeFade = (enable: boolean) => {
    this._edgeFade = enable
    if (enable && !this.rmv) {
      this.createEdgeFade()
    }
    if (this.rmv) {
      this.rmv.enabled = enable
    }
  }

  private getClampedBoundsAndCheckOutOfBounds(scrollPos: vec3): {
    clamped: vec3
    isOutOfBounds: boolean
  } {
    const clampedX =
      this._scrollDimensions.x === -1
        ? scrollPos.x
        : this._scrollDimensions.x > this._windowSize.x
          ? MathUtils.clamp(scrollPos.x, this.rightEdge, this.leftEdge)
          : 0

    const clampedY =
      this._scrollDimensions.y === -1
        ? scrollPos.y
        : this._scrollDimensions.y > this._windowSize.y
          ? MathUtils.clamp(scrollPos.y, this.topEdge, this.bottomEdge)
          : 0

    const clamped = this._clampedBoundsScratch
    clamped.x = clampedX
    clamped.y = clampedY
    clamped.z = 0

    // Z is excluded — the scroller is 2D and Z drift would trap update() in the overshoot path forever.
    const isOutOfBounds = Math.abs(scrollPos.x - clampedX) > EPSILON || Math.abs(scrollPos.y - clampedY) > EPSILON

    return {clamped, isOutOfBounds}
  }

  private isOutOfBounds(scrollPos: vec3): boolean {
    const clampedX =
      this._scrollDimensions.x === -1
        ? scrollPos.x
        : this._scrollDimensions.x > this._windowSize.x
          ? MathUtils.clamp(scrollPos.x, this.rightEdge, this.leftEdge)
          : 0
    if (Math.abs(scrollPos.x - clampedX) > EPSILON) return true
    const clampedY =
      this._scrollDimensions.y === -1
        ? scrollPos.y
        : this._scrollDimensions.y > this._windowSize.y
          ? MathUtils.clamp(scrollPos.y, this.topEdge, this.bottomEdge)
          : 0
    return Math.abs(scrollPos.y - clampedY) > EPSILON
  }

  /**
   * Gets the current scroll velocity (fling velocity).
   *
   * @returns The current velocity as a vec3
   */
  public readonly getVelocity = (): vec3 => this.spring.velocity

  /**
   * Sets the scroll velocity for programmatic scrolling animations.
   *
   * @param velocity - The velocity to set in local space units per frame
   */
  public setVelocity = (velocity: vec2): void => {
    this.spring.velocity = new vec3(velocity.x, velocity.y, 0)
  }

  private isScrollSettledForEndEvent(): boolean {
    if (this.isTweeningScroll) {
      return false
    }
    if (this.isDragging) {
      return false
    }
    if (this.spring.velocity.length > EPSILON) {
      return false
    }
    const cScrollPosition = this.scrollerTransform.getLocalPosition()
    if (!this._hardStopAtEnds && this.isOutOfBounds(cScrollPosition)) {
      return false
    }
    return true
  }

  private syncScrollEndState(): void {
    if (!this._initialized) {
      return
    }
    const isSettled = this.isScrollSettledForEndEvent()
    if (!this.wasScrollSettled && isSettled) {
      this.onScrollEndEvent.invoke()
    }
    this.wasScrollSettled = isSettled
  }

  private enableChildColliders = (enable: boolean): void => {
    if (this._skipColliderManagement) return
    if (this._lastChildCollidersEnabled === enable && this._childCollidersCache !== null) return

    let childColliders = this._childCollidersCache
    if (childColliders === null) {
      childColliders = findAllComponentsInSelfOrChildren(this.sceneObject, "ColliderComponent")
      this._childCollidersCache = childColliders

      // Drop element-cache entries for colliders no longer in the subtree.
      const currentColliders = new Set(childColliders)
      for (const cachedCollider of this.colliderToElementMap.keys()) {
        if (!currentColliders.has(cachedCollider)) {
          this.colliderToElementMap.delete(cachedCollider)
        }
      }
    }

    for (let i = 0; i < childColliders.length; i++) {
      const collider = childColliders[i]
      if (isNull(collider)) continue
      if (collider === this.collider) continue

      let element = this.colliderToElementMap.get(collider)

      if (element === undefined) {
        element = getElement(collider.sceneObject.getParent())
        if (element && element.collider) {
          this.colliderToElementMap.set(element.collider, element)
        }
      }

      if (element && element.collider === collider) {
        collider.enabled = enable && element.enabled && !element.inactive
      } else {
        collider.enabled = enable
      }
    }
    this._lastChildCollidersEnabled = enable
  }

  private cancelCurrentInteractor = () => {
    this.activeInteractor = null
    this.isDragging = false
    this.interactorUpdated = false
    this.velocity = vec3.zero()
    this.dragAmount.x = 0
    this.dragAmount.y = 0
    this.interactorOffset = vec3.zero()
    this.enableChildColliders(false)
    this.scrollTweenCancel()

    this.clearVelocityHistory()

    this.spring.velocity = vec3.zero()

    if (!this._hardStopAtEnds) {
      const currentPosition = this.scrollerTransform.getLocalPosition()
      const boundsCheck = this.getClampedBoundsAndCheckOutOfBounds(currentPosition)
      if (boundsCheck.isOutOfBounds) {
        this.updateScrollerPosition(boundsCheck.clamped)
      }
    }
  }

  private cancelChildInteraction = (e: InteractableEventArgs) => {
    // Drag originated on ScrollWindow itself; no child was triggered.
    if (e.target && e.target.sceneObject === this.sceneObject) return

    const childInteractables = findAllComponentsInSelfOrChildren(this.sceneObject, Interactable.getTypeName())

    for (let i = 0; i < childInteractables.length; i++) {
      const interactable = childInteractables[i]
      if (interactable === this._interactable) continue
      interactable.triggerCanceled(e)
    }
  }

  private createEdgeFade = () => {
    this.rmv = this.sceneObject.getComponent("RenderMeshVisual") || this.sceneObject.createComponent("RenderMeshVisual")
    this.managedComponents.push(this.rmv)
    this.rmv.mesh = this.mesh
    this.material = this.material.clone()
    this.rmv.mainMaterial = this.material
  }

  // Mutates `newPosition` in place — don't pass a vec3 you intend to reuse afterward.
  private updateScrollerPosition = (newPosition: vec3): vec3 => {
    const currentPos = this.scrollerTransform.getLocalPosition()
    if (this._hardStopAtEnds) {
      if (this._scrollDimensions.y !== -1 && (newPosition.y < this.topEdge || newPosition.y > this.bottomEdge)) {
        newPosition.y = currentPos.y
      }
      if (this._scrollDimensions.x !== -1 && (newPosition.x > this.leftEdge || newPosition.x < this.rightEdge)) {
        newPosition.x = currentPos.x
      }
    }
    if (!this._horizontal) newPosition.x = currentPos.x
    if (!this._vertical) newPosition.y = currentPos.y
    newPosition.z = 0
    this.scrollerTransform.setLocalPosition(newPosition)

    this._scrollPosition.x = newPosition.x
    this._scrollPosition.y = newPosition.y

    this._scrollPosUpdatedScratch.x = newPosition.x
    this._scrollPosUpdatedScratch.y = newPosition.y
    this.onScrollPositionUpdatedEvent.invoke(this._scrollPosUpdatedScratch)
    return newPosition
  }

  private calculateAxisResistance(displacement: number, maxOverscroll: number): number {
    if (Math.abs(displacement) <= EPSILON) {
      return 0
    }

    const normalized = Math.abs(displacement) / maxOverscroll
    const curveExponent = 0.5 + EDGE_BOUNCE_STRENGTH * 0.2
    const resistanceFactor = Math.pow(1 - Math.min(normalized, 1), curveExponent)
    return Math.sign(displacement) * maxOverscroll * (1 - resistanceFactor)
  }

  private applyOverscrollResistance(displacement: vec3): vec3 {
    const maxOverscrollX = this._windowSize.x * MAX_OVERSHOOT_FACTOR
    const maxOverscrollY = this._windowSize.y * MAX_OVERSHOOT_FACTOR

    const out = this._overscrollResistScratch
    out.x = this.calculateAxisResistance(displacement.x, maxOverscrollX)
    out.y = this.calculateAxisResistance(displacement.y, maxOverscrollY)
    out.z = 0
    return out
  }

  private getPageIndexFromPosition(axis: "x" | "y", currentPosition: number): number {
    const snapSize = this.snapRegion[axis]
    if (snapSize <= 0) return 0
    const hasBounds = this._scrollDimensions[axis] !== -1

    if (hasBounds) {
      const nearEdge = axis === "x" ? this.rightEdge : this.topEdge
      const currentPageFloat = (currentPosition - nearEdge) / snapSize
      const currentPageIndex = Math.round(currentPageFloat)
      return currentPageIndex
    } else {
      const currentPageFloat = currentPosition / snapSize
      const currentPageIndex = Math.round(Math.abs(currentPageFloat)) * Math.sign(currentPageFloat)
      return currentPageIndex
    }
  }

  private shouldAccumulateAxis(accumulated: number, current: number): boolean {
    return accumulated === 0 || Math.sign(current) === Math.sign(accumulated)
  }

  private addVelocityToHistory(velocity: vec3): void {
    this.velocityHistoryHead = (this.velocityHistoryHead + VELOCITY_HISTORY_SIZE - 1) % VELOCITY_HISTORY_SIZE
    this.velocityHistoryX[this.velocityHistoryHead] = velocity.x
    this.velocityHistoryY[this.velocityHistoryHead] = velocity.y
    if (this.velocityHistoryLen < VELOCITY_HISTORY_SIZE) this.velocityHistoryLen++
  }

  private getWeightedAverageVelocity(): vec3 {
    const out = this._weightedVelocityScratch
    out.x = 0
    out.y = 0
    out.z = 0
    const len = this.velocityHistoryLen
    // Return a fresh vec3, never the scratch: accumulateVelocity retains the
    // result by reference, and the next call zeroing the scratch would wipe it.
    if (len === 0) return new vec3(0, 0, 0)

    const head = this.velocityHistoryHead
    let sumX = 0
    let sumY = 0
    for (let i = 0; i < len; i++) {
      const weight = VELOCITY_HISTORY_WEIGHTS[i] || 0
      const idx = (head + i) % VELOCITY_HISTORY_SIZE
      sumX += this.velocityHistoryX[idx] * weight
      sumY += this.velocityHistoryY[idx] * weight
    }
    const totalWeight = ScrollWindow.VELOCITY_HISTORY_WEIGHT_SUMS[len - 1]
    if (totalWeight > 0) {
      out.x = sumX / totalWeight
      out.y = sumY / totalWeight
    }
    return new vec3(out.x, out.y, out.z)
  }

  private clearVelocityHistory(): void {
    this.velocityHistoryHead = 0
    this.velocityHistoryLen = 0
  }

  private applyOverscrollIfNeeded(position: vec3): vec3 {
    if (!this._hardStopAtEnds) {
      const boundsCheck = this.getClampedBoundsAndCheckOutOfBounds(position)
      if (boundsCheck.isOutOfBounds) {
        const overshootAmount = position.sub(boundsCheck.clamped)
        const overshootWithResistance = this.applyOverscrollResistance(overshootAmount)
        return boundsCheck.clamped.add(overshootWithResistance)
      }
    }
    return position
  }

  private updateVelocityFromPosition(newPosition: vec3): void {
    const newVelocity = newPosition.sub(this.lastPosition)
    newVelocity.z = 0
    if (
      Math.abs(newVelocity.x) > SIGNIFICANT_VELOCITY_THRESHOLD ||
      Math.abs(newVelocity.y) > SIGNIFICANT_VELOCITY_THRESHOLD
    ) {
      this.velocity.x = this.velocity.x * (1 - VELOCITY_SMOOTHING) + newVelocity.x * VELOCITY_SMOOTHING
      this.velocity.y = this.velocity.y * (1 - VELOCITY_SMOOTHING) + newVelocity.y * VELOCITY_SMOOTHING
      this.velocity.z = 0

      this.addVelocityToHistory(this.velocity)
    }
    this.lastPosition = newPosition
  }

  private resetDragState(): void {
    this.startPosition = this.scrollerTransform.getLocalPosition()
    this.lastPosition = this.startPosition
    this.interactorOffset = vec3.zero()
    this.velocity = vec3.zero()
    this.interactorUpdated = false
    this.dragAmount.x = 0
    this.dragAmount.y = 0

    this.clearVelocityHistory()

    if (this._scrollSnapping) {
      this.committedSnapTarget.x = null
      this.committedSnapTarget.y = null
      this.startingPageIndex.x = this.getPageIndexFromPosition("x", this.startPosition.x)
      this.startingPageIndex.y = this.getPageIndexFromPosition("y", this.startPosition.y)
    }
  }

  private applyAccumulatedVelocity(): void {
    const predictedVelocity = this.getWeightedAverageVelocity()

    this.accumulateVelocity(predictedVelocity)

    const fling = this.accumulatedVelocity.uniformScale(FLING_MULTIPLIER)
    fling.z = 0
    this.spring.velocity = fling
  }

  private accumulateVelocity(currentVelocity: vec3): void {
    const currentTime = getTime() * 1000
    const timeSinceLastGesture = currentTime - this.lastGestureEndTime

    if (timeSinceLastGesture > GESTURE_ACCUMULATION_TIME_MS) {
      this.accumulatedVelocity = currentVelocity
      this.lastGestureEndTime = currentTime
      return
    }

    const timeFactor = 1 - timeSinceLastGesture / GESTURE_ACCUMULATION_TIME_MS
    const decayFactor = VELOCITY_DECAY_FACTOR * timeFactor

    this.accumulatedVelocity.x = this.shouldAccumulateAxis(this.accumulatedVelocity.x, currentVelocity.x)
      ? this.accumulatedVelocity.x * decayFactor + currentVelocity.x
      : currentVelocity.x

    this.accumulatedVelocity.y = this.shouldAccumulateAxis(this.accumulatedVelocity.y, currentVelocity.y)
      ? this.accumulatedVelocity.y * decayFactor + currentVelocity.y
      : currentVelocity.y

    this.accumulatedVelocity.z = 0

    this.lastGestureEndTime = currentTime
  }

  private processFrictionScrolling(
    axis: "x" | "y",
    currentPosition: vec3,
    clampedPosition: vec3
  ): {position: vec3; shouldUpdate: boolean} {
    const isHorizontal = axis === "x"
    const velocity = isHorizontal ? this.spring.velocityX : this.spring.velocityY
    const otherAxisVelocity = isHorizontal ? this.spring.velocityY : this.spring.velocityX
    const out = this._frictionPositionScratch
    out.x = currentPosition.x
    out.y = currentPosition.y
    out.z = 0

    if (Math.abs(velocity) > MINIMUM_SCROLLING_VELOCITY) {
      const newVelocity = velocity * FRICTION_FACTOR
      const v = this._springVelocityScratch
      v.x = isHorizontal ? newVelocity : otherAxisVelocity
      v.y = isHorizontal ? otherAxisVelocity : newVelocity
      v.z = 0
      this.spring.velocity = v

      if (isHorizontal) out.x += newVelocity
      else out.y += newVelocity

      return {position: out, shouldUpdate: true}
    } else if (Math.abs(velocity) > 0) {
      const v = this._springVelocityScratch
      v.x = isHorizontal ? 0 : otherAxisVelocity
      v.y = isHorizontal ? otherAxisVelocity : 0
      v.z = 0
      this.spring.velocity = v

      const clampedValue = isHorizontal ? clampedPosition.x : clampedPosition.y
      if (isHorizontal) out.x = clampedValue
      else out.y = clampedValue

      return {position: out, shouldUpdate: true}
    }

    return {position: currentPosition, shouldUpdate: false}
  }

  private processSnapScrolling(axis: "x" | "y", currentPosition: vec3): {position: vec3; shouldUpdate: boolean} {
    const isHorizontal = axis === "x"
    const snapSize = this.snapRegion[axis]
    const currentAxisPosition = this.scrollPosition[axis]

    const velocity = isHorizontal ? this.spring.velocityX : this.spring.velocityY

    let targetPos = this.committedSnapTarget[axis]

    if (targetPos === null) {
      const currentPageIndex = this.getPageIndexFromPosition(axis, currentAxisPosition)
      const startPageIndex = this.startingPageIndex[axis]
      const hasBounds = this._scrollDimensions[axis] !== -1

      let startingPagePosition: number
      if (hasBounds) {
        const nearEdge = isHorizontal ? this.rightEdge : this.topEdge
        startingPagePosition = nearEdge + startPageIndex * snapSize
      } else {
        startingPagePosition = startPageIndex * snapSize
      }
      const distanceFromStart = Math.abs(currentAxisPosition - startingPagePosition)

      // Deadzone is one-quarter of a page; movement below it snaps back to the starting page.
      const hasExceededDeadzone = distanceFromStart > snapSize / 4

      let targetPageIndex = currentPageIndex

      if (hasExceededDeadzone && Math.abs(velocity) > MINIMUM_SCROLLING_VELOCITY) {
        const velocitySign = Math.sign(velocity)
        const normalizedVelocity = Math.abs(velocity) / snapSize

        // ceil ensures even small flicks advance at least one page
        const pageJump = Math.ceil(normalizedVelocity) * velocitySign
        targetPageIndex = currentPageIndex + pageJump
      } else if (!hasExceededDeadzone) {
        targetPageIndex = startPageIndex
      }

      if (this._maxSnapOne) {
        targetPageIndex = MathUtils.clamp(targetPageIndex, startPageIndex - 1, startPageIndex + 1)
      }

      if (hasBounds) {
        const nearEdge = isHorizontal ? this.rightEdge : this.topEdge
        const farEdge = isHorizontal ? this.leftEdge : this.bottomEdge
        const maxValidPageIndex = Math.floor((farEdge - nearEdge) / snapSize)
        targetPageIndex = MathUtils.clamp(targetPageIndex, 0, maxValidPageIndex)
      }

      if (hasBounds) {
        const nearEdge = isHorizontal ? this.rightEdge : this.topEdge
        targetPos = nearEdge + targetPageIndex * snapSize
      } else {
        targetPos = targetPageIndex * snapSize
      }

      this.committedSnapTarget[axis] = targetPos
    }

    const distanceToTarget = targetPos - currentAxisPosition

    if (Math.abs(distanceToTarget) > EPSILON) {
      const targetPosition = this._snapTargetScratch
      const newPosition = this._snapPositionScratch
      // Cross-axis target == current so spring.evaluate acts only on the active axis.
      if (isHorizontal) {
        targetPosition.x = targetPos
        targetPosition.y = currentPosition.y
      } else {
        targetPosition.x = currentPosition.x
        targetPosition.y = targetPos
      }
      targetPosition.z = 0
      newPosition.x = currentPosition.x
      newPosition.y = currentPosition.y
      newPosition.z = 0
      this.spring.evaluate(currentPosition, targetPosition, newPosition)

      return {position: newPosition, shouldUpdate: true}
    } else {
      this.committedSnapTarget[axis] = null

      const v = this._springVelocityScratch
      v.x = isHorizontal ? 0 : this.spring.velocityX
      v.y = isHorizontal ? this.spring.velocityY : 0
      v.z = 0
      this.spring.velocity = v

      return {position: currentPosition, shouldUpdate: false}
    }
  }

  private update = () => {
    if (this.scrollingPaused) return

    if (this._isControlledExternally) {
      return
    }

    if (this.isTweeningScroll) {
      this.syncScrollEndState()
      return
    }

    if (!this.isDragging) {
      const velocity = this.spring.velocity
      const hasVelocity = velocity.length > EPSILON

      if (!hasVelocity) {
        const cScrollPosition = this.scrollerTransform.getLocalPosition()
        const isOutOfBounds = !this._hardStopAtEnds && this.isOutOfBounds(cScrollPosition)

        if (!isOutOfBounds) {
          this.syncScrollEndState()
          return
        }
      }
    }

    const scale = this.transform.getWorldScale()
    const np = this._frustumNearPlaneScratch
    np.x = (this.screenTransform.anchors.right - this.screenTransform.anchors.left) * scale.x
    np.y = (this.screenTransform.anchors.top - this.screenTransform.anchors.bottom) * scale.y
    this.frustum.setFromNearPlane(this.camera, this.cameraComponent.far, np, this.transform)

    if (this.debugRender) {
      this.frustum.render()
    }

    if (this._horizontal || this._vertical) {
      if (!this.isDragging && !this._hardStopAtEnds) {
        let cScrollPosition = this.scrollerTransform.getLocalPosition()
        const boundsCheck = this.getClampedBoundsAndCheckOutOfBounds(cScrollPosition)

        if (boundsCheck.isOutOfBounds) {
          this.spring.evaluate(cScrollPosition, boundsCheck.clamped, cScrollPosition)

          const boundsCheckAfterSpring = this.getClampedBoundsAndCheckOutOfBounds(cScrollPosition)
          if (!boundsCheckAfterSpring.isOutOfBounds) {
            this.updateScrollerPosition(boundsCheck.clamped)
            this.spring.velocity = vec3.zero()
          } else {
            this.updateScrollerPosition(cScrollPosition)
          }
        } else {
          let shouldUpdatePosition = false

          if (this._horizontal) {
            if (this.scrollSnapping && this.snapRegion.x > 0) {
              const result = this.processSnapScrolling("x", cScrollPosition)
              cScrollPosition.x = result.position.x
              shouldUpdatePosition = shouldUpdatePosition || result.shouldUpdate
            } else {
              const result = this.processFrictionScrolling("x", cScrollPosition, boundsCheck.clamped)
              cScrollPosition = result.position
              shouldUpdatePosition = shouldUpdatePosition || result.shouldUpdate
            }
          }
          if (this._vertical) {
            if (this.scrollSnapping && this.snapRegion.y > 0) {
              const result = this.processSnapScrolling("y", cScrollPosition)
              cScrollPosition.y = result.position.y
              shouldUpdatePosition = shouldUpdatePosition || result.shouldUpdate
            } else {
              const result = this.processFrictionScrolling("y", cScrollPosition, boundsCheck.clamped)
              cScrollPosition = result.position
              shouldUpdatePosition = shouldUpdatePosition || result.shouldUpdate
            }
          }

          if (shouldUpdatePosition) {
            this.updateScrollerPosition(cScrollPosition)
          }
        }
      }
    }

    this.syncScrollEndState()
  }
}
