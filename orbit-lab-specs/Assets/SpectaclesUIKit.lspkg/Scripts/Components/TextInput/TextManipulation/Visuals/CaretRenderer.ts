import {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {UNIT_PLANE_MESH_ASSET} from "../../../../Utility/Assets"

const CARET_MATERIAL_ASSET: Material = requireAsset("../../../../../Materials/CaretMat.mat") as Material
export const CARET_DEFAULT_COLOR = new vec4(0.317006, 0.450004, 0.4, 1)

// Constants
const CARET_WIDTH = 0.07
const CARET_BLINK_INTERVAL = 500 // milliseconds
const CARET_SIZE_MULTIPLIER_DRAG = 1.2
const CARET_SIZE_MULTIPLIER_DEFAULT = 1.0
const CARET_Z_OFFSET = 0.01

/**
 * Handles all caret visual rendering including position, scale, blinking animation, and drag state.
 */
export class CaretRenderer {
  private readonly caretObject: SceneObject
  private readonly caretTransform: Transform
  private readonly textScreenTransform: ScreenTransform | null
  private readonly caretRMV: RenderMeshVisual
  private readonly caretMaterial: Material
  private caretVisible: boolean = false
  private caretBlinkTimer: number = 0
  private caretBlinkState: boolean = true
  private caretScaleMultiplier: number = CARET_SIZE_MULTIPLIER_DEFAULT

  private readonly _caretScale: vec3 = vec3.one()
  private readonly _caretPosition: vec3 = vec3.zero()

  private cursorPositions: CursorPosition[] | null = null
  private cursorHeight: number = 0
  private caretIndex: number = 0

  private unsubscribes: (() => void)[] = []

  public constructor(
    private readonly textComponent: Text,
    private readonly caretUpdateEvent: UpdateEvent,
    private readonly onCursorPositionsUpdated: PublicApi<CursorPosition[]>,
    private readonly onCursorHeightUpdated: PublicApi<number>,
    color: vec4 = CARET_DEFAULT_COLOR
  ) {
    this.textScreenTransform = textComponent.sceneObject.getComponent("ScreenTransform")

    this.caretObject = global.scene.createSceneObject("Caret")
    this.caretObject.setParent(textComponent.getSceneObject())
    this.caretTransform = this.caretObject.getTransform()
    this.caretRMV = this.caretObject.createComponent("RenderMeshVisual")
    this.caretRMV.mesh = UNIT_PLANE_MESH_ASSET
    this.caretMaterial = CARET_MATERIAL_ASSET.clone()
    this.caretRMV.mainMaterial = this.caretMaterial
    this.setColor(color)
    this.caretRMV.setRenderOrder(textComponent.getRenderOrder() + 1)
    this.caretObject.enabled = false

    this.caretUpdateEvent.bind(() => this.onCaretUpdate())
    this.caretUpdateEvent.enabled = false

    this.unsubscribes.push(
      this.onCursorPositionsUpdated.add((cursorPositions: CursorPosition[]) => {
        this.cursorPositions = cursorPositions
        this.updatePosition(this.caretIndex)
      }),
      this.onCursorHeightUpdated.add((cursorHeight: number) => {
        this.cursorHeight = cursorHeight
        this.updateScale()
        this.updatePosition(this.caretIndex)
      })
    )
  }

  public get color(): vec4 {
    return this.caretMaterial.mainPass.baseColor
  }

  public set color(color: vec4) {
    if (color === undefined) return

    this.setColor(color)
  }

  /**
   * Shows the caret.
   */
  public show(): void {
    this.caretVisible = true
    this.updateScale()
    this.resetBlink()
    if (this.caretUpdateEvent) {
      this.caretUpdateEvent.enabled = true
    }
  }

  /**
   * Hides the caret.
   */
  public hide(): void {
    this.caretVisible = false
    if (!isNull(this.caretObject)) {
      this.caretObject.enabled = false
    }
    if (this.caretUpdateEvent) {
      this.caretUpdateEvent.enabled = false
    }
  }

  /**
   * Updates the visual position of the caret based on the current caret index.
   *
   * @param index - The text caret index to position the visual caret at
   */
  public updatePosition(index: number): void {
    if (!this.caretObject || !this.textComponent) return

    this.caretIndex = index

    const hasValidCursorPosition =
      this.cursorPositions && this.cursorPositions.length > 0 && index < this.cursorPositions.length
    const cursorPos = hasValidCursorPosition ? this.cursorPositions[index] : null

    if (hasValidCursorPosition) {
      const pos = cursorPos.position
      const screenOffsets = this.textScreenTransform?.offsets
      const offsetX = screenOffsets ? (screenOffsets.left + screenOffsets.right) / 2 : 0
      const offsetY = screenOffsets ? (screenOffsets.top + screenOffsets.bottom) / 2 : 0
      this._caretPosition.x = pos.x - offsetX
      this._caretPosition.y = pos.y - offsetY + this._caretScale.y / 4
      this._caretPosition.z = CARET_Z_OFFSET
    }

    this.caretTransform?.setLocalPosition(this._caretPosition)
  }

  /**
   * Updates the local scale of the caret to match the cursor height.
   */
  private updateScale(): void {
    if (!this.caretObject || !this.textComponent) return

    this._caretScale.x = CARET_WIDTH * this.caretScaleMultiplier
    this._caretScale.y = this.cursorHeight
    this._caretScale.z = 1
    this.caretTransform?.setLocalScale(this._caretScale)
  }

  /**
   * Sets the drag state, which changes the caret appearance.
   * @param isDragging - Whether caret is being dragged
   */
  public setDragState(isDragging: boolean): void {
    if (!this.caretObject || !this.caretRMV) return

    if (isDragging) {
      this.caretScaleMultiplier = CARET_SIZE_MULTIPLIER_DRAG
    } else {
      this.caretScaleMultiplier = CARET_SIZE_MULTIPLIER_DEFAULT
    }
    this.updateScale()
  }

  /**
   * Resumes the caret blink animation.
   */
  public resumeBlink(): void {
    this.caretUpdateEvent.enabled = true
  }

  /**
   * Pauses the caret blink animation.
   */
  public pauseBlink(): void {
    this.caretUpdateEvent.enabled = false
  }

  /**
   * Resets the caret blink animation.
   */
  public resetBlink(): void {
    this.caretBlinkTimer = 0
    this.caretBlinkState = true
    if (!isNull(this.caretObject)) {
      this.caretObject.enabled = this.caretVisible
    }
  }

  /**
   * Update callback for caret blinking animation.
   */
  private onCaretUpdate(): void {
    if (!this.caretVisible) {
      if (!isNull(this.caretObject) && this.caretObject.enabled) {
        this.caretObject.enabled = false
      }
      return
    }

    this.caretBlinkTimer += getDeltaTime() * 1000
    this.caretBlinkTimer %= CARET_BLINK_INTERVAL * 2
    const phase = Math.floor(this.caretBlinkTimer / CARET_BLINK_INTERVAL)
    const newBlinkState = phase === 0
    if (this.caretBlinkState !== newBlinkState) {
      this.caretBlinkState = newBlinkState
      if (!isNull(this.caretObject)) this.caretObject.enabled = this.caretBlinkState
    }
  }

  /**
   * Destroys the caret renderer and cleans up resources.
   */
  public destroy(): void {
    this.unsubscribes.forEach((unsub) => unsub())
    this.unsubscribes = []
    if (this.caretUpdateEvent) {
      this.caretUpdateEvent.enabled = false
    }
    this.hide()
    if (!isNull(this.caretObject)) {
      this.caretObject.destroy()
    }
  }

  private setColor(color: vec4): void {
    this.caretMaterial.mainPass.baseColor = color
  }
}
