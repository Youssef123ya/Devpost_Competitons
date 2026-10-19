/* =============================================================
   ÆTHER — post pipeline

   Hand-rolled so it stays a single dependency-free file:
     scene (HDR, half-float)
       -> bright pass
       -> 3 gaussian-blurred mips
       -> composite: aberration + bloom + ACES + vignette + grain
   ============================================================= */
(function (root) {
  'use strict';

  var G = root.AE.glsl;

  function Composer(THREE, renderer) {
    this.THREE = THREE;
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    var mk = function (frag, uniforms) {
      return new THREE.ShaderMaterial({
        vertexShader: G.quadVert,
        fragmentShader: frag,
        uniforms: uniforms,
        depthTest: false,
        depthWrite: false
      });
    };

    this.mBright = mk(G.brightFrag, {
      tDiffuse: { value: null },
      uThreshold: { value: 0.82 },
      uKnee: { value: 0.60 }
    });

    this.mBlur = mk(G.blurFrag, {
      tDiffuse: { value: null },
      uDir: { value: new THREE.Vector2() }
    });

    this.mComposite = mk(G.compositeFrag, {
      tScene: { value: null },
      tB0: { value: null },
      tB1: { value: null },
      tB2: { value: null },
      uBloom: { value: 0.45 },
      uTime: { value: 0 },
      uGrain: { value: 0.045 },
      uAberr: { value: 0.004 },
      uVignette: { value: 0.8 },
      uFade: { value: 0 }
    });

    this.rtScene = null;
    this.levels = [];
    this.w = 1;
    this.h = 1;
  }

  Composer.prototype._rt = function (w, h) {
    var THREE = this.THREE;
    return new THREE.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    });
  };

  Composer.prototype.setSize = function (w, h) {
    var i;
    this.w = w; this.h = h;

    if (this.rtScene) {
      this.rtScene.dispose();
      for (i = 0; i < this.levels.length; i++) {
        this.levels[i].rt.dispose();
        this.levels[i].tmp.dispose();
      }
    }

    this.rtScene = this._rt(w, h);
    this.levels = [];
    for (i = 0; i < 3; i++) {
      var d = Math.pow(2, i + 1);
      var lw = Math.max(2, Math.round(w / d));
      var lh = Math.max(2, Math.round(h / d));
      this.levels.push({ w: lw, h: lh, rt: this._rt(lw, lh), tmp: this._rt(lw, lh) });
    }
  };

  Composer.prototype._pass = function (material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target || null);
    this.renderer.clear(true, false, false);
    this.renderer.render(this.scene, this.cam);
  };

  /* Render the world into the HDR buffer, then grade it to the screen. */
  Composer.prototype.render = function (bgScene, bgCam, world, worldCam, time) {
    var r = this.renderer, i, L, src;

    r.setRenderTarget(this.rtScene);
    r.clear(true, true, true);
    r.render(bgScene, bgCam);
    r.render(world, worldCam);

    /* bright pass into the half-res level */
    this.mBright.uniforms.tDiffuse.value = this.rtScene.texture;
    this._pass(this.mBright, this.levels[0].rt);

    /* separable gaussian, cascading down the mips */
    for (i = 0; i < this.levels.length; i++) {
      L = this.levels[i];
      src = i === 0 ? this.levels[0].rt : this.levels[i - 1].rt;

      this.mBlur.uniforms.tDiffuse.value = src.texture;
      this.mBlur.uniforms.uDir.value.set(1.25 / L.w, 0);
      this._pass(this.mBlur, L.tmp);

      this.mBlur.uniforms.tDiffuse.value = L.tmp.texture;
      this.mBlur.uniforms.uDir.value.set(0, 1.25 / L.h);
      this._pass(this.mBlur, L.rt);
    }

    var u = this.mComposite.uniforms;
    u.tScene.value = this.rtScene.texture;
    u.tB0.value = this.levels[0].rt.texture;
    u.tB1.value = this.levels[1].rt.texture;
    u.tB2.value = this.levels[2].rt.texture;
    u.uTime.value = time;
    this._pass(this.mComposite, null);
  };

  root.AE.Composer = Composer;
})(window);
