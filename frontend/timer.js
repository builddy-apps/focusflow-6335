const { AppState, API, Keyboard, Toast } = window.FocusFlow;

window.FocusFlow.Timer = {
  rafId: null,
  startTime: null,
  pausedTime: 0,
  elapsed: 0,
  totalTime: 1500,
  status: 'idle',
  sessionStartedAt: null,
  ringCircumference: 565.48,

  init() {
    this.bindKeyboard();
    AppState.subscribe('timerMode', () => this.handleModeChange());
    AppState.subscribe('workDuration', () => this.handleModeChange());
    AppState.subscribe('breakDuration', () => this.handleModeChange());
    this.handleModeChange();
  },

  bindKeyboard() {
    Keyboard.register(' ', () => this.toggle(), 'Start/Pause timer');
    Keyboard.register('r', () => this.reset(), 'Reset timer');
    Keyboard.register('s', () => this.skip(), 'Skip to next');
  },

  handleModeChange() {
    const mode = AppState.get('timerMode');
    const mins = mode === 'work' ? AppState.get('workDuration') : AppState.get('breakDuration');
    this.totalTime = mins * 60;
    this.reset(false);
  },

  toggle() {
    if (this.status === 'running') this.pause();
    else this.start();
  },

  start() {
    if (this.status === 'idle') {
      this.sessionStartedAt = new Date().toISOString();
      this.pausedTime = 0;
    }
    this.status = 'running';
    this.startTime = Date.now() - this.pausedTime;
    this.tick();
    this.updateControls();
    document.getElementById('timer-container').classList.add('timer-running');
  },

  pause() {
    this.status = 'paused';
    cancelAnimationFrame(this.rafId);
    this.pausedTime = Date.now() - this.startTime;
    this.updateControls();
    document.getElementById('timer-container').classList.remove('timer-running');
  },

  reset(savePartial = true) {
    if (savePartial && (this.status === 'running' || this.status === 'paused') && this.elapsed > 0) {
      this.saveSession(false);
    }
    cancelAnimationFrame(this.rafId);
    this.status = 'idle';
    this.elapsed = 0;
    this.pausedTime = 0;
    this.startTime = null;
    this.sessionStartedAt = null;
    this.updateUI();
    this.updateControls();
    document.getElementById('timer-container').classList.remove('timer-running');
  },

  skip() {
    if (this.status === 'idle') {
      this.switchMode();
      return;
    }
    
    if (this.status === 'running') this.pause();
    this.saveSession(false);
    this.switchMode();
    
    // Auto-start next session
    setTimeout(() => {
      this.reset(false);
      this.start();
    }, 500);
  },

  tick() {
    const now = Date.now();
    this.elapsed = now - this.startTime;

    if (this.elapsed >= this.totalTime) {
      this.complete();
      return;
    }

    this.updateUI();
    this.rafId = requestAnimationFrame(() => this.tick());
  },

  complete() {
    cancelAnimationFrame(this.rafId);
    this.status = 'idle';
    this.elapsed = this.totalTime;
    this.pausedTime = 0;
    this.updateUI();
    this.updateControls();
    document.getElementById('timer-container').classList.remove('timer-running');
    
    this.saveSession(true);
    this.triggerPulse();
    this.playSound();
    Toast.success(`${AppState.get('timerMode') === 'work' ? 'Focus' : 'Break'} session complete!`);
    
    setTimeout(() => {
      this.switchMode();
      this.reset(false);
    }, 2000);
  },

  async saveSession(completed) {
    const type = AppState.get('timerMode');
    const actual = Math.round(this.elapsed || 0);
    if (actual < 1) return;

    await API.sessions.create({
      type,
      duration_planned: this.totalTime,
      duration_actual: actual,
      completed,
      started_at: this.sessionStartedAt,
      completed_at: completed ? new Date().toISOString() : null
    });
  },

  switchMode() {
    const next = AppState.get('timerMode') === 'work' ? 'break' : 'work';
    AppState.set('timerMode', next);
  },

  updateUI() {
    const remaining = Math.max(0, this.totalTime - this.elapsed);
    const totalSec = Math.ceil(remaining);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;

    document.getElementById('time-display').textContent = 
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    const progress = remaining / this.totalTime;
    const offset = this.ringCircumference - (progress * this.ringCircumference);
    const ring = document.getElementById('progress-ring');
    ring.style.strokeDashoffset = offset;

    const mode = AppState.get('timerMode');
    const color = mode === 'work' ? '#E8725C' : '#5CC5E8';
    ring.style.color = color;

    document.getElementById('mode-label').textContent = mode === 'work' ? 'Focus Time' : 'Break Time';

    const btnWork = document.getElementById('btn-work');
    const btnBreak = document.getElementById('btn-break');
    
    if (mode === 'work') {
      btnWork.className = 'px-5 py-2.5 rounded-xl font-semibold text-white bg-primary shadow-lg shadow-primary/30 transition-all';
      btnBreak.className = 'px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
    } else {
      btnWork.className = 'px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
      btnBreak.className = 'px-5 py-2.5 rounded-xl font-semibold text-white bg-accent shadow-lg shadow-accent/30 transition-all';
    }
  },

  updateControls() {
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    
    if (this.status === 'running') {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
    } else {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
    }
  },

  triggerPulse() {
    const ring = document.getElementById('progress-ring');
    ring.classList.add('animate-pulse-ring');
    setTimeout(() => ring.classList.remove('animate-pulse-ring'), 2000);
  },

  playSound() {
    const Sounds = window.FocusFlow.Sounds;
    if (Sounds && Sounds.playNotification) {
      Sounds.playNotification(AppState.get('timerMode') === 'work' ? 'work-end' : 'break-end');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.FocusFlow?.AppState) {
    window.FocusFlow.Timer.init();
  }
});