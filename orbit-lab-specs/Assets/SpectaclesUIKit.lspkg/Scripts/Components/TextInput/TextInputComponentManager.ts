import {Singleton} from "SpectaclesInteractionKit.lspkg/Decorators/Singleton"
import {CancelToken, clearTimeout, setTimeout} from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils"
import {BaseTextInputComponent} from "./BaseTextInputComponent"
import {KEYBOARD_DELAY_DEFAULT, KEYBOARD_DELAY_DESELECT} from "./TextInputConsts"

/**
 * TextInputComponentManager controls focus across all text input components
 * (both TextInputField and TextInputArea).
 * This class is created and handled automatically and dynamically.
 * You should not have to add it manually.
 * If you see it in the scene preview that is good!
 */
@Singleton
export class TextInputComponentManager {
  public static getInstance: () => TextInputComponentManager

  private activeTextInputComponent: BaseTextInputComponent | null = null
  private pendingFocusTextInputComponent: BaseTextInputComponent | null = null
  private pendingFocusCancelToken: CancelToken | null = null
  private recentlyClosed: boolean = false
  private recentlyClosedCancelToken: CancelToken | null = null

  public requestFocus = (textInputComponent: BaseTextInputComponent): void => {
    if (this.activeTextInputComponent === textInputComponent) return

    const needsSwitchDelay = this.activeTextInputComponent !== null || this.recentlyClosed
    this.cancelPendingFocus()
    this.blurActive()

    this.pendingFocusTextInputComponent = textInputComponent
    this.pendingFocusCancelToken = setTimeout(
      () => {
        if (this.pendingFocusTextInputComponent !== textInputComponent) return

        this.pendingFocusTextInputComponent = null
        this.pendingFocusCancelToken = null
        textInputComponent.editMode(true)
      },
      needsSwitchDelay ? KEYBOARD_DELAY_DESELECT : KEYBOARD_DELAY_DEFAULT
    )
  }

  public cancelFocusRequest = (textInputComponent: BaseTextInputComponent): void => {
    if (this.pendingFocusTextInputComponent !== textInputComponent) return

    this.cancelPendingFocus()
  }

  public registerActive = (textInputComponent: BaseTextInputComponent) => {
    if (this.activeTextInputComponent === textInputComponent) return

    this.cancelPendingFocus()
    this.blurActive()
    this.activeTextInputComponent = textInputComponent
  }

  public deregisterActive = (textInputComponent: BaseTextInputComponent) => {
    this.cancelFocusRequest(textInputComponent)

    if (this.activeTextInputComponent !== textInputComponent) return

    this.activeTextInputComponent = null
    this.markRecentlyClosed()
  }

  private blurActive = (): void => {
    this.activeTextInputComponent?.editMode(false)
  }

  private cancelPendingFocus = (): void => {
    const pendingFocusTextInputComponent = this.pendingFocusTextInputComponent
    if (this.pendingFocusCancelToken) {
      clearTimeout(this.pendingFocusCancelToken)
    }
    pendingFocusTextInputComponent?.resetPendingFocusState()
    this.pendingFocusCancelToken = null
    this.pendingFocusTextInputComponent = null
  }

  private markRecentlyClosed = (): void => {
    this.recentlyClosed = true
    if (this.recentlyClosedCancelToken) {
      clearTimeout(this.recentlyClosedCancelToken)
    }
    this.recentlyClosedCancelToken = setTimeout(() => {
      this.recentlyClosed = false
      this.recentlyClosedCancelToken = null
    }, KEYBOARD_DELAY_DESELECT)
  }
}
