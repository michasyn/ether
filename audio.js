(() => {
  "use strict";
  window.ETHER = window.ETHER || {};

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.noiseBuffer = null;
      this.surfaceNodes = null;
      this.laserNodes = null;
      this.jingles = {
        newLevel: new Audio("newlevel.mp3"),
        win:      new Audio("winlevel.mp3"),
        lost:     new Audio("lostlevel.mp3")
      };
      Object.values(this.jingles).forEach((a) => {
        a.preload = "auto";
        a.volume = 0.5; // VOLUME!
      });
    }

    stopJingles() {
      Object.values(this.jingles).forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
    }

    playJingle(key, fallbackFn) {
      if (this.muted) return;
      this.stopJingles();
      const track = this.jingles[key];
      if (!track) {
        if (fallbackFn) fallbackFn();
        return;
      }
      track.currentTime = 0;
      const promise = track.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {
          if (fallbackFn) fallbackFn();
        });
      }
    }

    playNewLevel() {
      this.playJingle("newLevel");
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        const len = Math.floor(this.ctx.sampleRate * 2.0);
        this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        this.setupSurfaceLoops();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    setupSurfaceLoops() {
      if (!this.ctx || !this.noiseBuffer || this.surfaceNodes) return;

      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const masterOut = panner || this.ctx.destination;
      if (panner) panner.connect(this.ctx.destination);

      // 1. Eis-Loop (Schlittschuh-Gleiten)
      const iceSrc = this.ctx.createBufferSource();
      iceSrc.buffer = this.noiseBuffer;
      iceSrc.loop = true;

      const iceFilterMain = this.ctx.createBiquadFilter();
      iceFilterMain.type = "bandpass";
      iceFilterMain.frequency.value = 3200;
      iceFilterMain.Q.value = 3.6;

      const iceFilterEdge = this.ctx.createBiquadFilter();
      iceFilterEdge.type = "bandpass";
      iceFilterEdge.frequency.value = 5400;
      iceFilterEdge.Q.value = 6.5;

      const iceGain = this.ctx.createGain();
      iceGain.gain.value = 0;
      const iceEdgeGain = this.ctx.createGain();
      iceEdgeGain.gain.value = 0.45;

      iceSrc.connect(iceFilterMain);
      iceSrc.connect(iceFilterEdge);
      iceFilterMain.connect(iceGain);
      iceFilterEdge.connect(iceEdgeGain);
      iceEdgeGain.connect(iceGain);
      iceGain.connect(masterOut);
      iceSrc.start();

      // 2. Sand-Loop (Bremsfeld)
      const sandSrc = this.ctx.createBufferSource();
      sandSrc.buffer = this.noiseBuffer;
      sandSrc.loop = true;

      const sandFilterBody = this.ctx.createBiquadFilter();
      sandFilterBody.type = "bandpass";
      sandFilterBody.frequency.value = 680;
      sandFilterBody.Q.value = 1.1;

      const sandFilterGrit = this.ctx.createBiquadFilter();
      sandFilterGrit.type = "bandpass";
      sandFilterGrit.frequency.value = 1950;
      sandFilterGrit.Q.value = 1.8;

      const sandGritGain = this.ctx.createGain();
      sandGritGain.gain.value = 0.55;
      const sandGain = this.ctx.createGain();
      sandGain.gain.value = 0;

      sandSrc.connect(sandFilterBody);
      sandSrc.connect(sandFilterGrit);
      sandFilterBody.connect(sandGain);
      sandFilterGrit.connect(sandGritGain);
      sandGritGain.connect(sandGain);
      sandGain.connect(masterOut);
      sandSrc.start();

      this.surfaceNodes = {
        panner,
        iceFilterMain, iceFilterEdge, iceGain,
        sandFilterBody, sandFilterGrit, sandGain
      };

      // 3. Kontinuierlicher elektrischer Laser-Loop (Surren + Hochspannungs-Knistern)
      const laserPanner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const laserOut = laserPanner || this.ctx.destination;
      if (laserPanner) laserPanner.connect(this.ctx.destination);

      const laserMasterGain = this.ctx.createGain();
      laserMasterGain.gain.value = 0;
      laserMasterGain.connect(laserOut);

      // Elektrisches Netz-/Plasma-Surren (110 Hz + 221.5 Hz für organisches Schweben)
      const humFilter = this.ctx.createBiquadFilter();
      humFilter.type = "lowpass";
      humFilter.frequency.value = 1150;
      humFilter.Q.value = 2.8;

      const humGain = this.ctx.createGain();
      humGain.gain.value = 0.65;
      humFilter.connect(humGain);
      humGain.connect(laserMasterGain);

      const humOsc1 = this.ctx.createOscillator();
      humOsc1.type = "sawtooth";
      humOsc1.frequency.value = 110;
      humOsc1.connect(humFilter);
      humOsc1.start();

      const humOsc2 = this.ctx.createOscillator();
      humOsc2.type = "sawtooth";
      humOsc2.frequency.value = 221.6;
      const humOsc2Gain = this.ctx.createGain();
      humOsc2Gain.gain.value = 0.55;
      humOsc2.connect(humOsc2Gain);
      humOsc2Gain.connect(humFilter);
      humOsc2.start();

      // Hochspannungs-Knistern / Plasma-Zischen (mit subtiler LFO-Modulation)
      const sizzleSrc = this.ctx.createBufferSource();
      sizzleSrc.buffer = this.noiseBuffer;
      sizzleSrc.loop = true;

      const sizzleFilter = this.ctx.createBiquadFilter();
      sizzleFilter.type = "bandpass";
      sizzleFilter.frequency.value = 2600;
      sizzleFilter.Q.value = 3.2;

      const sizzleGain = this.ctx.createGain();
      sizzleGain.gain.value = 0.32;

      const sizzleLfo = this.ctx.createOscillator();
      sizzleLfo.type = "sine";
      sizzleLfo.frequency.value = 18;
      const sizzleLfoDepth = this.ctx.createGain();
      sizzleLfoDepth.gain.value = 0.14;
      sizzleLfo.connect(sizzleLfoDepth);
      sizzleLfoDepth.connect(sizzleGain.gain);
      sizzleLfo.start();

      sizzleSrc.connect(sizzleFilter);
      sizzleFilter.connect(sizzleGain);
      sizzleGain.connect(laserMasterGain);
      sizzleSrc.start();

      this.laserNodes = {
        panner: laserPanner,
        masterGain: laserMasterGain,
        humFilter
      };
    }

    updateLaserSound(active, pan = 0, segCount = 1) {
      if (!this.ctx || !this.laserNodes) return;
      const now = this.ctx.currentTime;
      const l = this.laserNodes;

      if (l.panner) {
        l.panner.pan.setTargetAtTime(Math.max(-0.75, Math.min(0.75, pan)), now, 0.06);
      }

      if (this.muted || !active) {
        l.masterGain.gain.setTargetAtTime(0, now, 0.05);
        return;
      }

      const boost = Math.min(0.035, Math.max(0, segCount - 1) * 0.01);
      l.masterGain.gain.setTargetAtTime(0.085 + boost, now, 0.07);
    }

    updateSurfaceSound(floorType, speed, pan, active) {
      if (!this.ctx || !this.surfaceNodes) return;
      const now = this.ctx.currentTime;
      const s = this.surfaceNodes;

      if (s.panner) {
        s.panner.pan.setTargetAtTime(Math.max(-0.85, Math.min(0.85, pan)), now, 0.04);
      }

      if (this.muted || !active || speed < 14) {
        s.iceGain.gain.setTargetAtTime(0, now, 0.045);
        s.sandGain.gain.setTargetAtTime(0, now, 0.04);
        return;
      }

      const norm = Math.min(1, (speed - 14) / 420);

      if (floorType === "ice") {
        const targetVol = 0.02 + Math.pow(norm, 0.85) * 0.14;
        s.iceFilterMain.frequency.setTargetAtTime(2400 + norm * 2200, now, 0.05);
        s.iceFilterEdge.frequency.setTargetAtTime(4600 + norm * 2400, now, 0.05);
        s.iceGain.gain.setTargetAtTime(targetVol, now, 0.045);
        s.sandGain.gain.setTargetAtTime(0, now, 0.035);
      } else if (floorType === "red") {
        const targetVol = 0.03 + Math.pow(norm, 0.75) * 0.24;
        s.sandFilterBody.frequency.setTargetAtTime(520 + norm * 520, now, 0.04);
        s.sandFilterGrit.frequency.setTargetAtTime(1600 + norm * 1200, now, 0.04);
        s.sandGain.gain.setTargetAtTime(targetVol, now, 0.035);
        s.iceGain.gain.setTargetAtTime(0, now, 0.04);
      } else {
        s.iceGain.gain.setTargetAtTime(0, now, 0.045);
        s.sandGain.gain.setTargetAtTime(0, now, 0.04);
      }
    }

    createPanner(pan) {
      if (this.ctx.createStereoPanner) {
        const p = this.ctx.createStereoPanner();
        p.pan.value = Math.max(-0.85, Math.min(0.85, pan));
        p.connect(this.ctx.destination);
        return p;
      }
      return this.ctx.destination;
    }

    playWallHit(speed, pan) {
      if (this.muted || !this.ctx || speed < 35) return;
      const intensity = Math.min(1, Math.max(0.08, (speed - 35) / 520));
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(125 + intensity * 95, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.08);
      gain.gain.setValueAtTime(0.22 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.09);

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000 + intensity * 1200;
        filter.Q.value = 2.2;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.1 * intensity, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        src.connect(filter);
        filter.connect(nGain);
        nGain.connect(out);
        src.start(now);
        src.stop(now + 0.05);
      }
    }

    playOxydOpen(freq, pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.018, now + 0.22);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.36);
    }

    playOxydMatch(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const t = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    }

    playOxydMismatch(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(165, now + 0.14);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.16);
    }

    playBlockPush(pan, bridged = false) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(bridged ? 220 : 150, now);
      osc.frequency.exponentialRampToValueAtTime(bridged ? 440 : 95, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.2);
    }

    playTerminalSwitch(active, pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const freqs = active ? [440, 660] : [520, 340];
      freqs.forEach((f, i) => {
        const t = now + i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.13);
      });
    }

    playGateToggle(open, pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;

      osc.frequency.setValueAtTime(open ? 180 : 420, now);
      osc.frequency.exponentialRampToValueAtTime(open ? 480 : 140, now + 0.22);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playPickup(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      [587.33, 880].forEach((f, i) => {
        const t = now + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }

    playExtraLife(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
        const t = now + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    }

    playMirrorRotate(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1180, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    playSwap(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(170, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.19);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    playLaserZap(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.34);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.38);
    }

    playLaserActivate(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);

      // 1. Elektrischer Funken-Impuls (Knister-Start)
      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(3600, now);
        bp.frequency.exponentialRampToValueAtTime(1500, now + 0.18);
        bp.Q.value = 2.6;
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.001, now);
        nGain.gain.linearRampToValueAtTime(0.28, now + 0.012);
        nGain.gain.exponentialRampToValueAtTime(0.06, now + 0.065);
        nGain.gain.linearRampToValueAtTime(0.2, now + 0.09);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        src.connect(bp);
        bp.connect(nGain);
        nGain.connect(out);
        src.start(now);
        src.stop(now + 0.24);
      }

      // 2. Elektrisches Hochspannungs-Surren (2 verstimmte Sägezahn-Oszillatoren + resonanter Lowpass)
      const buzzFilter = this.ctx.createBiquadFilter();
      buzzFilter.type = "lowpass";
      buzzFilter.frequency.setValueAtTime(1100, now);
      buzzFilter.frequency.exponentialRampToValueAtTime(2400, now + 0.14);
      buzzFilter.frequency.exponentialRampToValueAtTime(950, now + 0.36);
      buzzFilter.Q.value = 2.4;

      const buzzGain = this.ctx.createGain();
      buzzGain.gain.setValueAtTime(0.001, now);
      buzzGain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      buzzFilter.connect(buzzGain);
      buzzGain.connect(out);

      [145, 294].forEach((baseFreq) => {
        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.28, now + 0.14);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.36);
        osc.connect(buzzFilter);
        osc.start(now);
        osc.stop(now + 0.4);
      });

      // 3. Scharfer Zünd-Oberton
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = "square";
      ping.frequency.setValueAtTime(580, now);
      ping.frequency.exponentialRampToValueAtTime(1420, now + 0.1);
      pingGain.gain.setValueAtTime(0.09, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      ping.connect(pingGain);
      pingGain.connect(out);
      ping.start(now);
      ping.stop(now + 0.15);
    }

    playShieldActivate(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.32);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.37);
    }

    playPulseArm(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 1.35);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 1.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 1.42);
    }

    playPulseDetonate(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.42);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now);
      osc.stop(now + 0.48);

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + 0.38);
        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(0.28, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        src.connect(filter);
        filter.connect(nGain);
        nGain.connect(out);
        src.start(now);
        src.stop(now + 0.42);
      }
    }

    playShardOpen(pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);
      [659.25, 987.77, 1318.5].forEach((f, i) => {
        const t = now + i * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.27);
      });
    }

    playHazard(type, pan) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const out = this.createPanner(pan);

      if (type === "water") {
        if (this.noiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(950, now);
          filter.frequency.exponentialRampToValueAtTime(220, now + 0.25);
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(out);
          src.start(now);
          src.stop(now + 0.28);
        }

        const bubbles = [
          { delay: 0.03, f0: 190, f1: 480, dur: 0.085, vol: 0.22 },
          { delay: 0.12, f0: 250, f1: 620, dur: 0.075, vol: 0.20 },
          { delay: 0.21, f0: 210, f1: 540, dur: 0.095, vol: 0.19 },
          { delay: 0.32, f0: 290, f1: 710, dur: 0.080, vol: 0.16 },
          { delay: 0.43, f0: 340, f1: 820, dur: 0.090, vol: 0.12 },
          { delay: 0.55, f0: 410, f1: 920, dur: 0.085, vol: 0.08 }
        ];
        bubbles.forEach((b) => {
          const t = now + b.delay;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(b.f0, t);
          osc.frequency.exponentialRampToValueAtTime(b.f1, t + b.dur);
          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(b.vol, t + b.dur * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, t + b.dur);
          osc.connect(gain);
          gain.connect(out);
          osc.start(t);
          osc.stop(t + b.dur + 0.02);
        });
      } else if (type === "ruby") {
        if (this.noiseBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(620, now);
          filter.frequency.exponentialRampToValueAtTime(140, now + 0.42);
          filter.Q.value = 1.8;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
          src.connect(filter);
          filter.connect(gain);
          gain.connect(out);
          src.start(now);
          src.stop(now + 0.46);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.48);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + 0.52);
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.58);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(out);
        osc.start(now);
        osc.stop(now + 0.62);
      }
    }

    playLevelWin() {
      this.playJingle("win", () => this.playLevelWinSynth());
    }

    playLevelWinSynth() {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, t: 0.00, d: 0.65, v: 0.16 },
        { f: 659.25, t: 0.09, d: 0.65, v: 0.16 },
        { f: 783.99, t: 0.18, d: 0.70, v: 0.17 },
        { f: 987.77, t: 0.27, d: 0.80, v: 0.16 },
        { f: 1174.66, t: 0.37, d: 0.90, v: 0.15 },
        { f: 1318.51, t: 0.48, d: 1.25, v: 0.18 }
      ];
      melody.forEach((n) => {
        const start = now + n.t;
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(n.f, start);
        g1.gain.setValueAtTime(0.001, start);
        g1.gain.linearRampToValueAtTime(n.v, start + 0.02);
        g1.gain.exponentialRampToValueAtTime(0.001, start + n.d);
        osc1.connect(g1);
        g1.connect(this.ctx.destination);
        osc1.start(start);
        osc1.stop(start + n.d + 0.04);

        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(n.f * 2, start);
        g2.gain.setValueAtTime(0.001, start);
        g2.gain.linearRampToValueAtTime(n.v * 0.25, start + 0.03);
        g2.gain.exponentialRampToValueAtTime(0.001, start + n.d * 0.75);
        osc2.connect(g2);
        g2.connect(this.ctx.destination);
        osc2.start(start);
        osc2.stop(start + n.d);
      });
    }

    playGameOver() {
      this.playJingle("lost", () => this.playGameOverSynth());
    }

    playGameOverSynth() {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [
        { f: 392.00, t: 0.00, d: 0.45, v: 0.16 },
        { f: 349.23, t: 0.18, d: 0.45, v: 0.15 },
        { f: 311.13, t: 0.36, d: 0.55, v: 0.15 },
        { f: 261.63, t: 0.56, d: 1.05, v: 0.18 }
      ];
      notes.forEach((n) => {
        const start = now + n.t;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, start);
        osc.frequency.exponentialRampToValueAtTime(n.f * 0.985, start + n.d);
        filter.type = "lowpass";
        filter.frequency.value = 900;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(n.v, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + n.d + 0.05);
      });
    }
  }

  window.ETHER.SoundEngine = SoundEngine;
})();