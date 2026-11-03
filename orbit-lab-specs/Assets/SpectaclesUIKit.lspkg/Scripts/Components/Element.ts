import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {HandInteractor} from "SpectaclesInteractionKit.lspkg/Core/HandInteractor/HandInteractor"
import {Interactor, TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import {DragInteractorEvent, InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import Event, {PublicApi, unsubscribe} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import NativeLogger from "SpectaclesInteractionKit.lspkg/Utils/NativeLogger"
import ReplayEvent from "SpectaclesInteractionKit.lspkg/Utils/ReplayEvent"
import {InteractableStateMachine, StateEvent} from "../Utility/InteractableStateMachine"
import {UIKitAudioPlayer} from "../Utility/UIKitAudioPlayer"
import {isEqual} from "../Utility/UIKitUtilities"
import {Layoutable} from "./Layout2D/Layoutable"
import {UIKitBrands} from "./Layout2D/UIKitBrands"
// Side-effect import: register UIKit's Layout2D handlers on the shared
// ItemHandlerRegistry. Element is the canonical UIKit base class, so every
// UIKit-derived component pulls this in transitively. See UIKitBootstrap.ts.
import "../UIKitBootstrap"

const log = new NativeLogger("Element")

const TRIGGER_START_AUDIO_TRACK: AudioTrackAsset = requireAsset(
  "../../Audio/TriggerStartAudioTrack.wav"
) as AudioTrackAsset

const TRIGGER_END_AUDIO_TRACK: AudioTrackAsset = requireAsset("../../Audio/TriggerEndAudioTrack.wav") as AudioTrackAsset

const TRIGGER_START_AUDIO_VOLUME: number = 1
const TRIGGER_END_AUDIO_VOLUME: number = 1

const ENLARGE_COLLIDER_MULTIPLIER: number = 3

export enum StateName {
  default = "default",
  hovered = "hovered",
  triggered = "triggered",
  error = "error",
  errorHovered = "errorHovered",
  inactive = "inactive",
  toggledDefault = "toggledDefault",
  toggledHovered = "toggledHovered",
  toggledTriggered = "toggledTriggered"
}

/**
 * Abstract class representing an element in the Spectacles UIKit.
 *
 * @abstract
 */
export abstract class Element extends BaseScriptComponent implements Layoutable {
  /**
   * Type brand consumed by the Layout2D `ElementHandler` finder. Inherited
   * unchanged by every Element subclass so they all resolve to the same
   * handler without redeclaring. See `Layout2D/UIKitBrands.ts`.
   */
  public readonly __uikitBrand = UIKitBrands.Element

  // Having this here is a hack for re-ordering the inputs in the inspector
  // TODO: Move it to VisualElement once we have a way to re-order the inputs in the inspector
  @input("int")
  protected _renderOrder: number = 0

  @input
  @hint("Size of the element in centimeters")
  protected _size: vec3 = new vec3(6, 3, 3)

  @input
  @hint("Inactive Mode: set the element to ignore inputs")
  private _inactive: boolean = false

  @input
  @label("Play Audio")
  @hint("Play audio on interaction")
  private _playAudio: boolean = false

  private _playTriggerDownAudio: boolean = true
  private _playTriggerUpAudio: boolean = true

  private _transform: Transform = this.sceneObject.getTransform()
  private initialPosition: vec3 = vec3.zero()
  private initialScale: vec3 = vec3.one()
  protected currentPosition: vec3 = this.initialPosition
  protected currentScale: vec3 = this.initialScale

  protected colliderObject: SceneObject
  protected colliderTransform: Transform
  protected _collider: ColliderComponent
  protected colliderShape: BoxShape
  protected _colliderFitElement: boolean = true
  protected _colliderSize: vec3 = this._size
  protected _colliderCenter: vec3 = vec3.zero()

  private _interactable: Interactable
  protected _interactableStateMachine: InteractableStateMachine

  protected managedSceneObjects: Set<SceneObject> = new Set<SceneObject>()
  protected managedComponents: Set<Component> = new Set<Component>()

  protected stateName: StateName = StateName.default

  protected _initialized: boolean = false
  protected _hasError: boolean = false

  private _triggerStartAudioTrack: AudioTrackAsset = TRIGGER_START_AUDIO_TRACK
  private _triggerStartAudioVolume: number = TRIGGER_START_AUDIO_VOLUME
  private _triggerEndAudioTrack: AudioTrackAsset = TRIGGER_END_AUDIO_TRACK
  private _triggerEndAudioVolume: number = TRIGGER_END_AUDIO_VOLUME

  /**
   * Indicates whether the element is currently being dragged.
   * This property is used to track the drag state of the element.
   */
  protected _isDragged: boolean = false

  // Backing events grouped into one own-property (was 7 separate fields). Public access is via
  // the lazy getters below; internal dispatch uses these directly (e.g. this._events.sizeChanged.invoke()).
  protected readonly _events = {
    initialized: new ReplayEvent<void>(),
    stateChanged: new ReplayEvent<StateName>(),
    hoverEnter: new Event<InteractorEvent>(),
    hoverExit: new Event<InteractorEvent>(),
    triggerDown: new Event<InteractorEvent>(),
    triggerUp: new Event<InteractorEvent>(),
    sizeChanged: new Event<vec3>()
  }

  private _onInitialized?: PublicApi<void>
  /**
   * A public API event that is triggered when the element is initialized.
   */
  public get onInitialized(): PublicApi<void> {
    return (this._onInitialized ??= this._events.initialized.publicApi())
  }

  private _onStateChanged?: PublicApi<StateName>
  /**
   * An event that is triggered whenever the state of the element changes.
   */
  public get onStateChanged(): PublicApi<StateName> {
    return (this._onStateChanged ??= this._events.stateChanged.publicApi())
  }

  private _onHoverEnter?: PublicApi<InteractorEvent>
  /**
   * An event that is triggered when a hover interaction starts on the element.
   */
  public get onHoverEnter(): PublicApi<InteractorEvent> {
    return (this._onHoverEnter ??= this._events.hoverEnter.publicApi())
  }

  private _onHoverExit?: PublicApi<InteractorEvent>
  /**
   * An event that is triggered when a hover interaction ends on the element.
   */
  public get onHoverExit(): PublicApi<InteractorEvent> {
    return (this._onHoverExit ??= this._events.hoverExit.publicApi())
  }

  private _onTriggerDown?: PublicApi<InteractorEvent>
  /**
   * An event that is triggered when a trigger interaction starts on the element.
   */
  public get onTriggerDown(): PublicApi<InteractorEvent> {
    return (this._onTriggerDown ??= this._events.triggerDown.publicApi())
  }

  private _onTriggerUp?: PublicApi<InteractorEvent>
  /**
   * An event that is triggered when a trigger interaction ends on the element.
   */
  public get onTriggerUp(): PublicApi<InteractorEvent> {
    return (this._onTriggerUp ??= this._events.triggerUp.publicApi())
  }

  private _onSizeChanged?: PublicApi<vec3>
  /**
   * An event that is triggered when the size of the element changes.
   */
  public get onSizeChanged(): PublicApi<vec3> {
    return (this._onSizeChanged ??= this._events.sizeChanged.publicApi())
  }

  // Interactable listener unsubscribes. Bound at registration (setUpInteractableListeners) and
  // torn down by draining this array. Replaces 13 eager `.bind(this)` handler fields:
  // 13 own-properties → 1, and the binds move off the construction path to registration time.
  private interactableUnsubs: unsubscribe[] = []

  /**
   * Gets the layout width in local space centimeters.
   * @returns The current width of the element.
   */
  public get width(): number {
    return this._size.x
  }

  /**
   * Sets the layout width in local space centimeters.
   * @param value - The new width value.
   */
  public set width(value: number) {
    this.size = new vec3(value, this._size.y, this._size.z)
  }

  /**
   * Gets the layout height in local space centimeters.
   * @returns The current height of the element.
   */
  public get height(): number {
    return this._size.y
  }

  /**
   * Sets the layout height in local space centimeters.
   * @param value - The new height value.
   */
  public set height(value: number) {
    this.size = new vec3(this._size.x, value, this._size.z)
  }

  /**
   * Gets the layout depth in local space centimeters.
   * @returns The current depth of the element.
   */
  public get depth(): number {
    return this._size.z
  }

  /**
   * Sets the layout depth in local space centimeters.
   * @param value - The new depth value.
   */
  public set depth(value: number) {
    this.size = new vec3(this._size.x, this._size.y, value)
  }

  /**
   * Gets the layout size as a vec3.
   * @returns The layout size with width, height, and depth.
   */
  public get layoutSize(): vec3 {
    return this._size
  }

  /**
   * Gets the transform associated with this element.
   *
   * @returns {Transform} The transform of the element.
   */
  public get transform(): Transform {
    return this._transform
  }

  /**
   * Gets the children of the element that are not managed by the element.
   *
   * @returns {SceneObject[]} The children of the element that are not managed by the element.
   */
  public get contentChildren(): SceneObject[] {
    return this.sceneObject.children.filter((child) => !this.managedSceneObjects.has(child))
  }

  /**
   * Gets the number of children of the element that are not managed by the element.
   *
   * @returns {number} The number of children of the element that are not managed by the element.
   */
  public get contentChildrenCount(): number {
    let managedChildrenCount = 0
    this.managedSceneObjects.forEach((child) => {
      if (child.getParent() === this.sceneObject) {
        managedChildrenCount++
      }
    })
    return this.sceneObject.children.length - managedChildrenCount
  }

  /**
   * Register an externally-managed SceneObject so it is excluded from
   * contentChildren and destroyed on release().
   */
  public registerManagedChild(sceneObject: SceneObject): void {
    this.managedSceneObjects.add(sceneObject)
  }

  /**
   * Gets the ColliderComponent instance associated with this element.
   * The collider is used for detecting interactions or collisions with the element.
   *
   * @returns {ColliderComponent} The collider instance.
   */
  public get collider(): ColliderComponent {
    return this._collider
  }

  /**
   * Gets whether the collider automatically fits the element's size.
   *
   * @returns {boolean} True if the collider fits the element, false if using custom size/position.
   */
  public get colliderFitElement(): boolean {
    return this._colliderFitElement
  }

  /**
   * Sets whether the collider should automatically fit the element's size.
   *
   * @param colliderFitElement - True to make the collider fit the element, false to use custom size/position.
   */
  public set colliderFitElement(colliderFitElement: boolean) {
    this._colliderFitElement = colliderFitElement
    if (this._initialized) {
      if (this._colliderFitElement) {
        const delta = this.deltaPosition.div(this.deltaScale)
        this.colliderShape.size = this._size.add(delta)
        this.colliderTransform.setLocalPosition(vec3.zero())
      } else {
        this.colliderShape.size = this._colliderSize
        this.colliderTransform.setLocalPosition(this._colliderCenter)
      }
      this._collider.shape = this.colliderShape
    }
  }

  /**
   * Gets the custom size of the collider.
   * This size is only used when colliderFitElement is false.
   *
   * @returns {vec3} The custom collider size in local space coordinates.
   */
  public get colliderSize(): vec3 {
    return this._colliderSize
  }

  /**
   * Sets the custom size of the collider.
   * This size is only applied when colliderFitElement is false.
   *
   * @param size - The custom collider size in local space coordinates.
   */
  public set colliderSize(size: vec3) {
    this._colliderSize = size
    if (this._initialized) {
      if (!this._colliderFitElement) {
        this.colliderShape.size = this._colliderSize
        this._collider.shape = this.colliderShape
      }
    }
  }

  /**
   * Gets the custom center position of the collider.
   * This position is only used when colliderFitElement is false.
   *
   * @returns {vec3} The custom collider center position in local space coordinates.
   */
  public get colliderCenter(): vec3 {
    return this._colliderCenter
  }

  /**
   * Sets the custom center position of the collider.
   * This position is only applied when colliderFitElement is false.
   *
   * @param center - The custom collider center position in local space coordinates.
   */
  public set colliderCenter(center: vec3) {
    this._colliderCenter = center
    if (this._initialized) {
      if (!this._colliderFitElement) {
        this.colliderTransform.setLocalPosition(this._colliderCenter)
      }
    }
  }

  /**
   * Gets the interactable property of the element.
   *
   * @returns {Interactable} The current interactable instance associated with this element.
   */
  public get interactable(): Interactable {
    return this._interactable
  }

  /**
   * Indicates whether the element has been initialized.
   *
   * @returns {boolean} `true` if the element is initialized, otherwise `false`.
   */
  public get initialized(): boolean {
    return this._initialized
  }

  /**
   * Gets the value indicating whether audio playback is enabled.
   *
   * @returns {boolean} `true` if audio playback is enabled; otherwise, `false`.
   */
  public get playAudio(): boolean {
    return this._playAudio
  }

  /**
   * Sets the playAudio behavior and initializes the audio component if necessary.
   *
   * @param playAudio - A boolean indicating whether audio should be played.
   *                    If set to `true` and the audio component is not already created,
   *                    a new audio component will be instantiated and attached to the scene object.
   */
  public set playAudio(playAudio: boolean) {
    if (playAudio === undefined) {
      return
    }
    if (isEqual<boolean>(this._playAudio, playAudio)) {
      return
    }
    this._playAudio = playAudio
  }

  /**
   * Gets the value indicating whether trigger down audio playback is enabled.
   *
   * @returns {boolean} `true` if trigger down audio playback is enabled; otherwise, `false`.
   */
  public get playTriggerDownAudio(): boolean {
    return this._playTriggerDownAudio
  }

  /**
   * Sets the playTriggerDownAudio behavior and initializes the audio component if necessary.
   *
   * @param playTriggerDownAudio - A boolean indicating whether trigger down audio should be played.
   *                               If set to `true` and the audio component is not already created,
   *                               a new audio component will be instantiated and attached to the scene object.
   */
  public set playTriggerDownAudio(playTriggerDownAudio: boolean) {
    if (playTriggerDownAudio === undefined) {
      return
    }
    if (isEqual<boolean>(this._playTriggerDownAudio, playTriggerDownAudio)) {
      return
    }
    this._playTriggerDownAudio = playTriggerDownAudio
  }

  /**
   * Gets the value indicating whether trigger up audio playback is enabled.
   *
   * @returns {boolean} `true` if trigger up audio playback is enabled; otherwise, `false`.
   */
  public get playTriggerUpAudio(): boolean {
    return this._playTriggerUpAudio
  }

  /**
   * Sets the playTriggerUpAudio behavior and initializes the audio component if necessary.
   *
   * @param playTriggerUpAudio - A boolean indicating whether trigger up audio should be played.
   *                             If set to `true` and the audio component is not already created,
   *                             a new audio component will be instantiated and attached to the scene object.
   */
  public set playTriggerUpAudio(playTriggerUpAudio: boolean) {
    if (playTriggerUpAudio === undefined) {
      return
    }
    if (isEqual<boolean>(this._playTriggerUpAudio, playTriggerUpAudio)) {
      return
    }
    this._playTriggerUpAudio = playTriggerUpAudio
  }

  /**
   * Gets the audio track to be played when the trigger starts.
   *
   * @returns {AudioTrackAsset} The audio track asset associated with the trigger start event.
   */
  public get triggerStartAudioTrack(): AudioTrackAsset {
    return this._triggerStartAudioTrack
  }

  /**
   * Sets the audio track to be played when the trigger starts.
   *
   * @param audioTrack - The audio track asset to be assigned.
   */
  public set triggerStartAudioTrack(audioTrack: AudioTrackAsset) {
    if (audioTrack === undefined) {
      return
    }
    this._triggerStartAudioTrack = audioTrack
  }

  /**
   * Gets the volume level for the trigger start audio.
   *
   * @returns {number} The volume level for the trigger start audio.
   */
  public get triggerStartAudioVolume(): number {
    return this._triggerStartAudioVolume
  }

  /**
   * Sets the volume level for the trigger start audio.
   *
   * @param volume - The desired audio volume level as a number.
   */
  public set triggerStartAudioVolume(volume: number) {
    if (volume === undefined) {
      return
    }
    this._triggerStartAudioVolume = volume
  }

  /**
   * Gets the audio track to be played at the end of a trigger event.
   *
   * @returns {AudioTrackAsset} The audio track asset associated with the trigger end event.
   */
  public get triggerEndAudioTrack(): AudioTrackAsset {
    return this._triggerEndAudioTrack
  }

  /**
   * Sets the audio track to be played at the end of a trigger event.
   *
   * @param audioTrack - The audio track asset to be assigned.
   */
  public set triggerEndAudioTrack(audioTrack: AudioTrackAsset) {
    if (audioTrack === undefined) {
      return
    }
    this._triggerEndAudioTrack = audioTrack
  }

  /**
   * Gets the volume level for the trigger end audio.
   *
   * @returns {number} The volume level for the trigger end audio.
   */
  public get triggerEndAudioVolume(): number {
    return this._triggerEndAudioVolume
  }

  /**
   * Sets the volume level for the trigger end audio.
   *
   * @param volume - The desired volume level as a number.
   */
  public set triggerEndAudioVolume(volume: number) {
    if (volume === undefined) {
      return
    }
    this._triggerEndAudioVolume = volume
  }

  /**
   * @returns is inactive or not
   */
  public get inactive() {
    return this._inactive
  }

  /**
   * @param inactive set is inactive or is not inactive
   */
  public set inactive(inactive: boolean) {
    if (inactive === undefined) {
      return
    }
    if (isEqual<boolean>(this._inactive, inactive)) {
      return
    }
    this._inactive = inactive
    if (this._initialized) {
      if (this._inactive) {
        this.setState(StateName.inactive)
      } else {
        if (this.stateName === StateName.inactive) {
          this.stateName = StateName.default
        }
        this.setState(this.stateName)
      }
      if (this._interactable) {
        this._interactable.enabled = !this._inactive
      }
      if (this._collider) {
        this._collider.enabled = !this._inactive
      }
    }
  }

  /**
   * @returns current size
   */
  public get size(): vec3 {
    return this._size
  }

  /**
   * Sets current size. Stores by copy via `copyFrom`, so callers may reuse
   * the same vec3 reference across multiple setters (e.g. when sizing two
   * sibling Elements with one local). External mutation of the passed vec3
   * after the call does not alias this Element's `_size`.
   *
   * @param size set current size
   */
  public set size(size: vec3) {
    if (size === undefined) {
      return
    }
    if (isEqual<vec3>(this._size, size)) {
      return
    }
    this._size.copyFrom(size)
    if (this._initialized) {
      if (this._colliderFitElement) {
        const delta = this.deltaPosition.div(this.deltaScale)
        this.colliderShape.size = this._size.add(delta)
        this._collider.shape = this.colliderShape
      }
      this._events.sizeChanged.invoke(this._size)
    }
  }

  /**
   * Determines whether the element is draggable.
   *
   * @returns {boolean} Always returns `false`, indicating that the element is not draggable.
   */
  public get isDraggable() {
    return false
  }

  /**
   * Initializes the element and its associated components. This method ensures that
   * the element is set up properly, including its collider, interactable state, size,
   * and event listeners.
   */
  public initialize() {
    if (this._initialized) {
      return
    }

    this.colliderObject = global.scene.createSceneObject("Collider")
    this.managedSceneObjects.add(this.colliderObject)
    this.colliderObject.setParent(this.sceneObject)
    this.colliderTransform = this.colliderObject.getTransform()
    this._collider = this.colliderObject.createComponent("ColliderComponent")
    this.collider.fitVisual = false
    this.colliderShape = Shape.createBoxShape()
    if (this._colliderFitElement) {
      const delta = this.deltaPosition.div(this.deltaScale)
      this.colliderShape.size = this._size.add(delta)
      this.colliderTransform.setLocalPosition(vec3.zero())
    } else {
      this.colliderShape.size = this._colliderSize
      this.colliderTransform.setLocalPosition(this._colliderCenter)
    }
    this._collider.shape = this.colliderShape
    this._collider.enabled = !this._inactive
    this.managedComponents.add(this._collider)

    this._interactable =
      this.sceneObject.getComponent(Interactable.getTypeName()) ||
      this.sceneObject.createComponent(Interactable.getTypeName())
    this._interactable.targetingMode = TargetingMode.All
    this._interactable.enableInstantDrag = this.isDraggable
    this.managedComponents.add(this._interactable)
    this._interactableStateMachine = this.sceneObject.createComponent(InteractableStateMachine.getTypeName())
    this._interactableStateMachine.initialize()
    this._interactableStateMachine.isDraggable = this.isDraggable
    this.managedComponents.add(this._interactableStateMachine)
    this._interactable.enabled = !this._inactive

    this.setUpInteractableListeners()

    this.setUpEventCallbacks()

    if (this._inactive) {
      this.inactive = this._inactive
    } else {
      this.setState(this.stateName)
    }

    this._initialized = true

    this._events.initialized.invoke()
  }

  protected setUpEventCallbacks() {}

  protected update() {}

  protected release() {
    this.removeInteractableListeners()

    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.destroy()
      }
    })
    this.managedComponents.clear()
    this.managedSceneObjects.forEach((sceneObject) => {
      if (!isNull(sceneObject) && sceneObject) {
        sceneObject.destroy()
      }
    })
    this.managedSceneObjects.clear()
  }

  protected setState(stateName: StateName) {
    this.stateName = stateName
    this._events.stateChanged.invoke(stateName)
  }

  protected get isToggle(): boolean {
    return false
  }

  protected get deltaPosition(): vec3 {
    return this.currentPosition.sub(this.initialPosition)
  }

  protected get deltaScale(): vec3 {
    return this.currentScale.div(this.initialScale)
  }

  protected setUpInteractableListeners() {
    if (this._interactableStateMachine) {
      this._interactableStateMachine.isToggle = this.isToggle
      const u = this.interactableUnsubs
      u.push(this._interactableStateMachine.onDefault.add((e) => this.onInteractableDefault(e)))
      u.push(this._interactableStateMachine.onHovered.add((e) => this.onInteractableHovered(e)))
      u.push(this._interactableStateMachine.onTriggered.add((e) => this.onInteractableTriggered(e)))
      u.push(this._interactableStateMachine.onToggledDefault.add((e) => this.onInteractableToggledDefault(e)))
      u.push(this._interactableStateMachine.onToggledHovered.add((e) => this.onInteractableToggledHovered(e)))
      u.push(this._interactableStateMachine.onToggledTriggered.add((e) => this.onInteractableToggledTriggered(e)))
      u.push(this.interactable.onHoverEnter.add((e) => this.onHoverEnterHandler(e)))
      u.push(this.interactable.onHoverExit.add((e) => this.onHoverExitHandler(e)))
      u.push(this.interactable.onTriggerStart.add((e) => this.onTriggerDownHandler(e)))
      u.push(this.interactable.onTriggerEnd.add((e) => this.onTriggerUpHandler(e)))
      if (this.isDraggable) {
        u.push(this._interactable.onDragStart.add((e) => this.onInteractableDragStart(e)))
        u.push(this._interactable.onDragUpdate.add((e) => this.onInteractableDragUpdate(e)))
        u.push(this._interactable.onDragEnd.add((e) => this.onInteractableDragEnd(e)))
      }
    }
  }

  protected removeInteractableListeners() {
    // Drain whatever was registered (handles the draggable/non-draggable split and repeated
    // setUp/remove cycles, e.g. BaseButton.setIsToggleable, without stale references).
    for (let i = 0; i < this.interactableUnsubs.length; i++) {
      this.interactableUnsubs[i]()
    }
    this.interactableUnsubs.length = 0
  }

  private onInteractableDefault(_: StateEvent) {
    this.setState(this._hasError ? StateName.error : StateName.default)
  }

  private onInteractableHovered(_: StateEvent) {
    this.setState(this._hasError ? StateName.errorHovered : StateName.hovered)
  }

  private onInteractableTriggered(_: StateEvent) {
    this.setState(StateName.triggered)
  }

  private onInteractableToggledDefault(_: StateEvent) {
    this.setState(StateName.toggledDefault)
  }

  private onInteractableToggledHovered(_: StateEvent) {
    this.setState(StateName.toggledHovered)
  }

  private onInteractableToggledTriggered(_: StateEvent) {
    this.setState(StateName.toggledTriggered)
  }

  protected onHoverEnterHandler(event: InteractorEvent) {
    if (event.propagationPhase !== "Target") {
      return
    }
    this._events.hoverEnter.invoke(event)
  }

  protected onHoverExitHandler(event: InteractorEvent) {
    if (event.propagationPhase !== "Target") {
      return
    }
    this._events.hoverExit.invoke(event)
  }

  protected onTriggerDownHandler(event: InteractorEvent) {
    if (event.propagationPhase !== "Target") {
      return
    }
    log.d(`${this.sceneObject.name} onTriggerDown by ${event.interactor.inputType}`)
    if (this._playTriggerDownAudio) {
      this.playAudioTrack(this._triggerStartAudioTrack, this._triggerStartAudioVolume)
    }
    this._events.triggerDown.invoke(event)
  }

  protected onTriggerUpHandler(event: InteractorEvent) {
    if (event.propagationPhase !== "Target") {
      return
    }
    log.d(`${this.sceneObject.name} onTriggerUp by ${event.interactor.inputType}`)
    if (this._playTriggerUpAudio) {
      this.playAudioTrack(this._triggerEndAudioTrack, this._triggerEndAudioVolume)
    }
    this._events.triggerUp.invoke(event)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onInteractableDragStart(dragEvent: DragInteractorEvent) {
    if (this._colliderFitElement) {
      const delta = this.deltaPosition.div(this.deltaScale)
      this.colliderShape.size = this._size.add(delta).uniformScale(ENLARGE_COLLIDER_MULTIPLIER)
      this._collider.shape = this.colliderShape
    }
    this._isDragged = true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onInteractableDragUpdate(dragEvent: DragInteractorEvent) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onInteractableDragEnd(dragEvent: DragInteractorEvent) {
    if (this._colliderFitElement) {
      const delta = this.deltaPosition.div(this.deltaScale)
      this.colliderShape.size = this._size.add(delta)
      this._collider.shape = this.colliderShape
    }
    this._isDragged = false
  }

  protected getInteractionPosition(interactor: Interactor): vec3 | null {
    let currentInteractionPosition: vec3 | null = null
    if (interactor instanceof HandInteractor) {
      const hand = interactor.hand
      // Pinch drag update does not update the target hit position
      if (interactor.activeTargetingMode === TargetingMode.Direct) {
        currentInteractionPosition = this._transform
          .getInvertedWorldTransform()
          .multiplyPoint(hand.indexTip.position.add(hand.thumbTip.position).uniformScale(0.5))
      } else if (interactor.planecastPoint) {
        currentInteractionPosition = this._transform
          .getInvertedWorldTransform()
          .multiplyPoint(interactor.planecastPoint)
      } else {
        currentInteractionPosition = this._transform.getInvertedWorldTransform().multiplyPoint(hand.indexTip.position)
      }
    } else if (interactor.planecastPoint) {
      currentInteractionPosition = this._transform.getInvertedWorldTransform().multiplyPoint(interactor.planecastPoint)
    }
    return currentInteractionPosition
  }

  /**
   * Plays the specified audio track at the given volume.
   *
   * @param audioTrack - The audio track asset to be played.
   * @param volume - The volume level at which the audio track should be played.
   */
  protected playAudioTrack(audioTrack: AudioTrackAsset, volume: number) {
    if (this._playAudio && audioTrack) {
      UIKitAudioPlayer.getInstance().play(audioTrack, volume)
    }
  }

  public onAwake() {
    this.createEvent("OnStartEvent").bind(this.onStart.bind(this))
    // Only run a per-frame UpdateEvent when a subclass actually overrides the
    // (empty) base update(); otherwise every Element pays an idle trampoline.
    if (this.update !== Element.prototype.update) {
      this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this))
    }
    this.createEvent("OnDestroyEvent").bind(this.onDestroy.bind(this))
    this.createEvent("OnEnableEvent").bind(this.onEnabled.bind(this))
    this.createEvent("OnDisableEvent").bind(this.onDisabled.bind(this))
  }

  private onStart() {
    if (!this._initialized) {
      this.initialize()
    }
  }

  private onUpdate() {
    if (this._initialized) {
      this.update()
    }
  }

  private onDestroy() {
    this.release()
  }

  protected onEnabled() {
    this.enableManagedComponents()
  }

  protected onDisabled() {
    this.disableManagedComponents()
  }

  protected enableManagedComponents() {
    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.enabled = true
      }
    })
  }

  protected disableManagedComponents() {
    this.managedComponents.forEach((component) => {
      if (!isNull(component) && component) {
        component.enabled = false
      }
    })
  }
}
