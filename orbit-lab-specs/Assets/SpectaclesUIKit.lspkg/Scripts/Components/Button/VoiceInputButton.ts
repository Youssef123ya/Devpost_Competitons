import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {VoiceInputProvider} from "../../Services/VoiceInputProvider"
import {ElementContent} from "../Content/ElementContent"
import {StateName} from "../Element"
import {Button} from "./Button"

const MICROPHONE_ICON: Texture = requireAsset("../../../Textures/microphone.png") as Texture
const STOP_ICON: Texture = requireAsset("../../../Textures/stop.png") as Texture
const ERROR_ICON: Texture = requireAsset("../../../Textures/error.png") as Texture

const ICON_SIZE_FACTOR = 0.56

@component
export class VoiceInputButton extends Button {
  private readonly voiceInputProvider: VoiceInputProvider = VoiceInputProvider.getInstance()

  private readonly onListeningUpdateEvent = new Event<[text: string, isFinal: boolean]>()
  private _onListeningUpdate?: PublicApi<[text: string, isFinal: boolean]>
  /**
   * Event fired when speech-to-text produces partial or final transcript text.
   */
  public get onListeningUpdate(): PublicApi<[text: string, isFinal: boolean]> {
    return (this._onListeningUpdate ??= this.onListeningUpdateEvent.publicApi())
  }
  private readonly onListeningErrorEvent = new Event<AsrModule.AsrStatusCode>()
  private _onListeningError?: PublicApi<AsrModule.AsrStatusCode>
  /**
   * Event fired when voice recognition reports an error status code.
   */
  public get onListeningError(): PublicApi<AsrModule.AsrStatusCode> {
    return (this._onListeningError ??= this.onListeningErrorEvent.publicApi())
  }

  private _voiceIconContent: ElementContent | null = null

  /**
   * Gets the content component used to render the voice icon.
   * @returns The icon content component, or null before the default visual is created.
   */
  public get voiceIconContent(): ElementContent | null {
    return this._voiceIconContent
  }

  /**
   * Gets the texture currently displayed in the voice icon slot.
   * @returns The active voice icon texture, or null before icon content exists.
   */
  public get voiceIconTexture(): Texture | null {
    return this._voiceIconContent?.leadingIcon ?? null
  }

  /**
   * Gets the button size.
   * @returns The current button size.
   */
  public get size(): vec3 {
    return super.size
  }

  /**
   * Sets the button size and recalculates the voice icon size.
   * @param size - The new button size.
   */
  public set size(size: vec3) {
    super.size = size
    this.updateVoiceIconSize()
  }

  /**
   * Gets the button opacity.
   * @returns The current opacity.
   */
  public get opacity(): number {
    return super.opacity
  }

  /**
   * Sets the button opacity and applies it to the voice icon content.
   * @param value - The new opacity.
   */
  public set opacity(value: number) {
    super.opacity = value
    if (this._voiceIconContent) {
      this._voiceIconContent.opacity = value
    }
  }

  /**
   * Gets the button render order.
   * @returns The current render order.
   */
  public get renderOrder(): number {
    return super.renderOrder
  }

  /**
   * Sets the button render order and keeps the icon one layer behind the button content.
   * @param value - The new render order.
   */
  public set renderOrder(value: number) {
    super.renderOrder = value
    if (this._voiceIconContent) {
      this._voiceIconContent.renderOrder = value - 1
    }
  }

  /**
   * Gets whether the button is inactive.
   * @returns `true` when the button cannot be toggled on.
   */
  public get inactive(): boolean {
    return super.inactive
  }

  /**
   * Sets whether the button is inactive.
   * Setting inactive to `true` cancels any active listening session.
   * @param inactive - `true` to disable interaction.
   */
  public set inactive(inactive: boolean) {
    if (inactive) {
      this.cancelActiveListening()
    }
    super.inactive = inactive
  }

  /**
   * Initializes the button and wires toggle changes to voice listening ownership.
   */
  public initialize(): void {
    if (this._initialized) {
      return
    }
    super.initialize()
    this.onValueChange.add((value) => this.onToggleValueChanged(value === 1))
  }

  protected createDefaultVisual(): void {
    super.createDefaultVisual()
    this.createVoiceIconContent()
  }

  protected release(): void {
    this.stopListening()
    super.release()
  }

  protected onDisabled(): void {
    this.cancelActiveListening()
    super.onDisabled()
  }

  protected get isToggle(): boolean {
    return true
  }

  protected setOn(on: boolean, explicit: boolean): void {
    if (on && this.inactive) return
    super.setOn(on, explicit)
  }

  private createVoiceIconContent(): void {
    if (this._voiceIconContent) return

    this._voiceIconContent =
      (this.sceneObject.getComponent(ElementContent.getTypeName()) as ElementContent | null) ??
      (this.sceneObject.createComponent(ElementContent.getTypeName()) as ElementContent)

    this._voiceIconContent.text = ""
    this._voiceIconContent.trailingIcon = null
    this._voiceIconContent.contentAlignment = "center"
    this._voiceIconContent.iconLayout = "left"
    this._voiceIconContent.spacing = 0
    this._voiceIconContent.padding = {top: 0, right: 0, bottom: 0, left: 0}
    this._voiceIconContent.autoResize = false
    this._voiceIconContent.opacity = this.opacity
    this._voiceIconContent.renderOrder = this._renderOrder - 1
    this._voiceIconContent.leadingIconSize = this.computeVoiceIconSize()
    this._voiceIconContent.leadingIcon = MICROPHONE_ICON
  }

  private updateVoiceIconSize(): void {
    if (!this._voiceIconContent) return
    this._voiceIconContent.leadingIconSize = this.computeVoiceIconSize()
  }

  private computeVoiceIconSize(): number {
    return Math.min(this._size.x, this._size.y) * ICON_SIZE_FACTOR
  }

  private setVoiceIconTexture(texture: Texture): void {
    if (this._voiceIconContent) {
      this._voiceIconContent.leadingIcon = texture
    }
  }

  private onToggleValueChanged(isOn: boolean): void {
    if (isOn) {
      this.startListening()
    } else {
      this.stopListening()
    }
  }

  private startListening(): void {
    if (!this.voiceInputProvider) return

    this.clearListeningError()
    this.setVoiceIconTexture(STOP_ICON)
    this.voiceInputProvider.acquireListening(this, {
      onListeningUpdate: ([text, isFinal]) => this.onListeningUpdateHandler(text, isFinal),
      onListeningError: (statusCode: AsrModule.AsrStatusCode) => this.onListeningErrorHandler(statusCode),
      onListeningOwnershipLost: () => this.onListeningOwnershipLostHandler()
    })
  }

  private stopListening(): void {
    this.setVoiceIconTexture(this._hasError ? ERROR_ICON : MICROPHONE_ICON)
    this.voiceInputProvider?.releaseListening(this)
  }

  private cancelActiveListening(): void {
    if (this.isOn) {
      this.toggle(false)
    }
  }

  private onListeningUpdateHandler(text: string, isFinal: boolean): void {
    this.onListeningUpdateEvent.invoke([text, isFinal])
    if (isFinal) {
      this.cancelActiveListening()
    }
  }

  private onListeningErrorHandler(statusCode: AsrModule.AsrStatusCode): void {
    this.cancelActiveListening()
    this.setListeningError(statusCode)
  }

  private onListeningOwnershipLostHandler(): void {
    this.cancelActiveListening()
  }

  private setListeningError(statusCode: AsrModule.AsrStatusCode): void {
    this._hasError = true
    this.setVoiceIconTexture(ERROR_ICON)
    this.setState(
      this.stateName === StateName.hovered || this.stateName === StateName.errorHovered
        ? StateName.errorHovered
        : StateName.error
    )
    this.onListeningErrorEvent.invoke(statusCode)
  }

  private clearListeningError(): void {
    if (!this._hasError) return
    this._hasError = false
    if (this.stateName === StateName.error) {
      this.setState(StateName.default)
    } else if (this.stateName === StateName.errorHovered) {
      this.setState(StateName.hovered)
    }
  }
}
