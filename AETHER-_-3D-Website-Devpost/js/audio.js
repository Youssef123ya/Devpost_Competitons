/* =============================================================
   ÆTHER — generative ambience

   No audio files. Six oscillators, a noise bed and a synthesised
   reverb tail. Each chapter retunes the drone and rings a bell.
   Every call is wrapped: audio must never break the visuals.
   ============================================================= */
(function (root) {
  'use strict';

  /* Low drone roots, one per chapter — a slow rise from A1 to A2. */
  var ROOTS = [55.00, 65.41, 73.42, 82.41, 98.00, 110.00];
  var PENTA = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

  function Ambience() {
    this.ctx = null;
    this.ready = false;
    this.enabled = false;
    this.voices = [];
    this.chapter = 0;
  }

  Ambience.prototype._impulse = function (seconds, decay) {
    var ctx = this.ctx;
    var n = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
      }
    }
    return buf;
  };

  Ambience.prototype.init = function () {
    if (this.ready) return true;
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      var ctx = this.ctx = new AC();

      /* ---- output chain ---- */
      var master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      this.master = master;

      var verb = ctx.createConvolver();
      verb.buffer = this._impulse(3.4, 2.6);
      var wet = ctx.createGain(); wet.gain.value = 0.55;
      verb.connect(wet); wet.connect(master);

      var bus = ctx.createGain(); bus.gain.value = 0.6;
      bus.connect(master);
      bus.connect(verb);
      this.bus = bus;

      /* ---- drone: root, octave, fifth, twelfth (x2 detuned pairs) ---- */
      var ratios = [1, 1.001, 2, 2.004, 3.0, 4.006];
      var gains  = [0.30, 0.26, 0.15, 0.13, 0.06, 0.035];

      var filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 520;
      filt.Q.value = 0.6;
      filt.connect(bus);
      this.filter = filt;

      for (var i = 0; i < ratios.length; i++) {
        var osc = ctx.createOscillator();
        osc.type = i < 2 ? 'sawtooth' : 'triangle';
        osc.frequency.value = ROOTS[0] * ratios[i];

        var g = ctx.createGain();
        g.gain.value = gains[i];

        /* each voice breathes on its own slow cycle */
        var lfo = ctx.createOscillator();
        lfo.frequency.value = 0.035 + i * 0.021;
        var lg = ctx.createGain();
        lg.gain.value = gains[i] * 0.55;
        lfo.connect(lg); lg.connect(g.gain);
        lfo.start();

        osc.connect(g); g.connect(filt);
        osc.start();
        this.voices.push({ osc: osc, ratio: ratios[i] });
      }

      /* ---- noise bed ---- */
      var nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
      var nd = nb.getChannelData(0), lastv = 0;
      for (var k = 0; k < nd.length; k++) {
        lastv = (lastv + (Math.random() * 2 - 1) * 0.12) * 0.985;  /* brown-ish */
        nd[k] = lastv;
      }
      var src = ctx.createBufferSource();
      src.buffer = nb; src.loop = true;

      var nf = ctx.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 420; nf.Q.value = 0.5;
      var ng = ctx.createGain(); ng.gain.value = 0.22;
      src.connect(nf); nf.connect(ng); ng.connect(bus); ng.connect(verb);
      src.start();
      this.noiseFilter = nf;

      this.ready = true;
      return true;
    } catch (e) {
      this.ready = false;
      return false;
    }
  };

  Ambience.prototype.setEnabled = function (on) {
    if (!this.ready && on) { if (!this.init()) return; }
    if (!this.ready) return;
    this.enabled = !!on;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      var t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(on ? 0.16 : 0.0, t + (on ? 2.6 : 0.9));
    } catch (e) { /* ignore */ }
  };

  /* Continuous chapter position drives the drone pitch and brightness. */
  Ambience.prototype.setPosition = function (pos, energy) {
    if (!this.ready || !this.enabled) return;
    try {
      var i = Math.max(0, Math.min(ROOTS.length - 1, pos));
      var a = Math.floor(i), b = Math.min(ROOTS.length - 1, a + 1), f = i - a;
      var root0 = ROOTS[a] * Math.pow(ROOTS[b] / ROOTS[a], f);
      var t = this.ctx.currentTime;

      for (var v = 0; v < this.voices.length; v++) {
        var vo = this.voices[v];
        vo.osc.frequency.setTargetAtTime(root0 * vo.ratio, t, 0.45);
      }
      this.filter.frequency.setTargetAtTime(430 + energy * 2600 + i * 90, t, 0.3);
      this.noiseFilter.frequency.setTargetAtTime(320 + energy * 1500, t, 0.4);
    } catch (e) { /* ignore */ }
  };

  /* A struck bell when a chapter locks in. */
  Ambience.prototype.chime = function (index) {
    if (!this.ready || !this.enabled) return;
    try {
      var ctx = this.ctx, t = ctx.currentTime;
      var f = PENTA[(index * 2 + 1) % PENTA.length];
      for (var h = 0; h < 3; h++) {
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f * (h === 0 ? 1 : (h === 1 ? 2.01 : 3.02));
        var g = ctx.createGain();
        var peak = 0.16 / (h + 1.4);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4 + h);
        osc.connect(g); g.connect(this.bus);
        osc.start(t);
        osc.stop(t + 5 + h);
      }
    } catch (e) { /* ignore */ }
  };

  root.AE.Ambience = Ambience;
})(window);
