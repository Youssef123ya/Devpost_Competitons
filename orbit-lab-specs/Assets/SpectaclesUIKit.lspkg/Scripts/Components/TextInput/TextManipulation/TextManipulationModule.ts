import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorCursor} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractorCursor/InteractorCursor"
import {Interactor, TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {DragInteractorEvent, InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {CursorControllerProvider} from "SpectaclesInteractionKit.lspkg/Providers/CursorControllerProvider/CursorControllerProvider"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {
  getCursorIndexFromUtf16Index,
  getUtf16IndexFromCursorIndex,
  isAtLineEnd,
  isAtLineStart,
  trimLinesWithCaretAdjustment,
  trimOuterWhitespaceFromCursorRange
} from "../../../../Scripts/Utility/TextManipulationUtils"
import {OpacityControllable} from "../../../Interfaces/OpacityControllable"
import {TextGeometryResolver} from "./TextGeometryResolver"
import {TextHighlightTracker} from "./TextHighlightTracker"
import {CaretRenderer, CARET_DEFAULT_COLOR} from "./Visuals/CaretRenderer"
import type {HandleDragUpdateEvent, HandleSide} from "./Visuals/GrabHandle"
import {GrabHandle, HANDLE_ACTIVE_COLOR, HANDLE_DEFAULT_COLOR} from "./Visuals/GrabHandle"
import type {HighlightRect} from "./Visuals/HighlightRenderer"
import {HighlightRenderer, HIGHLIGHT_DEFAULT_COLOR} from "./Visuals/HighlightRenderer"

const CARET_DRAG_SENSITIVITY: vec2 = new vec2(1, 1.3)

const INTERNAL_COLLIDER_DEPTH = 0.1
const SCREEN_RECT_CORNERS: vec2[] = [new vec2(-1, -1), new vec2(-1, 1), new vec2(1, -1), new vec2(1, 1)]

type LogicalHandleType = "start" | "end"
type HighlightHandleDragEvent = {
  type: LogicalHandleType
  index: number
}

/**
 * Payload emitted by {@link TextManipulationModule.onTextUpdated} whenever the module
 * replaces text programmatically (e.g. paste, cut, delete-selection).
 *
 * Carrying the authoritative UTF-16 character indices alongside the new text lets
 * subscribers forward them to downstream sinks (e.g. the system keyboard) without
 * converting through cursor positions, which can be briefly stale while the Lens
 * `Text` component has not yet re-rendered the new string.
 */
export interface TextManipulationTextUpdate {
  /** The new text string. */
  text: string
  /** Caret position in UTF-16 character units, valid for `text`. */
  caretCharIndex: number
  /** Start of highlight in UTF-16 character units. Undefined when caret is collapsed. */
  highlightStartCharIndex?: number
  /** End of highlight in UTF-16 character units. Undefined when caret is collapsed. */
  highlightEndCharIndex?: number
}

export type TextGeometryRefreshReasons = {
  fromText?: boolean
  fromFont?: boolean
  fromFontSize?: boolean
  fromAnchors?: boolean
  fromTextOffset?: boolean
  fromAlignment?: boolean
  fromOverflow?: boolean
  updateTextLayout?: boolean
}

export interface TextManipulationRefreshReasons extends TextGeometryRefreshReasons {
  text?: string
  fromTextComponentBounds?: boolean
}

@component
export class TextManipulationModule extends BaseScriptComponent implements OpacityControllable {
  @input
  @allowUndefined
  @hint("The Text component to manipulate")
  private _textComponent: Text

  @input
  @allowUndefined
  @ui.label(
    '<span style="color: #94A3B8; font-size: 11px;">Optional interaction target. If not provided, one is generated internally.</span>'
  )
  private _interactable: Interactable

  @ui.separator
  @input
  @ui.label(
    '<span style="color: #94A3B8; font-size: 11px;">Controls caret visibility for editable text interactions</span>'
  )
  @hint("Whether the text can be edited")
  private _isEditable: boolean = false

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Color Properties</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Text manipulation visual colors</span>')
  @input("vec4", "{0.317006,0.450004,0.4,1}")
  @showIf("_isEditable", true)
  @hint("Color of the caret.")
  @widget(new ColorWidget())
  private _caretColor: vec4 = CARET_DEFAULT_COLOR

  @input("vec4", "{0.317998,0.450004,0.396002,0.4}")
  @hint("Color of selected text highlights.")
  @widget(new ColorWidget())
  private _highlightColor: vec4 = HIGHLIGHT_DEFAULT_COLOR

  @input("vec4", "{0.333333,0.45098,0.396078,0.4}")
  @hint("Default color of selection grab handles.")
  @widget(new ColorWidget())
  private _grabHandleColor: vec4 = HANDLE_DEFAULT_COLOR

  @input("vec4", "{1,1,1,0.4}")
  @hint("Active hover and drag color of selection grab handles.")
  @widget(new ColorWidget())
  private _grabHandleActiveColor: vec4 = HANDLE_ACTIVE_COLOR

  private geometryResolver: TextGeometryResolver = null
  private caretRenderer: CaretRenderer = null
  private textHighlightTracker: TextHighlightTracker = null
  private leftHandle: GrabHandle = null
  private rightHandle: GrabHandle = null
  private highlightRenderer: HighlightRenderer = null
  private _leftHandleAnchorSide: HandleSide = "left"

  private _boundingBox: Rect | null = null
  private _cursorPositions: CursorPosition[] | null = null
  private _cursorHeight: number = 0
  private _pendingBoundingBoxUpdate: boolean = false
  private _pendingCursorPositionsUpdate: boolean = false

  private dragStartPosition: vec3 | null = null
  private _caretIndex: number = 0

  private _active: boolean = true
  private _opacity: number = 1
  private isTouchingHighlight: boolean = false

  private readonly hiddenInteractorCursors: Map<Interactor, InteractorCursor> = new Map()

  private caretUpdateEvent: UpdateEvent = null
  private _batchUpdateEvent: SceneEvent = null
  private isFlushingBatchedUpdates: boolean = false
  private _caretDirty: boolean = false
  private _highlightDirty: boolean = false
  private _lastHighlightText: string = ""
  private _textDirty: boolean = false
  private _text: string | undefined = undefined
  private _caretVisibilityDirty: boolean = false
  private _isCaretVisible: boolean = false
  private _caretCharIndex: number | null = null
  private _blinkResetPending: boolean = false
  private _pendingBlinkState: "pause" | "resume" | null = null

  private initialized: boolean = false
  private destroyed: boolean = false
  private textComponentUnsubscribes: (() => void)[] = []
  private interactableUnsubscribes: (() => void)[] = []
  private internalColliderObject: SceneObject | null = null
  private internalCollider: ColliderComponent | null = null
  private internalColliderShape: BoxShape | null = null
  private internalInteractable: Interactable | null = null
  private readonly internalColliderSize: vec3 = vec3.zero()
  private readonly internalColliderPosition: vec3 = vec3.zero()

  private readonly onCursorPositionsUpdatedEvent: ReplayEvent<CursorPosition[]> = new ReplayEvent<CursorPosition[]>()
  /**
   * Event replaying the latest cursor position list whenever text geometry is refreshed.
   */
  public readonly onCursorPositionsUpdated = this.onCursorPositionsUpdatedEvent.publicApi()
  private readonly onTextBoundingBoxUpdatedEvent: ReplayEvent<Rect> = new ReplayEvent<Rect>()
  /**
   * Event replaying the latest text bounding box whenever the Text component bounds are refreshed.
   */
  public readonly onTextBoundingBoxUpdated = this.onTextBoundingBoxUpdatedEvent.publicApi()
  private readonly onCursorHeightUpdatedEvent: ReplayEvent<number> = new ReplayEvent<number>()
  /**
   * Event replaying the latest cursor height whenever font metrics are refreshed.
   */
  public readonly onCursorHeightUpdated = this.onCursorHeightUpdatedEvent.publicApi()
  private readonly onInitializedEvent: ReplayEvent<void> = new ReplayEvent<void>()
  /**
   * Event replayed after the module has created its caret, highlight, and interaction dependencies.
   */
  public readonly onInitialized = this.onInitializedEvent.publicApi()

  private readonly onTextUpdatedEvent: Event<TextManipulationTextUpdate> = new Event<TextManipulationTextUpdate>()
  /**
   * Event fired when the module changes text through selection actions such as paste or cut.
   */
  public readonly onTextUpdated = this.onTextUpdatedEvent.publicApi()
  private readonly onCaretIndexChangedEvent: Event<number> = new Event<number>()
  /**
   * Event fired when the caret cursor index changes.
   */
  public readonly onCaretIndexChanged = this.onCaretIndexChangedEvent.publicApi()
  private readonly onHighlightUpdatedEvent: Event<string> = new Event<string>()
  /**
   * Event fired when highlighted text changes. Emits an empty string when highlighting clears.
   */
  public readonly onHighlightUpdated = this.onHighlightUpdatedEvent.publicApi()

  // Internal events
  private readonly onCaretDraggedEvent: Event<number> = new Event<number>()
  /**
   * Event fired while dragging the caret. The payload is the current cursor index.
   */
  public readonly onCaretDragged = this.onCaretDraggedEvent.publicApi()
  private readonly dragEventPayload: HighlightHandleDragEvent = {type: "start", index: 0}
  private readonly onHighlightHandleDraggedEvent: Event<HighlightHandleDragEvent> =
    new Event<HighlightHandleDragEvent>()
  /**
   * Event fired while dragging a highlight handle, including the logical handle side and cursor index.
   */
  public readonly onHighlightHandleDragged = this.onHighlightHandleDraggedEvent.publicApi()

  /**
   * Gets whether text manipulation visuals and interactions are active.
   * @returns `true` when caret, highlight, and interaction updates are enabled.
   */
  public get active(): boolean {
    return this._active
  }

  /**
   * Sets whether text manipulation visuals and interactions are active.
   * Disabling this hides the caret and clears any highlight after initialization.
   * @param active - `true` to enable text manipulation, `false` to disable it.
   */
  public set active(active: boolean) {
    if (this._active === active) return

    this._active = active
    if (this.initialized) {
      this.applyActiveVisualState()
    }
  }

  /**
   * Opacity multiplier applied to caret, highlight, and grab handle visuals.
   */
  public get opacity(): number {
    return this._opacity
  }

  /**
   * @param opacity - Opacity multiplier. Values are intentionally not clamped.
   * @see opacity
   */
  public set opacity(opacity: number) {
    if (opacity === undefined) return

    this._opacity = opacity
    this.applyOpacityToVisuals()
  }

  /**
   * Gets the Text component whose geometry and content this module manipulates.
   * @returns The bound Text component.
   */
  public get textComponent(): Text {
    return this._textComponent
  }

  /**
   * Sets the Text component whose geometry and content this module manipulates.
   * Rebinds geometry, collider, caret, and highlight dependencies after initialization.
   * @param textComponent - The Text component to manipulate.
   * @throws If `textComponent` is null or undefined.
   */
  public set textComponent(textComponent: Text) {
    if (!textComponent) {
      throw new Error(`TextManipulationModule textComponent cannot be null or undefined on ${this.sceneObject.name}`)
    }
    if (this._textComponent === textComponent) return

    this._textComponent = textComponent
    if (this.initialized) {
      const usingInternalInteractable = this._interactable === this.internalInteractable
      if (usingInternalInteractable) {
        this.syncInternalColliderParent()
        this.updateInternalCollider()
      }
      this.onTextComponentSet()
    }
  }

  /**
   * Gets the interaction target used for text gestures.
   * @returns The configured Interactable, or the internally generated one after initialization.
   */
  public get interactable(): Interactable {
    return this._interactable
  }

  /**
   * Sets the interaction target used for text gestures.
   * Replaces the internally generated interactable when a custom target is provided.
   * @param interactable - The Interactable that should receive text manipulation gestures.
   */
  public set interactable(interactable: Interactable) {
    if (!interactable) return
    if (this._interactable === interactable) return

    if (this.initialized) {
      const replacingInternalInteractable = this.internalInteractable && interactable !== this.internalInteractable
      if (replacingInternalInteractable) {
        this.releaseInteractableDependencies()
        this.destroyInternalInteractable()
      }
    }

    this._interactable = interactable
    if (this.initialized) {
      this.onInteractableSet()
    }
  }

  /**
   * Gets whether editing-only visuals such as the caret are enabled.
   * @returns `true` when caret rendering and edit interactions are allowed.
   */
  public get isEditable(): boolean {
    return this._isEditable
  }

  /**
   * Sets whether editing-only visuals such as the caret are enabled.
   * Enabling this after initialization creates the caret renderer when dependencies are ready.
   * @param isEditable - `true` to enable editable caret behavior.
   */
  public set isEditable(isEditable: boolean) {
    if (this._isEditable === isEditable) return

    this._isEditable = isEditable
    if (this.initialized) {
      if (!this.areTextDependenciesReady()) return
      if (this._isEditable) {
        this.ensureCaretRenderer()
      }
      if (this._active && this._isEditable) {
        this.showCaret()
      } else {
        this.hideCaret()
      }
    }
  }

  /**
   * Gets the caret visual color.
   * @returns The caret color as an RGBA vector.
   */
  public get caretColor(): vec4 {
    return this._caretColor
  }

  /**
   * Sets the caret visual color and applies it to the active caret renderer.
   * @param color - The new caret color as an RGBA vector.
   */
  public set caretColor(color: vec4) {
    if (color === undefined) return

    this._caretColor = color
    if (this.caretRenderer) {
      this.caretRenderer.color = this.getOpacityAdjustedColor(color)
    }
  }

  /**
   * Gets the selected-text highlight color.
   * @returns The highlight color as an RGBA vector.
   */
  public get highlightColor(): vec4 {
    return this._highlightColor
  }

  /**
   * Sets the selected-text highlight color and applies it to the active highlight renderer.
   * @param color - The new highlight color as an RGBA vector.
   */
  public set highlightColor(color: vec4) {
    if (color === undefined) return

    this._highlightColor = color
    if (this.highlightRenderer) {
      this.highlightRenderer.color = this.getOpacityAdjustedColor(color)
    }
  }

  /**
   * Gets the default selection grab handle color.
   * @returns The inactive grab handle color as an RGBA vector.
   */
  public get grabHandleColor(): vec4 {
    return this._grabHandleColor
  }

  /**
   * Sets the default selection grab handle color.
   * @param color - The inactive grab handle color as an RGBA vector.
   */
  public set grabHandleColor(color: vec4) {
    if (color === undefined) return

    this._grabHandleColor = color
    this.applyGrabHandleColors()
  }

  /**
   * Gets the active hover and drag color for selection grab handles.
   * @returns The active grab handle color as an RGBA vector.
   */
  public get grabHandleActiveColor(): vec4 {
    return this._grabHandleActiveColor
  }

  /**
   * Sets the active hover and drag color for selection grab handles.
   * @param color - The active grab handle color as an RGBA vector.
   */
  public set grabHandleActiveColor(color: vec4) {
    if (color === undefined) return

    this._grabHandleActiveColor = color
    this.applyGrabHandleColors()
  }

  /**
   * Gets the current caret position in Text cursor-position units.
   * @returns The current caret cursor index.
   */
  public get caretIndex(): number {
    return this._caretIndex
  }

  /**
   * Sets the current caret position in Text cursor-position units.
   * The value is clamped to the available cursor positions before the caret is marked dirty.
   * @param index - The desired caret cursor index.
   */
  public set caretIndex(index: number) {
    const newCaretIndex = this.getClampedCaretIndex(index)
    if (this._caretIndex !== newCaretIndex) {
      this._caretIndex = newCaretIndex
      this.markCaretDirty()
    }
  }

  /**
   * Gets the caret position in UTF-16 character units for the current text.
   * @returns The current caret character index, or 0 when it cannot be resolved.
   */
  public get caretCharIndex(): number {
    const charIndex = getUtf16IndexFromCursorIndex(this.caretIndex, this.cursorPositions, this._text)
    if (charIndex === undefined) return 0
    return charIndex
  }

  /**
   * Gets whether any text is currently highlighted.
   * @returns `true` when a non-empty highlight range is active.
   */
  public get isHighlighted(): boolean {
    if (!this.textHighlightTracker) return false

    return this.textHighlightTracker.isHighlighted
  }

  /**
   * Gets the highlight start in UTF-16 character units.
   * @returns The highlighted range start, or undefined when there is no highlight.
   */
  public get highlightStartCharIndex(): number | undefined {
    if (!this.textHighlightTracker) return undefined

    return this.textHighlightTracker.startCharIndex
  }

  /**
   * Gets the highlight end in UTF-16 character units.
   * @returns The highlighted range end, or undefined when there is no highlight.
   */
  public get highlightEndCharIndex(): number | undefined {
    if (!this.textHighlightTracker) return undefined

    return this.textHighlightTracker.endCharIndex
  }

  /**
   * Gets the most recently measured text bounding box.
   * @returns The cached text bounds, or null before measurement succeeds.
   */
  public get boundingBox(): Rect | null {
    return this._boundingBox
  }

  /**
   * Gets the most recently measured Text cursor positions.
   * @returns The cached cursor position array, or null before measurement succeeds.
   */
  public get cursorPositions(): CursorPosition[] | null {
    return this._cursorPositions
  }

  /**
   * Gets the most recently measured cursor height.
   * @returns The cached cursor height.
   */
  public get cursorHeight(): number {
    return this._cursorHeight
  }

  /**
   * Highlights all editable text.
   * @returns `true` if the highlight was applied.
   */
  public setHighlightAll(): boolean {
    if (!this._active) return false
    if (!this.textHighlightTracker) return false
    return this.setHighlightByCharIndex(0, this._text.length)
  }

  /**
   * Highlights a range of text using UTF-16 character indices.
   * Passing equal indices clears the current highlight and moves the caret to that index.
   * @param startCharIndex - Inclusive highlight start in UTF-16 character units.
   * @param endCharIndex - Exclusive highlight end in UTF-16 character units.
   * @returns `true` if the highlight state was updated.
   */
  public setHighlightByCharIndex(startCharIndex: number, endCharIndex: number): boolean {
    if (!this._active) return false
    if (!this.textHighlightTracker) return false

    if (startCharIndex === endCharIndex) {
      this.clearHighlight()
      this.showCaret()
      this._caretCharIndex = startCharIndex
      this.batchUpdate()
      return true
    }

    const startCursor = getCursorIndexFromUtf16Index(startCharIndex, this.cursorPositions, this._text, true)
    const endCursor = getCursorIndexFromUtf16Index(endCharIndex, this.cursorPositions, this._text, false)

    if (startCursor !== undefined && endCursor !== undefined) {
      this.textHighlightTracker.updateHighlightByRange(startCursor, endCursor)
      this.hideCaret()
      this.markHighlightDirty()
      return true
    }
    return false
  }

  // For Copying
  /**
   * Gets the currently highlighted text.
   * @returns The highlighted substring, or an empty string when no text is highlighted.
   */
  public getHighlightedText(): string {
    if (!this._active) return ""
    if (!this.textHighlightTracker) return ""
    if (!this.textHighlightTracker.isHighlighted) return ""

    const charStartIndex = getUtf16IndexFromCursorIndex(
      this.textHighlightTracker.startCursorIndex,
      this.cursorPositions,
      this._text
    )
    const charEndIndex = getUtf16IndexFromCursorIndex(
      this.textHighlightTracker.endCursorIndex,
      this.cursorPositions,
      this._text
    )
    if (charStartIndex === undefined || charEndIndex === undefined) {
      return ""
    }
    return this._text.substring(charStartIndex, charEndIndex)
  }

  // For Cutting
  /**
   * Removes the currently highlighted text.
   * @returns `true` if highlighted text was removed.
   */
  public removeHighlightedText(): boolean {
    if (!this._active) return false
    return this.replaceHighlightedText("")
  }

  // For Pasting
  /**
   * Replaces the highlighted text, or inserts at the caret when there is no highlight.
   * @param textToPaste - The text to insert.
   * @returns `true` if the text replacement was staged.
   */
  public replaceHighlightedText(textToPaste: string): boolean {
    if (!this._active) return false
    if (!this.textHighlightTracker) return false

    let newText: string
    let newCaretCharPos: number

    if (this.cursorPositions && this.cursorPositions.length > 0) {
      if (this.textHighlightTracker.isHighlighted) {
        // Replace highlight with pasted text
        const range = this.textHighlightTracker.getHighlight()
        if (range) {
          const charStartIndex = getUtf16IndexFromCursorIndex(range.cursorStart, this.cursorPositions, this._text)
          const charEndIndex = getUtf16IndexFromCursorIndex(range.cursorEnd, this.cursorPositions, this._text)

          if (charStartIndex === undefined || charEndIndex === undefined) return false

          newText = this._text.slice(0, charStartIndex) + textToPaste + this._text.slice(charEndIndex)
          newCaretCharPos = charStartIndex + textToPaste.length
          this.clearHighlight()
        } else {
          return false
        }
      } else {
        // Insert at caret position
        const charIndex = getUtf16IndexFromCursorIndex(this._caretIndex, this.cursorPositions, this._text)
        if (charIndex === undefined) return false

        newText = this._text.slice(0, charIndex) + textToPaste + this._text.slice(charIndex)
        newCaretCharPos = charIndex + textToPaste.length
      }
    } else {
      newText = textToPaste
      newCaretCharPos = textToPaste.length
    }

    // Trim whitespace from each line (Text component doesn't support cursor positions for them)
    const trimmed = trimLinesWithCaretAdjustment(newText, newCaretCharPos)
    this.updateText(trimmed.text, trimmed.charPos)
    if (this._isEditable) {
      this.showCaret()
    }

    return true
  }

  /**
   * Refreshes the cached text bounding box from the Text component.
   * This is intended for internal text input geometry maintenance.
   * If Lens Studio rate-limits the query, the update is retried in the next batch flush.
   */
  public updateBoundingBox() {
    if (!this._textComponent) return

    let boundingBox: Rect
    try {
      boundingBox = this._textComponent.getBoundingBox()
    } catch {
      // getBoundingBox has a per-frame rate limit; retry next batch flush.
      this.requestBoundingBoxUpdate()
      return
    }

    this.boundingBox = boundingBox
  }

  /**
   * Refreshes cached cursor positions from the Text component.
   * This is intended for internal text input geometry maintenance.
   * If Lens Studio rate-limits the query, the update is retried in the next batch flush.
   */
  public updateCursorPositions() {
    if (!this._textComponent) return

    let cursorPositions: CursorPosition[]
    try {
      cursorPositions = this._textComponent.getCursorPositions()
    } catch {
      // getCursorPositions has a per-frame rate limit; retry next batch flush.
      this.requestCursorPositionsUpdate()
      return
    }

    this.cursorPositions = cursorPositions
  }

  /**
   * Refreshes the cached cursor height from the Text component.
   * This is intended for internal text input geometry maintenance.
   */
  public updateCursorHeight() {
    if (!this._textComponent) return

    this.cursorHeight = this._textComponent.getCursorHeight()
  }

  private requestBoundingBoxUpdate(): void {
    this._pendingBoundingBoxUpdate = true
    this.batchUpdate()
  }

  private requestCursorPositionsUpdate(): void {
    this._pendingCursorPositionsUpdate = true
    this.batchUpdate()
  }

  /**
   * Refreshes text manipulation geometry and visual state for the supplied change reasons.
   * @param reasons - Flags describing which text, layout, font, or bounds changes occurred.
   */
  public refresh(reasons: TextManipulationRefreshReasons): void {
    let textChanged = false
    if (reasons.text !== undefined) {
      textChanged = reasons.text !== this._text
      this._text = reasons.text
    }

    if (reasons.fromTextComponentBounds === true) {
      this.updateInternalCollider()
    }

    if (!this.areTextDependenciesReady()) {
      return
    }

    let shouldUpdateBoundingBox = false
    let shouldUpdateCursorPositions = false
    let shouldUpdateCursorHeight = false

    if (reasons.text !== undefined) {
      shouldUpdateBoundingBox = true
      shouldUpdateCursorPositions = true

      if (textChanged && this.isHighlighted) {
        this.clearHighlight()
        this.showCaret()
      }
    }

    if (reasons.fromText === true) {
      shouldUpdateBoundingBox = true
      shouldUpdateCursorPositions = true
    }

    if (reasons.fromFont === true || reasons.fromFontSize === true) {
      shouldUpdateCursorHeight = true
      shouldUpdateBoundingBox = true
      shouldUpdateCursorPositions = true
    }

    if (reasons.fromAnchors === true || reasons.fromAlignment === true || reasons.fromOverflow === true) {
      shouldUpdateBoundingBox = true
      shouldUpdateCursorPositions = true
    }

    if (reasons.fromTextOffset === true) {
      shouldUpdateCursorPositions = true
    }

    if (shouldUpdateCursorHeight) {
      this.updateCursorHeight()
    }
    if (shouldUpdateBoundingBox) {
      this.updateBoundingBox()
    }
    if (shouldUpdateCursorPositions) {
      this.requestCursorPositionsUpdate()
    }
  }

  /**
   * Sets up Lens lifecycle events for initialization, destruction, caret updates, and batch flushing.
   */
  public onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.initialize())
    this.createEvent("OnDestroyEvent").bind(() => this.onDestroy())

    this.caretUpdateEvent = this.createEvent("UpdateEvent")
    this.caretUpdateEvent.enabled = false

    this._batchUpdateEvent = this.createEvent("LateUpdateEvent")
    this._batchUpdateEvent.enabled = false
    this._batchUpdateEvent.bind(() => this.flushBatchedUpdates())
  }

  private initialize(): void {
    if (this.initialized || this.destroyed) return

    this.validateTextComponent()
    this.ensureInteractable()

    this.onTextComponentSet()
    this.onInteractableSet()
    this.initialized = true
    this.onInitializedEvent.invoke()
  }

  private onDestroy(): void {
    if (this.destroyed) return

    this.destroyed = true
    this.initialized = false
    this.releaseInteractableDependencies()
    this.destroyInternalInteractable()
    this.releaseTextComponentDependencies()

    if (this._batchUpdateEvent) {
      this._batchUpdateEvent.enabled = false
    }
    if (this.caretUpdateEvent) {
      this.caretUpdateEvent.enabled = false
    }
  }

  private onTextComponentSet(): void {
    this.releaseTextComponentDependencies()

    if (!this._textComponent || !this.caretUpdateEvent) return

    this.geometryResolver = new TextGeometryResolver(this._textComponent, this.onCursorPositionsUpdated)
    if (this._isEditable) {
      this.ensureCaretRenderer()
    }
    this.textHighlightTracker = new TextHighlightTracker(this._textComponent, this.onCursorPositionsUpdated)

    const renderOrder = this._textComponent.getRenderOrder()
    const parent = this._textComponent.getSceneObject()

    this.leftHandle = new GrabHandle(
      parent,
      renderOrder,
      "left",
      this.getOpacityAdjustedColor(this._grabHandleColor),
      this.getOpacityAdjustedColor(this._grabHandleActiveColor)
    )
    this.rightHandle = new GrabHandle(
      parent,
      renderOrder,
      "right",
      this.getOpacityAdjustedColor(this._grabHandleColor),
      this.getOpacityAdjustedColor(this._grabHandleActiveColor)
    )

    this.highlightRenderer = new HighlightRenderer(
      this._textComponent,
      this.onCursorPositionsUpdated,
      this.getOpacityAdjustedColor(this._highlightColor)
    )

    this.setupHighlightHandlesDragEvents()

    // Fallback for standalone use only; rendered text may be placeholder or masked display text.
    if (this._text === undefined) {
      this._text = this._textComponent.text
    }

    this.updateBoundingBox()
    this.updateCursorPositions()
    this.updateCursorHeight()

    this.applyActiveVisualState()
  }

  private ensureCaretRenderer(): void {
    if (this.caretRenderer || !this._textComponent || !this.caretUpdateEvent) return

    this.caretRenderer = new CaretRenderer(
      this._textComponent,
      this.caretUpdateEvent,
      this.onCursorPositionsUpdated,
      this.onCursorHeightUpdated,
      this.getOpacityAdjustedColor(this._caretColor)
    )
  }

  private onInteractableSet(): void {
    this.releaseInteractableDependencies()

    const interactable = this._interactable
    if (!interactable) return

    this.interactableUnsubscribes.push(
      interactable.onTriggerStart.add((event) => {
        if (event.target !== interactable) return
        if (this._active) {
          this.handleTriggerDown(event)
        }
      }),
      interactable.onTriggerEnd.add((event) => {
        if (event.target !== interactable) return
        if (this._active) {
          this.handleTriggerUp()
        }
      }),
      interactable.onTriggerCanceled.add((event) => {
        if (event.target !== interactable) return
        if (this._active && this.caretRenderer) {
          this.caretRenderer.setDragState(false)
        }
      }),
      interactable.onDragStart.add((event) => {
        if (event.target !== interactable) return
        if (this._active && !this.isHighlighted) {
          this.hideInteractorCursor(event.interactor)
          this.handleDragStart(event)
        }
      }),
      interactable.onDragUpdate.add((event) => {
        if (event.target !== interactable) return
        if (this._active && !this.isHighlighted) {
          this.handleDragUpdate(event)
        }
      }),
      interactable.onDragEnd.add((event) => {
        if (event.target !== interactable) return
        if (this._active) {
          this.handleDragEnd()
          this.restoreInteractorCursor(event.interactor)
        }
      }),
      interactable.onSecondaryTriggerStart.add((event) => {
        if (event.target !== interactable) return
        if (this.dragStartPosition) return
        if (this._active) {
          this.handleLongPress()
        }
      })
    )
  }

  private applyActiveVisualState(): void {
    if (this._active) {
      this.showCaret()
    } else {
      this.hideCaret()
      this.clearHighlight()
    }
  }

  private releaseTextComponentDependencies(): void {
    this.textComponentUnsubscribes.forEach((unsub) => unsub())
    this.textComponentUnsubscribes = []

    this.restoreInteractorCursor()

    if (this.geometryResolver) {
      this.geometryResolver.destroy()
      this.geometryResolver = null
    }
    if (this.textHighlightTracker) {
      this.textHighlightTracker.destroy()
      this.textHighlightTracker = null
    }
    if (this.caretRenderer) {
      this.caretRenderer.destroy()
      this.caretRenderer = null
    }
    if (this.leftHandle) {
      this.leftHandle.destroy()
      this.leftHandle = null
    }
    if (this.rightHandle) {
      this.rightHandle.destroy()
      this.rightHandle = null
    }
    if (this.highlightRenderer) {
      this.highlightRenderer.destroy()
      this.highlightRenderer = null
    }

    this.dragStartPosition = null
    this.isTouchingHighlight = false
    this._boundingBox = null
    this._cursorPositions = null
    this._cursorHeight = 0
    this._pendingBoundingBoxUpdate = false
    this._pendingCursorPositionsUpdate = false
    this._caretVisibilityDirty = false
    this._isCaretVisible = false
    this._caretDirty = false
    this._highlightDirty = false
    this._blinkResetPending = false
    this._pendingBlinkState = null
    this._lastHighlightText = ""
    this.resetHandleAnchorSides()
  }

  private releaseInteractableDependencies(): void {
    this.interactableUnsubscribes.forEach((unsub) => unsub())
    this.interactableUnsubscribes = []
    this.dragStartPosition = null
    this.restoreInteractorCursor()
  }

  private validateTextComponent(): void {
    if (!this._textComponent) {
      throw new Error(`TextManipulationModule missing textComponent on ${this.sceneObject.name}`)
    }
  }

  private ensureInteractable(): void {
    if (this._interactable || !this._textComponent) return

    this.ensureInternalInteractable()
  }

  private ensureInternalInteractable(): void {
    if (!this._textComponent) return

    if (!this.internalColliderObject || isNull(this.internalColliderObject)) {
      this.internalColliderObject = global.scene.createSceneObject("TextManipulationInternalCollider")
      this.syncInternalColliderParent()

      this.internalCollider = this.internalColliderObject.createComponent("Physics.ColliderComponent")
      this.internalColliderShape = Shape.createBoxShape()
      this.internalCollider.shape = this.internalColliderShape
      this.internalCollider.intangible = false
      this.internalCollider.fitVisual = false
      this.internalCollider.debugDrawEnabled = false

      this.internalInteractable = this.internalColliderObject.createComponent(
        Interactable.getTypeName()
      ) as Interactable
      this.internalInteractable.targetingMode = TargetingMode.All
      this.internalInteractable.enableInstantDrag = false
      this.internalInteractable.colliders = [this.internalCollider]
    } else {
      this.syncInternalColliderParent()
    }

    this.updateInternalCollider()
    this._interactable = this.internalInteractable
  }

  private syncInternalColliderParent(): void {
    if (!this._textComponent || !this.internalColliderObject || isNull(this.internalColliderObject)) {
      return
    }

    const textSceneObject = this._textComponent.getSceneObject()
    this.internalColliderObject.layer = textSceneObject.layer
    if (this.internalColliderObject.getParent() !== textSceneObject) {
      this.internalColliderObject.setParent(textSceneObject)
    }
  }

  private updateInternalCollider(): void {
    if (
      !this._textComponent ||
      !this.internalColliderObject ||
      !this.internalCollider ||
      !this.internalColliderShape ||
      isNull(this.internalColliderObject)
    ) {
      return
    }

    const textSceneObject = this._textComponent.getSceneObject()
    const textTransform = textSceneObject.getTransform()
    const screenTransform = textSceneObject.getComponent("ScreenTransform")

    if (screenTransform) {
      this.updateInternalColliderFromScreenTransform(screenTransform, textTransform)
      return
    }

    const worldScale = textTransform.getWorldScale()
    if (worldScale.x === 0 || worldScale.y === 0) {
      this.internalColliderSize.x = 0
      this.internalColliderSize.y = 0
      this.internalColliderSize.z = INTERNAL_COLLIDER_DEPTH

      this.internalColliderPosition.x = 0
      this.internalColliderPosition.y = 0
      this.internalColliderPosition.z = 0

      this.applyInternalColliderBounds()
      return
    }

    const rect = this._textComponent.layoutRect
    if (!rect) return

    this.internalColliderSize.x = Math.abs(rect.right - rect.left) / Math.abs(worldScale.x)
    this.internalColliderSize.y = Math.abs(rect.top - rect.bottom) / Math.abs(worldScale.y)
    this.internalColliderSize.z = INTERNAL_COLLIDER_DEPTH

    this.internalColliderPosition.x = (rect.left + rect.right) / 2 / worldScale.x
    this.internalColliderPosition.y = (rect.top + rect.bottom) / 2 / worldScale.y
    this.internalColliderPosition.z = 0

    this.applyInternalColliderBounds()
  }

  private updateInternalColliderFromScreenTransform(screenTransform: ScreenTransform, textTransform: Transform): void {
    const worldToLocal = textTransform.getInvertedWorldTransform()
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const corner of SCREEN_RECT_CORNERS) {
      const localCorner = worldToLocal.multiplyPoint(screenTransform.localPointToWorldPoint(corner))
      minX = Math.min(minX, localCorner.x)
      minY = Math.min(minY, localCorner.y)
      maxX = Math.max(maxX, localCorner.x)
      maxY = Math.max(maxY, localCorner.y)
    }

    this.internalColliderSize.x = maxX - minX
    this.internalColliderSize.y = maxY - minY
    this.internalColliderSize.z = INTERNAL_COLLIDER_DEPTH

    this.internalColliderPosition.x = minX + this.internalColliderSize.x / 2
    this.internalColliderPosition.y = minY + this.internalColliderSize.y / 2
    this.internalColliderPosition.z = 0

    this.applyInternalColliderBounds()
  }

  private applyInternalColliderBounds(): void {
    if (!this.internalColliderObject || !this.internalCollider || !this.internalColliderShape) {
      return
    }

    this.internalColliderShape.size = this.internalColliderSize
    this.internalCollider.shape = this.internalColliderShape
    this.internalColliderObject.getTransform().setLocalPosition(this.internalColliderPosition)
  }

  private destroyInternalInteractable(): void {
    const internalInteractable = this.internalInteractable

    if (this._interactable === internalInteractable) {
      this._interactable = null
    }

    if (this.internalColliderObject && !isNull(this.internalColliderObject)) {
      this.internalColliderObject.destroy()
    }

    this.internalColliderObject = null
    this.internalCollider = null
    this.internalColliderShape = null
    this.internalInteractable = null
  }

  private areTextDependenciesReady(): boolean {
    return (
      !!this._textComponent &&
      this.geometryResolver !== null &&
      this.textHighlightTracker !== null &&
      this.leftHandle !== null &&
      this.rightHandle !== null &&
      this.highlightRenderer !== null
    )
  }

  private set boundingBox(textBounds: Rect | null) {
    this._boundingBox = textBounds
    this.onTextBoundingBoxUpdatedEvent.invoke(textBounds)

    if (this.isHighlighted) {
      this.markHighlightDirty()
    }
  }

  private set cursorPositions(cursorPositions: CursorPosition[] | null) {
    this._cursorPositions = cursorPositions

    const clampedCaretIndex = this.getClampedCaretIndex(this._caretIndex)
    if (this._caretIndex !== clampedCaretIndex) {
      this._caretIndex = clampedCaretIndex
    }

    this.onCursorPositionsUpdatedEvent.invoke(cursorPositions)

    if (this.isHighlighted) {
      this.markHighlightDirty()
    } else {
      this.markCaretDirty()
    }
  }

  private set cursorHeight(cursorHeight: number) {
    if (this._cursorHeight === cursorHeight) return

    this._cursorHeight = cursorHeight
    this.onCursorHeightUpdatedEvent.invoke(cursorHeight)

    if (this.isHighlighted) {
      this.markHighlightDirty()
    } else {
      this.markCaretDirty()
    }
  }

  private showCaret(): void {
    if (!this._isEditable) return

    this._isCaretVisible = true
    this._caretVisibilityDirty = true
    this.batchUpdate()
  }

  private hideCaret() {
    this._isCaretVisible = false
    this._caretVisibilityDirty = true
    this.batchUpdate()
  }

  private handleTriggerDown(event: InteractorEvent): void {
    if (!this.areTextDependenciesReady()) return

    if (!this.dragStartPosition) {
      const interactor = event.interactor
      if (interactor && interactor.planecastPoint) {
        // Check highlight touch
        if (this.isHighlighted) {
          const highlightIndex = this.geometryResolver.getIndexFromWorldPosition(interactor.planecastPoint)
          this.isTouchingHighlight =
            highlightIndex >= this.textHighlightTracker.startCursorIndex &&
            highlightIndex <= this.textHighlightTracker.endCursorIndex &&
            !this.geometryResolver.isAtLineBoundary(highlightIndex) // Edge case: allow clearing highlight by touching line boundaries (beginning/end of any line)

          if (this.isTouchingHighlight) {
            print(`Touching highlight - potential menu trigger`)
            // TODO
            //  this.openContextMenu(interactor.planecastPoint, interactor)
            return
          }

          this.clearHighlight()
        }

        if (this._text.length > 0) {
          this.caretIndex = this.geometryResolver.getIndexFromWorldPosition(interactor.planecastPoint)
          this.showCaret()
        }
      }
    }
    this.requestBlinkReset()
    this.requestBlinkPause()
  }

  private handleTriggerUp(): void {
    this.requestBlinkResume()
  }

  private handleDragStart(event: DragInteractorEvent): void {
    this.dragStartPosition = event.interactor.planecastPoint
    if (this.caretRenderer) {
      this.caretRenderer.setDragState(true)
      this.requestBlinkReset()
      this.requestBlinkPause()
    }
  }

  private handleDragUpdate(event: DragInteractorEvent): void {
    if (!this.geometryResolver) return

    const interactor = event.interactor
    if (!interactor || !interactor.planecastPoint || !this.dragStartPosition) return
    if (this._text.length > 0) {
      this.caretIndex = this.geometryResolver.getIndexFromDragPosition(
        this.dragStartPosition,
        interactor.planecastPoint,
        CARET_DRAG_SENSITIVITY
      )
      this.onCaretDraggedEvent.invoke(this.caretIndex)
    }
  }

  private handleDragEnd(): void {
    this.dragStartPosition = null
    if (this.caretRenderer) {
      this.caretRenderer.setDragState(false)
    }
    this.requestBlinkResume()
  }

  private handleLongPress() {
    if (!this.textHighlightTracker) return

    this.textHighlightTracker.updateHighlightByCursorIndex(this.caretIndex)
    const wordRange = this.textHighlightTracker.getHighlight()
    if (wordRange) {
      this.hideCaret()
      this.markHighlightDirty()
    }
  }

  private setupHighlightHandlesDragEvents() {
    if (
      !this.leftHandle ||
      !this.rightHandle ||
      !this.textHighlightTracker ||
      !this.geometryResolver ||
      !this.highlightRenderer
    ) {
      return
    }

    const dragAnchorIndexByHandle: Record<LogicalHandleType, number> = {
      start: -1,
      end: -1
    }

    const highlightHandleDragUpdate = (event: HandleDragUpdateEvent, handleType: LogicalHandleType) => {
      let dragAnchorIndex = dragAnchorIndexByHandle[handleType]

      if (dragAnchorIndex === -1) {
        const anchorSide = this.getOppositeSide(this.getHandleAnchorSide(handleType))
        dragAnchorIndex =
          anchorSide === "left" ? this.textHighlightTracker.startCursorIndex : this.textHighlightTracker.endCursorIndex
        dragAnchorIndexByHandle[handleType] = dragAnchorIndex
      }

      const newCaretIndex = this.geometryResolver.getIndexFromDragPosition(
        event.dragStartWorldPosition,
        event.dragCurrentWorldPosition
      )
      const targetWord = this.textHighlightTracker.getWordAt(newCaretIndex)

      let newStart: number
      let newEnd: number

      if (newCaretIndex < dragAnchorIndex) {
        newStart = targetWord ? targetWord.cursorStart : newCaretIndex

        let adjustedEnd = dragAnchorIndex
        if (isAtLineStart(adjustedEnd, this.cursorPositions, this._text)) {
          adjustedEnd = Math.max(0, adjustedEnd - 1)
        }
        newEnd = adjustedEnd
      } else {
        let adjustedStart = dragAnchorIndex
        if (isAtLineEnd(adjustedStart, this.cursorPositions, this._text)) {
          adjustedStart = Math.min(this.cursorPositions.length - 1, adjustedStart + 1)
        }
        newStart = adjustedStart

        newEnd = targetWord ? targetWord.cursorEnd : newCaretIndex
      }

      const trimmedRange = trimOuterWhitespaceFromCursorRange(newStart, newEnd, this.cursorPositions, this._text)
      newStart = trimmedRange.cursorStart
      newEnd = trimmedRange.cursorEnd

      this.textHighlightTracker.updateHighlightByRange(newStart, newEnd)

      const draggedHandleAtLeftSide = newCaretIndex < dragAnchorIndex
      const draggedHandleAnchorSide: HandleSide = draggedHandleAtLeftSide ? "left" : "right"
      this.setHandleAnchorSide(handleType, draggedHandleAnchorSide)

      const range = this.textHighlightTracker.getHighlight()
      if (range) {
        const activeHighlightRects = this.highlightRenderer.updateHighlight(range.cursorStart, range.cursorEnd)
        this.updateHandles(activeHighlightRects)

        this.dragEventPayload.type = handleType
        this.dragEventPayload.index = draggedHandleAtLeftSide ? newStart : newEnd
        this.onHighlightHandleDraggedEvent.invoke(this.dragEventPayload)

        this.onHighlightTextUpdated(range)
      }
    }
    const highlightHandleDragEnd = (handleType: LogicalHandleType) => {
      dragAnchorIndexByHandle[handleType] = -1

      this.updateHighlightVisuals(handleType)
    }

    this.textComponentUnsubscribes.push(
      this.leftHandle.onDragStart.add((event) => {
        this.hideInteractorCursor(event.interactor)
      }),
      this.rightHandle.onDragStart.add((event) => {
        this.hideInteractorCursor(event.interactor)
      }),
      this.leftHandle.onDragUpdate.add((event) => highlightHandleDragUpdate(event, "start")),
      this.rightHandle.onDragUpdate.add((event) => highlightHandleDragUpdate(event, "end")),
      this.leftHandle.onDragEnd.add((event) => {
        highlightHandleDragEnd("start")
        this.restoreInteractorCursor(event.interactor)
      }),
      this.rightHandle.onDragEnd.add((event) => {
        highlightHandleDragEnd("end")
        this.restoreInteractorCursor(event.interactor)
      })
    )
  }

  private getClampedCaretIndex(index: number): number {
    if (!this.cursorPositions || this.cursorPositions.length === 0) return 0
    return Math.max(0, Math.min(index, this.cursorPositions.length - 1))
  }

  private markCaretDirty(): void {
    this._caretDirty = true
    this.batchUpdate()
  }

  private markHighlightDirty(): void {
    this._highlightDirty = true
    this.batchUpdate()
  }

  private batchUpdate(): void {
    if (!this.isFlushingBatchedUpdates && this._batchUpdateEvent) {
      this._batchUpdateEvent.enabled = true
    }
  }

  private requestBlinkReset() {
    if (!this.caretRenderer) return

    this._blinkResetPending = true
    this.batchUpdate()
  }

  private requestBlinkPause() {
    if (!this.caretRenderer) return

    this._pendingBlinkState = "pause"
    this.batchUpdate()
  }

  private requestBlinkResume() {
    if (!this.caretRenderer) return

    this._pendingBlinkState = "resume"
    this.batchUpdate()
  }

  private flushPendingGeometryUpdates(): void {
    if (this._pendingBoundingBoxUpdate) {
      this._pendingBoundingBoxUpdate = false
      this.updateBoundingBox()
    }

    if (this._pendingCursorPositionsUpdate) {
      this._pendingCursorPositionsUpdate = false
      this.updateCursorPositions()
    }
  }

  private flushBatchedUpdates(): void {
    if (!this._batchUpdateEvent) return

    this.isFlushingBatchedUpdates = true
    this._batchUpdateEvent.enabled = false

    try {
      if (!this.areTextDependenciesReady()) {
        return
      }

      if (this._textDirty) {
        this._textDirty = false

        const caretCharIndex = this._caretCharIndex ?? 0
        const payload: TextManipulationTextUpdate = {
          text: this._text,
          caretCharIndex
        }

        if (this.isHighlighted) {
          const startChar = this.textHighlightTracker.startCharIndex
          const endChar = this.textHighlightTracker.endCharIndex
          if (startChar !== undefined && endChar !== undefined && startChar !== endChar) {
            payload.highlightStartCharIndex = startChar
            payload.highlightEndCharIndex = endChar
          }
        }

        this.onTextUpdatedEvent.invoke(payload)
      }

      this.flushPendingGeometryUpdates()

      const cursorPositionsReady = !this._pendingCursorPositionsUpdate

      if (this._caretCharIndex !== null && cursorPositionsReady) {
        const newCaretIndex = getCursorIndexFromUtf16Index(
          this._caretCharIndex,
          this.cursorPositions,
          this._text,
          false
        )
        if (newCaretIndex !== undefined) {
          const clampedIndex = this.getClampedCaretIndex(newCaretIndex)
          if (this._caretIndex !== clampedIndex) {
            this._caretIndex = clampedIndex
            this._caretDirty = true
          }
        }
        this._caretCharIndex = null
      }

      if (cursorPositionsReady) {
        const caretDirty = this._caretDirty
        const highlightDirty = this._highlightDirty
        this._caretDirty = false
        this._highlightDirty = false

        if (caretDirty) {
          this.updateCaretPosition(this.caretIndex)
        }

        if (highlightDirty) {
          this.updateHighlightVisuals()
        }
      }

      if (this._caretVisibilityDirty) {
        const shouldDeferShow = this._isCaretVisible && !cursorPositionsReady
        if (!shouldDeferShow) {
          this._caretVisibilityDirty = false
          if (this.caretRenderer) {
            if (this._isCaretVisible) {
              this.caretRenderer.show()
            } else {
              this.caretRenderer.hide()
            }
          }
        }
      }

      // Process blink updates
      if (this._blinkResetPending) {
        if (this.caretRenderer) {
          this.caretRenderer.resetBlink()
        }
        this._blinkResetPending = false
      }

      if (this.caretRenderer) {
        if (this._pendingBlinkState === "pause") {
          this.caretRenderer.pauseBlink()
        } else if (this._pendingBlinkState === "resume") {
          this.caretRenderer.resumeBlink()
        }
      }

      this._pendingBlinkState = null
    } finally {
      this.isFlushingBatchedUpdates = false
      // A subscriber invoked during this flush may have called refresh() and reset the pending flags,
      // so schedule another pass after dropping the flushing guard.
      if (this._pendingBoundingBoxUpdate || this._pendingCursorPositionsUpdate) {
        this.batchUpdate()
      }
    }
  }

  /**
   * Stages a text replacement for the next batched flush.
   *
   * Pairing `text` with `caretCharIndex` in a single call enforces the invariant that
   * {@link TextManipulationTextUpdate.caretCharIndex} emitted by {@link onTextUpdated}
   * is always a valid UTF-16 index for the new `text`, without relying on the (now stale)
   * `cursorPositions` snapshot to re-derive it from `this._caretIndex`.
   */
  private updateText(text: string, caretCharIndex: number) {
    this._text = text
    this._caretCharIndex = caretCharIndex
    this._textDirty = true
    this.batchUpdate()
  }

  private updateCaretPosition(index: number) {
    if (this.caretRenderer) {
      this.caretRenderer.updatePosition(index)
      this.requestBlinkReset()
    }

    this.onCaretIndexChangedEvent.invoke(index)
  }

  private getHandleAnchorSide(handleType: LogicalHandleType): HandleSide {
    return handleType === "start" ? this.leftHandleAnchorSide : this.rightHandleAnchorSide
  }

  private getOppositeSide(side: HandleSide): HandleSide {
    return side === "left" ? "right" : "left"
  }

  private get leftHandleAnchorSide(): HandleSide {
    return this._leftHandleAnchorSide
  }

  private get rightHandleAnchorSide(): HandleSide {
    return this.getOppositeSide(this._leftHandleAnchorSide)
  }

  private resetHandleAnchorSides(): void {
    this._leftHandleAnchorSide = "left"
  }

  private setHandleAnchorSide(handleType: LogicalHandleType, anchorSide: HandleSide): void {
    if (handleType === "start") {
      this._leftHandleAnchorSide = anchorSide
    } else {
      this._leftHandleAnchorSide = this.getOppositeSide(anchorSide)
    }
  }

  private updateHandle(handle: GrabHandle, rect: HighlightRect, anchorSide: HandleSide, isReleasing: boolean): void {
    handle.updateVisualStateFromRect(rect, anchorSide, isReleasing)
    handle.show()
  }

  private hideHandles(): void {
    if (!this.leftHandle || !this.rightHandle) return

    this.leftHandle.hide()
    this.rightHandle.hide()
  }

  private applyGrabHandleColors(): void {
    if (this.leftHandle) {
      this.leftHandle.defaultColor = this.getOpacityAdjustedColor(this._grabHandleColor)
      this.leftHandle.activeColor = this.getOpacityAdjustedColor(this._grabHandleActiveColor)
    }
    if (this.rightHandle) {
      this.rightHandle.defaultColor = this.getOpacityAdjustedColor(this._grabHandleColor)
      this.rightHandle.activeColor = this.getOpacityAdjustedColor(this._grabHandleActiveColor)
    }
  }

  private applyOpacityToVisuals(): void {
    if (this.caretRenderer) {
      this.caretRenderer.color = this.getOpacityAdjustedColor(this._caretColor)
    }
    if (this.highlightRenderer) {
      this.highlightRenderer.color = this.getOpacityAdjustedColor(this._highlightColor)
    }
    this.applyGrabHandleColors()
  }

  private getOpacityAdjustedColor(color: vec4): vec4 {
    return new vec4(color.x, color.y, color.z, color.w * this._opacity)
  }

  private updateHandles(
    activeHighlightRects: ReadonlyArray<HighlightRect>,
    releasingHandle?: LogicalHandleType | null
  ): void {
    if (!this.leftHandle || !this.rightHandle) return

    if (activeHighlightRects.length === 0) {
      this.hideHandles()
      return
    }

    const leftRect = activeHighlightRects[0]
    const rightRect = activeHighlightRects[activeHighlightRects.length - 1]

    if (!leftRect || !rightRect) {
      this.hideHandles()
      return
    }

    const leftHandleRect = this.leftHandleAnchorSide === "left" ? leftRect : rightRect
    const rightHandleRect = this.rightHandleAnchorSide === "left" ? leftRect : rightRect

    this.updateHandle(this.leftHandle, leftHandleRect, this.leftHandleAnchorSide, releasingHandle === "start")
    this.updateHandle(this.rightHandle, rightHandleRect, this.rightHandleAnchorSide, releasingHandle === "end")
  }

  private updateHighlightVisuals(releasingHandle?: LogicalHandleType | null) {
    if (!this.textHighlightTracker || !this.highlightRenderer) return

    const range = this.textHighlightTracker.isHighlighted ? this.textHighlightTracker.getHighlight() : null
    if (!range) {
      this.highlightRenderer.hide()
      this.hideHandles()
      this.resetHandleAnchorSides()
      this.onHighlightTextUpdated(null)
      return
    }

    const activeHighlightRects = this.highlightRenderer.updateHighlight(range.cursorStart, range.cursorEnd)
    this.updateHandles(activeHighlightRects, releasingHandle)
    this.onHighlightTextUpdated(range)
  }

  /**
   * Resolves the current highlight range to its text content and fires
   * {@link onHighlightUpdatedEvent} when the text differs from the last emission.
   *
   * Pass `null` (or an empty range) to clear the cached highlight text and emit an empty
   * string when the previous emission was non-empty. If `range` is provided but the
   * cursor indices cannot be converted to UTF-16 char indices (e.g. cursor positions
   * are stale), no event is emitted and the cached text is left unchanged.
   */
  private onHighlightTextUpdated(range: {cursorStart: number; cursorEnd: number} | null): void {
    let newText = ""
    if (range) {
      const startCharIndex = getUtf16IndexFromCursorIndex(range.cursorStart, this.cursorPositions, this._text)
      const endCharIndex = getUtf16IndexFromCursorIndex(range.cursorEnd, this.cursorPositions, this._text)
      if (startCharIndex === undefined || endCharIndex === undefined) return
      newText = this._text.substring(startCharIndex, endCharIndex)
    }
    if (newText !== this._lastHighlightText) {
      this._lastHighlightText = newText
      this.onHighlightUpdatedEvent.invoke(newText)
    }
  }

  private clearHighlight() {
    if (!this.textHighlightTracker || !this.textHighlightTracker.isHighlighted) return

    this.textHighlightTracker.clearHighlight()
    this.resetHandleAnchorSides()
    this.markHighlightDirty()
  }

  /**
   * Hides the interactor cursor during text manipulation dragging.
   *
   * Cursors are tracked per-interactor so that simultaneous drags (e.g. both
   * selection handles, one per hand) each hide and restore their own cursor.
   * @param interactor - The interactor whose cursor should be hidden
   */
  private hideInteractorCursor(interactor?: Interactor | null): void {
    if (!interactor || this.hiddenInteractorCursors.has(interactor)) return

    const cursor = CursorControllerProvider.getInstance().getCursorByInteractor(interactor)
    if (cursor) {
      cursor.enabled = false
      this.hiddenInteractorCursors.set(interactor, cursor)
    }
  }

  /**
   * Restores cursors hidden by {@link hideInteractorCursor}. Pass an interactor
   * to restore only that one (drag-end); pass nothing to restore all (teardown).
   * @param interactor - The interactor whose cursor should be restored, or omit for all
   */
  private restoreInteractorCursor(interactor?: Interactor | null): void {
    if (interactor) {
      const cursor = this.hiddenInteractorCursors.get(interactor)
      if (cursor) {
        cursor.enabled = true
        this.hiddenInteractorCursors.delete(interactor)
      }
      return
    }

    this.hiddenInteractorCursors.forEach((cursor) => {
      cursor.enabled = true
    })
    this.hiddenInteractorCursors.clear()
  }
}
