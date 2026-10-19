/* =============================================================
   ÆTHER — the six forms

   Every form is a pure function that fills a Float32Array with
   4 floats per particle:  x, y, z, size-weight.
   No models, no textures, no downloads — only mathematics.
   ============================================================= */
(function (root) {
  'use strict';

  var U = root.AE.util;
  var TAU = U.TAU, gauss = U.gauss, onSphere = U.onSphere, tilt = U.tilt;

  var v = [0, 0, 0];

  /* ---------------------------------------------------------------
     00 · VOID — formless drift.
     A wide, flattened haze with a few dozen faint density knots,
     so the emptiness still has weather in it.
     --------------------------------------------------------------- */
  function formVoid(a, N, rnd) {
    var KNOTS = 34, knots = [];
    for (var k = 0; k < KNOTS; k++) {
      onSphere(rnd, v);
      var kr = 18 + 34 * Math.pow(rnd(), 0.6);
      knots.push([v[0] * kr, v[1] * kr * 0.42, v[2] * kr, 3 + rnd() * 7]);
    }
    for (var i = 0; i < N; i++) {
      var o = i * 4, x, y, z;
      if (rnd() < 0.44) {
        var K = knots[(rnd() * KNOTS) | 0];
        onSphere(rnd, v);
        var d = K[3] * Math.pow(rnd(), 0.55);
        x = K[0] + v[0] * d; y = K[1] + v[1] * d; z = K[2] + v[2] * d;
      } else {
        onSphere(rnd, v);
        var r = 16 + 46 * Math.pow(rnd(), 0.8);
        x = v[0] * r * 1.2; y = v[1] * r * 0.44; z = v[2] * r * 1.2;
      }
      a[o] = x; a[o + 1] = y; a[o + 2] = z;
      a[o + 3] = 0.42 + rnd() * 0.58;
    }
  }

  /* ---------------------------------------------------------------
     01 · SPARK — ignition.
     A hot, over-dense core inside a thin shell, pierced by
     a handful of solar flares.
     --------------------------------------------------------------- */
  function formSpark(a, N, rnd) {
    var R = 4.7, FLARES = 28, dirs = [];
    for (var f = 0; f < FLARES; f++) dirs.push(onSphere(rnd, [0, 0, 0]));

    for (var i = 0; i < N; i++) {
      var o = i * 4, p = rnd(), x, y, z, s;

      if (p < 0.07) {                                  /* flares */
        var d = dirs[(rnd() * FLARES) | 0];
        var t = R + 17 * Math.pow(rnd(), 1.7);
        var j = 0.35 + t * 0.055;
        x = d[0] * t + gauss(rnd) * j;
        y = d[1] * t + gauss(rnd) * j;
        z = d[2] * t + gauss(rnd) * j;
        s = 0.45 + rnd() * 0.65;
      } else if (p < 0.46) {                           /* molten interior */
        onSphere(rnd, v);
        var ri = R * Math.pow(rnd(), 2.8);
        x = v[0] * ri; y = v[1] * ri; z = v[2] * ri;
        s = 0.5 + (1 - ri / R) * 0.85;
      } else {                                         /* shell + corona */
        onSphere(rnd, v);
        var rs = R + gauss(rnd) * 0.35 + Math.pow(rnd(), 5) * 4.5;
        x = v[0] * rs; y = v[1] * rs; z = v[2] * rs;
        s = 0.4 + rnd() * 0.6;
      }
      a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = s;
    }
  }

  /* ---------------------------------------------------------------
     02 · BLOOM — a barred spiral.
     Five arms wound by a radius-dependent twist, a fat bulge,
     and a sparse halo of globular strays.
     --------------------------------------------------------------- */
  function formBloom(a, N, rnd) {
    var R = 25, ARMS = 5, TWIST = 3.05;

    for (var i = 0; i < N; i++) {
      var o = i * 4, p = rnd();

      if (p < 0.075) {                                 /* halo */
        onSphere(rnd, v);
        var rh = R * (0.55 + 0.75 * Math.pow(rnd(), 0.55));
        a[o] = v[0] * rh; a[o + 1] = v[1] * rh * 0.6; a[o + 2] = v[2] * rh;
        a[o + 3] = 0.3 + rnd() * 0.4;
        continue;
      }
      if (p < 0.20) {                                  /* central bulge */
        onSphere(rnd, v);
        var rb = 4.6 * Math.pow(rnd(), 1.8);
        a[o] = v[0] * rb; a[o + 1] = v[1] * rb * 0.62; a[o + 2] = v[2] * rb;
        a[o + 3] = 0.5 + (1 - rb / 4.6) * 0.7;
        continue;
      }

      if (p < 0.32) {                                  /* smooth inter-arm disc */
        var rd = Math.pow(rnd(), 0.5) * R;
        var ad = rnd() * TAU;
        a[o]     = Math.cos(ad) * rd;
        a[o + 1] = gauss(rnd) * (0.25 + 1.7 * Math.exp(-rd * rd / 60));
        a[o + 2] = Math.sin(ad) * rd;
        a[o + 3] = 0.2 + rnd() * 0.28;
        continue;
      }

      var rr = Math.pow(rnd(), 0.52) * R;              /* disc + arms */
      var arm = (((rnd() * ARMS) | 0) / ARMS) * TAU;
      var ang = arm + (rr / R) * TWIST + gauss(rnd) * 0.10;

      var spread = 0.35 + rr * 0.085;
      var thick = 0.35 + 2.4 * Math.exp(-rr * rr / 46);

      a[o]     = Math.cos(ang) * rr + gauss(rnd) * spread;
      a[o + 1] = gauss(rnd) * thick * 0.5;
      a[o + 2] = Math.sin(ang) * rr + gauss(rnd) * spread;
      a[o + 3] = 0.38 + rnd() * 0.5 + Math.max(0, 0.6 * (1 - rr / 7));
    }
  }

  /* ---------------------------------------------------------------
     03 · HELIX — the moment matter starts keeping notes.
     Two antiparallel sugar strands plus discrete base-pair rungs.
     --------------------------------------------------------------- */
  function formHelix(a, N, rnd) {
    var H = 28, TURNS = 3.0, R = 4.5, RUNGS = 84;

    for (var i = 0; i < N; i++) {
      var o = i * 4, p = rnd();

      if (p < 0.10) {                                  /* ambient motes */
        onSphere(rnd, v);
        var rr = 9 + 22 * Math.pow(rnd(), 0.7);
        a[o] = v[0] * rr; a[o + 1] = v[1] * rr * 1.1; a[o + 2] = v[2] * rr;
        a[o + 3] = 0.25 + rnd() * 0.35;
        continue;
      }

      if (p < 0.30) {                                  /* base pairs */
        var ri = (rnd() * RUNGS) | 0;
        var tt = ri / (RUNGS - 1);
        var yr = (tt - 0.5) * H, ar = tt * TURNS * TAU;
        var u = rnd() * 2 - 1;
        /* leave a gap in the middle so the pairs read as two half-rungs */
        u = u < 0 ? -0.15 - 0.85 * Math.abs(u) : 0.15 + 0.85 * u;
        a[o]     = Math.cos(ar) * R * u + gauss(rnd) * 0.09;
        a[o + 1] = yr + gauss(rnd) * 0.09;
        a[o + 2] = Math.sin(ar) * R * u + gauss(rnd) * 0.09;
        a[o + 3] = 0.32 + rnd() * 0.35;
        continue;
      }

      if (p < 0.46) {                                  /* sheath around it all */
        var ta = rnd();
        var ya = (ta - 0.5) * H * 1.06;
        var aa = rnd() * TAU;
        var ra = R * (0.25 + 1.5 * Math.pow(rnd(), 0.7));
        a[o]     = Math.cos(aa) * ra;
        a[o + 1] = ya + gauss(rnd) * 0.6;
        a[o + 2] = Math.sin(aa) * ra;
        a[o + 3] = 0.2 + rnd() * 0.32;
        continue;
      }

      var t = rnd();                                   /* the two strands */
      var y = (t - 0.5) * H;
      var ang = t * TURNS * TAU + (p < 0.73 ? 0 : Math.PI);
      var rj = R + gauss(rnd) * 0.34;
      a[o]     = Math.cos(ang) * rj;
      a[o + 1] = y + gauss(rnd) * 0.20;
      a[o + 2] = Math.sin(ang) * rj;
      a[o + 3] = 0.45 + rnd() * 0.45;
    }
  }

  /* ---------------------------------------------------------------
     04 · ARBOR — recursive growth.
     An L-system-ish tree grown once, then dressed in particles:
     wood along the segments, foliage in blobs at the tips.
     --------------------------------------------------------------- */
  function growTree(rnd) {
    var segs = [], nd = [0, 0, 0];

    function grow(px, py, pz, dx, dy, dz, len, rad, depth) {
      var qx = px + dx * len, qy = py + dy * len, qz = pz + dz * len;
      segs.push([px, py, pz, qx, qy, qz, rad, depth]);
      if (depth >= 9 || len < 0.30) return;

      var kids = depth < 2 ? 2 : (rnd() < 0.30 ? 3 : 2);
      var baseAz = rnd() * TAU;
      for (var i = 0; i < kids; i++) {
        var spread = 0.34 + rnd() * 0.40;
        var az = baseAz + (i / kids) * TAU + gauss(rnd) * 0.35;
        tilt([dx, dy, dz], spread, az, nd);
        /* phototropism: everything leans a little toward the sky */
        var ux = nd[0], uy = nd[1] + 0.20, uz = nd[2];
        var l = Math.hypot(ux, uy, uz) || 1;
        grow(qx, qy, qz, ux / l, uy / l, uz / l,
             len * (0.68 + rnd() * 0.14), rad * 0.66, depth + 1);
      }
    }
    grow(0, -13.5, 0, 0, 1, 0, 6.4, 1.05, 0);
    return segs;
  }

  function formArbor(a, N, rnd) {
    var segs = growTree(rnd);
    var n = segs.length;

    /* cumulative length table for even wood distribution */
    var cum = new Float32Array(n), acc = 0, tips = [];
    for (var s = 0; s < n; s++) {
      var g = segs[s];
      var L = Math.hypot(g[3] - g[0], g[4] - g[1], g[5] - g[2]);
      acc += L * (0.05 + g[6] * g[6] * 2.6);
      cum[s] = acc;
      if (g[7] >= 6) tips.push(g);
    }
    if (!tips.length) tips = segs;

    for (var i = 0; i < N; i++) {
      var o = i * 4, p = rnd();

      if (p < 0.055) {                                 /* ground haze + roots */
        var ang = rnd() * TAU;
        var rr = 2 + 17 * Math.sqrt(rnd());
        a[o]     = Math.cos(ang) * rr;
        a[o + 1] = -13.5 + Math.pow(rnd(), 2.4) * 11 - rnd() * 0.8;
        a[o + 2] = Math.sin(ang) * rr;
        a[o + 3] = 0.22 + rnd() * 0.3;
        continue;
      }

      if (p < 0.44) {                                  /* wood */
        var si = U.pickWeighted(cum, rnd());
        var b = segs[si];
        var t = rnd();
        var cx = b[0] + (b[3] - b[0]) * t;
        var cy = b[1] + (b[4] - b[1]) * t;
        var cz = b[2] + (b[5] - b[2]) * t;
        onSphere(rnd, v);
        var rad = b[6] * (0.35 + 0.65 * Math.sqrt(rnd()));
        a[o]     = cx + v[0] * rad;
        a[o + 1] = cy + v[1] * rad * 0.5;
        a[o + 2] = cz + v[2] * rad;
        a[o + 3] = 0.42 + rnd() * 0.45 + (1 - b[7] / 9) * 0.4;
        continue;
      }

      var tip = tips[(rnd() * tips.length) | 0];       /* foliage */
      onSphere(rnd, v);
      var d = 3.2 * Math.pow(rnd(), 0.42);
      a[o]     = tip[3] + v[0] * d;
      a[o + 1] = tip[4] + v[1] * d * 0.85;
      a[o + 2] = tip[5] + v[2] * d;
      a[o + 3] = 0.22 + rnd() * 0.42;
    }
  }

  /* ---------------------------------------------------------------
     05 · ÆTHER — matter organised well enough to name itself.
     The word is rasterised to an offscreen canvas, then its lit
     pixels become particle coordinates. A thin halo ring and a
     deep starfield frame it.
     --------------------------------------------------------------- */
  function formWord(a, N, rnd, word) {
    var CW = 1600, CH = 460;
    var cv = document.createElement('canvas');
    cv.width = CW; cv.height = CH;
    var c = cv.getContext('2d', { willReadFrequently: true });

    c.fillStyle = '#000';
    c.fillRect(0, 0, CW, CH);
    c.fillStyle = '#fff';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    try { c.letterSpacing = '10px'; } catch (e) { /* older browsers */ }

    var size = 340;
    var font = function (s) {
      return '600 ' + s + 'px "Cormorant Garamond", Georgia, "Times New Roman", serif';
    };
    c.font = font(size);
    while (c.measureText(word).width > CW * 0.86 && size > 48) {
      size -= 6;
      c.font = font(size);
    }
    c.fillText(word, CW / 2, CH / 2 + 4);

    /* harvest lit pixels */
    var px = c.getImageData(0, 0, CW, CH).data;
    var xs = [], ys = [];
    for (var y = 0; y < CH; y += 1) {
      var row = y * CW;
      for (var x = 0; x < CW; x += 1) {
        if (px[(row + x) * 4] > 120) { xs.push(x); ys.push(y); }
      }
    }
    var M = xs.length;
    var scale = 33 / CW;

    for (var i = 0; i < N; i++) {
      var o = i * 4, p = rnd();

      if (M && p < 0.50) {                             /* the word */
        var k = (rnd() * M) | 0;
        a[o]     = (xs[k] + rnd() - 0.5 - CW / 2) * scale;
        a[o + 1] = -(ys[k] + rnd() - 0.5 - CH / 2) * scale;
        a[o + 2] = gauss(rnd) * 0.45;
        a[o + 3] = 0.42 + rnd() * 0.5;
        continue;
      }

      if (p < 0.70) {                                  /* the ring that frames it */
        var ang = rnd() * TAU;
        var rr = 1 + gauss(rnd) * 0.014;
        a[o]     = Math.cos(ang) * 24.5 * rr;
        a[o + 1] = Math.sin(ang) * 11.0 * rr;
        a[o + 2] = gauss(rnd) * 1.6;
        a[o + 3] = 0.22 + rnd() * 0.34;
        continue;
      }

      onSphere(rnd, v);                                /* deep field */
      var r = 48 + 55 * Math.pow(rnd(), 0.5);
      a[o] = v[0] * r; a[o + 1] = v[1] * r * 0.8; a[o + 2] = v[2] * r - 20;
      a[o + 3] = 0.16 + rnd() * 0.34;
    }
  }

  root.AE.forms = [
    { key: 'Void',  build: formVoid },
    { key: 'Spark', build: formSpark },
    { key: 'Bloom', build: formBloom },
    { key: 'Helix', build: formHelix },
    { key: 'Arbor', build: formArbor },
    { key: 'Æther', build: function (a, N, rnd) { formWord(a, N, rnd, 'ÆTHER'); } }
  ];
})(window);
