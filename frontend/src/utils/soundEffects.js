// Web Audio API Sound Effects Engine (zero external audio asset dependencies)
class SoundEngine {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('wv_sound_effects') ?? localStorage.getItem('vms_sound_effects');
    this.enabled = saved !== 'false';
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    localStorage.setItem('wv_sound_effects', String(this.enabled));
  }

  isEnabled() {
    return this.enabled;
  }

  // Cute Popcorn Pop Sound for Reactions
  playPopcornSound() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 300 + Math.random() * 400; // randomized pitch
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      // ignore audio context restrictions
    }
  }

  // Soft Ping for Chat Messages
  playChatPing() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {
      // ignore
    }
  }

  // Welcoming Double Chime for Room Join
  playJoinSound() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 0.1 }
      ].forEach(({ f, t }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + t);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.35);
      });
    } catch (e) {
      // ignore
    }
  }
}

export const soundEffects = new SoundEngine();
export default soundEffects;
