class PomodoroTimer {
  constructor() {
    this.modes = {
      WORK: 'work',
      SHORT_BREAK: 'short_break',
      LONG_BREAK: 'long_break'
    };
    
    this.defaultSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      soundEnabled: true,
      notificationsEnabled: true
    };
    
    this.settings = { ...this.defaultSettings };
    this.currentMode = this.modes.WORK;
    this.sessionsCompleted = 0;
    this.timeRemaining = this.settings.workDuration * 60; // in seconds
    this.isRunning = false;
    this.intervalId = null;
    this.lastTimestamp = null;
    
    // DOM elements
    this.timerDisplay = document.getElementById('timer-display');
    this.progressRing = document.getElementById('progress-ring');
    this.sessionCounter = document.getElementById('session-counter');
    this.modeIndicator = document.getElementById('mode-indicator');
    this.playPauseBtn = document.getElementById('play-pause-btn');
    this.playIcon = document.getElementById('play-icon');
    this.pauseIcon = document.getElementById('pause-icon');
    this.appBody = document.getElementById('app-body');
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Load settings from server
    await this.loadSettings();
    
    // Set initial UI
    this.updateDisplay();
    this.updateProgressRing();
    this.updateSessionCounter();
    this.updateModeIndicator();
    this.updateBackground();
    
    // Request notification permission
    if (this.settings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    
    // Set up audio context for chime
    this.setupAudio();
  }
  
  async loadSettings() {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const data = await response.json();
      if (data.success && data.data) {
        this.settings = {
          workDuration: data.data.work_duration,
          shortBreakDuration: data.data.short_break_duration,
          longBreakDuration: data.data.long_break_duration,
          sessionsUntilLongBreak: data.data.sessions_until_long_break,
          soundEnabled: data.data.sound_enabled,
          notificationsEnabled: data.data.notifications_enabled
        };
        
        // Update settings form
        document.getElementById('work-duration').value = this.settings.workDuration;
        document.getElementById('short-break-duration').value = this.settings.shortBreakDuration;
        document.getElementById('long-break-duration').value = this.settings.longBreakDuration;
        document.getElementById('sessions-until-long-break').value = this.settings.sessionsUntilLongBreak;
        
        // Reset timer with new settings
        this.resetTimer(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings. Using defaults.');
    }
  }
  
  async saveSettings() {
    const newSettings = {
      workDuration: parseInt(document.getElementById('work-duration').value),
      shortBreakDuration: parseInt(document.getElementById('short-break-duration').value),
      longBreakDuration: parseInt(document.getElementById('long-break-duration').value),
      sessionsUntilLongBreak: parseInt(document.getElementById('sessions-until-long-break').value),
      soundEnabled: this.settings.soundEnabled,
      notificationsEnabled: this.settings.notificationsEnabled
    };
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          work_duration: newSettings.workDuration,
          short_break_duration: newSettings.shortBreakDuration,
          long_break_duration: newSettings.longBreakDuration,
          sessions_until_long_break: newSettings.sessionsUntilLongBreak,
          sound_enabled: newSettings.soundEnabled,
          notifications_enabled: newSettings.notificationsEnabled
        })
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      const data = await response.json();
      if (data.success) {
        this.settings = newSettings;
        this.resetTimer(false);
        closeSettings();
        showToast('Settings saved successfully');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings');
    }
  }
  
  setupAudio() {
    // Create a simple chime sound using Web Audio API
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  playChime() {
    if (!this.settings.soundEnabled) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
      oscillator.stop(this.audioContext.currentTime + 1);
    } catch (error) {
      console.error('Error playing chime:', error);
    }
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.playIcon.classList.add('hidden');
    this.pauseIcon.classList.remove('hidden');
    
    // Use requestAnimationFrame for smooth animation
    this.tick();
  }
  
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.playIcon.classList.remove('hidden');
    this.pauseIcon.classList.add('hidden');
    
    if (this.intervalId) {
      cancelAnimationFrame(this.intervalId);
      this.intervalId = null;
    }
  }
  
  tick() {
    if (!this.isRunning) return;
    
    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000; // in seconds
    this.lastTimestamp = now;
    
    this.timeRemaining = Math.max(0, this.timeRemaining - delta);
    this.updateDisplay();
    this.updateProgressRing();
    this.updateDocumentTitle();
    
    if (this.timeRemaining <= 0) {
      this.completeSession();
    } else {
      this.intervalId = requestAnimationFrame(() => this.tick());
    }
  }
  
  completeSession() {
    this.pause();
    
    // Play chime
    this.playChime();
    
    // Show notification
    if (this.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const title = this.currentMode === this.modes.WORK ? 'Work session completed!' : 'Break completed!';
      const body = this.currentMode === this.modes.WORK ? 
        'Time for a break.' : 
        'Back to work!';
      
      new Notification(title, { body });
    }
    
    // Save session to database
    this.saveSession();
    
    // Transition to next mode
    if (this.currentMode === this.modes.WORK) {
      this.sessionsCompleted++;
      this.updateSessionCounter();
      
      // Determine break type
      if (this.sessionsCompleted % this.settings.sessionsUntilLongBreak === 0) {
        this.switchMode(this.modes.LONG_BREAK);
      } else {
        this.switchMode(this.modes.SHORT_BREAK);
      }
    } else {
      // Break is over, go back to work
      this.switchMode(this.modes.WORK);
    }
    
    showToast(
      this.currentMode === this.modes.WORK ? 
      'Break completed! Ready for work?' : 
      'Great work! Time for a break.'
    );
  }
  
  async saveSession() {
    try {
      const durationMinutes = this.getDurationForMode(this.currentMode);
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: this.currentMode,
          duration_minutes: durationMinutes
        })
      });
      
      if (!response.ok) throw new Error('Failed to save session');
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('Failed to save session data');
    }
  }
  
  resetTimer(showConfirmation = true) {
    if (showConfirmation && this.isRunning) {
      if (!confirm('Are you sure you want to reset the timer?')) {
        return;
      }
    }
    
    this.pause();
    this.timeRemaining = this.getDurationForMode(this.currentMode) * 60;
    this.updateDisplay();
    this.updateProgressRing();
    this.updateDocumentTitle();
  }
  
  switchMode(mode) {
    this.currentMode = mode;
    this.timeRemaining = this.getDurationForMode(mode) * 60;
    this.updateDisplay();
    this.updateProgressRing();
    this.updateModeIndicator();
    this.updateBackground();
    this.updateDocumentTitle();
  }
  
  getDurationForMode(mode) {
    switch (mode) {
      case this.modes.WORK:
        return this.settings.workDuration;
      case this.modes.SHORT_BREAK:
        return this.settings.shortBreakDuration;
      case this.modes.LONG_BREAK:
        return this.settings.longBreakDuration;
      default:
        return this.settings.workDuration;
    }
  }
  
  updateDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = Math.floor(this.timeRemaining % 60);
    this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateProgressRing() {
    const totalTime = this.getDurationForMode(this.currentMode) * 60;
    const percentage = this.timeRemaining / totalTime;
    const circumference = 2 * Math.PI * 70; // radius is 70
    const offset = circumference * (1 - percentage);
    
    this.progressRing.style.strokeDashoffset = offset;
    
    // Update color based on mode
    switch (this.currentMode) {
      case this.modes.WORK:
        this.progressRing.setAttribute('stroke', '#f43f5e'); // work-500
        break;
      case this.modes.SHORT_BREAK:
        this.progressRing.setAttribute('stroke', '#22c55e'); // break-500
        break;
      case this.modes.LONG_BREAK:
        this.progressRing.setAttribute('stroke', '#3b82f6'); // longBreak-500
        break;
    }
  }
  
  updateSessionCounter() {
    const sessionsUntilLong = this.settings.sessionsUntilLongBreak;
    const currentInCycle = (this.sessionsCompleted % sessionsUntilLong) || sessionsUntilLong;
    this.sessionCounter.textContent = `${currentInCycle}/${sessionsUntilLong}`;
  }
  
  updateModeIndicator() {
    let text, className;
    
    switch (this.currentMode) {
      case this.modes.WORK:
        text = 'Work';
        className = 'bg-work-500 text-white';
        break;
      case this.modes.SHORT_BREAK:
        text = 'Short Break';
        className = 'bg-break-500 text-white';
        break;
      case this.modes.LONG_BREAK:
        text = 'Long Break';
        className = 'bg-longBreak-500 text-white';
        break;
    }
    
    this.modeIndicator.textContent = text;
    this.modeIndicator.className = `px-3 py-1 text-sm font-semibold rounded-full ${className}`;
  }
  
  updateBackground() {
    // Remove all mode classes
    this.appBody.classList.remove('bg-work-mode', 'bg-break-mode', 'bg-long-break-mode');
    
    // Add current mode class
    switch (this.currentMode) {
      case this.modes.WORK:
        this.appBody.classList.add('bg-work-mode');
        break;
      case this.modes.SHORT_BREAK:
        this.appBody.classList.add('bg-break-mode');
        break;
      case this.modes.LONG_BREAK:
        this.appBody.classList.add('bg-long-break-mode');
        break;
    }
  }
  
  updateDocumentTitle() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = Math.floor(this.timeRemaining % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let modeText;
    switch (this.currentMode) {
      case this.modes.WORK:
        modeText = 'Work';
        break;
      case this.modes.SHORT_BREAK:
        modeText = 'Break';
        break;
      case this.modes.LONG_BREAK:
        modeText = 'Long Break';
        break;
    }
    
    document.title = `${timeStr} - ${modeText} | FocusFlow`;
  }
}

// Toast notification system
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  
  toastMsg.textContent = message;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Initialize timer when DOM is loaded
let timer;
document.addEventListener('DOMContentLoaded', () => {
  timer = new PomodoroTimer();
});

// Timer controls
function toggleTimer() {
  if (timer.isRunning) {
    timer.pause();
  } else {
    timer.start();
  }
}

function resetTimer() {
  timer.resetTimer();
}

function saveSettings() {
  timer.saveSettings();
}