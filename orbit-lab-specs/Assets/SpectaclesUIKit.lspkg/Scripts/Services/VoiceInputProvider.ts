import {Singleton} from "SpectaclesInteractionKit.lspkg/Decorators/Singleton"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"

const log = new NativeLogger("VoiceInputProvider")

export type ListeningUpdate = [text: string, isFinal: boolean]

export type ActiveListeningCallbacks = {
  onListeningUpdate: (update: ListeningUpdate) => void
  onListeningError: (statusCode: AsrModule.AsrStatusCode) => void
  onListeningOwnershipLost: () => void
}

/**
 * VoiceInputProvider wraps AsrModule, to convert voice into text.
 */
@Singleton
export class VoiceInputProvider {
  public static getInstance: () => VoiceInputProvider

  // eslint-disable-next-line
  private readonly module = require("LensStudio:AsrModule") as AsrModule
  private readonly options = AsrModule.AsrTranscriptionOptions.create()

  private listening = false
  private activeListeningOwner: object | null = null
  private activeListeningCallbacks: ActiveListeningCallbacks | null = null

  public constructor() {
    this.options.mode = AsrModule.AsrMode.HighAccuracy
    this.options.silenceUntilTerminationMs = 1500

    this.options.onTranscriptionUpdateEvent.add((evt) => {
      const update: ListeningUpdate = [evt.text, evt.isFinal]
      this.activeListeningCallbacks?.onListeningUpdate(update)
    })

    this.options.onTranscriptionErrorEvent.add((statusCode) => {
      log.d(`ASR module transcription error: ${statusCode}`)
      this.activeListeningCallbacks?.onListeningError(statusCode)
    })
  }

  public get isListening(): boolean {
    return this.listening
  }

  public acquireListening(owner: object, callbacks: ActiveListeningCallbacks): void {
    const previousOwner = this.activeListeningOwner
    const previousCallbacks = this.activeListeningCallbacks

    if (previousOwner !== owner && this.listening) {
      this.setListening(false)
    }

    this.activeListeningOwner = owner
    this.activeListeningCallbacks = callbacks

    if (previousOwner !== owner) {
      if (previousOwner && owner) {
        log.d(
          `ASR module ownership swapped from ${(previousOwner as any).sceneObject?.name ?? "unknown"} to ${(owner as any).sceneObject?.name ?? "unknown"}`
        )
      }
      previousCallbacks?.onListeningOwnershipLost()
    }

    if (!this.listening) {
      this.setListening(true)
    }
  }

  public releaseListening(owner: object): void {
    if (this.activeListeningOwner !== owner) return

    this.activeListeningOwner = null
    this.activeListeningCallbacks = null

    if (this.listening) {
      this.setListening(false)
    }
  }

  private setListening(listening: boolean): void {
    if (this.listening === listening) return
    this.listening = listening

    if (listening) {
      log.d(`ASR module started transcribing`)
      this.module.startTranscribing(this.options)
    } else {
      log.d(`ASR module stopped transcribing`)
      this.module.stopTranscribing()
    }
  }
}
