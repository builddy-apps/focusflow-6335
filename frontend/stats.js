// Initialize variables for infinite scroll
let sessionsOffset = 0;
const sessionsLimit = 20;
let isLoadingMore = false;
let hasMoreSessions = true;

// DOM elements
const todaySessionsEl = document.getElementById('todaySessions');
const totalFocusTimeEl = document.getElementById('totalFocusTime');
const currentStreakEl = document.getElementById('currentStreak');
const weeklyChartEl = document.getElementById('weeklyChart');
const chartLoadingEl = document.getElementById('chartLoading');
const sessionHistoryEl = document.getElementById('sessionHistory');
const emptyStateEl = document.getElementById('emptyState');
const historyLoadingEl = document.getElementById('historyLoading');
const loadMoreContainerEl = document.getElementById('loadMoreContainer');
const loadMoreBtnEl = document.getElementById('loadMoreBtn');

// Format timestamp to relative time
function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// Format session type with badge
function formatSessionType(type) {
  const typeMap = {
    'work': { text: 'Work', class: 'bg-work-100 text-work-800 dark:bg-work-900/30 dark:text-work-300' },
    'short_break': { text: 'Short Break', class: 'bg-break-100 text-break-800 dark:bg-break-900/30 dark:text-break-300' },
    'long_break': { text: 'Long Break', class: 'bg-longBreak-100 text-longBreak-800 dark:bg-longBreak-900/30 dark:text-longBreak-300' }
  };
  
  const config = typeMap[type] || { text: type, class: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
  
  return `<span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">${config.text}</span>`;
}

// Render session history
function renderSessionHistory(sessions) {
  if (sessions.length === 0) {
    emptyStateEl.classList.remove('hidden');
    historyLoadingEl.classList.add('hidden');
    return;
  }
  
  emptyStateEl.classList.add('hidden');
  historyLoadingEl.classList.add('hidden');
  
  sessions.forEach(session => {
    const sessionEl = document.createElement('div');
    sessionEl.className = 'flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-fade-in';
    sessionEl.innerHTML = `
      <div class="flex items-center space-x-3">
        ${formatSessionType(session.type)}
        <div>
          <p class="font-medium text-slate-900 dark:text-slate-100">${session.duration_minutes} min</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">${formatRelativeTime(session.completed_at)}</p>
        </div>
      </div>
      <div class="text-slate-500 dark:text-slate-400">
        ${new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    `;
    sessionHistoryEl.appendChild(sessionEl);
  });
}

// Load more sessions
async function loadMoreSessions() {
  if (isLoadingMore || !hasMoreSessions) return;
  
  isLoadingMore = true;
  loadMoreBtnEl.textContent = 'Loading...';
  
  try {
    const response = await fetch(`/api/sessions?limit=${sessionsLimit}&offset=${sessionsOffset}`);
    if (!response.ok) throw new Error('Failed to load sessions');
    
    const data = await response.json();
    if (data.success) {
      if (data.data.length > 0) {
        renderSessionHistory(data.data);
        sessionsOffset += sessionsLimit;
      } else {
        hasMoreSessions = false;
        loadMoreContainerEl.classList.add('hidden');
      }
    } else {
      throw new Error(data.error || 'Failed to load sessions');
    }
  } catch (error) {
    console.error('Error loading more sessions:', error);
    showToast('Error loading more sessions', 'error');
  } finally {
    isLoadingMore = false;
    loadMoreBtnEl.textContent = 'Load More';
  }
}

// Load initial session history
async function loadSessionHistory() {
  historyLoadingEl.classList.remove('hidden');
  sessionHistoryEl.innerHTML = '';
  sessionsOffset = 0;
  hasMoreSessions = true;
  
  try {
    const response = await fetch(`/api/sessions?limit=${sessionsLimit}`);
    if (!response.ok) throw new Error('Failed to load sessions');
    
    const data = await response.json();
    if (data.success) {
      renderSessionHistory(data.data);
      sessionsOffset += sessionsLimit;
      
      // Show load more button if there might be more sessions
      if (data.data.length === sessionsLimit) {
        loadMoreContainerEl.classList.remove('hidden');
      } else {
        hasMoreSessions = false;
      }
    } else {
      throw new Error(data.error || 'Failed to load sessions');
    }
  } catch (error) {
    console.error('Error loading session history:', error);
    showToast('Error loading session history', 'error');
    emptyStateEl.classList.add('hidden');
    historyLoadingEl.classList.add('hidden');
  }
}

// Calculate and display current streak
function calculateStreak(dailyStats) {
  if (!dailyStats || dailyStats.length === 0) return 0;
  
  // Sort by date descending
  const sortedStats = [...dailyStats].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if today has any work sessions
  const todayStat = sortedStats.find(stat => {
    const statDate = new Date(stat.date);
    return statDate.getTime() === today.getTime();
  });
  
  if (todayStat && todayStat.work_sessions > 0) {
    streak++;
  } else {
    // If today doesn't have sessions, check if yesterday was a streak day
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayStat = sortedStats.find(stat => {
      const statDate = new Date(stat.date);
      return statDate.getTime() === yesterday.getTime();
    });
    
    if (!yesterdayStat || !yesterdayStat.streak_day) {
      return 0; // Streak is broken
    }
  }
  
  // Count consecutive streak days
  for (let i = 0; i < sortedStats.length; i++) {
    const stat = sortedStats[i];
    const statDate = new Date(stat.date);
    
    // If it's today and we already counted it, skip
    if (statDate.getTime() === today.getTime() && todayStat && todayStat.work_sessions > 0) {
      continue;
    }
    
    // Check if this date is consecutive to the previous one
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - (streak + (todayStat && todayStat.work_sessions > 0 ? 0 : 1)));
    
    if (statDate.getTime() === expectedDate.getTime() && stat.streak_day) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Draw weekly bar chart
function drawWeeklyChart(weeklyData) {
  const canvas = weeklyChartEl;
  const ctx = canvas.getContext('2d');
  
  // Hide loading indicator
  chartLoadingEl.classList.add('hidden');
  
  // Set canvas dimensions
  const containerWidth = canvas.parentElement.clientWidth;
  canvas.width = containerWidth;
  canvas.height = canvas.parentElement.clientHeight;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!weeklyData || weeklyData.length === 0) {
    // No data to display
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data for the past week', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Sort by date
  const sortedData = [...weeklyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Get max value for scaling
  const maxValue = Math.max(...sortedData.map(day => day.total_focus_minutes), 1);
  
  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = canvas.width - margin.left - margin.right;
  const chartHeight = canvas.height - margin.top - margin.bottom;
  const barWidth = chartWidth / sortedData.length * 0.6;
  const barSpacing = chartWidth / sortedData.length * 0.4;
  
  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Draw bars and labels
  sortedData.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    const barHeight = (day.total_focus_minutes / maxValue) * chartHeight;
    const x = margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
    const y = margin.top + chartHeight - barHeight;
    
    // Draw bar
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#fb7185' : '#f43f5e';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Draw day label
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#475569';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dayLabels[dayOfWeek], x + barWidth / 2, canvas.height - 10);
    
    // Draw value label if there's space
    if (barHeight > 20) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${day.total_focus_minutes}m`, x + barWidth / 2, y + 15);
    }
  });
  
  // Draw axis
  ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(canvas.width - margin.right, margin.top + chartHeight);
  ctx.stroke();
}

// Load daily stats
async function loadDailyStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`/api/stats/daily?date=${today}`);
    if (!response.ok) throw new Error('Failed to load daily stats');
    
    const data = await response.json();
    if (data.success && data.data) {
      todaySessionsEl.textContent = data.data.work_sessions || 0;
      totalFocusTimeEl.textContent = `${data.data.total_focus_minutes || 0} min`;
    } else {
      throw new Error(data.error || 'Failed to load daily stats');
    }
  } catch (error) {
    console.error('Error loading daily stats:', error);
    showToast('Error loading daily stats', 'error');
  }
}

// Load weekly stats
async function loadWeeklyStats() {
  try {
    const response = await fetch('/api/stats/weekly');
    if (!response.ok) throw new Error('Failed to load weekly stats');
    
    const data = await response.json();
    if (data.success) {
      drawWeeklyChart(data.data);
      
      // Calculate and display streak
      const streak = calculateStreak(data.data);
      currentStreakEl.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    } else {
      throw new Error(data.error || 'Failed to load weekly stats');
    }
  } catch (error) {
    console.error('Error loading weekly stats:', error);
    showToast('Error loading weekly stats', 'error');
    chartLoadingEl.classList.add('hidden');
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white animate-slide-up z-50 ${
    type === 'error' ? 'bg-red-500' : 'bg-primary-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Handle window resize for chart
function handleResize() {
  // Redraw chart on resize
  fetch('/api/stats/weekly')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load weekly stats');
      return response.json();
    })
    .then(data => {
      if (data.success) {
        drawWeeklyChart(data.data);
      }
    })
    .catch(error => {
      console.error('Error redrawing chart on resize:', error);
    });
}

// Initialize stats page
document.addEventListener('DOMContentLoaded', async () => {
  // Load all data
  await Promise.all([
    loadDailyStats(),
    loadWeeklyStats(),
    loadSessionHistory()
  ]);
  
  // Set up event listeners
  loadMoreBtnEl.addEventListener('click', loadMoreSessions);
  window.addEventListener('resize', handleResize);
  
  // Set up infinite scroll
  const scrollContainer = document.querySelector('main');
  scrollContainer.addEventListener('scroll', () => {
    if (
      scrollContainer.scrollTop + scrollContainer.clientHeight >= 
      scrollContainer.scrollHeight - 100 &&
      !isLoadingMore &&
      hasMoreSessions
    ) {
      loadMoreSessions();
    }
  });
});