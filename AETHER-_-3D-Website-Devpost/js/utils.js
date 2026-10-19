/* =============================================================
   ÆTHER — small math + timing helpers
   ============================================================= */
(function (root) {
  'use strict';

  var TAU = Math.PI * 2;

  /* Deterministic PRNG so every reload builds the exact same universe. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Cheap approximate gaussian, mean 0, sd ~1. */
  function gauss(rnd) {
    return (rnd() + rnd() + rnd() + rnd() + rnd() + rnd() - 3) / 1.2247;
  }

  /* Uniform point on the unit sphere. */
  function onSphere(rnd, out) {
    var z = rnd() * 2 - 1;
    var a = rnd() * TAU;
    var s = Math.sqrt(Math.max(0, 1 - z * z));
    out[0] = s * Math.cos(a);
    out[1] = z;
    out[2] = s * Math.sin(a);
    return out;
  }

  var clamp  = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var lerp   = function (a, b, t) { return a + (b - a) * t; };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var smoother = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };

  /* Frame-rate independent exponential approach. */
  function damp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
  }

  /* smoothstep with explicit edges */
  function sstep(e0, e1, x) {
    return smooth(clamp((x - e0) / (e1 - e0), 0, 1));
  }

  /* Build an orthonormal basis around a unit vector. */
  function basis(d, t, b) {
    var ax = Math.abs(d[0]) < 0.9 ? 1 : 0;
    var hx = ax, hy = ax ? 0 : 1, hz = 0;
    // t = normalize(cross(h, d))
    t[0] = hy * d[2] - hz * d[1];
    t[1] = hz * d[0] - hx * d[2];
    t[2] = hx * d[1] - hy * d[0];
    var l = Math.hypot(t[0], t[1], t[2]) || 1;
    t[0] /= l; t[1] /= l; t[2] /= l;
    // b = cross(d, t)
    b[0] = d[1] * t[2] - d[2] * t[1];
    b[1] = d[2] * t[0] - d[0] * t[2];
    b[2] = d[0] * t[1] - d[1] * t[0];
    return t;
  }

  /* Tilt a unit vector `d` away from itself by `angle`, spun to `az`. */
  var _t = [0, 0, 0], _b = [0, 0, 0];
  function tilt(d, angle, az, out) {
    basis(d, _t, _b);
    var c = Math.cos(angle), s = Math.sin(angle);
    var ca = Math.cos(az), sa = Math.sin(az);
    out[0] = c * d[0] + s * (ca * _t[0] + sa * _b[0]);
    out[1] = c * d[1] + s * (ca * _t[1] + sa * _b[1]);
    out[2] = c * d[2] + s * (ca * _t[2] + sa * _b[2]);
    var l = Math.hypot(out[0], out[1], out[2]) || 1;
    out[0] /= l; out[1] /= l; out[2] /= l;
    return out;
  }

  /* Binary search into a cumulative-weight table. */
  function pickWeighted(cum, r) {
    var lo = 0, hi = cum.length - 1;
    var x = r * cum[hi];
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  root.AE = root.AE || {};
  root.AE.util = {
    TAU: TAU,
    mulberry32: mulberry32,
    gauss: gauss,
    onSphere: onSphere,
    clamp: clamp,
    lerp: lerp,
    smooth: smooth,
    smoother: smoother,
    damp: damp,
    sstep: sstep,
    tilt: tilt,
    pickWeighted: pickWeighted
  };
})(window);
