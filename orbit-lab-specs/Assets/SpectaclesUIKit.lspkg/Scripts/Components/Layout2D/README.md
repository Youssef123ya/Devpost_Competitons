# Layout2D

CSS-spec-inspired layout primitives for SpectaclesUIKit: Flexbox (`Flex/`)
and CSS Grid Level 1 (`Grid/`), built on a shared item-resolution layer.

## Mental model

Three layers stack on top of each other:

1. **Pure layout engines** (`Flex/Flexbox2D.ts`, `Grid/Grid2D.ts`).
   Zero Lens Studio imports. Take serialized inputs (intrinsic sizes,
   constraints, placement), return positions and allocated sizes.
2. **Per-item layout components** (`FlexItem`, `GridItem`) — extend
   `LayoutItem2D`. Attach one to each child SceneObject of a container.
   They resolve a content-type *handler* on `OnStart`, expose Flex / Grid
   properties to the inspector, and serialize their state to the engine
   via `toInput()` / `fillInput()`.
3. **Container components** (`FlexLayout`, `GridLayout`) — thin
   orchestrators. Collect inputs from their `LayoutItem2D` children, run
   the engine, write outputs back via `LayoutItem2D.applyLayout()`.

## ItemHandler — bridging Layout2D to content

Layout2D doesn't know how to size or position any particular kind of
component on its own. That job belongs to `ItemHandler` implementations
registered in `ItemHandlerRegistry`. A handler answers two questions for
the layout pass:

- **`measure(sceneObject, component, transform)`** — what is the
  content's intrinsic size? Returns a `ContentMeasurement`
  `{min, preferred, max}` (CSS Sizing 3 model). `min` is the
  min-content size (smallest the item can shrink to without
  overflow), `preferred` is the natural size, `max` is the
  max-content size (largest the item wants to grow to, often
  `Infinity` for flexible content).
- **`apply(sceneObject, x, y, width, height, component, transform)`** —
  given an allocation, where does the size go? Handlers write to the
  appropriate native channel: Text → `layoutRect`, Image →
  `Transform.localScale`, BaseMeshVisual → AABB-derived `Transform.localScale`,
  Shape → `width/height`. Any of these write `ScreenTransform.offsets` instead
  when a ScreenTransform is present (it supersedes those channels).

Built-in priorities (higher = checked first):
```
120  CustomFlexContainer   — atomic composite widgets
110  LayoutContainer       — FlexLayout / GridLayout
100  Element               — Element-derived UIKit components
 95  StandaloneContent     — standalone ElementContent
 90  Shape                 — Shape visuals
 70  Text / Text3D
 60  Image
 50  BaseMeshVisual        — predicate-gated on finite AABB
 45  ScreenTransform
 40  BoxCollider
 38  SphereCollider
 37  Capsule/CylinderCollider
```

Register custom handlers with
`ItemHandlerRegistry.register(handler, priority)`; replace a built-in
with `ItemHandlerRegistry.unregisterByName(name)` + `register(replacement, priority)`.

## "Naked" LayoutItem2D — no handler

A SceneObject can host a `FlexItem` / `GridItem` even when no built-in
handler recognizes its content. There are two well-defined patterns:

### 1. Override-pinned (the canonical pattern)

Set `overrideWidth` and/or `overrideHeight` in the inspector or via
script. `measureIntrinsic()` reports those as the preferred size,
`hasOverride*` flags drop the handler's min/max, and `applyLayout`:

- writes `Transform.localPosition` for x/y,
- writes `Transform.localScale` to make the SceneObject's children
  *render at the allocated size*, treating the override as the natural
  scale-1 size. So a SceneObject authored at `overrideWidth = 10` cm
  and allocated 20 cm will render at `localScale.x = 2`.

This is the right escape hatch for prefab roots or empty containers
whose children can't be introspected by the handler registry.

### 2. No override, no handler (zero-size warning)

If neither an override nor a recognized content component is present,
the layout sees the item as `0×0`. `applyLayout` still writes
`Transform.localPosition`, but **does not touch `localScale`** —
otherwise we would clobber child meshes / text at their authored size.
A one-shot `print()` warning fires on the first apply so the misconfig
is visible:

> `WARNING: <SceneObject> has a LayoutItem2D but no recognized content
> component and no overrideWidth/overrideHeight. The layout will treat
> its intrinsic size as 0×0.`

To clear the warning:
- attach a recognized content component, or
- set `overrideWidth` / `overrideHeight`, or
- register a custom `ItemHandler` for the SceneObject's content.

## Scale-warp semantic

The "no-handler + override" branch above is sometimes called
*scale-warping*: the layout pass writes a non-uniform `localScale` that
warps everything under the SceneObject. This is intentional for that
exact case (you have *declared* a natural size and want the whole
subtree to scale to match the allocation), but is the wrong default for
recognized content — that's why scale-warp only happens when the user
explicitly opted in via `overrideWidth` / `overrideHeight`.

If you find a child unexpectedly stretched, the SceneObject above it
probably has a `LayoutItem2D` with an override and no handler.
Solutions: drop the override (let the handler pick the natural size),
or insert a recognized content component (the handler's `apply` will
write the size to the right channel without warping the subtree).

## Composite widgets — `measureOverride`

`LayoutItem2D.measureOverride()` is an opt-in subclass hook returning
either a `ContentMeasurement` or `null`. Composite widgets that
aggregate their own internal layout (Tooltip, Dropdown, your own
`LabeledSlider`, …) should override it to report a meaningful
intrinsic size to *their* parent layout without going through the
registry. User overrides and clamps (`overrideWidth`, `minWidth`,
`maxWidth`) still apply on top of the result.

See `Assets/TestScripts/LabeledSliderExample.ts` for a worked example.
