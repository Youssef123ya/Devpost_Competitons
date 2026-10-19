/* =============================================================
   ÆTHER — GLSL

   The morph happens entirely on the GPU. All six target shapes
   live in one RGBA float texture (width = S, height = S * 6).
   Each vertex reads its slot in form A and form B and mixes,
   with a per-particle delay so the cloud dissolves in a wave
   instead of snapping.
   ============================================================= */
(function (root) {
  'use strict';

  /* Hash without sin() — the sin/fract trick moirés badly at
     high fragment coordinates on some drivers. */
  var HASH = [
    'float h21(vec2 p){',
    '  vec3 q = fract(vec3(p.xyx) * 0.1031);',
    '  q += dot(q, q.yzx + 33.33);',
    '  return fract((q.x + q.y) * q.z);',
    '}'
  ].join('\n');

  var CLOUD_VERT = [
    'attribute vec2  aUv;',
    'attribute float aRnd;',   /* transition delay + colour seed */
    'attribute float aRnd2;',  /* size + turbulence seed         */
    'attribute float aRnd3;',  /* brightness seed                */

    'uniform sampler2D uTargets;',
    'uniform float uFormCount;',
    'uniform float uChapter;',
    'uniform float uTime;',
    'uniform float uSize;',
    'uniform float uDpr;',
    'uniform float uScatter;',
    'uniform float uReveal;',
    'uniform float uExposure;',
    'uniform vec3  uMouse;',
    'uniform float uMouseForce;',
    'uniform vec3  uColA1;',
    'uniform vec3  uColA2;',
    'uniform vec3  uColB1;',
    'uniform vec3  uColB2;',

    'varying vec3  vColor;',
    'varying float vGlow;',
    'varying float vFade;',

    'vec4 slot(float f){',
    '  return texture2D(uTargets, vec2(aUv.x, (f + aUv.y) / uFormCount));',
    '}',

    /* two octaves of cheap flow — organic, and almost free */
    'vec3 flow(vec3 p, float t){',
    '  vec3 a = vec3(',
    '    sin(p.y * 0.24 + t * 0.71) + cos(p.z * 0.17 - t * 0.53),',
    '    sin(p.z * 0.21 - t * 0.61) + cos(p.x * 0.19 + t * 0.47),',
    '    sin(p.x * 0.23 + t * 0.57) + cos(p.y * 0.16 - t * 0.67));',
    '  vec3 b = vec3(',
    '    sin(p.z * 0.61 - t * 1.13),',
    '    sin(p.x * 0.57 + t * 1.31),',
    '    sin(p.y * 0.66 - t * 1.07));',
    '  return a + b * 0.42;',
    '}',

    'float ease(float x){ return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }',

    'void main(){',
    '  float last = uFormCount - 1.0;',
    '  float ci   = clamp(uChapter, 0.0, last);',
    '  float fi   = floor(ci);',
    '  float ft   = ci - fi;',

    /* staggered morph: late particles are still leaving as early ones arrive */
    '  const float STAGGER = 0.44;',
    '  float t = ease(clamp((ft - aRnd * STAGGER) / (1.0 - STAGGER), 0.0, 1.0));',

    '  vec4 A = slot(fi);',
    '  vec4 B = slot(min(fi + 1.0, last));',
    '  vec3 pos = mix(A.xyz, B.xyz, t);',
    '  float w  = mix(A.w, B.w, t);',

    /* the cloud comes apart in the middle of every transition */
    '  float burst = pow(sin(3.14159265 * ft), 1.35);',
    '  pos += flow(pos * 0.5, uTime) * burst * (2.0 + aRnd2 * 6.8) * uScatter;',

    /* it is never completely still */
    '  pos += flow(pos * 0.11 + 7.3, uTime * 0.21) * (0.26 + aRnd2 * 0.44);',

    /* before you begin, the whole cloud is one dense nucleus;
       pressing Begin blooms it outward into the void */
    '  float rv = ease(clamp((uReveal - aRnd * 0.45) / 0.55, 0.0, 1.0));',
    '  vec3 seed = normalize(pos + 1e-4) * (2.4 + aRnd2 * 6.8)',
    '            + flow(pos * 0.4, uTime * 0.6) * 1.4;',
    '  pos = mix(seed, pos, rv);',

    /* the pointer pushes a soft hole through the cloud */
    '  vec3 md = pos - uMouse;',
    '  float dm = dot(md, md);',
    '  pos += normalize(md + 1e-4) * exp(-dm * 0.0075) * uMouseForce * (2.0 + aRnd2 * 5.5);',

    '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
    '  gl_Position = projectionMatrix * mv;',

    '  float dist = max(-mv.z, 0.001);',
    '  gl_PointSize = clamp(uSize * w * (0.5 + aRnd2 * 1.25) * uDpr * (46.0 / dist), 0.5, 34.0);',

    /* colour: two-stop gradient chosen by seed and distance from origin */
    '  float cm = clamp(aRnd * 0.5 + smoothstep(0.0, 28.0, length(pos)) * 0.55, 0.0, 1.0);',
    '  vColor = mix(mix(uColA1, uColA2, cm), mix(uColB1, uColB2, cm), t);',
    '  vGlow  = (0.55 + aRnd3 * 0.75) * (1.0 + burst * 1.25) * mix(0.42, 1.0, rv) * uExposure;',
    '  vFade  = smoothstep(340.0, 45.0, dist);',
    '}'
  ].join('\n');

  var CLOUD_FRAG = [
    'varying vec3  vColor;',
    'varying float vGlow;',
    'varying float vFade;',

    'void main(){',
    '  vec2 q = gl_PointCoord - 0.5;',
    '  float d = dot(q, q) * 4.0;',
    '  if (d > 1.0) discard;',
    '  float halo = pow(1.0 - d, 2.9);',
    '  float core = pow(max(0.0, 1.0 - d * 3.4), 3.0);',
    '  float a = halo * 0.60 + core * 0.85;',
    '  gl_FragColor = vec4(vColor * a * vGlow * vFade, a);',
    '}'
  ].join('\n');

  /* ---- deep field: a static shell of far stars for parallax ---- */
  var STAR_VERT = [
    'attribute float aRnd;',
    'uniform float uTime;',
    'uniform float uDpr;',
    'uniform vec3  uTint;',
    'varying float vA;',
    'varying vec3  vC;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  gl_Position = projectionMatrix * mv;',
    '  float tw = 0.55 + 0.45 * sin(uTime * (0.3 + aRnd * 1.4) + aRnd * 40.0);',
    '  gl_PointSize = (0.8 + aRnd * 2.0) * uDpr * tw;',
    '  vA = (0.12 + aRnd * 0.42) * tw;',
    '  vC = mix(vec3(0.72, 0.78, 1.0), uTint, aRnd * 0.6);',
    '}'
  ].join('\n');

  var STAR_FRAG = [
    'varying float vA;',
    'varying vec3  vC;',
    'void main(){',
    '  vec2 q = gl_PointCoord - 0.5;',
    '  float d = dot(q, q) * 4.0;',
    '  if (d > 1.0) discard;',
    '  gl_FragColor = vec4(vC * vA * pow(1.0 - d, 2.0), 1.0);',
    '}'
  ].join('\n');

  /* ---- background: vertical gradient + a nebular core glow ---- */
  var BG_VERT = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }'
  ].join('\n');

  var BG_FRAG = [
    'uniform vec3  uTop;',
    'uniform vec3  uBottom;',
    'uniform vec3  uGlow;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'varying vec2 vUv;',
    HASH,
    'void main(){',
    '  vec3 c = mix(uBottom, uTop, pow(clamp(vUv.y, 0.0, 1.0), 1.2));',
    '  vec2 q = vUv - 0.5;',
    '  q.x *= uRes.x / uRes.y;',
    '  float d = dot(q, q);',
    '  c += uGlow * 0.34 * exp(-d * 3.1);',
    '  c += uGlow * 0.085 * exp(-d * 0.55);',
    '  c += (h21(gl_FragCoord.xy) - 0.5) * 0.0035;',   /* kills banding */
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  /* ---- post-processing ---- */
  var QUAD_VERT = [
    'varying vec2 vUv;',
    'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
  ].join('\n');

  var BRIGHT_FRAG = [
    'uniform sampler2D tDiffuse;',
    'uniform float uThreshold;',
    'uniform float uKnee;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec3 c = texture2D(tDiffuse, vUv).rgb;',
    '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  gl_FragColor = vec4(c * smoothstep(uThreshold, uThreshold + uKnee, l), 1.0);',
    '}'
  ].join('\n');

  var BLUR_FRAG = [
    'uniform sampler2D tDiffuse;',
    'uniform vec2 uDir;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec2 o1 = uDir * 1.3846153846;',
    '  vec2 o2 = uDir * 3.2307692308;',
    '  vec3 s = texture2D(tDiffuse, vUv).rgb * 0.2270270270;',
    '  s += (texture2D(tDiffuse, vUv + o1).rgb + texture2D(tDiffuse, vUv - o1).rgb) * 0.3162162162;',
    '  s += (texture2D(tDiffuse, vUv + o2).rgb + texture2D(tDiffuse, vUv - o2).rgb) * 0.0702702703;',
    '  gl_FragColor = vec4(s, 1.0);',
    '}'
  ].join('\n');

  /* Aberration is applied to the bloom only. Splitting the sharp
     particle buffer per channel turns single-pixel stars into RGB
     confetti; splitting the blurred halo gives the lens fringe
     without the noise. */
  var COMPOSITE_FRAG = [
    'uniform sampler2D tScene;',
    'uniform sampler2D tB0;',
    'uniform sampler2D tB1;',
    'uniform sampler2D tB2;',
    'uniform float uBloom;',
    'uniform float uTime;',
    'uniform float uGrain;',
    'uniform float uAberr;',
    'uniform float uFade;',
    'uniform float uVignette;',
    'varying vec2 vUv;',

    /* Narkowicz ACES fit */
    'vec3 aces(vec3 x){',
    '  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);',
    '}',
    HASH,

    'vec3 bloomAt(vec2 uv){',
    '  return texture2D(tB0, uv).rgb * 0.50',
    '       + texture2D(tB1, uv).rgb * 0.80',
    '       + texture2D(tB2, uv).rgb * 1.00;',
    '}',

    'void main(){',
    '  vec2 cc = vUv - 0.5;',
    '  float r2 = dot(cc, cc);',
    '  vec3 col = texture2D(tScene, vUv).rgb;',

    '  float ab = uAberr * (0.2 + r2 * 3.0);',
    '  vec3 bl = vec3(bloomAt(vUv + cc * ab).r, bloomAt(vUv).g, bloomAt(vUv - cc * ab).b);',
    '  col += bl * uBloom;',

    '  col = aces(col * 1.04);',
    '  col *= mix(1.0, smoothstep(0.95, 0.08, r2 * 1.75), uVignette);',

    /* film grain, subtler in the highlights */
    '  float g = h21(gl_FragCoord.xy + vec2(fract(uTime) * 443.7, fract(uTime * 1.37) * 271.3)) - 0.5;',
    '  col += g * uGrain * (1.0 - 0.7 * dot(col, vec3(0.333)));',

    '  col = pow(max(col, 0.0), vec3(0.4545454545));',
    '  gl_FragColor = vec4(col * uFade, 1.0);',
    '}'
  ].join('\n');

  root.AE.glsl = {
    cloudVert: CLOUD_VERT,
    cloudFrag: CLOUD_FRAG,
    starVert: STAR_VERT,
    starFrag: STAR_FRAG,
    bgVert: BG_VERT,
    bgFrag: BG_FRAG,
    quadVert: QUAD_VERT,
    brightFrag: BRIGHT_FRAG,
    blurFrag: BLUR_FRAG,
    compositeFrag: COMPOSITE_FRAG
  };
})(window);
