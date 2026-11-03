require("LensStudio:TextInputModule") // eslint-disable-line @typescript-eslint/no-require-imports

import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import Event, {PublicApi, unsubscribe} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {OpacityControllable} from "../../Interfaces/OpacityControllable"
import {Callback, createCallbacks} from "../../Utility/SceneUtilities"
import {areRectsEqual, copyRect, expandRect, isEqual, setRect} from "../../Utility/UIKitUtilities"
import {GradientParameters} from "../../Visuals/RoundedRectangle/RoundedRectangle"
import {
  RoundedRectangleVisual,
  RoundedRectangleVisualParameters
} from "../../Visuals/RoundedRectangle/RoundedRectangleVisual"
import {VoiceInputButton} from "../Button/VoiceInputButton"
import {StateName} from "../Element"
import {VisualElement} from "../VisualElement"
import {SystemKeyboardDelegate, SystemKeyboardModule} from "./SystemKeyboardModule"
import {TextInputComponentManager} from "./TextInputComponentManager"
import {
  BACKGROUND_GRADIENT_PARAMETERS,
  BORDER_GRADIENT_PARAMETERS,
  CORNER_RADIUS,
  createTextInputStateMap,
  DEBUG_RENDER,
  DEFAULT_BEHAVIOR,
  DEFAULT_TEXT_COLOR,
  HOVER_SCALE_FACTOR,
  INSET_FACTOR_SINGLE_LINE,
  MASK_Z_OFFSET,
  PLACEHOLDER_TEXT_COLOR,
  STATE_ANIMATION_DURATION,
  TextAlignment,
  TextInputStateType
} from "./TextInputConsts"
import {TextGeometryRefreshReasons, TextManipulationModule} from "./TextManipulation/TextManipulationModule"
import {HANDLE_HEIGHT_RATIO, HANDLE_WIDTH_RATIO} from "./TextManipulation/Visuals/GrabHandle"

const log = new NativeLogger("BaseTextInputComponent")

// GrabHandle owns its visual ratios; text input owns how much mask overflow to reveal.
// The handle width ratio behaves as a half-width around its anchor edge, and
// the handle extends half of its extra height past each vertical edge.
const MASK_VERTICAL_GRAB_HANDLE_EDGE_PADDING_RATIO = 0.02
const MASK_HORIZONTAL_GRAB_HANDLE_OVERFLOW_RATIO = HANDLE_WIDTH_RATIO * 2
const MASK_VERTICAL_GRAB_HANDLE_OVERFLOW_RATIO =
  (HANDLE_HEIGHT_RATIO - 1) * 0.5 + MASK_VERTICAL_GRAB_HANDLE_EDGE_PADDING_RATIO

const LISTENING_TEXT = "Listening"

const ASR_SWEEP_DURATION_SECONDS = 1.8
const ASR_GRADIENT_START = new vec2(-1, 0.2)
const ASR_GRADIENT_END = new vec2(1, -0.2)
const ASR_BACKGROUND_PURPLE = new vec4(0.28, 0.25, 0.52, 1)
const ASR_BACKGROUND_BLUE = new vec4(0.25, 0.42, 0.62, 1)
const ASR_BACKGROUND_TEAL = new vec4(0.25, 0.6, 0.52, 1)
const ASR_BORDER_PURPLE = new vec4(0.58, 0.5, 0.96, 1)
const ASR_BORDER_BLUE = new vec4(0.36, 0.62, 0.92, 1)
const ASR_BORDER_TEAL = new vec4(0.18, 0.82, 0.68, 1)

function createAsrSweepGradientTemplate(): GradientParameters {
  return {
    enabled: true,
    type: "Linear",
    start: ASR_GRADIENT_START,
    end: ASR_GRADIENT_END,
    stop0: {enabled: true, percent: 0, color: new vec4(0, 0, 0, 0)},
    stop1: {enabled: true, percent: 0.25, color: new vec4(0, 0, 0, 0)},
    stop2: {enabled: true, percent: 0.5, color: new vec4(0, 0, 0, 0)},
    stop3: {enabled: true, percent: 0.75, color: new vec4(0, 0, 0, 0)},
    stop4: {enabled: true, percent: 1, color: new vec4(0, 0, 0, 0)}
  }
}

/**
 * Abstract base class for text input components that provides shared state management,
 * keyboard integration, visual styling, and lifecycle hooks.
 *
 * BaseTextInputComponent handles the common behavior for all text input variants:
 * - **Keyboard management**: Opens/dismisses the system keyboard and routes text changes
 * - **State animation**: Animates size transitions on hover, trigger, and toggle states
 * - **Batched updates**: Coalesces text and size changes into a single end-of-frame flush
 * - **Placeholder text**: Displays configurable placeholder text when the input is empty
 * - **Visual styling**: Creates a default {@link RoundedRectangleVisual} with gradient borders
 *
 * Subclasses must implement the following hooks:
 * - {@link initializeTextComponent} — configure text alignment and overflow modes
 * - {@link updateVisibleText} — render the current text string to the text component
 * - {@link computeFontSize} — compute the font size based on the component height
 *
 * @remarks
 * - This class is abstract and should not be instantiated directly
 * - Use {@link TextInputField} for single-line input or {@link TextInputArea} for multiline input
 *
 * @see {@link TextInputField} - Single-line text input implementation
 * @see {@link TextInputArea} - Multiline text input implementation
 * @see {@link TextInputComponentManager} - Manages focus across all text input instances
 * @see {@link TextInputConsts} - Shared constants and types for text input styling and behavior
 */
export abstract class BaseTextInputComponent
  extends VisualElement
  implements SystemKeyboardDelegate, OpacityControllable
{
  /**
   *  add per-theme styles, add @input fields like:
   *
   * @input
   * @showIf("_themeOverride", "SnapOS3")
   * @label("Style")
   * @widget(new ComboBoxWidget([
   *   new ComboBoxItem("StyleName", "StyleName"),
   * ]))
   * protected _styleSnapOS3: string = "StyleName"
   */

  // ─── Text Properties ──────────────────────────────────────────────────

  @input("float", "1")
  @widget(new SliderWidget(0, 1))
  @hint("Opacity multiplier applied to the background, text, and manipulation visuals.")
  protected _opacity: number = 1.0

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Text Properties</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Font and placeholder configuration</span>')
  @input("int")
  @hint("Custom font size. If not set, it will automatically scale from size.y")
  protected _fontSize: number = 0

  @input
  @hint("Font Family")
  @allowUndefined
  protected _fontFamily: Font

  @input
  @hint("Text that is displayed before any text is entered")
  protected _placeholderText: string = ""

  @input("string", "left")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Left", "left"),
      new ComboBoxItem("Center", "center"),
      new ComboBoxItem("Right", "right")
    ])
  )
  @hint("Horizontal text alignment")
  protected _horizontalTextAlignment: TextAlignment = TextAlignment.Left

  // ─── Event Callbacks ──────────────────────────────────────────────────

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Event Callbacks</span>')
  @ui.label(
    '<span style="color: #94A3B8; font-size: 11px;">Optional script functions to trigger on component events</span>'
  )
  @input
  @hint("Enable this to add functions from another script to this component's callbacks")
  protected addCallbacks: boolean = false

  @input
  @showIf("addCallbacks")
  @label("On Text Changed Callbacks")
  protected onTextChangedCallbacks: Callback[] = []

  @input
  @showIf("addCallbacks")
  @label("On Keyboard State Changed Callbacks")
  protected onKeyboardStateChangedCallbacks: Callback[] = []

  /**
   * Whether hover state should animate the component size using the configured hover scale.
   */
  public scaleOnHover: boolean = false
  /**
   * Text component used to display placeholder, visible text, and keyboard edits.
   */
  public textComponent: Text

  protected mask: SceneObject
  protected maskScreenTransform: ScreenTransform
  protected textObject: SceneObject
  protected textObjectScreenTransform: ScreenTransform

  protected _visual: RoundedRectangleVisual
  protected _originalSize: vec3 = this._size
  protected _text: string = ""
  private readonly _textFillBaseColor: vec4 = new vec4(
    DEFAULT_TEXT_COLOR.r,
    DEFAULT_TEXT_COLOR.g,
    DEFAULT_TEXT_COLOR.b,
    DEFAULT_TEXT_COLOR.a
  )
  private readonly _textFillDisplayColor: vec4 = new vec4(
    DEFAULT_TEXT_COLOR.r,
    DEFAULT_TEXT_COLOR.g,
    DEFAULT_TEXT_COLOR.b,
    DEFAULT_TEXT_COLOR.a
  )
  private _opacityVisualBaseTransparencyEnabled: boolean = false
  private _opacityVisualBaseTransparencySource: RoundedRectangleVisual | null = null
  protected isPlaceholder: boolean = true
  protected isEditing: boolean = false
  protected voiceListeningPlaceholderActive: boolean = false
  protected stateCancelSet = new CancelSet()

  private _textDirty: boolean = false
  protected _sizeDirty: boolean = false
  protected _fontDirty: boolean = false
  protected _fontSizeDirty: boolean = false
  private _selectionDirty: boolean = false
  protected _textLayoutDirty: boolean = false
  protected _alignmentDirty: boolean = false
  private _batchUpdateEvent: SceneEvent
  private asrVisualSweepEvent: SceneEvent | null = null
  private asrVisualSweepActive: boolean = false
  private asrVisualSweepTimeSeconds: number = 0
  private readonly asrBackgroundGradient: GradientParameters = createAsrSweepGradientTemplate()
  private readonly asrBorderGradient: GradientParameters = createAsrSweepGradientTemplate()
  private voiceInputActive: boolean = true

  protected textManipulationModule: TextManipulationModule
  protected systemKeyboardModule: SystemKeyboardModule
  protected maskingComponent: Component | null = null
  protected scrollCooldownSec: number = 0.15

  private lastScrollTime: number = 0
  private readonly _maskOverflowPadding: vec2 = vec2.zero()
  private readonly _maskBounds: Rect = Rect.create(0, 0, 0, 0)
  private readonly _previousMaskAnchors: Rect = Rect.create(0, 0, 0, 0)
  private readonly _previousTextObjectAnchors: Rect = Rect.create(0, 0, 0, 0)
  private readonly _previousTextObjectOffsets: Rect = Rect.create(0, 0, 0, 0)
  protected readonly textViewportBounds: Rect = Rect.create(0, 0, 0, 0)

  private registeredVoiceInputButton: VoiceInputButton | null = null
  private registeredVoiceInputButtonPreviousInactive: boolean = false
  private registeredVoiceInputUnsubscribes: unsubscribe[] = []

  protected readonly _states: Map<StateName, TextInputStateType> = createTextInputStateMap(
    () => this._originalSize,
    () => this.calculateHoverScale()
  )

  protected typingEvent = new Event()
  /**
   * Event fired on each keystroke while the user is typing.
   */
  private _onTyping?: PublicApi<void>
  public get onTyping(): PublicApi<void> {
    return (this._onTyping ??= this.typingEvent.publicApi())
  }

  protected onTextChangedEvent = new Event<string>()
  /**
   * Event fired when the text content changes.
   * The event payload is the new text string.
   */
  private _onTextChanged?: PublicApi<string>
  public get onTextChanged(): PublicApi<string> {
    return (this._onTextChanged ??= this.onTextChangedEvent.publicApi())
  }

  protected returnKeyPressed = new Event<string>()
  /**
   * Event fired when the return/done key is pressed on the keyboard.
   * The event payload is the current text string.
   */
  private _onReturnKeyPressed?: PublicApi<string>
  public get onReturnKeyPressed(): PublicApi<string> {
    return (this._onReturnKeyPressed ??= this.returnKeyPressed.publicApi())
  }

  protected onVoiceFinalizeEvent = new Event<string>()
  /**
   * Event fired when a registered voice input button returns final speech-to-text content.
   * The event payload is the final transcript string.
   */
  private _onVoiceFinalize?: PublicApi<string>
  public get onVoiceFinalize(): PublicApi<string> {
    return (this._onVoiceFinalize ??= this.onVoiceFinalizeEvent.publicApi())
  }

  protected keyboardStateChanged = new Event<boolean>()
  /**
   * Event fired when the system keyboard opens or closes.
   * The event payload is `true` when the keyboard is open, `false` when closed.
   */
  private _onKeyboardStateChanged?: PublicApi<boolean>
  public get onKeyboardStateChanged(): PublicApi<boolean> {
    return (this._onKeyboardStateChanged ??= this.keyboardStateChanged.publicApi())
  }

  protected editModeEvent = new Event<boolean>()
  /**
   * Event fired when the component enters or exits edit mode.
   * The event payload is `true` when entering edit mode, `false` when exiting.
   */
  private _onEditMode?: PublicApi<boolean>
  public get onEditMode(): PublicApi<boolean> {
    return (this._onEditMode ??= this.editModeEvent.publicApi())
  }

  private _textInputComponentManager = TextInputComponentManager.getInstance()

  private onCaretIndexChangedEvent: Event<number> = new Event<number>()
  private _onCaretIndexChanged?: PublicApi<number>
  /**
   * Event fired when the caret index changes.
   * The payload is the caret position in UTF-16 character units.
   */
  public get onCaretIndexChanged(): PublicApi<number> {
    return (this._onCaretIndexChanged ??= this.onCaretIndexChangedEvent.publicApi())
  }
  private onHighlightUpdatedEvent: Event<string> = new Event<string>()
  private _onHighlightUpdated?: PublicApi<string>
  /**
   * Event fired when highlighted text changes.
   * The payload is the currently highlighted substring, or an empty string when selection clears.
   */
  public get onHighlightUpdated(): PublicApi<string> {
    return (this._onHighlightUpdated ??= this.onHighlightUpdatedEvent.publicApi())
  }

  /**
   * Gets the current size of the text input component.
   * @returns The size as a vec3 (width, height, depth).
   */
  public get size(): vec3 {
    return this._size
  }

  /**
   * Sets the size of the text input component.
   * Triggers a batched size update that recalculates the visual, font size, and text content anchors.
   * @param size - The new size as a vec3 (width, height, depth).
   */
  public set size(size: vec3) {
    if (size === undefined || isEqual(size, this._size)) return
    super.size = size
    this.markSizeDirty()
    this.markTextLayoutDirty()
  }

  protected applySizeImmediately(size: vec3): void {
    if (size === undefined || isEqual(size, this._size)) return
    super.size = size
    this.updateSize()
  }

  /**
   * Gets the original (baseline) size of the text input component.
   * Used as the reference size for hover scale calculations and font size scaling.
   * @returns The original size as a vec3.
   */
  public get originalSize(): vec3 {
    return this._originalSize
  }

  /**
   * Sets the original (baseline) size of the text input component.
   * Also updates the current size to match.
   * @param originalSize - The new original size as a vec3.
   */
  public set originalSize(originalSize: vec3) {
    if (originalSize === undefined || isEqual(originalSize, this._originalSize)) return
    this._originalSize = originalSize
    this.size = originalSize
  }

  /**
   * Gets the current text content of the input.
   * @returns The current text string, or an empty string if only placeholder text is shown.
   */
  public get text() {
    return this._text
  }

  /**
   * Sets the text content of the input.
   * Triggers a batched text update and fires the {@link onTextChanged} event when initialized.
   * @param text - The new text string.
   */
  public set text(text: string) {
    if (text === undefined || isEqual(text, this._text)) return
    this._text = text
    if (this._initialized) {
      this.markTextDirty()
    }
  }

  /**
   * Gets the placeholder text displayed when the input is empty and not in edit mode.
   * @returns The placeholder text string.
   */
  public get placeholderText(): string {
    return this._placeholderText
  }

  /**
   * Sets the placeholder text displayed when the input is empty and not in edit mode.
   * @param value - The new placeholder text string.
   */
  public set placeholderText(value: string) {
    if (value === undefined || isEqual(value, this._placeholderText)) return
    this._placeholderText = value
    this.markTextDirty()
  }

  /**
   * Gets the horizontal text alignment within the input.
   * @returns The current horizontal text alignment.
   */
  public get horizontalTextAlignment(): TextAlignment {
    return this._horizontalTextAlignment
  }

  /**
   * Sets the horizontal text alignment within the input.
   * Triggers a batched alignment update at the end of the frame.
   * @param value - The desired horizontal text alignment.
   */
  public set horizontalTextAlignment(value: TextAlignment) {
    if (value === undefined || isEqual(value, this._horizontalTextAlignment)) return
    this._horizontalTextAlignment = value
    this.markAlignmentDirty()
  }

  /**
   * Gets the custom font size.
   * A value of 0 means the font size is automatically derived from the component height.
   * @returns The font size, or 0 for automatic sizing.
   */
  public get fontSize(): number {
    return this._fontSize
  }

  /**
   * Sets the custom font size.
   * Set to 0 to use automatic font sizing based on the component height.
   * @param value - The new font size, or 0 for automatic sizing.
   */
  public set fontSize(value: number) {
    if (value === undefined || isEqual(value, this._fontSize)) return
    this._fontSize = value
    this.markSizeDirty()
    this.markTextLayoutDirty()
    this.markFontSizeDirty()
  }

  /**
   * Gets the font family used for text rendering.
   * @returns The current Font asset, or undefined if using the default font.
   */
  public get fontFamily(): Font {
    return this._fontFamily
  }

  /**
   * Sets the font family used for text rendering.
   * Triggers a size recalculation since different fonts may have different metrics.
   * @param value - The Font asset to use.
   */
  public set fontFamily(value: Font) {
    if (value === undefined || isEqual(value, this._fontFamily)) return
    this._fontFamily = value
    if (this._initialized) {
      this.textComponent.font = this._fontFamily
      this.markSizeDirty()
      this.markTextLayoutDirty()
      this.markFontDirty()
    }
  }

  /**
   * Sets the render order for the visual and text layers.
   * The text component renders at `value + 1` to appear above the background visual.
   * @param value - The base render order value.
   */
  public set renderOrder(value: number) {
    if (value === undefined || isEqual(value, this._renderOrder)) return
    this._renderOrder = value
    if (this._initialized) {
      this.updateRenderOrder(value)
    }
  }

  /**
   * Opacity multiplier applied to the text input visual, text, and text manipulation affordances.
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
    if (opacity === this._opacity) return

    this._opacity = opacity
    this.applyOpacity()
  }

  /**
   * Gets whether the text input can be dragged by the interaction system.
   * @returns Always `true` for text input components.
   */
  public get isDraggable() {
    return true
  }

  /**
   * Gets the caret position in UTF-16 character units.
   * @returns The caret character index, or 0 before text manipulation is initialized.
   */
  public get caretCharIndex(): number {
    if (!this._initialized || !this.textManipulationModule) return 0
    return this.textManipulationModule.caretCharIndex
  }

  /**
   * Gets the currently highlighted text.
   * @returns The highlighted substring, or an empty string when no text is highlighted.
   */
  public get highlightedText(): string {
    if (!this._initialized || !this.textManipulationModule) return ""
    return this.textManipulationModule.getHighlightedText()
  }

  /**
   * Selects all text while the component is editing.
   * @returns `true` if all text was highlighted.
   */
  public selectAll(): boolean {
    if (!this._initialized || !this.isEditing || !this.textManipulationModule) return false
    return this.textManipulationModule.setHighlightAll()
  }

  /**
   * Removes the currently highlighted text while the component is editing.
   * @returns `true` if highlighted text was removed.
   */
  public cut(): boolean {
    if (!this._initialized || !this.isEditing || !this.textManipulationModule) return false
    return this.textManipulationModule.removeHighlightedText()
  }

  /**
   * Inserts text at the caret or replaces the current highlight while editing.
   * @param text - The text to paste.
   * @returns `true` if the paste operation was staged.
   */
  public paste(text: string): boolean {
    if (!this._initialized || !this.isEditing || !this.textManipulationModule) return false
    return this.textManipulationModule.replaceHighlightedText(text)
  }

  /**
   * Registers a voice input button to drive listening visuals and speech-to-text updates.
   * A text input can only observe one voice input button at a time; registering a new one
   * first deregisters the current button without changing that button's own lifecycle state.
   */
  public registerVoiceInputButton(voiceInputButton: VoiceInputButton): void {
    if (!voiceInputButton || this.registeredVoiceInputButton === voiceInputButton) return

    this.deregisterVoiceInputButton()
    this.registeredVoiceInputButton = voiceInputButton
    this.registeredVoiceInputButtonPreviousInactive = voiceInputButton.inactive
    this.registeredVoiceInputUnsubscribes = [
      voiceInputButton.onValueChange.add((value) => this.onVoiceInputToggleValueChanged(value === 1)),
      voiceInputButton.onListeningUpdate.add(([text, isFinal]) => this.onVoiceListeningUpdate(text, isFinal)),
      voiceInputButton.onListeningError.add((statusCode) => this.onVoiceListeningError(statusCode))
    ]
    this.applyRegisteredVoiceInputButtonInactive()

    if (this._initialized && this.voiceInputActive && voiceInputButton.isOn) {
      this.onVoiceInputToggleValueChanged(true)
    }
  }

  /**
   * Deregisters the currently observed voice input button.
   * This removes text-input-owned subscriptions and visual state only; it does not toggle,
   * destroy the button, or leave behind an inactive override from this text input.
   */
  public deregisterVoiceInputButton(): void {
    const voiceInputButton = this.registeredVoiceInputButton
    this.unsubscribeRegisteredVoiceInputEvents()
    this.stopVoiceInputListeningState()
    if (voiceInputButton) {
      voiceInputButton.inactive = this.registeredVoiceInputButtonPreviousInactive
    }
    this.registeredVoiceInputButton = null
    this.registeredVoiceInputButtonPreviousInactive = false
  }

  /**
   * Enters or exits edit mode, managing keyboard visibility and input state.
   *
   * When entering edit mode: toggles the interactable state, clears placeholder text if present,
   * sets the initial keyboard text, requests the system keyboard, and registers this field as active.
   *
   * When exiting edit mode: untoggles the interactable state, dismisses the keyboard,
   * deregisters this field, updates the displayed text, and cancels any pending keyboard requests.
   *
   * @param editing - `true` to enter edit mode, `false` to exit.
   */
  public editMode(editing: boolean) {
    if (editing === this.isEditing) return
    if (!editing) {
      this._selectionDirty = false
    }
    this.updateTextManipulationEditMode(editing)
    this.editModeEvent.invoke(editing)
    if (DEFAULT_BEHAVIOR) {
      if (editing) {
        this._interactableStateMachine.toggle = true
        this.isEditing = true
        this.applyTextFillColor(DEFAULT_TEXT_COLOR)
        if (this.isPlaceholder) {
          this._text = ""
          this.updateText(false)
          this.systemKeyboardModule.requestKeyboard("", 0, 0)
        } else {
          this.systemKeyboardModule.requestKeyboard(this.text, this.text.length, this.text.length)
        }
        this.textInputComponentManager.registerActive(this)
      } else {
        this._interactableStateMachine.toggle = false
        this.isEditing = false
        this.updateText(false)
        this.textInputComponentManager.deregisterActive(this)
        this.systemKeyboardModule.dismissKeyboard()
        this.cancelRequestKeyboard()
      }
    }
    this.onEditModeChanged(editing)
  }

  protected onEditModeChanged(_editing: boolean): void {}

  /**
   * Clears a pending visual focus toggle when the component is not actively editing.
   * This is intended for {@link TextInputComponentManager}; application code should use
   * focus-related APIs rather than calling this directly.
   */
  public resetPendingFocusState(): void {
    if (this.isEditing || !this._interactableStateMachine.toggle) return

    this._interactableStateMachine.toggle = false
  }

  private updateTextManipulationEditMode(editing: boolean): void {
    if (!this.textManipulationModule) return

    this.textManipulationModule.active = editing
    if (editing) {
      const positions = this.textManipulationModule.cursorPositions
      this.textManipulationModule.caretIndex = positions ? positions.length - 1 : 0
    }
  }

  /**
   * Transitions the component to the specified interaction state.
   * Animates the component size toward the target state's size when {@link scaleOnHover} is enabled.
   * @param stateName - The target interaction state.
   */
  public setState(stateName: StateName) {
    super.setState(stateName)
    const state = this._states.get(stateName)
    this.stateCancelSet()
    if (this.scaleOnHover) {
      animate({
        cancelSet: this.stateCancelSet,
        duration: STATE_ANIMATION_DURATION,
        easing: "ease-in-quart",
        update: (t) => {
          const newSize = state.size ? state.size() : this._originalSize
          this.size = vec3.lerp(this._size, newSize, t)
        }
      })
    }
  }

  /**
   * Initializes the text input component after scene objects are created.
   * Sets up the text hierarchy, configures keyboard callbacks, applies the initial
   * font, size, and text state, and invokes the subclass hook
   * {@link initializeTextComponent}
   */
  public initialize() {
    super.initialize()

    this.interactable.enableInstantDrag = false

    this.mask.setParent(this.sceneObject)
    this.textObject.setParent(this.mask)
    this.maskScreenTransform.position = new vec3(0, 0, MASK_Z_OFFSET)

    this.textComponent.depthTest = true
    this.textComponent.horizontalAlignment = HorizontalAlignment.Left
    this.textObjectScreenTransform.offsets = Rect.create(0, 0, 0, 0)
    this.textObjectScreenTransform.enableDebugRendering = DEBUG_RENDER
    this.maskScreenTransform.enableDebugRendering = DEBUG_RENDER

    this.systemKeyboardModule = new SystemKeyboardModule(this.keyboardType, this.returnKeyType, this)

    this.initializeTextComponent()

    this._interactableStateMachine.untoggleOnClick = false

    this.updateRenderOrder(this._renderOrder)
    if (this._fontFamily) this.textComponent.font = this._fontFamily
    this.textComponent.size = this.computeFontSize()

    const textManipulationObject = global.scene.createSceneObject("textManipulation")
    textManipulationObject.setParent(this.sceneObject)
    textManipulationObject.layer = this.sceneObject.layer
    this.managedSceneObjects.add(textManipulationObject)

    this.textManipulationModule = textManipulationObject.createComponent(
      TextManipulationModule.getTypeName()
    ) as TextManipulationModule
    this.managedComponents.add(this.textManipulationModule)
    this.textManipulationModule.textComponent = this.textComponent
    this.textManipulationModule.interactable = this.interactable
    this.textManipulationModule.isEditable = true
    this.textManipulationModule.active = false
    this.textManipulationModule.opacity = this._opacity
    this.textManipulationModule.onInitialized.add(() => {
      this.textManipulationModule.onTextUpdated.add((update) => {
        if (update.text === this._text) return
        this._text = update.text
        this.updateText()
        this.systemKeyboardModule.updateText(
          update.text,
          update.highlightStartCharIndex ?? update.caretCharIndex,
          update.highlightEndCharIndex ?? update.caretCharIndex
        )
      })

      this.textManipulationModule.onCaretIndexChanged.add(() => {
        const caretIndex = this.textManipulationModule.caretCharIndex
        this.onCaretIndexChangedEvent.invoke(caretIndex)
        if (
          this.systemKeyboardModule.selectionStart === caretIndex &&
          this.systemKeyboardModule.selectionEnd === caretIndex
        ) {
          return
        }

        this.systemKeyboardModule.updateSelectionRange(caretIndex, caretIndex)
        this.systemKeyboardModule.setEditingPosition(caretIndex)
      })

      this.textManipulationModule.onHighlightUpdated.add((text) => {
        this.onHighlightUpdatedEvent.invoke(text)

        const start = this.textManipulationModule.highlightStartCharIndex ?? this.textManipulationModule.caretCharIndex
        const end = this.textManipulationModule.highlightEndCharIndex ?? this.textManipulationModule.caretCharIndex
        if (this.systemKeyboardModule.selectionStart === start && this.systemKeyboardModule.selectionEnd === end) {
          return
        }

        this.systemKeyboardModule.updateSelectionRange(start, end)
      })

      this.textManipulationModule.onCaretIndexChanged.add(() => {
        this.scrollToIndex(this.textManipulationModule.caretIndex)
      })
      this.textManipulationModule.onCaretDragged.add(() => {
        this.scrollToIndex(this.textManipulationModule.caretIndex)
      })
      this.textManipulationModule.onHighlightHandleDragged.add((params) => {
        this.scrollToIndex(params.index)
      })

      this.updateSize()
      this.updateText(false)
    })

    this.applyOpacity()
  }

  /**
   * Called when the component is first created.
   * Creates the mask and text scene objects, and sets up the batched update event.
   */
  public onAwake(): void {
    this._batchUpdateEvent = this.createEvent("LateUpdateEvent")
    this._batchUpdateEvent.enabled = false
    this._batchUpdateEvent.bind(() => this.flushBatchedUpdatesAndUpdateEvent())

    this.asrVisualSweepEvent = this.createEvent("UpdateEvent")
    this.asrVisualSweepEvent.enabled = false
    this.asrVisualSweepEvent.bind(() => this.updateAsrVisualSweep())

    this.mask = global.scene.createSceneObject("mask")
    this.managedSceneObjects.add(this.mask)
    this.mask.layer = this.sceneObject.layer
    this.maskScreenTransform = this.mask.createComponent("ScreenTransform")

    this.textObject = global.scene.createSceneObject("textObject")
    this.textObject.layer = this.sceneObject.layer
    this.textObjectScreenTransform = this.textObject.createComponent("ScreenTransform")
    this.textComponent = this.textObject.getComponent("Text") || this.textObject.createComponent("Text")
    this.managedComponents.add(this.textComponent)

    super.onAwake()
  }

  protected get isToggle(): boolean {
    return true
  }

  protected get textInputComponentManager() {
    return this._textInputComponentManager
  }

  /** Subclass hook to configure text alignment and overflow modes. */
  protected abstract initializeTextComponent(): void

  /** Subclass hook to render text to the text component. */
  protected abstract updateVisibleText(text: string): void

  /** Subclass hook to compute the font size */
  protected abstract computeFontSize(): number

  /** Subclass hook to update text content layout after text, size, or control visibility changes. */
  protected abstract updateTextLayout(): void

  /** Subclass hook to keep the caret or selection handle visible while editing. */
  protected abstract updateScrollOffset(targetIndex: number): boolean

  protected get keyboardType(): TextInputSystem.KeyboardType {
    return TextInputSystem.KeyboardType.Text
  }

  protected get returnKeyType(): TextInputSystem.ReturnKeyType {
    return TextInputSystem.ReturnKeyType.Done
  }

  /**
   * Handles native keyboard open and close callbacks.
   * This is intended for {@link SystemKeyboardModule} delegate use and should not be
   * called directly by application code.
   * @param isOpen - `true` when the native keyboard opened, `false` when it closed.
   */
  public onKeyboardStateChangedHandler(isOpen: boolean): void {
    if (isOpen) {
      this.setVoiceInputActive(false)
    }

    this.keyboardStateChanged.invoke(isOpen)
    if (DEFAULT_BEHAVIOR) {
      if (!isOpen) {
        this._hasError = false
        this.editMode(false)
      }
    }
    if (!isOpen) {
      this.setVoiceInputActive(true)
    }
  }

  /**
   * Handles selection updates sent by the native keyboard.
   * This is intended for {@link SystemKeyboardModule} delegate use and should not be
   * called directly by application code.
   * @param start - Selection start in UTF-16 character units.
   * @param end - Selection end in UTF-16 character units.
   */
  public onSetSelectionHandler(start: number, end: number): void {
    if (!this.isEditing) return

    if (this.systemKeyboardModule.selectionStart !== start || this.systemKeyboardModule.selectionEnd !== end) {
      this.systemKeyboardModule.selectionRange = {start, end}
      this._selectionDirty = true
      this.batchUpdate()
    }
  }

  /**
   * Handles text updates sent by the native keyboard.
   * This is intended for {@link SystemKeyboardModule} delegate use and should not be
   * called directly by application code.
   * @param text - The updated text content.
   * @param selectionStart - Optional selection start in UTF-16 character units.
   * @param selectionEnd - Optional selection end in UTF-16 character units.
   */
  public onTextChangedHandler(text: string, selectionStart?: number, selectionEnd?: number): void {
    this.text = text

    this.typingEvent.invoke()
    if (selectionStart !== undefined && selectionEnd !== undefined) {
      this.onSetSelectionHandler(selectionStart, selectionEnd)
    }
  }

  /**
   * Handles native return-key activation by emitting the current text.
   * This is intended for {@link SystemKeyboardModule} delegate use and should not be
   * called directly by application code.
   */
  public onReturnKeyPressedHandler(): void {
    this.returnKeyPressed.invoke(this.text)
  }

  protected createDefaultVisual(): void {
    if (!this._visual) {
      const theme = this.resolveTheme()
      const themedStyle = theme.styles["TextInputField"]?.["default"]
      const parameters: Partial<RoundedRectangleVisualParameters> = themedStyle ?? {
        default: {
          baseType: "Gradient",
          baseGradient: BACKGROUND_GRADIENT_PARAMETERS.default,
          hasBorder: true,
          borderSize: 0.125,
          borderType: "Gradient",
          shouldPosition: true,
          borderGradient: BORDER_GRADIENT_PARAMETERS.default
        },
        hovered: {
          localPosition: new vec3(0, 0, 1),
          borderGradient: BORDER_GRADIENT_PARAMETERS.toggledHovered
        },
        triggered: {
          localPosition: new vec3(0, 0, 0.5),
          baseGradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
          borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
        },
        toggledDefault: {
          localPosition: new vec3(0, 0, 0.5),
          baseGradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
          borderGradient: BORDER_GRADIENT_PARAMETERS.toggledHovered
        },
        toggledHovered: {
          localPosition: new vec3(0, 0, 0.5),
          baseGradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
          borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
        },
        toggledTriggered: {
          localPosition: new vec3(0, 0, 0.5),
          baseGradient: BACKGROUND_GRADIENT_PARAMETERS.toggled,
          borderGradient: BORDER_GRADIENT_PARAMETERS.toggled
        }
      }
      const defaultVisual: RoundedRectangleVisual = new RoundedRectangleVisual({
        sceneObject: this.sceneObject,
        style: parameters
      })
      defaultVisual.cornerRadius = CORNER_RADIUS
      this._visual = defaultVisual
    }
    this.captureOpacityVisualBaseTransparency(this.roundedRectangleVisual)
  }

  protected applyOpacity(): void {
    const visual = this.roundedRectangleVisual
    this.captureOpacityVisualBaseTransparency(visual)
    if (visual) {
      visual.transparencyEnabled = this._opacity < 1.0 || this._opacityVisualBaseTransparencyEnabled
      visual.opacity = this._opacity
    }
    this.applyTextOpacity()
    if (this.textManipulationModule) {
      this.textManipulationModule.opacity = this._opacity
    }
  }

  protected applyTextFillColor(color: vec4): void {
    if (color === undefined) return

    this._textFillBaseColor.r = color.r
    this._textFillBaseColor.g = color.g
    this._textFillBaseColor.b = color.b
    this._textFillBaseColor.a = color.a
    this.applyTextOpacity()
  }

  private applyTextOpacity(): void {
    if (!this.textComponent) return

    const color = this._textFillBaseColor
    this._textFillDisplayColor.r = color.r
    this._textFillDisplayColor.g = color.g
    this._textFillDisplayColor.b = color.b
    this._textFillDisplayColor.a = color.a * this._opacity
    this.textComponent.textFill.color = this._textFillDisplayColor
  }

  private captureOpacityVisualBaseTransparency(visual: RoundedRectangleVisual | null): void {
    if (this._opacityVisualBaseTransparencySource === visual) return

    this._opacityVisualBaseTransparencySource = visual
    this._opacityVisualBaseTransparencyEnabled = visual?.transparencyEnabled ?? false
  }

  protected setUpEventCallbacks(): void {
    if (this.addCallbacks) {
      this.onTextChanged.add(createCallbacks(this.onTextChangedCallbacks))
      this.onKeyboardStateChanged.add(createCallbacks(this.onKeyboardStateChangedCallbacks))
    }
    super.setUpEventCallbacks()
  }

  protected calculateHoverScale(): vec3 {
    return this._originalSize.uniformScale(HOVER_SCALE_FACTOR)
  }

  protected onTriggerUpHandler(event: InteractorEvent): void {
    if (event.target !== this.interactable) return
    if (!this.isEditing) {
      this.textInputComponentManager.requestFocus(this)
    }
  }

  protected updateRenderOrder(value: number) {
    this._visual.renderMeshVisual.renderOrder = value
    this.textComponent.renderOrder = value + 1
  }

  protected updateText(textChanged: boolean = true): void {
    this._textDirty = false
    this.isPlaceholder = !this.isEditing && this._text === ""
    this.updateVisibleText(this.isPlaceholder ? this._placeholderText : this._text)
    this.onTextUpdated(textChanged)
  }

  protected onTextUpdated(textChanged: boolean = true): void {
    this.applyTextFillColor(this.isPlaceholder ? PLACEHOLDER_TEXT_COLOR : DEFAULT_TEXT_COLOR)

    this.textManipulationModule.refresh({text: this._text})
    this.markTextLayoutDirty()

    if (textChanged) {
      this.onTextChangedEvent.invoke(this._text)
    }
  }

  protected onVoiceListeningPlaceholderChanged(): void {
    // Subclasses can update auxiliary controls whose visibility depends on the voice placeholder.
  }

  private onVoiceInputToggleValueChanged(isOn: boolean): void {
    if (isOn) {
      if (!this.voiceInputActive) {
        this.registeredVoiceInputButton?.toggle(false)
        return
      }

      this.startAsrVisualSweep()
      this.showVoiceListeningPlaceholder()
      return
    }

    this.stopVoiceInputListeningState()
  }

  private showVoiceListeningPlaceholder(): void {
    this.voiceListeningPlaceholderActive = true
    if (this._initialized && this.textComponent) {
      this.updateVisibleText(LISTENING_TEXT)
      this.applyTextFillColor(PLACEHOLDER_TEXT_COLOR)
      this.textManipulationModule.refresh({fromText: true})
      this.markTextLayoutDirty()
    }
    this.onVoiceListeningPlaceholderChanged()
  }

  private restoreTextAfterVoiceListeningPlaceholder(): void {
    if (!this.voiceListeningPlaceholderActive) return

    this.voiceListeningPlaceholderActive = false
    if (this._initialized && this.textComponent) {
      this.updateText(false)
    }
    this.onVoiceListeningPlaceholderChanged()
  }

  private onVoiceListeningUpdate(text: string, isFinal: boolean): void {
    if (!this.voiceInputActive) {
      if (this.registeredVoiceInputButton?.isOn) {
        this.registeredVoiceInputButton.toggle(false)
      }
      this.stopVoiceInputListeningState()
      return
    }

    if (this.voiceListeningPlaceholderActive) {
      this.restoreTextAfterVoiceListeningPlaceholder()
    }

    this.text = text
    if (isFinal) {
      this.stopAsrVisualSweep()
      this.onVoiceFinalizeEvent.invoke(text)
    }
  }

  private onVoiceListeningError(_statusCode: AsrModule.AsrStatusCode): void {
    this.stopVoiceInputListeningState()
  }

  protected setVoiceInputActive(active: boolean): void {
    if (this.voiceInputActive === active) return
    this.voiceInputActive = active
    this.applyRegisteredVoiceInputButtonInactive()
  }

  private stopVoiceInputListeningState(): void {
    this.stopAsrVisualSweep()
    this.restoreTextAfterVoiceListeningPlaceholder()
  }

  private applyRegisteredVoiceInputButtonInactive(): void {
    if (!this.registeredVoiceInputButton) return

    this.registeredVoiceInputButton.inactive = this.registeredVoiceInputButtonPreviousInactive || !this.voiceInputActive
  }

  private deregisterVoiceInputButtonForLifecycle(): void {
    if (this.registeredVoiceInputButton?.isOn) {
      this.registeredVoiceInputButton.toggle(false)
    }
    this.deregisterVoiceInputButton()
  }

  private startAsrVisualSweep(): void {
    if (!this.roundedRectangleVisual) return

    this.asrVisualSweepActive = true
    this.asrVisualSweepTimeSeconds = 0
    if (this.asrVisualSweepEvent) {
      this.asrVisualSweepEvent.enabled = true
    }
    this.applyAsrVisualSweepGradientPalette()
  }

  private stopAsrVisualSweep(): void {
    if (this.asrVisualSweepEvent) {
      this.asrVisualSweepEvent.enabled = false
    }
    if (!this.asrVisualSweepActive) return

    this.asrVisualSweepActive = false
    this.asrVisualSweepTimeSeconds = 0
    this.roundedRectangleVisual?.refreshRoundedRectangleState()
  }

  private updateAsrVisualSweep(): void {
    if (!this.asrVisualSweepActive) {
      if (this.asrVisualSweepEvent) {
        this.asrVisualSweepEvent.enabled = false
      }
      return
    }

    const visual = this.roundedRectangleVisual
    if (!visual) {
      this.stopAsrVisualSweep()
      return
    }

    this.asrVisualSweepTimeSeconds += getDeltaTime()
    this.applyAsrVisualSweepGradientPalette()
  }

  private applyAsrVisualSweepGradientPalette(): void {
    const visual = this.roundedRectangleVisual
    if (!visual) return

    const phase = this.getAsrSweepPhase()
    this.updateAsrSweepGradient(
      this.asrBackgroundGradient,
      phase,
      ASR_BACKGROUND_PURPLE,
      ASR_BACKGROUND_BLUE,
      ASR_BACKGROUND_TEAL
    )
    this.updateAsrSweepGradient(this.asrBorderGradient, phase, ASR_BORDER_PURPLE, ASR_BORDER_BLUE, ASR_BORDER_TEAL)
    visual.applyBaseGradientNow(this.asrBackgroundGradient)
    visual.applyBorderGradientNow(this.asrBorderGradient)
  }

  private getAsrSweepPhase(): number {
    return (this.asrVisualSweepTimeSeconds % ASR_SWEEP_DURATION_SECONDS) / ASR_SWEEP_DURATION_SECONDS
  }

  private updateAsrSweepGradient(
    gradient: GradientParameters,
    phase: number,
    stop0Color: vec4,
    stop1Color: vec4,
    stop2Color: vec4
  ): void {
    this.writeAsrLoopedColor(gradient.stop0.color, phase, stop0Color, stop1Color, stop2Color)
    this.writeAsrLoopedColor(gradient.stop1.color, phase + 0.25, stop0Color, stop1Color, stop2Color)
    this.writeAsrLoopedColor(gradient.stop2.color, phase + 0.5, stop0Color, stop1Color, stop2Color)
    this.writeAsrLoopedColor(gradient.stop3.color, phase + 0.75, stop0Color, stop1Color, stop2Color)
    gradient.stop4.color.copyFrom(gradient.stop0.color)
  }

  private writeAsrLoopedColor(out: vec4, phase: number, color0: vec4, color1: vec4, color2: vec4): void {
    const wrapped = phase - Math.floor(phase)
    const segment = wrapped * 3
    const index = Math.floor(segment)
    const t = segment - index

    if (index === 0) {
      this.writeAsrLerpedColor(out, color0, color1, t)
      return
    }
    if (index === 1) {
      this.writeAsrLerpedColor(out, color1, color2, t)
      return
    }
    this.writeAsrLerpedColor(out, color2, color0, t)
  }

  private writeAsrLerpedColor(out: vec4, from: vec4, to: vec4, t: number): void {
    out.copyFrom(from)
    out.lerpInPlace(to, t)
  }

  private unsubscribeRegisteredVoiceInputEvents(): void {
    for (let i = 0; i < this.registeredVoiceInputUnsubscribes.length; i++) {
      this.registeredVoiceInputUnsubscribes[i]()
    }
    this.registeredVoiceInputUnsubscribes = []
  }

  private get roundedRectangleVisual(): RoundedRectangleVisual | null {
    return this._visual instanceof RoundedRectangleVisual ? this._visual : null
  }

  protected updateSize() {
    const inset = this.computeInset()
    this.textComponent.size = this.computeFontSize()
    this.setTextViewportBounds(
      this._size.x * -0.5 + inset,
      this._size.x * 0.5 - inset,
      this._size.y * -0.5,
      this._size.y * 0.5
    )
  }

  protected setTextViewportBounds(left: number, right: number, bottom: number, top: number): void {
    setRect(this.textViewportBounds, left, right, bottom, top)

    const maskOverflowPadding = this.computeMaskOverflowPadding()
    expandRect(this.textViewportBounds, maskOverflowPadding, this._maskBounds)
    copyRect(this._maskBounds, this.maskScreenTransform.anchors)
    this.setTextObjectAnchorsFromBounds()
  }

  private setTextObjectAnchorsFromBounds(): void {
    const maskCenterX = (this._maskBounds.left + this._maskBounds.right) * 0.5
    const maskCenterY = (this._maskBounds.bottom + this._maskBounds.top) * 0.5
    const maskHalfWidth = (this._maskBounds.right - this._maskBounds.left) * 0.5
    const maskHalfHeight = (this._maskBounds.top - this._maskBounds.bottom) * 0.5
    const textObjectAnchors = this.textObjectScreenTransform.anchors

    textObjectAnchors.left = this.toChildAnchor(this.textViewportBounds.left, maskCenterX, maskHalfWidth)
    textObjectAnchors.right = this.toChildAnchor(this.textViewportBounds.right, maskCenterX, maskHalfWidth)
    textObjectAnchors.bottom = this.toChildAnchor(this.textViewportBounds.bottom, maskCenterY, maskHalfHeight)
    textObjectAnchors.top = this.toChildAnchor(this.textViewportBounds.top, maskCenterY, maskHalfHeight)
  }

  private toChildAnchor(value: number, parentCenter: number, parentHalfSize: number): number {
    return parentHalfSize > 0 ? (value - parentCenter) / parentHalfSize : 0
  }

  private computeMaskOverflowPadding(): vec2 {
    const cursorHeight = this.textManipulationModule.cursorHeight
    this._maskOverflowPadding.x = cursorHeight * MASK_HORIZONTAL_GRAB_HANDLE_OVERFLOW_RATIO
    this._maskOverflowPadding.y = cursorHeight * MASK_VERTICAL_GRAB_HANDLE_OVERFLOW_RATIO
    return this._maskOverflowPadding
  }

  protected markTextDirty(): void {
    if (!this._initialized) return
    this._textDirty = true
    this.batchUpdate()
  }

  protected markSizeDirty(): void {
    if (!this._initialized) return
    this._sizeDirty = true
    this.batchUpdate()
  }

  protected markFontDirty(): void {
    if (!this._initialized) return
    this._fontDirty = true
    this.batchUpdate()
  }

  protected markFontSizeDirty(): void {
    if (!this._initialized) return
    this._fontSizeDirty = true
    this.batchUpdate()
  }

  protected markTextLayoutDirty(): void {
    if (!this._initialized) return
    this._textLayoutDirty = true
    this.batchUpdate()
  }

  protected markAlignmentDirty(): void {
    if (!this._initialized) return
    this._alignmentDirty = true
    this.batchUpdate()
  }

  protected batchUpdate(): void {
    this._batchUpdateEvent.enabled = true
  }

  private flushBatchedUpdatesAndUpdateEvent(): void {
    this._batchUpdateEvent.enabled = false
    try {
      this.flushBatchedUpdates()
    } finally {
      this._batchUpdateEvent.enabled = this.hasPendingBatchedUpdates()
    }
  }

  protected hasPendingBatchedUpdates(): boolean {
    return (
      this._sizeDirty ||
      this._fontDirty ||
      this._fontSizeDirty ||
      this._textDirty ||
      this._selectionDirty ||
      this._textLayoutDirty ||
      this._alignmentDirty
    )
  }

  protected setMaskingEnabled(enabled: boolean): void {
    if (enabled && !this.maskingComponent) {
      this.maskingComponent = this.mask.createComponent("MaskingComponent")
      this.managedComponents.add(this.maskingComponent)
    } else if (!enabled && this.maskingComponent) {
      this.managedComponents.delete(this.maskingComponent)
      this.maskingComponent.destroy()
      this.maskingComponent = null
    }
  }

  protected applyTextAlignment(): void {
    switch (this._horizontalTextAlignment) {
      case TextAlignment.Left:
        this.textComponent.horizontalAlignment = HorizontalAlignment.Left
        break
      case TextAlignment.Center:
        this.textComponent.horizontalAlignment = HorizontalAlignment.Center
        break
      case TextAlignment.Right:
        this.textComponent.horizontalAlignment = HorizontalAlignment.Right
        break
    }
  }

  protected applyLayoutChange(layoutUpdate: () => void): boolean {
    if (!this.maskScreenTransform || !this.textObjectScreenTransform || !this.textManipulationModule) {
      layoutUpdate()
      return false
    }

    const maskAnchors = this.maskScreenTransform.anchors
    const textObjectAnchors = this.textObjectScreenTransform.anchors
    const offsets = this.textObjectScreenTransform.offsets
    copyRect(maskAnchors, this._previousMaskAnchors)
    copyRect(textObjectAnchors, this._previousTextObjectAnchors)
    copyRect(offsets, this._previousTextObjectOffsets)

    layoutUpdate()

    const anchorsChanged =
      !areRectsEqual(maskAnchors, this._previousMaskAnchors) ||
      !areRectsEqual(textObjectAnchors, this._previousTextObjectAnchors)
    const offsetsChanged = !areRectsEqual(offsets, this._previousTextObjectOffsets)

    if (anchorsChanged) {
      this.textManipulationModule.refresh({fromAnchors: true})
      return true
    }
    if (offsetsChanged) {
      this.textManipulationModule.refresh({fromTextOffset: true})
      return true
    }
    return false
  }

  protected refreshTextGeometryAndLayout(reasons: TextGeometryRefreshReasons): void {
    const shouldRefreshTextMetrics = reasons.fromFont === true || reasons.fromFontSize === true
    const shouldRefreshGeometry =
      reasons.fromAnchors === true || reasons.fromAlignment === true || reasons.fromOverflow === true
    const shouldRefreshLayout =
      reasons.updateTextLayout === true ||
      reasons.fromTextOffset === true ||
      shouldRefreshGeometry ||
      shouldRefreshTextMetrics

    if (shouldRefreshTextMetrics) {
      this.textManipulationModule.refresh({
        fromFont: reasons.fromFont,
        fromFontSize: reasons.fromFontSize
      })
      this.updateSize()
    }

    if (shouldRefreshGeometry) {
      this.textManipulationModule.refresh({
        fromAnchors: reasons.fromAnchors,
        fromAlignment: reasons.fromAlignment,
        fromOverflow: reasons.fromOverflow
      })
    }

    let layoutRefreshed = false
    if (shouldRefreshLayout) {
      layoutRefreshed = this.applyLayoutChange(() => this.updateTextLayout())
    }

    if (reasons.fromTextOffset === true && !layoutRefreshed) {
      this.textManipulationModule.refresh({fromTextOffset: true})
    }
  }

  private scrollToIndex(targetIndex: number): void {
    const now = getTime()
    if (now - this.lastScrollTime < this.scrollCooldownSec) return

    let scrolled = false
    this.applyLayoutChange(() => {
      scrolled = this.updateScrollOffset(targetIndex)
    })

    if (scrolled) {
      this.lastScrollTime = now
    }
  }

  protected flushBatchedUpdates(): void {
    const sizeDirty = this._sizeDirty
    const textDirty = this._textDirty
    const selectionDirty = this._selectionDirty
    this._sizeDirty = false
    this._fontDirty = false
    this._fontSizeDirty = false
    this._textDirty = false
    this._selectionDirty = false

    if (sizeDirty) {
      this.updateSize()
    }
    if (textDirty) {
      this.updateText()
    }

    if (selectionDirty && this.isEditing) {
      this.textManipulationModule.setHighlightByCharIndex(
        this.systemKeyboardModule.selectionStart,
        this.systemKeyboardModule.selectionEnd
      )
    }
  }

  protected cancelRequestKeyboard = () => {
    log.d(`cancelling focus request ${this.sceneObject.name}`)
    this.textInputComponentManager.cancelFocusRequest(this)
  }

  protected computeInset(): number {
    return this._size.y * INSET_FACTOR_SINGLE_LINE
  }

  protected onEnabled(): void {
    super.onEnabled()
    this.setVoiceInputActive(true)
  }

  protected onDisabled(): void {
    this.setVoiceInputActive(false)
    this.stopVoiceInputListeningState()
    super.onDisabled()
  }

  protected release() {
    this.deregisterVoiceInputButtonForLifecycle()
    if (this.isEditing) {
      this.editMode(false)
    } else {
      this.textInputComponentManager.deregisterActive(this)
    }
    this.stateCancelSet()
    super.release()
  }
}
