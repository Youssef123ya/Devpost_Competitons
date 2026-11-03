import {unsubscribe} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {RoundedRectangleVisual} from "../../../Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual"
import {isEqual} from "../../Utility/UIKitUtilities"
import {Button} from "../Button/Button"
import {VoiceInputButton} from "../Button/VoiceInputButton"
import {ElementContent} from "../Content/ElementContent"
import {StateName} from "../Element"
import {BaseTextInputComponent} from "../TextInput/BaseTextInputComponent"
import {
  CORNER_RADIUS,
  FONT_SIZE_SCALE,
  IconState,
  INSET_FACTOR_SINGLE_LINE,
  MASK_Z_OFFSET,
  TextAlignment
} from "../TextInput/TextInputConsts"

const log = new NativeLogger("TextInputField")

const EYE_ICON: Texture = requireAsset("../../../Textures/eye-icon.png") as Texture
const EYE_OFF_ICON: Texture = requireAsset("../../../Textures/eye-off-icon.png") as Texture

const BUTTON_INSET_FACTOR = 0.15

const ACTION_SLOT_HEIGHT_FACTOR = 0.6
const ACTION_SLOT_ICON_SIZE_FACTOR = 0.56

const CLEAR_BUTTON_HEIGHT_FACTOR = 0.73
const CLEAR_BUTTON_WIDTH_TO_HEIGHT_RATIO = 1.36

export type TextInputType = "default" | "numeric" | "password" | "pin" | "url"
export type ActionSlotMode = "none" | "password" | "voiceInput" | "iconChange"
type FieldControlOpacityTarget = "all" | "actionSlot" | "clearButton"

/**
 * TextInputField
 * Single-line text input component for Spectacles.
 * Supports password masking and a single action slot whose
 * behavior is driven by `inputType` (password) and action slot
 * (none / voiceInput / iconChange).
 */
@component
export class TextInputField extends BaseTextInputComponent {
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Alignment</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Horizontal text alignment</span>')
  @input("string", "left")
  @widget(new ComboBoxWidget([new ComboBoxItem("Left", "left"), new ComboBoxItem("Right", "right")]))
  @hint("Alignment of the text within the text field.")
  protected _horizontalTextAlignment: TextAlignment = TextAlignment.Left

  // ─── Input Type ──────────────────────────────────────────────────────

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Input Type</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Validation and keyboard behavior</span>')
  @input("string", "default")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Default", "default"),
      new ComboBoxItem("Numeric", "numeric"),
      new ComboBoxItem("Password", "password"),
      new ComboBoxItem("Pin", "pin"),
      new ComboBoxItem("URL", "url")
    ])
  )
  public inputType: TextInputType = "default"

  @input
  @hint("Throw error if unfocused with no input")
  public contentRequiredOnDeactivate: boolean = false

  // ─── Action Slot ─────────────────────────────────────────────────────

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Action Slot</span>')
  @ui.label(
    '<span style="color: #94A3B8; font-size: 11px;">Action slot follows horizontal text alignment. `password` input type overrides this with an eye-icon toggle.</span>'
  )
  @input
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("None", "none"),
      new ComboBoxItem("Voice Input", "voiceInput"),
      new ComboBoxItem("Icon Change", "iconChange")
    ])
  )
  private _actionSlot: string = "voiceInput"

  @input
  @showIf("_actionSlot", "iconChange")
  @allowUndefined
  @hint("Icon Texture")
  public icon: Texture

  @input
  @showIf("_actionSlot", "iconChange")
  @hint("Switch to a different icon on focus")
  public changeIconOnFocus: boolean = false

  @input
  @showIf("changeIconOnFocus", true)
  @allowUndefined
  @hint("Alternate icon used on focus")
  public alternateIcon: Texture

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Clear Button</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Show a clear button when text has been entered</span>')
  @input
  @label("Show Clear Button")
  @hint("Show a clear button when text has been entered")
  private _showClearButton: boolean = true

  private actionSlotObject: SceneObject | null = null
  private actionSlotTransform: Transform | null = null
  private actionSlotButton: Button | null = null
  private _actionSlotContent: ElementContent | null = null

  private voiceInputUnsubscribe: unsubscribe | null = null

  private clearButtonObject: SceneObject | null = null
  private clearButtonTransform: Transform | null = null
  private clearButton: Button | null = null
  private clearButtonContent: ElementContent | null = null

  private currentActionSlotMode: ActionSlotMode = "voiceInput"

  private hidePassword: boolean = true

  private _textOffset: vec2 = vec2.zero()
  private textAvailableWidth: number = 0

  private _actionSlotModeDirty: boolean = false
  private readonly actionSlotPosition: vec3 = vec3.zero()
  private readonly clearButtonPosition: vec3 = vec3.zero()

  private _scrollOffsetX: number = 0
  protected scrollCooldownSec: number = 0.05

  /**
   * Gets the horizontal text offset applied inside the field.
   * @returns The current text offset.
   */
  public get textOffset(): vec2 {
    return this._textOffset
  }

  /**
   * Sets the horizontal text offset applied inside the field.
   * Triggers a batched text layout update after initialization.
   * @param offset - The new text offset.
   */
  public set textOffset(offset: vec2) {
    if (offset === undefined || isEqual(offset, this._textOffset)) return
    this._textOffset = offset
    if (this._initialized) {
      this.markTextLayoutDirty()
    }
  }

  /**
   * Gets the horizontal text alignment.
   * @returns The current horizontal alignment.
   */
  public get horizontalTextAlignment(): TextAlignment {
    return super.horizontalTextAlignment
  }

  /**
   * Sets the horizontal text alignment.
   * Center alignment is unsupported for single-line fields and is ignored.
   * @param value - The desired horizontal alignment.
   */
  public set horizontalTextAlignment(value: TextAlignment) {
    if (value === TextAlignment.Center) {
      log.w("TextInputField does not support center text alignment.")
      return
    }
    super.horizontalTextAlignment = value
  }

  /**
   * Sets the input behavior and refreshes keyboard, masking, and action slot state.
   * @param type - The input type to apply.
   */
  public setInputType = (type: TextInputType) => {
    if (type === undefined || isEqual(type, this.inputType)) return
    this.inputType = type
    if (this._initialized) {
      this.systemKeyboardModule.keyboardType = this.keyboardType
      this.markActionSlotModeDirty()
      this.markTextDirty()
    }
  }

  /**
   * Gets the configured action slot mode.
   * Password input overrides this setting at runtime.
   * @returns The configured action slot mode.
   */
  public get actionSlot(): string {
    return this._actionSlot
  }

  /**
   * Sets the configured action slot mode.
   * Password input still forces the effective action slot to the password toggle.
   * @param action - The action slot mode to configure.
   */
  public set actionSlot(action: "none" | "voiceInput" | "iconChange") {
    if (action === undefined || isEqual(action, this._actionSlot)) return
    this._actionSlot = action
    if (this._initialized) {
      this.markActionSlotModeDirty()
    }
  }

  /**
   * Gets whether the clear button should be created and shown when text is present.
   * @returns `true` when clear button support is enabled.
   */
  public get showClearButton(): boolean {
    return this._showClearButton
  }

  /**
   * Sets whether the clear button should be created and shown when text is present.
   * Rebuilds clear-button UI and refreshes text layout after initialization.
   * @param value - `true` to enable the clear button.
   */
  public set showClearButton(value: boolean) {
    if (value === undefined || isEqual(value, this._showClearButton)) return
    this._showClearButton = value
    if (this._initialized) {
      if (this._showClearButton) {
        this.createClearButton()
        this.updateClearButtonLayout()
        this.updateClearButtonVisibility()
      } else {
        this.destroyClearButton()
      }
      this.markTextLayoutDirty()
    }
  }

  /**
   * Gets the content component used by the current action slot.
   * @returns The active action slot content, or null when no slot content exists.
   */
  public get actionSlotContent(): ElementContent | null {
    return this.currentActionSlotMode === "voiceInput"
      ? (this.voiceInputButton?.voiceIconContent ?? null)
      : this._actionSlotContent
  }

  /**
   * Initializes field-specific masking, action slot state, and clear button visibility.
   */
  public initialize(): void {
    super.initialize()
    this.setMaskingEnabled(true)
    this.applyActionSlotMode()
    this.updateClearButtonVisibility()
  }

  /**
   * Applies the interaction state and updates icon-change slot visuals when needed.
   * @param stateName - The state to apply.
   */
  public setState(stateName: StateName) {
    super.setState(stateName)
    if (this.currentActionSlotMode !== "iconChange" || !this._actionSlotContent) {
      return
    }
    const state = this._states.get(stateName)
    const nextIcon =
      state.icon === IconState.alternate && this.changeIconOnFocus && this.alternateIcon
        ? this.alternateIcon
        : this.icon
    if (nextIcon && this._actionSlotContent.leadingIcon !== nextIcon) {
      this._actionSlotContent.leadingIcon = nextIcon
    }
  }

  protected get keyboardType(): TextInputSystem.KeyboardType {
    switch (this.inputType) {
      case "numeric":
        return TextInputSystem.KeyboardType.Num
      case "password":
        return TextInputSystem.KeyboardType.Password
      case "pin":
        return TextInputSystem.KeyboardType.Pin
      case "url":
        return TextInputSystem.KeyboardType.Url
      case "default":
      default:
        return TextInputSystem.KeyboardType.Text
    }
  }

  private get effectiveActionSlotMode(): ActionSlotMode {
    if (this.inputType === "password") return "password"
    return (this._actionSlot as ActionSlotMode) ?? "none"
  }

  private get isClearButtonVisible(): boolean {
    return !this.voiceListeningPlaceholderActive && !this.isPlaceholder && this._text !== ""
  }

  private get isRightAligned(): boolean {
    return this._horizontalTextAlignment === TextAlignment.Right
  }

  protected createDefaultVisual(): void {
    super.createDefaultVisual()
    if (this._showClearButton) {
      this.createClearButton()
    }
  }

  protected initializeTextComponent(): void {
    this.applyTextAlignment()
    this.textComponent.horizontalOverflow = HorizontalOverflow.Overflow
  }

  protected updateVisibleText(text: string): void {
    this.textComponent.text =
      this.inputType === "password" && !this.isPlaceholder && this.hidePassword ? "*".repeat(text.length) : text
  }

  protected onTextUpdated(textChanged: boolean = true): void {
    super.onTextUpdated(textChanged)
    if (this._text === "" && this.contentRequiredOnDeactivate) {
      this._hasError = true
    }
    this.updateClearButtonVisibility()
  }

  protected updateSize() {
    super.updateSize()
    if (this.currentActionSlotMode !== "none") {
      this.updateActionSlotLayout()
    }
    this.updateClearButtonLayout()
  }

  protected applyOpacity(): void {
    super.applyOpacity()
    this.applyFieldControlOpacity()
  }

  private applyFieldControlOpacity(target: FieldControlOpacityTarget = "all"): void {
    if (target === "all" || target === "actionSlot") {
      if (this.actionSlotButton) {
        this.actionSlotButton.opacity = this._opacity
      }
      if (this._actionSlotContent) {
        this._actionSlotContent.opacity = this._opacity
      }
    }
    if (target === "all" || target === "clearButton") {
      if (this.clearButton) {
        this.clearButton.opacity = this._opacity
      }
      if (this.clearButtonContent) {
        this.clearButtonContent.opacity = this._opacity
      }
    }
  }

  private updateActionSlotLayout(): void {
    const slotSide = this.updateActionSlotPosition()
    if (slotSide === null) return

    this.updateActionSlotButtonLayout(slotSide)
    this.updateActionSlotContentLayout(slotSide)
  }

  private updateActionSlotPosition(): number | null {
    if (!this.actionSlotTransform) return null

    const slotSide = this._size.y * ACTION_SLOT_HEIGHT_FACTOR
    this.actionSlotPosition.x = this.isRightAligned
      ? this._size.x * 0.5 - this._size.y * 0.5
      : -this._size.x * 0.5 + this._size.y * 0.5
    this.actionSlotPosition.y = 0
    this.actionSlotPosition.z = MASK_Z_OFFSET + 0.5
    this.actionSlotTransform.setLocalPosition(this.actionSlotPosition)

    return slotSide
  }

  private updateActionSlotButtonLayout(slotSide: number): void {
    if (!this.actionSlotButton) return

    const currentButtonSize = this.actionSlotButton.size
    if (currentButtonSize.x !== slotSide || currentButtonSize.y !== slotSide || currentButtonSize.z !== 1) {
      this.actionSlotButton.size = new vec3(slotSide, slotSide, 1)
    }
    this.updateFullHeightButtonCollider(this.actionSlotButton)
  }

  private updateActionSlotContentLayout(slotSide: number): void {
    if (!this._actionSlotContent) return

    const slotWidth = this.actionSlotButton?.size.x ?? slotSide
    const slotHeight = this.actionSlotButton?.size.y ?? slotSide
    this._actionSlotContent.sizeOverride = new vec2(slotWidth, slotHeight)
    this._actionSlotContent.leadingIconSize = Math.min(slotWidth, slotHeight) * ACTION_SLOT_ICON_SIZE_FACTOR
  }

  protected flushBatchedUpdates(): void {
    const sizeDirty = this._sizeDirty
    const fontDirty = this._fontDirty
    const fontSizeDirty = this._fontSizeDirty
    super.flushBatchedUpdates()
    const actionSlotModeDirty = this._actionSlotModeDirty
    const alignmentDirty = this._alignmentDirty
    this._actionSlotModeDirty = false
    this._alignmentDirty = false
    if (actionSlotModeDirty) {
      this.applyActionSlotMode()
    }
    if (alignmentDirty) {
      this.applyTextAlignment()
      this._scrollOffsetX = 0
      if (!sizeDirty) {
        this.updateSize()
      }
    }
    const textLayoutDirty = this._textLayoutDirty
    this._textLayoutDirty = false
    this.refreshTextGeometryAndLayout({
      fromFont: fontDirty,
      fromFontSize: fontSizeDirty || sizeDirty,
      fromAnchors: sizeDirty,
      fromAlignment: alignmentDirty,
      updateTextLayout: sizeDirty || alignmentDirty || textLayoutDirty
    })
  }

  protected hasPendingBatchedUpdates(): boolean {
    return super.hasPendingBatchedUpdates() || this._actionSlotModeDirty
  }

  private markActionSlotModeDirty(): void {
    if (!this._initialized) return
    this._actionSlotModeDirty = true
    this.batchUpdate()
  }

  protected onEditModeChanged(editing: boolean): void {
    super.onEditModeChanged(editing)
    this.markTextLayoutDirty()
  }

  protected updateTextLayout(): void {
    let leftInset = this._size.y * INSET_FACTOR_SINGLE_LINE
    let rightInset = this._size.y * INSET_FACTOR_SINGLE_LINE
    const buttonInset = this._size.y * BUTTON_INSET_FACTOR

    if (this.currentActionSlotMode !== "none") {
      const actionSlotHalfWidth = this._size.y * ACTION_SLOT_HEIGHT_FACTOR * 0.5
      const actionSlotInset = this._size.y * 0.5 + actionSlotHalfWidth + buttonInset
      if (this.isRightAligned) {
        rightInset = actionSlotInset
      } else {
        leftInset = actionSlotInset
      }
    }

    if (this.clearButtonObject && this.isClearButtonVisible) {
      const clearWidth = this._size.y * CLEAR_BUTTON_HEIGHT_FACTOR * CLEAR_BUTTON_WIDTH_TO_HEIGHT_RATIO
      const clearInset = clearWidth + buttonInset * 2
      if (this.isRightAligned) {
        leftInset = clearInset
      } else {
        rightInset = clearInset
      }
    }

    this.setTextViewportBounds(
      -this._size.x * 0.5 + leftInset,
      this._size.x * 0.5 - rightInset,
      this._size.y * -0.5,
      this._size.y * 0.5
    )

    this.updateTextAvailableWidth()
    let scrollOffsetApplied = false
    if (this.isEditing) {
      scrollOffsetApplied = this.updateScrollOffset(this.textManipulationModule.caretIndex)
      if (!scrollOffsetApplied) {
        this.clampScrollOffset()
      }
    } else {
      this._scrollOffsetX = 0
    }
    if (!scrollOffsetApplied) {
      this.applyScrollOffset()
    }
  }

  private updateTextAvailableWidth(): void {
    const viewportWidth = this.textViewportBounds.getSize().x
    this.textAvailableWidth = viewportWidth - this.textOffset.x + this.textOffset.y
  }

  private applyScrollOffset(): void {
    if (!this.textObjectScreenTransform) return
    this.textObjectScreenTransform.offsets.left = this.textOffset.x + this._scrollOffsetX
    this.textObjectScreenTransform.offsets.right = this.textOffset.y + this._scrollOffsetX
  }

  private clampScrollOffset(): void {
    const boundingBox = this.textManipulationModule?.boundingBox
    if (!boundingBox) return
    const textWidth = boundingBox.getSize().x
    if (textWidth <= this.textAvailableWidth) {
      this._scrollOffsetX = 0
      return
    }
    const scrollRange = textWidth - this.textAvailableWidth
    if (this.isRightAligned) {
      this._scrollOffsetX = Math.max(0, Math.min(scrollRange, this._scrollOffsetX))
    } else {
      this._scrollOffsetX = Math.max(-scrollRange, Math.min(0, this._scrollOffsetX))
    }
  }

  protected updateScrollOffset(targetIndex: number): boolean {
    if (!this.isEditing) return false
    const cursorPositionData = this.textManipulationModule.cursorPositions?.[targetIndex]
    if (!cursorPositionData) return false

    const previousScroll = this._scrollOffsetX
    const boundingBox = this.textManipulationModule.boundingBox
    const textWidth = boundingBox ? boundingBox.getSize().x : 0

    if (textWidth <= this.textAvailableWidth) {
      this._scrollOffsetX = 0
    } else {
      const halfWidth = this.textAvailableWidth / 2
      const caretX = cursorPositionData.position.x
      if (caretX > halfWidth) {
        this._scrollOffsetX -= caretX - halfWidth
      } else if (caretX < -halfWidth) {
        this._scrollOffsetX += -halfWidth - caretX
      }
      const scrollRange = textWidth - this.textAvailableWidth
      if (this.isRightAligned) {
        this._scrollOffsetX = Math.max(0, Math.min(scrollRange, this._scrollOffsetX))
      } else {
        this._scrollOffsetX = Math.max(-scrollRange, Math.min(0, this._scrollOffsetX))
      }
    }

    if (this._scrollOffsetX === previousScroll) return false

    this.applyScrollOffset()
    return true
  }

  private updateClearButtonVisibility(): void {
    if (!this.clearButtonObject) return
    const wasClearButtonVisible = this.clearButtonObject.enabled
    if (wasClearButtonVisible === this.isClearButtonVisible) return
    this.clearButtonObject.enabled = this.isClearButtonVisible
    this.markTextLayoutDirty()
  }

  private updateClearButtonLayout(): void {
    if (!this.clearButtonObject || !this.clearButton || !this.clearButtonTransform) return

    const h = this._size.y * CLEAR_BUTTON_HEIGHT_FACTOR
    const w = h * CLEAR_BUTTON_WIDTH_TO_HEIGHT_RATIO
    const inset = this._size.y * BUTTON_INSET_FACTOR
    this.clearButton.size = new vec3(w, h, 1)
    this.updateFullHeightButtonCollider(this.clearButton)
    const clearX = this.isRightAligned ? -this._size.x * 0.5 + w * 0.5 + inset : this._size.x * 0.5 - w * 0.5 - inset
    this.clearButtonPosition.x = clearX
    this.clearButtonPosition.y = 0
    this.clearButtonPosition.z = MASK_Z_OFFSET + 0.01
    this.clearButtonTransform.setLocalPosition(this.clearButtonPosition)
    if (this.clearButtonContent) {
      this.clearButtonContent.textSize = this.computeFontSize()
    }
  }

  private updateFullHeightButtonCollider(button: Button | null): void {
    if (!button) return

    const buttonSize = button.size
    const heightScale = buttonSize.y !== 0 ? this._size.y / buttonSize.y : 1
    button.colliderFitElement = false
    button.colliderSize = new vec3(buttonSize.x * heightScale, this._size.y, buttonSize.z)
  }

  protected updateRenderOrder(value: number) {
    super.updateRenderOrder(value)
    if (this.currentActionSlotMode !== "none" && this.actionSlotButton) {
      this.actionSlotButton.renderOrder = value + 1
    }
    if (this.actionSlotContent) {
      this.actionSlotContent.renderOrder = value
    }
    if (this.clearButton) this.clearButton.renderOrder = value + 1
    if (this.clearButtonContent) this.clearButtonContent.renderOrder = value - 1
  }

  protected computeFontSize(): number {
    if (this._fontSize > 0) {
      return this._fontSize * (this._size.y / this._originalSize.y)
    }
    return this._size.y * FONT_SIZE_SCALE
  }

  protected release() {
    this.destroyActionSlot()
    super.release()
  }

  private createActionSlot(mode: Exclude<ActionSlotMode, "none">): void {
    if (this.actionSlotObject) return

    const isVoiceInput = mode === "voiceInput"
    const isIconChange = mode === "iconChange"

    this.actionSlotObject = global.scene.createSceneObject(
      isVoiceInput ? "VoiceInputButton" : isIconChange ? "ActionIconSlot" : "ActionSlotButton"
    )
    this.managedSceneObjects.add(this.actionSlotObject)
    this.actionSlotTransform = this.actionSlotObject.getTransform()
    this.actionSlotObject.layer = this.sceneObject.layer
    this.actionSlotObject.setParent(this.sceneObject)

    if (!isIconChange) {
      this.actionSlotButton = isVoiceInput
        ? (this.actionSlotObject.createComponent(VoiceInputButton.getTypeName()) as VoiceInputButton)
        : this.actionSlotObject.createComponent(Button.getTypeName())
      this.managedComponents.add(this.actionSlotButton)
      this.actionSlotButton.renderOrder = this._renderOrder + 1
      this.actionSlotButton.setTheme("SnapOS3", "PrismGhost")
    }

    if (isVoiceInput && this.actionSlotButton) {
      const voiceInputButton = this.actionSlotButton as VoiceInputButton
      this.registerVoiceInputButton(voiceInputButton)
      this.voiceInputUnsubscribe = voiceInputButton.onInitialized.add(() => {
        this.updateActionSlotLayout()
      })
      return
    }

    this.createActionSlotContent(isIconChange ? "iconChange" : "password")

    if (this.actionSlotButton) {
      this.actionSlotButton.setIsToggleable(true)
      this.actionSlotButton.onInitialized.add(() => {
        this.updateActionSlotLayout()
      })
      this.actionSlotButton.onValueChange.add((v) => this.onPasswordToggleValueChanged(v === 1))
    }
  }

  private createActionSlotContent(mode: Exclude<ActionSlotMode, "none" | "voiceInput">): void {
    if (!this.actionSlotObject) return

    this._actionSlotContent = this.actionSlotObject.createComponent(ElementContent.getTypeName()) as ElementContent
    this.managedComponents.add(this._actionSlotContent)
    this._actionSlotContent.text = ""
    this._actionSlotContent.trailingIcon = null
    this._actionSlotContent.contentAlignment = "center"
    this._actionSlotContent.iconLayout = "left"
    this._actionSlotContent.spacing = 0
    this._actionSlotContent.padding = {top: 0, right: 0, bottom: 0, left: 0}
    this._actionSlotContent.autoResize = false
    this._actionSlotContent.renderOrder = this._renderOrder

    const slotSide = this._size.y * ACTION_SLOT_HEIGHT_FACTOR
    this._actionSlotContent.sizeOverride = new vec2(slotSide, slotSide)
    this._actionSlotContent.leadingIconSize = slotSide * ACTION_SLOT_ICON_SIZE_FACTOR
    this._actionSlotContent.leadingIcon = this.getActionSlotIcon(mode)
  }

  private getActionSlotIcon(mode: Exclude<ActionSlotMode, "none" | "voiceInput">): Texture | null {
    if (mode === "password") {
      return this.hidePassword ? EYE_OFF_ICON : EYE_ICON
    }
    return this.icon ?? null
  }

  private destroyActionSlot(): void {
    const actionSlotObject = this.actionSlotObject
    const wasVoiceInput = this.currentActionSlotMode === "voiceInput"

    if (this.actionSlotButton?.isOn) {
      this.actionSlotButton.toggle(false)
    }
    if (wasVoiceInput) {
      this.deregisterVoiceInputButton()
    }
    this.unsubscribeVoiceInputEvents()

    if (this.actionSlotButton) {
      this.managedComponents.delete(this.actionSlotButton)
    }
    if (this._actionSlotContent) {
      this.managedComponents.delete(this._actionSlotContent)
    }
    if (this.actionSlotObject) {
      this.managedSceneObjects.delete(this.actionSlotObject)
    }

    if (actionSlotObject) {
      actionSlotObject.destroy()
    }

    this.actionSlotObject = null
    this.actionSlotTransform = null
    this.actionSlotButton = null
    this._actionSlotContent = null
  }

  private createClearButton(): void {
    if (this.clearButtonObject) return

    this.clearButtonObject = global.scene.createSceneObject("ClearButton")
    this.managedSceneObjects.add(this.clearButtonObject)
    this.clearButtonTransform = this.clearButtonObject.getTransform()
    this.clearButtonObject.layer = this.sceneObject.layer
    this.clearButtonObject.setParent(this.sceneObject)

    this.clearButton = this.clearButtonObject.createComponent(Button.getTypeName())
    this.managedComponents.add(this.clearButton)
    this.clearButton.renderOrder = this._renderOrder + 1
    this.clearButton.setTheme("SnapOS3", "Secondary")
    this.clearButton.onInitialized.add(() => {
      if (this.clearButton.visual instanceof RoundedRectangleVisual) {
        this.clearButton.visual.cornerRadius = CORNER_RADIUS
      }
    })

    this.clearButtonContent = this.clearButtonObject.createComponent(ElementContent.getTypeName()) as ElementContent
    this.managedComponents.add(this.clearButtonContent)
    this.clearButtonContent.text = "Clear"
    this.clearButtonContent.leadingIcon = null
    this.clearButtonContent.trailingIcon = null
    this.clearButtonContent.contentAlignment = "center"
    this.clearButtonContent.iconLayout = "left"
    this.clearButtonContent.spacing = 0
    this.clearButtonContent.padding = {top: 0, right: 0, bottom: 0, left: 0}
    this.clearButtonContent.autoResize = false
    this.clearButtonContent.textSize = this.computeFontSize()
    this.clearButtonContent.renderOrder = this._renderOrder - 1

    this.clearButton.onTriggerUp.add(() => this.onClearPressed())

    this.applyFieldControlOpacity("clearButton")
    this.clearButtonObject.enabled = false
  }

  private destroyClearButton(): void {
    const clearButtonObject = this.clearButtonObject

    if (this.clearButton) {
      this.managedComponents.delete(this.clearButton)
    }
    if (this.clearButtonContent) {
      this.managedComponents.delete(this.clearButtonContent)
    }
    if (this.clearButtonObject) {
      this.managedSceneObjects.delete(this.clearButtonObject)
    }

    if (clearButtonObject) {
      clearButtonObject.destroy()
    }

    this.clearButtonObject = null
    this.clearButtonTransform = null
    this.clearButton = null
    this.clearButtonContent = null
  }

  private onClearPressed(): void {
    if (this.text === "") return
    this._text = ""
    this.updateText()
    this.systemKeyboardModule.updateText(this.text, 0, 0)
  }

  private applyActionSlotMode(): void {
    if (!this._initialized) return

    const mode = this.effectiveActionSlotMode
    const previousMode = this.currentActionSlotMode

    if (previousMode !== mode) {
      this.destroyActionSlot()
    }

    this.currentActionSlotMode = mode

    if (mode === "none") {
      this.markTextLayoutDirty()
      return
    }

    if (!this.actionSlotObject) {
      this.createActionSlot(mode)
    }

    this.updateActionSlotLayout()

    switch (mode) {
      case "password":
        this.setActionSlotIcon(this.hidePassword ? EYE_OFF_ICON : EYE_ICON)
        break
      case "voiceInput":
        break
      case "iconChange":
        this.setActionSlotIcon(this.icon ?? null)
        break
    }

    this.applyFieldControlOpacity("actionSlot")
    this.markTextLayoutDirty()
  }

  private onPasswordToggleValueChanged(isOn: boolean): void {
    if (this.currentActionSlotMode === "password") {
      this.hidePassword = !isOn
      this.setActionSlotIcon(this.hidePassword ? EYE_OFF_ICON : EYE_ICON)
      this.updateVisibleText(this.isPlaceholder ? this._placeholderText : this._text)
      this.onTextUpdated(false)
    }
  }

  private setActionSlotIcon(texture: Texture | null): void {
    if (this._actionSlotContent) {
      this._actionSlotContent.leadingIcon = texture
    }
  }

  protected onVoiceListeningPlaceholderChanged(): void {
    this.updateClearButtonVisibility()
  }

  private unsubscribeVoiceInputEvents(): void {
    if (this.voiceInputUnsubscribe) {
      this.voiceInputUnsubscribe()
      this.voiceInputUnsubscribe = null
    }
  }

  private get voiceInputButton(): VoiceInputButton | null {
    return this.currentActionSlotMode === "voiceInput" ? (this.actionSlotButton as VoiceInputButton) : null
  }
}
