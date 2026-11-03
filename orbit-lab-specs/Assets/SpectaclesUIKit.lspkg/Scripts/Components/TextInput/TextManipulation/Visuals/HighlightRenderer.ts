import {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {getUtf16IndexFromCursorIndex} from "../../../../../Scripts/Utility/TextManipulationUtils"
import {UNIT_PLANE_MESH_ASSET} from "../../../../Utility/Assets"

const HIGHLIGHT_MATERIAL: Material = requireAsset("../../../../../Materials/HighlightMat.mat") as Material
export const HIGHLIGHT_DEFAULT_COLOR = new vec4(0.317998, 0.450004, 0.396002, 0.4)

// Constants
const HIGHLIGHT_Z_OFFSET = 0.005
const EPSILON = 0.001

/**
 * Represents the rendered local-space geometry of an active highlight segment.
 */
export type HighlightRect = {
  centerX: number
  centerY: number
  width: number
  leftX: number
  rightX: number
  handleAnchorY: number
  height: number
}

/**
 * Represents a highlight visual that can be reused from a pool.
 */
interface PooledHighlight {
  sceneObject: SceneObject
  transform: Transform
  active: boolean
}

/**
 * Handles text selection highlight visual rendering.
 * Supports multi-line selections via object pooling.
 */
export class HighlightRenderer {
  private highlightPool: PooledHighlight[] = []
  private readonly rectsPool: HighlightRect[] = []
  private readonly activeRects: HighlightRect[] = []
  private readonly textScreenTransform: ScreenTransform | null = null
  private cursorPositions: CursorPosition[] | null = null

  private readonly highlightMaterial: Material = HIGHLIGHT_MATERIAL.clone()
  private readonly _highlightPosition: vec3 = vec3.zero()
  private readonly _highlightScale: vec3 = vec3.one()

  private unsubscribes: (() => void)[] = []

  public constructor(
    private readonly textComponent: Text,
    onCursorPositionsUpdated: PublicApi<CursorPosition[]>,
    color: vec4 = HIGHLIGHT_DEFAULT_COLOR
  ) {
    this.textScreenTransform = textComponent.getSceneObject().getComponent("ScreenTransform")
    this.setColor(color)

    this.unsubscribes.push(
      onCursorPositionsUpdated.add((cursorPositions: CursorPosition[]) => {
        this.cursorPositions = cursorPositions
      })
    )
  }

  public get color(): vec4 {
    return this.highlightMaterial.mainPass.baseColor
  }

  public set color(color: vec4) {
    if (color === undefined) return

    this.setColor(color)
  }

  /**
   * Updates the highlight position and size based on selection range.
   * Handles multi-line selections by creating multiple highlight segments.
   *
   * @param startIndex - The start index of the selection
   * @param endIndex - The end index of the selection
   * @returns The rendered local-space bounds for each active highlight rectangle
   */
  public updateHighlight(startIndex: number, endIndex: number): ReadonlyArray<HighlightRect> {
    if (startIndex === endIndex) {
      this.hide()
      return this.activeRects
    }

    if (!this.cursorPositions || this.cursorPositions.length === 0) {
      this.hide()
      return this.activeRects
    }

    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    const maxCursorIndex = this.cursorPositions.length - 1
    const validStart = Math.max(0, Math.min(minIndex, maxCursorIndex))
    const validEnd = Math.max(0, Math.min(maxIndex, maxCursorIndex))

    if (validStart >= validEnd) {
      this.hide()
      return this.activeRects
    }

    // Calculate highlight rectangles
    const numRects = this.calculateSelectionRects(validStart, validEnd)
    this.activeRects.length = 0

    // Render rects
    for (let i = 0; i < numRects; i++) {
      const rect = this.rectsPool[i]
      const highlight = this.getHighlightFromPool(i)

      this.applyRectToTransform(rect, highlight.transform)
      this.activeRects.push(rect)

      if (!highlight.active) {
        highlight.sceneObject.enabled = true
        highlight.active = true
      }
    }

    // Disable unused rects
    for (let i = numRects; i < this.highlightPool.length; i++) {
      const unusedHighlight = this.highlightPool[i]
      if (!unusedHighlight.active) break
      unusedHighlight.sceneObject.enabled = false
      unusedHighlight.active = false
    }

    return this.activeRects
  }

  /**
   * Calculates the geometric rectangles for the selection.
   * Uses the Text component's native highlight rects so each visual run is handled by Lens.
   *
   * @param start - The start index of the selection
   * @param end - The end index of the selection
   * @returns The number of active highlight rectangles
   */
  private calculateSelectionRects(start: number, end: number): number {
    const text = this.textComponent.text
    const cursorPositions = this.cursorPositions
    if (!cursorPositions || cursorPositions.length === 0) return 0

    const startCharIndex = getUtf16IndexFromCursorIndex(start, cursorPositions, text)
    const endCharIndex = getUtf16IndexFromCursorIndex(end, cursorPositions, text)

    if (startCharIndex === undefined || endCharIndex === undefined) return 0

    const minCharIndex = Math.min(startCharIndex, endCharIndex)
    const maxCharIndex = Math.max(startCharIndex, endCharIndex)
    if (minCharIndex >= maxCharIndex) return 0

    const highlightRects = this.textComponent.getHighlightRects(minCharIndex, maxCharIndex)
    let rectCount = 0

    for (const highlightRect of highlightRects) {
      const size = highlightRect.getSize()
      if (size.x <= EPSILON || size.y <= EPSILON) continue

      const center = highlightRect.getCenter()
      this.saveRectToPool(rectCount++, center.x - this.textOffsetX, center.y - this.textOffsetY, size.x, size.y)
    }

    return rectCount
  }

  private saveRectToPool(index: number, centerX: number, centerY: number, width: number, height: number): void {
    const leftX = centerX - width / 2
    const rightX = centerX + width / 2
    const handleAnchorY = centerY - height / 4
    const rect = this.rectsPool[index]
    if (!rect) {
      this.rectsPool[index] = {centerX, centerY, width, leftX, rightX, handleAnchorY, height}
    } else {
      rect.centerX = centerX
      rect.centerY = centerY
      rect.width = width
      rect.leftX = leftX
      rect.rightX = rightX
      rect.handleAnchorY = handleAnchorY
      rect.height = height
    }
  }

  private applyRectToTransform(rect: HighlightRect, transform: Transform): void {
    this._highlightPosition.x = rect.centerX
    this._highlightPosition.y = rect.centerY
    this._highlightPosition.z = HIGHLIGHT_Z_OFFSET

    this._highlightScale.x = rect.width
    this._highlightScale.y = rect.height
    this._highlightScale.z = 1

    transform.setLocalPosition(this._highlightPosition)
    transform.setLocalScale(this._highlightScale)
  }

  /**
   * Retrieves a highlight object from the pool, creating a new one if necessary.
   *
   * @param index - The index of the highlight to retrieve
   * @returns The pooled highlight object
   */
  private getHighlightFromPool(index: number): PooledHighlight {
    // Expand pool if needed
    const textSceneObject = this.textComponent.getSceneObject()
    while (this.highlightPool.length <= index) {
      const obj = global.scene.createSceneObject(`Highlight_${this.highlightPool.length}`)
      obj.setParent(textSceneObject)

      const rmv = obj.createComponent("RenderMeshVisual")
      rmv.mesh = UNIT_PLANE_MESH_ASSET
      if (this.highlightMaterial) {
        rmv.mainMaterial = this.highlightMaterial
      }
      rmv.setRenderOrder(this.textComponent.getRenderOrder())

      obj.enabled = false
      this.highlightPool.push({
        sceneObject: obj,
        transform: obj.getTransform(),
        active: false
      })
    }

    return this.highlightPool[index]
  }

  /**
   * Resets all highlight objects in the pool by disabling them.
   */
  private resetPool(): void {
    for (const obj of this.highlightPool) {
      if (obj.active) {
        if (!isNull(obj.sceneObject)) {
          obj.sceneObject.enabled = false
        }
        obj.active = false
      }
    }
  }

  /**
   * Hides the highlight.
   */
  public hide(): void {
    this.activeRects.length = 0
    this.resetPool()
  }

  /**
   * Destroys the highlight renderer and cleans up resources.
   */
  public destroy(): void {
    this.unsubscribes.forEach((unsub) => unsub())
    this.unsubscribes = []
    this.hide()
    // Objects attached to parent will be destroyed when parent is destroyed,
    // but if we are destroyed independently, we should clean up pool.
    for (const obj of this.highlightPool) {
      if (!isNull(obj.sceneObject)) {
        obj.sceneObject.destroy()
      }
    }
    this.highlightPool = []
  }

  private get textOffsetX(): number {
    const offsets = this.textScreenTransform?.offsets
    if (!offsets) return 0
    return (offsets.left + offsets.right) / 2
  }

  private get textOffsetY(): number {
    const offsets = this.textScreenTransform?.offsets
    if (!offsets) return 0
    return (offsets.top + offsets.bottom) / 2
  }

  private setColor(color: vec4): void {
    this.highlightMaterial.mainPass.baseColor = color
  }
}
