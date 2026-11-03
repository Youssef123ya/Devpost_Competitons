/**
 * tests/color.test.js
 *
 * Pure-function tests for dist/color.js using node:test.
 *
 * WCAG 2.1 numerical examples sourced from the spec itself and
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * These tests run in Node without a DOM. No browser control framework needed.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, luminance, contrastRatio, recommendTextColor } from '../dist/color.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert two numbers are close to within a tolerance. */
function assertNear(actual, expected, tolerance = 0.001, message = '') {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message || ''} expected ${expected} ± ${tolerance}, got ${actual}`
  );
}

// ---------------------------------------------------------------------------
// parseColor
// ---------------------------------------------------------------------------

describe('parseColor — named colors', () => {
  test('black → {r:0,g:0,b:0,a:1}', () => {
    const c = parseColor('black');
    assert.deepEqual(c, { r: 0, g: 0, b: 0, a: 1 });
  });

  test('white → {r:255,g:255,b:255,a:1}', () => {
    const c = parseColor('white');
    assert.deepEqual(c, { r: 255, g: 255, b: 255, a: 1 });
  });

  test('red → {r:255,g:0,b:0,a:1}', () => {
    const c = parseColor('red');
    assert.deepEqual(c, { r: 255, g: 0, b: 0, a: 1 });
  });

  test('transparent → {r:0,g:0,b:0,a:0}', () => {
    const c = parseColor('transparent');
    assert.deepEqual(c, { r: 0, g: 0, b: 0, a: 0 });
  });

  test('case-insensitive: BLACK', () => {
    const c = parseColor('BLACK');
    assert.deepEqual(c, { r: 0, g: 0, b: 0, a: 1 });
  });

  test('rebeccapurple → {r:102,g:51,b:153,a:1}', () => {
    const c = parseColor('rebeccapurple');
    assert.deepEqual(c, { r: 102, g: 51, b: 153, a: 1 });
  });
});

describe('parseColor — hex colors', () => {
  test('#000000 → black', () => {
    assert.deepEqual(parseColor('#000000'), { r: 0, g: 0, b: 0, a: 1 });
  });

  test('#ffffff → white', () => {
    assert.deepEqual(parseColor('#ffffff'), { r: 255, g: 255, b: 255, a: 1 });
  });

  test('#FFFFFF (uppercase) → white', () => {
    assert.deepEqual(parseColor('#FFFFFF'), { r: 255, g: 255, b: 255, a: 1 });
  });

  test('#f00 (3-digit) → red', () => {
    assert.deepEqual(parseColor('#f00'), { r: 255, g: 0, b: 0, a: 1 });
  });

  test('#aabbcc → correct channels', () => {
    assert.deepEqual(parseColor('#aabbcc'), { r: 170, g: 187, b: 204, a: 1 });
  });

  test('#00000000 (8-digit, fully transparent black)', () => {
    const c = parseColor('#00000000');
    assert.equal(c.r, 0);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assertNear(c.a, 0, 0.005);
  });

  test('#ffffffff (8-digit, fully opaque white)', () => {
    const c = parseColor('#ffffffff');
    assert.equal(c.r, 255);
    assert.equal(c.g, 255);
    assert.equal(c.b, 255);
    assertNear(c.a, 1, 0.005);
  });

  test('#ffffff80 (8-digit, 50% alpha white)', () => {
    const c = parseColor('#ffffff80');
    assert.equal(c.r, 255);
    assert.equal(c.g, 255);
    assert.equal(c.b, 255);
    // 0x80 = 128 / 255 ≈ 0.502
    assertNear(c.a, 0.502, 0.005);
  });

  test('#f004 (4-digit hex, 50% transparent red)', () => {
    const c = parseColor('#f004');
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assertNear(c.a, 0.267, 0.01); // 0x44/255 ≈ 0.267
  });
});

describe('parseColor — rgb() / rgba()', () => {
  test('rgb(0,0,0)', () => {
    assert.deepEqual(parseColor('rgb(0,0,0)'), { r: 0, g: 0, b: 0, a: 1 });
  });

  test('rgb(255, 255, 255)', () => {
    assert.deepEqual(parseColor('rgb(255, 255, 255)'), { r: 255, g: 255, b: 255, a: 1 });
  });

  test('rgba(0, 0, 0, 0)', () => {
    assert.deepEqual(parseColor('rgba(0, 0, 0, 0)'), { r: 0, g: 0, b: 0, a: 0 });
  });

  test('rgba(255, 255, 255, 0.5)', () => {
    const c = parseColor('rgba(255, 255, 255, 0.5)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 255);
    assert.equal(c.b, 255);
    assert.equal(c.a, 0.5);
  });

  test('rgba(0, 0, 0, 1)', () => {
    assert.deepEqual(parseColor('rgba(0, 0, 0, 1)'), { r: 0, g: 0, b: 0, a: 1 });
  });

  test('rgb with percentages: rgb(100%, 0%, 0%)', () => {
    const c = parseColor('rgb(100%, 0%, 0%)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assert.equal(c.a, 1);
  });

  test('rgba with percentage alpha: rgba(0,0,0,50%)', () => {
    const c = parseColor('rgba(0,0,0,50%)');
    assert.equal(c.r, 0);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assert.equal(c.a, 0.5);
  });
});

describe('parseColor — hsl() / hsla()', () => {
  test('hsl(0, 100%, 50%) = red', () => {
    const c = parseColor('hsl(0, 100%, 50%)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assert.equal(c.a, 1);
  });

  test('hsl(120, 100%, 50%) = lime', () => {
    const c = parseColor('hsl(120, 100%, 50%)');
    assert.equal(c.r, 0);
    assert.equal(c.g, 255);
    assert.equal(c.b, 0);
  });

  test('hsl(240, 100%, 50%) = blue', () => {
    const c = parseColor('hsl(240, 100%, 50%)');
    assert.equal(c.r, 0);
    assert.equal(c.g, 0);
    assert.equal(c.b, 255);
  });

  test('hsl(0, 0%, 0%) = black', () => {
    const c = parseColor('hsl(0, 0%, 0%)');
    assert.equal(c.r, 0);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
  });

  test('hsl(0, 0%, 100%) = white', () => {
    const c = parseColor('hsl(0, 0%, 100%)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 255);
    assert.equal(c.b, 255);
  });

  test('hsla(0, 100%, 50%, 0.5) = semi-transparent red', () => {
    const c = parseColor('hsla(0, 100%, 50%, 0.5)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
    assert.equal(c.a, 0.5);
  });

  test('hsl(360, 100%, 50%) wraps to red', () => {
    const c = parseColor('hsl(360, 100%, 50%)');
    assert.equal(c.r, 255);
    assert.equal(c.g, 0);
    assert.equal(c.b, 0);
  });
});

describe('parseColor — unsupported / invalid', () => {
  test('returns null for empty string', () => {
    assert.equal(parseColor(''), null);
  });

  test('returns null for non-string (number)', () => {
    assert.equal(parseColor(42), null);
  });

  test('returns null for currentColor', () => {
    assert.equal(parseColor('currentColor'), null);
  });

  test('returns null for inherit', () => {
    assert.equal(parseColor('inherit'), null);
  });

  test('returns null for linear-gradient', () => {
    assert.equal(parseColor('linear-gradient(red, blue)'), null);
  });

  test('returns null for color(display-p3 1 0 0)', () => {
    assert.equal(parseColor('color(display-p3 1 0 0)'), null);
  });

  test('returns null for oklch()', () => {
    assert.equal(parseColor('oklch(50% 0.2 200)'), null);
  });

  test('returns null for var(--color)', () => {
    assert.equal(parseColor('var(--color)'), null);
  });

  test('returns null for partial hex #gg0000', () => {
    assert.equal(parseColor('#gg0000'), null);
  });

  test('returns null for #12345 (5 hex digits)', () => {
    assert.equal(parseColor('#12345'), null);
  });

  test('returns null for unknown name "notacolor"', () => {
    assert.equal(parseColor('notacolor'), null);
  });
});

// ---------------------------------------------------------------------------
// luminance — WCAG 2.1 numerical examples
// ---------------------------------------------------------------------------

describe('luminance — WCAG 2.1 reference values', () => {
  // WCAG 2.1 examples from the spec (Table 1):
  // Black: 0, White: 1

  test('black has luminance 0', () => {
    assertNear(luminance({ r: 0, g: 0, b: 0 }), 0.0, 0.0001, 'black luminance');
  });

  test('white has luminance 1', () => {
    assertNear(luminance({ r: 255, g: 255, b: 255 }), 1.0, 0.0001, 'white luminance');
  });

  // Pure red: WCAG formula → 0.2126
  test('pure red has luminance ≈ 0.2126', () => {
    assertNear(luminance({ r: 255, g: 0, b: 0 }), 0.2126, 0.001, 'red luminance');
  });

  // Pure green: 0.7152
  test('pure green has luminance ≈ 0.7152', () => {
    assertNear(luminance({ r: 0, g: 255, b: 0 }), 0.7152, 0.001, 'green luminance');
  });

  // Pure blue: 0.0722
  test('pure blue has luminance ≈ 0.0722', () => {
    assertNear(luminance({ r: 0, g: 0, b: 255 }), 0.0722, 0.001, 'blue luminance');
  });

  // Mid gray (128,128,128) — linearized sRGB: (128/255) ≈ 0.502
  // (0.502 + 0.055) / 1.055 ^ 2.4 ≈ 0.2158, × 1.0 ≈ 0.2158
  test('mid gray (128,128,128) has luminance ≈ 0.216', () => {
    assertNear(luminance({ r: 128, g: 128, b: 128 }), 0.216, 0.002, 'mid gray luminance');
  });

  // Threshold region: sRGB 0.04045 maps to linear / 12.92
  // channel = 10 / 255 ≈ 0.0392 < 0.04045 → linear = 0.0392/12.92 ≈ 0.00303
  test('dark channel (10) uses linear low-end formula', () => {
    const lum = luminance({ r: 10, g: 10, b: 10 });
    // All three channels equal, so lum = channel_linear * (0.2126+0.7152+0.0722)
    // channel_linear = (10/255)/12.92 ≈ 0.003035
    assertNear(lum, 0.003, 0.001, 'dark channel luminance');
  });
});

// ---------------------------------------------------------------------------
// contrastRatio — WCAG 2.1 examples
// ---------------------------------------------------------------------------

describe('contrastRatio — known WCAG values', () => {
  // Black on white = 21:1 (the maximum)
  test('black on white = 21:1', () => {
    assertNear(contrastRatio('#000000', '#ffffff'), 21.0, 0.01, 'black/white');
  });

  // White on black = 21:1 (commutative)
  test('white on black = 21:1', () => {
    assertNear(contrastRatio('#ffffff', '#000000'), 21.0, 0.01, 'white/black');
  });

  // Same color = 1:1
  test('black on black = 1:1', () => {
    assertNear(contrastRatio('#000000', '#000000'), 1.0, 0.01, 'black/black');
  });

  test('white on white = 1:1', () => {
    assertNear(contrastRatio('#ffffff', '#ffffff'), 1.0, 0.01, 'white/white');
  });

  // #595959 (gray) on white: ratio ≈ 7.0:1 (AAA for normal text)
  // Verified: lum(#595959) ≈ 0.1029; (1+0.05)/(0.1029+0.05) ≈ 6.89
  test('#595959 on white passes AA (> 4.5:1)', () => {
    const ratio = contrastRatio('#595959', '#ffffff');
    assert.ok(ratio >= 4.5, `expected ≥ 4.5 got ${ratio}`);
  });

  // #767676 on white: ratio ≈ 4.54:1 (just passes AA for normal text)
  test('#767676 on white is just above 4.5:1', () => {
    const ratio = contrastRatio('#767676', '#ffffff');
    assert.ok(ratio >= 4.5, `expected ≥ 4.5, got ${ratio}`);
    assert.ok(ratio < 7.0, `expected < 7.0, got ${ratio}`);
  });

  // #777777 on white: ratio ≈ 4.48:1 (just fails AA)
  test('#777777 on white is just below 4.5:1', () => {
    const ratio = contrastRatio('#777777', '#ffffff');
    assert.ok(ratio < 4.5, `expected < 4.5, got ${ratio}`);
  });

  // Red on white — documented failing contrast for typical body text
  test('red on white < 4.5:1 (fails normal text)', () => {
    const ratio = contrastRatio('red', 'white');
    // Luminance(red) ≈ 0.2126; (1+0.05)/(0.2126+0.05) ≈ 3.998
    assert.ok(ratio < 4.5, `expected < 4.5, got ${ratio}`);
    assert.ok(ratio > 3.0, `expected > 3.0, got ${ratio}`);
  });

  // Symmetric: contrastRatio(a,b) == contrastRatio(b,a)
  test('contrast ratio is symmetric', () => {
    const ab = contrastRatio('#336699', '#ffffff');
    const ba = contrastRatio('#ffffff', '#336699');
    assertNear(ab, ba, 0.0001, 'symmetry');
  });
});

describe('contrastRatio — returns null for unsupported colors', () => {
  test('null when foreground is unparseable', () => {
    assert.equal(contrastRatio('linear-gradient(red,blue)', '#fff'), null);
  });

  test('null when background is unparseable', () => {
    assert.equal(contrastRatio('#000', 'oklch(50% 0.2 200)'), null);
  });

  test('null when both are unparseable', () => {
    assert.equal(contrastRatio('currentColor', 'inherit'), null);
  });
});

describe('contrastRatio — alpha handling', () => {
  // Semi-transparent black over white: composites to a gray
  // rgba(0,0,0,0.5) over white → rgb(128,128,128)
  // luminance(128,128,128) ≈ 0.216; contrast on white ≈ (1.05)/(0.216+0.05) ≈ 3.95
  test('rgba(0,0,0,0.5) fg composited over white bg', () => {
    const ratio = contrastRatio('rgba(0,0,0,0.5)', 'white');
    // Should be less than black-on-white (21:1) but greater than 1:1
    assert.ok(ratio > 1, `expected > 1, got ${ratio}`);
    assert.ok(ratio < 21, `expected < 21, got ${ratio}`);
    // Approximately 3.9-4.0 range
    assertNear(ratio, 3.95, 0.3, 'semi-transparent black on white');
  });

  // Fully transparent foreground over white = white on white = 1:1
  test('rgba(0,0,0,0) (transparent) fg over white = 1:1', () => {
    assertNear(contrastRatio('rgba(0,0,0,0)', 'white'), 1.0, 0.05, 'transparent fg');
  });

  // Fully transparent background: composited over white = white bg
  test('semi-transparent white background treated as composited over white', () => {
    // rgba(255,255,255,0.5) bg over white → effectively white
    const ratio = contrastRatio('#000000', 'rgba(255,255,255,0.5)');
    // Should be high contrast (black text on near-white bg)
    assert.ok(ratio > 10, `expected > 10, got ${ratio}`);
  });
});

// ---------------------------------------------------------------------------
// recommendTextColor
// ---------------------------------------------------------------------------

describe('recommendTextColor', () => {
  test('returns #000000 for white background', () => {
    assert.equal(recommendTextColor('white'), '#000000');
  });

  test('returns #000000 for very light gray', () => {
    assert.equal(recommendTextColor('#eeeeee'), '#000000');
  });

  test('returns #ffffff for black background', () => {
    assert.equal(recommendTextColor('black'), '#ffffff');
  });

  test('returns #ffffff for dark background #1a1a1a', () => {
    assert.equal(recommendTextColor('#1a1a1a'), '#ffffff');
  });

  // Mid-gray: luminance ≈ 0.216. contrastRatio(black, #808080) ≈ 3.95, contrastRatio(white, #808080) ≈ 5.32
  // So white should win on mid-gray background
  test('returns #000000 for mid-gray (#808080), which has higher contrast than white', () => {
    assert.equal(recommendTextColor('#808080'), '#000000');
  });

  // A known case: dark olive green from demo (#29372b)
  test('returns #ffffff for dark green (#29372b)', () => {
    assert.equal(recommendTextColor('#29372b'), '#ffffff');
  });

  // Unparseable background defaults to #000000
  test('returns #000000 for unparseable background', () => {
    assert.equal(recommendTextColor('currentColor'), '#000000');
  });

  // The two choices are mutually exclusive — we always get one of the two
  test('always returns either #000000 or #ffffff', () => {
    for (const bg of ['red', 'blue', 'green', '#abc', 'hsl(200,50%,50%)']) {
      const result = recommendTextColor(bg);
      assert.ok(
        result === '#000000' || result === '#ffffff',
        `expected #000000 or #ffffff for ${bg}, got ${result}`
      );
    }
  });
});
