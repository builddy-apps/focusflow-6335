// FocusFlow Shared Client-Side Utilities

// Initialize the global FocusFlow object
window.FocusFlow = window.FocusFlow || {};

// Dark Mode Management
const DarkMode = {
  init() {
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'true' || (!stored && prefersDark);
    
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.transition = 'background-color 0.3s, color 0.3s';
  },
  
  toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    return isDark;
  },
  
  isDark() {
    return document.documentElement.classList.contains('dark');
  }
};

// API Helper Functions
const API = {
  baseUrl: '/api',
  
  async get(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      Toast.error(`Failed to fetch: ${err.message}`);
      return { success: false, error: err.message };
    }
  },
  
  async post(endpoint, data = {}) {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      Toast.error(`Failed to post: ${err.message}`);
      return { success: false, error: err.message };
    }
  },
  
  async exportCSV() {
    try {
      const res = await fetch(`${this.baseUrl}/sessions/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      
      // Get the filename from the response headers
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'focusflow_sessions.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a blob and download it
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true };
    } catch (err) {
      Toast.error(`Failed to export CSV: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
};

// Toast Notification System
const Toast = {
  container: null,
  
  init() {
    this.container = document.createElement('div');
    this.container.className = 'fixed bottom-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
  },
  
  show(message, type = 'info') {
    if (!this.container) this.init();
    
    const toast = document.createElement('div');
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type] || 'bg-gray-500';
    
    toast.className = `${bgColor} text-white px-4 py-2 rounded-md shadow-lg animate-fade-in`;
    toast.textContent = message;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      
      setTimeout(() => {
        if (this.container.contains(toast)) {
          this.container.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },
  
  success(message) {
    this.show(message, 'success');
  },
  
  error(message) {
    this.show(message, 'error');
  },
  
  info(message) {
    this.show(message, 'info');
  }
};

// App State Management
const AppState = {
  state: {},
  subscribers: {},
  
  init() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('focusflow_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        Object.keys(settings).forEach(key => {
          this.state[key] = settings[key];
        });
      } catch (err) {
        console.error('Failed to parse settings:', err);
      }
    }
    
    // Set defaults if not loaded
    this.state = {
      timerMode: this.state.timerMode || 'work',
      workDuration: this.state.workDuration || 25,
      breakDuration: this.state.breakDuration || 5,
      ambientSound: this.state.ambientSound || 'none',
      ambientVolume: this.state.ambientVolume || 0.5,
      notificationSound: this.state.notificationSound !== undefined ? this.state.notificationSound : true,
      ...this.state
    };
  },
  
  get(key) {
    return this.state[key];
  },
  
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Save to localStorage
    localStorage.setItem('focusflow_settings', JSON.stringify(this.state));
    
    // Notify subscribers
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => callback(value, oldValue));
    }
  },
  
  subscribe(key, callback) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[key] = this.subscribers[key].filter(cb => cb !== callback);
    };
  }
};

// Keyboard Shortcuts
const Keyboard = {
  shortcuts: {},
  helpOpen: false,
  
  init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  },
  
  register(key, callback, description) {
    this.shortcuts[key.toLowerCase()] = { callback, description };
  },
  
  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    // Ignore if typing in an input, textarea, or contenteditable
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable) {
      return;
    }
    
    if (this.shortcuts[key]) {
      e.preventDefault();
      this.shortcuts[key].callback();
    }
  },
  
  showShortcuts() {
    if (this.helpOpen) return;
    this.helpOpen = true;
    
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    overlay.onclick = () => {
      document.body.removeChild(overlay);
      this.helpOpen = false;
    };
    
    const modal = document.createElement('div');
    modal.className = 'bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in';
    modal.onclick = (e) => e.stopPropagation();
    
    const title = document.createElement('h2');
    title.className = 'text-xl font-bold mb-4 text-slate-900 dark:text-white';
    title.textContent = 'Keyboard Shortcuts';
    
    const list = document.createElement('ul');
    list.className = 'space-y-2';
    
    Object.entries(this.shortcuts).forEach(([key, { description }]) => {
      const item = document.createElement('li');
      item.className = 'flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700';
      
      const keyEl = document.createElement('kbd');
      keyEl.className = 'px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-800 dark:text-slate-200';
      keyEl.textContent = key;
      
      const descEl = document.createElement('span');
      descEl.className = 'text-slate-600 dark:text-slate-400';
      descEl.textContent = description;
      
      item.appendChild(keyEl);
      item.appendChild(descEl);
      list.appendChild(item);
    });
    
    const close = document.createElement('button');
    close.className = 'mt-4 w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors';
    close.textContent = 'Close';
    close.onclick = () => {
      document.body.removeChild(overlay);
      this.helpOpen = false;
    };
    
    modal.appendChild(title);
    modal.appendChild(list);
    modal.appendChild(close);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
};

// Date/Time Formatting Utilities
const DateTime = {
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },
  
  formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  },
  
  formatDateTime(date) {
    return date.toLocaleString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  getTodayRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  },
  
  getWeekRange(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(d.setDate(diff + 6));
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }
};

// Initialize all modules
function initApp() {
  DarkMode.init();
  AppState.init();
  Keyboard.init();
  Toast.init();
  
  // Export modules to global scope
  window.FocusFlow = {
    DarkMode,
    API,
    Toast,
    AppState,
    Keyboard,
    DateTime
  };
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
