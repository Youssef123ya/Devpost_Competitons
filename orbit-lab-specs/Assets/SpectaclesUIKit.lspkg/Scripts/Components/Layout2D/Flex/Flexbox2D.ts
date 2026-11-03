// ═══════════════════════════════════════════════════════════════════════════
// Flexbox2D.ts — Pure 2D Flexbox layout engine.
// Zero Lens Studio imports. Depends only on FlexTypes.
//
// Implements CSS Flexbox Level 1 spec (https://www.w3.org/TR/css-flexbox-1/)
//   Sort → hypothetical sizes → line breaking → grow/shrink →
//   main-axis justify → cross-axis line sizes → align-content →
//   align-items/align-self → map to x/y
// ═══════════════════════════════════════════════════════════════════════════

import {
  FlexAlign,
  FlexAlignContent,
  FlexAlignSelf,
  FlexContainerInput,
  FlexDirection,
  FlexItemInput,
  FlexItemOutput,
  FlexJustify,
  FlexLayoutResult,
  FlexWrap,
  FLEX_BASIS_AUTO,
  FLEX_BASIS_MAX_CONTENT,
  FLEX_BASIS_MIN_CONTENT
} from "./FlexTypes"

// ─── Axis Helpers ────────────────────────────────────────────────────────

function isRowDirection(dir: FlexDirection): boolean {
  return dir === FlexDirection.Row || dir === FlexDirection.RowReverse
}

function isReversed(dir: FlexDirection): boolean {
  return dir === FlexDirection.RowReverse || dir === FlexDirection.ColumnReverse
}

function mainSize(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.intrinsicWidth : item.intrinsicHeight
}

function crossSize(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.intrinsicHeight : item.intrinsicWidth
}

function mainMin(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.minWidth : item.minHeight
}

function mainMax(item: FlexItemInput, dir: FlexDirection): number {
  const max = isRowDirection(dir) ? item.maxWidth : item.maxHeight
  return max <= 0 ? Infinity : max
}

function mainContentMin(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.contentMinWidth : item.contentMinHeight
}

function mainContentMax(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.contentMaxWidth : item.contentMaxHeight
}

/**
 * Resolves the effective main-axis minimum used during the shrink pass.
 *
 * CSS `min-width: auto` — when the user hasn't set an explicit main-axis
 * minimum and `flexBasis` is `auto`, the implicit floor is the content's
 * min-content size, not 0. This is what stops a flex item from shrinking
 * its text below the widest unbreakable word.
 *
 * Explicit user clamps and explicit `flex-basis: min-content` / `max-content`
 * always take precedence — those are direct expressions of intent.
 */
function effectiveMainMin(item: FlexItemInput, dir: FlexDirection): number {
  const userMin = mainMin(item, dir)
  if (userMin > 0) return userMin
  if (item.flexBasis === FLEX_BASIS_AUTO) return mainContentMin(item, dir)
  return userMin
}

/**
 * Resolves the flex base size from `flexBasis`, expanding the intrinsic
 * sentinels (`auto`, `min-content`, `max-content`) against the item's
 * three-value content measurement on the main axis.
 */
function resolveFlexBaseSize(item: FlexItemInput, dir: FlexDirection): number {
  if (item.flexBasis >= 0) return item.flexBasis
  if (item.flexBasis === FLEX_BASIS_MIN_CONTENT) {
    const mc = mainContentMin(item, dir)
    return isFinite(mc) ? mc : mainSize(item, dir)
  }
  if (item.flexBasis === FLEX_BASIS_MAX_CONTENT) {
    // An unbounded max-content (e.g. an Element handler reporting max = Infinity)
    // must not flow into the base size: in the shrink pass flexShrink × Infinity
    // poisons the distribution ratio (Infinity / Infinity = NaN). Fall back to the
    // preferred size when max-content is unbounded.
    const mc = mainContentMax(item, dir)
    return isFinite(mc) ? mc : mainSize(item, dir)
  }
  // FLEX_BASIS_AUTO or any other negative value falls back to preferred.
  return mainSize(item, dir)
}

function crossMin(item: FlexItemInput, dir: FlexDirection): number {
  return isRowDirection(dir) ? item.minHeight : item.minWidth
}

function crossMax(item: FlexItemInput, dir: FlexDirection): number {
  const max = isRowDirection(dir) ? item.maxHeight : item.maxWidth
  return max <= 0 ? Infinity : max
}

function mainGap(container: FlexContainerInput): number {
  return isRowDirection(container.direction) ? container.columnGap : container.rowGap
}

function crossGap(container: FlexContainerInput): number {
  return isRowDirection(container.direction) ? container.rowGap : container.columnGap
}

function mainPaddingStart(container: FlexContainerInput): number {
  const dir = container.direction
  if (isRowDirection(dir)) return container.padding.left
  return container.padding.top
}

function mainPaddingEnd(container: FlexContainerInput): number {
  const dir = container.direction
  if (isRowDirection(dir)) return container.padding.right
  return container.padding.bottom
}

function crossPaddingStart(container: FlexContainerInput): number {
  const dir = container.direction
  if (isRowDirection(dir)) return container.padding.top
  return container.padding.left
}

function crossPaddingEnd(container: FlexContainerInput): number {
  const dir = container.direction
  if (isRowDirection(dir)) return container.padding.bottom
  return container.padding.right
}

function containerMainSize(container: FlexContainerInput): number {
  return isRowDirection(container.direction) ? container.width : container.height
}

function containerCrossSize(container: FlexContainerInput): number {
  return isRowDirection(container.direction) ? container.height : container.width
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

// ─── Margin Helpers ───────────────────────────────────────────────────────

function mainMarginStart(item: FlexItemInput, dir: FlexDirection): number {
  if (isRowDirection(dir)) {
    return isReversed(dir) ? item.marginRight : item.marginLeft
  }
  return isReversed(dir) ? item.marginBottom : item.marginTop
}

function mainMarginEnd(item: FlexItemInput, dir: FlexDirection): number {
  if (isRowDirection(dir)) {
    return isReversed(dir) ? item.marginLeft : item.marginRight
  }
  return isReversed(dir) ? item.marginTop : item.marginBottom
}

function mainMarginTotal(item: FlexItemInput, dir: FlexDirection): number {
  return mainMarginStart(item, dir) + mainMarginEnd(item, dir)
}

function crossMarginStart(item: FlexItemInput, dir: FlexDirection): number {
  if (isRowDirection(dir)) {
    return item.marginTop
  }
  return item.marginLeft
}

function crossMarginEnd(item: FlexItemInput, dir: FlexDirection): number {
  if (isRowDirection(dir)) {
    return item.marginBottom
  }
  return item.marginRight
}

function crossMarginTotal(item: FlexItemInput, dir: FlexDirection): number {
  return crossMarginStart(item, dir) + crossMarginEnd(item, dir)
}

// ─── Internal Types ──────────────────────────────────────────────────────

interface SortedItem {
  originalIndex: number
  input: FlexItemInput
  flexBaseSize: number // unclamped flex base size
  clampedMain: number // hypothetical main size = clamp(flexBaseSize, min, max)
  resolvedMain: number // target main size after grow/shrink
  resolvedCross: number
  mainPos: number
  crossPos: number
}

interface FlexLine {
  items: SortedItem[]
  crossExtent: number // resolved cross size for this line
  crossOffset: number // offset within the container cross axis
}

// ─── Main Entry Point ────────────────────────────────────────────────────

/**
 * Runs the CSS Flexbox layout algorithm and returns
 * the computed position and size for each item plus the resolved container dimensions.
 *
 * This is a pure function with zero Lens Studio dependencies — all inputs and
 * outputs are plain data objects.
 *
 * @param container - Container configuration (size, direction, wrapping, alignment, gaps, padding).
 * @param items - Array of item inputs (intrinsic sizes, flex properties, margins, constraints).
 * @returns Layout result with per-item positions/sizes and resolved container dimensions.
 */
export function computeFlexLayout(container: FlexContainerInput, items: readonly FlexItemInput[]): FlexLayoutResult {
  if (items.length === 0) {
    const w = container.width < 0 ? 0 : container.width
    const h = container.height < 0 ? 0 : container.height
    return {items: [], containerWidth: w, containerHeight: h}
  }

  const dir = container.direction

  // ── Step 0: Sort by order (stable) ──────────────────────────────────
  const sorted: SortedItem[] = items.map((input, i) => ({
    originalIndex: i,
    input,
    flexBaseSize: 0,
    clampedMain: 0,
    resolvedMain: 0,
    resolvedCross: 0,
    mainPos: 0,
    crossPos: 0
  }))

  sorted.sort((a, b) => {
    const orderDiff = a.input.order - b.input.order
    if (orderDiff !== 0) return orderDiff
    return a.originalIndex - b.originalIndex
  })

  // ── Step 1: Flex base size + hypothetical main sizes ────────
  for (const item of sorted) {
    const basis = resolveFlexBaseSize(item.input, dir)
    item.flexBaseSize = basis
    item.clampedMain = clamp(basis, effectiveMainMin(item.input, dir), mainMax(item.input, dir))
  }

  // ── Step 2: Collect into flex lines ─────────────────────────
  const lines: FlexLine[] = []
  const mPadStart = mainPaddingStart(container)
  const mPadEnd = mainPaddingEnd(container)
  const mGap = mainGap(container)

  const availableMain = containerMainSize(container)
  const isAutoMain = availableMain < 0
  const innerMain = isAutoMain ? Infinity : availableMain - mPadStart - mPadEnd

  if (container.wrap === FlexWrap.NoWrap || isAutoMain) {
    // Single line
    lines.push({items: [...sorted], crossExtent: 0, crossOffset: 0})
  } else {
    // Multi-line wrapping
    let currentLine: SortedItem[] = []
    let lineMain = 0

    for (const item of sorted) {
      const itemMargins = mainMarginTotal(item.input, dir)
      const itemOuter = item.clampedMain + itemMargins
      const itemOuterWithGap = currentLine.length > 0 ? itemOuter + mGap : itemOuter
      if (currentLine.length > 0 && lineMain + itemOuterWithGap > innerMain) {
        lines.push({items: currentLine, crossExtent: 0, crossOffset: 0})
        currentLine = [item]
        lineMain = itemOuter
      } else {
        currentLine.push(item)
        lineMain += itemOuterWithGap
      }
    }
    if (currentLine.length > 0) {
      lines.push({items: currentLine, crossExtent: 0, crossOffset: 0})
    }
  }

  // If WrapReverse, reverse the line order
  if (container.wrap === FlexWrap.WrapReverse) {
    lines.reverse()
  }

  // ── Step 3: Resolve flexible sizes per line ─────────────────
  for (const line of lines) {
    resolveFlexibleLengths(line.items, innerMain, mGap, dir)
  }

  // ── Step 4: Main-axis positioning per line (justify-content) ─
  for (const line of lines) {
    positionMainAxis(line.items, container, innerMain, mGap, mPadStart)
  }

  // ── Step 5: Cross-axis line sizes ───────────────────────────
  for (const line of lines) {
    let maxCross = 0
    for (const item of line.items) {
      const ic = crossSize(item.input, dir)
      const cMin = crossMin(item.input, dir)
      const cMax = crossMax(item.input, dir)
      const itemCross = clamp(ic, cMin, cMax)
      const itemCrossOuter = itemCross + crossMarginTotal(item.input, dir)
      if (itemCrossOuter > maxCross) maxCross = itemCrossOuter
    }
    line.crossExtent = maxCross
  }

  // ── Step 6: Resolve cross sizes + container auto sizing ─────────────
  const cPadStart = crossPaddingStart(container)
  const cPadEnd = crossPaddingEnd(container)
  const cGap = crossGap(container)

  const totalCrossGaps = lines.length > 1 ? (lines.length - 1) * cGap : 0
  const naturalCrossSum = lines.reduce((sum, l) => sum + l.crossExtent, 0) + totalCrossGaps

  const requestedCross = containerCrossSize(container)
  const isAutoCross = requestedCross < 0
  const innerCross = isAutoCross ? naturalCrossSum : requestedCross - cPadStart - cPadEnd

  // single-line container with definite cross size →
  // the line's cross extent equals the container's inner cross size.
  // This ensures align-items centers items within the full container height.
  if (lines.length === 1 && !isAutoCross) {
    lines[0].crossExtent = innerCross
  }

  // ── Step 7: Align-content (multi-line) ───────────────────────
  distributeLines(lines, container.alignContent, innerCross, cGap, cPadStart)

  // ── Step 8: Align-items / align-self per item ───────────────
  for (const line of lines) {
    for (const item of line.items) {
      const effAlign = resolveAlignSelf(item.input.alignSelf, container.alignItems)
      const ic = crossSize(item.input, dir)
      const cMin = crossMin(item.input, dir)
      const cMax = crossMax(item.input, dir)
      const cmStart = crossMarginStart(item.input, dir)
      const cmEnd = crossMarginEnd(item.input, dir)

      switch (effAlign) {
        case FlexAlign.Start:
          item.resolvedCross = clamp(ic, cMin, cMax)
          item.crossPos = line.crossOffset + cmStart
          break
        case FlexAlign.End:
          item.resolvedCross = clamp(ic, cMin, cMax)
          item.crossPos = line.crossOffset + line.crossExtent - item.resolvedCross - cmEnd
          break
        case FlexAlign.Center:
          item.resolvedCross = clamp(ic, cMin, cMax)
          item.crossPos = line.crossOffset + (line.crossExtent - item.resolvedCross - cmStart - cmEnd) * 0.5 + cmStart
          break
        case FlexAlign.Stretch: {
          const stretchable = line.crossExtent - cmStart - cmEnd
          item.resolvedCross = clamp(stretchable, cMin, cMax)
          item.crossPos = line.crossOffset + cmStart
          break
        }
      }
    }
  }

  // ── Step 8.5: Aspect-ratio main-from-cross transfer ─────────
  // CSS `aspect-ratio` couples the two axes; flexbox otherwise resolves them
  // independently. For an item with a ratio whose main axis is `auto`
  // (flex-basis auto, neither grow nor shrink), derive the main size from the
  // now-resolved cross size (CSS Box Sizing L4 §4). The coupling is
  // bidirectional: if the derived main is clamped (e.g. by maxWidth), the
  // clamp transfers back to the cross so the ratio is preserved instead of
  // leaving a stretched rectangle. When an item's main size changes, the
  // line's grow/shrink + justify positioning are re-run so siblings and
  // spacing stay correct — the aspect items don't grow/shrink, so they
  // re-freeze at the transferred size.
  for (const line of lines) {
    let lineChanged = false
    for (const item of line.items) {
      const ratio = item.input.aspectRatio
      if (!ratio || ratio <= 0) continue
      if (item.input.flexBasis !== FLEX_BASIS_AUTO) continue
      if (item.input.flexGrow !== 0 || item.input.flexShrink !== 0) continue

      // ratio is width/height: row main is width (× ratio), column main is
      // height (÷ ratio).
      const rMain = isRowDirection(dir) ? ratio : 1 / ratio
      // Clamp by the *explicit* user min/max on both axes — symmetric with the
      // cross clamp below. The CSS `min-width: auto` content floor
      // (effectiveMainMin, used by the shrink pass) does NOT apply here: an
      // explicit aspect-ratio takes precedence over the implicit content
      // minimum, so e.g. a square icon can size below its content's natural
      // min-content. If the user's hard min/max on the two axes are mutually
      // incompatible with the ratio, the hard bounds win (the result stays
      // within both axes' min/max) and the ratio yields — no size satisfies both.
      const mMin = mainMin(item.input, dir)
      const mMax = mainMax(item.input, dir)

      let cross = item.resolvedCross
      const mainTent = cross * rMain
      let main = clamp(mainTent, mMin, mMax)
      if (main !== mainTent) {
        // Main was the binding constraint — transfer the clamp back to the
        // cross to hold the ratio, then re-derive main from the new cross.
        cross = clamp(main / rMain, crossMin(item.input, dir), crossMax(item.input, dir))
        main = clamp(cross * rMain, mMin, mMax)
      }

      if (cross !== item.resolvedCross) {
        item.resolvedCross = cross
        // The cross shrank (main was the binding constraint), so re-place the
        // item for alignments whose position depends on the cross size. Start
        // and Stretch sit at the line start and are unaffected.
        const effAlign = resolveAlignSelf(item.input.alignSelf, container.alignItems)
        const cmEnd = crossMarginEnd(item.input, dir)
        if (effAlign === FlexAlign.End) {
          item.crossPos = line.crossOffset + line.crossExtent - item.resolvedCross - cmEnd
        } else if (effAlign === FlexAlign.Center) {
          const cmStart = crossMarginStart(item.input, dir)
          item.crossPos = line.crossOffset + (line.crossExtent - item.resolvedCross - cmStart - cmEnd) * 0.5 + cmStart
        }
      }
      if (main !== item.resolvedMain) {
        item.resolvedMain = main
        item.clampedMain = main
        item.flexBaseSize = main
        lineChanged = true
      }
    }
    if (lineChanged) {
      resolveFlexibleLengths(line.items, innerMain, mGap, dir)
      positionMainAxis(line.items, container, innerMain, mGap, mPadStart)
    }
  }

  // ── Step 9: Map to x/y ──────────────────────────────────────────────
  // Compute resolved container dimensions
  let resolvedContainerWidth: number
  let resolvedContainerHeight: number

  if (isRowDirection(dir)) {
    if (isAutoMain) {
      // auto main (width) = sum of items + margins + gaps + padding
      let maxLineMain = 0
      for (const line of lines) {
        let lineMain = 0
        for (let i = 0; i < line.items.length; i++) {
          if (i > 0) lineMain += mGap
          lineMain += line.items[i].resolvedMain + mainMarginTotal(line.items[i].input, dir)
        }
        if (lineMain > maxLineMain) maxLineMain = lineMain
      }
      resolvedContainerWidth = maxLineMain + mPadStart + mPadEnd
    } else {
      resolvedContainerWidth = container.width
    }

    if (isAutoCross) {
      resolvedContainerHeight = naturalCrossSum + cPadStart + cPadEnd
    } else {
      resolvedContainerHeight = container.height
    }
  } else {
    if (isAutoMain) {
      let maxLineMain = 0
      for (const line of lines) {
        let lineMain = 0
        for (let i = 0; i < line.items.length; i++) {
          if (i > 0) lineMain += mGap
          lineMain += line.items[i].resolvedMain + mainMarginTotal(line.items[i].input, dir)
        }
        if (lineMain > maxLineMain) maxLineMain = lineMain
      }
      resolvedContainerHeight = maxLineMain + mPadStart + mPadEnd
    } else {
      resolvedContainerHeight = container.height
    }

    if (isAutoCross) {
      resolvedContainerWidth = naturalCrossSum + cPadStart + cPadEnd
    } else {
      resolvedContainerWidth = container.width
    }
  }

  // Build output
  const outputItems: FlexItemOutput[] = new Array(items.length)

  for (const line of lines) {
    for (const item of line.items) {
      let x: number
      let y: number
      let w: number
      let h: number

      if (isRowDirection(dir)) {
        x = item.mainPos
        y = item.crossPos
        w = item.resolvedMain
        h = item.resolvedCross
      } else {
        x = item.crossPos
        y = item.mainPos
        w = item.resolvedCross
        h = item.resolvedMain
      }

      outputItems[item.originalIndex] = {
        index: item.originalIndex,
        x,
        y,
        width: w,
        height: h
      }
    }
  }

  return {
    items: outputItems,
    containerWidth: resolvedContainerWidth,
    containerHeight: resolvedContainerHeight
  }
}

// ─── Resolving Flexible Lengths ───────────────────────────────────
//
// Implements the full algorithm from CSS Flexbox Level 1:
//   1. Determine whether growing or shrinking
//   2. Freeze inflexible items + items on wrong side of hypothetical size
//   3. Calculate initial free space
//   4. Loop: distribute free space → clamp → freeze by total violation sign
//
// Key spec details handled:
//   - Uses unclamped flex base size (not hypothetical) for distribution
//   - Scaled flex shrink factor = flexShrink × flexBaseSize
//   - Fractional flex factors (sum < 1): caps distributed space
//   - Total violation approach for freeze decisions (not per-item)

function resolveFlexibleLengths(items: SortedItem[], innerMain: number, gap: number, dir: FlexDirection): void {
  if (!isFinite(innerMain)) {
    // Auto main size: no grow/shrink, use hypothetical main size
    for (const item of items) {
      item.resolvedMain = item.clampedMain
    }
    return
  }

  const totalGaps = items.length > 1 ? (items.length - 1) * gap : 0
  const totalMargins = items.reduce((s, it) => s + mainMarginTotal(it.input, dir), 0)

  // step 1: Determine used flex factor (grow vs shrink)
  const totalOuterHypothetical =
    items.reduce((s, it) => s + it.clampedMain + mainMarginTotal(it.input, dir), 0) + totalGaps
  const growing = totalOuterHypothetical < innerMain

  // Per-item state for the freeze loop
  const n = items.length
  const frozen: boolean[] = new Array(n).fill(false)
  const targetMain: number[] = new Array(n)

  // step 2: Size inflexible items, freeze items on wrong side
  for (let i = 0; i < n; i++) {
    const it = items[i]
    const flexFactor = growing ? it.input.flexGrow : it.input.flexShrink

    if (flexFactor === 0) {
      // Flex factor is zero → freeze at hypothetical main size
      targetMain[i] = it.clampedMain
      frozen[i] = true
    } else if (growing && it.flexBaseSize > it.clampedMain) {
      // Growing but base > hypothetical (already clamped down) → inflexible, freeze
      targetMain[i] = it.clampedMain
      frozen[i] = true
    } else if (!growing && it.flexBaseSize < it.clampedMain) {
      // Shrinking but base < hypothetical (already clamped up) → inflexible, freeze
      targetMain[i] = it.clampedMain
      frozen[i] = true
    } else {
      targetMain[i] = it.flexBaseSize
    }
  }

  // step 3: Calculate initial free space
  let initialFreeSpace = innerMain - totalGaps - totalMargins
  for (let i = 0; i < n; i++) {
    if (frozen[i]) {
      initialFreeSpace -= targetMain[i]
    } else {
      initialFreeSpace -= items[i].flexBaseSize
    }
  }

  // step 4: Loop
  for (let iteration = 0; iteration <= n; iteration++) {
    // 4a: Check for unfrozen items
    let hasUnfrozen = false
    for (let i = 0; i < n; i++) {
      if (!frozen[i]) {
        hasUnfrozen = true
        break
      }
    }
    if (!hasUnfrozen) break

    // 4b: Calculate remaining free space
    let remainingFreeSpace = innerMain - totalGaps - totalMargins
    for (let i = 0; i < n; i++) {
      if (frozen[i]) {
        remainingFreeSpace -= targetMain[i]
      } else {
        remainingFreeSpace -= items[i].flexBaseSize
      }
    }

    // Fractional flex factors: if sum of unfrozen flex factors < 1,
    // multiply initial free space by that sum and use as remaining if smaller in magnitude
    if (growing) {
      let sumFlexFactors = 0
      for (let i = 0; i < n; i++) {
        if (!frozen[i]) sumFlexFactors += items[i].input.flexGrow
      }
      if (sumFlexFactors > 0 && sumFlexFactors < 1) {
        const scaledInitial = initialFreeSpace * sumFlexFactors
        if (Math.abs(scaledInitial) < Math.abs(remainingFreeSpace)) {
          remainingFreeSpace = scaledInitial
        }
      }
    } else {
      let sumFlexFactors = 0
      for (let i = 0; i < n; i++) {
        if (!frozen[i]) sumFlexFactors += items[i].input.flexShrink
      }
      if (sumFlexFactors > 0 && sumFlexFactors < 1) {
        const scaledInitial = initialFreeSpace * sumFlexFactors
        if (Math.abs(scaledInitial) < Math.abs(remainingFreeSpace)) {
          remainingFreeSpace = scaledInitial
        }
      }
    }

    // 4c: Distribute free space
    if (growing) {
      let totalGrowFactor = 0
      for (let i = 0; i < n; i++) {
        if (!frozen[i]) totalGrowFactor += items[i].input.flexGrow
      }

      for (let i = 0; i < n; i++) {
        if (frozen[i]) continue
        if (totalGrowFactor > 0) {
          const ratio = items[i].input.flexGrow / totalGrowFactor
          targetMain[i] = items[i].flexBaseSize + ratio * remainingFreeSpace
        } else {
          targetMain[i] = items[i].flexBaseSize
        }
      }
    } else {
      // Shrink: weighted by scaled flex shrink factor (flexShrink × flexBaseSize)
      let totalWeightedShrink = 0
      for (let i = 0; i < n; i++) {
        if (!frozen[i]) {
          totalWeightedShrink += items[i].input.flexShrink * items[i].flexBaseSize
        }
      }

      for (let i = 0; i < n; i++) {
        if (frozen[i]) continue
        if (totalWeightedShrink > 0) {
          const scaledShrink = items[i].input.flexShrink * items[i].flexBaseSize
          const ratio = scaledShrink / totalWeightedShrink
          // remainingFreeSpace is negative when shrinking
          targetMain[i] = items[i].flexBaseSize + ratio * remainingFreeSpace
        } else {
          targetMain[i] = items[i].flexBaseSize
        }
      }
    }

    // 4d: Fix min/max violations, compute total violation
    let totalViolation = 0
    const minViolation: boolean[] = new Array(n).fill(false)
    const maxViolation: boolean[] = new Array(n).fill(false)

    for (let i = 0; i < n; i++) {
      if (frozen[i]) continue
      const min = effectiveMainMin(items[i].input, dir)
      const max = mainMax(items[i].input, dir)
      const clamped = clamp(targetMain[i], min, max)
      const adjustment = clamped - targetMain[i]
      if (adjustment > 0) {
        minViolation[i] = true
      } else if (adjustment < 0) {
        maxViolation[i] = true
      }
      totalViolation += adjustment
      targetMain[i] = clamped
    }

    // 4e: Freeze based on total violation
    if (Math.abs(totalViolation) < 0.001) {
      // Zero total violation: freeze all unfrozen items
      for (let i = 0; i < n; i++) {
        frozen[i] = true
      }
    } else if (totalViolation > 0) {
      // Positive: freeze items with min violations
      for (let i = 0; i < n; i++) {
        if (!frozen[i] && minViolation[i]) {
          frozen[i] = true
        }
      }
    } else {
      // Negative: freeze items with max violations
      for (let i = 0; i < n; i++) {
        if (!frozen[i] && maxViolation[i]) {
          frozen[i] = true
        }
      }
    }
  }

  // Write final resolved sizes
  for (let i = 0; i < n; i++) {
    items[i].resolvedMain = targetMain[i]
  }
}

// ─── Step 4 Helper: Main-axis Positioning (justify-content) ─

function positionMainAxis(
  items: SortedItem[],
  container: FlexContainerInput,
  innerMain: number,
  gap: number,
  padStart: number
): void {
  const dir = container.direction
  const n = items.length
  const totalItemMain = items.reduce((s, it) => s + it.resolvedMain, 0)
  const totalGaps = n > 1 ? (n - 1) * gap : 0
  const totalMargins = items.reduce((s, it) => s + mainMarginTotal(it.input, dir), 0)
  const usedMain = totalItemMain + totalGaps + totalMargins

  const isAutoMain = !isFinite(innerMain) || containerMainSize(container) < 0
  const effectiveInner = isAutoMain ? usedMain : innerMain
  const freeSpace = effectiveInner - usedMain

  const reversed = isReversed(dir)

  let startOffset: number
  let spacing: number

  switch (container.justifyContent) {
    case FlexJustify.Start:
      startOffset = 0
      spacing = gap
      break
    case FlexJustify.End:
      startOffset = freeSpace
      spacing = gap
      break
    case FlexJustify.Center:
      startOffset = freeSpace * 0.5
      spacing = gap
      break
    case FlexJustify.SpaceBetween:
      if (freeSpace < 0 || n <= 1) {
        // overflow → pack at start; single item → start
        startOffset = 0
        spacing = gap
      } else {
        startOffset = 0
        spacing = (freeSpace + totalGaps) / (n - 1)
      }
      break
    case FlexJustify.SpaceAround:
      if (freeSpace < 0) {
        // overflow → fallback to center
        startOffset = freeSpace * 0.5
        spacing = gap
      } else if (n > 0) {
        spacing = (freeSpace + totalGaps) / n
        startOffset = spacing * 0.5
      } else {
        startOffset = 0
        spacing = gap
      }
      break
    case FlexJustify.SpaceEvenly:
      if (freeSpace < 0) {
        // overflow → fallback to center
        startOffset = freeSpace * 0.5
        spacing = gap
      } else if (n > 0) {
        spacing = (freeSpace + totalGaps) / (n + 1)
        startOffset = spacing
      } else {
        startOffset = 0
        spacing = gap
      }
      break
    default:
      startOffset = 0
      spacing = gap
  }

  if (reversed) {
    // Place from end — for reversed, mainMarginStart/End are already flipped
    let pos = padStart + effectiveInner - startOffset
    for (const item of items) {
      pos -= mainMarginStart(item.input, dir)
      pos -= item.resolvedMain
      item.mainPos = pos
      pos -= mainMarginEnd(item.input, dir)
      pos -= spacing
    }
  } else {
    let pos = padStart + startOffset
    for (const item of items) {
      pos += mainMarginStart(item.input, dir)
      item.mainPos = pos
      pos += item.resolvedMain
      pos += mainMarginEnd(item.input, dir)
      pos += spacing
    }
  }
}

// ─── Step 7 Helper: Distribute Lines (align-content) ────────

function distributeLines(
  lines: FlexLine[],
  alignContent: FlexAlignContent,
  innerCross: number,
  gap: number,
  padStart: number
): void {
  const n = lines.length
  if (n === 0) return

  const totalLineCross = lines.reduce((s, l) => s + l.crossExtent, 0)
  const totalGaps = n > 1 ? (n - 1) * gap : 0
  const usedCross = totalLineCross + totalGaps
  const freeCross = innerCross - usedCross

  let startOffset: number
  let spacing: number

  switch (alignContent) {
    case FlexAlignContent.Start:
      startOffset = 0
      spacing = gap
      break
    case FlexAlignContent.End:
      startOffset = freeCross
      spacing = gap
      break
    case FlexAlignContent.Center:
      startOffset = freeCross * 0.5
      spacing = gap
      break
    case FlexAlignContent.SpaceBetween:
      if (freeCross < 0 || n <= 1) {
        // overflow → pack at start; single line → start
        startOffset = 0
        spacing = gap
      } else {
        startOffset = 0
        spacing = (freeCross + totalGaps) / (n - 1)
      }
      break
    case FlexAlignContent.SpaceAround:
      if (freeCross < 0) {
        // overflow → fallback to center
        startOffset = freeCross * 0.5
        spacing = gap
      } else if (n > 0) {
        spacing = (freeCross + totalGaps) / n
        startOffset = spacing * 0.5
      } else {
        startOffset = 0
        spacing = gap
      }
      break
    case FlexAlignContent.SpaceEvenly:
      if (freeCross < 0) {
        // overflow → fallback to center
        startOffset = freeCross * 0.5
        spacing = gap
      } else if (n > 0) {
        spacing = (freeCross + totalGaps) / (n + 1)
        startOffset = spacing
      } else {
        startOffset = 0
        spacing = gap
      }
      break
    case FlexAlignContent.Stretch: {
      // Distribute extra cross space equally to each line
      const extraPerLine = n > 0 && freeCross > 0 ? freeCross / n : 0
      let pos = padStart
      for (const line of lines) {
        line.crossExtent += extraPerLine
        line.crossOffset = pos
        pos += line.crossExtent + gap
      }
      return
    }
    default:
      startOffset = 0
      spacing = gap
  }

  let pos = padStart + startOffset
  for (const line of lines) {
    line.crossOffset = pos
    pos += line.crossExtent + spacing
  }
}

// ─── Align-self Resolution ───────────────────────────────────────────────

function resolveAlignSelf(alignSelf: FlexAlignSelf, alignItems: FlexAlign): FlexAlign {
  if (alignSelf === FlexAlignSelf.Auto) return alignItems
  // FlexAlignSelf values (excluding Auto) map directly to FlexAlign
  return alignSelf as unknown as FlexAlign
}
