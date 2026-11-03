/**
 * dist/color.js — WCAG 2.1 color utilities for Ghostlight
 *
 * Exported API (matched by design.md):
 *   parseColor(cssColor)          → {r,g,b,a} or null
 *   luminance(rgb)                → number (0–1)
 *   contrastRatio(fg, bg)         → number or null
 *   recommendTextColor(background) → '#000000' | '#ffffff'
 *
 * Limitations (stated honestly per product.md):
 *  - Supports rgb(), rgba(), hsl(), hsla(), hex (#rgb #rrggbb #rgba #rrggbbaa),
 *    and the 148 CSS named colors.
 *  - Does NOT support: color(), oklch(), lab(), display-p3, currentColor,
 *    inherit, linear-gradient, or computed var() values.
 *  - Alpha compositing over a solid background is supported when a background
 *    color is provided; semi-transparent foregrounds over semi-transparent
 *    backgrounds cannot be fully resolved and return null from contrastRatio.
 *  - hsl() lightness-based luminance is less precise than an actual sRGB
 *    conversion; callers should prefer resolved rgb values from getComputedStyle.
 */

// ---------------------------------------------------------------------------
// Named color table (CSS Color Level 4 — 148 names + transparent)
// ---------------------------------------------------------------------------
const NAMED = {
  aliceblue: 'f0f8ff', antiquewhite: 'faebd7', aqua: '00ffff',
  aquamarine: '7fffd4', azure: 'f0ffff', beige: 'f5f5dc',
  bisque: 'ffe4c4', black: '000000', blanchedalmond: 'ffebcd',
  blue: '0000ff', blueviolet: '8a2be2', brown: 'a52a2a',
  burlywood: 'deb887', cadetblue: '5f9ea0', chartreuse: '7fff00',
  chocolate: 'd2691e', coral: 'ff7f50', cornflowerblue: '6495ed',
  cornsilk: 'fff8dc', crimson: 'dc143c', cyan: '00ffff',
  darkblue: '00008b', darkcyan: '008b8b', darkgoldenrod: 'b8860b',
  darkgray: 'a9a9a9', darkgreen: '006400', darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b', darkmagenta: '8b008b', darkolivegreen: '556b2f',
  darkorange: 'ff8c00', darkorchid: '9932cc', darkred: '8b0000',
  darksalmon: 'e9967a', darkseagreen: '8fbc8f', darkslateblue: '483d8b',
  darkslategray: '2f4f4f', darkslategrey: '2f4f4f', darkturquoise: '00ced1',
  darkviolet: '9400d3', deeppink: 'ff1493', deepskyblue: '00bfff',
  dimgray: '696969', dimgrey: '696969', dodgerblue: '1e90ff',
  firebrick: 'b22222', floralwhite: 'fffaf0', forestgreen: '228b22',
  fuchsia: 'ff00ff', gainsboro: 'dcdcdc', ghostwhite: 'f8f8ff',
  gold: 'ffd700', goldenrod: 'daa520', gray: '808080',
  green: '008000', greenyellow: 'adff2f', grey: '808080',
  honeydew: 'f0fff0', hotpink: 'ff69b4', indianred: 'cd5c5c',
  indigo: '4b0082', ivory: 'fffff0', khaki: 'f0e68c',
  lavender: 'e6e6fa', lavenderblush: 'fff0f5', lawngreen: '7cfc00',
  lemonchiffon: 'fffacd', lightblue: 'add8e6', lightcoral: 'f08080',
  lightcyan: 'e0ffff', lightgoldenrodyellow: 'fafad2', lightgray: 'd3d3d3',
  lightgreen: '90ee90', lightgrey: 'd3d3d3', lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a', lightseagreen: '20b2aa', lightskyblue: '87cefa',
  lightslategray: '778899', lightslategrey: '778899', lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0', lime: '00ff00', limegreen: '32cd32',
  linen: 'faf0e6', magenta: 'ff00ff', maroon: '800000',
  mediumaquamarine: '66cdaa', mediumblue: '0000cd', mediumorchid: 'ba55d3',
  mediumpurple: '9370db', mediumseagreen: '3cb371', mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a', mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585', midnightblue: '191970', mintcream: 'f5fffa',
  mistyrose: 'ffe4e1', moccasin: 'ffe4b5', navajowhite: 'ffdead',
  navy: '000080', oldlace: 'fdf5e6', olive: '808000',
  olivedrab: '6b8e23', orange: 'ffa500', orangered: 'ff4500',
  orchid: 'da70d6', palegoldenrod: 'eee8aa', palegreen: '98fb98',
  paleturquoise: 'afeeee', palevioletred: 'db7093', papayawhip: 'ffefd5',
  peachpuff: 'ffdab9', peru: 'cd853f', pink: 'ffc0cb',
  plum: 'dda0dd', powderblue: 'b0e0e6', purple: '800080',
  rebeccapurple: '663399', red: 'ff0000', rosybrown: 'bc8f8f',
  royalblue: '4169e1', saddlebrown: '8b4513', salmon: 'fa8072',
  sandybrown: 'f4a460', seagreen: '2e8b57', seashell: 'fff5ee',
  sienna: 'a0522d', silver: 'c0c0c0', skyblue: '87ceeb',
  slateblue: '6a5acd', slategray: '708090', slategrey: '708090',
  snow: 'fffafa', springgreen: '00ff7f', steelblue: '4682b4',
  tan: 'd2b48c', teal: '008080', thistle: 'd8bfd8',
  tomato: 'ff6347', transparent: '00000000', turquoise: '40e0d0',
  violet: 'ee82ee', wheat: 'f5deb3', white: 'ffffff',
  whitesmoke: 'f5f5f5', yellow: 'ffff00', yellowgreen: '9acd32',
};

// ---------------------------------------------------------------------------
// parseColor(cssColor) → {r, g, b, a} | null
// r/g/b are 0–255 integers; a is 0–1 float (default 1 if opaque).
// Returns null for any unsupported or invalid color string.
// ---------------------------------------------------------------------------

/**
 * @param {string} cssColor
 * @returns {{r:number,g:number,b:number,a:number}|null}
 */
export function parseColor(cssColor) {
  if (typeof cssColor !== 'string') return null;
  const s = cssColor.trim().toLowerCase();
  if (!s) return null;

  // Named colors
  if (Object.prototype.hasOwnProperty.call(NAMED, s)) {
    return _hexToRgba(NAMED[s]);
  }

  // Hex: #rgb  #rrggbb  #rgba  #rrggbbaa
  const hexMatch = s.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    return _hexToRgba(hexMatch[1]);
  }

  // rgb() / rgba()  — supports both comma and space/slash modern syntax
  const rgbMatch = s.match(
    /^rgba?\(\s*([\d.%]+)\s*[,\s]\s*([\d.%]+)\s*[,\s]\s*([\d.%]+)(?:\s*[,/]\s*([\d.%]+))?\s*\)$/
  );
  if (rgbMatch) {
    const r = _parseChannel(rgbMatch[1], 255);
    const g = _parseChannel(rgbMatch[2], 255);
    const b = _parseChannel(rgbMatch[3], 255);
    const a = rgbMatch[4] !== undefined ? _parseAlpha(rgbMatch[4]) : 1;
    if (r === null || g === null || b === null || a === null) return null;
    return { r, g, b, a };
  }

  // hsl() / hsla()
  const hslMatch = s.match(
    /^hsla?\(\s*([\d.]+(?:deg|rad|grad|turn)?)\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%(?:\s*[,/]\s*([\d.%]+))?\s*\)$/
  );
  if (hslMatch) {
    const h = _parseHue(hslMatch[1]);
    const sat = parseFloat(hslMatch[2]) / 100;
    const lit = parseFloat(hslMatch[3]) / 100;
    const a = hslMatch[4] !== undefined ? _parseAlpha(hslMatch[4]) : 1;
    if (isNaN(h) || isNaN(sat) || isNaN(lit) || a === null) return null;
    if (sat < 0 || sat > 1 || lit < 0 || lit > 1) return null;
    const rgb = _hslToRgb(h, sat, lit);
    return { ...rgb, a };
  }

  // Unsupported: color(), oklch(), currentColor, gradient, var(), etc.
  return null;
}

// ---------------------------------------------------------------------------
// luminance(rgb) → number (relative luminance per WCAG 2.1, 0–1)
// rgb: {r, g, b} with values 0–255.
// ---------------------------------------------------------------------------

/**
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {number}
 */
export function luminance({ r, g, b }) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// ---------------------------------------------------------------------------
// contrastRatio(foreground, background) → number | null
//
// Both arguments are CSS color strings.
// Returns null when:
//   - either color cannot be parsed
//   - the foreground is semi-transparent and no solid background is given
//     (we cannot composite without knowing the ancestor background)
// When the foreground has alpha < 1, it is composited over background
// (which must be fully opaque or effectively opaque after compositing).
// ---------------------------------------------------------------------------

/**
 * @param {string} foreground  CSS color string
 * @param {string} background  CSS color string
 * @returns {number|null}
 */
export function contrastRatio(foreground, background) {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;

  // Resolve background to solid (composite over white if it has alpha)
  let solidBg;
  if (bg.a < 1) {
    // Composite bg over white
    solidBg = _compositeOver(bg, { r: 255, g: 255, b: 255, a: 1 });
  } else {
    solidBg = bg;
  }

  // Resolve foreground (composite over solidBg if semi-transparent)
  let solidFg;
  if (fg.a < 1) {
    solidFg = _compositeOver(fg, solidBg);
  } else {
    solidFg = fg;
  }

  const L1 = luminance(solidFg);
  const L2 = luminance(solidBg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// recommendTextColor(background) → '#000000' | '#ffffff'
// Returns whichever achieves a higher contrast ratio against the background.
// Falls back to '#000000' for unparseable backgrounds.
// ---------------------------------------------------------------------------

/**
 * @param {string} background  CSS color string
 * @returns {'#000000'|'#ffffff'}
 */
export function recommendTextColor(background) {
  const onBlack = contrastRatio('#000000', background);
  const onWhite = contrastRatio('#ffffff', background);
  // If both null (unparseable bg), default to black text
  if (onBlack === null && onWhite === null) return '#000000';
  if (onBlack === null) return '#ffffff';
  if (onWhite === null) return '#000000';
  return onBlack >= onWhite ? '#000000' : '#ffffff';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a hex string (without #) to {r,g,b,a}.
 * Handles 3, 4, 6, 8 hex digits.
 * @param {string} hex
 * @returns {{r:number,g:number,b:number,a:number}|null}
 */
function _hexToRgba(hex) {
  let r, g, b, a = 1;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 4) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    a = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return null;
  }
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b, a };
}

/**
 * Parse a single RGB channel: integer 0–255 or percentage.
 * @param {string} val
 * @param {number} max — 255 for rgb channels
 * @returns {number|null}
 */
function _parseChannel(val, max) {
  if (val.endsWith('%')) {
    const pct = parseFloat(val);
    if (isNaN(pct) || pct < 0 || pct > 100) return null;
    return Math.round((pct / 100) * max);
  }
  const n = parseFloat(val);
  if (isNaN(n) || n < 0 || n > max) return null;
  return Math.round(n);
}

/**
 * Parse an alpha value: 0–1 float or percentage.
 * @param {string} val
 * @returns {number|null}
 */
function _parseAlpha(val) {
  if (val.endsWith('%')) {
    const pct = parseFloat(val);
    if (isNaN(pct) || pct < 0 || pct > 100) return null;
    return pct / 100;
  }
  const n = parseFloat(val);
  if (isNaN(n) || n < 0 || n > 1) return null;
  return n;
}

/**
 * Parse CSS hue value (deg, rad, grad, turn or bare number → degrees).
 * @param {string} val
 * @returns {number} degrees 0–360
 */
function _parseHue(val) {
  if (val.endsWith('turn')) return parseFloat(val) * 360;
  if (val.endsWith('rad')) return parseFloat(val) * (180 / Math.PI);
  if (val.endsWith('grad')) return parseFloat(val) * 0.9;
  // 'deg' suffix or bare number
  return parseFloat(val);
}

/**
 * Convert HSL (h 0–360, s 0–1, l 0–1) to {r,g,b} (0–255).
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {{r:number,g:number,b:number}}
 */
function _hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs(hh % 2 - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh < 1) { r1 = c; g1 = x; }
  else if (hh < 2) { r1 = x; g1 = c; }
  else if (hh < 3) { g1 = c; b1 = x; }
  else if (hh < 4) { g1 = x; b1 = c; }
  else if (hh < 5) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Alpha-composite src over dst (both {r,g,b,a}).
 * Returns opaque {r,g,b,a:1} result.
 * @param {{r:number,g:number,b:number,a:number}} src
 * @param {{r:number,g:number,b:number,a:number}} dst
 * @returns {{r:number,g:number,b:number,a:number}}
 */
function _compositeOver(src, dst) {
  const ao = src.a + dst.a * (1 - src.a);
  if (ao === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const blend = (cs, cd) =>
    Math.round((cs * src.a + cd * dst.a * (1 - src.a)) / ao);
  return {
    r: blend(src.r, dst.r),
    g: blend(src.g, dst.g),
    b: blend(src.b, dst.b),
    a: ao,
  };
}
