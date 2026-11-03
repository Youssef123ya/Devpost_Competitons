import animate, {CancelSet} from "SpectaclesInteractionKit.lspkg/Utils/animate"
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {setTimeout} from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {DropdownBackgroundGray, DropdownDrawerGray} from "../../Themes/SnapOS-3.0/Colors"
import {FlexContainer} from "../../Utility/FlexContainer"
import {RoundedRectangle} from "../../Visuals/RoundedRectangle/RoundedRectangle"
import {Button} from "../Button/Button"
import {ElementContent} from "../Content/ElementContent"
import {addContentToElement} from "../Content/ElementContentFactory"
import {FlexItem} from "../Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexLayoutResult} from "../Layout2D/Flex/FlexTypes"
import {UIKitBrands} from "../Layout2D/UIKitBrands"
import {ScrollWindow} from "../ScrollWindow/ScrollWindow"
import {ToggleGroup} from "../Toggle/ToggleGroup"
import {DropdownItem} from "./DropdownItem"

const CHEVRON_DOWN: Texture = requireAsset("../../../Textures/Chevron-down.png") as Texture
const CHEVRON_UP: Texture = requireAsset("../../../Textures/Chevron-up.png") as Texture
/** Default trailing icon size at textSize=60. Icon scales proportionally. */
const CHEVRON_BASE_SIZE = 1.5
const CHEVRON_BASE_TEXT_SIZE = 60

const EXPAND_ANIMATION_DURATION = 0.2
const CORNER_RADIUS = 0.5
/** Z offset to push backgrounds behind interactive content in the scene hierarchy. */
const BACKGROUND_Z_OFFSET = -0.2
/** Z offset for the trigger background, slightly in front of BACKGROUND_Z_OFFSET to avoid z-fighting with the drawer background. */
const TRIGGER_BG_Z_OFFSET = -0.18
const BACKGROUND_COLOR = DropdownDrawerGray
const TRIGGER_BACKGROUND_COLOR = DropdownBackgroundGray
/** Multiplier of average item height that defines the top/bottom fade-out zone. */
const FADE_ZONE_FACTOR = 1.2
const SCROLL_TWEEN_DURATION_MS = 300
const ALPHA_EPSILON = 0.001
export const DEFAULT_TRIGGER_WIDTH = 9.5

/** Stores data for a single dropdown option. Text-only for now, extensible for icons/metadata later. */
export class DropdownOption {
  public text: string
  public data?: Record<string, any>
  public constructor(text: string, data?: Record<string, any>) {
    this.text = text
    this.data = data
  }
}

/** Payload for the onItemTapped event. */
export interface DropdownItemEvent {
  index: number
  /** The tapped DropdownItem (unpool mode), or null in pool mode. */
  item: DropdownItem | null
}

/**
 * Dropdown — a scrollable, animated drawer attached to a trigger button.
 *
 * **Unpool mode** — caller creates and owns the Button objects.
 * Best for small, fixed lists (< ~20 items). Each button can be customized separately.
 * Item API: `setItems()`, `appendItem()`, `insertItem()`, `removeItemAt()`
 * Selection API: `selectItem()`, `deselectItem()`, `clearSelection()`, `getSelectedItems()`
 *
 * **Pool mode** — caller provides data, the Dropdown manages buttons internally
 * via virtual scrolling. Efficient for large or dynamic lists. All buttons share the same style.
 * Item API: `setData()`, `appendData()`, `insertData()`, `removeDataAt()`
 * Selection API: `selectDataAt()`, `deselectDataAt()`, `clearSelection()`, `getSelectedIndices()`
 *
 * Both modes share events (`onItemTapped`, `onSelectionChanged`),
 * selection behavior, and expand/collapse animation (`expand()`, `collapse()`, `toggle()`).
 *
 * **Spacing/padding** is configurable via `itemSpacing`, `triggerPadding`, and `dropdownPadding`
 * — editable in the Lens Studio inspector or settable from code.
 *
 * **Scene-based item discovery (unpool mode only):** Add a `DropdownItem` marker
 * component to any direct child SceneObject. On start the Dropdown collects them,
 * sorts by `order`, and auto-appends their Buttons — no code needed.
 */
@component
export class Dropdown extends FlexContainer {
  /**
   * Type brand consumed by the Layout2D `LayoutContainerHandler`. Lets
   * Dropdown participate as an atomic item in a parent FlexLayout /
   * GridLayout / ElementGroup. The parent reads the trigger row's bounds
   * via {@link computeContentSize}; drawer expansion is treated as an
   * overlay rather than reserving sibling space (matching how
   * ElementGroup handles dropdown drawers via margins on its own).
   */
  public readonly __uikitBrand = UIKitBrands.LayoutContainer

  // --- Trigger Button ---
  @ui.separator
  @ui.group_start("Trigger Button")
  @input
  @label("Custom Trigger")
  @hint("When true, provide your own trigger button. When false, a styled button is auto-generated.")
  protected _customTrigger: boolean = false

  @input
  @showIf("_customTrigger", true)
  @allowUndefined
  @label("Custom Button")
  @hint("Reference to a custom Button to use as the trigger.")
  protected _topButton: Button

  @input("vec2", "{10.25, 3.75}")
  @showIf("_customTrigger", false)
  @label("Button Size")
  @hint("Width and height of the auto-generated trigger button in world units.")
  protected _triggerButtonSize: vec2 = new vec2(10.25, 3.75)

  @input
  @showIf("_customTrigger", false)
  @label("Style")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Prism", "Prism"),
      new ComboBoxItem("Primary", "Primary"),
      new ComboBoxItem("Secondary", "Secondary"),
      new ComboBoxItem("Ghost", "Ghost")
    ])
  )
  @hint("Visual style of the auto-generated trigger button.")
  protected _topButtonStyle: string = "Primary"

  @input
  @showIf("_customTrigger", false)
  @label("Label")
  @hint("Text label displayed on the auto-generated trigger button.")
  protected _triggerLabel: string = "Button"

  @input
  @showIf("_customTrigger", false)
  @label("Text Size")
  @hint("Text size for the auto-generated trigger button label.")
  protected _triggerTextSize: number = 56

  @input("vec2", "{1, 0.5}")
  @showIf("_customTrigger", false)
  @label("Content Padding")
  @hint("Inner padding of the trigger button content (x = left/right, y = top/bottom).")
  protected _triggerContentPadding: vec2 = new vec2(1, 0.5)

  @input
  @showIf("_customTrigger", false)
  @label("Content Alignment")
  @hint("Horizontal alignment of the trigger label: left, center, or right.")
  protected _triggerContentAlignment: string = "left"

  @input
  @showIf("_customTrigger", false)
  @label("Auto-Resize Trigger")
  @hint("When true the trigger shrinks to fit its label; when false it keeps the Button Size width.")
  protected _triggerAutoResize: boolean = false

  @input
  @label("Hide Trigger")
  @hint("When true, no trigger button is shown. Use expand()/collapse()/toggle() from code to control the drawer.")
  protected _hideTrigger: boolean = false

  @input
  @label("Has Background")
  @hint("When true, the layout will leave space for a rounded background behind the trigger button area.")
  protected _hasTriggerBackground: boolean = true

  @input
  @showIf("_hasTriggerBackground", true)
  @label("Show Background")
  @hint("When true, shows a rounded background behind the trigger button area.")
  protected _showTriggerBackground: boolean = true

  @input("vec2", "{0.5, 0.5}")
  @showIf("_hasTriggerBackground", true)
  @label("Trigger Padding")
  @hint("Per-side padding around the trigger background in cm (x = horizontal, y = vertical).")
  protected _triggerPadding: vec2 = new vec2(0.5, 0.5)
  @ui.group_end

  // --- Selection Behavior ---
  @ui.separator
  @ui.group_start("Selection")
  @input
  @label("Mode")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("None", "none"),
      new ComboBoxItem("Single", "single"),
      new ComboBoxItem("Multi", "multi")
    ])
  )
  @hint("None: no toggle management. Single: one item at a time. Multi: multiple items.")
  protected _selectionMode: string = "single"

  @input
  @label("Allow Empty")
  @hint("When false, at least one item must always be selected (only applies when selectionMode is not none).")
  protected _allowEmptySelection: boolean = true

  @input
  @label("Collapse On Select")
  @hint("When true, the dropdown automatically collapses after an item is selected.")
  protected _collapseOnSelect: boolean = false
  @ui.group_end

  // --- Drawer Layout ---
  @ui.separator
  @ui.group_start("Drawer Layout")
  @input
  @label("Max Visible Items")
  @hint("Maximum number of items visible before the drawer scrolls.")
  protected _maxVisibleItems: number = 5
  @input
  @label("Override Width")
  @hint("When true, use a fixed width for the drawer instead of matching the trigger button width.")
  protected _overrideWidth: boolean = false
  @input
  @showIf("_overrideWidth", true)
  @label("Width")
  @hint("Fixed drawer width in world units.")
  protected _width: number = 9.5

  @input
  @label("Expand Up")
  @hint("When true, the drawer expands upward from the trigger instead of downward.")
  protected _expandUp: boolean = false

  @input
  @label("Expand Anchor")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Top", "Top"),
      new ComboBoxItem("Center", "Center"),
      new ComboBoxItem("Bottom", "Bottom")
    ])
  )
  @hint(
    "Anchor edge when inside an ElementGroup. Top: top stays fixed. Bottom: bottom stays fixed. Center: growth splits both directions."
  )
  protected _expandAnchor: string = "Top"

  @input
  @label("Start Expanded")
  @hint("Initial expanded state of the dropdown when it first appears.")
  protected _startExpanded: boolean = true

  @input
  @label("Item Spacing")
  @hint("Vertical gap between dropdown items in cm.")
  protected _itemSpacing: number = 0.5

  @input("vec2", "{0.5, 0.5}")
  @label("Dropdown Padding")
  @hint("Per-side padding around dropdown items in cm (x = horizontal, y = vertical).")
  protected _dropdownPadding: vec2 = new vec2(0.5, 0.5)

  @input
  @label("Scroll Fade")
  @hint("When true, items at the top and bottom edges of the scroll window fade out.")
  protected _scrollFade: boolean = true
  @ui.group_end

  // --- Pool Mode ---
  @ui.separator
  @ui.group_start("Pool Mode")
  @input
  @label("Option Height")
  @hint("Height of each item in cm (used in pool mode for padding-based virtual scrolling).")
  protected _optionHeight: number = 2.6

  @input
  @label("Option Style")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Prism", "Prism"),
      new ComboBoxItem("Primary", "Primary"),
      new ComboBoxItem("Secondary", "Secondary"),
      new ComboBoxItem("Ghost", "Ghost")
    ])
  )
  @hint("Visual style for pool-mode buttons.")
  protected _optionStyle: string = "Ghost"

  @input
  @label("Option Text Size")
  @hint("Text size for pool-mode item labels. 0 = use trigger text size.")
  @ui.group_end
  protected _optionTextSize: number = 0

  // --- Public accessors for @input properties ---
  public get customTrigger(): boolean {
    return this._customTrigger
  }
  /** Init-only. Set before OnStartEvent. */
  public set customTrigger(value: boolean) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: customTrigger is init-only and cannot be changed after start")
      return
    }
    this._customTrigger = value
  }

  public get topButton(): Button {
    return this._topButton
  }
  /** Init-only. Set before OnStartEvent. */
  public set topButton(value: Button) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: topButton is init-only and cannot be changed after start")
      return
    }
    this._topButton = value
  }

  public get triggerButtonSize(): vec2 {
    return this._triggerButtonSize
  }
  /**
   * Set before OnStartEvent for initial sizing. After start, use
   * {@link resizeTriggerButton} to resize the trigger at runtime.
   */
  public set triggerButtonSize(value: vec2) {
    if (this.layoutReady) {
      this.resizeTriggerButton(value.x, value.y)
      return
    }
    this._triggerButtonSize = value
  }

  public get topButtonStyle(): string {
    return this._topButtonStyle
  }
  /** Init-only. Set before OnStartEvent. */
  public set topButtonStyle(value: string) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: topButtonStyle is init-only and cannot be changed after start")
      return
    }
    this._topButtonStyle = value
  }

  public get triggerLabel(): string {
    return this._triggerLabel
  }
  public set triggerLabel(value: string) {
    this._triggerLabel = value
    if (this.triggerContent) {
      this.triggerContent.text = value
    }
  }

  public get hideTrigger(): boolean {
    return this._hideTrigger
  }
  /** Init-only. Set before OnStartEvent. */
  public set hideTrigger(value: boolean) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: hideTrigger is init-only and cannot be changed after start")
      return
    }
    this._hideTrigger = value
  }

  public get hasTriggerBackground(): boolean {
    return this._hasTriggerBackground
  }
  /**
   * Whether a trigger background exists. After start, toggling creates or destroys
   * the background SceneObject and recomputes drawer geometry (trigger gap and width
   * both depend on this flag). For cheap show/hide, prefer `showTriggerBackground`.
   */
  public set hasTriggerBackground(value: boolean) {
    if (this._hasTriggerBackground === value) return
    this._hasTriggerBackground = value
    if (!this.layoutReady) return

    if (value) {
      this.createTriggerBackground()
    } else if (this.triggerBgObject && !isNull(this.triggerBgObject)) {
      this.triggerBgObject.destroy()
      this.triggerBgObject = null
    }
    if (this.poolMode) {
      this.applyPoolData()
    } else {
      this.recalculateDrawerLayout()
    }
    this.updateDrawerWidth()
  }

  public get showTriggerBackground(): boolean {
    return this._showTriggerBackground
  }
  /** Init-only for creation/removal. After start, toggles visibility if bg exists. */
  public set showTriggerBackground(value: boolean) {
    this._showTriggerBackground = value
    if (!this.layoutReady) return
    // Lazy-create: if the bg was never built (e.g. showTriggerBackground was
    // false at init or when hasTriggerBackground was last toggled on),
    // make it now. createTriggerBackground re-checks all four preconditions.
    if (value && (!this.triggerBgObject || isNull(this.triggerBgObject))) {
      this.createTriggerBackground()
    }
    if (this.triggerBgObject && !isNull(this.triggerBgObject)) {
      this.triggerBgObject.enabled = this._hasTriggerBackground && value
    }
  }

  public get selectionMode(): string {
    return this._selectionMode
  }
  /** Init-only. Set before OnStartEvent. */
  public set selectionMode(value: string) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: selectionMode is init-only and cannot be changed after start")
      return
    }
    this._selectionMode = value
  }

  public get allowEmptySelection(): boolean {
    return this._allowEmptySelection
  }
  public set allowEmptySelection(value: boolean) {
    this._allowEmptySelection = value
  }

  public get collapseOnSelect(): boolean {
    return this._collapseOnSelect
  }
  public set collapseOnSelect(value: boolean) {
    this._collapseOnSelect = value
  }

  public get maxVisibleItems(): number {
    return this._maxVisibleItems
  }
  /** Init-only. Pool size is fixed at creation time. */
  public set maxVisibleItems(value: number) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: maxVisibleItems is init-only and cannot be changed after start")
      return
    }
    const clamped = Math.max(1, value)
    if (this._maxVisibleItems === clamped) return
    this._maxVisibleItems = clamped
  }

  public get overrideWidth(): boolean {
    return this._overrideWidth
  }
  public set overrideWidth(value: boolean) {
    if (this._overrideWidth === value) return
    this._overrideWidth = value
    if (this.layoutReady) this.updateDrawerWidth()
  }

  public get width(): number {
    return this._width
  }
  /**
   * No-op (mirrors {@link height}). The drawer width is self-driven, not set by
   * parent allocations — this absorbs `LayoutContainerHandler.apply`'s write so
   * a parent layout can't shrink the drawer under flex pressure. Configure it
   * via the inspector (`_width` + Override Width) or, at runtime, via
   * {@link configureWidth}.
   */
  public set width(_value: number) {
    // intentional no-op — see configureWidth() for the runtime config path
  }

  /**
   * Sets the override/drawer width used when `overrideWidth` is true. This is
   * the runtime config path (used by ElementGroup); the plain `width` setter is
   * a no-op so a parent layout can't overwrite it under flex pressure.
   */
  public configureWidth(value: number): void {
    if (this._width === value) return
    this._width = value
    if (this.layoutReady && this._overrideWidth) this.updateDrawerWidth()
  }

  /**
   * Trigger-row height in cm. Reports `triggerButtonSize.y` for the getter
   * (the resting height a parent layout sees). The setter is a no-op:
   * Dropdown's vertical extent is driven by its own trigger + drawer
   * lifecycle, not by parent allocations. Exists so
   * `LayoutContainerHandler.apply` can write through without throwing
   * when a parent Layout2D container places this Dropdown.
   */
  public get height(): number {
    return this._triggerButtonSize.y
  }
  public set height(_value: number) {
    // intentional no-op — see getter comment
  }

  /**
   * Reports the Dropdown's resting (collapsed) intrinsic size to a parent
   * Layout2D container. Drawer expansion is treated as overlay — the parent
   * reserves space for the trigger row only.
   */
  public computeContentSize(_opts?: {mode?: "preferred" | "min" | "max"}): {width: number; height: number} {
    return {
      width: this.effectiveWidth,
      height: this._triggerButtonSize.y
    }
  }

  /** All three modes — the collapsed size is mode-independent. */
  public computeContentSizeAllModes(): {
    preferred: {width: number; height: number}
    min: {width: number; height: number}
    max: {width: number; height: number}
  } {
    const s = this.computeContentSize()
    return {preferred: {...s}, min: {...s}, max: {...s}}
  }

  /**
   * Re-runs the internal layout pass synchronously. Called by
   * `LayoutContainerHandler.apply` after the parent allocates a cell.
   */
  public forceLayout(): void {
    if (this.flexLayout) {
      this.flexLayout.forceLayout()
    }
  }

  public get expandUp(): boolean {
    return this._expandUp
  }
  public set expandUp(value: boolean) {
    if (this._expandUp === value) return
    this._expandUp = value
    if (this.layoutReady) this.recalculateDrawerLayout()
  }

  public get expandAnchor(): string {
    return this._expandAnchor
  }
  public set expandAnchor(value: string) {
    this._expandAnchor = value
  }

  public get startExpanded(): boolean {
    return this._startExpanded
  }
  /** Init-only. Controls initial expand/collapse state. Use expand()/collapse() at runtime. */
  public set startExpanded(value: boolean) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: startExpanded is init-only — use expand()/collapse() at runtime")
      return
    }
    this._startExpanded = value
    // onAwake already initialized _isExpanded from the field default; keep it in sync
    // when the setter is called before layout completes.
    this._isExpanded = value
  }

  public get itemHeight(): number {
    return this._optionHeight
  }
  /** Init-only. Pool button height is fixed at pool creation time. */
  public set itemHeight(value: number) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: itemHeight is init-only and cannot be changed after start")
      return
    }
    this._optionHeight = value
  }

  public get itemStyle(): string {
    return this._optionStyle
  }
  /** Init-only. Pool button style is fixed at pool creation time. */
  public set itemStyle(value: string) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: itemStyle is init-only and cannot be changed after start")
      return
    }
    this._optionStyle = value
  }

  public get optionTextSize(): number {
    return this._optionTextSize
  }
  /** Init-only. Pool button text size is fixed at pool creation time. */
  public set optionTextSize(value: number) {
    if (this.layoutReady) {
      print("[Dropdown] Warning: optionTextSize is init-only and cannot be changed after start")
      return
    }
    this._optionTextSize = value
  }

  public get itemSpacing(): number {
    return this._itemSpacing
  }
  public set itemSpacing(value: number) {
    if (this._itemSpacing === value) return
    this._itemSpacing = value
    if (!this.layoutReady) return
    this.flexLayout.rowGap = value
    if (this.poolMode) {
      this.poolItemStep = this._optionHeight + value
      this.applyPoolData()
    }
    // Unpool mode: FlexLayout auto-relayouts on rowGap change
  }

  public get triggerPadding(): vec2 {
    return this._triggerPadding
  }
  /** Padding around the trigger button background. Applied live via `updateDrawerWidth`. */
  public set triggerPadding(value: vec2) {
    this._triggerPadding = value
    if (this.layoutReady) this.updateDrawerWidth()
  }

  public get dropdownPadding(): vec2 {
    return this._dropdownPadding
  }
  public set dropdownPadding(value: vec2) {
    this._dropdownPadding = value
    if (!this.layoutReady) return
    this.flexLayout.paddingLeft = value.x
    this.flexLayout.paddingRight = value.x
    if (this.poolMode) {
      this.applyPoolData()
    } else {
      this.recalculateDrawerLayout()
    }
  }

  public get scrollFade(): boolean {
    return this._scrollFade
  }

  public set scrollFade(value: boolean) {
    const wasEnabled = this._scrollFade
    this._scrollFade = value
    // Restore full opacity on all items when fade is turned off mid-scroll
    if (wasEnabled && !value) {
      if (this.poolMode) {
        for (let i = 0; i < this.poolButtons.length; i++) {
          if (this.poolAlphaCache[i] !== undefined && this.poolAlphaCache[i] < 1) {
            this.poolAlphaCache[i] = 1
            this.setPoolButtonAlpha(this.poolButtons[i], 1)
          }
        }
      } else {
        for (let i = 0; i < this.items.length; i++) {
          if (this.itemAlphaCache[i] !== undefined && this.itemAlphaCache[i] < 1) {
            this.itemAlphaCache[i] = 1
            this.setUnpoolItemAlpha(this.items[i], 1)
          }
        }
      }
    }
  }

  // --- Render Order ---
  private _triggerRenderOrder: number = 0
  private _drawerRenderOrder: number = 0

  public get triggerRenderOrder(): number {
    return this._triggerRenderOrder
  }
  /** Sets the render order for the trigger button and its background. */
  public set triggerRenderOrder(value: number) {
    this._triggerRenderOrder = value
    if (this.triggerButton) this.triggerButton.renderOrder = value
    if (this.triggerContent) this.triggerContent.renderOrder = value
    if (this.triggerBgObject) {
      const rect = this.triggerBgObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      if (rect) rect.renderOrder = value
    }
  }

  public get drawerRenderOrder(): number {
    return this._drawerRenderOrder
  }
  /** Sets the render order for the drawer background and all item buttons. */
  public set drawerRenderOrder(value: number) {
    this._drawerRenderOrder = value
    if (this.bgRect) this.bgRect.renderOrder = value
    for (const item of this.items) {
      if (item.element) item.element.renderOrder = value
    }
    for (let i = 0; i < this.poolButtons.length; i++) {
      this.poolButtons[i].renderOrder = value
      this.poolContents[i].renderOrder = value
    }
  }

  // --- Public state ---
  private _isExpanded: boolean = true

  public get isExpanded(): boolean {
    return this._isExpanded
  }

  /**
   * Y offset a parent should apply when the dropdown is expanded.
   */
  public get contentOffset(): number {
    return this.dirSign * (this.bgFullHeight / 2)
  }

  /**
   * Full height the drawer occupies beyond the trigger button edge when expanded.
   * Use this to reserve space below the trigger in a parent layout.
   */
  public get expandedHeight(): number {
    return this.triggerDropdownGap + this.bgFullHeight
  }

  private _parentHandlesAnchor: boolean = false
  private selfAnchorOffset: number = 0

  /**
   * When true, the Dropdown does not apply self-anchor offset during expansion.
   * Set by parent containers (e.g. ElementGroup) that handle anchor compensation externally.
   */
  public get parentHandlesAnchor(): boolean {
    return this._parentHandlesAnchor
  }

  public set parentHandlesAnchor(value: boolean) {
    if (this._parentHandlesAnchor === value) return
    this._parentHandlesAnchor = value
    if (!this.layoutReady || !this._isExpanded) return

    // Reconcile selfAnchorOffset so it doesn't stack with (or get stranded vs.)
    // the parent's offset. Cancel any in-flight drawer animation — it captured
    // the old flag and would otherwise re-write the offset on the next tick;
    // snap the drawer to its expanded state to compensate.
    this.animationCancelSet.cancel()
    if (!this._hideDrawerBackground) {
      this.bgObject.enabled = true
      this.bgRect.size = new vec2(this.bgRect.size.x, this.bgVisualHeight)
      this.bgObject.getTransform().setLocalPosition(new vec3(0, this.bgOriginY, BACKGROUND_Z_OFFSET))
    }
    this.scrollWindowWrapper.enabled = true
    this.scrollVisibilityDirty = true

    const targetOffset = value ? 0 : this.computeSelfAnchorOffset(this.expandedHeight)
    const delta = targetOffset - this.selfAnchorOffset
    if (delta === 0) return
    this.selfAnchorOffset = targetOffset
    const pos = this.sceneObject.getTransform().getLocalPosition()
    this.sceneObject.getTransform().setLocalPosition(new vec3(pos.x, pos.y + delta, pos.z))
  }

  private _hideDrawerBackground: boolean = false

  /**
   * When true, the drawer background is never shown.
   * Used by parent containers (e.g. ElementGroup) that manage backgrounds externally.
   */
  public set hideDrawerBackground(value: boolean) {
    this._hideDrawerBackground = value
    if (value && this.bgObject) this.bgObject.enabled = false
  }

  public get hideDrawerBackground(): boolean {
    return this._hideDrawerBackground
  }

  private _drawerBackgroundExtension: number = 0

  /**
   * Extra height added to the drawer background on the side AWAY from the trigger
   * (i.e. below the drawer when expanding down, above when expanding up). Used by
   * parent containers (e.g. ElementGroup) to bridge the drawer background visually
   * into a sibling row. Default 0.
   */
  public get drawerBackgroundExtension(): number {
    return this._drawerBackgroundExtension
  }
  public set drawerBackgroundExtension(value: number) {
    if (this._drawerBackgroundExtension === value) return
    this._drawerBackgroundExtension = value
    if (this.layoutReady) this.recalculateDrawerLayout()
  }

  /**
   * Resizes the trigger button at runtime.
   * Unlike `triggerButtonSize` (init-only), this works after the Dropdown has started.
   * Disables autoResize on the trigger content to prevent the size from being
   * overridden when content changes (e.g. chevron icon swap on expand/collapse).
   */
  public resizeTriggerButton(width: number, height: number): void {
    if (this.triggerButton) {
      this.triggerButton.size = new vec3(width, height, 1)
    }
    if (this.triggerContent) {
      this.triggerContent.autoResize = false
    }
    this._triggerButtonSize = new vec2(width, height)
  }

  /**
   * The actual rendered drawer width. When `overrideWidth` is true, this is
   * `width`; otherwise it follows the trigger button width. Exposed so a
   * surrounding container (e.g. ElementGroup) can size its own drawer
   * background to match.
   */
  public get effectiveWidth(): number {
    return this._overrideWidth ? this._width : this.triggerWidth
  }

  private get triggerDropdownGap(): number {
    if (this._hideTrigger) return 0
    return this._hasTriggerBackground ? this._itemSpacing : 0
  }

  /** Half-trigger height used to extend the background up over the trigger. Zero when hidden. */
  private get triggerOverlap(): number {
    if (this._hideTrigger) return 0
    return (this.triggerButton?.size.y ?? this._triggerButtonSize.y) / 2
  }

  /** Returns 1 for expand-up, -1 for expand-down. */
  private get dirSign(): number {
    return this._expandUp ? 1 : -1
  }

  /**
   * Computes the SceneObject Y offset needed to keep the anchor edge fixed
   * when the drawer is fully expanded to `height`.
   */
  private computeSelfAnchorOffset(height: number): number {
    const anchor = this._expandAnchor
    if (anchor === "Top") return -Math.max(0, this.dirSign) * height
    if (anchor === "Bottom") return Math.max(0, -this.dirSign) * height
    if (anchor === "Center") return (-this.dirSign * height) / 2
    return 0
  }

  // --- Events ---
  private onExpandedChangedEvent = new ReplayEvent<boolean>()
  private _onExpandedChanged?: PublicApi<boolean>
  public get onExpandedChanged(): PublicApi<boolean> {
    return (this._onExpandedChanged ??= this.onExpandedChangedEvent.publicApi())
  }

  private onItemTappedEvent = new Event<DropdownItemEvent>()
  /** Fires in both unpooled and pooled mode when an item is tapped. */
  private _onItemTapped?: PublicApi<DropdownItemEvent>
  public get onItemTapped(): PublicApi<DropdownItemEvent> {
    return (this._onItemTapped ??= this.onItemTappedEvent.publicApi())
  }

  /** Optional callback invoked when a pool button is rebound to new data during rebalance. */
  public onBindItem: ((button: Button, item: DropdownOption, index: number) => void) | null = null

  /** Optional callback invoked when a pool button is about to be rebound away from its current data. */
  public onUnbindItem: ((button: Button, item: DropdownOption, index: number) => void) | null = null

  /** Optional callback invoked when an item's fade alpha changes during scroll.
   *  Use this to fade custom visual content not handled automatically (e.g. custom materials, particle effects). */
  public onFadeItem: ((button: Button, alpha: number) => void) | null = null

  private onSelectionChangedEvent = new Event<DropdownItem[]>()
  /**
   * Fires when the selection changes.
   *
   * **Unpool mode:** The payload is the array of selected DropdownItems.
   * **Pool mode:** The payload is always empty — use `getSelectedIndices()` for pool mode selection.
   */
  private _onSelectionChanged?: PublicApi<DropdownItem[]>
  public get onSelectionChanged(): PublicApi<DropdownItem[]> {
    return (this._onSelectionChanged ??= this.onSelectionChangedEvent.publicApi())
  }

  // --- Unpool mode state ---
  private items: DropdownItem[] = []
  private itemUnsubscribes: (() => void)[] = []
  private selectedSet: Set<DropdownItem> = new Set<DropdownItem>()
  private toggleUnsubscribes: (() => void)[] = []
  private _externalToggleGroup: ToggleGroup | null = null
  private externalToggleGroupUnsub: (() => void) | null = null
  private unsubscribes: (() => void)[] = []
  private poolUnsubscribes: (() => void)[] = []
  private animationCancelSet: CancelSet = new CancelSet()
  private pendingItems: DropdownItem[] = []

  // Trigger references
  private triggerButton: Button | null = null
  private triggerWidth: number = DEFAULT_TRIGGER_WIDTH

  // Scene objects
  private generatedTriggerObject: SceneObject | null = null
  private triggerBgObject: SceneObject | null = null
  private bgObject: SceneObject
  private bgRect: RoundedRectangle
  private scrollWindowWrapper: SceneObject
  private scrollWindowObject: SceneObject
  private scrollWindow: ScrollWindow
  private scrollContentRoot: SceneObject
  private flexLayoutInitialized: boolean = false

  // Layout metrics (computed from onLayoutComplete)
  private layoutReady: boolean = false
  private bgFullHeight: number = 0
  private bgVisualHeight: number = 0
  private bgOriginY: number = 0
  private scrollOriginY: number = 0
  private windowHeight: number = 0
  private contentHeight: number = 0
  private fadeZone: number = 0
  private itemContentPositions: number[] = []
  private itemHeights: number[] = []
  private itemAlphaCache: number[] = []
  private pendingScrollAnchor: {item: DropdownItem; viewportY: number} | null = null

  // --- Pool mode state ---
  // Pool mode creates `maxVisibleItems * 2` recycled buttons and rebinds them
  // as the user scrolls (virtual scrolling via padding). Selection is tracked
  // by data index since pool buttons are reused across different items.
  private poolMode: boolean = false
  private poolButtons: Button[] = []
  private poolFlexItems: FlexItem[] = []
  private poolActiveCount: number = 0
  private dataItems: DropdownOption[] = []
  private poolVisibleStart: number = -1
  private poolItemStep: number = 0
  private poolTotalHeight: number = 0
  private poolVisibleCount: number = 0
  private pendingDataItems: DropdownOption[] | null = null
  private selectedIndices: Set<number> = new Set()
  private poolAlphaCache: number[] = []

  /** Cached Text and Image components per button SceneObject for fast alpha updates during scroll. */
  private fadeTargetCache: Map<SceneObject, {texts: Text[]; images: Image[]}> = new Map()
  private triggerContent: ElementContent | null = null
  private poolContents: ElementContent[] = []

  // Scroll-interaction deferral: prevents layout updates from conflicting
  // with the ScrollWindow's active drag tracking (same pattern as DeviceListPage).
  private userScrolling: boolean = false
  private scrollIdleCounter: number = 0
  private poolMetricsDirty: boolean = false
  private scrollVisibilityDirty: boolean = false

  public onAwake(): void {
    this._isExpanded = this._startExpanded
    this.createEvent("OnStartEvent").bind(() => {
      this.initialize()
    })
    this.createEvent("OnDestroyEvent").bind(() => this.destroy())
    // Re-apply collider clipping when dirty (scroll, expand, or ScrollWindow hover re-enabling colliders)
    this.createEvent("LateUpdateEvent").bind(() => {
      if (this.scrollVisibilityDirty && this._isExpanded && this.layoutReady) {
        this.scrollVisibilityDirty = false
        if (this.poolMode) {
          this.updatePoolFadeAlphas()
        } else {
          this.updateScrollVisibility()
        }
      }
    })
  }

  private initialize(): void {
    if (!this._hideTrigger) {
      if (this._customTrigger) {
        this.triggerButton = this._topButton ?? null
      } else {
        this.generateTriggerButton()
      }

      if (this.triggerButton) {
        this.triggerWidth = this.triggerButton.size.x
        this.unsubscribes.push(
          this.triggerButton.onTriggerUp.add(() => {
            if (this.getItemCount() === 0) {
              // Nothing to show — undo the SIK toggle so the button doesn't stay pressed
              this.triggerButton!.isOn = false
              return
            }
            this.toggle()
          })
        )
        this.unsubscribes.push(
          this.triggerButton.onSizeChanged.add((newSize: vec3) => {
            if (newSize.x !== this.triggerWidth) {
              this.triggerWidth = newSize.x
              this.updateDrawerWidth()
            }
          })
        )
      }

      // Swap chevron icon and toggle state on expand/collapse (default trigger only)
      if (this.triggerContent) {
        this.unsubscribes.push(
          this.onExpandedChanged.add((expanded: boolean) => {
            this.triggerContent!.trailingIcon = expanded ? CHEVRON_UP : CHEVRON_DOWN
            if (this.triggerButton) this.triggerButton.isOn = expanded
          })
        )
      }
    }

    this.createTriggerBackground()

    this.createDrawer()
    this.collectDropdownItems()
  }

  /**
   * Creates the trigger background SceneObject + RoundedRectangle when the
   * relevant flags allow it. No-op if any precondition is missing or if the
   * background already exists. Called from `initialize()` and from the
   * `hasTriggerBackground` setter when toggled true post-start.
   */
  private createTriggerBackground(): void {
    if (this.triggerBgObject && !isNull(this.triggerBgObject)) return
    if (this._hideTrigger || !this._hasTriggerBackground || !this._showTriggerBackground || !this.triggerButton) return
    this.triggerBgObject = global.scene.createSceneObject("DropdownTriggerBackground")
    this.triggerBgObject.setParent(this.sceneObject)
    const triggerBgRect = this.triggerBgObject.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    triggerBgRect.size = new vec2(
      this.triggerButton.size.x + this._triggerPadding.x * 2,
      this.triggerButton.size.y + this._triggerPadding.y * 2
    )
    triggerBgRect.cornerRadius = CORNER_RADIUS
    triggerBgRect.backgroundColor = TRIGGER_BACKGROUND_COLOR
    if (this._triggerRenderOrder !== 0) triggerBgRect.renderOrder = this._triggerRenderOrder
    this.triggerBgObject.getTransform().setLocalPosition(new vec3(0, 0, TRIGGER_BG_Z_OFFSET))
  }

  private generateTriggerButton(): void {
    const buttonObject = global.scene.createSceneObject("DropdownTriggerButton")
    buttonObject.setParent(this.sceneObject)

    // Create Button component and set SnapOS3 style before initialization.
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.setTheme("SnapOS3", this._topButtonStyle)

    // Set size — trigger always uses its own size; Override Width only affects the drawer
    ;(button as any)._size = new vec3(this._triggerButtonSize.x, this._triggerButtonSize.y, 1)

    // Use ElementContent for label display (text + chevron icon)
    // Scale chevron icon proportionally to text size
    const chevronSize = CHEVRON_BASE_SIZE * (this._triggerTextSize / CHEVRON_BASE_TEXT_SIZE)
    this.triggerContent = addContentToElement(buttonObject, {
      text: this._triggerLabel,
      contentAlignment: this._triggerContentAlignment,
      trailingIcon: this._isExpanded ? CHEVRON_UP : CHEVRON_DOWN,
      autoResize: this._triggerAutoResize,
      textSize: this._triggerTextSize
    })
    ;(this.triggerContent as any)._trailingIconSize = chevronSize
    this.triggerContent.paddingLeft = this._triggerContentPadding.x
    this.triggerContent.paddingRight = this._triggerContentPadding.x
    this.triggerContent.paddingTop = this._triggerContentPadding.y
    this.triggerContent.paddingBottom = this._triggerContentPadding.y

    button.setIsToggleable(true)
    button.initialize()
    button.isOn = this._isExpanded
    if (this._triggerRenderOrder !== 0) {
      button.renderOrder = this._triggerRenderOrder
      this.triggerContent.renderOrder = this._triggerRenderOrder
    }

    this.triggerButton = button
    this.generatedTriggerObject = buttonObject
  }

  /** Scans direct children for DropdownItem markers and auto-appends them sorted by order. */
  private collectDropdownItems(): void {
    const found: {order: number; item: DropdownItem}[] = []
    const childCount = this.sceneObject.getChildrenCount()
    for (let i = 0; i < childCount; i++) {
      const child = this.sceneObject.getChild(i)
      const item = child.getComponent(DropdownItem.getTypeName()) as DropdownItem
      if (item) {
        found.push({order: item.order, item})
      }
    }
    found.sort((a, b) => a.order - b.order)
    for (const entry of found) {
      entry.item.sceneObject.getTransform().setLocalPosition(vec3.zero())
      entry.item.sceneObject.getTransform().setLocalScale(vec3.one())
      this.appendItem(entry.item)
    }
  }

  private createDrawer(): void {
    const drawerWidth = this.effectiveWidth - (this._hasTriggerBackground ? 0 : this._dropdownPadding.x) // If no background, shrink width to hide overflow outside trigger bounds

    // Background (starts disabled — collapsed)
    this.bgObject = global.scene.createSceneObject("DropdownBackground")
    this.bgObject.setParent(this.sceneObject)
    this.bgRect = this.bgObject.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    this.bgRect.size = new vec2(drawerWidth, 0)
    this.bgRect.cornerRadius = CORNER_RADIUS
    this.bgRect.backgroundColor = BACKGROUND_COLOR
    this.bgRect.renderOrder = this._drawerRenderOrder
    this.bgObject.enabled = false

    // ScrollWindow wrapper (for enable/disable during animation)
    // Starts enabled so ScrollWindow and FlexLayout can initialize;
    // collapsed state is set after FlexLayout.onInitialized fires
    this.scrollWindowWrapper = global.scene.createSceneObject("DropdownScrollWrapper")
    this.scrollWindowWrapper.setParent(this.sceneObject)

    // ScrollWindow
    this.scrollWindowObject = global.scene.createSceneObject("DropdownScroll")
    this.scrollWindowObject.setParent(this.scrollWindowWrapper)
    this.scrollWindow = this.scrollWindowObject.createComponent(ScrollWindow.getTypeName()) as ScrollWindow
    this.scrollWindow.vertical = true
    this.scrollWindow.horizontal = false

    // ScrollWindow content root — ScrollWindow manages this object's position for scrolling.
    // layoutObject is a child we translate independently for pool-mode virtual positioning.
    this.scrollContentRoot = global.scene.createSceneObject("DropdownScrollContent")
    this.scrollWindow.addObject(this.scrollContentRoot)

    this.createFlexContainer(this.scrollContentRoot, {
      direction: FlexDirection.Column,
      alignItems: FlexAlign.Stretch,
      width: drawerWidth,
      height: -1,
      rowGap: this._itemSpacing,
      paddingLeft: this._dropdownPadding.x,
      paddingRight: this._dropdownPadding.x,
      autoDiscoverItems: true
    })

    this.flexLayout.onInitialized.add(() => {
      this.flexLayoutInitialized = true
      if (this.pendingDataItems !== null) {
        const pending = this.pendingDataItems
        this.pendingDataItems = null
        this.dataItems = pending
        this.applyPoolData()
      } else if (this.pendingItems.length > 0) {
        const pending = this.pendingItems
        this.pendingItems = []
        for (const pendingItem of pending) {
          this.addItemInternal(pendingItem)
        }
      } else {
        // No items at all — disable scroll wrapper to prevent its interactable
        // from overlapping the trigger button and causing hover flicker
        this.scrollWindowWrapper.enabled = false
      }
    })

    // Subscribe to scroll position for fade / pool rebalance
    this.unsubscribes.push(
      this.scrollWindow.onScrollPositionUpdated.add(() => {
        if (this.poolMode) {
          this.rebalancePool()
        }
        this.scrollVisibilityDirty = true
      })
    )

    // Track active scroll drag to defer pool mutations (prevents jumps)
    this.unsubscribes.push(
      this.scrollWindow.onScrollDrag.add(() => {
        this.userScrolling = true
        this.scheduleScrollIdle()
      })
    )
  }

  private scheduleScrollIdle(): void {
    this.scrollIdleCounter++
    const myCounter = this.scrollIdleCounter
    setTimeout(() => {
      if (myCounter === this.scrollIdleCounter) {
        this.scrollIdleCounter = 0
        this.userScrolling = false
        if (this.poolMetricsDirty) {
          this.poolMetricsDirty = false
          this.updatePoolMetrics()
        }
      }
    }, 500)
  }

  private updateDrawerWidth(): void {
    const drawerWidth = this.effectiveWidth - (this._hasTriggerBackground ? 0 : this._dropdownPadding.x)
    this.bgRect.size = new vec2(drawerWidth, this.bgRect.size.y)
    this.flexLayout.width = drawerWidth
    this.scrollWindow.windowSize = new vec2(this.effectiveWidth, this.scrollWindow.windowSize.y)
    this.scrollWindow.scrollDimensions = new vec2(this.effectiveWidth, this.scrollWindow.scrollDimensions.y)
    if (this.triggerBgObject && this.triggerButton) {
      const triggerBgRect = this.triggerBgObject.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
      if (triggerBgRect) {
        triggerBgRect.size = new vec2(
          this.triggerButton.size.x + this._triggerPadding.x * 2,
          this.triggerButton.size.y + this._triggerPadding.y * 2
        )
      }
    }
  }

  /**
   * Recalculates background and scroll wrapper positions from current metrics.
   * Called after properties like expandUp, dropdownPadding, or maxVisibleItems change at runtime.
   */
  private recalculateDrawerLayout(): void {
    this.bgFullHeight = this.windowHeight + this._dropdownPadding.y * 2

    const overlap = this.triggerOverlap
    this.scrollOriginY = this.dirSign * (overlap + this.triggerDropdownGap + this.bgFullHeight / 2)
    this.scrollWindowWrapper.getTransform().setLocalPosition(new vec3(0, this.scrollOriginY, 0))

    this.bgVisualHeight = overlap + this.triggerDropdownGap + this.bgFullHeight + this._drawerBackgroundExtension
    this.bgOriginY = this.dirSign * (this.bgVisualHeight / 2)
    this.bgObject.getTransform().setLocalPosition(new vec3(0, this.bgOriginY, BACKGROUND_Z_OFFSET))

    if (this._isExpanded) {
      this.bgRect.size = new vec2(this.bgRect.size.x, this.bgVisualHeight)
    }
  }

  protected onFlexLayoutComplete(result: FlexLayoutResult): void {
    if (this.poolMode) return // Pool mode manages its own layout metrics
    if (result.items.length === 0) {
      // No items — hide the drawer background and scroll content
      this.bgObject.enabled = false
      this.scrollWindowWrapper.enabled = false
      if (this._isExpanded) this.collapse()
      return
    }

    const n = Math.min(this._maxVisibleItems, result.items.length)
    const lastVisible = result.items[n - 1]
    this.windowHeight = lastVisible.y + lastVisible.height - result.items[0].y
    this.contentHeight = result.containerHeight

    // Compute background dimensions
    this.bgFullHeight = this.windowHeight + this._dropdownPadding.y * 2

    const overlap = this.triggerOverlap

    // Scroll window: below trigger (down) or above trigger (up)
    this.scrollOriginY = this.dirSign * (overlap + this.triggerDropdownGap + this.bgFullHeight / 2)
    this.scrollWindowWrapper.getTransform().setLocalPosition(new vec3(0, this.scrollOriginY, 0))
    this.scrollWindowObject.getTransform().setLocalPosition(new vec3(0, 0, 0))

    // Background: extends from trigger center in the expand direction (or from origin when hidden)
    this.bgVisualHeight = overlap + this.triggerDropdownGap + this.bgFullHeight + this._drawerBackgroundExtension
    this.bgOriginY = this.dirSign * (this.bgVisualHeight / 2)
    this.bgObject.getTransform().setLocalPosition(new vec3(0, this.bgOriginY, BACKGROUND_Z_OFFSET))

    // Update scroll window dimensions
    this.scrollWindow.windowSize = new vec2(this.effectiveWidth, this.windowHeight)
    this.scrollWindow.scrollDimensions = new vec2(this.effectiveWidth, this.contentHeight)

    // Disable scrolling when all items fit within the visible window
    const scrollable = result.items.length > this._maxVisibleItems
    this.scrollWindow.vertical = scrollable
    this.scrollWindow.horizontal = false

    // Compute item center positions and heights in centered content coords for scroll fade (reuse arrays)
    const itemCount = result.items.length
    if (this.itemContentPositions.length !== itemCount) {
      this.itemContentPositions.length = itemCount
      this.itemHeights.length = itemCount
    }
    for (let i = 0; i < itemCount; i++) {
      this.itemContentPositions[i] = this.contentHeight / 2 - (result.items[i].y + result.items[i].height / 2)
      this.itemHeights[i] = result.items[i].height
    }

    // Compute fade zone from average item height
    const avgItemHeight = this.contentHeight / result.items.length
    this.fadeZone = avgItemHeight * FADE_ZONE_FACTOR

    if (!this.layoutReady) {
      // First layout — scroll to top and set initial expand/collapse state
      this.layoutReady = true
      const topEdge = Math.max(0, (this.contentHeight - this.windowHeight) / 2)
      this.scrollWindow.scrollPosition = new vec2(0, -topEdge)
      if (this._isExpanded) {
        // Fire event so parent containers (e.g. ElementGroup) can sync in parallel with the drawer animation.
        this.onExpandedChangedEvent.invoke(true)
        this.animateDrawer(true)
      } else {
        this.scrollWindowWrapper.enabled = false
      }
    } else {
      // Subsequent layout (items added/removed) — restore scroll anchor and update background
      const maxScroll = Math.max(0, (this.contentHeight - this.windowHeight) / 2)
      if (this.pendingScrollAnchor) {
        const anchor = this.pendingScrollAnchor
        this.pendingScrollAnchor = null
        const newIndex = this.items.indexOf(anchor.item)
        if (newIndex >= 0 && newIndex < this.itemContentPositions.length) {
          const newContentY = this.itemContentPositions[newIndex]
          const newScrollY = anchor.viewportY - newContentY
          this.scrollWindow.scrollPosition = new vec2(0, Math.max(-maxScroll, Math.min(maxScroll, newScrollY)))
        }
      } else {
        // No anchor — just clamp scroll if content shrunk past current position
        const currentY = this.scrollWindow.scrollPosition.y
        if (Math.abs(currentY) > maxScroll) {
          this.scrollWindow.scrollPosition = new vec2(0, Math.max(-maxScroll, Math.min(maxScroll, currentY)))
        }
      }
      if (this._isExpanded) {
        this.bgObject.enabled = true
        this.scrollWindowWrapper.enabled = true
        this.bgRect.size = new vec2(this.bgRect.size.x, this.bgVisualHeight)
      } else {
        this.scrollWindowWrapper.enabled = false
      }
      this.scrollVisibilityDirty = true
    }
  }

  // --- Toggle Group Management ---

  /**
   * Set an external ToggleGroup to delegate selection management.
   * When set, the Dropdown auto-registers/deregisters item buttons.
   * Takes priority over selectionMode.
   */
  public set toggleGroup(tg: ToggleGroup | null) {
    // External toggle group is not supported in pool mode — use selectionMode instead
    if (this.poolMode) return

    // Deregister all items from old toggle group
    if (this._externalToggleGroup) {
      for (const item of this.items) {
        const toggleable = item.toggleable
        if (toggleable) this._externalToggleGroup.deregisterToggleable(toggleable)
      }
      if (this.externalToggleGroupUnsub) {
        this.externalToggleGroupUnsub()
        this.externalToggleGroupUnsub = null
      }
    }

    this._externalToggleGroup = tg

    // Register all existing items with new toggle group
    if (tg) {
      for (const item of this.items) {
        const toggleable = item.toggleable
        if (!toggleable) continue
        if (toggleable.setIsToggleable) toggleable.setIsToggleable(true)
        toggleable.initialize()
        tg.registerToggleable(toggleable)
      }
      // Bridge onToggleSelected → onSelectionChanged
      this.externalToggleGroupUnsub = tg.onToggleSelected.add(() => {
        this.selectedSet.clear()
        for (const item of this.items) {
          if (item.toggleable && item.toggleable.isOn) {
            this.selectedSet.add(item)
          }
        }
        this.onSelectionChangedEvent.invoke(this.getSelectedItems())
      })
    }
  }

  public get toggleGroup(): ToggleGroup | null {
    return this._externalToggleGroup
  }

  private get hasSelectionManagement(): boolean {
    return this._externalToggleGroup !== null || this._selectionMode !== "none"
  }

  private get usesInternalSelection(): boolean {
    return this._externalToggleGroup === null && this._selectionMode !== "none"
  }

  private handleToggleFinished(item: DropdownItem): void {
    if (this._selectionMode === "none") return
    const toggleable = item.toggleable
    if (!toggleable) return

    if (toggleable.isOn) {
      if (this._selectionMode === "single") {
        for (const selected of this.selectedSet) {
          if (selected !== item && selected.toggleable) {
            selected.toggleable.isOn = false
          }
        }
        this.selectedSet.clear()
      }
      this.selectedSet.add(item)
    } else {
      if (!this._allowEmptySelection && this.selectedSet.size <= 1 && this.selectedSet.has(item)) {
        toggleable.isOn = true
        return
      }
      this.selectedSet.delete(item)
    }

    this.onSelectionChangedEvent.invoke(this.getSelectedItems())
  }

  /**
   * Returns the currently selected DropdownItems (unpool mode only).
   *
   * **Pool mode:** Always returns an empty array — use `getSelectedIndices()` instead.
   */
  public getSelectedItems(): DropdownItem[] {
    if (this.poolMode) return []
    return Array.from(this.selectedSet)
  }

  public selectItem(item: DropdownItem): void {
    if (!this.hasSelectionManagement) return
    if (this.items.indexOf(item) < 0) return
    const toggleable = item.toggleable
    if (!toggleable || toggleable.isOn) return
    toggleable.toggle(true)
  }

  public deselectItem(item: DropdownItem): void {
    if (!this.hasSelectionManagement) return
    if (this.items.indexOf(item) < 0) return
    const toggleable = item.toggleable
    if (!toggleable || !toggleable.isOn) return
    toggleable.toggle(false)
  }

  public clearSelection(): void {
    if (!this.hasSelectionManagement) return
    if (!this._allowEmptySelection) return

    if (this.poolMode) {
      for (let i = 0; i < this.poolButtons.length; i++) {
        const dataIdx = this.poolVisibleStart + i
        if (this.selectedIndices.has(dataIdx)) {
          this.poolButtons[i].isOn = false
        }
      }
      this.selectedIndices.clear()
    } else {
      for (const selected of this.selectedSet) {
        if (selected.toggleable) selected.toggleable.isOn = false
      }
      this.selectedSet.clear()
    }

    this.onSelectionChangedEvent.invoke([])
  }

  // --- Item Management ---

  /**
   * Saves a scroll anchor before a mutation so onLayoutUpdated can restore
   * the visible items to their current visual position after layout recalculates.
   */
  private saveScrollAnchor(excludeIndex: number = -1): void {
    if (!this.layoutReady || this.items.length === 0 || this.itemContentPositions.length === 0) return
    const scrollY = this.scrollWindow.scrollPosition.y
    for (let i = 0; i < this.items.length; i++) {
      if (i === excludeIndex) continue
      const contentY = this.itemContentPositions[i]
      if (contentY === undefined) continue
      const viewportY = contentY + scrollY
      if (viewportY >= -this.windowHeight / 2 && viewportY <= this.windowHeight / 2) {
        this.pendingScrollAnchor = {item: this.items[i], viewportY}
        return
      }
    }
  }

  /** Replace all items with the given DropdownItems. Switches to unpool mode if needed. */
  public setItems(items: DropdownItem[]): void {
    // A queued setItems() supersedes any pre-init setData() call.
    this.pendingDataItems = null

    // Clear pool state if switching from pool mode
    if (this.poolMode) {
      // Remove pool FlexItems from layout and destroy pool button SceneObjects
      if (this.poolFlexItems.length > 0) this.flexLayout.removeItems(this.poolFlexItems.slice(0, this.poolActiveCount))
      for (const unsub of this.poolUnsubscribes) unsub()
      this.poolUnsubscribes = []
      for (const btn of this.poolButtons) btn.sceneObject.destroy()
      this.poolButtons = []
      this.poolFlexItems = []
      this.poolContents = []
      this.poolActiveCount = 0
      this.poolAlphaCache = []
      this.dataItems = []
      this.selectedIndices.clear()
      this.poolMode = false
      this.layoutObject.getTransform().setLocalPosition(vec3.zero())
      this.flexLayout.height = -1 // Restore auto height for unpool mode
    }
    // Intentionally replaces any queued pending items — a second setItems() before
    // FlexLayout init semantically supersedes the first batch.
    this.pendingItems = []
    this.clearAllItems()
    for (const item of items) {
      if (!this.flexLayoutInitialized) {
        this.pendingItems.push(item)
      } else {
        this.addItemInternal(item)
      }
    }
  }

  /** Append a single DropdownItem to the end. */
  public appendItem(item: DropdownItem): void {
    this.saveScrollAnchor()
    if (!this.flexLayoutInitialized) {
      this.pendingItems.push(item)
    } else {
      this.addItemInternal(item)
    }
  }

  /** Insert a DropdownItem at the given index. */
  public insertItem(item: DropdownItem, index: number): void {
    this.saveScrollAnchor()
    if (!this.flexLayoutInitialized) {
      const clamped = Math.max(0, Math.min(this.pendingItems.length, index))
      this.pendingItems.splice(clamped, 0, item)
    } else {
      const clamped = Math.max(0, Math.min(this.items.length, index))
      this.insertItemInternal(item, clamped)
    }
  }

  /** Remove the item at the given index. The item's SceneObject is destroyed. */
  public removeItemAt(index: number): void {
    if (!this.flexLayoutInitialized) {
      if (index < 0 || index >= this.pendingItems.length) return
      this.pendingItems.splice(index, 1)
      return
    }
    if (index < 0 || index >= this.items.length) return
    this.saveScrollAnchor(index)
    this.removeItemAtInternal(index)
  }

  public getItemCount(): number {
    if (this.poolMode) return this.dataItems.length
    return this.flexLayoutInitialized ? this.items.length : this.pendingItems.length
  }

  private addItemInternal(item: DropdownItem): void {
    const obj = item.sceneObject
    obj.setParent(this.layoutObject)
    // DropdownItem extends FlexItem, so it IS the layout item — no need to
    // synthesize a sibling plain FlexItem (that double-componented the SO
    // pre-refactor and now collides with auto-discovery).
    if (item.stretchToFill) {
      item.overrideWidth = item.width
      item.overrideHeight = item.height
    } else {
      this.applyNonStretchLayout(item, item)
    }
    this.flexLayout.addItems([item])
    this.items.push(item)
    if (this._drawerRenderOrder !== 0 && item.element) item.element.renderOrder = this._drawerRenderOrder
    this.wireItemEvents(item)
    this.ensureLayoutCanProcess()
  }

  /**
   * When the dropdown is collapsed, scrollWindowWrapper is disabled, which prevents
   * FlexLayout's LateUpdateEvent from firing on the disabled subtree. Re-enable it
   * so the layout pass can run asynchronously. onFlexLayoutComplete will disable it
   * again once metrics are computed (if still collapsed).
   */
  private ensureLayoutCanProcess(): void {
    if (this.scrollWindowWrapper && !this.scrollWindowWrapper.enabled) {
      this.scrollWindowWrapper.enabled = true
    }
  }

  private insertItemInternal(item: DropdownItem, index: number): void {
    const obj = item.sceneObject
    obj.setParent(this.layoutObject)
    // DropdownItem IS the layout item — no synthetic FlexItem needed.
    if (item.stretchToFill) {
      item.overrideWidth = item.width
      item.overrideHeight = item.height
    } else {
      this.applyNonStretchLayout(item, item)
    }

    // FlexLayout has no insertItems API — remove all, splice, re-add in order (O(n))
    this.flexLayout.removeItems(this.items)

    this.items.splice(index, 0, item)
    if (this._drawerRenderOrder !== 0 && item.element) item.element.renderOrder = this._drawerRenderOrder
    this.wireItemEvents(item, index)

    this.flexLayout.addItems(this.items)
    this.ensureLayoutCanProcess()
  }

  private wireItemEvents(item: DropdownItem, insertIndex?: number): void {
    // Tap event — skip for items without interaction (decorative separators, etc.)
    let unsub: () => void = () => {}
    const triggerUp = item.onTriggerUp
    if (triggerUp) {
      unsub = triggerUp.add(() => {
        const index = this.items.indexOf(item)
        this.onItemTappedEvent.invoke({index, item})
        if (this._collapseOnSelect) this.collapse()
      })
    }

    // Toggle management
    let toggleUnsub: () => void = () => {}
    const toggleable = item.toggleable
    if (toggleable) {
      if (this._externalToggleGroup) {
        if (toggleable.setIsToggleable) toggleable.setIsToggleable(true)
        toggleable.initialize()
        this._externalToggleGroup.registerToggleable(toggleable)
      } else if (this._selectionMode !== "none") {
        if (toggleable.setIsToggleable) toggleable.setIsToggleable(true)
        toggleable.initialize()
        toggleUnsub = toggleable.onFinished.add((explicit: boolean) => {
          if (!explicit) return
          this.handleToggleFinished(item)
        })
      }
    }

    if (insertIndex !== undefined) {
      this.itemUnsubscribes.splice(insertIndex, 0, unsub)
      this.toggleUnsubscribes.splice(insertIndex, 0, toggleUnsub)
      this.itemAlphaCache.splice(insertIndex, 0, 1.0)
    } else {
      this.itemUnsubscribes.push(unsub)
      this.toggleUnsubscribes.push(toggleUnsub)
      this.itemAlphaCache.push(1.0)
    }
  }

  private removeItemAtInternal(index: number): void {
    const item = this.items[index]

    // Unsubscribe selection listener
    this.itemUnsubscribes[index]()
    this.itemUnsubscribes.splice(index, 1)

    // Toggle cleanup
    this.toggleUnsubscribes[index]()
    this.toggleUnsubscribes.splice(index, 1)
    this.itemAlphaCache.splice(index, 1)

    if (this._externalToggleGroup && item.toggleable) {
      this._externalToggleGroup.deregisterToggleable(item.toggleable)
    }

    const wasSelected = this.selectedSet.has(item)
    this.selectedSet.delete(item)

    // Determine fallback before splicing (indices are still valid).
    // Mixed-content dropdowns may contain non-toggleable items (separators, labels),
    // so find the first toggleable item rather than trusting index 0/1.
    let fallbackItem: DropdownItem | null = null
    if (
      wasSelected &&
      this.usesInternalSelection &&
      !this._allowEmptySelection &&
      this.selectedSet.size === 0 &&
      this.items.length > 1
    ) {
      fallbackItem = this.items.find((item, idx) => idx !== index && item.toggleable) ?? null
    }

    // Splice before firing event so listeners see consistent item count
    this.items.splice(index, 1)

    if (fallbackItem && fallbackItem.toggleable) {
      fallbackItem.toggleable.isOn = true
      this.selectedSet.add(fallbackItem)
    }

    if (wasSelected && this.hasSelectionManagement) {
      this.onSelectionChangedEvent.invoke(this.getSelectedItems())
    }

    this.fadeTargetCache.delete(item.sceneObject)

    // DropdownItem IS the FlexItem — remove from layout then destroy the SO
    // (which cleans up the DropdownItem along with everything else).
    this.flexLayout.removeItems([item])
    item.sceneObject.destroy()
  }

  private clearAllItems(): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.removeItemAtInternal(i)
    }
  }

  // --- Pool Mode ---

  /**
   * Replace all items with the given data (pool mode). The Dropdown manages
   * buttons internally via virtual scrolling. Switches from unpool mode if needed.
   * Use `appendData()`, `insertData()`, `removeDataAt()` for incremental updates.
   */
  public setData(items: DropdownOption[]): void {
    // A queued setData() supersedes any pre-init setItems() call.
    this.pendingItems = []

    // Clear unpool state if switching modes
    if (!this.poolMode && this.items.length > 0) {
      this.clearAllItems()
    }

    this.poolMode = true
    this.dataItems = items
    this.selectedIndices.clear()

    if (!this.flexLayoutInitialized) {
      this.pendingDataItems = items
      return
    }

    this.applyPoolData()
  }

  /** Append a single data item to the end (pool mode). Preserves scroll position. */
  public appendData(item: DropdownOption): void {
    if (!this.poolMode) return
    this.dataItems.push(item)
    if (!this.flexLayoutInitialized) return
    this.updatePoolMetrics()
  }

  /** Insert a data item at the given index (pool mode). Preserves scroll position. */
  public insertData(item: DropdownOption, index: number): void {
    if (!this.poolMode) return
    const clamped = Math.max(0, Math.min(this.dataItems.length, index))
    this.dataItems.splice(clamped, 0, item)

    // Shift selected indices at or above the inserted index
    const updated = new Set<number>()
    for (const idx of this.selectedIndices) {
      updated.add(idx >= clamped ? idx + 1 : idx)
    }
    this.selectedIndices = updated

    if (!this.flexLayoutInitialized) return
    this.updatePoolMetrics()
  }

  /** Remove the data item at the given index (pool mode). Preserves scroll position. */
  public removeDataAt(index: number): void {
    if (!this.poolMode) return
    if (index < 0 || index >= this.dataItems.length) return
    this.dataItems.splice(index, 1)

    // Shift selected indices above the removed index
    const updated = new Set<number>()
    for (const idx of this.selectedIndices) {
      if (idx === index) continue
      updated.add(idx > index ? idx - 1 : idx)
    }
    if (
      this._selectionMode !== "none" &&
      !this._allowEmptySelection &&
      updated.size === 0 &&
      this.dataItems.length > 0
    ) {
      updated.add(Math.min(index, this.dataItems.length - 1))
    }

    const prevSelected = this.selectedIndices
    let selectionChanged = prevSelected.size !== updated.size
    if (!selectionChanged) {
      for (const idx of prevSelected) {
        if (!updated.has(idx)) {
          selectionChanged = true
          break
        }
      }
    }
    this.selectedIndices = updated

    if (!this.flexLayoutInitialized) {
      if (selectionChanged) {
        this.onSelectionChangedEvent.invoke(this.getSelectedItems())
      }
      return
    }
    this.updatePoolMetrics()
    if (selectionChanged) {
      this.onSelectionChangedEvent.invoke(this.getSelectedItems())
    }
  }

  /** Initializes layout metrics for pool mode (equivalent of onLayoutUpdated for unpool). */
  private applyPoolData(): void {
    // Create pool on first call
    if (this.poolButtons.length === 0) {
      this.createPool()
    }

    this.poolItemStep = this._optionHeight + this._itemSpacing

    // Compute layout metrics for background/scroll positioning
    this.updateDrawerGeometry()
    this.contentHeight = this.poolTotalHeight

    // Compute fade zone
    this.fadeZone = this._optionHeight * FADE_ZONE_FACTOR

    const isFirstLayout = !this.layoutReady
    if (!this.layoutReady) {
      this.layoutReady = true
      if (this._isExpanded && this.dataItems.length > 0) {
        // Fire event so parent containers (e.g. ElementGroup) can sync in parallel with the drawer animation.
        this.onExpandedChangedEvent.invoke(true)
        this.animateDrawer(true)
      } else {
        this.scrollWindowWrapper.enabled = false
      }
    } else if (this._isExpanded) {
      this.bgRect.size = new vec2(this.bgRect.size.x, this.bgVisualHeight)
    }

    // On first layout, pre-set poolTotalHeight and scroll position so that
    // updatePoolMetrics sees zero height delta and rebalances with the
    // correct scroll position in a single pass.
    if (isFirstLayout) {
      this.poolTotalHeight =
        this.dataItems.length > 0 ? this.dataItems.length * this.poolItemStep - this._itemSpacing : 0
      const topEdge = Math.max(0, (this.poolTotalHeight - this.windowHeight) / 2)
      this.scrollWindow.scrollPosition = new vec2(0, -topEdge)
    }
    this.updatePoolMetrics()
  }

  /**
   * Recomputes drawer/window geometry from the current visible item count.
   * Updates windowHeight, bgFullHeight, bgVisualHeight, bgOriginY, scrollOriginY,
   * and scrollWindow.windowSize. Does NOT touch bgRect.size — callers handle that
   * based on expand/animation state.
   */
  private updateDrawerGeometry(): void {
    const visibleCount = Math.min(this._maxVisibleItems, this.dataItems.length)
    this.poolVisibleCount = visibleCount
    this.windowHeight = visibleCount > 0 ? visibleCount * this.poolItemStep - this._itemSpacing : 0

    this.bgFullHeight = this.windowHeight + this._dropdownPadding.y * 2

    const overlap = this.triggerOverlap
    this.scrollOriginY = this.dirSign * (overlap + this.triggerDropdownGap + this.bgFullHeight / 2)
    this.scrollWindowWrapper.getTransform().setLocalPosition(new vec3(0, this.scrollOriginY, 0))

    this.bgVisualHeight = overlap + this.triggerDropdownGap + this.bgFullHeight + this._drawerBackgroundExtension
    this.bgOriginY = this.dirSign * (this.bgVisualHeight / 2)
    this.bgObject.getTransform().setLocalPosition(new vec3(0, this.bgOriginY, BACKGROUND_Z_OFFSET))

    this.scrollWindow.windowSize = new vec2(this.effectiveWidth, this.windowHeight)
  }

  /** Recalculates pool scroll dimensions after a data mutation. Preserves scroll position. */
  private updatePoolMetrics(): void {
    // Defer the entire layout update during active scroll drag.
    // Changing scrollDimensions shifts the coordinate system, which conflicts
    // with hand-tracked scrolling and causes jumps.
    // Full update is flushed by scheduleScrollIdle() on release.
    if (this.userScrolling) {
      this.poolMetricsDirty = true
      return
    }

    const oldHeight = this.poolTotalHeight
    this.poolTotalHeight = this.dataItems.length > 0 ? this.dataItems.length * this.poolItemStep - this._itemSpacing : 0

    // Auto-collapse when all data items are removed
    const visibleCount = Math.min(this._maxVisibleItems, this.dataItems.length)
    if (this.dataItems.length === 0 && this._isExpanded) {
      this.collapse()
    }
    // Recompute drawer geometry when the effective visible count changes
    if (visibleCount !== this.poolVisibleCount) {
      this.updateDrawerGeometry()
      if (this._isExpanded) {
        this.bgRect.size = new vec2(this.bgRect.size.x, this.bgVisualHeight)
      }
    }
    this.contentHeight = this.poolTotalHeight

    this.scrollWindow.scrollDimensions = new vec2(this.effectiveWidth, this.poolTotalHeight)
    this.scrollWindow.vertical = this.dataItems.length > this._maxVisibleItems
    this.scrollWindow.horizontal = false

    // Compensate scroll position for the content center shift.
    // Content is centered at origin, so growing by delta shifts the center by delta/2.
    // Adjust scrollY to keep the viewport anchored to the same items.
    const heightDelta = this.poolTotalHeight - oldHeight
    const adjustedY = this.scrollWindow.scrollPosition.y - heightDelta / 2
    const maxScroll = Math.max(0, (this.poolTotalHeight - this.windowHeight) / 2)
    this.scrollWindow.scrollPosition = new vec2(0, Math.max(-maxScroll, Math.min(maxScroll, adjustedY)))

    // Prune stale selected indices
    for (const idx of this.selectedIndices) {
      if (idx >= this.dataItems.length) this.selectedIndices.delete(idx)
    }

    // Force full rebalance to recompute the parent offset for the new poolTotalHeight.
    this.poolVisibleStart = -1
    this.rebalancePool()
    this.scrollVisibilityDirty = true
  }

  /** Creates the fixed-size button pool. Called once on first setData(). */
  private createPool(): void {
    const poolSize = this._maxVisibleItems * 2
    const contentWidth = this.flexLayout.width - this.flexLayout.paddingLeft - this.flexLayout.paddingRight

    const flexItems: FlexItem[] = []

    for (let i = 0; i < poolSize; i++) {
      const btnObject = global.scene.createSceneObject(`PoolBtn_${i}`)
      btnObject.setParent(this.layoutObject)

      const button = btnObject.createComponent(Button.getTypeName()) as Button
      button.setTheme("SnapOS3", this._optionStyle)
      ;(button as any)._size = new vec3(contentWidth, this._optionHeight, 1)

      // Use ElementContent for label display — default to trigger text size if not overridden
      const content = addContentToElement(btnObject, {
        text: "",
        contentAlignment: "left",
        textSize: this._optionTextSize > 0 ? this._optionTextSize : this._triggerTextSize
      })

      const flexItem = btnObject.createComponent(FlexItem.getTypeName()) as FlexItem
      flexItem.overrideWidth = contentWidth
      flexItem.overrideHeight = this._optionHeight
      flexItems.push(flexItem)

      // Wire tap event — pool button index i maps to data[poolVisibleStart + i]
      const poolIndex = i

      if (this._selectionMode !== "none") {
        button.setIsToggleable(true)
      }

      // Initialize once, after all configuration (theme, style, size, toggleable)
      button.initialize()
      if (this._drawerRenderOrder !== 0) {
        button.renderOrder = this._drawerRenderOrder
        content.renderOrder = this._drawerRenderOrder
      }

      this.poolUnsubscribes.push(
        button.onTriggerUp.add(() => {
          const dataIdx = this.poolVisibleStart + poolIndex
          if (dataIdx >= 0 && dataIdx < this.dataItems.length) {
            this.onItemTappedEvent.invoke({index: dataIdx, item: null})
            if (this._collapseOnSelect) this.collapse()
          }
        })
      )

      if (this._selectionMode !== "none") {
        this.poolUnsubscribes.push(
          button.onFinished.add((explicit: boolean) => {
            if (!explicit) return
            const dataIdx = this.poolVisibleStart + poolIndex
            if (dataIdx >= 0) this.handlePoolToggleFinished(button, dataIdx)
          })
        )
      }
      this.poolButtons.push(button)
      this.poolFlexItems.push(flexItem)
      this.poolAlphaCache.push(-1)
      this.poolContents.push(content)
    }

    // Add all pool buttons to FlexLayout — active set is managed by rebalancePool
    this.flexLayout.addItems(flexItems)
    this.poolActiveCount = poolSize
  }

  /**
   * Rebalances pool buttons on scroll: computes which data slice the pool
   * represents, translates layoutObject to position them, and rebinds labels/selection.
   *
   * Instead of changing FlexLayout padding (which invalidates engine memoization every tick),
   * we translate the layoutObject within scrollContentRoot. This keeps FlexLayout inputs
   * stable so the engine is skipped entirely during scroll.
   */
  private rebalancePool(): void {
    if (this.dataItems.length === 0) {
      if (this.poolActiveCount > 0) {
        this.flexLayout.removeItems(this.poolFlexItems.slice(0, this.poolActiveCount))
        for (let i = 0; i < this.poolActiveCount; i++) this.poolButtons[i].sceneObject.enabled = false
        this.poolActiveCount = 0
      }
      this.layoutObject.getTransform().setLocalPosition(vec3.zero())
      // Hide drawer when empty
      if (this.layoutReady) {
        this.bgObject.enabled = false
        this.scrollWindowWrapper.enabled = false
      }
      return
    }

    // Re-show drawer if it was hidden due to empty data
    if (this.layoutReady && this._isExpanded && !this.bgObject.enabled) {
      this.bgObject.enabled = true
      this.scrollWindowWrapper.enabled = true
    }

    const N = this.dataItems.length
    const poolSize = this.poolButtons.length

    const scrollY = this.scrollWindow.scrollPosition.y
    const contentTopY = this.poolTotalHeight / 2
    const viewportTop = this.windowHeight / 2 - scrollY

    // Compute startIdx: first data index the pool should represent
    let startIdx = Math.floor((contentTopY - viewportTop) / this.poolItemStep)
    startIdx = Math.max(0, Math.min(N - poolSize, startIdx))
    if (N <= poolSize) startIdx = 0

    if (startIdx === this.poolVisibleStart && this.poolVisibleStart !== -1) {
      // Pool window didn't shift — fade/collider update deferred to LateUpdate via dirty flag.
      return
    }
    const prevStart = this.poolVisibleStart
    this.poolVisibleStart = startIdx

    // Invalidate alpha cache — buttons are rebound to new data indices
    for (let i = 0; i < this.poolAlphaCache.length; i++) this.poolAlphaCache[i] = -1

    const activeCount = Math.min(poolSize, N)

    // Adjust the active FlexItem set when the number of used buttons changes
    if (activeCount !== this.poolActiveCount) {
      if (activeCount < this.poolActiveCount) {
        this.flexLayout.removeItems(this.poolFlexItems.slice(activeCount, this.poolActiveCount))
      } else {
        this.flexLayout.addItems(this.poolFlexItems.slice(this.poolActiveCount, activeCount))
      }
      for (let i = activeCount; i < poolSize; i++) this.poolButtons[i].sceneObject.enabled = false
      for (let i = 0; i < activeCount; i++) this.poolButtons[i].sceneObject.enabled = true
      this.poolActiveCount = activeCount
      // activeCount changed — layout inputs changed, run one layout pass
      this.flexLayout.forceLayout()
    }

    // Translate layoutObject to position the active button block at the correct
    // virtual position within the scroll content space.
    // Content is centered at Y=0. The active block should have its top edge at
    // virtual position (startIdx * poolItemStep) from content top.
    const activeHeight = activeCount * this.poolItemStep - this._itemSpacing
    const offsetY = (this.poolTotalHeight - activeHeight) / 2 - startIdx * this.poolItemStep
    this.layoutObject.getTransform().setLocalPosition(new vec3(0, offsetY, 0))

    // Unbind previous data from pool buttons before rebinding
    if (this.onUnbindItem && prevStart >= 0) {
      const prevActive = Math.min(poolSize, N)
      for (let i = 0; i < prevActive; i++) {
        const prevDataIdx = prevStart + i
        if (prevDataIdx < this.dataItems.length) {
          this.onUnbindItem(this.poolButtons[i], this.dataItems[prevDataIdx], prevDataIdx)
        }
      }
    }

    // Update each pool button's text and selection state
    for (let i = 0; i < activeCount; i++) {
      const dataIdx = startIdx + i
      if (dataIdx >= this.dataItems.length) break // Safety: data may have shrunk while metrics are deferred
      const button = this.poolButtons[i]
      this.setPoolButtonLabel(i, this.dataItems[dataIdx].text)
      if (this.onBindItem) {
        this.onBindItem(button, this.dataItems[dataIdx], dataIdx)
      }
      if (this._selectionMode !== "none") {
        button.isOn = this.selectedIndices.has(dataIdx)
      }
    }

    this.scrollVisibilityDirty = true
  }

  private setPoolButtonLabel(poolIdx: number, text: string): void {
    if (poolIdx >= 0 && poolIdx < this.poolContents.length) {
      this.poolContents[poolIdx].text = text
    }
  }

  // --- Pool Mode Selection ---

  private handlePoolToggleFinished(button: Button, dataIdx: number): void {
    if (this._selectionMode === "none") return
    if (dataIdx >= this.dataItems.length) return

    if (button.isOn) {
      if (this._selectionMode === "single") {
        // Deselect all others — update visible pool buttons that were selected
        for (let i = 0; i < this.poolButtons.length; i++) {
          const otherDataIdx = this.poolVisibleStart + i
          if (otherDataIdx !== dataIdx && this.selectedIndices.has(otherDataIdx)) {
            this.poolButtons[i].isOn = false
          }
        }
        this.selectedIndices.clear()
      }
      this.selectedIndices.add(dataIdx)
    } else {
      if (!this._allowEmptySelection && this.selectedIndices.size <= 1 && this.selectedIndices.has(dataIdx)) {
        button.isOn = true
        return
      }
      this.selectedIndices.delete(dataIdx)
    }

    this.onSelectionChangedEvent.invoke([])
  }

  public getSelectedIndices(): number[] {
    return Array.from(this.selectedIndices)
  }

  /** Select a pool item by data index. Only works in pool mode with selection enabled. */
  public selectDataAt(index: number): void {
    if (!this.poolMode || this._selectionMode === "none") return
    if (index < 0 || index >= this.dataItems.length) return
    if (this.selectedIndices.has(index)) return

    if (this._selectionMode === "single") {
      for (let i = 0; i < this.poolButtons.length; i++) {
        const dataIdx = this.poolVisibleStart + i
        if (this.selectedIndices.has(dataIdx)) {
          this.poolButtons[i].isOn = false
        }
      }
      this.selectedIndices.clear()
    }
    this.selectedIndices.add(index)

    const poolIdx = index - this.poolVisibleStart
    if (poolIdx >= 0 && poolIdx < this.poolButtons.length) {
      this.poolButtons[poolIdx].isOn = true
    }

    this.onSelectionChangedEvent.invoke(this.getSelectedItems())
  }

  /** Deselect a pool item by data index. Only works in pool mode with selection enabled. */
  public deselectDataAt(index: number): void {
    if (!this.poolMode || this._selectionMode === "none") return
    if (!this.selectedIndices.has(index)) return
    if (!this._allowEmptySelection && this.selectedIndices.size <= 1) return

    this.selectedIndices.delete(index)

    const poolIdx = index - this.poolVisibleStart
    if (poolIdx >= 0 && poolIdx < this.poolButtons.length) {
      this.poolButtons[poolIdx].isOn = false
    }

    this.onSelectionChangedEvent.invoke(this.getSelectedItems())
  }

  // --- Pool Mode Fade ---

  private updatePoolFadeAlphas(): void {
    if (!this.scrollWindow || this.poolButtons.length === 0) return

    const scrollY = this.scrollWindow.scrollPosition.y
    const halfWindow = this.windowHeight / 2
    const applyFade = this._scrollFade
    const maxScroll = applyFade ? Math.max(0, (this.poolTotalHeight - this.windowHeight) / 2) : 0
    const isAtTop = applyFade && scrollY <= -maxScroll + 0.001
    const isAtBottom = applyFade && scrollY >= maxScroll - 0.001
    const lastDataIdx = this.dataItems.length - 1
    const contentTopY = this.poolTotalHeight / 2
    const halfItem = this._optionHeight / 2

    for (let i = 0; i < this.poolButtons.length; i++) {
      const dataIdx = this.poolVisibleStart + i
      const button = this.poolButtons[i]
      if (dataIdx >= this.dataItems.length) {
        continue
      }

      const buttonContentY = contentTopY - dataIdx * this.poolItemStep - this._optionHeight / 2
      const viewportY = buttonContentY + scrollY

      // Collider clipping — always active
      const inViewport = viewportY + halfItem >= -halfWindow && viewportY - halfItem <= halfWindow
      const collider = button.collider
      if (collider) {
        collider.enabled = inViewport
      }

      // Fade — only when scrollFade is enabled
      if (applyFade) {
        let alpha: number
        if ((dataIdx === 0 && isAtTop) || (dataIdx === lastDataIdx && isAtBottom)) {
          alpha = 1.0
        } else {
          alpha = 1.0
          if (viewportY > halfWindow - this.fadeZone) {
            alpha = Math.min(alpha, (halfWindow - viewportY) / this.fadeZone)
          }
          if (viewportY < -halfWindow + this.fadeZone) {
            alpha = Math.min(alpha, (viewportY + halfWindow) / this.fadeZone)
          }
          alpha = Math.max(0, Math.min(1, alpha))
        }
        if (Math.abs(alpha - this.poolAlphaCache[i]) < ALPHA_EPSILON) continue
        this.poolAlphaCache[i] = alpha
        this.setPoolButtonAlpha(button, alpha)
      }
    }
  }

  // --- Expand / Collapse ---

  public toggle(): void {
    this.setExpanded(!this._isExpanded)
  }

  public expand(): void {
    this.setExpanded(true)
  }

  public collapse(): void {
    this.setExpanded(false)
  }

  private setExpanded(expanded: boolean): void {
    if (this._isExpanded === expanded) return
    this._isExpanded = expanded
    this.onExpandedChangedEvent.invoke(expanded)
    this.animateDrawer(expanded)
  }

  private animateDrawer(expanding: boolean): void {
    if (!this.layoutReady) return
    if (expanding && this.getItemCount() === 0) return
    this.animationCancelSet.cancel()
    const fullH = this.bgVisualHeight
    const origY = this.bgOriginY
    const bgTransform = this.bgObject.getTransform()
    const sign = this.dirSign
    const showBg = !this._hideDrawerBackground

    // Self-anchor offset: animate the SceneObject position to keep the anchor edge fixed
    const applySelfAnchor = !this._parentHandlesAnchor
    const fullAnchorOffset = applySelfAnchor ? this.computeSelfAnchorOffset(this.expandedHeight) : 0
    const startAnchorOffset = this.selfAnchorOffset
    const targetAnchorOffset = expanding ? fullAnchorOffset : 0
    const baseY = this.sceneObject.getTransform().getLocalPosition().y - this.selfAnchorOffset

    if (expanding) {
      if (showBg) {
        this.bgObject.enabled = true
        this.bgRect.size = new vec2(this.bgRect.size.x, 0)
        bgTransform.setLocalPosition(new vec3(0, origY - (sign * fullH) / 2, BACKGROUND_Z_OFFSET))
      }
    } else {
      this.scrollWindowWrapper.enabled = false
    }

    animate({
      duration: EXPAND_ANIMATION_DURATION,
      easing: expanding ? "ease-out-sine" : "ease-in-sine",
      cancelSet: this.animationCancelSet,
      update: (t: number) => {
        if (showBg) {
          const h = fullH * (expanding ? t : 1 - t)
          this.bgRect.size = new vec2(this.bgRect.size.x, h)
          bgTransform.setLocalPosition(new vec3(0, origY - (sign * (fullH - h)) / 2, BACKGROUND_Z_OFFSET))
        }
        if (applySelfAnchor) {
          this.selfAnchorOffset = startAnchorOffset + (targetAnchorOffset - startAnchorOffset) * t
          const pos = this.sceneObject.getTransform().getLocalPosition()
          this.sceneObject.getTransform().setLocalPosition(new vec3(pos.x, baseY + this.selfAnchorOffset, pos.z))
        }
      },
      ended: () => {
        if (expanding) {
          this.scrollWindowWrapper.enabled = true
          this.scrollVisibilityDirty = true
        } else if (showBg) this.bgObject.enabled = false
      }
    })
  }

  // --- Scroll Fade & Collider Clipping ---

  /**
   * Updates item visibility based on scroll position:
   * - Fades items at viewport edges (when scrollFade is enabled)
   * - Disables colliders of items outside the viewport so they don't
   *   intercept interactions with elements above/below the drawer
   */
  private updateScrollVisibility(): void {
    if (!this.scrollWindow) return
    if (this.items.length === 0 || this.itemContentPositions.length === 0) return

    const scrollY = this.scrollWindow.scrollPosition.y
    const halfWindow = this.windowHeight / 2
    const applyFade = this._scrollFade
    const maxScroll = applyFade ? Math.max(0, (this.contentHeight - this.windowHeight) / 2) : 0
    const isAtTop = applyFade && scrollY <= -maxScroll + 0.001
    const isAtBottom = applyFade && scrollY >= maxScroll - 0.001
    const lastIndex = this.items.length - 1

    for (let index = 0; index < this.items.length; index++) {
      const itemContentY = this.itemContentPositions[index]
      if (itemContentY === undefined) continue
      const viewportY = itemContentY + scrollY
      const halfItem = (this.itemHeights[index] ?? this._optionHeight) / 2
      const inViewport = viewportY + halfItem >= -halfWindow && viewportY - halfItem <= halfWindow

      const collider = this.items[index].collider
      if (collider) {
        collider.enabled = inViewport
      }

      // Fade — only when scrollFade is enabled
      if (applyFade) {
        let alpha: number
        if ((index === 0 && isAtTop) || (index === lastIndex && isAtBottom)) {
          alpha = 1.0
        } else {
          alpha = 1.0
          if (viewportY > halfWindow - this.fadeZone) {
            alpha = Math.min(alpha, (halfWindow - viewportY) / this.fadeZone)
          }
          if (viewportY < -halfWindow + this.fadeZone) {
            alpha = Math.min(alpha, (viewportY + halfWindow) / this.fadeZone)
          }
          alpha = Math.max(0, Math.min(1, alpha))
        }
        if (Math.abs(alpha - this.itemAlphaCache[index]) < ALPHA_EPSILON) continue
        this.itemAlphaCache[index] = alpha
        this.setUnpoolItemAlpha(this.items[index], alpha)
      }
    }
  }

  /** Sets opacity on an unpool-mode DropdownItem and its descendants. */
  private setUnpoolItemAlpha(item: DropdownItem, alpha: number): void {
    item.setOpacity(alpha)
    this.setDescendantAlpha(item.sceneObject, alpha)
  }

  /** Sets opacity on a pool-mode Button and its descendants. */
  private setPoolButtonAlpha(button: Button, alpha: number): void {
    button.opacity = alpha
    // Fade Text, Image, and other descendants with the button visual.
    this.setDescendantAlpha(button.sceneObject, alpha)
    if (this.onFadeItem) {
      this.onFadeItem(button, alpha)
    }
  }

  /**
   * Collects all descendant Text and Image components for a SceneObject, caching the result.
   * Empty results are not cached — this handles code-created items where Text/Image
   * components are created asynchronously (e.g. ElementContent builds on OnStartEvent).
   */
  private getFadeTargets(obj: SceneObject): {texts: Text[]; images: Image[]} {
    let targets = this.fadeTargetCache.get(obj)
    if (targets) return targets
    const texts: Text[] = []
    const images: Image[] = []
    const collect = (o: SceneObject) => {
      for (let i = 0; i < o.getChildrenCount(); i++) {
        const child = o.getChild(i)
        const text = child.getComponent("Component.Text") as Text
        if (text) texts.push(text)
        const image = child.getComponent("Component.Image") as Image
        if (image) images.push(image)
        collect(child)
      }
    }
    collect(obj)
    targets = {texts, images}
    // Only cache non-empty results — empty means children may not be created yet
    if (texts.length > 0 || images.length > 0) {
      this.fadeTargetCache.set(obj, targets)
    }
    return targets
  }

  /** Sets alpha on all descendant Text and Image components using cached references. */
  private setDescendantAlpha(obj: SceneObject, alpha: number): void {
    const {texts, images} = this.getFadeTargets(obj)
    for (const text of texts) {
      const c = text.textFill.color
      if (c.a !== alpha) {
        text.textFill.color = new vec4(c.r, c.g, c.b, alpha)
      }
    }
    for (const image of images) {
      const c = image.mainPass.baseColor
      if (c.a !== alpha) {
        image.mainPass.baseColor = new vec4(c.r, c.g, c.b, alpha)
      }
    }
  }

  // --- Scroll ---

  /** Scrolls to the item at the given index. No-op when the dropdown is collapsed. */
  public scrollToItem(index: number, durationMs: number = SCROLL_TWEEN_DURATION_MS): void {
    if (!this._isExpanded) return
    if (!this.scrollWindow) return

    if (this.poolMode) {
      if (index < 0 || index >= this.dataItems.length) return
      const contentTopY = this.poolTotalHeight / 2
      const itemY = contentTopY - index * this.poolItemStep - this._optionHeight / 2
      const maxScroll = Math.max(0, (this.poolTotalHeight - this.windowHeight) / 2)
      const targetY = Math.max(-maxScroll, Math.min(maxScroll, -itemY))
      this.scrollWindow.tweenTo(new vec2(0, targetY), durationMs)
    } else {
      if (index < 0 || index >= this.items.length) return
      if (this.itemContentPositions.length === 0) return
      const itemY = this.itemContentPositions[index]
      const maxScroll = Math.max(0, (this.contentHeight - this.windowHeight) / 2)
      const targetY = Math.max(-maxScroll, Math.min(maxScroll, -itemY))
      this.scrollWindow.tweenTo(new vec2(0, targetY), durationMs)
      this.scrollVisibilityDirty = true
    }
  }

  // --- Cleanup ---

  public destroy(): void {
    this.animationCancelSet.cancel()
    for (const unsub of this.unsubscribes) unsub()
    this.unsubscribes = []

    for (const unsub of this.itemUnsubscribes) unsub()
    this.itemUnsubscribes = []
    for (const unsub of this.toggleUnsubscribes) unsub()
    this.toggleUnsubscribes = []
    this.itemAlphaCache = []
    if (this.externalToggleGroupUnsub) {
      this.externalToggleGroupUnsub()
      this.externalToggleGroupUnsub = null
    }
    this.selectedSet.clear()
    this.selectedIndices.clear()
    this._externalToggleGroup = null

    // Pool cleanup — pool buttons are children of layoutObject, destroyed with scrollWindowWrapper
    for (const unsub of this.poolUnsubscribes) unsub()
    this.poolUnsubscribes = []
    this.poolButtons = []
    this.poolFlexItems = []
    this.poolContents = []
    this.poolActiveCount = 0
    this.poolAlphaCache = []
    this.triggerContent = null
    this.fadeTargetCache.clear()

    if (!isNull(this.generatedTriggerObject)) this.generatedTriggerObject.destroy()
    if (!isNull(this.triggerBgObject)) this.triggerBgObject.destroy()
    if (!isNull(this.bgObject)) this.bgObject.destroy()
    if (!isNull(this.scrollWindowWrapper)) this.scrollWindowWrapper.destroy()
    this.selfAnchorOffset = 0
    this.destroyFlexContainer()
  }
}
