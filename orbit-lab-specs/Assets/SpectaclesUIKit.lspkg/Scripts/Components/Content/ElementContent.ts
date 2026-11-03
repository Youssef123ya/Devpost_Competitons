import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import {ThemeService} from "../../Themes/ThemeService"
import {IMAGE_MATERIAL_ASSET} from "../../Utility/Assets"
import {drawWorldBox} from "../../Utility/DebugDraw"
import {setTextRect} from "../../Utility/UIKitUtilities"
// Side-effect import — register UIKit Layout2D handlers. ElementContent
// doesn't extend Element, so it needs its own bootstrap reference.
import "../../UIKitBootstrap"
import {FlexItem} from "../Layout2D/Flex/FlexItem"
import {FlexLayout} from "../Layout2D/Flex/FlexLayout"
import {FlexAlign, FlexAlignSelf, FlexDirection, FlexJustify} from "../Layout2D/Flex/FlexTypes"
import {UIKitBrands} from "../Layout2D/UIKitBrands"
import {TextInputField} from "../TextInputField/TextInputField"
import {ContentColorState, ContentStyleKey, resolveContentColors} from "./ContentStyle"

const log = new NativeLogger("ElementContent")

type unsubscribe = () => void

export type ElementContentPadding = {
  top: number
  right: number
  bottom: number
  left: number
}

// Internal lookup tables for inspector/input strings; keep these module-private.
// They translate serialized input values into Flex/Text alignment enums.
// ─── Layout Mappings ──────────────────────────────────────────────────

const DIRECTION_MAP: Record<string, FlexDirection> = {
  right: FlexDirection.RowReverse,
  top: FlexDirection.Column,
  bottom: FlexDirection.ColumnReverse
}

const JUSTIFY_MAP: Record<string, FlexJustify> = {
  left: FlexJustify.Start,
  right: FlexJustify.End
}

const TEXT_HALIGN_MAP: Record<string, number> = {
  left: HorizontalAlignment.Left,
  right: HorizontalAlignment.Right
}

// ─── Typed Interface for Sibling Discovery ────────────────────────────

/**
 * What a sibling must implement to host ElementContent in companion mode.
 *
 * Required: the lifecycle core (`size`, `onSizeChanged`, `onInitialized`,
 * `registerManagedChild`) — enough to size and parent the content. Optional:
 * the theme/state surface, so a minimal custom widget can host text + icons
 * without the full UIKit state machine.
 */
interface ContentHost {
  // ─── Required core ──────────────────────────────────────
  size: vec3
  onSizeChanged: {add: (cb: (s: vec3) => void) => unsubscribe}
  onInitialized: {add: (cb: () => void) => unsubscribe}
  registerManagedChild(sceneObject: SceneObject): void

  // ─── Optional theme + state surface ─────────────────────
  onStateChanged?: {add: (cb: (s: string) => void) => unsubscribe}
  onContentZOffsetChanged?: {add: (cb: (z: number) => void) => unsubscribe}
  contentZOffset?: number
  typeString?: string
  style?: string
  normalizedThemeOverride?: string
}

/**
 * Type guard for ContentHost. Only the required core members are checked;
 * optional theme/state fields are not required to host ElementContent.
 */
function isContentHost(comp: unknown): comp is ContentHost {
  if (!comp || typeof comp !== "object") return false
  const candidate = comp as Record<string, unknown>
  return (
    "size" in candidate &&
    "onSizeChanged" in candidate &&
    "onInitialized" in candidate &&
    "registerManagedChild" in candidate
  )
}

/**
 * Companion component that adds text and icon content to any VisualElement.
 *
 * Attach to the same SceneObject as a Button, Checkbox, Slider, Frame, or any
 * VisualElement. Uses a real FlexLayout component for positioning and resolves
 * content colors from the active theme.
 *
 * Can also operate in standalone mode (without a sibling VisualElement) when
 * sizeOverride is set.
 */
@component
export class ElementContent extends BaseScriptComponent {
  /**
   * Type brand consumed by the Layout2D `StandaloneContentHandler` finder.
   * See `Components/Layout2D/UIKitBrands.ts`.
   */
  public readonly __uikitBrand = UIKitBrands.ElementContent

  // ─── Content (always visible) ────────────────────────────────────────

  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Content</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Primary text, icons, and layout direction</span>')
  @input
  @label("Text")
  @hint("Text label to display.")
  private _text: string = ""

  @input
  @label("Use Leading Icon")
  @hint("Enable to attach an icon before the text.")
  private _useLeadingIcon: boolean = false

  @input
  @showIf("_useLeadingIcon", true)
  @allowUndefined
  @label("Leading Icon")
  @hint("Icon displayed before the text.")
  private _leadingIcon: Texture | null = null

  @input
  @label("Use Trailing Icon")
  @hint("Enable to attach an icon after the text.")
  private _useTrailingIcon: boolean = false

  @input
  @showIf("_useTrailingIcon", true)
  @allowUndefined
  @label("Trailing Icon")
  @hint("Icon displayed after the text.")
  private _trailingIcon: Texture | null = null

  @input
  @showIf("_useLeadingIcon", true)
  @label("Icon Layout")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Left", "left"),
      new ComboBoxItem("Right", "right"),
      new ComboBoxItem("Top", "top"),
      new ComboBoxItem("Bottom", "bottom")
    ])
  )
  @hint("Controls layout direction relative to text.")
  private _iconLayout: string = "left"

  @input
  @label("Content Alignment")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Left", "left"),
      new ComboBoxItem("Center", "center"),
      new ComboBoxItem("Right", "right")
    ])
  )
  @hint("Alignment of content within the container.")
  private _contentAlignment: string = "center"

  // ─── Styling ─────────────────────────────────────────────────────────

  @ui.separator
  @ui.group_start("Styling")
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Font, text size, and icon dimensions</span>')
  @input
  @allowUndefined
  @label("Font")
  @hint("Custom font. Leave empty for system default.")
  private _font: Font

  @input
  @label("Text Size")
  @hint("Font size in Lens Studio units.")
  private _textSize: number = 48

  @input
  @showIf("_useLeadingIcon", true)
  @label("Leading Icon Size")
  @hint("Leading icon width and height in cm.")
  private _leadingIconSize: number = 1.5

  @input
  @showIf("_useTrailingIcon", true)
  @label("Trailing Icon Size")
  @hint("Trailing icon width and height in cm.")
  private _trailingIconSize: number = 1.5

  @ui.group_end

  // ─── Spacing ────────────────────────────────────────────────────────
  @ui.separator
  @ui.group_start("Spacing")
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Gaps between items and padding within the container</span>')
  @input
  @label("Custom Spacing")
  @hint("Enable to override default spacing and padding values.")
  private _customSpacing: boolean = false

  @input
  @showIf("_customSpacing", true)
  @label("Item Spacing")
  @hint("Gap between items in cm.")
  private _spacing: number = 0.5

  @input
  @showIf("_customSpacing", true)
  @label("Padding Top")
  private _paddingTop: number = 0.5

  @input
  @showIf("_customSpacing", true)
  @label("Padding Right")
  private _paddingRight: number = 0.8

  @input
  @showIf("_customSpacing", true)
  @label("Padding Bottom")
  private _paddingBottom: number = 0.5

  @input
  @showIf("_customSpacing", true)
  @label("Padding Left")
  private _paddingLeft: number = 0.8

  @ui.group_end

  // ─── Sizing ─────────────────────────────────────────────────────────
  @ui.separator
  @ui.group_start("Sizing")
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Standalone mode, auto-resize, and size constraints</span>')
  @input
  @label("Auto-Resize Parent")
  @hint("When true, the parent element auto-sizes to fit content.")
  private _autoResizeParent: boolean = false

  @input
  @showIf("_autoResizeParent", true)
  @label("Min Width")
  @hint("Minimum content width in cm (0 = no minimum).")
  private _minWidth: number = 0

  @input
  @showIf("_autoResizeParent", true)
  @label("Min Height")
  @hint("Minimum content height in cm (0 = no minimum).")
  private _minHeight: number = 0

  @input
  @label("Size Override")
  @hint("Width and height in cm. Used when no sibling VisualElement provides a size.")
  private _sizeOverride: vec2 = new vec2(10, 3)

  @ui.group_end

  // ─── Rendering (programmatic only) ──────────────────────────────────
  private _zOffset: number = 0.02
  private _renderOrderOffset: number = 2

  // ─── Colors ─────────────────────────────────────────────────────────

  @ui.separator
  @ui.group_start("Colors")
  @ui.label(
    '<span style="color: #94A3B8; font-size: 11px;">Theme integration, manual per-state colors, and per-instance overrides</span>'
  )
  @input
  @label("Use Theme Colors")
  @hint("When true, content colors are resolved from the active theme.")
  private _useThemeColors: boolean = true

  // Theme resolution overrides — accessible programmatically
  private _themeOverride: string = ""
  private _visualElementType: string = ""
  private _styleName: string = ""

  @input
  @showIf("_useThemeColors", false)
  @label("Default Text Color")
  private _defaultTextColor: vec4 = new vec4(1, 1, 1, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Hovered Text Color")
  private _hoveredTextColor: vec4 = new vec4(1, 1, 1, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Triggered Text Color")
  private _triggeredTextColor: vec4 = new vec4(0.08, 0.08, 0.08, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Inactive Text Color")
  private _inactiveTextColor: vec4 = new vec4(1, 1, 1, 0.4)

  @input
  @showIf("_useThemeColors", false)
  @label("Default Icon Tint")
  private _defaultIconTint: vec4 = new vec4(1, 1, 1, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Hovered Icon Tint")
  private _hoveredIconTint: vec4 = new vec4(1, 1, 1, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Triggered Icon Tint")
  private _triggeredIconTint: vec4 = new vec4(0.08, 0.08, 0.08, 1)

  @input
  @showIf("_useThemeColors", false)
  @label("Inactive Icon Tint")
  private _inactiveIconTint: vec4 = new vec4(1, 1, 1, 0.4)

  @input
  @label("Use Text Color Override")
  @hint("When enabled, uses the color below instead of theme-resolved text color.")
  private _useTextColorOverride: boolean = false

  @input
  @showIf("_useTextColorOverride", true)
  @label("Text Color Override")
  @hint("Per-instance text color. State opacity still applies.")
  private _textColorOverride: vec4 = new vec4(1, 1, 1, 1)

  @ui.group_end

  // ─── Debug ──────────────────────────────────────────────────────────
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Debug</span>')
  @ui.label('<span style="color: #94A3B8; font-size: 11px;">Visual debugging tools for content inspection</span>')
  @input
  @label("Debug Visualization")
  @hint("Enable debug visualization (container and item bounds).")
  private _debug: boolean = false

  // ─── Internal State ─────────────────────────────────────────────────
  private siblingElement: ContentHost | null = null
  private standaloneMode: boolean = false
  private contentContainer: SceneObject | null = null
  private flexLayout: FlexLayout | null = null

  private textSceneObject: SceneObject | null = null
  private textComponent: Text | null = null
  private textFlexItem: FlexItem | null = null

  private leadingIconSceneObject: SceneObject | null = null
  private leadingIconImage: Image | null = null
  private leadingIconFlexItem: FlexItem | null = null

  private trailingIconSceneObject: SceneObject | null = null
  private trailingIconImage: Image | null = null
  private trailingIconFlexItem: FlexItem | null = null

  private unsubscribes: unsubscribe[] = []
  private _skipNextSizeUpdate: boolean = false
  private _initialized: boolean = false
  private _opacityFactor: number = 1
  private _explicitRenderOrder: number | null = null
  private _lastStateName: string | null = null
  // Cached resolved colors. ContentColorState references theme-owned
  // literals — read-only, never mutate. Re-resolved on state change;
  // opacity ticks re-apply with the new multiplier without re-running
  // the theme lookup pipeline. Future runtime mutators (theme switch,
  // style override toggle) should call markColorsDirty() to flush.
  private _cachedColors: ContentColorState | null = null
  private _colorsDirty: boolean = true
  private debugUpdateEvent!: SceneEvent

  // ─── Lifecycle ──────────────────────────────────────────────────────

  public onAwake(): void {
    // Debug visualization event — starts disabled
    this.debugUpdateEvent = this.createEvent("UpdateEvent")
    this.debugUpdateEvent.enabled = this._debug
    this.debugUpdateEvent.bind(() => {
      this.renderDebug()
    })

    this.createEvent("OnStartEvent").bind(() => this.init())
  }

  private init(): void {
    this.discoverSiblingElement()

    if (this.siblingElement) {
      this.unsubscribes.push(this.siblingElement.onInitialized.add(() => this.buildContent()))
    } else if (this.standaloneMode) {
      this.buildContent()
    }
  }

  public onDestroy(): void {
    // Flip _initialized first so any in-flight applyResolvedColors / opacity
    // setter calls early-return instead of touching natives being torn down.
    this._initialized = false
    this.unsubscribes.forEach((u) => u())
    this.unsubscribes = []
    // Content container is owned by the sibling's managedSceneObjects (via
    // registerManagedChild) in companion mode. In standalone mode, we own it.
    if (this.standaloneMode && this.contentContainer && !isNull(this.contentContainer)) {
      this.contentContainer.destroy()
    }
  }

  // ─── Discovery ──────────────────────────────────────────────────────

  private discoverSiblingElement(): void {
    const others = this.sceneObject.getComponents(ElementContent.getTypeName()) as ElementContent[]
    for (const other of others) {
      if (other !== this && other._initialized === true) {
        log.w("ElementContent: Another instance already active on " + this.sceneObject.name)
        return
      }
    }

    const textInputField = this.sceneObject.getComponent(TextInputField.getTypeName())
    if (textInputField) {
      log.w("ElementContent: TextInputField detected on " + this.sceneObject.name + " — disabling.")
      return
    }

    for (const component of this.sceneObject.getComponents("ScriptComponent")) {
      if (component === this) continue
      if (isContentHost(component)) {
        this.siblingElement = component
        return
      }
    }

    this.standaloneMode = true
    if (this._sizeOverride.x <= 0 || this._sizeOverride.y <= 0) {
      log.w("ElementContent: No VisualElement found and sizeOverride is zero on " + this.sceneObject.name)
    }
  }

  // ─── Content Building ───────────────────────────────────────────────

  private buildContent(): void {
    if (this._initialized || this.contentContainer) return

    // Create content container with FlexLayout
    const container = global.scene.createSceneObject(this.sceneObject.name + " Content")
    container.layer = this.sceneObject.layer
    container.setParent(this.sceneObject)
    this.contentContainer = container
    this.applyContainerLocalZ()

    const flex = container.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.autoDiscoverItemsOnStart = false
    this.flexLayout = flex

    this.applyLayoutConfig()

    // Create content children and register with layout
    this.createContentItems()
    const items: FlexItem[] = []
    if (this.leadingIconFlexItem) items.push(this.leadingIconFlexItem)
    if (this.textFlexItem) items.push(this.textFlexItem)
    if (this.trailingIconFlexItem) items.push(this.trailingIconFlexItem)
    if (items.length > 0) flex.addItems(items)

    // Set initial size
    if (this.siblingElement) {
      this.siblingElement.registerManagedChild(container)
      const size = this.siblingElement.size
      if (size) {
        flex.width = Math.max(size.x, 0)
        flex.height = Math.max(size.y, 0)
      }
    } else if (this.standaloneMode && this._sizeOverride) {
      flex.width = Math.max(this._sizeOverride.x, 0)
      flex.height = Math.max(this._sizeOverride.y, 0)
    }

    if (this._autoResizeParent && this.siblingElement) {
      this.updateAutoSize()
    }

    // Force initial layout, then fix text sizing
    flex.forceLayout()
    this.fixTextAfterLayout()

    // Subscribe AFTER layout so the ReplayEvent color set happens on properly sized text
    if (this.siblingElement) {
      this.subscribeToSiblingEvents()
    }

    // Fix text on future passes, and retry auto-resize ONCE: the text's
    // natural extent reads zero until the handler resolves on the first real
    // layout pass. The retry defers via markLayoutDirty() (a sync call here
    // would no-op inside performLayout); the _autoResizeRetried one-shot flag
    // — reset by the text/autoResize setters — stops it looping every frame.
    this.unsubscribes.push(
      flex.onLayoutComplete.add(() => {
        this.fixTextAfterLayout()
        if (this._autoResizeParent && this.siblingElement && !this._autoResizeRetried) {
          this._autoResizeRetried = true
          this.markLayoutDirty()
        }
      })
    )

    // Standalone mode never gets a state callback — apply default colors now
    if (this.standaloneMode) {
      this.onElementStateChanged("default")
    }

    this._initialized = true
    this.applyResolvedColors()
  }

  private createContentItems(): void {
    const showText = this._text !== ""

    if (this._useLeadingIcon && this._leadingIcon) this.createLeadingIcon()
    if (showText) this.createTextItem()
    if (this._useTrailingIcon && this._trailingIcon) this.createTrailingIcon()
  }

  private createLeadingIcon(): void {
    const result = this.createIconSceneObject(this._leadingIcon, this._leadingIconSize, "LeadingIcon")
    this.leadingIconSceneObject = result.sceneObject
    this.leadingIconImage = result.image
    this.leadingIconFlexItem = result.flexItem
    result.flexItem.order = 0
  }

  private createTrailingIcon(): void {
    const result = this.createIconSceneObject(this._trailingIcon, this._trailingIconSize, "TrailingIcon")
    this.trailingIconSceneObject = result.sceneObject
    this.trailingIconImage = result.image
    this.trailingIconFlexItem = result.flexItem
    result.flexItem.order = 2
  }

  private createIconSceneObject(
    texture: Texture,
    size: number,
    name: string
  ): {sceneObject: SceneObject; image: Image; flexItem: FlexItem} {
    const iconObject = global.scene.createSceneObject(name)
    iconObject.layer = this.contentContainer!.layer
    iconObject.setParent(this.contentContainer!)

    const image = iconObject.createComponent("Component.Image") as Image
    image.mainMaterial = IMAGE_MATERIAL_ASSET.clone()
    image.mainPass.baseTex = texture
    image.stretchMode = StretchMode.Stretch
    image.verticalAlignment = VerticalAlignment.Center
    image.horizontalAlignment = HorizontalAlignment.Center
    image.renderOrder = this.getBaseRenderOrder() + this._renderOrderOffset

    iconObject.getTransform().setLocalScale(new vec3(size, size, 1))

    const flexItem = iconObject.createComponent(FlexItem.getTypeName()) as FlexItem
    flexItem.flexGrow = 0
    flexItem.flexShrink = 0
    flexItem.overrideWidth = size
    flexItem.overrideHeight = size

    return {sceneObject: iconObject, image, flexItem}
  }

  private createTextItem(): void {
    const textObject = global.scene.createSceneObject("Text")
    textObject.layer = this.contentContainer!.layer
    textObject.setParent(this.contentContainer!)

    const textComponent = textObject.createComponent("Component.Text") as Text
    textComponent.size = this._textSize
    textComponent.text = this._text
    textComponent.verticalAlignment = VerticalAlignment.Center
    textComponent.horizontalAlignment = TEXT_HALIGN_MAP[this._contentAlignment] ?? HorizontalAlignment.Center
    textComponent.verticalOverflow = VerticalOverflow.Truncate
    textComponent.renderOrder = this.getBaseRenderOrder() + this._renderOrderOffset + 1
    textComponent.textFill.color = new vec4(0.85, 0.85, 0.85, 1)
    textComponent.depthTest = true

    if (this._font) textComponent.font = this._font

    textComponent.horizontalOverflow = HorizontalOverflow.Wrap
    // Placeholder rect (replaced once FlexLayout allocates space). Routed through
    // the layoutRect-aware helper instead of writing the deprecated worldSpaceRect.
    setTextRect(textComponent, textObject, 1, 1)

    // Text fills remaining space
    const flexItem = textObject.createComponent(FlexItem.getTypeName()) as FlexItem
    flexItem.flexGrow = 1
    flexItem.flexShrink = 1
    flexItem.flexBasis = 0
    flexItem.order = 1
    flexItem.alignSelf = FlexAlignSelf.Stretch

    this.textSceneObject = textObject
    this.textComponent = textComponent
    this.textFlexItem = flexItem
  }

  /**
   * After FlexLayout positions items, fix the text SceneObject.
   * FlexItem's fallback handler scales SceneObjects, which doesn't work for Text
   * (Text needs its layout rect set, not scale). Reset the scale and set the rect
   * based on the FlexItem's allocated size.
   */
  private fixTextAfterLayout(): void {
    if (!this.textSceneObject || !this.textComponent || !this.textFlexItem) return

    // Read the allocated size from the FlexItem
    const allocated = this.textFlexItem.allocatedSize()

    // Undo any scaling the fallback handler applied
    this.textSceneObject.getTransform().setLocalScale(vec3.one())

    // Set the text's layout rect to match the allocated area
    setTextRect(this.textComponent, this.textSceneObject, allocated.width, allocated.height)
    this.textComponent.horizontalAlignment = TEXT_HALIGN_MAP[this._contentAlignment] ?? HorizontalAlignment.Center
  }

  // ─── Layout Helpers ─────────────────────────────────────────────────

  private setContainerSize(width: number, height: number): void {
    if (!this.flexLayout) return
    this.flexLayout.width = Math.max(width, 0)
    this.flexLayout.height = Math.max(height, 0)
  }

  private applyLayoutConfig(): void {
    if (!this.flexLayout) return

    const isRow = this._iconLayout === "left" || this._iconLayout === "right"
    this.flexLayout.direction = DIRECTION_MAP[this._iconLayout] ?? FlexDirection.Row
    this.flexLayout.justifyContent = JUSTIFY_MAP[this._contentAlignment] ?? FlexJustify.Center
    this.flexLayout.alignItems = FlexAlign.Center
    this.flexLayout.columnGap = isRow ? this._spacing : 0
    this.flexLayout.rowGap = isRow ? 0 : this._spacing
    this.flexLayout.paddingTop = this._paddingTop
    this.flexLayout.paddingRight = this._paddingRight
    this.flexLayout.paddingBottom = this._paddingBottom
    this.flexLayout.paddingLeft = this._paddingLeft
  }

  private forceLayoutPass(): void {
    if (!this.flexLayout) return
    this.flexLayout.forceLayout()
    this.fixTextAfterLayout()
  }

  private applyIconSize(sceneObject: SceneObject | null, flexItem: FlexItem | null, size: number): void {
    if (sceneObject && !isNull(sceneObject)) {
      sceneObject.getTransform().setLocalScale(new vec3(size, size, 1))
    }
    if (flexItem && !isNull(flexItem)) {
      flexItem.overrideWidth = size
      flexItem.overrideHeight = size
    }
  }

  private computeContainerLocalZ(): number {
    return this._zOffset + (this.siblingElement?.contentZOffset ?? 0)
  }

  private applyContainerLocalZ(): void {
    if (!this.contentContainer) return
    this.contentContainer.getTransform().setLocalPosition(new vec3(0, 0, this.computeContainerLocalZ()))
  }

  private refreshContentLayout(): void {
    if (!this._initialized || !this.flexLayout) return

    this.applyLayoutConfig()
    if (this._autoResizeParent && this.siblingElement) {
      this.updateAutoSize()
    }
    this.forceLayoutPass()
  }

  // ─── Batch Layout ──────────────────────────────────────────────────
  //
  // Multiple setter calls in one frame (e.g. setting text, leadingIcon,
  // and padding together) would each trigger a full layout pass and
  // auto-resize measurement. The dirty-flag pattern coalesces these into
  // a single deferred flush: each setter records its change immediately
  // (including structural work like creating/destroying FlexItems), then
  // calls markLayoutDirty(). setTimeout(0) defers the flush to after all
  // setters in the current frame have executed, so the expensive work —
  // applyLayoutConfig, forceLayout, fixTextAfterLayout, updateAutoSize —
  // runs exactly once regardless of how many properties changed.

  private _layoutDirty = false
  // One-shot guard for the post-layout auto-resize retry; reset by setters
  // that genuinely change what the natural-content size should be (text,
  // autoResize) so a fresh retry runs after the change.
  private _autoResizeRetried = false

  private markLayoutDirty(): void {
    if (!this._initialized) return
    if (this._layoutDirty) return
    this._layoutDirty = true
    setTimeout(() => {
      this._layoutDirty = false
      this.flushLayout()
    }, 0)
  }

  private flushLayout(): void {
    if (!this._initialized || !this.flexLayout) return
    this.applyLayoutConfig()
    this.forceLayoutPass()
    if (this._autoResizeParent && this.siblingElement) {
      this.updateAutoSize()
    }
  }

  // ─── Sibling Events ─────────────────────────────────────────────────

  private subscribeToSiblingEvents(): void {
    const sibling = this.siblingElement!
    // Required core
    this.unsubscribes.push(sibling.onSizeChanged.add((newSize: vec3) => this.onElementSizeChanged(newSize)))
    // Optional theme/state surface — only subscribe if the host implements it
    const stateUnsub = sibling.onStateChanged?.add((stateName: string) => this.onElementStateChanged(stateName))
    if (stateUnsub) this.unsubscribes.push(stateUnsub)
    const zUnsub = sibling.onContentZOffsetChanged?.add(() => this.applyContainerLocalZ())
    if (zUnsub) this.unsubscribes.push(zUnsub)
  }

  // ─── State Colors ───────────────────────────────────────────────────

  private onElementStateChanged(stateName: string): void {
    this._lastStateName = stateName
    this._colorsDirty = true
    this.applyResolvedColors()
  }

  /**
   * Apply the cached resolved colors with the current opacity multiplier.
   * Per-frame opacity tweens land here without re-running the theme
   * resolution pipeline. The cache is refreshed lazily when `_colorsDirty`.
   */
  private applyResolvedColors(): void {
    if (!this._initialized || this._lastStateName === null) return
    if (this._colorsDirty || this._cachedColors === null) {
      this._cachedColors = this._useThemeColors
        ? this.resolveThemeColors(this._lastStateName)
        : this.getManualColors(this._lastStateName)
      this._colorsDirty = false
    }
    const colors = this._cachedColors
    if (!colors) return
    const opacity = this._opacityFactor

    if (this.textComponent && colors.textColor) {
      if (this._useTextColorOverride) {
        this.textComponent.textFill.color = new vec4(
          this._textColorOverride.r,
          this._textColorOverride.g,
          this._textColorOverride.b,
          colors.textColor.a * opacity
        )
      } else {
        this.textComponent.textFill.color = new vec4(
          colors.textColor.r,
          colors.textColor.g,
          colors.textColor.b,
          colors.textColor.a * opacity
        )
      }
    }
    if (this.leadingIconImage && colors.iconTint) {
      this.leadingIconImage.mainPass.baseColor = new vec4(
        colors.iconTint.r,
        colors.iconTint.g,
        colors.iconTint.b,
        colors.iconTint.a * opacity
      )
    }
    if (this.trailingIconImage && colors.iconTint) {
      this.trailingIconImage.mainPass.baseColor = new vec4(
        colors.iconTint.r,
        colors.iconTint.g,
        colors.iconTint.b,
        colors.iconTint.a * opacity
      )
    }
  }

  /**
   * Mark the cached resolved colors as stale. Call after changing any
   * field that affects color resolution at runtime — theme override,
   * style name, visual element type, useThemeColors toggle, or any
   * per-state color override. The next opacity tick or state-change
   * pass will re-resolve and re-apply.
   *
   * Applies synchronously (matching `set opacity` in this file rather
   * than the deferred `markLayoutDirty()` pattern, since color writes
   * are a handful of bridge calls and don't benefit from batching).
   */
  public markColorsDirty(): void {
    this._colorsDirty = true
    if (this._initialized) this.applyResolvedColors()
  }

  public get opacity(): number {
    return this._opacityFactor
  }

  public set opacity(value: number) {
    this._opacityFactor = value
    if (this._initialized) {
      this.applyResolvedColors()
    }
  }

  private resolveThemeColors(stateName: string): ContentColorState {
    const key: ContentStyleKey = {
      visualElementType: this._visualElementType || this.siblingElement?.typeString || "Button",
      style: this._styleName || this.siblingElement?.style || ThemeService.getInstance().currentTheme.defaultStyleName,
      themeName:
        this._themeOverride ||
        (this.siblingElement?.normalizedThemeOverride !== "Inherited"
          ? this.siblingElement?.normalizedThemeOverride
          : undefined)
    }
    return resolveContentColors(key, stateName)
  }

  private getManualColors(stateName: string): ContentColorState {
    switch (stateName) {
      case "hovered":
      case "toggledHovered":
        return {textColor: this._hoveredTextColor, iconTint: this._hoveredIconTint}
      case "triggered":
      case "toggledTriggered":
        return {textColor: this._triggeredTextColor, iconTint: this._triggeredIconTint}
      case "inactive":
        return {textColor: this._inactiveTextColor, iconTint: this._inactiveIconTint}
      default:
        return {textColor: this._defaultTextColor, iconTint: this._defaultIconTint}
    }
  }

  // ─── Size Handling ──────────────────────────────────────────────────

  private onElementSizeChanged(newSize: vec3): void {
    if (this._skipNextSizeUpdate) {
      this._skipNextSizeUpdate = false
      return
    }
    if (this._autoResizeParent) return
    this.setContainerSize(newSize.x, newSize.y)
  }

  /**
   * Resize the parent element to fit content at its natural (unconstrained)
   * size. Measures the text's natural width synchronously (Overflow-mode
   * `getBoundingBox`) and pins it as the text item's `overrideWidth` before
   * running `computeContentSize`. The pin is timing-immune: it does not depend
   * on the handler's cached/rate-limited natural-width (`getTextContentSizes`
   * in `ItemHandlerRegistry.ts`), which reads zero/stale on the first frame —
   * `updateAutoSize` runs before the first `forceLayout`, so a cached source
   * would resolve the text item to ~0 width and collapse the parent.
   */
  private updateAutoSize(): void {
    if (!this.siblingElement || !this.flexLayout) return

    let contentSize = {width: 0, height: 0}
    const item = this.textFlexItem
    if (item && this.textComponent) {
      // Measure the text's natural (unwrapped) extent now and pin it as a hard
      // override so the engine sees the true rendered width regardless of when
      // this runs. Restore everything afterwards so normal (flex-grow) layout
      // passes are unaffected.
      const savedGrow = item.flexGrow
      const savedBasis = item.flexBasis
      const savedOverflow = this.textComponent.horizontalOverflow
      this.textComponent.horizontalOverflow = HorizontalOverflow.Overflow
      const natural = this.textComponent.getBoundingBox().getSize()
      this.textComponent.horizontalOverflow = savedOverflow
      item.overrideWidth = natural.x
      item.overrideHeight = natural.y
      item.flexGrow = 0
      item.flexBasis = "auto"
      try {
        contentSize = this.flexLayout.computeContentSize()
      } finally {
        // clearOverride*, NOT `= 0`: under LayoutItem2D's override semantics
        // `overrideWidth = 0` PINS the item to zero width, which would collapse
        // every subsequent layout pass (see LayoutItem2D.clearOverrideWidth).
        item.clearOverrideWidth()
        item.clearOverrideHeight()
        item.flexGrow = savedGrow
        item.flexBasis = savedBasis
      }
    } else {
      contentSize = this.flexLayout.computeContentSize()
    }

    // Bail on degenerate measurements: zero (text not ready) or non-finite
    // (handler hasn't resolved yet, max defaults to Infinity). Either way,
    // resizing the Element from this call would clobber the next attempt.
    if (
      contentSize.width <= 0 ||
      contentSize.height <= 0 ||
      !isFinite(contentSize.width) ||
      !isFinite(contentSize.height)
    ) {
      return
    }

    const width = Math.max(contentSize.width, this._minWidth)
    const height = Math.max(contentSize.height, this._minHeight)
    const currentSize = this.siblingElement.size
    if (Math.abs(currentSize.x - width) > 0.001 || Math.abs(currentSize.y - height) > 0.001) {
      this._skipNextSizeUpdate = true
      this.siblingElement.size = new vec3(width, height, currentSize.z)
      this.setContainerSize(width, height)
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private getBaseRenderOrder(): number {
    if (this._explicitRenderOrder !== null) {
      return this._explicitRenderOrder
    }
    const siblingAny = this.siblingElement as any
    if (siblingAny?._visual?.renderMeshVisual) {
      return siblingAny._visual.renderMeshVisual.renderOrder ?? 0
    }
    return 0
  }

  // ─── Public API ─────────────────────────────────────────────────────

  /** Updates the render order of the text and icon components. */
  public set renderOrder(value: number) {
    if (value === undefined) return
    this._explicitRenderOrder = value
    const baseRenderOrder = this.getBaseRenderOrder()
    if (this.textComponent) {
      this.textComponent.renderOrder = baseRenderOrder + this._renderOrderOffset + 1
    }
    if (this.leadingIconImage) {
      this.leadingIconImage.renderOrder = baseRenderOrder + this._renderOrderOffset
    }
    if (this.trailingIconImage) {
      this.trailingIconImage.renderOrder = baseRenderOrder + this._renderOrderOffset
    }
  }

  public set text(value: string) {
    this._text = value
    this._autoResizeRetried = false
    if (!this._initialized) return
    if (!value && this.textSceneObject) {
      this.flexLayout!.removeItems([this.textFlexItem!])
      this.textSceneObject.destroy()
      this.textSceneObject = null
      this.textComponent = null
      this.textFlexItem = null
    } else if (value && !this.textComponent) {
      this.createTextItem()
      this.flexLayout!.addItems([this.textFlexItem!])
    } else if (value && this.textComponent) {
      this.textComponent.text = value
    }
    this.markLayoutDirty()
  }

  public get text(): string {
    return this._text
  }

  public get textSize(): number {
    return this._textSize
  }
  public set textSize(value: number) {
    if (this._textSize === value) return
    this._textSize = value
    if (!this._initialized) return
    if (this.textComponent) {
      this.textComponent.size = value
    }
    this.markLayoutDirty()
  }

  public get leadingIconSize(): number {
    return this._leadingIconSize
  }
  public set leadingIconSize(value: number) {
    if (value === undefined || this._leadingIconSize === value) return
    this._leadingIconSize = value
    if (!this._initialized) return
    this.applyIconSize(this.leadingIconSceneObject, this.leadingIconFlexItem, value)
    this.markLayoutDirty()
  }

  public get trailingIconSize(): number {
    return this._trailingIconSize
  }
  public set trailingIconSize(value: number) {
    if (value === undefined || this._trailingIconSize === value) return
    this._trailingIconSize = value
    if (!this._initialized) return
    this.applyIconSize(this.trailingIconSceneObject, this.trailingIconFlexItem, value)
    this.markLayoutDirty()
  }

  public get leadingIcon(): Texture | null {
    return this._leadingIcon
  }
  public set leadingIcon(value: Texture | null) {
    this._useLeadingIcon = value !== null
    this._leadingIcon = value
    if (!this._initialized) return

    if (!value && this.leadingIconSceneObject) {
      this.flexLayout!.removeItems([this.leadingIconFlexItem!])
      this.leadingIconSceneObject.destroy()
      this.leadingIconSceneObject = null
      this.leadingIconImage = null
      this.leadingIconFlexItem = null
    } else if (value && !this.leadingIconImage) {
      this.createLeadingIcon()
      this.flexLayout!.addItems([this.leadingIconFlexItem!])
    } else if (value && this.leadingIconImage) {
      this.leadingIconImage.mainPass.baseTex = value
    }
    this.applyResolvedColors()
    this.markLayoutDirty()
  }

  public get trailingIcon(): Texture | null {
    return this._trailingIcon
  }
  public set trailingIcon(value: Texture | null) {
    this._useTrailingIcon = value !== null
    this._trailingIcon = value
    if (!this._initialized) return

    if (!value && this.trailingIconSceneObject) {
      this.flexLayout!.removeItems([this.trailingIconFlexItem!])
      this.trailingIconSceneObject.destroy()
      this.trailingIconSceneObject = null
      this.trailingIconImage = null
      this.trailingIconFlexItem = null
    } else if (value && !this.trailingIconImage) {
      this.createTrailingIcon()
      this.flexLayout!.addItems([this.trailingIconFlexItem!])
    } else if (value && this.trailingIconImage) {
      this.trailingIconImage.mainPass.baseTex = value
    }
    this.applyResolvedColors()
    this.markLayoutDirty()
  }

  public set sizeOverride(size: vec2) {
    this._sizeOverride = size
    if (this._initialized && this.standaloneMode) {
      this.setContainerSize(size.x, size.y)
    }
  }

  public get iconLayout(): string {
    return this._iconLayout
  }
  public set iconLayout(value: string) {
    if (this._iconLayout === value) return
    this._iconLayout = value
    this.markLayoutDirty()
  }

  public get contentAlignment(): string {
    return this._contentAlignment
  }
  public set contentAlignment(value: string) {
    if (this._contentAlignment === value) return
    this._contentAlignment = value
    this.markLayoutDirty()
  }

  public get spacing(): number {
    return this._spacing
  }
  public set spacing(value: number) {
    const spacingChanged = this._spacing !== value
    this._customSpacing = true
    if (!spacingChanged) return
    this._spacing = value
    this.markLayoutDirty()
  }

  public get padding(): ElementContentPadding {
    return {
      top: this._paddingTop,
      right: this._paddingRight,
      bottom: this._paddingBottom,
      left: this._paddingLeft
    }
  }
  public set padding(value: ElementContentPadding) {
    const paddingChanged =
      this._paddingTop !== value.top ||
      this._paddingRight !== value.right ||
      this._paddingBottom !== value.bottom ||
      this._paddingLeft !== value.left

    this._customSpacing = true
    if (!paddingChanged) return

    this._paddingTop = value.top
    this._paddingRight = value.right
    this._paddingBottom = value.bottom
    this._paddingLeft = value.left
    this.markLayoutDirty()
  }

  public get paddingTop(): number {
    return this._paddingTop
  }
  public set paddingTop(value: number) {
    const paddingChanged = this._paddingTop !== value
    this._customSpacing = true
    if (!paddingChanged) return
    this._paddingTop = value
    this.markLayoutDirty()
  }

  public get paddingRight(): number {
    return this._paddingRight
  }
  public set paddingRight(value: number) {
    const paddingChanged = this._paddingRight !== value
    this._customSpacing = true
    if (!paddingChanged) return
    this._paddingRight = value
    this.markLayoutDirty()
  }

  public get paddingBottom(): number {
    return this._paddingBottom
  }
  public set paddingBottom(value: number) {
    const paddingChanged = this._paddingBottom !== value
    this._customSpacing = true
    if (!paddingChanged) return
    this._paddingBottom = value
    this.markLayoutDirty()
  }

  public get paddingLeft(): number {
    return this._paddingLeft
  }
  public set paddingLeft(value: number) {
    const paddingChanged = this._paddingLeft !== value
    this._customSpacing = true
    if (!paddingChanged) return
    this._paddingLeft = value
    this.markLayoutDirty()
  }

  public get autoResize(): boolean {
    return this._autoResizeParent
  }
  public set autoResize(value: boolean) {
    if (this._autoResizeParent === value) return
    this._autoResizeParent = value
    this._autoResizeRetried = false
    if (!this._initialized) return

    if (value) {
      this.markLayoutDirty()
      return
    }

    if (this.siblingElement) {
      const currentSize = this.siblingElement.size
      this.setContainerSize(currentSize.x, currentSize.y)
    } else if (this.standaloneMode) {
      this.setContainerSize(this._sizeOverride.x, this._sizeOverride.y)
    }

    this.applyLayoutConfig()
    this.forceLayoutPass()
  }

  public setState(stateName: string): void {
    if (!this.standaloneMode) return
    this.onElementStateChanged(stateName)
  }

  /** Enables debug visualization (container and item bounds drawn each frame). */
  public get debug(): boolean {
    return this._debug
  }
  public set debug(value: boolean) {
    if (this._debug === value) return
    this._debug = value
    if (this.debugUpdateEvent) {
      this.debugUpdateEvent.enabled = value
    }
  }

  // ─── Custom content extension ────────────────────────────────────────

  /**
   * The internal `FlexLayout` that arranges this component's children
   * (leading icon, text, trailing icon). Exposed so callers can drop in
   * arbitrary `LayoutItem2D`-recognized content (e.g. a custom widget, an
   * extra Image, a nested layout) via {@link addContentItem}. `null` until
   * the component is initialized.
   */
  public get layout(): FlexLayout | null {
    return this.flexLayout
  }

  /**
   * Adds a custom child to the internal content layout. The child becomes a
   * sibling of the built-in text + icons. Caller is responsible for
   * attaching the right component (FlexItem auto-creates if missing) and
   * registering as a managed child of the sibling Element when in companion
   * mode.
   *
   * @param sceneObject The SceneObject to insert. Will be re-parented to
   *   this ElementContent's internal content container if not already.
   * @param order Optional sort order — the built-in items use 0/1/2 for
   *   leading-icon / text / trailing-icon; use higher values to append.
   */
  public addContentItem(sceneObject: SceneObject, order?: number): FlexItem | null {
    if (!this.flexLayout || !this.contentContainer) {
      log.w("ElementContent: addContentItem called before initialization; ignoring")
      return null
    }
    sceneObject.setParent(this.contentContainer)
    // `instanceof FlexItem` so an existing FlexItem subclass is reused
    // instead of synthesizing a duplicate plain FlexItem alongside it.
    let flexItem: FlexItem | null = null
    const scripts = sceneObject.getComponents("ScriptComponent")
    for (const c of scripts) {
      if (c instanceof FlexItem) {
        flexItem = c
        break
      }
    }
    if (!flexItem) {
      flexItem = sceneObject.createComponent(FlexItem.getTypeName()) as FlexItem
    }
    if (order !== undefined) flexItem.order = order
    this.flexLayout.addItems([flexItem])
    if (this.siblingElement) {
      this.siblingElement.registerManagedChild(sceneObject)
    }
    return flexItem
  }

  // ─── Debug Visualization ─────────────────────────────────────────────

  private renderDebug(): void {
    if (!this._debug || !this._initialized) return
    if (!this.flexLayout || !this.contentContainer) return

    const containerW = this.flexLayout.width
    const containerH = this.flexLayout.height

    // Use the contentContainer's transform (offset from parent)
    const transform = this.contentContainer.getTransform()
    const worldPos = transform.getWorldPosition()
    const worldRot = transform.getWorldRotation()
    const worldScale = transform.getWorldScale()

    // Container bounds (yellow box)
    const cColor = new vec4(1, 1, 0, 1)
    drawWorldBox(worldPos, containerW, containerH, worldRot, worldScale, cColor)

    // Origin marker (red diamond) at the ElementContent SceneObject origin
    const originPos = this.sceneObject.getTransform().getWorldPosition()
    const originRot = this.sceneObject.getTransform().getWorldRotation()
    const dSize = 0.3
    const dTop = originPos.add(originRot.multiplyVec3(new vec3(0, dSize, 0)))
    const dRight = originPos.add(originRot.multiplyVec3(new vec3(dSize, 0, 0)))
    const dBottom = originPos.add(originRot.multiplyVec3(new vec3(0, -dSize, 0)))
    const dLeft = originPos.add(originRot.multiplyVec3(new vec3(-dSize, 0, 0)))
    const dColor = new vec4(1, 0.2, 0.2, 1)
    global.debugRenderSystem.drawSolidTriangle(dTop, dLeft, dBottom, dColor)
    global.debugRenderSystem.drawSolidTriangle(dTop, dBottom, dRight, dColor)

    // Item bounds (orange) — distinct from FlexLayout (cyan) and GridLayout (green)
    const iColor = new vec4(1, 0.6, 0.2, 1)
    const items: (FlexItem | null)[] = [this.leadingIconFlexItem, this.textFlexItem, this.trailingIconFlexItem]
    for (const item of items) {
      if (!item) continue
      const itemPos = item.sceneObject.getTransform().getWorldPosition()
      const size = item.allocatedSize()
      drawWorldBox(itemPos, size.width, size.height, worldRot, worldScale, iColor)
    }
  }
}
