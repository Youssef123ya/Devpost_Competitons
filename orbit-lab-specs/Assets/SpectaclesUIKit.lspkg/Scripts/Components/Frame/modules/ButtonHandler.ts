import {Button} from "../../Button/Button"
import {ElementContent} from "../../Content/ElementContent"
import {Frame} from "../Frame"
import {FRAME_BUTTON_SETTINGS_BY_APPEARANCE} from "../FrameButtonSettings"
import {FramePanelVisual, PANEL_CLOSE_BUTTON_DEPTH} from "../FramePanelVisual"

const CLASSIC_BUTTON_DEPTH = 1

type ButtonConfig = {
  imageTexture: Texture
  type: "close" | "follow"
  isToggle?: boolean
}

type ButtonHandlerConfig = {
  frame: Frame
  onButtonTriggerUp: () => void
}

const closeIcon: Texture = requireAsset("../../../../Textures/close-icon-1.png") as Texture
const followIcon: Texture = requireAsset("../../../../Textures/follow-white.png") as Texture

/**
 * ButtonHandler — manages the close button on every frame, and the follow
 * button for SnapOS2 (classic) frames. SnapOS3 (panel) frames route follow
 * through {@link RightDrawer} instead, so on panel frames this module owns
 * only the close button.
 *
 * Both themes use the same `Button` + `ElementContent` companion structure;
 * the only differences are theme/shape/style/depth. ElementContent's
 * theme-driven icon tint means SnapOS2 icons now respond to state on
 * hover/triggered transitions, where the previous static `Component.Image`
 * approach kept the icon at texture color.
 */
export default class ButtonHandler {
  public closeButton: Button
  public followButton: Button

  private closeContent: ElementContent | null = null
  private followContent: ElementContent | null = null

  private _closeButtonOffset: vec3 = vec3.zero()
  private _closeButtonEnabled: boolean = false
  public set closeButtonOffset(value: vec3) {
    if (value === undefined) {
      return
    }
    this._closeButtonOffset = value
    this.resize()
  }
  public get closeButtonOffset(): vec3 {
    return this._closeButtonOffset
  }

  private _followButtonOffset: vec3 = vec3.zero()
  private _followButtonEnabled: boolean = false
  public set followButtonOffset(value: vec3) {
    if (value === undefined) {
      return
    }
    this._followButtonOffset = value
    this.resize()
  }
  public get followButtonOffset(): vec3 {
    return this._followButtonOffset
  }

  private frame: Frame = this.options.frame

  public constructor(private options: ButtonHandlerConfig) {}

  public enableCloseButton(enable: boolean) {
    this._closeButtonEnabled = enable
    if (enable && !this.closeButton) {
      this.createButton({type: "close", imageTexture: closeIcon})
    }
    if (this.closeButton) this.closeButton.sceneObject.enabled = enable
  }

  /**
   * Enable/disable the follow button. On SnapOS3 (panel) frames this is a
   * no-op — the follow button lives in {@link RightDrawer} instead.
   */
  public enableFollowButton(enable: boolean) {
    if (this.isPanel) return
    this._followButtonEnabled = enable
    if (enable && !this.followButton) {
      this.createButton({type: "follow", imageTexture: followIcon, isToggle: true})
    }
    if (this.followButton) this.followButton.sceneObject.enabled = enable
  }

  private get isPanel(): boolean {
    return this.frame.frameVisual instanceof FramePanelVisual
  }

  private createButton(config: ButtonConfig) {
    const settings = FRAME_BUTTON_SETTINGS_BY_APPEARANCE[this.frame.appearance]
    const isPanel = this.isPanel

    const buttonObject = global.scene.createSceneObject("FrameButton")
    buttonObject.setParent(this.frame.frameObject)
    buttonObject.layer = this.frame.frameObject.layer

    const thisButton = buttonObject.createComponent(Button.getTypeName()) as Button
    if (isPanel) {
      thisButton.setVariant({theme: "SnapOS3", shape: "Rectangle", style: "Prism"})
      // Depth comes from FramePanelVisual.PANEL_CLOSE_BUTTON_DEPTH; the
      // anchor z in FramePanelVisual.getButtonAnchor("close", …) is half
      // this so the back face lands flush with the body's front plane.
      thisButton.size = new vec3(settings.buttonSize, settings.buttonSize, PANEL_CLOSE_BUTTON_DEPTH)
    } else {
      thisButton.setVariant({theme: "SnapOS2", shape: "Round", style: "PrimaryNeutral"})
      thisButton.size = new vec3(settings.buttonSize, settings.buttonSize, CLASSIC_BUTTON_DEPTH)
    }

    thisButton.onTriggerUp.add(() => this.options.onButtonTriggerUp())
    if (config.isToggle) thisButton.setIsToggleable?.(true)
    thisButton.initialize()

    const content = buttonObject.createComponent(ElementContent.getTypeName()) as ElementContent
    content.leadingIconSize = settings.iconSize
    content.leadingIcon = config.imageTexture

    if (config.type === "close") {
      this.closeButton = thisButton
      this.closeContent = content
    } else {
      this.followButton = thisButton
      this.followContent = content
    }

    this.resize()
  }

  public resize() {
    const {buttonSize, offset} = FRAME_BUTTON_SETTINGS_BY_APPEARANCE[this.frame.appearance]
    const totalSize = this.frame.totalSize
    const visual = this.frame.frameVisual
    // Panel close button uses the Prism depth; classic buttons stay at 1.
    // Writing the wrong z here would clobber the depth set at creation,
    // which in turn breaks the back-face-flush-with-body alignment.
    const depth = this.isPanel ? PANEL_CLOSE_BUTTON_DEPTH : CLASSIC_BUTTON_DEPTH
    const size = new vec3(buttonSize, buttonSize, depth)

    if (this.closeButton) {
      this.closeButton.size = size
      const anchor = visual.getButtonAnchor("close", totalSize, buttonSize, offset)
      this.closeButton.transform.setLocalPosition(anchor.add(this._closeButtonOffset))
    }

    if (this.followButton) {
      this.followButton.size = size
      const anchor = visual.getButtonAnchor("follow", totalSize, buttonSize, offset)
      this.followButton.transform.setLocalPosition(anchor.add(this._followButtonOffset))
    }
  }

  public set opacity(alpha: number) {
    if (alpha === undefined) {
      return
    }
    if (this.closeButton) {
      this.closeButton.sceneObject.enabled = this._closeButtonEnabled && alpha > 0
      this.closeButton.opacity = alpha
      if (this.closeContent) this.closeContent.opacity = alpha
    }
    if (this.followButton) {
      this.followButton.sceneObject.enabled = this._followButtonEnabled && alpha > 0
      this.followButton.opacity = alpha
      if (this.followContent) this.followContent.opacity = alpha
    }
  }

  public set renderOrder(renderOrder: number) {
    if (renderOrder === undefined) {
      return
    }
    if (this.closeButton) {
      this.closeButton.renderOrder = renderOrder
      if (this.closeContent) this.closeContent.renderOrder = renderOrder + 1
    }
    if (this.followButton) {
      this.followButton.renderOrder = renderOrder
      if (this.followContent) this.followContent.renderOrder = renderOrder + 1
    }
  }
}
