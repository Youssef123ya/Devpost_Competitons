/* =============================================================
   ÆTHER — a cosmogony in particles
   Main application: scene, choreography, interaction, UI.
   ============================================================= */
(function (root) {
  'use strict';

  var THREE = root.THREE;
  var U = root.AE.util;
  var G = root.AE.glsl;
  var FORMS = root.AE.forms;
  var TAU = U.TAU;

  /* ---------------------------------------------------------------
     Chapter score: words, colours, camera.
     --------------------------------------------------------------- */
  var CHAPTERS = [
    {
      num: '00', key: 'Void', title: 'Void',
      line: 'Nothing is not empty. It is only waiting.',
      c1: 0x33436f, c2: 0x9db0e0,
      top: 0x070a1b, bot: 0x010209, glow: 0x141d4a,
      cam: { r: 66, y: 13, look: 0, lx: 0, fov: 57, spin: 0.026 }
    },
    {
      num: '01', key: 'Spark', title: 'Spark',
      line: 'One point, out of all the nothing, decides to exist.',
      c1: 0xff6a12, c2: 0xffe6ae,
      top: 0x180903, bot: 0x060108, glow: 0x3d1504,
      cam: { r: 22, y: 3.5, look: 0, lx: -2.5, fov: 50, spin: 0.086 }
    },
    {
      num: '02', key: 'Bloom', title: 'Bloom',
      line: 'A hundred billion suns, all turning the same way.',
      c1: 0x7a3cf0, c2: 0x2fe4f7,
      top: 0x08051c, bot: 0x01030f, glow: 0x1d1049,
      cam: { r: 45, y: 16, look: 0, lx: -4.0, fov: 52, spin: 0.040 }
    },
    {
      num: '03', key: 'Helix', title: 'Helix',
      line: 'Matter finds a way to keep notes on itself.',
      c1: 0x11a89b, c2: 0xbcf46e,
      top: 0x031311, bot: 0x01050a, glow: 0x06291f,
      cam: { r: 38, y: 0, look: 0, lx: -5.0, fov: 50, spin: 0.054 }
    },
    {
      num: '04', key: 'Arbor', title: 'Arbor',
      line: 'The notes reach upward, and we agree to call it growing.',
      c1: 0x33c377, c2: 0xffd166,
      top: 0x07140b, bot: 0x020607, glow: 0x123619,
      cam: { r: 36, y: 5, look: 1.0, lx: -5.0, fov: 48, spin: 0.030 }
    },
    {
      num: '05', key: 'Æther', title: 'Æther',
      line: 'And the dust looked back, and gave itself a name.',
      c1: 0xcdd6ff, c2: 0xa855f7,
      top: 0x0a0b1e, bot: 0x02020a, glow: 0x261b52,
      cam: { r: 40, y: 0, look: 0, lx: -6.5, fov: 44, spin: 0.0 }
    }
  ];
  var F = CHAPTERS.length;

  /* ---------------------------------------------------------------
     Boot
     --------------------------------------------------------------- */
  var canvas = document.getElementById('gl');
  var renderer, camera, world, bgScene, bgCam, bgMat, composer;
  var cloud, cloudMat, stars, starMat;
  var ambience = new root.AE.Ambience();

  var S, N;
  var dpr = 1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;

  /* live state */
  var st = {
    chapter: 0,          /* smoothed, continuous 0..F-1 */
    chapterRaw: 0,
    active: 0,
    energy: 0,
    spin: 0,
    drag: 0,
    dragY: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    mouseForce: 0,
    lastPointer: -1e9,
    reveal: 0,
    enterT: 0,
    fade: 0,
    entered: false,
    time: 0
  };

  var tmpV = new THREE.Vector3();
  var tmpD = new THREE.Vector3();
  var mouseWorld = new THREE.Vector3(0, 0, 0);

  var colA1 = new THREE.Color(), colA2 = new THREE.Color();
  var colB1 = new THREE.Color(), colB2 = new THREE.Color();
  var cTop = new THREE.Color(), cBot = new THREE.Color(), cGlow = new THREE.Color();
  var tintA = new THREE.Color(), tintB = new THREE.Color();
  /* the colour of the cloud before it has become anything */
  var SEED1 = new THREE.Color(0xffc978), SEED2 = new THREE.Color(0xfff4de);
  var SEEDGLOW = new THREE.Color(0x3a2410);
  var PAL = CHAPTERS.map(function (c) {
    return {
      c1: new THREE.Color(c.c1), c2: new THREE.Color(c.c2),
      top: new THREE.Color(c.top), bot: new THREE.Color(c.bot),
      glow: new THREE.Color(c.glow)
    };
  });

  function fail(msg) {
    var stat = document.getElementById('loadStat');
    if (stat) stat.textContent = msg;
    var bar = document.querySelector('#gate .bar');
    if (bar) bar.style.display = 'none';
  }

  function initGL() {
    var gl = null;
    try {
      gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { /* fall through */ }

    var opts = { canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' };
    if (gl) opts.context = gl;

    renderer = new THREE.WebGLRenderer(opts);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;  /* we tonemap by hand */

    var maxDpr = coarse ? 1.6 : 1.75;
    dpr = Math.min(root.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);

    /* particle budget scales with the device */
    var big = !coarse && Math.min(root.innerWidth, root.innerHeight) > 620;
    S = big ? 384 : 208;
    N = S * S;

    camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
    world = new THREE.Scene();

    bgScene = new THREE.Scene();
    bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    bgMat = new THREE.ShaderMaterial({
      vertexShader: G.bgVert,
      fragmentShader: G.bgFrag,
      uniforms: {
        uTop: { value: new THREE.Color() },
        uBottom: { value: new THREE.Color() },
        uGlow: { value: new THREE.Color() },
        uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 }
      },
      depthTest: false, depthWrite: false
    });
    var bq = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
    bq.frustumCulled = false;
    bgScene.add(bq);

    composer = new root.AE.Composer(THREE, renderer);
    return true;
  }

  /* ---------------------------------------------------------------
     Geometry + the morph-target texture
     --------------------------------------------------------------- */
  function buildCloud() {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(N * 3);           /* required by three; unused in the shader */
    var uvs = new Float32Array(N * 2);
    var r1 = new Float32Array(N);
    var r2 = new Float32Array(N);
    var r3 = new Float32Array(N);
    var rnd = U.mulberry32(20260901);

    for (var i = 0; i < N; i++) {
      uvs[i * 2]     = ((i % S) + 0.5) / S;
      uvs[i * 2 + 1] = ((i / S | 0) + 0.5) / S;
      r1[i] = rnd(); r2[i] = rnd(); r3[i] = rnd();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(r1, 1));
    geo.setAttribute('aRnd2', new THREE.BufferAttribute(r2, 1));
    geo.setAttribute('aRnd3', new THREE.BufferAttribute(r3, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    cloudMat = new THREE.ShaderMaterial({
      vertexShader: G.cloudVert,
      fragmentShader: G.cloudFrag,
      uniforms: {
        uTargets: { value: null },
        uFormCount: { value: F },
        uChapter: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 1.0 },
        uDpr: { value: dpr },
        uScatter: { value: reduced ? 0.35 : 1.0 },
        uExposure: { value: 1.35 },
        uReveal: { value: 0 },
        uMouse: { value: new THREE.Vector3(9999, 0, 0) },
        uMouseForce: { value: 0 },
        uColA1: { value: colA1 }, uColA2: { value: colA2 },
        uColB1: { value: colB1 }, uColB2: { value: colB2 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });

    cloud = new THREE.Points(geo, cloudMat);
    cloud.frustumCulled = false;
    world.add(cloud);
  }

  function buildStars() {
    var COUNT = coarse ? 1400 : 3400;
    var geo = new THREE.BufferGeometry();
    var p = new Float32Array(COUNT * 3);
    var a = new Float32Array(COUNT);
    var rnd = U.mulberry32(777), v = [0, 0, 0];
    for (var i = 0; i < COUNT; i++) {
      U.onSphere(rnd, v);
      var r = 420 + 620 * Math.pow(rnd(), 0.4);
      p[i * 3] = v[0] * r; p[i * 3 + 1] = v[1] * r * 0.85; p[i * 3 + 2] = v[2] * r;
      a[i] = rnd();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(a, 1));

    starMat = new THREE.ShaderMaterial({
      vertexShader: G.starVert,
      fragmentShader: G.starFrag,
      uniforms: {
        uTime: { value: 0 },
        uDpr: { value: dpr },
        uTint: { value: new THREE.Color(0.6, 0.7, 1.0) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    });
    stars = new THREE.Points(geo, starMat);
    stars.frustumCulled = false;
    world.add(stars);
  }

  /* Forms are baked one per frame so the loader can breathe. */
  function bakeForms(done) {
    var data = new Float32Array(N * 4 * F);
    var i = 0;
    var stat = document.getElementById('loadStat');
    var fill = document.getElementById('barFill');

    function step() {
      var slice = data.subarray(i * N * 4, (i + 1) * N * 4);
      FORMS[i].build(slice, N, U.mulberry32(1000 + i * 7919));
      i++;
      if (fill) fill.style.width = (i / F * 100) + '%';
      if (stat) stat.textContent = i < F ? ('Composing ' + FORMS[i].key) : 'Ready';
      if (i < F) { requestAnimationFrame(step); return; }

      var tex = new THREE.DataTexture(data, S, S * F, THREE.RGBAFormat, THREE.FloatType);
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      cloudMat.uniforms.uTargets.value = tex;
      done();
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------------
     Scroll → chapter
     --------------------------------------------------------------- */
  var runway = document.getElementById('runway');

  function layoutRunway() {
    runway.style.height = ((F - 1) * 132 + 100) + 'vh';
  }

  function scrollMax() {
    return Math.max(1, document.documentElement.scrollHeight - root.innerHeight);
  }

  function readScroll() {
    var p = U.clamp((root.scrollY || root.pageYOffset || 0) / scrollMax(), 0, 1);
    var seg = p * (F - 1);
    var base = Math.min(F - 2, Math.floor(seg));
    var local = seg - base;
    /* hold at both ends of each segment so every form gets a still moment */
    var t = U.smoother(U.clamp((local - 0.17) / 0.66, 0, 1));
    st.chapterRaw = U.clamp(base + t, 0, F - 1);
  }

  function scrollToChapter(i) {
    var target = (i / (F - 1)) * scrollMax();
    try { root.scrollTo({ top: target, behavior: 'smooth' }); }
    catch (e) { root.scrollTo(0, target); }
  }

  /* ---------------------------------------------------------------
     UI
     --------------------------------------------------------------- */
  var card = document.getElementById('card');
  var elNum = document.getElementById('cNum');
  var elKey = document.getElementById('cKey');
  var elTitle = document.getElementById('cTitle');
  var elLine = document.getElementById('cLine');
  var elIdx = document.getElementById('cIdx');
  var hint = document.getElementById('hint');
  var railBtns = [];
  var cardTimer = null;

  function buildRail() {
    var rail = document.getElementById('rail');
    CHAPTERS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.innerHTML = '<span class="nm">' + c.num + ' ' + c.key + '</span><i></i>';
      b.addEventListener('click', function () { scrollToChapter(i); });
      rail.appendChild(b);
      railBtns.push(b);
    });
  }

  function paintChapter(i) {
    var c = CHAPTERS[i];
    elNum.textContent = c.num;
    elKey.textContent = c.key;
    elTitle.textContent = c.title;
    elLine.textContent = c.line;
    elIdx.textContent = String(i + 1).padStart(2, '0');
    railBtns.forEach(function (b, k) { b.classList.toggle('active', k === i); });
    document.title = c.num + ' · ' + c.title + ' — ÆTHER';
  }

  function setChapterUI(i) {
    card.classList.remove('on');
    card.classList.add('out');
    clearTimeout(cardTimer);
    cardTimer = setTimeout(function () {
      paintChapter(i);
      card.classList.remove('out');
      /* force reflow so the entry transition replays */
      void card.offsetWidth;
      card.classList.add('on');
    }, 380);
  }

  /* ---------------------------------------------------------------
     Interaction
     --------------------------------------------------------------- */
  var dragging = false, lastX = 0, lastY = 0;

  function bindInput() {
    root.addEventListener('pointermove', function (e) {
      st.pointer.tx = (e.clientX / root.innerWidth) * 2 - 1;
      st.pointer.ty = (e.clientY / root.innerHeight) * 2 - 1;
      st.lastPointer = st.time;
      if (dragging) {
        st.drag -= (e.clientX - lastX) * 0.0052;
        st.dragY = U.clamp(st.dragY + (e.clientY - lastY) * 0.05, -14, 14);
        lastX = e.clientX; lastY = e.clientY;
      }
    }, { passive: true });

    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointerup', function () { dragging = false; });
    root.addEventListener('pointercancel', function () { dragging = false; });

    root.addEventListener('keydown', function (e) {
      if (!st.entered) return;
      var i = Math.round(st.chapterRaw);
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); scrollToChapter(Math.min(F - 1, i + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); scrollToChapter(Math.max(0, i - 1));
      } else if (e.key === 'Home') { e.preventDefault(); scrollToChapter(0); }
      else if (e.key === 'End') { e.preventDefault(); scrollToChapter(F - 1); }
    });

    root.addEventListener('scroll', function () {
      if (st.entered && hint && !hint.classList.contains('gone') && root.scrollY > 40) {
        hint.classList.add('gone');
      }
    }, { passive: true });

    root.addEventListener('resize', resize);

    /* sound */
    var soundBtn = document.getElementById('soundBtn');
    soundBtn.addEventListener('click', function () {
      var on = soundBtn.getAttribute('aria-pressed') !== 'true';
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      ambience.setEnabled(on);
    });

    /* about */
    var about = document.getElementById('about');
    document.getElementById('aboutBtn').addEventListener('click', function () {
      about.classList.remove('hidden');
    });
    document.getElementById('closeAbout').addEventListener('click', function () {
      about.classList.add('hidden');
    });
    about.addEventListener('click', function (e) {
      if (e.target === about) about.classList.add('hidden');
    });
  }

  function enter(withSound) {
    if (st.entered) return;
    st.entered = true;
    document.getElementById('gate').classList.add('hidden');
    document.body.classList.remove('locked');
    if (withSound) {
      var b = document.getElementById('soundBtn');
      b.setAttribute('aria-pressed', 'true');
      ambience.setEnabled(true);
    }
    setTimeout(function () { card.classList.add('on'); }, 260);
  }

  /* ---------------------------------------------------------------
     Resize
     --------------------------------------------------------------- */
  function resize() {
    var w = root.innerWidth, h = root.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setSize(Math.round(w * dpr), Math.round(h * dpr));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    bgMat.uniforms.uRes.value.set(w * dpr, h * dpr);
    cloudMat.uniforms.uDpr.value = dpr;
    starMat.uniforms.uDpr.value = dpr;
    layoutRunway();
  }

  /* ---------------------------------------------------------------
     Frame
     --------------------------------------------------------------- */
  var prev = performance.now();
  var frameAcc = 0, frameCount = 0, degraded = false;

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    st.time += dt;

    /* --- chapter position --- */
    readScroll();
    var before = st.chapter;
    st.chapter = U.damp(st.chapter, st.chapterRaw, 5.5, dt);
    var vel = Math.abs(st.chapter - before) / Math.max(dt, 1e-4);
    st.energy = U.damp(st.energy, U.clamp(vel * 0.55, 0, 1), 4, dt);

    var idx = U.clamp(Math.round(st.chapter), 0, F - 1);
    if (idx !== st.active) {
      st.active = idx;
      setChapterUI(idx);
      ambience.chime(idx);
    }

    /* --- palette --- */
    var fi = Math.min(F - 2, Math.floor(st.chapter));
    var ft = U.clamp(st.chapter - fi, 0, 1);
    var A = PAL[fi], B = PAL[fi + 1];
    var e = U.smooth(ft);

    colA1.copy(A.c1); colA2.copy(A.c2);
    colB1.copy(B.c1); colB2.copy(B.c2);
    cTop.copy(A.top).lerp(B.top, e);
    cBot.copy(A.bot).lerp(B.bot, e);
    cGlow.copy(A.glow).lerp(B.glow, e);
    tintA.copy(A.c1).lerp(B.c1, e);

    /* pre = 1 while the nucleus waits, 0 once it has bloomed into the void */
    var pre = 1 - U.smoother(st.enterT);
    if (pre > 0.001) {
      colA1.lerp(SEED1, pre); colA2.lerp(SEED2, pre);
      colB1.lerp(SEED1, pre * 0.7); colB2.lerp(SEED2, pre * 0.7);
      cGlow.lerp(SEEDGLOW, pre * 0.8);
    }

    var bu = bgMat.uniforms;
    bu.uTop.value.copy(cTop);
    bu.uBottom.value.copy(cBot);
    /* the sky brightens while the cloud is coming apart */
    bu.uGlow.value.copy(cGlow).multiplyScalar(1 + st.energy * 0.9 + Math.sin(Math.PI * ft) * 0.5);
    bu.uTime.value = st.time;

    starMat.uniforms.uTime.value = st.time;
    starMat.uniforms.uTint.value.copy(tintA);

    /* --- camera choreography --- */
    var ka = CHAPTERS[fi].cam, kb = CHAPTERS[fi + 1].cam;
    var camR = U.lerp(ka.r, kb.r, e);
    var camY = U.lerp(ka.y, kb.y, e);
    var camL = U.lerp(ka.look, kb.look, e);
    var camX = U.lerp(ka.lx, kb.lx, e);
    var fov = U.lerp(ka.fov, kb.fov, e);
    var spinSpeed = U.lerp(ka.spin, kb.spin, e);

    st.spin += dt * spinSpeed;

    /* face the word head-on for the finale */
    var snap = U.sstep(4.0, 4.95, st.chapter);
    if (snap > 0.001) {
      var nearest = Math.round(st.spin / TAU) * TAU;
      st.spin = U.damp(st.spin, nearest, 2.6 * snap, dt);
      st.drag = U.damp(st.drag, 0, 2.6 * snap, dt);
      st.dragY = U.damp(st.dragY, 0, 2.6 * snap, dt);
    }
    /* drag always drifts slowly back to rest */
    st.drag = U.damp(st.drag, 0, 0.35, dt);
    st.dragY = U.damp(st.dragY, 0, 0.5, dt);

    st.pointer.x = U.damp(st.pointer.x, st.pointer.tx, 3.2, dt);
    st.pointer.y = U.damp(st.pointer.y, st.pointer.ty, 3.2, dt);

    var ang = st.spin + st.drag + st.pointer.x * 0.16 * (1 - snap * 0.8);
    var ey = camY + st.dragY + st.pointer.y * -3.0 * (1 - snap * 0.7);

    /* fov is vertical, so narrow viewports must pull back to keep
       the subject inside the frame */
    var fit = U.clamp(1.25 / Math.max(camera.aspect, 0.3), 1, 1.8);

    /* the opening move: start tight on the nucleus, dolly out as it blooms */
    fit *= U.lerp(0.30, 1.0, U.smoother(st.enterT));

    /* the camera also breathes in and out during transitions */
    var push = fit * (1 + Math.sin(Math.PI * ft) * 0.10 + st.energy * 0.06);
    camera.position.set(Math.sin(ang) * camR * push, ey, Math.cos(ang) * camR * push);
    camera.lookAt(0, camL, 0);
    /* a shift-lens nudge: keeps the subject clear of the chapter card */
    camera.translateX(camX * (root.innerWidth > 860 ? 1 : 0.25));
    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    /* --- pointer field --- */
    var active = (st.time - st.lastPointer) < 1.4 && !coarse && st.entered;
    st.mouseForce = U.damp(st.mouseForce, active ? 1.35 : 0, 3.5, dt);
    if (st.mouseForce > 0.005) {
      tmpV.set(st.pointer.tx, -st.pointer.ty, 0.5).unproject(camera);
      tmpD.copy(tmpV).sub(camera.position).normalize();
      camera.getWorldDirection(tmpV);
      var denom = tmpD.dot(tmpV);
      if (Math.abs(denom) > 1e-5) {
        var tHit = -camera.position.dot(tmpV) / denom;
        mouseWorld.copy(camera.position).addScaledVector(tmpD, tHit);
      }
      cloudMat.uniforms.uMouse.value.copy(mouseWorld);
    }

    /* --- assemble / fade in --- */
    if (st.entered) st.enterT = Math.min(1, st.enterT + dt / 3.4);
    st.reveal = st.enterT;
    st.fade = Math.min(1, st.fade + dt * 0.6);

    var cu = cloudMat.uniforms;
    cu.uChapter.value = st.chapter;
    cu.uTime.value = st.time;
    cu.uReveal.value = U.smoother(st.reveal);
    cu.uMouseForce.value = st.mouseForce;
    cu.uSize.value = (1.02 + st.energy * 0.3) * (1 + pre * 0.5);
    cu.uExposure.value = 1.35 * (1 + pre * 1.9);

    var pu = composer.mComposite.uniforms;
    pu.uFade.value = U.smoother(st.fade);
    pu.uBloom.value = 0.55 + st.energy * 0.30 + Math.sin(Math.PI * ft) * 0.22;
    pu.uAberr.value = 0.0030 + st.energy * 0.010;
    pu.uGrain.value = reduced ? 0.010 : 0.020;

    composer.render(bgScene, bgCam, world, camera, st.time);

    ambience.setPosition(st.chapter, st.energy);

    /* --- quality governor: drop resolution rather than frames --- */
    if (!degraded && st.entered) {
      frameAcc += dt; frameCount++;
      if (frameCount > 90) {
        if (frameAcc / frameCount > 0.028 && dpr > 1) {
          dpr = Math.max(1, dpr * 0.75);
          degraded = true;
          resize();
        }
        frameAcc = 0; frameCount = 0;
      }
    }
  }

  /* ---------------------------------------------------------------
     Go
     --------------------------------------------------------------- */
  function start() {
    if (!root.THREE) { fail('Three.js failed to load'); return; }
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) {
      fail('This experience needs WebGL');
      return;
    }

    try { initGL(); } catch (err) { fail('WebGL failed to start'); return; }

    buildCloud();
    buildStars();
    buildRail();
    paintChapter(0);
    bindInput();
    layoutRunway();
    resize();

    document.getElementById('cParticles').textContent = N.toLocaleString('en-US');

    var baking = false;
    var go = function () {
      if (baking) return;
      baking = true;
      bakeForms(function () {
        document.getElementById('gate').classList.add('is-ready');
        requestAnimationFrame(frame);
      });
    };

    /* wait for the display face so the word in chapter 05 rasterises right */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(go).catch(go);
      setTimeout(go, 2500);   /* never let a slow font stall the piece */
    } else {
      go();
    }

    document.getElementById('enterBtn').addEventListener('click', function () { enter(true); });
    document.getElementById('quietBtn').addEventListener('click', function () { enter(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window);
