import Database from 'better-sqlite3';
import fs from 'fs';

// Create data directory if it doesn't exist
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

// Initialize database connection
const db = new Database('./data/app.db');

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  db.close();
  process.exit(0);
}

// Helper function to generate random time offset within a day
function getRandomTimeInDay(baseDate, hourRange = { min: 8, max: 22 }) {
  const date = new Date(baseDate);
  const hour = Math.floor(Math.random() * (hourRange.max - hourRange.min)) + hourRange.min;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  date.setHours(hour, minute, second, 0);
  return date;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to format datetime for SQLite
function formatDateTime(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Generate realistic session data
const sessions = [];
const dailyStatsMap = new Map();

// Define activity patterns - some days are more productive than others
const activityPattern = [
  { daysAgo: 0, sessions: 3, workMinutes: [25, 25, 20] },      // Today
  { daysAgo: 1, sessions: 5, workMinutes: [25, 30, 25, 25, 20] }, // Yesterday (productive)
  { daysAgo: 2, sessions: 2, workMinutes: [25, 25] },          // 2 days ago
  { daysAgo: 3, sessions: 0 },                                  // Rest day
  { daysAgo: 4, sessions: 4, workMinutes: [25, 25, 30, 25] },  // 4 days ago
  { daysAgo: 5, sessions: 6, workMinutes: [25, 25, 25, 25, 30, 25] }, // Very productive
  { daysAgo: 6, sessions: 3, workMinutes: [20, 25, 25] },      // 6 days ago
  { daysAgo: 7, sessions: 1, workMinutes: [25] },              // 7 days ago
  { daysAgo: 8, sessions: 4, workMinutes: [25, 25, 25, 20] },  // 8 days ago
  { daysAgo: 9, sessions: 0 },                                  // Rest day
  { daysAgo: 10, sessions: 5, workMinutes: [30, 25, 25, 25, 25] }, // 10 days ago
  { daysAgo: 11, sessions: 3, workMinutes: [25, 20, 25] },     // 11 days ago
  { daysAgo: 12, sessions: 2, workMinutes: [25, 25] },         // 12 days ago
  { daysAgo: 13, sessions: 0 },                                 // Rest day
  { daysAgo: 14, sessions: 4, workMinutes: [25, 25, 25, 30] }, // 14 days ago
  { daysAgo: 15, sessions: 6, workMinutes: [25, 25, 25, 25, 25, 25] }, // Very productive
  { daysAgo: 16, sessions: 3, workMinutes: [20, 25, 25] },     // 16 days ago
  { daysAgo: 17, sessions: 1, workMinutes: [25] },             // 17 days ago
  { daysAgo: 18, sessions: 0 },                                 // Rest day
  { daysAgo: 19, sessions: 4, workMinutes: [25, 30, 25, 25] }, // 19 days ago
  { daysAgo: 20, sessions: 5, workMinutes: [25, 25, 25, 20, 25] }, // 20 days ago
  { daysAgo: 21, sessions: 2, workMinutes: [25, 25] },         // 21 days ago
  { daysAgo: 22, sessions: 3, workMinutes: [25, 25, 30] },     // 22 days ago
  { daysAgo: 23, sessions: 0 },                                 // Rest day
  { daysAgo: 24, sessions: 4, workMinutes: [25, 25, 25, 25] }, // 24 days ago
  { daysAgo: 25, sessions: 2, workMinutes: [20, 25] },         // 25 days ago
  { daysAgo: 26, sessions: 3, workMinutes: [25, 25, 25] },     // 26 days ago
  { daysAgo: 27, sessions: 1, workMinutes: [25] },             // 27 days ago
  { daysAgo: 28, sessions: 0 },                                 // Rest day
  { daysAgo: 29, sessions: 3, workMinutes: [25, 30, 25] },     // 29 days ago
];

// Generate sessions based on activity pattern
activityPattern.forEach(day => {
  if (day.sessions === 0) return;
  
  const baseDate = new Date(Date.now() - day.daysAgo * 86400000);
  const dateStr = formatDate(baseDate);
  
  let workCount = 0;
  let totalFocusMinutes = 0;
  let breaksTaken = 0;
  
  // Create sessions for this day
  for (let i = 0; i < day.sessions; i++) {
    const workDuration = day.workMinutes[i] || 25;
    const sessionTime = getRandomTimeInDay(baseDate);
    
    // Add work session
    sessions.push({
      type: 'work',
      duration_minutes: workDuration,
      completed_at: formatDateTime(sessionTime),
      created_at: formatDateTime(sessionTime)
    });
    
    workCount++;
    totalFocusMinutes += workDuration;
    
    // After every 4 work sessions, add a long break
    // Otherwise, add a short break after each work session (but not the last one of the day)
    if ((i + 1) % 4 === 0 && i < day.sessions - 1) {
      const breakTime = new Date(sessionTime.getTime() + workDuration * 60000 + 60000);
      sessions.push({
        type: 'long_break',
        duration_minutes: 15,
        completed_at: formatDateTime(breakTime),
        created_at: formatDateTime(breakTime)
      });
      breaksTaken++;
    } else if (i < day.sessions - 1 && Math.random() > 0.3) {
      // 70% chance of taking a short break between sessions
      const breakTime = new Date(sessionTime.getTime() + workDuration * 60000 + 60000);
      sessions.push({
        type: 'short_break',
        duration_minutes: 5,
        completed_at: formatDateTime(breakTime),
        created_at: formatDateTime(breakTime)
      });
      breaksTaken++;
    }
  }
  
  // Store daily stats
  dailyStatsMap.set(dateStr, {
    date: dateStr,
    work_sessions: workCount,
    total_focus_minutes: totalFocusMinutes,
    breaks_taken: breaksTaken,
    streak_day: 1
  });
});

// Sort sessions by completed_at
sessions.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));

// Insert all data in a transaction
const insertAll = db.transaction(() => {
  // Insert settings
  const insertSettings = db.prepare(`
    INSERT INTO settings (
      work_duration,
      short_break_duration,
      long_break_duration,
      sessions_until_long_break,
      sound_enabled,
      notifications_enabled
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSettings.run(25, 5, 15, 4, 1, 1);
  
  // Insert sessions
  const insertSession = db.prepare(`
    INSERT INTO sessions (type, duration_minutes, completed_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  sessions.forEach(session => {
    insertSession.run(
      session.type,
      session.duration_minutes,
      session.completed_at,
      session.created_at
    );
  });
  
  // Insert daily stats
  const insertDailyStats = db.prepare(`
    INSERT INTO daily_stats (date, work_sessions, total_focus_minutes, breaks_taken, streak_day)
    VALUES (?, ?, ?, ?, ?)
  `);
  dailyStatsMap.forEach(stats => {
    insertDailyStats.run(
      stats.date,
      stats.work_sessions,
      stats.total_focus_minutes,
      stats.breaks_taken,
      stats.streak_day
    );
  });
});

insertAll();

// Get final counts
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
const dailyStatsCount = db.prepare('SELECT COUNT(*) as count FROM daily_stats').get();
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();

console.log('FocusFlow database seeded successfully!');
console.log(`Seeded: ${sessionCount.count} sessions, ${dailyStatsCount.count} daily stats, ${settingsCount.count} settings`);
console.log('\nUsage patterns:');
console.log('- 30 days of realistic Pomodoro usage');
console.log('- Mix of productive days and rest days');
console.log('- Work sessions: 20-30 minutes');
console.log('- Short breaks: 5 minutes');
console.log('- Long breaks: 15 minutes (after every 4 work sessions)');
console.log('- Streak tracking enabled for days with completed work sessions');

db.close();