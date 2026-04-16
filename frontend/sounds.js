const { AppState } = window.FocusFlow;

window.FocusFlow.Sounds = {
  ctx: null,
  masterGain: null,
  activeSource: null,
  activeFilter: null,
  activeType: null,
  volume: 0.5,
  isPlaying: false,
  fadeDuration: 0.5,

  init() {
    const saved = localStorage.getItem('ambientVolume');
    if (saved !== null) this.volume = Math.max(0, Math.min(1, parseFloat(saved)));
  },

  getContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  createNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  play(type) {
    this.getContext();

    if (this.isPlaying && this.activeType === type) {
      this.stop(true);
      return;
    }

    if (this.isPlaying) {
      this.stop(false);
    }

    this.activeType = type;
    this.isPlaying = true;

    const noiseBuffer = this.createNoiseBuffer();
    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = noiseBuffer;
    this.activeSource.loop = true;

    this.activeFilter = this.ctx.createBiquadFilter();

    if (type === 'rain') {
      this.activeFilter.type = 'lowpass';
      this.activeFilter.frequency.value = 600;
    } else if (type === 'cafe') {
      this.activeFilter.type = 'lowpass';
      this.activeFilter.frequency.value = 350;
    } else {
      this.activeFilter.type = 'allpass';
    }

    this.activeSource.connect(this.activeFilter);
    this.activeFilter.connect(this.masterGain);
    this.activeSource.start();

    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + this.fadeDuration);
  },

  stop(shouldResetType = true) {
    if (!this.isPlaying || !this.activeSource) return;

    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + this.fadeDuration);

    setTimeout(() => {
      if (this.activeSource) {
        try { this.activeSource.stop(); } catch(e) {}
        this.activeSource.disconnect();
        this.activeSource = null;
      }
      if (this.activeFilter) {
        this.activeFilter.disconnect();
        this.activeFilter = null;
      }
      if (shouldResetType) {
        this.isPlaying = false;
        this.activeType = null;
      }
    }, this.fadeDuration * 1000);
  },

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val)));
    localStorage.setItem('ambientVolume', this.volume);
    
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(this.isPlaying ? this.volume : 0, this.ctx.currentTime, 0.1);
    }
  },

  playNotification(type) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freqs = type === 'work' ? [523.25, 659.25, 783.99] : [392.00, 523.25];
    const duration = 0.15;
    const totalTime = freqs.length * duration;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + totalTime + 0.3);

    freqs.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + (i * duration));
    });

    osc.type = 'sine';
    osc.start(now);
    osc.stop(now + totalTime + 0.3);
  }
};