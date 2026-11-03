import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"

const log = new NativeLogger("SystemKeyboardModule")

const USE_KEYBOARD_ENGINE = true

export interface SystemKeyboardDelegate {
  onKeyboardStateChangedHandler(isOpen: boolean): void
  onSetSelectionHandler(start: number, end: number): void
  onTextChangedHandler(text: string, selectionStart?: number, selectionEnd?: number): void
  onReturnKeyPressedHandler(): void
  readonly text: string
}

export class SystemKeyboardModule {
  private isKeyboardOpen: boolean = false
  private isComposing: boolean = false
  private hasBatchEditStarted: boolean = false
  private isProcessingSTT: boolean = false

  private readonly _selectionRange: vec2 = vec2.zero()
  private readonly composingRegion: vec2 = new vec2(-1, -1)

  private readonly keyboardOptions = new TextInputSystem.KeyboardOptions()

  /**
   * Gets the native keyboard layout type used for future keyboard requests.
   * @returns The configured keyboard type.
   */
  public get keyboardType(): TextInputSystem.KeyboardType {
    return this.keyboardOptions.keyboardType
  }

  /**
   * Sets the native keyboard layout type used for future keyboard requests.
   * @param keyboardType - The keyboard type to use.
   */
  public set keyboardType(keyboardType: TextInputSystem.KeyboardType) {
    this.keyboardOptions.keyboardType = keyboardType
  }

  /**
   * Gets the native return key type used for future keyboard requests.
   * @returns The configured return key type.
   */
  public get returnKeyType(): TextInputSystem.ReturnKeyType {
    return this.keyboardOptions.returnKeyType
  }

  /**
   * Sets the native return key type used for future keyboard requests.
   * @param returnKeyType - The return key type to use.
   */
  public set returnKeyType(returnKeyType: TextInputSystem.ReturnKeyType) {
    this.keyboardOptions.returnKeyType = returnKeyType
  }

  /**
   * Current selection start in UTF-16 character units.
   * Exposed as a primitive so external callers cannot mutate the underlying `vec2`.
   */
  public get selectionStart(): number {
    return this._selectionRange.x
  }

  /**
   * Current selection end in UTF-16 character units.
   * Exposed as a primitive so external callers cannot mutate the underlying `vec2`.
   */
  public get selectionEnd(): number {
    return this._selectionRange.y
  }

  /**
   * Updates the cached selection range without notifying the system keyboard.
   *
   * Use this when the engine is the authoritative source of the change (e.g. the
   * engine invoked `onSetSelection` / `onUpdateText`), so pushing back would be
   * either redundant or cause a feedback loop. For selection changes originating
   * on our side (caret moved, highlight dragged), use {@link updateSelectionRange}
   * instead, which also calls `setSelectedTextRange` on the engine.
   */
  public set selectionRange(range: {start: number; end: number}) {
    this._selectionRange.x = range.start
    this._selectionRange.y = range.end
  }

  /**
   * Creates a keyboard bridge for a text input delegate.
   * @param keyboardType - Initial native keyboard layout type.
   * @param returnKeyType - Initial native return key type.
   * @param delegate - Object that receives keyboard state, selection, text, and return-key callbacks.
   */
  public constructor(
    keyboardType: TextInputSystem.KeyboardType,
    returnKeyType: TextInputSystem.ReturnKeyType,
    private delegate: SystemKeyboardDelegate
  ) {
    this.keyboardOptions.keyboardType = keyboardType
    this.keyboardOptions.returnKeyType = returnKeyType
    this.keyboardOptions.enablePreview = false

    this.setupCallbacks()
  }

  private setupCallbacks(): void {
    this.keyboardOptions.onKeyboardStateChanged = (isOpen: boolean) => {
      this.delegate.onKeyboardStateChangedHandler(isOpen)
    }

    if (USE_KEYBOARD_ENGINE) {
      this.keyboardOptions.onError = (code: number, description: string) => {
        log.e(`Keyboard engine error ${code}: ${description}`)
      }

      this.keyboardOptions.onSetSelection = (start: number, end: number) => {
        this.delegate.onSetSelectionHandler(start, end)
      }

      this.keyboardOptions.onSetComposingRegion = (start: number, end: number) => {
        this.handleSetComposingRegion(start, end)
      }

      // Delta (incremental) text updates.
      this.keyboardOptions.onSetComposingText = (text: string, newCursorPosition: number) => {
        // When you receive a setComposingText without a batchEdit, can you manually reset the composing region to the selection range
        if (!this.hasBatchEditStarted && !this.isProcessingSTT) {
          this.isProcessingSTT = true
          if (this.isComposing) {
            this.composingRegion.x = this._selectionRange.x
            this.composingRegion.y = this._selectionRange.y
          }
        }

        this.handleSetComposingText(text, newCursorPosition)
      }

      // TODO: Remove following onBeginBatchEdit and onTextChanged handlers once mobile keyboard has implemented KeyboardEngine.
      this.keyboardOptions.onBeginBatchEdit = () => {
        this.hasBatchEditStarted = true
      }

      this.keyboardOptions.onTextChanged = (text: string) => {
        if (this.hasBatchEditStarted) {
          // AR virtual keyboard already applied changes via batch edit API; discard the post-batch echo.
          this.hasBatchEditStarted = false
          return
        }

        // Mobile pairing app path: legacy API only emits onTextChanged with a wholesale string.
        // Reset composing region since this is a full replacement, not an incremental edit.
        this.isComposing = false
        this.composingRegion.x = -1
        this.composingRegion.y = -1

        this.delegate.onTextChangedHandler(text, text.length, text.length)

        // Mobile gives no selection info; place caret at the end of the new text and keep local cache in sync.
        this._selectionRange.x = text.length
        this._selectionRange.y = text.length

        // Push the latest state into KeyboardEngine so it stays consistent with what the delegate now holds.
        this.updateText(text, text.length, text.length)
      }

      // "Insert this string at the current cursor position (and clear any composing region)."
      this.keyboardOptions.onCommitText = (text: string, newCursorPosition: number) => {
        this.handleSetComposingText(text, newCursorPosition)
        //when ending (onCommitText) a speech2text interaction. We need to send updateText back to the input method manager so the keyboard engine context is updated correctly
        if (this.isProcessingSTT) {
          this.updateText(this.delegate.text, this.composingRegion.y, this.composingRegion.y)
        }
        this.isComposing = false
        this.composingRegion.x = -1
        this.composingRegion.y = -1
        this.isProcessingSTT = false
      }

      this.keyboardOptions.onPerformEditorAction = (action: number) => {
        this.handlePerformEditorAction(action)
      }

      // Pushing full text state updates
      // Pasting large blocks of text
      this.keyboardOptions.onUpdateText = (updateText: TextInputSystem.TextUpdate) => {
        const text = updateText.text
        const selectionStart = updateText.selectionStart
        const selectionEnd = updateText.selectionEnd

        const textChanged = text !== undefined && text !== this.delegate.text
        const selectionChanged = selectionStart !== undefined && selectionEnd !== undefined

        if (textChanged) {
          // Cold reset: engine pushed the full editor state, so any composing region we were tracking is gone.
          this.isComposing = false
          this.composingRegion.x = -1
          this.composingRegion.y = -1
          // Updates text and optionally range if provided
          this.delegate.onTextChangedHandler(
            text,
            selectionChanged ? selectionStart : undefined,
            selectionChanged ? selectionEnd : undefined
          )
        } else if (selectionChanged) {
          // If only the selection changed (e.g. user tapped elsewhere in the text box)
          this.delegate.onSetSelectionHandler(selectionStart, selectionEnd)
        }
      }
    } else {
      this.keyboardOptions.onTextChanged = (text: string) => {
        this.delegate.onTextChangedHandler(text, text.length, text.length)
      }
      this.keyboardOptions.onReturnKeyPressed = () => {
        this.delegate.onReturnKeyPressedHandler()
      }
    }
  }

  private handleSetComposingRegion(start: number, end: number): void {
    if (start === -1 || end === -1 || start === end) {
      this.isComposing = false
    } else {
      this.isComposing = true
      // Ensure x is min and y is max
      this.composingRegion.x = Math.min(start, end)
      this.composingRegion.y = Math.max(start, end)
    }
  }

  private handleSetComposingText(textToInsert: string, newCursorPosition: number): void {
    let start: number
    let end: number

    if (this.isComposing) {
      start = this.composingRegion.x
      end = this.composingRegion.y
    } else {
      start = Math.min(this._selectionRange.x, this._selectionRange.y)
      end = Math.max(this._selectionRange.x, this._selectionRange.y)
      // TODO: Verify the behavior:
      // Fleksy KeyboardEngine Guide claims that the engine always pre-declares a setComposingRegion when replacing a selection doesn't hold for this runtime
      // // Insert at the caret; the engine fires setComposingRegion when a selection should be replaced.
      // start = Math.min(this._selectionRange.x, this._selectionRange.y)
      // end = start
    }

    // 1. Splice the new text
    const newText = this.delegate.text.substring(0, start) + textToInsert + this.delegate.text.substring(end)

    // 2. Calculate new absolute cursor position (Android InputConnection semantics)
    const composingEnd = start + textToInsert.length
    let absoluteCursorPos: number
    if (newCursorPosition > 0) {
      absoluteCursorPos = composingEnd + newCursorPosition - 1
    } else {
      absoluteCursorPos = start + newCursorPosition
    }
    absoluteCursorPos = Math.max(0, Math.min(absoluteCursorPos, newText.length))

    // 3. Apply the changes
    this.delegate.onTextChangedHandler(newText, absoluteCursorPos, absoluteCursorPos)

    // 4. Update the composing region bounds
    if (textToInsert.length > 0) {
      this.isComposing = true
      this.composingRegion.x = start
      this.composingRegion.y = start + textToInsert.length
    } else {
      this.isComposing = false
    }
  }

  private handlePerformEditorAction(action: number): void {
    if (USE_KEYBOARD_ENGINE) {
      if (action === TextInputSystem.TextFieldAction.NewLine) {
        const min = Math.min(this._selectionRange.x, this._selectionRange.y)
        const max = Math.max(this._selectionRange.x, this._selectionRange.y)

        // Splice the newline into the text at the current selection range
        const newText = this.delegate.text.substring(0, min) + "\n" + this.delegate.text.substring(max)
        const newStart = min + 1
        const newEnd = min + 1

        // One call updates text, updates range, invokes typingEvent, flags dirty, and triggers batchUpdate
        this.delegate.onTextChangedHandler(newText, newStart, newEnd)
      } else {
        this.delegate.onReturnKeyPressedHandler()
      }
    } else {
      this.delegate.onReturnKeyPressedHandler()
    }
  }

  /**
   * Opens the native system keyboard with the provided text and selection state.
   * @param initialText - Text to seed into the keyboard field.
   * @param selectionStart - Initial selection start in UTF-16 character units.
   * @param selectionEnd - Initial selection end in UTF-16 character units.
   */
  public requestKeyboard(initialText: string = "", selectionStart: number = 0, selectionEnd: number = 0): void {
    this.keyboardOptions.initialText = initialText
    if (USE_KEYBOARD_ENGINE) {
      this._selectionRange.x = selectionStart
      this._selectionRange.y = selectionEnd
      this.keyboardOptions.initialSelectedRange = this._selectionRange
    }
    global.textInputSystem.requestKeyboard(this.keyboardOptions)
    this.isKeyboardOpen = true
  }

  /**
   * Dismisses the native system keyboard if it is currently open.
   */
  public dismissKeyboard(): void {
    if (!this.isKeyboardOpen) return
    global.textInputSystem.dismissKeyboard()
    this.isKeyboardOpen = false
  }

  /**
   * Pushes the authoritative text and selection range to the keyboard engine.
   * @param text - Current text content.
   * @param selectionStart - Selection start in UTF-16 character units.
   * @param selectionEnd - Selection end in UTF-16 character units.
   */
  public updateText(text: string, selectionStart: number, selectionEnd: number): void {
    if (USE_KEYBOARD_ENGINE) {
      try {
        const updateText = new TextInputSystem.TextUpdate()
        updateText.text = text
        updateText.selectionStart = selectionStart
        updateText.selectionEnd = selectionEnd
        global.textInputSystem.updateText(updateText)
        this._selectionRange.x = selectionStart
        this._selectionRange.y = selectionEnd
      } catch (error) {
        log.w(`Error updating text: ${error}`)
      }
    }
  }

  /**
   * Updates the cached selection range and forwards it to the keyboard engine.
   * @param start - Selection start in UTF-16 character units.
   * @param end - Selection end in UTF-16 character units.
   */
  public updateSelectionRange(start: number, end: number): void {
    this._selectionRange.x = start
    this._selectionRange.y = end

    if (USE_KEYBOARD_ENGINE) {
      try {
        global.textInputSystem.setSelectedTextRange(this._selectionRange)
      } catch (error) {
        log.e(`Error setting selected text range: ${error}`)
      }
    }
  }

  /**
   * Moves the keyboard engine editing position to a collapsed caret index.
   * @param index - Caret position in UTF-16 character units.
   */
  public setEditingPosition(index: number): void {
    if (USE_KEYBOARD_ENGINE) {
      try {
        global.textInputSystem.setEditingPosition(index)
      } catch (error) {
        log.e(`Error setting editing position: ${error}`)
      }
    }
  }
}
